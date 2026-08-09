import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { RC_GOOGLE_KEY, RC_APPLE_KEY } from './config';
import type { SubscriptionStatus } from '../types';

// MUST match the entitlement identifier in the RevenueCat dashboard exactly.
// Dashboard -> Entitlements -> the value in the "Identifier" column (not the
// display name). A mismatch is invisible: JavaScript answers a missing key with
// `undefined`, so every paying customer silently reads as non-premium.
// Unverified as of 2026-08-09 -- see issue #11. warnIfEntitlementMissing() below
// exists to make a mismatch loud instead of silent until that is confirmed.
const ENTITLEMENT_ID = 'Clean Plate Premium';

/**
 * A purchase has three distinct outcomes and a boolean can only carry two. The
 * third -- charged, but the entitlement never showed up -- is the one that
 * matters most, because the customer's card has been billed and telling them
 * "purchase failed" would be false.
 */
export type PurchaseResult =
  | { ok: true; status: SubscriptionStatus }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'entitlement-missing'; activeEntitlements: string[] };

let isConfigured = false;
// Memoises the in-flight configure call. Without this, SubscriptionProvider's
// init and the paywall's loadOfferings both fire on mount and can race past the
// isConfigured flag into two concurrent configure() calls.
let configurePromise: Promise<boolean> | null = null;

/**
 * Returns true once RevenueCat is configured. Safe to call repeatedly and from
 * concurrent callers -- the first call wins and the rest await the same promise.
 */
export async function initializePurchases(userId?: string): Promise<boolean> {
  if (isConfigured) return true;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    const apiKey = Platform.OS === 'ios' ? RC_APPLE_KEY : RC_GOOGLE_KEY;

    if (!apiKey) {
      console.error(
        `[purchases] No RevenueCat API key for ${Platform.OS}. Purchases and ` +
          'subscription checks cannot work in this build.'
      );
      return false;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    try {
      await Purchases.configure({ apiKey, appUserID: userId ?? undefined });
      isConfigured = true;
      return true;
    } catch (error) {
      console.error('[purchases] RevenueCat configure failed:', error);
      // Clear so a later call can retry rather than being stuck on this failure.
      configurePromise = null;
      return false;
    }
  })();

  return configurePromise;
}

/**
 * Logs the entitlement identifiers RevenueCat actually returned when the one we
 * look up is absent. If a customer has active entitlements but not ours, that is
 * a near-certain ENTITLEMENT_ID mismatch (#11) rather than a lapsed subscription.
 */
function warnIfEntitlementMissing(info: CustomerInfo, context: string): void {
  const activeKeys = Object.keys(info.entitlements.active);
  if (activeKeys.length === 0) return;

  console.error(
    `[purchases] ${context}: entitlement "${ENTITLEMENT_ID}" not found, but ` +
      `this customer HAS active entitlements: [${activeKeys.join(', ')}]. ` +
      'ENTITLEMENT_ID in services/purchases.ts almost certainly does not match ' +
      'the RevenueCat dashboard identifier. See issue #11.'
  );
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  // The paywall can mount before SubscriptionProvider has finished its init, so
  // getOfferings() cannot assume configure() has already run.
  const ready = await initializePurchases();
  if (!ready) return [];

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    console.warn(
      '[purchases] RevenueCat returned no current offering with packages. ' +
        'Check that the offering is marked current and its packages are ' +
        'attached to store products.'
    );
    return [];
  } catch (error) {
    console.error('[purchases] Failed to fetch offerings:', error);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // Check entitlement directly from the purchase response.
    if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
      return { ok: true, status: mapCustomerInfo(customerInfo) };
    }

    // The store took the money but the entitlement is not visible yet. Two very
    // different causes look identical here: RevenueCat propagation delay (which
    // resolves in seconds) and an ENTITLEMENT_ID mismatch (#11, which never
    // resolves). Retry briefly to rule out the first.
    let latest = customerInfo;
    for (const delayMs of [800, 1600, 3200]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      latest = await Purchases.getCustomerInfo();
      if (latest.entitlements.active[ENTITLEMENT_ID] !== undefined) {
        return { ok: true, status: mapCustomerInfo(latest) };
      }
    }

    // Out of retries. The customer HAS been charged -- reporting a flat failure
    // would be a lie, and the previous `return true` here was the opposite lie:
    // it navigated as if premium, then the next launch paywalled them (#12).
    // Report what is actually true so the caller can say so honestly.
    warnIfEntitlementMissing(latest, 'purchasePackage');
    console.error(
      '[purchases] Purchase charged but entitlement never appeared after ' +
        'retries. Active entitlements:',
      Object.keys(latest.entitlements.active)
    );
    return {
      ok: false,
      reason: 'entitlement-missing',
      activeEntitlements: Object.keys(latest.entitlements.active),
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return { ok: false, reason: 'cancelled' };
    }
    throw error;
  }
}

export async function checkSubscription(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return mapCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { isPremium: false, isTrialing: false };
  }
}

export async function restorePurchases(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return mapCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
}

export async function loginUser(userId: string): Promise<void> {
  // Configure first if nobody has yet, rather than silently skipping the login.
  // Skipping would leave purchases bound to the anonymous RevenueCat ID, so the
  // subscription would not follow the user to another device (#13).
  const ready = await initializePurchases(userId);
  if (!ready) return;

  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error('[purchases] Failed to log in to RevenueCat:', error);
  }
}

export async function logoutUser(): Promise<void> {
  // No configure here on purpose -- logging out of a SDK that was never
  // configured is a no-op, not an error worth forcing initialisation for.
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('[purchases] Failed to log out of RevenueCat:', error);
  }
}

function mapCustomerInfo(info: CustomerInfo): SubscriptionStatus {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    warnIfEntitlementMissing(info, 'mapCustomerInfo');
    return { isPremium: false, isTrialing: false };
  }

  return {
    isPremium: true,
    isTrialing: entitlement.periodType === 'TRIAL',
    expirationDate: entitlement.expirationDate
      ? new Date(entitlement.expirationDate)
      : undefined,
    productIdentifier: entitlement.productIdentifier,
  };
}
