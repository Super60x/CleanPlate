import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { extractTextFromImage, extractTextFromMultipleImages } from '../../services/vision';
import { analyzeMenu } from '../../services/claude';
import { enrichDishesWithNutrition } from '../../services/nutrition';
import { loadPreferences, saveScanResult } from '../../services/firestore';
import ScanButton from '../../components/ScanButton';
import MenuTextDisplay from '../../components/MenuTextDisplay';
import LoadingOverlay from '../../components/LoadingOverlay';
import { DishAnalysis } from '../../types';

type ScanMode = 'single' | 'multi';
type ScanState = 'pick' | 'preview' | 'multiCollect' | 'processing' | 'result' | 'analyzing' | 'enriching';

const MAX_PAGES = 10;

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium, isTrialing, isLoading: subLoading } = useSubscription();
  const [state, setState] = useState<ScanState>('pick');

  useEffect(() => {
    if (!subLoading && !isPremium && !isTrialing && user) {
      router.replace('/(main)/paywall');
    }
  }, [subLoading, isPremium, isTrialing, user]);
  const [scanMode, setScanMode] = useState<ScanMode>('single');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [menuText, setMenuText] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0 });

  // Naming modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [scanNameInput, setScanNameInput] = useState('');
  const pendingDishes = useRef<DishAnalysis[] | null>(null);

  const pickImage = async (useCamera: boolean) => {
    if (scanMode === 'multi' && !useCamera) {
      // Multi-mode gallery: allow multiple selection
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PAGES,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map(a => a.uri);
        setImageUris(prev => [...prev, ...newUris].slice(0, MAX_PAGES));
        setState('multiCollect');
      }
    } else if (scanMode === 'multi' && useCamera) {
      // Multi-mode camera: take one photo, add to collection
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUris(prev => [...prev, result.assets[0].uri].slice(0, MAX_PAGES));
        setState('multiCollect');
      }
    } else {
      // Single mode: unchanged behavior
      const launcher = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await launcher({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setState('preview');
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUris(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setState('pick');
      }
      return updated;
    });
  };

  const extractText = async () => {
    if (!imageUri) return;

    setState('processing');
    try {
      const text = await extractTextFromImage(imageUri);
      setMenuText(text);
      setState('result');
    } catch (error) {
      setState('preview');
      Alert.alert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Could not extract text from this image.',
      );
    }
  };

  const extractMultiplePages = async () => {
    if (imageUris.length === 0) return;

    setState('processing');
    setOcrProgress({ current: 0, total: imageUris.length });

    try {
      const { combinedText, results } = await extractTextFromMultipleImages(
        imageUris,
        (current, total) => setOcrProgress({ current, total })
      );

      // Report partial failures
      const failedPages = results.filter(r => r.text === null);
      if (failedPages.length > 0 && failedPages.length < results.length) {
        Alert.alert(
          'Partial Extraction',
          `Could not read ${failedPages.length} of ${results.length} pages. Continuing with the pages that were successfully read.`
        );
      }

      setMenuText(combinedText);
      setState('result');
    } catch (error) {
      setState('multiCollect');
      Alert.alert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Could not extract text. Try clearer photos.',
      );
    }
  };

  const analyzeWithAI = async () => {
    setState('analyzing');
    try {
      // Step 1: Load user preferences for personalized scoring
      const preferences = user ? await loadPreferences(user.id) : undefined;
      const dishes = await analyzeMenu(menuText, preferences);

      // Step 2: Enrich with USDA nutrition data
      setState('enriching');
      const enrichedDishes = await enrichDishesWithNutrition(dishes);

      // Step 3: Show naming modal before saving
      pendingDishes.current = enrichedDishes;
      setScanNameInput('');
      setShowNameModal(true);
    } catch (error) {
      setState('result');
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Could not analyze menu. Please try again.',
      );
    }
  };

  const completeScan = (name: string) => {
    const enrichedDishes = pendingDishes.current;
    if (!enrichedDishes) return;

    setShowNameModal(false);
    const scanName = name.trim() || 'Menu Scan';

    // Save to Firestore
    if (user) {
      saveScanResult(user.id, {
        restaurantName: scanName,
        menuText,
        dishes: enrichedDishes,
        timestamp: new Date(),
      }).catch(() => {
        // Non-blocking — don't fail the scan if save fails
      });
    }

    const currentImageUri = scanMode === 'single' ? imageUri : (imageUris[0] ?? null);
    router.push({
      pathname: '/results',
      params: {
        dishes: JSON.stringify(enrichedDishes),
        fromScan: 'true',
        ...(currentImageUri ? { imageUri: currentImageUri } : {}),
      },
    });

    // Reset state
    resetScan();
  };

  const resetScan = () => {
    setScanMode('single');
    setImageUri(null);
    setImageUris([]);
    setMenuText('');
    setOcrProgress({ current: 0, total: 0 });
    setState('pick');
    pendingDishes.current = null;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan Menu' }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Pick mode — choose mode and camera/gallery */}
        {state === 'pick' && (
          <View style={styles.pickContainer}>
            <Ionicons name="scan" size={80} color={Colors.primary} />
            <Text style={styles.title}>Scan a Restaurant Menu</Text>
            <Text style={styles.subtitle}>
              Take a photo or choose from your gallery
            </Text>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <Pressable
                style={[styles.modeButton, scanMode === 'single' && styles.modeButtonActive]}
                onPress={() => setScanMode('single')}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={scanMode === 'single' ? '#FFFFFF' : Colors.primary}
                />
                <Text style={[styles.modeText, scanMode === 'single' && styles.modeTextActive]}>
                  Single Page
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeButton, scanMode === 'multi' && styles.modeButtonActive]}
                onPress={() => setScanMode('multi')}
              >
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={scanMode === 'multi' ? '#FFFFFF' : Colors.primary}
                />
                <Text style={[styles.modeText, scanMode === 'multi' && styles.modeTextActive]}>
                  Multiple Pages
                </Text>
              </Pressable>
            </View>

            <View style={styles.buttonGroup}>
              <ScanButton
                icon="camera"
                label="Take Photo"
                onPress={() => pickImage(true)}
              />
              <ScanButton
                icon="images-outline"
                label="Choose from Gallery"
                variant="secondary"
                onPress={() => pickImage(false)}
              />
            </View>
          </View>
        )}

        {/* Preview mode — single image, extract button */}
        {(state === 'preview' || (state === 'processing' && scanMode === 'single')) && imageUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />

            <View style={styles.buttonGroup}>
              <ScanButton
                icon="text"
                label="Extract Menu Text"
                onPress={extractText}
                isLoading={state === 'processing'}
              />
              <ScanButton
                icon="camera-outline"
                label="Retake Photo"
                variant="secondary"
                onPress={resetScan}
                isLoading={state === 'processing'}
              />
            </View>
          </View>
        )}

        {/* Multi-collect mode — thumbnail strip + add more */}
        {(state === 'multiCollect' || (state === 'processing' && scanMode === 'multi')) && (
          <View style={styles.multiCollectContainer}>
            <Text style={styles.title}>Menu Pages</Text>
            <Text style={styles.subtitle}>
              {imageUris.length} {imageUris.length === 1 ? 'page' : 'pages'} added (max {MAX_PAGES})
            </Text>

            {/* Thumbnail Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailStrip}
              contentContainerStyle={styles.thumbnailStripContent}
            >
              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
                  {state !== 'processing' && (
                    <Pressable
                      style={styles.thumbnailRemove}
                      onPress={() => removeImage(index)}
                      hitSlop={6}
                    >
                      <Ionicons name="close-circle" size={22} color={Colors.scoreRed} />
                    </Pressable>
                  )}
                  <View style={styles.thumbnailBadge}>
                    <Text style={styles.thumbnailBadgeText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Add More Buttons */}
            {imageUris.length < MAX_PAGES && state !== 'processing' && (
              <View style={styles.addMoreRow}>
                <Pressable style={styles.addMoreButton} onPress={() => pickImage(true)}>
                  <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                  <Text style={styles.addMoreText}>Add Photo</Text>
                </Pressable>
                <Pressable style={styles.addMoreButton} onPress={() => pickImage(false)}>
                  <Ionicons name="images-outline" size={20} color={Colors.primary} />
                  <Text style={styles.addMoreText}>Add from Gallery</Text>
                </Pressable>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <ScanButton
                icon="text"
                label={`Extract ${imageUris.length} ${imageUris.length === 1 ? 'Page' : 'Pages'}`}
                onPress={extractMultiplePages}
                isLoading={state === 'processing'}
              />
              <ScanButton
                icon="arrow-back-outline"
                label="Start Over"
                variant="secondary"
                onPress={resetScan}
                isLoading={state === 'processing'}
              />
            </View>
          </View>
        )}

        {/* Result mode — show extracted text + analyze button */}
        {(state === 'result' || state === 'analyzing') && menuText && (
          <MenuTextDisplay
            menuText={menuText}
            onRescan={resetScan}
            onAnalyze={analyzeWithAI}
            isAnalyzing={state === 'analyzing'}
          />
        )}
      </ScrollView>

      <LoadingOverlay
        visible={state === 'processing'}
        message={scanMode === 'multi' ? 'Reading menu pages...' : 'Extracting menu text...'}
        progressText={
          scanMode === 'multi' && ocrProgress.total > 0
            ? `Page ${ocrProgress.current} of ${ocrProgress.total}`
            : undefined
        }
      />
      <LoadingOverlay
        visible={state === 'analyzing' || state === 'enriching'}
        step={state === 'analyzing' ? 1 : 2}
        totalSteps={2}
      />

      {/* Scan naming modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.nameModalOverlay}>
          <View style={styles.nameModalContainer}>
            <Text style={styles.nameModalTitle}>Name This Scan</Text>
            <Text style={styles.nameModalSubtitle}>
              Give it a name so you can find it later
            </Text>
            <TextInput
              style={styles.nameModalInput}
              placeholder={"e.g. \"McDonald's lunch\""}
              placeholderTextColor={Colors.textLight}
              value={scanNameInput}
              onChangeText={setScanNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => completeScan(scanNameInput)}
            />
            <View style={styles.nameModalButtons}>
              <Pressable
                style={styles.nameModalSkip}
                onPress={() => completeScan('Menu Scan')}
              >
                <Text style={styles.nameModalSkipText}>Skip</Text>
              </Pressable>
              <Pressable
                style={styles.nameModalSave}
                onPress={() => completeScan(scanNameInput)}
              >
                <Text style={styles.nameModalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  pickContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.sectionHeading,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    width: '100%',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    ...typography.badge,
    color: Colors.primary,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  // Single-page preview
  previewContainer: {
    gap: 20,
  },
  imagePreview: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  // Multi-page collect
  multiCollectContainer: {
    flex: 1,
    gap: 16,
  },
  thumbnailStrip: {
    flexGrow: 0,
    maxHeight: 150,
  },
  thumbnailStripContent: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    width: 100,
    height: 130,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 130,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.surface,
    borderRadius: 11,
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailBadgeText: {
    ...typography.badge,
    color: '#FFFFFF',
  },
  addMoreRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addMoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  addMoreText: {
    ...typography.badge,
    color: Colors.primary,
  },
  // Naming modal
  nameModalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nameModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  nameModalTitle: {
    ...typography.sectionHeading,
    color: Colors.text,
    textAlign: 'center',
  },
  nameModalSubtitle: {
    ...typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  nameModalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  nameModalSkip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  nameModalSkipText: {
    ...typography.button,
    color: Colors.textSecondary,
  },
  nameModalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nameModalSaveText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
