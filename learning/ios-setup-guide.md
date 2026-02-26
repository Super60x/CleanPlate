# iOS App Store Setup — Complete Step-by-Step Guide

Apple Developer enrollment is APPROVED. This guide walks through every screen,
every field, and every step to get Clean Plate live on the iOS App Store.

---

## Overview of Steps

1. Register Bundle ID in Apple Developer Portal
2. Set up EAS iOS credentials (auto-managed)
3. Create app in App Store Connect
4. Set up In-App Subscriptions in App Store Connect
5. Add Apple API key to RevenueCat
6. Link iOS products in RevenueCat
7. Build iOS app via EAS
8. Submit to TestFlight
9. Test sandbox purchases on iPhone

---

## Step 1 — Register Bundle ID in Apple Developer Portal

URL: https://developer.apple.com/account/resources/identifiers/list

1. Click **+** (top right)
2. Select **App IDs** → Continue
3. Select **App** → Continue
4. Fill in:
   - **Description:** Clean Plate
   - **Bundle ID:** Explicit → `com.cleanplateai.app`
   - **Capabilities:** scroll down, confirm **In-App Purchase** is checked (it's on by default)
5. Click Continue → Register

---

## Step 2 — EAS iOS Credentials (Auto-Managed)

Run in Git Bash from project folder:
```bash
cd /c/Users/Gebruiker/Dev/CleanPlate
eas credentials --platform ios
```

When prompted:
- Choose **"Managed by EAS"** (EAS handles certificates automatically — best for Windows)
- EAS will create a **Distribution Certificate** and **Provisioning Profile** on Apple's servers
- You do not need a Mac for this

---

## Step 3 — Create App in App Store Connect

URL: https://appstoreconnect.apple.com/apps → click **+** → **New App**

### New App form fields:
| Field | Value |
|---|---|
| Platforms | iOS |
| Name | Clean Plate |
| Primary Language | English (U.S.) |
| Bundle ID | com.cleanplateai.app ← (appears after Step 1) |
| SKU | clean-plate-001 (your internal reference, not shown to users) |
| User Access | Full Access |

Click **Create**.

---

### App Information tab (left sidebar):

| Field | Value |
|---|---|
| Name | Clean Plate |
| Subtitle | Healthy Menu Scanner (optional, max 30 chars) |
| Category (Primary) | Food & Drink |
| Category (Secondary) | Health & Fitness |
| Content Rights | "This app does not contain, show, or access third-party content" |

---

### Pricing and Availability tab:

| Field | Value |
|---|---|
| Price | Free (the app is free — revenue comes from subscriptions) |
| Availability | All territories (or limit as needed) |

---

### App Privacy tab:

You'll need a **Privacy Policy URL** before submitting.
Options: use a free generator like https://www.privacypolicygenerator.info

Data types to declare:
- **Contact Info** → Email Address → Used to: App Functionality (login)
- **Usage Data** → collected for app functionality
- **Identifiers** → User ID (Firebase UID)

---

### Age Rating tab:

Answer the questionnaire:
- No violent content, no adult content, no gambling
- Result: likely **4+** (suitable for all ages)

---

## Step 4 — Set Up Subscriptions in App Store Connect

In App Store Connect, left sidebar → **In-App Purchases** → **Subscriptions**

### Create Subscription Group first:
- Click **Create** next to "Subscription Groups"
- Reference Name: `Clean Plate Premium`
- Click Create

### Subscription 1 — Monthly:
Click **+** inside the group:

| Field | Value |
|---|---|
| Reference Name | Clean Plate Premium Monthly |
| Product ID | `cleanplate_premium_monthly` ← must match exactly |
| Duration | 1 Month |

Then click **Add Localization**:
| Field | Value |
|---|---|
| Language | English (U.S.) |
| Subscription Display Name | Clean Plate Premium |
| Description | Unlimited menu scans with personalized health scores |

Then set **Price** (Pricing tab within this product):
| Field | Value |
|---|---|
| Price | $4.99 / month (or your chosen price) |
| Currency | USD |

Click **Save** → **Submit for Review** (Apple reviews subscription metadata)

---

### Subscription 2 — Annual:
Click **+** inside the same group:

| Field | Value |
|---|---|
| Reference Name | Clean Plate Premium Annual |
| Product ID | `cleanplate_premium_annual` ← must match exactly |
| Duration | 1 Year |

Add Localization:
| Field | Value |
|---|---|
| Language | English (U.S.) |
| Subscription Display Name | Clean Plate Premium — Annual |
| Description | Best value: unlimited scans all year, personalized to your diet |

Set Price:
| Field | Value |
|---|---|
| Price | $29.99 / year (saves ~50% vs monthly) |

---

### Subscription Review Information:
Apple requires a screenshot showing the subscription paywall in context.
Take a screenshot of your paywall screen and upload it here.

---

## Step 5 — Add Apple API Key to RevenueCat

1. Go to RevenueCat dashboard: https://app.revenuecat.com
2. Select **Clean Plate** app → click **Apple** platform
3. Go to **API Keys** tab
4. Copy the Apple public API key (starts with `appl_`)
5. Add to your `.env` file:
   ```
   EXPO_PUBLIC_RC_APPLE_KEY=appl_xxxxxxxxxxxxxxxxxx
   ```

---

## Step 6 — Link iOS Products in RevenueCat

In RevenueCat dashboard → Clean Plate → **Products** tab:
1. Click **+ New Product**
2. Product Identifier: `cleanplate_premium_monthly` → Save
3. Click **+ New Product**
4. Product Identifier: `cleanplate_premium_annual` → Save

Then → **Entitlements** tab:
1. Click **premium** entitlement
2. Attach both new iOS products to it

Then → **Offerings** tab:
1. Click **default** offering
2. In the Monthly package → attach `cleanplate_premium_monthly`
3. In the Annual package → attach `cleanplate_premium_annual`

---

## Step 7 — Build iOS App via EAS

Run in Git Bash:
```bash
cd /c/Users/Gebruiker/Dev/CleanPlate
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform ios --profile production --non-interactive
```

- Build runs in EAS cloud (~15-20 min)
- No Mac required — EAS handles code signing
- Output: `.ipa` file stored on EAS servers

---

## Step 8 — Submit to TestFlight

After the build completes:
```bash
eas submit --platform ios
```

When prompted:
- Choose the build just created
- EAS uploads it to App Store Connect automatically

Then in App Store Connect → **TestFlight** tab:
1. Wait for processing (~10-30 min) — status shows "Ready to Test"
2. Go to **Internal Testing** → click **+** next to testers
3. Add your Apple ID email as a tester
4. You'll get an email → accept invite → download TestFlight app on iPhone
5. Open TestFlight → install Clean Plate

---

## Step 9 — Test Sandbox Purchases on iPhone

Apple sandbox purchases work automatically in TestFlight builds.

1. Open Clean Plate in TestFlight
2. Navigate to paywall
3. Tap "Start 7-Day Free Trial"
4. A sandbox purchase dialog will appear (not a real charge)
5. Sign in with your Apple ID (sandbox environment)
6. Confirm the subscription activates (isPremium = true)
7. Test restore purchases

---

## Checklist Summary

- [ ] Bundle ID registered in Apple Developer Portal
- [ ] EAS credentials set up (`eas credentials --platform ios`)
- [ ] App created in App Store Connect
- [ ] Privacy Policy URL ready
- [ ] Both subscription products created in App Store Connect
- [ ] Subscription screenshots uploaded
- [ ] RevenueCat Apple API key in `.env`
- [ ] iOS products linked in RevenueCat entitlement + offering
- [ ] iOS production build completed via EAS
- [ ] Build submitted to TestFlight
- [ ] Yourself added as internal tester
- [ ] Sandbox purchase tested successfully

---

## Key Values Reference

| Item | Value |
|---|---|
| Bundle ID | `com.cleanplateai.app` |
| App Name | Clean Plate |
| Monthly Product ID | `cleanplate_premium_monthly` |
| Annual Product ID | `cleanplate_premium_annual` |
| RevenueCat Entitlement | `premium` |
| RevenueCat Offering | `default` |
| EAS Profile | `production` |
