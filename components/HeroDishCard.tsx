import { useState } from 'react';
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

interface HeroDishCardProps {
  dish: DishAnalysis;
  rank: number;
}

export default function HeroDishCard({ dish, rank }: HeroDishCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColorMap[getScoreColor(dish.healthScore)];

  // Get first 2 benefits for inline display
  const inlineBenefits = dish.benefits.slice(0, 2);

  return (
    <Pressable
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Top Pick badge in top-right corner */}
      <View style={styles.topPickBadge}>
        <Text style={styles.topPickText}>★ Top Pick</Text>
      </View>

      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.scoreBadge, { backgroundColor: color }]}>
          <Text style={styles.scoreText}>{dish.healthScore}</Text>
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.rank}>#{rank}</Text>
          <Text style={styles.dishName} numberOfLines={expanded ? undefined : 1}>
            {dish.dishName}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textSecondary}
        />
      </View>

      {/* Calorie + macro summary (always visible) */}
      {dish.calories != null && (
        <View style={styles.calorieRow}>
          <Text style={styles.calories}>{dish.calories} cal</Text>
          {dish.macros && (
            <Text style={styles.macroSummary}>
              P {dish.macros.protein ?? '?'}g &middot; C {dish.macros.carbs ?? '?'}g &middot; F {dish.macros.fat ?? '?'}g
            </Text>
          )}
        </View>
      )}

      {/* USDA Verified Badge */}
      {dish.nutritionSource === 'usda' && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.verifiedText}>USDA Verified</Text>
        </View>
      )}

      {/* Inline benefits (always visible for hero cards) */}
      {inlineBenefits.length > 0 && (
        <View style={styles.inlineBenefitsRow}>
          {inlineBenefits.map((b, i) => (
            <View key={i} style={[styles.tag, styles.benefitTag]}>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          {/* All benefits (if more than 2) */}
          {dish.benefits.length > 2 && (
            <View style={styles.tagRow}>
              <Text style={styles.detailLabel}>All benefits:</Text>
              {dish.benefits.map((b, i) => (
                <View key={i} style={[styles.tag, styles.benefitTag]}>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Warnings */}
          {dish.warnings.length > 0 && (
            <View style={styles.tagRow}>
              {dish.warnings.map((w, i) => (
                <View key={i} style={[styles.tag, styles.warningTag]}>
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Detailed macros */}
          {dish.macros && (dish.macros.sugar != null || dish.macros.sodium != null) && (
            <View style={styles.macroDetail}>
              {dish.macros.sugar != null && (
                <Text style={styles.macroItem}>Sugar: {dish.macros.sugar}g</Text>
              )}
              {dish.macros.sodium != null && (
                <Text style={styles.macroItem}>Sodium: {dish.macros.sodium}mg</Text>
              )}
            </View>
          )}

          {/* Reasoning */}
          {dish.reasoning ? (
            <Text style={styles.reasoning}>{dish.reasoning}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.heroBackground,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.scoreGreen,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topPickBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  topPickText: {
    ...typography.badge,
    color: Colors.scoreGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.scoreGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  titleArea: {
    flex: 1,
  },
  rank: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dishName: {
    ...typography.subheading,
    color: Colors.text,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingLeft: 64,
  },
  calories: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  macroSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingLeft: 64,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  inlineBenefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingLeft: 64,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    width: '100%',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  benefitTag: {
    backgroundColor: Colors.primaryLight,
  },
  benefitText: {
    ...typography.badge,
    color: Colors.primaryDark,
  },
  warningTag: {
    backgroundColor: '#FEF3C7',
  },
  warningText: {
    ...typography.badge,
    color: '#92400E',
  },
  macroDetail: {
    flexDirection: 'row',
    gap: 16,
    paddingLeft: 4,
  },
  macroItem: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reasoning: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
