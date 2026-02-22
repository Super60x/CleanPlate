import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface ScanButtonProps {
  onPress: () => void;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function ScanButton({ onPress, label, icon, isLoading, variant = 'primary' }: ScanButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        isLoading && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size={24} color={isPrimary ? '#FFFFFF' : Colors.primary} />
      ) : (
        <Ionicons name={icon} size={24} color={isPrimary ? '#FFFFFF' : Colors.primary} />
      )}
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    height: 56,
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: Colors.primary,
  },
});
