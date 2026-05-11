# Platform Branching Strategy

## Objective
Keep iOS and Android builds permanently isolated so that changes to one platform cannot break the other. A broken Android release is never acceptable while iOS work is in progress, and vice versa.

## Core Rule
**Branch before you touch anything platform-specific. Never work on iOS directly on `main`.**

## Branch Structure

```
main ──●──●──●──────────────────────────────── Android safe zone ✅
                │
                └──●──●──●──●── ios-release    iOS work in progress
                                │
                        merge only after Android build verified
```

- **`main`** — Android production state. Always buildable. Android builds always come from here.
- **`ios-release`** — all iOS work. Branch from `main`. Merge back only after Android is verified.

---

## When Android Test Is Required

Run a full Android build only when native config is touched. Not for every iOS commit.

| What changed | Android test needed? |
|---|---|
| `app.config.js` plugins array | **YES** |
| `eas.json` | **YES** |
| New npm package with native code installed | **YES** |
| Shared JS logic without `Platform.OS` guard | **YES** |
| App Store Connect metadata | No |
| TestFlight notes / screenshots | No |
| Code guarded by `Platform.OS === 'ios'` | No |
| Subscription pricing / free trial config | No |
| App icon PNG (no plugin change) | No |

---

## Workflow: Starting iOS Work

**Trigger:** Any iOS-specific task — submission, TestFlight, App Store fix, iOS-only feature.

```bash
# 1. Make sure main is up to date
git checkout main
git pull

# 2. Create iOS branch
git checkout -b ios-release

# 3. Do iOS work here
# ... commits, fixes, submissions ...

# 4. Build iOS
NODE_OPTIONS="--require ./_dns-fix.js" eas build --profile ios-production --platform ios --non-interactive

# 5. Submit iOS
eas submit --profile ios-production --platform ios
```

---

## Workflow: Android Update

**Trigger:** Any Android-specific task — Play Store update, Android bug fix, new Android feature.

```bash
# Always from main — never from ios-release
git checkout main

# Build Android
NODE_OPTIONS="--require ./_dns-fix.js" eas build --profile android-production --platform android --non-interactive

# Submit Android
eas submit --profile android-production --platform android
```

---

## Workflow: Keeping ios-release Current with main

When main gets new commits (e.g. shared feature work), bring them into the iOS branch:

```bash
git checkout ios-release
git merge main
# Resolve any conflicts — then continue iOS work
```

---

## Workflow: Merging ios-release → main (iOS Approved)

**Only do this when the iOS app is approved and ready.**

```bash
# Step 1: Test Android FROM the ios-release branch
git checkout ios-release
NODE_OPTIONS="--require ./_dns-fix.js" eas build --profile android-production --platform android --non-interactive

# Step 2: If Android passes → merge
git checkout main
git merge ios-release
git push

# Step 3: Verify Android one more time from main
NODE_OPTIONS="--require ./_dns-fix.js" eas build --profile android-production --platform android --non-interactive
```

---

## Emergency: Android Broke After Merge

```bash
# Option A — Revert the merge (safe, creates new commit)
git checkout main
git revert -m 1 HEAD
git push

# Option B — Hard reset to before the merge (destructive)
git checkout main
git reset --hard origin/main
git push --force
```

Go back to `ios-release`, fix the breaking change, test Android again, then re-merge.

---

## Build Commands Reference

```bash
# iOS
eas build --profile ios-production --platform ios --non-interactive
eas submit --profile ios-production --platform ios

# Android
eas build --profile android-production --platform android --non-interactive
eas submit --profile android-production --platform android

# DNS fix (required on this WiFi network — IPv6 issue)
NODE_OPTIONS="--require ./_dns-fix.js" eas build ...

# Check current eas.json profiles
cat eas.json
```

## EAS Profile Summary

| Profile | Platform | Use for |
|---|---|---|
| `ios-production` | iOS | App Store submissions |
| `android-production` | Android | Play Store submissions |
| `production` | Both | Legacy — prefer named profiles |
| `development` | Android APK | Local dev testing |
| `preview` | Android APK | Internal preview |
