import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { Colors } from '../../constants/colors';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/purchases';
import { useSubscription } from '../../contexts/SubscriptionContext';

export default function PaywallScreen() {
  const router = useRouter();
  const { isPremium, isTrialing, refreshStatus } = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function loadOfferings() {
      const available = await getOfferings();
      setPackages(available);
      // Default select annual if it exists (better value)
      const annualIdx = available.findIndex(
        (p) => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
      );
      if (annualIdx >= 0) setSelectedIndex(annualIdx);
      setIsLoading(false);
    }
    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    if (packages.length === 0) return;
    const pkg = packages[selectedIndex];
    if (!pkg) return;

    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        await refreshStatus();
        router.back();
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Auto-dismiss if user is already premium (e.g. purchased but got stuck)
  useEffect(() => {
    if (isPremium || isTrialing) {
      router.back();
    }
  }, [isPremium, isTrialing]);

  // Re-check subscription on mount in case purchase completed but state is stale
  useEffect(() => {
    refreshStatus();
  }, []);

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const status = await restorePurchases();
      await refreshStatus();
      if (status.isPremium) {
        Alert.alert('Restored!', 'Your subscription has been restored.');
        router.back();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription for your account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Please try again later.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getMonthlyPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const getSavingsLabel = (pkg: PurchasesPackage): string | null => {
    if (pkg.packageType === 'ANNUAL' || pkg.identifier === '$rc_annual') {
      return 'Save 42%';
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerTransparent: true }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Clean Plate Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited menu scanning with a 7-day free trial
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          {[
            { icon: 'scan-outline' as const, text: 'Unlimited menu scans' },
            { icon: 'nutrition-outline' as const, text: 'USDA-verified nutrition data' },
            { icon: 'heart-outline' as const, text: 'Personalized health scores' },
            { icon: 'time-outline' as const, text: 'Full scan history' },
          ].map((item) => (
            <View key={item.text} style={styles.benefitRow}>
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
              <Text style={styles.benefitText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan Cards */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 32 }} />
        ) : packages.length === 0 ? (
          <View style={styles.noPlans}>
            <Text style={styles.noPlansText}>
              Subscription plans are being set up. Please check back later.
            </Text>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map((pkg, index) => {
              const isSelected = index === selectedIndex;
              const savings = getSavingsLabel(pkg);

              return (
                <Pressable
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelectedIndex(index)}
                >
                  {savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>{savings}</Text>
                    </View>
                  )}
                  <View style={styles.planRadio}>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                      {pkg.packageType === 'ANNUAL' || pkg.identifier === '$rc_annual'
                        ? 'Annual'
                        : 'Monthly'}
                    </Text>
                    <Text style={styles.planPrice}>{getMonthlyPrice(pkg)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* CTA Button */}
        <Pressable
          style={[styles.ctaButton, (isPurchasing || packages.length === 0) && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || packages.length === 0}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
          )}
        </Pressable>

        <Text style={styles.ctaSubtext}>
          Cancel anytime. You won't be charged during the trial.
        </Text>

        {/* Restore */}
        <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isPurchasing}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>

        {/* Legal Links */}
        <View style={styles.legal}>
          <Text style={styles.legalText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Payment will be charged to your Google Play account. Subscription auto-renews
            unless cancelled at least 24 hours before the end of the current period.
          </Text>
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
  content: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  benefits: {
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  noPlans: {
    padding: 24,
    alignItems: 'center',
  },
  noPlansText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  plans: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  planRadio: {
    marginRight: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  planTitleSelected: {
    color: Colors.primaryDark,
  },
  planPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  ctaSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  restoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  legal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legalText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});
