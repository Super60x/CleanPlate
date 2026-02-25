import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { ScanResult } from '../../types';
import { deleteScanResult, loadScanHistory, updateScanName } from '../../services/firestore';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameScanId, setRenameScanId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setIsLoading(true);
      loadScanHistory(user.id)
        .then(setScans)
        .catch(() => Alert.alert('Error', 'Failed to load scan history.'))
        .finally(() => setIsLoading(false));
    }, [user])
  );

  const handleDelete = (scanId: string) => {
    Alert.alert('Delete Scan', 'Are you sure you want to delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          try {
            await deleteScanResult(user.id, scanId);
            setScans((prev) => prev.filter((s) => s.id !== scanId));
          } catch {
            Alert.alert('Error', 'Failed to delete scan.');
          }
        },
      },
    ]);
  };

  const handleRenameOpen = (scan: ScanResult) => {
    setRenameScanId(scan.id);
    setRenameInput(scan.restaurantName || 'Menu Scan');
    setShowRenameModal(true);
  };

  const handleRenameSave = async () => {
    if (!user || !renameScanId) return;
    const newName = renameInput.trim() || 'Menu Scan';
    setShowRenameModal(false);
    try {
      await updateScanName(user.id, renameScanId, newName);
      setScans((prev) =>
        prev.map((s) =>
          s.id === renameScanId ? { ...s, restaurantName: newName } : s
        )
      );
    } catch {
      Alert.alert('Error', 'Failed to rename scan.');
    }
    setRenameScanId(null);
  };

  const handleView = (scan: ScanResult) => {
    router.push({
      pathname: '/results',
      params: { dishes: JSON.stringify(scan.dishes) },
    });
  };

  const avgScore = (scan: ScanResult) => {
    if (scan.dishes.length === 0) return 0;
    return (
      Math.round(
        (scan.dishes.reduce((sum, d) => sum + d.healthScore, 0) /
          scan.dishes.length) *
          10
      ) / 10
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: ScanResult }) => (
    <Pressable style={styles.card} onPress={() => handleView(item)}>
      <View style={styles.cardHeader}>
        <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.restaurantName || 'Menu Scan'}
        </Text>
        <Pressable onPress={() => handleRenameOpen(item)} hitSlop={8}>
          <Ionicons name="pencil-outline" size={18} color={Colors.textLight} />
        </Pressable>
        <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={Colors.textLight} />
        </Pressable>
      </View>
      <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
      <View style={styles.cardStats}>
        <Text style={styles.stat}>
          {item.dishes.length} {item.dishes.length === 1 ? 'dish' : 'dishes'}
        </Text>
        <Text style={styles.statDivider}>|</Text>
        <Text style={styles.stat}>
          Avg score: <Text style={styles.statValue}>{avgScore(item)}</Text>/10
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan History' }} />

      {isLoading ? (
        <LoadingOverlay visible message="Loading history..." />
      ) : scans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>
            Your scan history will appear here after you analyze a menu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Rename modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.renameOverlay}>
          <View style={styles.renameContainer}>
            <Text style={styles.renameTitle}>Rename Scan</Text>
            <TextInput
              style={styles.renameInput}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Scan name"
              placeholderTextColor={Colors.textLight}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameSave}
            />
            <View style={styles.renameButtons}>
              <Pressable
                style={styles.renameCancelBtn}
                onPress={() => {
                  setShowRenameModal(false);
                  setRenameScanId(null);
                }}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.renameSaveBtn} onPress={handleRenameSave}>
                <Text style={styles.renameSaveText}>Save</Text>
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
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    ...typography.subheading,
    flex: 1,
    color: Colors.text,
  },
  cardDate: {
    ...typography.caption,
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 30,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 30,
    gap: 8,
  },
  stat: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    color: Colors.textLight,
  },
  statValue: {
    fontWeight: '700',
    color: Colors.primary,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    ...typography.sectionHeading,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    ...typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  renameOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  renameTitle: {
    ...typography.sectionHeading,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  renameInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  renameCancelText: {
    ...typography.button,
    color: Colors.textSecondary,
  },
  renameSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  renameSaveText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
