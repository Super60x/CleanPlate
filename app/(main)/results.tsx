import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { DishAnalysis } from '../../types';
import AnalysisDishCard from '../../components/AnalysisDishCard';

type FilterOption = 'all' | 'lowest-calories' | 'least-sugar' | 'highest-protein';

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All Items' },
  { key: 'lowest-calories', label: 'Lowest Calories' },
  { key: 'least-sugar', label: 'Least Sugar' },
  { key: 'highest-protein', label: 'Highest Protein' },
];

export default function ResultsScreen() {
  const router = useRouter();
  const { dishes: dishesParam, fromScan, imageUri } = useLocalSearchParams<{
    dishes: string;
    fromScan?: string;
    imageUri?: string;
  }>();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [showFullImage, setShowFullImage] = useState(false);

  let dishes: DishAnalysis[] = [];
  try {
    dishes = dishesParam ? JSON.parse(dishesParam) : [];
  } catch {
    dishes = [];
  }

  const isNewScan = fromScan === 'true';

  // Find the top scorer for MOST CLEAN badge
  const topScorerId = useMemo(() => {
    if (dishes.length === 0) return null;
    const sorted = [...dishes].sort((a, b) => b.healthScore - a.healthScore);
    return sorted[0].id;
  }, [dishes]);

  // Apply filter/sort
  const filteredDishes = useMemo(() => {
    const sorted = [...dishes];
    switch (activeFilter) {
      case 'lowest-calories':
        return sorted.sort((a, b) => (a.calories ?? 9999) - (b.calories ?? 9999));
      case 'least-sugar':
        return sorted.sort((a, b) => (a.macros?.sugar ?? 9999) - (b.macros?.sugar ?? 9999));
      case 'highest-protein':
        return sorted.sort((a, b) => (b.macros?.protein ?? 0) - (a.macros?.protein ?? 0));
      default:
        return sorted.sort((a, b) => b.healthScore - a.healthScore);
    }
  }, [dishes, activeFilter]);

  const handleDishPress = (dish: DishAnalysis) => {
    router.push({
      pathname: '/(main)/dish-detail',
      params: {
        dish: JSON.stringify(dish),
        totalDishes: dishes.length.toString(),
        dishRank: (dishes.filter(d => d.healthScore > dish.healthScore).length + 1).toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Menu Analysis',
          headerTitleStyle: { ...typography.pageTitle },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Auto-save banner */}
        {isNewScan && (
          <View style={styles.savedBanner}>
            <Ionicons name="cloud-done-outline" size={16} color={Colors.primary} />
            <Text style={styles.savedText}>Scan saved to your history</Text>
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Dish list */}
        <View style={styles.dishList}>
          {filteredDishes.map((dish) => (
            <AnalysisDishCard
              key={dish.id}
              dish={dish}
              isTopScorer={dish.id === topScorerId}
              onPress={() => handleDishPress(dish)}
            />
          ))}
        </View>

        {/* Menu Photo Thumbnail */}
        {imageUri && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Scanned Menu</Text>
            <Pressable onPress={() => setShowFullImage(true)}>
              <Image source={{ uri: imageUri }} style={styles.photoThumbnail} resizeMode="cover" />
              <Text style={styles.photoHint}>Tap to enlarge</Text>
            </Pressable>
          </View>
        )}

        {/* Footer */}
        <Pressable
          style={styles.scanAnotherButton}
          onPress={() => router.replace('/scan')}
        >
          <Ionicons name="scan-outline" size={22} color="#FFFFFF" />
          <Text style={styles.scanAnotherText}>Scan Another Menu</Text>
        </Pressable>
      </ScrollView>

      {/* Full-screen photo modal */}
      {imageUri && (
        <Modal visible={showFullImage} transparent animationType="fade">
          <View style={styles.imageModalOverlay}>
            <Pressable style={styles.imageModalClose} onPress={() => setShowFullImage(false)}>
              <Ionicons name="close-circle" size={36} color="#FFFFFF" />
            </Pressable>
            <Image source={{ uri: imageUri }} style={styles.imageModalFull} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  savedText: {
    ...typography.badge,
    color: Colors.primaryDark,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterTabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    ...typography.badge,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  dishList: {
    gap: 14,
  },
  photoSection: {
    marginTop: 20,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  photoHint: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanAnotherText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  imageModalFull: {
    width: '95%',
    height: '80%',
  },
});
