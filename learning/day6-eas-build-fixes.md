# EAS Build Fixes — Lessons Learned

**Date:** 2026-02-17
**Sprint:** Day 6 (EAS Build Setup)
**Status:** ✅ Build Succeeded

---

## What Happened

EAS Build failed **6+ times** before finally succeeding. Each failure pointed to a different root cause. This document captures every issue, why it happened, how it was fixed, and how to prevent it from recurring.

**Successful build:** https://expo.dev/accounts/super60/projects/CleanPlate/builds/07c634fe-2c31-44ed-8fb2-c8a943f2ef27

---

## Issue 1: Google Drive Path Breaks Tar Extraction

### Symptoms
- EAS Build fails during `PREPARE_PROJECT` phase
- Error: `tar` extraction errors on the EAS Linux build server

### Root Cause
The project was originally stored on a **Google Drive-synced path**. EAS CLI compresses the project into a `.tar.gz` archive locally on Windows, then uploads it to EAS servers where a **Linux machine** extracts it.

Cloud-synced folders cause problems because:
- **Special characters and long paths** in cloud storage paths don't translate cleanly to Linux tar
- **File locking** — Google Drive/OneDrive can lock files mid-read during compression, corrupting the archive
- **Metadata contamination** — cloud sync tools embed file metadata/permissions that don't map to Unix

### Resolution
Moved the entire project from Google Drive to a plain local path:
```
FROM: G:\My Drive\...\CleanFoodFinder\
TO:   C:\dev\mobile_cleaneatingmeals\CleanFoodFinder\
```

### Prevention
**Never develop in cloud-synced folders.** This applies to:
- Google Drive
- OneDrive
- iCloud Drive
- Dropbox

Always use a plain local path like `C:\dev\` for development. Back up to cloud separately via git push to a remote.

---

## Issue 2: Uncommitted Code — EAS Uploaded Empty Template

### Symptoms
- EAS Build completes `PREPARE_PROJECT` but the app is just the default Expo template
- No actual app screens, services, or components present in the build

### Root Cause
Inside `CleanFoodFinder/`, git was initialized but only had a bare **"Initial commit"** with scaffold files (`App.tsx`, `index.ts`). All **54 actual app files** — the entire `app/`, `services/`, `components/`, `contexts/`, `constants/`, `types/` directories — were **untracked**.

**EAS uses git to determine what to upload.** Since none of the real code was committed, EAS packaged and uploaded essentially an empty Expo template. The build "succeeded" technically but produced a useless app.

### Resolution
```bash
cd C:\dev\mobile_cleaneatingmeals\CleanFoodFinder
git add .
git commit -m "Add complete Clean Plate app (Days 1-5.5)"
```

This committed all 54 files (17,950 insertions).

### Prevention
Added `"requireCommit": true` to `eas.json`:
```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote",
    "requireCommit": true
  }
}
```

This setting **blocks `eas build` if there are uncommitted changes**, so you can never accidentally upload stale code again. EAS will print:
```
Warning! Your repository working tree is dirty.
This operation needs to be run on a clean working tree. Commit all your changes before proceeding.
```

---

## Issue 3: IPv6 DNS Timeout — Node.js Can't Reach Expo Servers

### Symptoms
- `eas build` fails immediately with:
  ```
  request to https://api.expo.dev/graphql failed, reason: connect ETIMEDOUT 2606:4700::6812:468:443
  Error: GraphQL request failed.
  ```
- `curl https://api.expo.dev` works fine
- `nslookup api.expo.dev` times out

### Root Cause
The Windows machine's DNS resolver is configured with an **IPv6 DNS server** (`2001:b88:1002::10`) that consistently times out.

**Node.js v23** uses `undici` (the built-in `fetch` implementation) which resolved `api.expo.dev` to its **IPv6 address** (`2606:4700::6812:468`) and couldn't connect. Meanwhile, `curl` worked fine because it uses a different resolver path that fell back to **IPv4** (`104.18.4.104`).

Key diagnostic commands that revealed this:
```bash
# This worked (curl uses system resolver → falls back to IPv4)
curl -4 -s https://api.expo.dev  # → "OK"

# This failed (nslookup uses IPv6 DNS server that times out)
nslookup api.expo.dev  # → timeout

# Node's dns.setDefaultResultOrder('ipv4first') didn't help
# because undici (Node 23 built-in fetch) bypasses the dns module
```

### Resolution
Created `_dns-fix.js` — a preload script that overrides `dns.lookup()` at the lowest level to force IPv4:

```javascript
const dns = require('dns');
const { lookup: originalLookup } = dns;

dns.setDefaultResultOrder('ipv4first');

// Override lookup to force IPv4 (family=4)
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === 'number') {
    options = { family: 4 };
  } else {
    options = Object.assign({}, options, { family: 4 });
  }
  return originalLookup.call(dns, hostname, options, callback);
};
```

Run EAS commands with:
```bash
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile development
```

### Prevention
Two options:
1. **Keep using the preload workaround** — `_dns-fix.js` is gitignored and easignored, so it stays local-only
2. **Fix the root cause** — Change Windows DNS to a reliable server (e.g., Google DNS `8.8.8.8` or Cloudflare `1.1.1.1`) via Settings → Network → DNS

### Important Notes
- `_dns-fix.js` is in both `.gitignore` and `.easignore` so it never gets uploaded
- `dns.setDefaultResultOrder('ipv4first')` alone does NOT work with Node.js v23 — `undici` bypasses it
- The full `dns.lookup()` override is required

---

## Issue 4: Tar Permission Denied on EAS Server (Known Bug)

### Symptoms
- Build uploads successfully to EAS (file size looks correct)
- Build fails during `PREPARE_PROJECT` phase with:
  ```
  tar -C /home/expo/workingdir/build --strip-components 1 -zxf /home/expo/workingdir/project.tar.gz
  exited with non-zero code: 2
  ```
- **Every single file** gets "Permission denied":
  ```
  tar: app/(auth): Cannot mkdir: Permission denied
  tar: app/(main): Cannot mkdir: Permission denied
  tar: app/index.tsx: Cannot open: Permission denied
  tar: assets/icon.png: Cannot open: Permission denied
  tar: services/firebase.ts: Cannot open: Permission denied
  ... (all files)
  ```

### Root Cause
This is a **known EAS CLI bug** on Windows:
- **GitHub Issue:** [expo/eas-cli#3319](https://github.com/expo/eas-cli/issues/3319)
- **GitHub Issue:** [expo/eas-cli#3057](https://github.com/expo/eas-cli/issues/3057)

When EAS CLI on Windows compresses the project using its default archiving method, the resulting `.tar.gz` file contains **incorrect Unix file permissions**. When the EAS Linux build server (Ubuntu 24.04) tries to extract this archive, every file and directory fails with "Permission denied" because the embedded permissions don't allow the build user to write.

This may have been **worsened by the project previously living on Google Drive**, which can embed non-standard file permission metadata. Even after moving to `C:\dev\`, these stale permissions could persist in the archive.

### Resolution
Added `"requireCommit": true` to `eas.json` (same setting as Issue 2).

This setting changes **how EAS archives the project** — instead of the default Windows compression, it uses the **git-tracked file list** to produce the archive. Git normalizes file permissions, so the resulting tar has clean, correct Unix permissions.

### Prevention
Keep `"requireCommit": true` permanently in `eas.json`. This single setting fixes both Issue 2 (uncommitted code) and Issue 4 (bad permissions).

---

## Files Created

1. **`_dns-fix.js`** — IPv4 DNS preload script (gitignored, easignored)

## Files Modified

1. **`eas.json`** — Added `"requireCommit": true` to `cli` section
2. **`.gitignore`** — Added `_dns-fix.js` exclusion
3. **`.easignore`** — Added `_dns-fix.js` exclusion

---

## How to Run EAS Build Going Forward

```bash
# 1. Make sure you're in the right directory
cd C:\dev\mobile_cleaneatingmeals\CleanFoodFinder

# 2. Make sure all changes are committed (requireCommit enforces this)
git add .
git commit -m "Your commit message"

# 3. Run the build with IPv4 DNS fix
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile development --non-interactive

# 4. For production builds
NODE_OPTIONS="--require ./_dns-fix.js" eas build --platform android --profile production --non-interactive
```

---

## Debugging Cheat Sheet

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ETIMEDOUT` + IPv6 address in error | IPv6 DNS failure | Use `_dns-fix.js` preload |
| "working tree is dirty" | Uncommitted changes | `git add . && git commit` |
| "Permission denied" during tar extraction | Windows archive permissions bug | Ensure `requireCommit: true` in `eas.json` |
| EAS uploads empty/wrong code | Code not committed to git | Commit everything, check `git status` |
| Build fails with path errors | Cloud-synced folder | Move project to plain local path like `C:\dev\` |

---

## Key Takeaways

1. **EAS Build = git-dependent.** If your code isn't committed, it doesn't exist to EAS.
2. **`requireCommit: true` is essential on Windows.** It fixes both the "forgot to commit" problem AND the tar permission bug. Keep it permanently.
3. **Node.js v23 + IPv6 = broken on some networks.** The `undici` fetch bypasses `dns.setDefaultResultOrder()`. Must override `dns.lookup()` directly.
4. **Never develop in cloud-synced folders.** Google Drive, OneDrive, iCloud Drive all cause archive corruption. Use `C:\dev\` and push to git remote for backup.
5. **Check EAS build logs via the JSON API** when the web dashboard doesn't show details — `eas build:view <id> --json` gives you the `logFiles` URLs.

---

## Issue 5: Login Hangs in Dev Build — Phone DNS Broken

### Symptoms
- App launches fine, Firebase Auth initializes successfully
- Login button hangs indefinitely — no success, no error
- Same WiFi network where dev machine had IPv6 DNS issues (Issue 3)

### Root Cause
The phone (on WiFi) inherits the **same broken IPv6 DNS server** (`2001:b88:1002::10`) as the dev machine. Android's system DNS resolver tries the IPv6 DNS, it times out, and `fetch()` calls to any domain that requires DNS resolution hang.

**Diagnostic proof:**
| Endpoint | DNS needed? | Result |
|---|---|---|
| `https://1.1.1.1/` (Cloudflare IP) | No | OK (200) |
| `https://www.google.com` | Yes | FAILED (timeout) |
| `https://identitytoolkit.googleapis.com/` | Yes | FAILED (timeout) |

The phone browser (Chrome) works because it uses **DNS-over-HTTPS** internally, bypassing the broken system DNS. The app uses Android's system resolver which is broken.

Switching to **cellular data** (different DNS) immediately fixed login.

### Resolution
On the Android phone: **Settings > Network & Internet > Private DNS** → set to `dns.google`. This forces DNS-over-TLS for all apps, bypassing the broken WiFi DNS.

### Prevention
- **Fix the router DNS** — change to `8.8.8.8` / `1.1.1.1` so all devices on the network work
- Or keep **Private DNS** enabled on the phone permanently
- This is the same underlying network issue as Issue 3 (dev machine IPv6 DNS)

---

## References

- [expo/eas-cli#3319](https://github.com/expo/eas-cli/issues/3319) — Tar permission denied (Windows)
- [expo/eas-cli#3057](https://github.com/expo/eas-cli/issues/3057) — Cannot mkdir permission denied (SDK 51+)
- [EAS Build archive docs](https://expo.fyi/eas-build-archive) — How EAS compresses projects
- Successful build: https://expo.dev/accounts/super60/projects/CleanPlate/builds/07c634fe-2c31-44ed-8fb2-c8a943f2ef27
