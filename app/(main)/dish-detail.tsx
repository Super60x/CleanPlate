import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { DishAnalysis, getScoreColor, ScoreColor } from '../../types';

const scoreColorMap = {
  [ScoreColor.Green]: Colors.scoreGreen,
  [ScoreColor.Yellow]: Colors.scoreYellow,
  [ScoreColor.Red]: Colors.scoreRed,
};

function getScoreLabel(score: number): { title: string; description: string } {
  if (score >= 8) return { title: 'Excellent Choice', description: 'This dish is among the cleanest options available' };
  if (score >= 6) return { title: 'Good Choice', description: 'A solid option with good nutritional value' };
  if (score >= 4) return { title: 'Average', description: 'Consider healthier alternatives if available' };
  return { title: 'Below Average', description: 'This dish has significant nutritional concerns' };
}

export default function DishDetailScreen() {
  const { dish: dishParam, totalDishes, dishRank } = useLocalSearchParams<{
    dish: string;
    totalDishes?: string;
    dishRank?: string;
  }>();

  let dish: DishAnalysis | null = null;
  try {
    dish = dishParam ? JSON.parse(dishParam) : null;
  } catch {
    dish = null;
  }

  if (!dish) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Dish Details' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load dish details.</Text>
        </View>
      </View>
    );
  }

  const color = scoreColorMap[getScoreColor(dish.healthScore)];
  const scoreInfo = getScoreLabel(dish.healthScore);
  const total = parseInt(totalDishes || '0', 10);
  const rank = parseInt(dishRank || '0', 10);
  const percentile = total > 0 ? Math.round(((total - rank) / total) * 100) : 0;

  const isTopPick = dish.healthScore >= 8;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isTopPick ? 'Top Clean Pick' : 'Dish Details',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Best Choice badge */}
        {isTopPick && (
          <View style={styles.bestChoiceBadge}>
            <Ionicons name="leaf" size={14} color="#FFFFFF" />
            <Text style={styles.bestChoiceText}>BEST CHOICE</Text>
          </View>
        )}

        {/* Hero area */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name="restaurant" size={48} color={color} />
          </View>
        </View>

        {/* Dish name */}
        <Text style={styles.dishName}>{dish.dishName}</Text>

        {/* Score section */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreLargeCircle, { borderColor: color }]}>
            <Text style={[styles.scoreLargeNumber, { color }]}>{dish.healthScore * 10}</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreTitle, { color }]}>{scoreInfo.title}</Text>
            {total > 0 && (
              <Text style={styles.scorePercentile}>
                This dish exceeds {percentile}% of menu items in cleanliness
              </Text>
            )}
          </View>
        </View>

        {/* Tags */}
        {(dish.benefits.length > 0 || dish.warnings.length > 0) && (
          <View style={styles.tagsRow}>
            {dish.benefits.slice(0, 3).map((b, i) => (
              <View key={`b-${i}`} style={styles.benefitTag}>
                <Text style={styles.benefitTagText}>{b.toUpperCase()}</Text>
              </View>
            ))}
            {dish.warnings.slice(0, 2).map((w, i) => (
              <View key={`w-${i}`} style={styles.warningTag}>
                <Text style={styles.warningTagText}>{w.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* USDA Verified */}
        {dish.nutritionSource === 'usda' && (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.verifiedText}>USDA Verified Nutrition Data</Text>
          </View>
        )}

        {/* Why it's healthy / Why to be cautious */}
        {dish.reasoning && (
          <View style={styles.reasoningCard}>
            <View style={styles.reasoningHeader}>
              <Ionicons
                name={isTopPick ? 'heart' : 'information-circle'}
                size={20}
                color={isTopPick ? Colors.primary : Colors.textSecondary}
              />
              <Text style={styles.reasoningTitle}>
                {isTopPick ? "Why it's healthy" : 'Analysis'}
              </Text>
            </View>
            <Text style={styles.reasoningText}>{dish.reasoning}</Text>
          </View>
        )}

        {/* All benefits */}
        {dish.benefits.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Benefits</Text>
            {dish.benefits.map((b, i) => (
              <View key={i} style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.detailRowText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {/* All warnings */}
        {dish.warnings.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Warnings</Text>
            {dish.warnings.map((w, i) => (
              <View key={i} style={styles.detailRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.scoreYellow} />
                <Text style={styles.detailRowText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom stats bar */}
        <View style={styles.statsBar}>
          {dish.calories != null && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dish.calories}</Text>
              <Text style={styles.statLabel}>CALORIES</Text>
            </View>
          )}
          {dish.macros?.protein != null && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dish.macros.protein}g</Text>
              <Text style={styles.statLabel}>PROTEIN</Text>
            </View>
          )}
          {dish.macros?.carbs != null && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dish.macros.carbs}g</Text>
              <Text style={styles.statLabel}>NET CARBS</Text>
            </View>
          )}
          {dish.macros?.fat != null && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dish.macros.fat}g</Text>
              <Text style={styles.statLabel}>FAT</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  bestChoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  bestChoiceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  scoreLargeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreLargeNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  scorePercentile: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  benefitTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  benefitTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  warningTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  warningTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  reasoningCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  reasoningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  reasoningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  detailRowText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
