import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase config loaded from .env file (EXPO_PUBLIC_ prefix)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent double init on hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth — use initializeAuth with AsyncStorage for native builds
// getAuth() only works reliably for web/Expo Go hot reload
let auth;
if (getApps().length === 1 && Platform.OS !== 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (hot reload) — fall back to getAuth
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
