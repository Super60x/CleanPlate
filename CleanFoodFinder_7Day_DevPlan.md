# CleanFoodFinder - 7-Day Development Plan

## Project Overview

**App Name:** CleanFoodFinder
**Platform:** iOS + Android (React Native with Expo)
**Goal:** AI-powered menu scanner that recommends healthiest dishes
**Timeline:** 7 days to TestFlight
**Tech Stack:** React Native + Expo + Firebase + Google Cloud Vision + Claude API + RevenueCat

> **Platform pivot:** Original plan was native SwiftUI (requires Mac + Xcode). Pivoted to React Native with Expo to develop on Windows. Expo Go for testing, EAS Build for native builds.

---

## Progress Tracker

| Day | Feature | Status | Notes |
|-----|---------|--------|-------|
| 1 | Foundation + Auth | DONE | Expo project, Firebase email/password auth, Expo Router |
| 2 | Camera + Vision OCR | DONE | expo-image-picker, Google Cloud Vision TEXT_DETECTION |
| 3 | Claude API + Health Analysis | DONE | Claude Messages API, health scores, results UI, .env security fix |
| 4 | User Preferences + Firestore | DONE | Firestore CRUD, preferences UI, history screen, personalized Claude analysis |
| 4.5 | Hybrid Nutrition + UX | DONE | USDA FoodData Central integration, loading UX, macro legend, Top Picks hero section |
| 5 | UX Fixes + Multi-Page Scanning | DONE | USDA bug fix, multi-page scanning, scan naming, menu verdict, photo display, preferences warning |
| 5.5 | App Store Prep | DONE | Firestore security rules, account deletion link, app icon SVG |
| 6 | Subscriptions + RevenueCat | IN PROGRESS | EAS build done, firebase.ts fixed, DNS resolved. RevenueCat dashboard + testing NEXT |
| 7 | Sharing + Polish + TestFlight | PENDING | Sharing, UI overhaul, App Store assets, EAS Build upload |

---

## Tech Stack (Adapted)

| Layer | Original (SwiftUI) | Current (React Native/Expo) |
|-------|--------------------|-----------------------------|
| Framework | SwiftUI | React Native + Expo SDK 54 |
| Language | Swift | TypeScript |
| Navigation | NavigationStack | Expo Router (file-based) |
| Auth | Firebase iOS SDK (SPM) | Firebase JS SDK v12 |
| Database | Firestore (native) | Firestore (Firebase JS SDK) |
| OCR | Google Cloud Vision | Google Cloud Vision (REST) |
| AI | Claude API | Claude API (Messages endpoint) |
| Subscriptions | RevenueCat (native) | RevenueCat (react-native-purchases) |
| Camera | PhotosPicker (SwiftUI) | expo-image-picker |
| Testing | Xcode Simulator | Expo Go on Android phone |
| Build/Deploy | Xcode Archive | EAS Build (cloud, no Mac needed) |

---

## Pre-Development Setup

### Firebase Project Setup — DONE
1. Created project: `CleanFoodFinder` at console.firebase.google.com
2. Enabled Authentication → Email/Password
3. Enabled Firestore Database → Test mode
4. Registered as **Web app** (Firebase JS SDK needs web config keys)
5. Config stored inline in `services/firebase.ts`

### Google Cloud Vision Setup — DONE
1. Created project: `CleanFoodFinder-VisionAI` at console.cloud.google.com
2. Enabled Cloud Vision API
3. Created API key (no restrictions for development)
4. Key stored in `services/config.ts`

### Claude API Setup — DONE
1. API key from console.anthropic.com
2. Key stored in `.env` as `EXPO_PUBLIC_CLAUDE_API_KEY`
3. Model: `claude-sonnet-4-20250514`

### Development Environment — DONE
- VS Code with Claude Code extension
- Node.js + npm on Windows
- Expo Go app on Android phone
- `.npmrc` with `legacy-peer-deps=true` (Firebase peer dep workaround)

---

## DAY 1: Foundation + Authentication — DONE

### Goal
Working login/signup flow with Firebase Authentication

### What Was Built
- Expo project with TypeScript (`npx create-expo-app@latest`)
- Firebase Authentication (email/password): signup, login, logout
- Expo Router file-based navigation with auth guards
- Route groups: `(auth)` for login/signup, `(main)` for authenticated screens
- AuthContext with `useAuth()` hook
- LoadingOverlay reusable component
- Full type system (DishAnalysis, ScanResult, Macros, etc.)
- Brand color constants with health score colors

### Files Created
```
app/_layout.tsx          — Root layout: AuthProvider + auth redirect
app/index.tsx            — Entry redirect based on auth state
app/(auth)/_layout.tsx   — Auth stack (no header)
app/(auth)/login.tsx     — Login screen with validation
app/(auth)/signup.tsx    — Signup screen with password match
app/(main)/_layout.tsx   — Main stack with styled header
app/(main)/home.tsx      — Home screen with logout
services/firebase.ts     — Firebase init (auth + db exports)
services/auth.ts         — Auth functions + error code mapping
contexts/AuthContext.tsx  — Auth state management
components/LoadingOverlay.tsx — Reusable loading modal
types/index.ts           — All TypeScript interfaces + enums
constants/colors.ts      — Brand + health score + UI colors
.npmrc                   — legacy-peer-deps=true
```

### Verified
- [x] Signup with email/password
- [x] Login with created account
- [x] Logout returns to login
- [x] Error handling (weak password, wrong password, etc.)
- [x] Session persistence
- [x] Loading spinners during auth
- [x] All working on Android via Expo Go

### Lessons Learned
- Firebase v12 **DOES** export `getReactNativePersistence` — use `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` for native builds. `getAuth(app)` was used initially in Expo Go but causes warnings in native builds. See Day 6 for the full fix.
- Firebase JS SDK needs `.npmrc` with `legacy-peer-deps=true`
- Firebase "Web app" registration is correct for JS SDK (even for mobile apps)
- See `learning/day1-auth-foundation.md` for details

---

## DAY 2: Camera + Google Vision OCR — DONE

### Goal
Capture menu photo and extract text using Google Cloud Vision

### What Was Built
- Image capture via camera or gallery (expo-image-picker)
- Image resize/compression before API call (expo-image-manipulator)
- Google Cloud Vision API TEXT_DETECTION integration
- Full scan flow: pick image → preview → extract text → display results
- Updated home screen with "Scan Menu" navigation button

### Files Created
```
services/config.ts              — API keys (Vision API key)
services/vision.ts              — extractTextFromImage() function
components/ScanButton.tsx        — Reusable button (primary/secondary)
components/MenuTextDisplay.tsx   — Scrollable OCR text display card
app/(main)/scan.tsx              — Full scan flow (3 states: pick/processing/result)
```

### Files Modified
```
app.json                        — Added expo-image-picker plugin + permissions
app/(main)/home.tsx              — Replaced placeholder with "Scan Menu" button
```

### Verified
- [x] Home shows "Scan Menu" button
- [x] Camera opens and captures photo
- [x] Gallery picker works
- [x] Image preview shown
- [x] Vision API extracts text successfully
- [x] Extracted text displays in scrollable card
- [x] Tested with Starbucks ad — all text extracted
- [x] Error handling for no text / network errors

### Lessons Learned
- `expo-image-picker` works in Expo Go; `expo-camera` requires native build
- Resize to 1024px width before Vision API (saves bandwidth + cost)
- `ImageManipulator.manipulateAsync()` with `base64: true` does resize + encode in one step
- OCR extracts marketing labels ("NEW", "LIMITED TIME") — Claude prompt must handle this
- See `learning/day2-camera-ocr.md` for details

---

## DAY 3: Claude API Integration + Health Analysis — DONE

### Goal
Send extracted text to Claude API and get dish health scores

### What Was Built
- Claude Messages API integration (`claude-sonnet-4-20250514`)
- System prompt that filters marketing noise and extracts actual dish names
- Health scoring: 1-10 scale with estimated calories, macros, warnings, benefits
- Results screen with ranked FlatList of expandable DishCards
- Color-coded score badges (green/yellow/red)
- "Analyze with AI" button wired into scan flow
- **Security fix:** All API keys moved from hardcoded values to `.env` file

### Files Created
```
services/claude.ts              — analyzeMenu() → DishAnalysis[] (Claude Messages API)
components/DishCard.tsx          — Expandable dish card (score badge, macros, tags)
app/(main)/results.tsx           — Results screen (FlatList of DishCards)
.env                             — All API keys (gitignored)
.env.example                     — Template with placeholder values
```

### Files Modified
```
services/config.ts               — Reads from process.env (EXPO_PUBLIC_ prefix)
services/firebase.ts             — Firebase config from process.env
components/MenuTextDisplay.tsx    — Added "Analyze with AI" button + loading state
app/(main)/scan.tsx              — Added analyzing state, navigation to results
```

### Verified
- [x] Claude API key configured (in .env)
- [x] Menu text sent to Claude successfully
- [x] Structured dish analysis returned and parsed
- [x] Results screen shows dishes ranked by health score
- [x] Expandable dish details with macros/warnings/benefits
- [x] Full flow: photo → OCR → AI analysis → results
- [x] All API keys moved to .env (security fix)

### Deferred to Day 7
- Results screen UI polish (layout, visual design improvements)

### Lessons Learned
- Expo SDK 49+ has built-in .env support (`EXPO_PUBLIC_` prefix, no packages needed)
- Must restart Expo dev server after changing .env values
- Claude sometimes wraps JSON in markdown fences — parser must handle this
- `npx expo start --offline` bypasses network version checks when server is unreachable
- See `learning/day3-claude-ai.md` for details

---

## DAY 4: User Preferences + Firestore Integration — DONE

### Goal
Save scan history and add dietary preferences for personalized analysis

### What Was Built
- Firestore CRUD service (`services/firestore.ts`) — 5 functions for preferences + scan history
- Preferences screen with toggle chips for dietary restrictions (6 options) and health goals (5 options), plus text input for ingredients to avoid
- Scan history screen with FlatList of past scans, tap to view results, delete with confirmation
- Personalized Claude analysis — `analyzeMenu()` accepts optional `UserPreferences` and injects them into the system prompt
- Home screen navigation — settings icon → preferences, "Scan History" row → history
- Scan flow wired — loads preferences before Claude call, saves results to Firestore (non-blocking)

### Files Created
```
services/firestore.ts           — savePreferences, loadPreferences, saveScanResult, loadScanHistory, deleteScanResult
app/(main)/preferences.tsx      — Dietary restrictions + health goals + avoid ingredients UI
app/(main)/history.tsx           — Scan history FlatList with view/delete
learning/day4-firestore-preferences.md — Day 4 lessons learned
learning/day4-regression-tests.md      — Manual regression test script (38 test cases)
```

### Files Modified
```
services/claude.ts               — Added UserPreferences param + prompt personalization
app/(main)/home.tsx              — Settings button → preferences, added history row button
app/(main)/scan.tsx              — Loads preferences before Claude call, saves results to Firestore
```

### Verified
- [ ] Regression testing in progress (see `learning/day4-regression-tests.md`)
- [x] Preferences screen loads, saves, and persists to Firestore
- [x] Claude analysis accepts preferences and personalizes scoring
- [x] Scan results saved to Firestore
- [x] History screen loads and displays past scans

### Still TODO (manual)
- Deploy Firestore security rules in Firebase Console (currently in test mode):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Lessons Learned
- Firestore subcollections (`users/{userId}/preferences/main`, `users/{userId}/scans/{id}`) make security rules simple
- Firestore `Timestamp` must be converted with `.toDate()` on read
- Non-blocking saves (fire-and-forget with `.catch()`) keep the UI snappy
- `useFocusEffect` refreshes data on every screen visit (vs `useEffect` on mount only)
- See `learning/day4-firestore-preferences.md` for details

---

## DAY 4.5: Hybrid Nutrition API + UX Improvements — DONE

### Goal
Add verified nutrition data from USDA and improve loading UX

### What Was Built
- USDA FoodData Central API integration (`services/nutrition.ts`) — enriches Claude's AI estimates with verified nutrition data
- Hybrid approach: Claude handles qualitative analysis (health scores, warnings, benefits), USDA provides quantitative data (exact calories, macros)
- Enhanced loading experience with rotating funny messages and step indicators ("Step 1 of 2", "Step 2 of 2")
- MacroLegend component explaining "P = Protein, C = Carbs, F = Fat"
- Top Picks hero section — dishes scoring 8+ get a special highlighted card with inline benefits
- USDA Verified badges on dish cards

### Files Created
```
services/nutrition.ts               — USDA API integration (enrichDishesWithNutrition)
components/MacroLegend.tsx           — Macro explanation widget
components/HeroDishCard.tsx          — Enhanced card for top-scoring dishes
learning/day4.5-hybrid-nutrition-api-lessons-learned.md
```

### Lessons Learned
- USDA FoodData Central free tier: 1,000 requests/hour
- Search endpoint returns nutrients inline — no need for a separate detail call
- `nutritionSource: 'usda' | 'ai-estimate'` tracks data provenance per dish
- See `learning/day4.5-hybrid-nutrition-api-lessons-learned.md` for details

---

## DAY 5: UX Fixes + Multi-Page Scanning — DONE

### Goal
Fix bugs from testing, add multi-page menu scanning, improve UX

### What Was Built
- **USDA badge fix** — Detail endpoint uses different field names (`nutrient.id` + `amount`) than search endpoint (`nutrientId` + `value`). Rewrote `nutrition.ts` to extract from search response directly. Also faster: 1 API call per dish instead of 2.
- **Multi-page scanning** — Single/Multiple page toggle on scan screen. Multi mode: horizontal thumbnail strip, add/remove pages (up to 10), batch Vision API processing, combined text analysis.
- **Scan naming** — Cross-platform modal prompts user to name the scan after analysis (e.g., "McDonald's lunch"). Skip defaults to "Menu Scan".
- **History rename** — Pencil icon on each history card opens rename modal.
- **Menu verdict** — Replaced raw average score with contextual labels: "Excellent Menu" (8+), "Decent Menu" (6+), "Limited Options" (4+), "Challenging Menu" (<4).
- **Auto-save banner** — "Scan saved to your history" banner on results screen (only on fresh scans, not from history).
- **Menu photo** — Thumbnail of scanned menu at bottom of results, tap for full-screen view.
- **Preferences warning** — Info banner + confirmation dialog explaining changes only apply to future scans.
- **Full-screen loading** — Solid background overlay with "CleanFoodFinder" branding.

### Files Created
```
learning/day5-ux-fixes-multipage.md  — Day 5 lessons learned
```

### Files Modified
```
app/(main)/scan.tsx                  — Multi-page mode, scan naming modal, batch extraction
app/(main)/results.tsx               — Menu verdict, auto-save banner, photo display
app/(main)/history.tsx               — Rename modal with pencil icon
app/(main)/preferences.tsx           — Info banner + save confirmation
services/vision.ts                   — extractTextFromMultipleImages() batch OCR
services/nutrition.ts                — Rewritten: extract from search response, skip detail call
services/firestore.ts                — Added updateScanName()
components/LoadingOverlay.tsx         — Full-screen, progressText prop, CleanFoodFinder branding
components/DishCard.tsx               — USDA badge (now works)
components/HeroDishCard.tsx           — USDA badge
```

### Verified
- [x] USDA badges now appear on common dishes
- [x] Multi-page mode: toggle, thumbnail strip, batch extraction
- [x] Scan naming modal works cross-platform
- [x] History rename works
- [x] Menu verdict displays correctly
- [x] Auto-save banner shows on fresh scans only
- [x] Menu photo thumbnail visible and tappable
- [x] Preferences warning banner and confirmation dialog
- [x] Full-screen loading overlay

### Lessons Learned
- USDA search and detail endpoints use different nutrient field formats
- `alignItems: 'center'` + percentage width Image collapses on Android
- `Alert.prompt()` is iOS-only — use Modal + TextInput for cross-platform
- Google Vision API batch supports up to 16 images per call
- See `learning/day5-ux-fixes-multipage.md` for details

---

## DAY 5.5: App Store Preparation — DONE

### Goal
Prepare app for store submission: security rules, account deletion compliance, app icon

### What Was Built
- **Firestore security rules** — Replaced test-mode rules with user-scoped access control. Each user can only read/write their own data under `users/{userId}/`. Create rule on scans validates `userId` field matches auth UID. Deployed via Firebase Console (Rules tab → paste → Publish).
- **Account deletion request** — `mailto:` link on preferences screen that opens a pre-filled email to `support@cleanplate.app` with user's email and UID. Satisfies Apple & Google requirement for account deletion.
- **App icon SVG** — Magnifying glass with leaf + green checkmark badge on green gradient background. Ready for PNG export (1024x1024 for Apple, 512x512 for Google).

### Files Created
```
CleanFoodFinder/firestore.rules             — Security rules (paste into Firebase Console)
CleanFoodFinder/assets/logo-icon.svg        — App icon (convert to PNG for stores)
learning/day5.5-app-store-prep.md           — Day 5.5 lessons learned
```

### Files Modified
```
app/(main)/preferences.tsx                  — Added Linking import, account deletion section at bottom
```

### Verified
- [x] Firestore rules block unauthenticated access
- [x] Firestore rules block cross-user access
- [x] Account deletion link opens email client with pre-filled content
- [x] SVG logo renders correctly

### Still TODO (manual before launch)
- Convert logo SVG → 1024x1024 PNG
- Set up `support@cleanplate.app` email address
- Publish Firestore rules in Firebase Console

### Lessons Learned
- Firebase Console Rules Playground can simulate read/write with different auth states — no CLI needed
- Both App Store and Play Store require account deletion for apps with account creation
- `Linking.openURL('mailto:...')` works cross-platform with `encodeURIComponent()` for subject/body
- See `learning/day5.5-app-store-prep.md` for details

---

## DAY 6: EAS Build + Subscriptions + RevenueCat — IN PROGRESS

### Goal
Transition from Expo Go to native EAS builds, implement 7-day trial and subscription paywall

### Important Note
RevenueCat's `react-native-purchases` SDK requires a native build (EAS Build). Won't work in Expo Go. This day includes setting up EAS Build for the first time.

### What Was Built (Day 6A — Build Infrastructure)
- **EAS Build working on Android** — development profile builds an APK with `expo-dev-client`
- **`firebase.ts` rewritten** — `initializeAuth()` with `getReactNativePersistence(AsyncStorage)` for native builds. Clean hot-reload handling via `isNewApp` flag. Error logging (not silently swallowed).
- **Firebase Auth confirmed working** — login/signup/logout all function in native build
- **6+ EAS build failures debugged and fixed** — Google Drive paths, uncommitted code, IPv6 DNS, tar permissions (see `learning/day6-eas-build-fixes.md`)
- **Phone DNS issue diagnosed and fixed** — same IPv6 DNS problem as dev machine; fix: Android Private DNS → `dns.google`
- **RevenueCat SDK integrated (code only)** — `services/purchases.ts` wrapper, `contexts/SubscriptionContext.tsx` provider, `app/(main)/paywall.tsx` screen, types in `types/index.ts`
- **SubscriptionContext** wraps the app in `_layout.tsx` with 5-second timeout (won't block app if RevenueCat is unreachable)
- **Paywall UI complete** — plan selection (monthly/annual), purchase flow, restore purchases, legal text

### What Remains (Day 6B — RevenueCat Configuration + Testing)

**Pre-requisites (manual, outside code):**
1. [ ] **Fix phone DNS permanently** — Android Settings > Private DNS > `dns.google` (or fix router DNS to `8.8.8.8`)
2. [ ] **Finish Google Play Console enrollment** — required to create subscription products
3. [ ] **Check Apple Developer enrollment status** — blocker for iOS builds

**RevenueCat Dashboard Setup:**
4. [ ] Create app in RevenueCat dashboard (Android first)
5. [ ] Connect Google Play Console to RevenueCat (service account JSON)
6. [ ] Create products in Google Play Console: monthly (€9.99) + annual (€69.99)
7. [ ] Create offering in RevenueCat with both packages
8. [ ] Add API keys to `.env`: `EXPO_PUBLIC_RC_GOOGLE_KEY=<key>`

**Testing:**
9. [ ] Build new development APK (must commit current changes first):
   ```bash
   git add . && git commit -m "Day 6: EAS build fixes + firebase AsyncStorage + RevenueCat integration"
   NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile development --non-interactive
   ```
10. [ ] Install new APK on phone
11. [ ] Verify paywall screen loads offerings from RevenueCat
12. [ ] Test sandbox purchase flow (Google Play Console test account)
13. [ ] Verify `isPremium` / `isTrialing` state updates correctly
14. [ ] Test feature gating (scan should be blocked after trial without subscription)

**iOS (when Apple Developer enrollment is approved):**
15. [ ] Add iOS products in App Store Connect
16. [ ] Connect App Store Connect to RevenueCat
17. [ ] Add `EXPO_PUBLIC_RC_APPLE_KEY` to `.env`
18. [ ] `eas build --platform ios --profile development`
19. [ ] Test on iOS device/TestFlight

### Files Created (Day 6)
```
services/purchases.ts              — RevenueCat SDK wrapper (configure, offerings, purchase, restore)
contexts/SubscriptionContext.tsx    — Subscription state (isPremium, isTrialing, refreshStatus)
app/(main)/paywall.tsx             — Paywall UI (plan cards, benefits, purchase, restore, legal)
learning/day6-eas-build-fixes.md   — 5 issues diagnosed and fixed (Google Drive, git, IPv6, tar, phone DNS)
_dns-fix.js                        — IPv4 DNS preload for EAS CLI (gitignored, easignored)
eas.json                           — Build profiles: development (APK), preview (APK), production
```

### Files Modified (Day 6)
```
services/firebase.ts               — initializeAuth + getReactNativePersistence + AsyncStorage persistence
services/config.ts                 — Added RC_GOOGLE_KEY + RC_APPLE_KEY exports
app/_layout.tsx                    — Wrapped app in SubscriptionProvider
types/index.ts                     — Added SubscriptionStatus type
app.json                           — Added scheme, bundleIdentifier, package, edgeToEdge, EAS projectId
.gitignore                         — Added _dns-fix.js
.easignore                         — Added _dns-fix.js
package.json                       — Added expo-dev-client, react-native-purchases, @react-native-async-storage/async-storage
```

### Uncommitted Changes (must commit before next build)
```
contexts/SubscriptionContext.tsx    — Timeout protection for RevenueCat init
learning/day6-eas-build-fixes.md   — Added Issue 5 (phone DNS)
services/firebase.ts               — initializeAuth with AsyncStorage (was getAuth)
services/purchases.ts              — Error handling improvements
```

### Verified
- [x] EAS Build succeeds (development profile, Android APK)
- [x] App installs and launches on physical Android device
- [x] Firebase Auth works in native build (login, signup, logout)
- [x] Firebase Auth persists sessions across app restarts (AsyncStorage)
- [x] Firestore reads/writes work in native build
- [x] All existing features work (scan, analysis, history, preferences)
- [x] RevenueCat SDK imports without crashing (graceful fallback when not configured)
- [x] Paywall UI renders correctly
- [ ] RevenueCat configured in dashboard (NEXT)
- [ ] Sandbox purchase tested (NEXT)
- [ ] Feature gating enforced (NEXT)
- [ ] iOS build (BLOCKED — Apple Developer enrollment pending)

### Lessons Learned
- Firebase v12 **DOES** export `getReactNativePersistence` from `firebase/auth` (earlier Day 1 note was wrong)
- `initializeAuth` must only be called once — use `getApps().length === 0` check, NOT try/catch for flow control
- TypeScript `.d.ts` for `firebase/auth` doesn't include RN-specific exports — use `// @ts-ignore` for `getReactNativePersistence`
- `getAuth(app)` in RN wrapper logs "without providing AsyncStorage" warning AND initializes without persistence — never use as primary init
- The IPv6 DNS issue affects BOTH the dev machine (Node.js `undici`) AND the phone (Android system resolver) — same root cause, different symptoms
- Chrome on Android uses DNS-over-HTTPS internally, bypassing broken system DNS — that's why browser works but app doesn't
- `requireCommit: true` in `eas.json` is essential on Windows (fixes 2 separate issues)
- See `learning/day6-eas-build-fixes.md` for all 5 issues with full root cause analysis

---

## DAY 7: Sharing + Polish + TestFlight — PENDING

### Goal
Sharing, UI overhaul, App Store assets, TestFlight upload

### Tasks
- UI overhaul (user providing design examples)
- Generate shareable image cards (Instagram Story format 1080x1920)
- Share sheet integration (expo-sharing)
- App icon design (1024x1024)
- Screenshots for App Store (6.7" display)
- App Store metadata (description, keywords, privacy policy)
- EAS Build for TestFlight
- Internal testing group (3-5 beta testers)

---

## Cost Summary

**One-Time Costs:**
- Apple Developer Program: $99/year
- Domain (optional): $12/year

**Monthly Costs (at 1,000 users, 5,000 scans/month):**
- Firebase: $0-25
- Google Cloud Vision: $6
- Claude API: $10
- RevenueCat: $0
- Total: ~$16-41/month

**Break-even:** 2-4 paid subscribers

---

## Project Structure (Current — after Day 6A)

```
CleanFoodFinder/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root: AuthProvider + SubscriptionProvider + auth redirect
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/                   # Auth screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx        # Welcome screen
│   └── (main)/                   # Authenticated screens
│       ├── _layout.tsx
│       ├── home.tsx              # Home: scan button, history row, settings + logout icons
│       ├── scan.tsx              # Single/multi-page scan flow + naming modal (Day 5)
│       ├── results.tsx           # Menu verdict, Top Picks, photo display, auto-save banner (Day 5)
│       ├── dish-detail.tsx       # Individual dish deep dive
│       ├── preferences.tsx       # Dietary restrictions, goals, avoid ingredients, account deletion (Day 5.5)
│       ├── history.tsx           # Scan history with rename + delete (Day 5)
│       └── paywall.tsx           # Subscription paywall — plan cards, purchase, restore (Day 6)
├── services/
│   ├── firebase.ts               # Firebase init (initializeAuth + AsyncStorage persistence, Day 6 fix)
│   ├── auth.ts                   # Auth functions
│   ├── config.ts                 # API key exports (from .env, incl RevenueCat + USDA)
│   ├── vision.ts                 # Google Vision OCR — single + batch multi-page (Day 5)
│   ├── claude.ts                 # Claude AI health analysis (accepts UserPreferences)
│   ├── nutrition.ts              # USDA FoodData Central enrichment (Day 4.5, fixed Day 5)
│   ├── firestore.ts              # Firestore CRUD: preferences + scan history + rename (Day 5)
│   └── purchases.ts              # RevenueCat SDK wrapper — configure, offerings, purchase, restore (Day 6)
├── contexts/
│   ├── AuthContext.tsx            # Auth state management
│   └── SubscriptionContext.tsx    # Subscription state (isPremium, isTrialing) with 5s timeout (Day 6)
├── components/
│   ├── LoadingOverlay.tsx         # Full-screen loading with rotating messages + progress (Day 5)
│   ├── ScanButton.tsx             # Primary/secondary action button
│   ├── MenuTextDisplay.tsx        # OCR text + "Analyze with AI" button
│   ├── DishCard.tsx               # Expandable dish card with USDA badge (Day 4.5)
│   ├── HeroDishCard.tsx           # Top Picks hero card for 8+ scores (Day 4.5)
│   └── MacroLegend.tsx            # "P = Protein, C = Carbs, F = Fat" legend (Day 4.5)
├── types/
│   └── index.ts                  # All TypeScript types (incl SubscriptionStatus, nutritionSource)
├── constants/
│   └── colors.ts                 # Brand + score + hero section colors
├── learning/                     # Lessons learned per day
│   ├── day1-auth-foundation.md
│   ├── day2-camera-ocr.md
│   ├── day3-claude-ai.md
│   ├── day4-firestore-preferences.md
│   ├── day4-regression-tests.md
│   ├── day4.5-hybrid-nutrition-api-lessons-learned.md
│   ├── day5-ux-fixes-multipage.md
│   ├── day5.5-app-store-prep.md
│   └── day6-eas-build-fixes.md   # 5 issues: Drive paths, git, IPv6, tar perms, phone DNS (Day 6)
├── assets/
│   └── logo-icon.svg             # App icon SVG (convert to PNG for stores)
├── firestore.rules               # Firestore security rules (paste into Firebase Console — NOT YET DEPLOYED)
├── eas.json                      # EAS Build profiles: development (APK), preview (APK), production
├── _dns-fix.js                   # IPv4 DNS preload for EAS CLI (gitignored, easignored)
├── .env                          # API keys (gitignored) — Firebase, Vision, Claude, USDA, RevenueCat
├── .env.example                  # Template for .env
├── app.json                      # Expo config + plugins + EAS projectId
├── package.json                  # Dependencies (incl expo-dev-client, react-native-purchases, async-storage)
├── tsconfig.json                 # TypeScript config
└── .npmrc                        # legacy-peer-deps=true
```

---

## How to Resume Development

### For Day 6B (RevenueCat config + testing):
1. **Phone first:** Set Android Private DNS to `dns.google` if not already done
2. Open terminal in `CleanFoodFinder/` directory
3. Commit pending changes: `git add . && git commit -m "Day 6A: EAS build fixes + firebase AsyncStorage + RevenueCat code"`
4. Follow Day 6B checklist in the Day 6 section above
5. Check `learning/day6-eas-build-fixes.md` for all DNS/build gotchas

### For development builds (native, post-Expo Go):
```bash
# Start Metro bundler
npx expo start --dev-client

# Build new APK when native deps change
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile development --non-interactive
```

### For Expo Go (if you need to go back for quick testing):
```bash
npx expo start
# Scan QR code with Expo Go — but RevenueCat/AsyncStorage features won't work
```
