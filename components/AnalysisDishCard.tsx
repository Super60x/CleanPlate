import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { DishAnalysis, getScoreColor, ScoreColor } from '../types';

const scoreColorMap = {
  [ScoreColor.Green]: Colors.scoreGreen,
  [ScoreColor.Yellow]: Colors.scoreYellow,
  [ScoreColor.Red]: Colors.scoreRed,
};

interface AnalysisDishCardProps {
  dish: DishAnalysis;
  isTopScorer: boolean;
  onPress: () => void;
}

function ProgressBar({ value, maxValue, label, unit }: { value: number; maxValue: number; label: string; unit: string }) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={progressStyles.row}>
      <Text style={progressStyles.label}>{label}</Text>
      <View style={progressStyles.barContainer}>
        <View style={[progressStyles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={progressStyles.value}>{value}{unit}</Text>
    </View>
  );
}

export default function AnalysisDishCard({ dish, isTopScorer, onPress }: AnalysisDishCardProps) {
  const color = scoreColorMap[getScoreColor(dish.healthScore)];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* MOST CLEAN badge */}
      {isTopScorer && (
        <View style={styles.mostCleanBadge}>
          <Ionicons name="leaf" size={12} color={Colors.primary} />
          <Text style={styles.mostCleanText}>MOST CLEAN</Text>
        </View>
      )}

      {/* Main content row */}
      <View style={styles.mainRow}>
        {/* Food icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="restaurant-outline" size={22} color={Colors.primary} />
        </View>

        {/* Dish info */}
        <View style={styles.infoArea}>
          <Text style={styles.dishName} numberOfLines={2}>{dish.dishName}</Text>
        </View>

        {/* Score circle */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: color }]}>
            <Text style={[styles.scoreNumber, { color }]}>{dish.healthScore * 10}</Text>
          </View>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
      </View>

      {/* Progress bars */}
      <View style={styles.progressSection}>
        {dish.macros?.protein != null && (
          <ProgressBar
            value={dish.macros.protein}
            maxValue={50}
            label="PROTEIN"
            unit="G"
          />
        )}
        {dish.macros?.sugar != null && (
          <ProgressBar
            value={dish.macros.sugar}
            maxValue={30}
            label="SUGAR"
            unit="G"
          />
        )}
        {dish.calories != null && (
          <ProgressBar
            value={dish.calories}
            maxValue={800}
            label="CALORIES"
            unit=" KCAL"
          />
        )}
      </View>
    </Pressable>
  );
}

const progressStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 65,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    width: 60,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mostCleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  mostCleanText: {
    ...typography.badge,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    flex: 1,
  },
  dishName: {
    ...typography.subheading,
    color: Colors.text,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    fontWeight: '800',
  },
  scoreLabel: {
    ...typography.caption,
    color: Colors.textLight,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  progressSection: {
    marginTop: 14,
    gap: 8,
  },
});
