import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// getReactNativePersistence EXISTS at runtime and this import works. Metro
// resolves the `react-native` export condition to @firebase/auth/dist/rn/index.js,
// which exports it. The `firebase` wrapper package declares no `react-native`
// condition for its *typings*, so tsc falls back to platform-neutral types that
// omit the RN-only export. Upstream: firebase-js-sdk#8332.
//
// Do NOT "verify" this with `node -e` — Node resolves the `node` condition, a
// different build where the export genuinely is undefined. To check the build
// Metro actually uses: require('./node_modules/@firebase/auth/dist/rn/index.js')
//
// @ts-expect-error -- typings-only gap, see above. If this line ever reports
// "unused directive", firebase fixed the typings and the suppression can go.
import { getReactNativePersistence } from 'firebase/auth';
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
let auth: Auth;
if (getApps().length === 1 && Platform.OS !== 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // The expected case is a hot reload where auth is already initialized, and
    // getAuth() correctly returns the existing instance. But a genuine
    // persistence failure lands here too and looks identical — getAuth() would
    // silently give us an in-memory-only auth and every user would be signed
    // out on relaunch. Log loudly so the two are distinguishable in a build.
    console.warn(
      '[firebase] initializeAuth failed, falling back to getAuth(). If this ' +
        'appears outside a hot reload, auth persistence is NOT active:',
      error
    );
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
