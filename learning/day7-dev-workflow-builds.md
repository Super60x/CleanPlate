# Day 7 — Dev Workflow: Builds, Expo Go, and Hot Reload

## The Confusion
When you have a production app installed from the Play Store AND you try to use Expo Go
for testing UI changes, things break in confusing ways. This doc explains what actually
happens and what the correct workflow is.

---

## The Three Types of Builds

### 1. Production Build (`--profile production`)
- The APK/AAB you upload to Google Play Store for real users
- **Static** — no live updates, no Metro connection
- To see any code change: you must build and upload a new version
- **Never use this for testing your own changes**

### 2. Development Build (`--profile development`)
- An APK only for your own device — never goes to users
- **Connects to your PC's Metro server** for live JS updates
- Build it ONCE, then use it for all day-to-day development
- Hot reload works: code change → phone updates in seconds, no rebuild

### 3. Expo Go (orange app from Play Store)
- A generic development container made by Expo
- Works for most JS-only changes without any build
- **Problem:** gets intercepted by other apps that handle `exp://` links
  (like your production or dev build) — the wrong app opens when scanning QR

---

## What Went Wrong Today

1. **Production app from Play Store was installed** → it intercepted `exp://` QR links
   → Expo Go never opened, the old production app opened instead
2. **Uninstalled the production app** → correct fix, removes the conflict
3. **Turned off phone WiFi** → Expo Go uses WiFi to connect to Metro server on PC
   → nothing happened when scanning QR because phone couldn't reach PC

---

## The Correct Dev Workflow Going Forward

```
ONE-TIME SETUP:
  eas build --platform android --profile development
  → Install the resulting APK on your phone
  → This is your permanent dev app

DAILY WORKFLOW:
  1. Run: npx expo start       (in Git Bash from project folder)
  2. Open the dev app on phone → it auto-connects to Metro
  3. Make code changes in VS Code
  4. Phone updates instantly (hot reload / fast refresh)
  5. Done — no rebuilding needed
```

---

## When You DO Need to Rebuild

Only when you install a **new native package** — one that has Android/iOS native code.
Examples that require a rebuild:
- A new camera library
- A new payment SDK
- Any package with `android/` or `ios/` folders in its source

Examples that do NOT require a rebuild (instant hot reload):
- Changing styles, colors, fonts, layout
- Adding/editing screens
- Changing business logic, API calls
- Adding new JS-only packages (like lodash, date-fns, etc.)

**Rule of thumb:** If the package changelog says "run `npx pod-install`" or "rebuild your app",
you need a new build. Otherwise, hot reload handles it.

---

## Network Requirements for Hot Reload

- Phone and PC must be on the **same WiFi network**
- Windows Firewall must allow port 8081 (Metro's default port)
- If Metro asks to use port 8082 (because 8081 is busy): kill duplicate `node` processes
  ```bash
  taskkill //F //IM node.exe
  npx expo start --clear
  ```
- Your project has a known IPv6 DNS issue on your WiFi — if Firebase/API calls hang,
  set Android Private DNS to `dns.google` (Settings → Network → Private DNS)

---

## PowerShell vs Git Bash

- **PowerShell**: blocks npm scripts by default (security policy)
  - Workaround: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then retry
- **Git Bash**: works correctly for all `eas`, `npx expo`, `npm` commands
  - **Always use Git Bash** for this project
  - Navigate with Unix paths: `cd /c/Users/Gebruiker/Dev/CleanPlate`

---

## Production App vs Dev App on Same Phone

You can have both installed simultaneously — they are separate APKs.
But if they share the same package name (`com.cleanplateai.app`), Android won't allow both.
EAS development profiles can be configured to use a different suffix (e.g. `.dev`) to
allow both to coexist. This is not yet configured in this project.

---

## Bugs Found During Day 7 UI Work

### Bug 1: Rules of Hooks Violation in `_layout.tsx`
**Symptom:** Poppins font never appeared on screen even though code looked correct.
**Cause:** `useSegments()`, `useRouter()` and the auth `useEffect()` were called AFTER
`if (!fontsLoaded) return null`. React requires all hooks to be called before any
conditional return — otherwise on the render when fonts load, React throws
"rendered more hooks than previous render" and silently fails.
**Fix:** Move ALL hook calls to the top of the function, before any `if` returns.
**Rule:** Hooks first, conditional returns last. Always.

### Bug 2: `expo-splash-screen` Not Installed
**Symptom:** Dev build showed "Unable to resolve expo-splash-screen" and wouldn't bundle.
**Cause:** `expo-splash-screen` was imported in `_layout.tsx` but never installed.
**Fix:**
```bash
npx expo install expo-splash-screen
```
Always use `npx expo install` (not `npm install`) for Expo packages — it picks the
version compatible with your SDK version automatically.

### Bug 3: Dev Build Can't Connect to Metro ("Unable to load script")
**Symptom:** Dev build opens but shows red error screen, nothing loads.
**Cause:** Metro server wasn't running on the PC when the dev build tried to connect.
**Fix:**
1. Run `npx expo start` in Git Bash first
2. Wait for QR code to appear in terminal
3. THEN open the dev build on phone — it auto-connects
**Note:** This is NOT a code error. The app code is fine. It's a connectivity issue.
