# Day 5.5 — App Store Preparation (Firestore Security + Account Deletion + Logo)

## What Was Built
- Firestore security rules — user-scoped rules replacing test mode, deployed via Firebase Console
- Account deletion request link — pre-filled mailto: link on the preferences screen (App Store requirement)
- App icon SVG — magnifying glass + leaf + checkmark design, ready for PNG export

## Lessons Learned

### 1. Firestore security rules can be deployed via Firebase Console (no CLI needed)
No need to install `firebase-tools` or set up `firebase.json` for just rules deployment. Go to Firebase Console → Firestore → Rules tab → paste rules → Publish. The Rules Playground in the same tab lets you simulate reads/writes with different auth states to verify.

### 2. App Store and Play Store require account deletion
Both Apple and Google require apps with account creation to provide a way to delete accounts and associated data. The simplest compliant approach: a `mailto:` link with pre-filled subject and body containing the user's email and UID. No backend or web form needed for initial launch.

### 3. Linking.openURL with mailto: works cross-platform
`Linking.openURL('mailto:...')` opens the default email client on both iOS and Android. Use `encodeURIComponent()` for subject and body to handle special characters. The user's email and UID are injected from `useAuth()` so support can identify the account.

### 4. Firestore rules validate on create vs read/update/delete
For the scans subcollection, the `create` rule includes an extra check: `request.resource.data.userId == userId`. This ensures the `userId` field in the document matches the authenticated user, preventing users from creating scans attributed to other users. Read/update/delete only need `request.auth.uid == userId` since the document is already under their path.

### 5. SVG logos can be created programmatically for app icons
When AI image generators aren't available, an SVG with gradients, shapes, and filters produces a clean vector logo. Convert to 1024x1024 PNG for Apple App Store and 512x512 for Google Play using cloudconvert.com or similar tools.

## Files Created
```
CleanFoodFinder/firestore.rules         — Firestore security rules (user-scoped, paste into Firebase Console)
CleanFoodFinder/assets/logo-icon.svg    — App icon SVG (1024x1024 viewBox)
learning/day5.5-app-store-prep.md       — This file
```

## Files Modified
```
app/(main)/preferences.tsx              — Added Linking import, handleDeleteRequest(), "Account" section with deletion link
```

## Firestore Rules Summary
```
users/{userId}/                   — Only accessible by authenticated user matching userId
  ├── preferences/{docId}         — Read/write by owner
  └── scans/{scanId}              — Read/update/delete by owner, create validates userId field
Everything else                   — Denied by default
```

## Still TODO
- Convert logo SVG to 1024x1024 PNG for App Store
- Set up `support@cleanplate.app` email before going live
- App Store metadata (description, keywords, privacy policy)
- RevenueCat subscriptions (Day 6)
