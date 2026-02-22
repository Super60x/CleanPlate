# Day 4 — User Preferences + Firestore Integration

## What Was Built
- Firestore CRUD service (`services/firestore.ts`) — 5 functions for preferences + scan history
- Preferences screen (`app/(main)/preferences.tsx`) — toggle chips for dietary restrictions, health goals, ingredient avoidance with Firestore persistence
- Scan history screen (`app/(main)/history.tsx`) — list past scans, tap to view results, delete with confirmation
- Personalized Claude analysis — `analyzeMenu()` now accepts optional `UserPreferences` and injects dietary restrictions, health goals, and avoided ingredients into the system prompt
- Home screen wired up — settings icon → preferences, "Scan History" row → history
- Scan flow saves results to Firestore and loads user preferences before calling Claude

## Lessons Learned

### 1. Firestore subcollection structure for user data
Used `users/{userId}/preferences/main` for a single preferences document and `users/{userId}/scans/{scanId}` for scan history. This makes security rules simple — one rule covers all user data: `match /users/{userId}/{document=**}`.

### 2. Firestore Timestamp conversion
Firestore stores timestamps as `Timestamp` objects, not JS `Date`. On read, convert with `timestamp.toDate()`. Must import `Timestamp` from `firebase/firestore` to do `instanceof` check. Always provide a fallback `new Date()` in case the field hasn't been written yet (e.g., `serverTimestamp()` is pending).

### 3. Non-blocking Firestore writes in scan flow
Save scan results with a fire-and-forget `.catch()` pattern — the user shouldn't wait for Firestore to save before seeing their results. If the save fails, the analysis still works.

### 4. useFocusEffect for data refresh
History screen uses `useFocusEffect` (from `expo-router`) instead of `useEffect` so the scan list refreshes every time the user navigates to it, not just on first mount. This ensures new scans appear immediately after scanning.

### 5. Personalizing the Claude prompt
Appended a `--- USER PREFERENCES ---` section to the system prompt with three categories:
- Dietary restrictions: "Flag dishes that violate these, lower score by 2-3 points"
- Health goals: "Adjust scoring to favor aligned dishes"
- Avoided ingredients: "Add warning and lower score if detected"
This keeps the base prompt unchanged when no preferences are set (backward compatible).

### 6. Toggle chip UI pattern
For multi-select options (restrictions, goals), used Pressable chips with active/inactive styling. State is a simple array — toggle by checking `includes()` and either filtering or appending. Simple and works well for small option sets.

## Files Created
```
services/firestore.ts           — savePreferences, loadPreferences, saveScanResult, loadScanHistory, deleteScanResult
app/(main)/preferences.tsx      — Dietary restrictions + health goals + avoid ingredients UI
app/(main)/history.tsx           — Scan history FlatList with view/delete
learning/day4-regression-tests.md — Manual regression test script (38 test cases)
```

## Files Modified
```
services/claude.ts               — Added UserPreferences param + prompt personalization
app/(main)/home.tsx              — Settings button → preferences, added history button
app/(main)/scan.tsx              — Loads preferences before Claude call, saves results to Firestore
```

## Firestore Data Structure
```
users/{userId}/
├── preferences/
│   └── main                    — { dietaryRestrictions: [], goals: [], avoidIngredients: [] }
└── scans/
    ├── {scanId1}               — { restaurantName, menuText, dishes[], timestamp, userId }
    └── {scanId2}               — ...
```

## Still TODO
- Deploy Firestore security rules in Firebase Console (currently in test mode)
- Regression testing (test script in `learning/day4-regression-tests.md`)
- Results screen UI polish (deferred to Day 7)
