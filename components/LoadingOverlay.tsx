import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  step?: number; // 1 = analyzing, 2 = enriching
  totalSteps?: number; // default 2
  progressText?: string; // e.g. "Page 2 of 5"
}

const ANALYZING_MESSAGES = [
  "Analyzing dishes...",
  "Counting those calories...",
  "Clean Plate is reading the menu...",
  "Checking for hidden veggies...",
];

const ENRICHING_MESSAGES = [
  "Getting nutrition facts...",
  "Verifying with USDA database...",
  "Almost there...",
];

export default function LoadingOverlay({
  visible,
  message,
  step = 1,
  totalSteps = 2,
  progressText,
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate through funny messages every 3 seconds
  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }

    const messages = step === 1 ? ANALYZING_MESSAGES : ENRICHING_MESSAGES;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [visible, step]);

  const messages = step === 1 ? ANALYZING_MESSAGES : ENRICHING_MESSAGES;
  const currentMessage = message || messages[messageIndex];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />

          {totalSteps > 1 && (
            <Text style={styles.stepIndicator}>
              Step {step} of {totalSteps}
            </Text>
          )}

          {progressText && (
            <Text style={styles.progressText}>{progressText}</Text>
          )}

          <Text style={styles.message}>{currentMessage}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
});
