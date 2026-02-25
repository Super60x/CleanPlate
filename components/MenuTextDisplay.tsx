import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface MenuTextDisplayProps {
  menuText: string;
  onRescan: () => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
}

export default function MenuTextDisplay({ menuText, onRescan, onAnalyze, isAnalyzing }: MenuTextDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={20} color={Colors.primary} />
        <Text style={styles.headerText}>Extracted Menu Text</Text>
      </View>

      <ScrollView style={styles.textContainer} nestedScrollEnabled>
        <Text style={styles.menuText} selectable>
          {menuText}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.analyzeButton, isAnalyzing && styles.disabled]}
          onPress={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size={20} color="#FFFFFF" />
          ) : (
            <Ionicons name="nutrition" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.analyzeText}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
          </Text>
        </Pressable>
        <Pressable style={[styles.rescanButton, isAnalyzing && styles.disabled]} onPress={onRescan} disabled={isAnalyzing}>
          <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          <Text style={styles.rescanText}>Scan Another Menu</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    ...typography.subheading,
    color: Colors.text,
  },
  textContainer: {
    maxHeight: 350,
    padding: 16,
  },
  menuText: {
    ...typography.body,
    color: Colors.text,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  analyzeText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.6,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  rescanText: {
    ...typography.button,
    color: Colors.primary,
  },
});
