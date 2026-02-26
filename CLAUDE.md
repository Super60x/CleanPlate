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

### Current Progress: Day 6 mostly complete — Day 6D (sandbox purchase testing) is NEXT
- **Day 1 (DONE):** Expo project + Firebase Auth (login/signup/logout)
- **Day 2 (DONE):** Camera (expo-image-picker) + Google Cloud Vision OCR
- **Day 3 (DONE):** Claude API health analysis + results UI + .env security fix
- **Day 4 (DONE):** Firestore CRUD, preferences screen, history screen, personalized Claude analysis, home nav wiring
- **Day 4.5 (DONE):** Hybrid nutrition API (USDA FoodData Central + Claude AI), enhanced loading UX, macro legend, USDA verified badges, Top Picks hero section
- **Day 5 (DONE):** USDA bug fix, multi-page scanning, scan naming, menu verdict, photo display, preferences warning
- **Day 5.5 (DONE):** Firestore security rules, account deletion link, app icon SVG
- **Day 6A (DONE):** EAS Build working, firebase.ts fixed for native builds, phone DNS fixed, RevenueCat code integrated, paywall UI built
- **Day 6B (DONE):** Google Play Console enrollment, subscription products created, RevenueCat dashboard configured, service account connected
- **Day 6C (DONE):** Fixed offerings not loading (products were under wrong RC app "Test Store" instead of "Clean Plate"), fixed offering packages not linked to products
- **Day 6D (NEXT):** Upload AAB to Internal Testing track, test sandbox purchases, verify subscription flow end-to-end
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

**DONE (Day 6B — Play Store + RevenueCat Dashboard):**
- Google Play Console enrollment completed
- Production AAB built and uploaded to Google Play Console
- Subscription products created (`cleanplate_premium_monthly`, `cleanplate_premium_annual`)
- RevenueCat app configured with products, `premium` entitlement, `default` offering
- Service account JSON uploaded, all 3 permission checks green
- API key in `.env`: `EXPO_PUBLIC_RC_GOOGLE_KEY=goog_ohEBb...`

**DONE (Day 6C — Offerings Fix):**
- Fixed: products were under wrong RevenueCat app ("Test Store" instead of "Clean Plate")
- Fixed: offering packages not linked to Clean Plate products
- Paywall now loads offerings and shows plan cards with real prices
- Feature gating works (non-premium users redirected to paywall on scan)

**NOT DONE (Day 6D — Sandbox Purchase Testing):**
- Upload AAB to Google Play Console **Internal Testing** track (required for Google Play Billing to work)
- Add Google account as tester on Internal Testing track
- Test sandbox purchase flow (currently gives "item not found" error)
- Verify subscription status updates after purchase
- Test restore purchases flow
- iOS build (Apple Developer enrollment now APPROVED — ready to proceed)

**BLOCKERS:**
- ~~Apple Developer enrollment PENDING~~ — **APPROVED** ✓ (unblocked Feb 2026)
- Firestore security rules created but NOT YET DEPLOYED — deploy via Firebase Console before launch

**iOS NEXT STEPS (now unblocked):**
1. Add Apple credentials to EAS: `eas credentials --platform ios`
   - EAS will auto-generate provisioning profile + signing certificate (choose "managed")
2. Create app in App Store Connect: https://appstoreconnect.apple.com
   - New App → iOS → Bundle ID: `com.cleanplateai.app` → name: "Clean Plate"
3. Add RevenueCat Apple API key to `.env`: `EXPO_PUBLIC_RC_APPLE_KEY=appl_xxx`
   - Get from RevenueCat dashboard → Clean Plate app → API Keys
4. Configure RevenueCat iOS products:
   - App Store Connect → Subscriptions → create `cleanplate_premium_monthly` + `cleanplate_premium_annual`
   - RevenueCat dashboard → link iOS products to `premium` entitlement in `default` offering
5. Build iOS: `NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform ios --profile production --non-interactive`
6. Submit to TestFlight: `eas submit --platform ios`
7. Add yourself as TestFlight internal tester → test sandbox purchase flow on iOS
- See `learning/day7-dev-workflow-builds.md` for dev build workflow explanation

**KEY BUILD COMMANDS:**
```bash
# Commit changes first (requireCommit enforces this)
cd C:\Users\Gebruiker\Dev\CleanPlate
git add . && git commit -m "Your message"

# Build with IPv4 DNS fix (required on this network)
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile production --non-interactive
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

### How to resume next session (Day 7 — UI Polish + iOS Setup)
1. Read this CLAUDE.md for full context
2. **Phone DNS:** Ensure Android Private DNS is set to `dns.google` before testing
3. **The one blocker:** Tapping "Start 7-Day Free Trial" gives "item not found" because no AAB is on Google Play Internal Testing track
4. **Day 6D sequence:**
   a. Build production AAB: `NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile production --non-interactive`
   b. Upload AAB to Google Play Console → Internal Testing → Create release → Publish
   c. Add your Google account as tester on Internal Testing track (Testers tab → email list)
   d. Verify license testing: Play Console → Settings → License testing → your email listed
   e. Wait 10-30 min for Google Play to process
   f. Install app → paywall → tap purchase → Google Play sandbox dialog should appear
   g. Complete sandbox purchase → verify scan screen loads (isPremium = true)
   h. Test restore purchases flow
5. **If "item not found" persists:** Check package name match (`com.cleanplateai.app`), product ID match, subscriptions are Active (not Draft), clear Google Play Store cache on phone
6. **After purchases work:** Move to Day 7 (sharing, UI polish, store assets)
7. Deploy Firestore security rules via Firebase Console before any public release
8. Check `learning/day6c-revenuecat-offerings-sandbox.md` for today's diagnosis
9. Check `learning/day6-eas-build-fixes.md` for all build/DNS gotchas
