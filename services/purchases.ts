import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { RC_GOOGLE_KEY, RC_APPLE_KEY } from './config';
import type { SubscriptionStatus } from '../types';

const ENTITLEMENT_ID = 'premium';

let isConfigured = false;

export async function initializePurchases(userId?: string): Promise<void> {
  if (isConfigured) return;

  const apiKey = Platform.OS === 'ios' ? RC_APPLE_KEY : RC_GOOGLE_KEY;

  if (!apiKey) {
    console.warn('RevenueCat API key not set for', Platform.OS);
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({ apiKey, appUserID: userId ?? undefined });
  isConfigured = true;
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch offerings:', error);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error: any) {
    if (error.userCancelled) {
      return false;
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
  if (!isConfigured) return;
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error('Failed to log in to RevenueCat:', error);
  }
}

export async function logoutUser(): Promise<void> {
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('Failed to log out of RevenueCat:', error);
  }
}

function mapCustomerInfo(info: CustomerInfo): SubscriptionStatus {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
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
