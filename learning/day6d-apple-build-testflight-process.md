# Day 6D — How Apple Builds, TestFlight & App Store Submission Work

## The Pipeline

There are **3 separate steps** to get your app to users on iOS. Each step is independent — completing one does NOT automatically trigger the next.

```
EAS Build                 EAS Submit              App Store Connect
(creates .ipa)  ──────►  (uploads to Apple)  ──►  (processing 5-30 min)
                                                        │
                                                        ▼
                                                   ┌─────────┐
                                                   │TestFlight│ ← for testing
                                                   └─────────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │ App Store     │ ← for public
                                                │ (needs review)│
                                                └──────────────┘
```

---

## Step 1: EAS Build — Creates the Binary

```bash
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform ios --profile production
```

- This builds your app on Expo's cloud servers and produces an `.ipa` file
- The `.ipa` sits on EAS servers — Apple knows nothing about it yet
- You can have many builds on EAS. They're just files waiting to be submitted.
- Builds are listed at: expo.dev → Project → Builds

**Key point:** Building ≠ submitting. Your build just sits on EAS until you explicitly submit it.

---

## Step 2: EAS Submit — Uploads to App Store Connect

```bash
NODE_OPTIONS="--require ./_dns-fix.js" eas submit --platform ios --latest
```

- `--latest` picks the most recent successful iOS build from EAS
- This uploads the `.ipa` to Apple's servers (App Store Connect)
- Uses the `ascAppId` from your `eas.json` to know which app it belongs to
- You can also specify a specific build: `eas submit --platform ios --id BUILD_ID`

**Key point:** After submission, Apple takes **5-30 minutes to process** the build. During processing, it won't appear anywhere in App Store Connect. Be patient.

---

## Step 3: App Store Connect — Two Paths

Once Apple finishes processing your build, it shows up in App Store Connect. From there, there are two independent paths:

### Path A: TestFlight (for testing)

- Go to **App Store Connect → TestFlight tab**
- Processed builds appear here automatically
- Add **internal testers** (your team — up to 25 people, no Apple review needed)
- Add **external testers** (up to 10,000 people — requires brief Apple review)
- Internal testers get new builds **immediately** after processing
- TestFlight app on iPhone auto-notifies testers when a new build is available

**Internal testers** = anyone with an App Store Connect role on your team
**External testers** = anyone with just an email address (beta users, friends, etc.)

### Path B: App Store Release (for public)

- Go to **App Store Connect → Distribution tab → iOS App Version**
- Under "Build", click the **+** button to attach a processed build
- Fill in all metadata (screenshots, description, review notes, etc.)
- Click "Submit for Review"
- Apple reviews it (usually 24-48 hours)
- After approval → goes live on the App Store

---

## The Confusion: Why Build 2 Didn't Show Up

**What happened:**
1. Built version 1.0.0 (build 1) on EAS → submitted → appeared in App Store Connect → tested on TestFlight
2. Built version 1.0.0 (build 2) on EAS → **forgot to submit** (or submit failed)
3. Went to App Store Connect → Distribution → "Add Build" → only build 1 shows

**Why:** The "Add Build" dialog under Distribution only shows **processed builds** that were successfully uploaded AND finished Apple's processing. Build 2 was still sitting on EAS, never sent to Apple.

**Fix:** Run `eas submit --platform ios --latest` to push build 2 to Apple, wait for processing, then it appears.

---

## How TestFlight Updates Work

When you submit a **new build** of the same version (e.g. 1.0.0 build 2 after build 1):
- It appears in TestFlight as a new build
- Internal testers get a push notification from TestFlight
- They open TestFlight → tap "Update" → get the new build
- The old build stays available until you expire it

You do NOT need to create a new "version" for each TestFlight build. Multiple builds can exist under version 1.0.0.

---

## Build Numbers vs Version Numbers

| Concept | Example | Meaning |
|---------|---------|---------|
| **Version** (CFBundleShortVersionString) | `1.0.0` | What users see on the App Store |
| **Build number** (CFBundleVersion) | `1`, `2`, `3` | Internal identifier, must increment |

- You can have many builds (1, 2, 3...) under the same version (1.0.0)
- Each build number must be unique and higher than the last
- EAS handles this automatically with `"autoIncrement": true` in `eas.json`
- When you're ready for a public update, bump the **version** (1.0.0 → 1.1.0)

---

## Quick Reference Commands

```bash
# Build for iOS
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform ios --profile production

# Submit latest build to App Store Connect
NODE_OPTIONS="--require ./_dns-fix.js" eas submit --platform ios --latest

# Submit a specific build by ID
NODE_OPTIONS="--require ./_dns-fix.js" eas submit --platform ios --id abc123-def456

# Check build status
eas build:list --platform ios

# Check submission status
eas submit:list --platform ios
```

---

## Checklist: Getting a New Build to TestFlight

1. [ ] Commit your code changes (`git add . && git commit`)
2. [ ] Build: `eas build --platform ios --profile production`
3. [ ] Wait for build to complete (~5 min)
4. [ ] Submit: `eas submit --platform ios --latest`
5. [ ] Wait for Apple processing (~5-30 min)
6. [ ] Check TestFlight tab in App Store Connect — new build should appear
7. [ ] Open TestFlight on iPhone → update to new build

---

## Gotchas

- **Processing time varies:** Usually 5-30 min, but can take hours during peak times or if Apple flags something
- **Export compliance:** First build of a new app may require you to answer encryption questions in App Store Connect before TestFlight works
- **Missing builds in "Add Build" dialog:** This is the Distribution tab. Check the TestFlight tab first — builds appear there before they're attachable to a version
- **Build rejected in processing:** Check your email. Apple sends processing failure notices (usually signing issues or missing entitlements)
- **EAS submit needs credentials:** First time you submit, EAS will ask for your Apple ID + app-specific password. These get cached for future submissions
