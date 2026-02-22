# Day 6B — Play Store + RevenueCat Setup Lessons Learned

## The Full Sequence to Get Subscriptions Working

This process is painful but you only do it once. Here's the exact order:

### Step 1: Build a Production AAB
```bash
# Must commit first (requireCommit: true in eas.json)
git add . && git commit -m "Your message"

# Build (use DNS fix if on broken WiFi)
set NODE_OPTIONS=--require ./_dns-fix.js && npx eas-cli build --platform android --profile production
```
- `autoIncrement: true` in eas.json bumps version code automatically
- Build happens in the cloud on EAS servers (~5-10 min)
- Download the .aab from expo.dev → Builds

### Step 2: Upload AAB to Google Play Console
1. Create app in Play Console (if not already done)
2. Go to **Test and release** → **Internal testing** → **Create new release**
3. Upload the .aab file
4. Add release notes → **Save and publish**

**CRITICAL GOTCHAS:**
- Package name in `app.json` must match Play Console exactly
- `com.cleanplate.app` was taken — we use `com.cleanplateai.app`
- If you get "version code already used" — rebuild (autoIncrement handles it)
- If you get "wrong signing key" — you uploaded to an app that already had a different AAB. Create a fresh app
- Google requires a **privacy policy URL** if app uses camera permissions
- Package names are locked FOREVER once an AAB is uploaded to an app

### Step 3: Create Subscription Products
Only possible AFTER uploading an AAB. Go to:
- **Monetize with Play** → **Subscriptions** → **Create subscription**

Products created:
| Product ID | Name | Price | Period |
|------------|------|-------|--------|
| `cleanplate_premium_monthly` | Clean Plate Premium Monthly | $9.99 | 1 month |
| `cleanplate_premium_annual` | Clean Plate Premium Annual | $69.99 | 1 year |

Each subscription needs a **base plan**:
- Base plan ID: `monthly-base` / `annual-base`
- Type: Auto-renewing
- Set price in USD → Google auto-converts for all countries

### Step 4: Set Up RevenueCat

1. Create project "Clean Plate" at app.revenuecat.com
2. Go to **Apps & providers** → **New app configuration** → **Google Play Store**
3. Package name: `com.cleanplateai.app`
4. Upload the **Service Account JSON** (see below)
5. Add products in **Product catalog** → **Products** (must match Play Console Product IDs exactly)
6. Create **Offering** called "default" with both packages
7. Copy the `goog_...` API key from **API keys** → put in `.env`

### Step 5: The Service Account JSON (Hardest Part)

This connects RevenueCat to Google Play. It's painful because **three completely separate systems** need to be configured, and they don't tell you what's missing — you just get vague permission errors.

#### Why This Is So Confusing

Google splits "permissions" across two unrelated consoles:

| Console | URL | What It Controls |
|---------|-----|-----------------|
| **Google Cloud Console** | console.cloud.google.com | Service account creation, API keys, IAM roles, enabling APIs |
| **Google Play Console** | play.google.com/console | App publishing, store listing, AND user/service account access to app data |

The service account is **created** in Google Cloud, but must be **invited as a user** in Play Console separately. These are different permission systems that don't sync automatically.

**Mental model:** Think of it like creating an employee badge (Google Cloud) vs giving that employee building access (Play Console). The badge alone doesn't let them in.

#### The Three Permission Layers

1. **Google Cloud IAM** — Controls what the service account can do with Google Cloud APIs (Pub/Sub, etc.)
2. **Google Cloud API Library** — Controls which APIs are even turned on for your project
3. **Play Console Users & Permissions** — Controls which users/service accounts can access your app's financial and subscription data

All three must be configured. Missing any one of them causes a different cryptic error in RevenueCat.

#### Where to Find Things (This Is NOT Obvious)

- **"API access"** in Play Console: Should be under Settings, but on newer accounts it may not appear. Use **Users and permissions** instead to invite the service account.
- **"Users and permissions"** in Play Console: This is at the ACCOUNT level (top-level sidebar), NOT inside your app. If you're looking at your app's dashboard, you won't find it.
- **"IAM"** vs **"Service Accounts"** in Google Cloud: These are two different pages under IAM & Admin. Service Accounts is where you create them. IAM is where you grant them roles.
- **Service account email**: Looks like `name@project-id.iam.gserviceaccount.com`. Find it in Google Cloud → IAM & Admin → Service Accounts.

#### Step-by-Step (All Three Systems)

**A. Google Cloud Console** (console.cloud.google.com):
1. Select your project (e.g. cleanfoodfinder-visionai)
2. IAM & Admin → Service Accounts → Create Service Account
3. Name: `revenuecat` → Create → skip role → Done
4. Click on the account → Keys tab → Add Key → JSON → download file
5. IAM & Admin → IAM → Grant Access → paste service account email → role: **Pub/Sub Admin** → Save

**B. Enable Required APIs** (Google Cloud Console → APIs & Services → Library):
- Enable **Cloud Pub/Sub API**
- Enable **Google Play Android Developer API**

**C. Google Play Console** (play.google.com/console):
1. Go to **Users and permissions** (account level, NOT inside app)
2. **Invite new users** → paste the service account email
3. Grant permissions:
   - View financial data, orders, and cancellation survey responses
   - Manage orders and subscriptions
   - View app information and download bulk reports
4. Under App permissions → add Clean Plate app
5. Invite user → Save

**D. RevenueCat:**
1. Upload the JSON file
2. Wait 2-5 minutes for permissions to propagate
3. Click refresh icon until all 3 checks are green:
   - Permissions to call subscriptions API ✅
   - Permissions to call inappproducts API ✅
   - Permissions to call monetization API ✅

### Step 6: Feature Gating (Code)
In `app/(main)/scan.tsx`, the useEffect redirects non-premium users to the paywall:
```typescript
useEffect(() => {
  if (!subLoading && !isPremium && !isTrialing) {
    router.replace('/(main)/paywall');
  }
}, [subLoading, isPremium, isTrialing]);
```

## Key Configuration Summary

| System | Setting | Value |
|--------|---------|-------|
| app.json | android.package | `com.cleanplateai.app` |
| app.json | ios.bundleIdentifier | `com.cleanplateai.app` |
| Play Console | Package name | `com.cleanplateai.app` |
| RevenueCat | Google SDK key | `goog_...` (in .env) |
| .env | EXPO_PUBLIC_RC_GOOGLE_KEY | `goog_...` |
| Play Console | Monthly product ID | `cleanplate_premium_monthly` |
| Play Console | Annual product ID | `cleanplate_premium_annual` |

## Package Name History
- `com.cleanplate.app` — original, taken/locked by old upload, cannot reuse
- `com.cleanplateai.app` — current, works fine, users never see it

## Common Errors and Fixes
| Error | Cause | Fix |
|-------|-------|-----|
| "package name already exists" | Name taken on Play Store | Use different package name |
| "version code already used" | Same version uploaded before | Rebuild (autoIncrement bumps it) |
| "wrong signing key" | Different keystore than first upload | Create new app in Play Console |
| "privacy policy required" | Camera permission triggers this | Add privacy policy URL in App content |
| "Pub/Sub API not enabled" | Missing API in Google Cloud | Enable in APIs & Services → Library |
| "Cannot validate permissions" | Service account not invited to Play Console | Invite via Users and permissions |
| PowerShell execution policy | npm.ps1 blocked | Use cmd.exe instead of PowerShell |
| npm run from wrong directory | C:\Windows\system32 | cd to project folder first |
| RevenueCat "credentials need attention" | Service account missing permissions | Check ALL three systems (Cloud IAM, Cloud APIs, Play Console Users) |
| "subscriptions API" red in RevenueCat | Service account not invited to Play Console with right permissions | Play Console → Users and permissions → invite service account email |
| "inappproducts API" red in RevenueCat | Missing Play Console permissions OR Android Publisher API not enabled | Enable androidpublisher API in Cloud Console + grant Play Console access |
| "monetization API" red in RevenueCat | Same as above | Same fix — enable APIs + grant permissions |

## Key Lesson: Google's Permission Hell

The #1 thing to remember: **Google Cloud Console and Google Play Console are separate systems with separate permission models.** Creating something in one does NOT automatically grant access in the other. You must explicitly:
1. Create the service account (Google Cloud)
2. Give it IAM roles (Google Cloud)
3. Enable the APIs it needs (Google Cloud)
4. Invite it as a user with app access (Play Console)

If RevenueCat shows red checks, systematically verify each layer. The error messages don't tell you WHICH system is misconfigured — you have to check all of them.
