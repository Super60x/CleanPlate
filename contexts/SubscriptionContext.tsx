import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  initializePurchases,
  checkSubscription,
  loginUser,
  logoutUser,
} from '../services/purchases';
import type { SubscriptionStatus } from '../types';

interface SubscriptionContextValue extends SubscriptionStatus {
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isPremium: false,
    isTrialing: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat and sync user
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializePurchases();

        if (user) {
          await loginUser(user.id);
        } else {
          await logoutUser();
        }

        const sub = await checkSubscription();
        if (mounted) {
          setStatus(sub);
        }
      } catch (error) {
        console.error('Subscription init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [user]);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const sub = await checkSubscription();
      setStatus(sub);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        ...status,
        isLoading,
        refreshStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
