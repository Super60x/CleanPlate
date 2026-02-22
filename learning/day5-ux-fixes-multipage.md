# Day 5 — UX Fixes, USDA Bug Fix + Multi-Page Scanning

## What Was Built
- Fixed USDA "Verified" badge never appearing — root cause was mismatched API response field names between search and detail endpoints
- Fixed menu photo thumbnail not rendering on Android in results screen
- Multi-page menu scanning — users can now scan menus that span multiple pages, combining all text for a single analysis
- Scan naming prompt — after analysis, users name their scan (e.g., "McDonald's lunch") before saving
- History rename — pencil icon in scan history lets users rename past scans
- Menu verdict system — replaced raw average score with contextual labels ("Excellent Menu", "Decent Menu", etc.)
- Auto-save notification banner on results screen
- Preferences change warning — info banner + confirmation dialog explaining changes only apply to future scans
- Full-screen loading overlay with "CleanFoodFinder" branding (no background bleed-through)

## Lessons Learned

### 1. USDA FoodData Central has two different nutrient formats
The search endpoint returns nutrients inline as `{ nutrientId: 1003, value: 12.8 }`. The detail endpoint returns them as `{ nutrient: { id: 1003 }, amount: 12.8 }`. Our `extractMacros()` function used the search format (`nutrientId` / `value`) but was called on detail endpoint data. Fix: skip the detail call entirely and extract nutrients from the search response — also faster (1 API call per dish instead of 2).

### 2. Percentage width Image inside alignItems:'center' View collapses on Android
The menu photo thumbnail had `width: '100%'` inside a View with `alignItems: 'center'`. On Android, this causes the Image to collapse to zero width. Fix: remove `alignItems: 'center'` from the parent and use `textAlign: 'center'` on the label instead.

### 3. Alert.prompt() is iOS-only
For the scan naming feature, `Alert.prompt()` doesn't exist on Android. Used a cross-platform `Modal` + `TextInput` with Skip/Save buttons instead. This also gives more design control than the native alert.

### 4. expo-image-picker supports multi-select on Android
`allowsMultipleSelection: true` and `selectionLimit: 10` work in Expo Go on Android (expo-image-picker v17). Camera always returns one image at a time — for multi-page camera mode, users take one photo and it appends to the collection.

### 5. Google Vision API supports batch requests
A single API call can process up to 16 images by passing multiple objects in the `requests` array. For multi-page scanning, this means one Vision API call handles all pages instead of N separate calls. Images are resized in batches of 4 to avoid memory spikes on mobile.

### 6. JSX doesn't support backslash escapes in attribute strings
`placeholder='McDonald\'s'` causes a syntax error in JSX. Use `placeholder={"McDonald's"}` with a JS expression instead.

## Files Created
```
services/nutrition.ts (rewritten)  — Simplified USDA integration: extract nutrients from search response, skip detail call
learning/day5-ux-fixes-multipage.md — This file
```

## Files Modified
```
app/(main)/scan.tsx                — Multi-page mode (toggle, multiCollect UI, batch extraction), scan naming modal
app/(main)/results.tsx             — Menu verdict, auto-save banner, menu photo thumbnail + full-screen modal
app/(main)/history.tsx             — Rename modal with pencil icon per scan card
app/(main)/preferences.tsx         — Info banner + save confirmation dialog
services/vision.ts                 — Added extractTextFromMultipleImages() batch OCR function
services/firestore.ts              — Added updateScanName() function
components/LoadingOverlay.tsx       — Full-screen overlay, progressText prop, "CleanFoodFinder" branding
components/DishCard.tsx             — USDA verified badge (now actually works)
components/HeroDishCard.tsx         — USDA verified badge
components/MacroLegend.tsx          — Macro explanation widget (created in 4.5, verified working)
```

## Multi-Page Scan Flow
```
pick (Single/Multiple toggle)
  ├── Single: preview → processing → result → analyzing → enriching → naming → results
  └── Multi:  multiCollect (thumbnail strip) → processing (batch OCR) → result → analyzing → enriching → naming → results
```

## Key Bug Fixes
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| USDA badge never shows | Detail endpoint uses `nutrient.id` + `amount`, code expected `nutrientId` + `value` | Extract from search response instead (correct format) |
| Photo thumbnail invisible | `alignItems: 'center'` on parent collapses `%` width Image on Android | Removed alignItems from parent |
| JSX syntax error on placeholder | `\'` escape not valid in JSX attribute strings | Used `{"string"}` expression syntax |

## Still TODO
- Deploy Firestore security rules (still in test mode)
- UI overhaul (deferred — waiting for user's design examples)
- Day 5 original plan (RevenueCat subscriptions) pushed to Day 6
- Test multi-page scanning with real multi-page menus
