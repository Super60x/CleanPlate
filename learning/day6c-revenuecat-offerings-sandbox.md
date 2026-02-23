# Day 6C — RevenueCat Offerings Fix + Sandbox Purchase Testing

## Session Summary

Picked up after Day 6B (RevenueCat dashboard + Google Play products created). The app was building and installing, auth worked, but the paywall was broken: button grayed out, users immediately blocked, no way to proceed.

### Three issues diagnosed and partially fixed this session:

---

## Issue 1: "Start 7-Day Free Trial" Button Grayed Out

**Symptom:** Paywall screen loaded, but the CTA button was disabled (grayed out). The text "Subscription plans are being set up" was NOT showing — meaning packages loaded but were empty.

**Root Cause:** Products were created under the **wrong RevenueCat app**. RevenueCat had two apps:
- **Clean Plate** — the real app, connected to Google Play, API key in `.env`
- **Test Store** — a separate sandbox/test app created while exploring the dashboard

The Monthly and Yearly products + entitlements were all configured under **Test Store**, but the app's API key (`goog_ohEBb...`) belonged to **Clean Plate** which had 0 products.

**Key Insight:** "Test Store" in RevenueCat is NOT a sandbox environment. It's a completely separate app. Products, offerings, entitlements, and API keys are all scoped to a single app. They do NOT share across apps.

**Fix:**
1. Imported Google Play subscription products into the **Clean Plate** app in RevenueCat
2. Created `premium` entitlement under Clean Plate
3. Attached products to the entitlement
4. Created `default` offering under Clean Plate with Monthly + Annual packages

**What "sandbox" actually means:** Sandbox is a **Google Play** concept, not RevenueCat. It means test purchases that don't charge real money. Enabled by adding your Google account as a **license tester** in Google Play Console → Settings → License testing.

---

## Issue 2: Products Not Linked to Offering

**Symptom:** After moving products to Clean Plate, the button was still grayed out.

**Root Cause:** Products existed under Clean Plate, and the `default` offering existed, but the **packages inside the offering didn't reference the Clean Plate products**. The "Associated Offerings" section on the product detail page showed "No associated offerings."

**Fix:** Edited the `default` offering's packages to point to the correct Clean Plate products (not Test Store products).

**Result:** Button became clickable after killing and reopening the app. No rebuild needed — offerings are fetched at runtime from RevenueCat servers.

---

## Issue 3: "The item you were attempting to purchase could not be found"

**Symptom:** Tapping the now-active "Start 7-Day Free Trial" button triggered a Google Play error: "The item you were attempting to purchase could not be found."

**Root Cause (most likely):** The APK has NOT been uploaded to any Google Play Console track. Google Play Billing only works on apps that Google Play recognizes — even for sandbox/test purchases. The billing client on the device needs to be able to look up the product in Google Play's systems, which requires:
1. An AAB/APK uploaded to at least the **Internal Testing** track in Google Play Console
2. The package name matching exactly (`com.cleanplateai.app`)
3. The Google Play subscription product IDs matching what RevenueCat sends
4. The tester's Google account added to the Internal Testing track testers list

**Status:** NOT YET FIXED. This is the first task for the next session.

---

## Architecture Understanding: How the Paywall Flow Works

```
User logs in
  → SubscriptionContext initializes RevenueCat (purchases.ts → Purchases.configure)
  → Checks subscription status (Purchases.getCustomerInfo)
  → Sets isPremium / isTrialing

User taps "Scan Menu"
  → scan.tsx useEffect checks: !isPremium && !isTrialing?
  → YES → router.replace('/(main)/paywall')
  → Paywall loads offerings (Purchases.getOfferings → offerings.current.availablePackages)
  → If packages.length === 0 → button grayed out (DEAD END)
  → If packages exist → user selects plan → Purchases.purchasePackage
  → Google Play handles the purchase UI
  → On success → refreshStatus() → isPremium = true → router.back() → can scan
```

## Key Code Locations

| File | What it does |
|------|-------------|
| `services/purchases.ts:32-43` | `getOfferings()` — fetches available packages from RevenueCat |
| `app/(main)/paywall.tsx:157-160` | CTA button disabled when `packages.length === 0` |
| `app/(main)/scan.tsx:29-33` | Paywall gate — redirects non-premium users |
| `contexts/SubscriptionContext.tsx:30-51` | Init flow — configure RC, login user, check status |

## Checklist for Next Session

### MUST DO FIRST (fix "item not found" error):
- [ ] Build a **production AAB** (`eas build --platform android --profile production`)
- [ ] Upload AAB to Google Play Console → **Internal Testing** track
- [ ] Add your Google account email as a tester on the Internal Testing track
- [ ] Verify your Google account is also a **license tester** (Settings → License testing)
- [ ] Wait for Google Play to process (~10-30 min for Internal Testing)
- [ ] Install the app from Internal Testing (or sideload the same-signed APK)
- [ ] Test the purchase flow — should show Google Play sandbox purchase dialog

### THEN:
- [ ] Verify subscription status updates after purchase (isPremium or isTrialing = true)
- [ ] Verify scan screen becomes accessible after purchase
- [ ] Test restore purchases flow
- [ ] Test with a fresh account (should hit paywall → purchase → access)

## Lesson Learned

RevenueCat's "Test Store" app is NOT a sandbox. It's a separate app entirely. Always check which RevenueCat app your API key belongs to, and make sure ALL configuration (products, entitlements, offerings) lives under that same app. The sandbox for testing purchases is controlled by Google Play Console's license testing feature, not by anything in RevenueCat.
