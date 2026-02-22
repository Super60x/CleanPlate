# Day 1 — Foundation + Authentication

## What Was Built
- Expo project from scratch with TypeScript
- Firebase Authentication (email/password): signup, login, logout
- Expo Router file-based navigation with auth guards
- Tested and working on Android via Expo Go

## Lessons Learned

### 1. No Mac? No problem — use React Native + Expo
The original plan was native SwiftUI, which requires Mac + Xcode. Pivoted to React Native with Expo, which runs on Windows. Expo Go lets you test instantly on your phone via QR code. EAS Build handles iOS builds in the cloud later.

### 2. Firebase "Web app" for a mobile app is correct
When using the Firebase JS SDK (not @react-native-firebase), you register a **Web app** in Firebase Console. This is because the JS SDK needs web config keys (apiKey, authDomain, etc.). The app still runs natively on your phone — it just uses web-compatible Firebase calls under the hood.

### 3. `getReactNativePersistence` removed in Firebase v12
Firebase v12 dropped the `getReactNativePersistence` export from `firebase/auth`. The fix: use simple `getAuth(app)` instead of `initializeAuth()` with persistence config. Sessions still work.

### 4. npm peer dependency conflicts with Firebase
`firebase` v12 has a peer dependency on `react-dom` which conflicts with React Native. Fix: add `.npmrc` with `legacy-peer-deps=true` and always use `--legacy-peer-deps` flag when installing.

### 5. Expo Router route groups
`(auth)` and `(main)` folder naming creates route groups. The root `_layout.tsx` checks auth state and redirects between groups. This pattern cleanly separates authenticated vs unauthenticated screens.

## Files Created
```
app/_layout.tsx          — Root layout with AuthProvider + auth redirect logic
app/index.tsx            — Entry redirect based on auth state
app/(auth)/_layout.tsx   — Auth stack (headerless)
app/(auth)/login.tsx     — Login screen
app/(auth)/signup.tsx    — Signup screen
app/(main)/_layout.tsx   — Main stack with styled header
app/(main)/home.tsx      — Home screen with logout
components/LoadingOverlay.tsx — Reusable loading spinner modal
services/firebase.ts     — Firebase app init + auth + db exports
services/auth.ts         — Auth functions + error mapping
contexts/AuthContext.tsx  — Auth state context + useAuth hook
types/index.ts           — All TypeScript interfaces and enums
constants/colors.ts      — Brand + health score + UI colors
.npmrc                   — legacy-peer-deps=true
```

## Key Config
- Firebase project: `cleanfoodfinder-af546`
- Firebase config is inline in `services/firebase.ts` (not .env)
- Expo SDK 54, React Native 0.81.5, Firebase v12
