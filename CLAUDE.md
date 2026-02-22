# ## Agent Instructions

You're working inside the **WAT framework** (Workflows, Agents, Tools). This architecture separates concerns so that probabilistic AI handles reasoning while deterministic code handles execution. That separation is what makes this system reliable.

## ## The WAT Architecture

**Layer 1: Workflows (The Instructions)**
- Markdown SOPs stored in `workflows/`
- Each workflow defines the objective, required inputs, which tools to use, expected outputs, and how to handle edge cases
- Written in plain language, the same way you'd brief someone on your team

**Layer 2: Agents (The Decision-Maker)**
- This is your role. You're responsible for intelligent coordination.
- Read the relevant workflow, run tools in the correct sequence, handle failures gracefully, and ask clarifying questions when needed
- You connect intent to execution without trying to do everything yourself
- Example: If you need to pull data from a website, don't attempt it directly. Read `workflows/scrape_website.md`, figure out the required inputs, then execute `tools/scrape_single_site.py`

**Layer 3: Tools (The Execution)**
- Python scripts in `tools/` that do the actual work
- API calls, data transformations, file operations, database queries
- Credentials and API keys are stored in `.env`
- These scripts are consistent, testable, and fast

**Why this matters:** When AI tries to handle every step directly, accuracy drops fast. If each step is 90% accurate, you're down to 59% success after just five steps. By offloading execution to deterministic scripts, you stay focused on orchestration and decision-making where you excel.

## ## How to Operate

**1. Look for existing tools first**

Before building anything new, check `tools/` based on what your workflow requires. Only create new scripts when nothing exists for that task.

**2. Learn and adapt when things fail**

When you hit an error:
- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check with me before running again)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You get rate-limited on an API, so you dig into the docs, discover a batch endpoint, refactor the tool to use it, verify it works, then update the workflow so this never happens again

**3. Keep workflows current**

Workflows should evolve as you learn. When you find better methods, discover constraints, or encounter recurring issues, update the workflow. That said, don't create or overwrite workflows without asking unless I explicitly tell you to. These are your instructions and need to be preserved and refined, not tossed after one use.

## ## The Self-Improvement Loop

Every failure is a chance to make the system stronger:
1. Identify what broke
2. Fix the tool
3. Verify the fix works
4. Update the workflow with the new approach
5. Move on with a more robust system

This loop is how the framework improves over time.

## ## File Structure

**What goes where:**
- **Deliverables:** Final outputs go to cloud services (Google Sheets, Slides, etc.) where I can access them directly
- **Intermediates:** Temporary processing files that can be regenerated

**Directory layout:**

.tmp/ # Temporary files (scraped data, intermediate exports). Regenerated as needed.
tools/ # Python scripts for deterministic execution
workflows/ # Markdown SOPs defining what to do and how
.env # API keys and environment variables (NEVER store secrets anywhere else)

credentials.json, token.json # Google OAuth (gitignored)

...

**Core principle:** Local files are just for processing. Anything I need to see or use lives in cloud services. Everything in `.tmp/` is disposable.

## ## Bottom Line

You sit between what I want (workflows) and what actually gets done (tools). Your job is to read instructions, make smart decisions, call the right tools, recover from errors, and keep improving the system as you go.

Stay pragmatic. Stay reliable. Keep learning.

---

## ## CleanFoodFinder Project Memory

### Project Overview
AI-powered restaurant menu scanner app. User photographs a menu → OCR extracts text → Claude AI analyzes dishes → health scores + nutritional breakdown for each dish.

### Current Progress: Day 6 partially complete — Day 6B (RevenueCat config + testing) is NEXT
- **Day 1 (DONE):** Expo project + Firebase Auth (login/signup/logout)
- **Day 2 (DONE):** Camera (expo-image-picker) + Google Cloud Vision OCR
- **Day 3 (DONE):** Claude API health analysis + results UI + .env security fix
- **Day 4 (DONE):** Firestore CRUD, preferences screen, history screen, personalized Claude analysis, home nav wiring
- **Day 4.5 (DONE):** Hybrid nutrition API (USDA FoodData Central + Claude AI), enhanced loading UX, macro legend, USDA verified badges, Top Picks hero section
- **Day 5 (DONE):** USDA bug fix, multi-page scanning, scan naming, menu verdict, photo display, preferences warning
- **Day 5.5 (DONE):** Firestore security rules, account deletion link, app icon SVG
- **Day 6A (DONE):** EAS Build working, firebase.ts fixed for native builds, phone DNS fixed, RevenueCat code integrated, paywall UI built
- **Day 6B (NEXT):** RevenueCat dashboard setup, Google Play products, sandbox purchase testing, feature gating
- **Day 7:** Sharing, polish, TestFlight/Play Store deployment

### Platform
- **React Native + Expo SDK 54** (pivoted from SwiftUI — user has no Mac)
- **Expo Go** for testing on Android phone
- **EAS Build** for native builds later (RevenueCat, TestFlight)
- **Windows** development machine

### Key Technical Details
- Firebase JS SDK v12 (not @react-native-firebase) — registered as "Web app" in Firebase Console
- `.npmrc` has `legacy-peer-deps=true` (Firebase peer dep conflict with react-dom)
- `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` for native builds — `getAuth(app)` only as hot-reload fallback (v12 DOES export `getReactNativePersistence` from `firebase/auth`)
- `expo-image-picker` (not expo-camera) — works in Expo Go
- Images resized to 1024px width before Vision API (saves bandwidth + cost)
- All API keys in `.env` file with `EXPO_PUBLIC_` prefix (Expo built-in support, no packages needed)
- Must restart Expo dev server after changing `.env` values
- Use `npx expo start --offline` if Expo can't reach its servers
- Firestore subcollections: `users/{userId}/preferences/main` and `users/{userId}/scans/{scanId}`
- `analyzeMenu(menuText, preferences?)` in `claude.ts` — preferences are optional, backward compatible
- Non-blocking Firestore writes in scan flow (fire-and-forget with `.catch()`)
- **Hybrid nutrition system:** `enrichDishesWithNutrition(dishes)` in `nutrition.ts` — USDA API enrichment after Claude analysis
- **USDA API key:** `EXPO_PUBLIC_USDA_API_KEY` in `.env` — free tier: 1,000 requests/hour
- **Multi-step loading:** LoadingOverlay shows "Step 1 of 2" (analyzing) then "Step 2 of 2" (enriching) with rotating messages
- **Nutrition data provenance:** `nutritionSource: 'usda' | 'ai-estimate'` field tracks data source
- **lottie-react-native** installed for future animations (currently using text-based rotating messages)
- **Multi-page scanning:** `extractTextFromMultipleImages()` in `vision.ts` — batch Vision API (up to 16 images)
- **Scan naming:** cross-platform Modal (Alert.prompt is iOS-only)
- **Menu verdict labels:** "Excellent Menu" (8+), "Decent Menu" (6+), "Limited Options" (4+), "Challenging Menu" (<4)
- **`updateScanName()`** in `firestore.ts` for history rename
- **Firestore security rules** ready in `firestore.rules` (need to deploy via Firebase Console)
- **Account deletion:** `mailto:` link on preferences screen (App Store compliance)
- **App icon SVG** at `assets/logo-icon.svg` (needs PNG conversion for stores)
- **`dish-detail.tsx`** screen for individual dish deep dive
- **`onboarding.tsx`** welcome screen in auth flow
- **RevenueCat:** `services/purchases.ts` + `contexts/SubscriptionContext.tsx` — hard paywall after 7-day trial
- **RevenueCat API keys:** `EXPO_PUBLIC_RC_GOOGLE_KEY` and `EXPO_PUBLIC_RC_APPLE_KEY` in `.env`

### Day 6 Status — What's Done and What's Left

**DONE (Day 6A — Build Infrastructure):**
- EAS Build working — Android development APK builds and installs
- `firebase.ts` rewritten for native builds — `initializeAuth` + `getReactNativePersistence(AsyncStorage)`
- Firebase Auth works in native build (login/signup/logout tested)
- Phone DNS issue diagnosed and fixed (same IPv6 issue as dev machine — use Private DNS `dns.google`)
- RevenueCat SDK code integrated: `purchases.ts`, `SubscriptionContext.tsx`, `paywall.tsx`
- Paywall UI complete with plan cards, purchase flow, restore, legal text
- 4 files have uncommitted changes (must commit before next build)

**NOT DONE (Day 6B — RevenueCat Configuration):**
- RevenueCat dashboard: create app, connect Google Play, create offering
- Google Play Console: create subscription products (monthly €9.99, annual €69.99)
- Add `EXPO_PUBLIC_RC_GOOGLE_KEY` to `.env`
- Build new APK with committed changes
- Test sandbox purchase flow
- Feature gating (block scans after trial expires)
- iOS build (BLOCKED — Apple Developer enrollment pending)

**BLOCKERS:**
- Apple Developer enrollment PENDING — blocker for iOS builds and App Store Connect
- Google Play Console enrollment needs to be finished — required for subscription products
- Firestore security rules created but NOT YET DEPLOYED — deploy via Firebase Console before launch

**KEY BUILD COMMANDS:**
```bash
# Commit changes first (requireCommit enforces this)
cd C:\dev\mobile_cleaneatingmeals\CleanFoodFinder
git add . && git commit -m "Your message"

# Build with IPv4 DNS fix (required on this network)
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile development --non-interactive
```

**PHONE SETUP:**
- Android Private DNS must be set to `dns.google` (Settings > Network > Private DNS)
- OR use cellular data instead of WiFi
- Without this, ALL network requests from the app will hang (broken IPv6 DNS on WiFi)

### Project Structure
```
CleanFoodFinder/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root: AuthProvider + SubscriptionProvider + auth redirect
│   ├── index.tsx           # Entry redirect
│   ├── (auth)/             # Login, signup, onboarding screens
│   └── (main)/             # Home, scan, results, preferences, history, dish-detail, paywall
├── services/               # API integrations
│   ├── firebase.ts         # Firebase init (auth + db, config from .env)
│   ├── auth.ts             # Auth functions
│   ├── config.ts           # API key exports (from .env, incl RevenueCat)
│   ├── vision.ts           # Google Vision OCR — single + batch multi-page
│   ├── claude.ts           # Claude AI health analysis (accepts preferences)
│   ├── nutrition.ts        # USDA FoodData Central enrichment
│   ├── firestore.ts        # Firestore CRUD: preferences + scan history + rename
│   └── purchases.ts        # RevenueCat SDK wrapper (subscriptions)
├── contexts/
│   ├── AuthContext.tsx      # Auth state management
│   └── SubscriptionContext.tsx  # Subscription state (isPremium, isTrialing)
├── components/             # Reusable UI (DishCard, HeroDishCard, ScanButton, etc.)
├── constants/colors.ts     # Brand + score colors
├── types/index.ts          # All TypeScript types (incl subscription types)
├── firestore.rules         # Firestore security rules (deploy via Firebase Console)
├── eas.json                # EAS Build profiles (development, preview, production)
├── .env                    # API keys (gitignored)
└── learning/               # Lessons learned + regression tests per day
```

### Full 7-day plan reference
See `CleanFoodFinder_7Day_DevPlan.md` in project root (located at `c:\dev\mobile_cleaneatingmeals\CleanFoodFinder_7Day_DevPlan.md`).

### How to resume next session (Day 6B)
1. Read this CLAUDE.md for full context
2. **Phone DNS:** Ensure Android Private DNS is set to `dns.google` before testing
3. **Commit uncommitted changes** — 4 modified files need committing before next build
4. Check Apple Developer enrollment status — still pending?
5. Check Google Play Console enrollment — is it complete?
6. **Day 6B sequence:**
   a. Finish Google Play Console enrollment
   b. Create subscription products in Google Play Console (monthly €9.99, annual €69.99)
   c. Create app in RevenueCat dashboard → connect Google Play
   d. Create offering in RevenueCat with both packages
   e. Copy RevenueCat Android API key → add to `.env` as `EXPO_PUBLIC_RC_GOOGLE_KEY`
   f. Commit all changes → build new APK → install → test paywall
   g. Test sandbox purchase with Google Play test account
   h. Wire feature gating (block scans when trial expired and no subscription)
7. Deploy Firestore security rules via Firebase Console before any public release
8. Check `learning/day6-eas-build-fixes.md` for all build/DNS gotchas
