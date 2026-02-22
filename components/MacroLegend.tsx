import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function MacroLegend() {
  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
      <Text style={styles.text}>P = Protein · C = Carbs · F = Fat (in grams)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  text: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
