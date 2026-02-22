# CleanFoodFinder — Regression Test Script (Days 1-4)

Run the app with `npx expo start` in the `CleanFoodFinder/` directory. Open in Expo Go on your phone. Work through each section in order — later tests depend on earlier ones.

---

## TEST 1: Auth — Signup (Day 1)

- [X] **1.1** App launches and shows Login screen
- [X] **1.2** Tap "Sign Up" link → Signup screen appears
- [X] **1.3** Try submitting empty form → validation error shown
- [X] **1.4** Enter mismatched passwords → "Passwords do not match" error
- [ ] **1.5** Enter password under 6 chars → validation error
- [ ] **1.6** Enter valid email + matching password (6+ chars) → tap Sign Up
- [ ] **1.7** Account created → auto-redirected to Home screen
- [ ] **1.8** Your email is displayed on the Home screen

## TEST 2: Auth — Logout & Login (Day 1)

- [ ] **2.1** Tap logout icon (top right) → confirmation dialog appears
- [ ] **2.2** Tap "Log Out" → redirected to Login screen
- [ ] **2.3** Log in with the account you just created
- [ ] **2.4** Redirected to Home screen, email shown again
- [ ] **2.5** Try logging in with wrong password → error message shown

## TEST 3: Home Screen Navigation (Day 4)

- [ ] **3.1** Home screen shows: settings icon (top left), logout icon (top right), "Scan Menu" button, "Scan History" row
- [ ] **3.2** Tap settings icon (top left) → Preferences screen opens
- [ ] **3.3** Go back to Home
- [ ] **3.4** Tap "Scan History" → History screen opens
- [ ] **3.5** History shows empty state: "No scans yet" message

## TEST 4: Preferences — Save & Reload (Day 4)

- [ ] **4.1** Go to Preferences (settings icon from Home)
- [ ] **4.2** All chips start unselected (first time user)
- [ ] **4.3** Tap "Vegetarian" chip → it highlights green
- [ ] **4.4** Tap "Weight Loss" chip → it highlights green
- [ ] **4.5** Type "peanuts" in the ingredients field → tap + button → "peanuts" appears as a red tag
- [ ] **4.6** Type "shellfish" → tap + → "shellfish" tag appears
- [ ] **4.7** Tap "peanuts" tag → it gets removed
- [ ] **4.8** Tap "Save Preferences" → "Saved" alert appears
- [ ] **4.9** Go back to Home → go to Preferences again
- [ ] **4.10** Verify: "Vegetarian" and "Weight Loss" are still selected, "shellfish" tag is still there, "peanuts" is gone
- [ ] **4.11** Tap "Vegetarian" to deselect → tap Save → go back and return → verify it's deselected

## TEST 5: Camera & OCR (Day 2)

- [ ] **5.1** From Home, tap "Scan Menu"
- [ ] **5.2** Scan screen shows camera + gallery options
- [ ] **5.3** Tap "Choose from Gallery" → phone gallery opens
- [ ] **5.4** Pick a menu photo → image preview appears
- [ ] **5.5** Tap "Extract Menu Text" → loading overlay appears
- [ ] **5.6** Text extraction completes → menu text displayed in a card
- [ ] **5.7** Verify extracted text looks like actual menu items
- [ ] **5.8** Tap "Scan Another Menu" → resets back to pick state
- [ ] **5.9** (Optional) Tap "Take Photo" → camera opens, take photo of a menu, verify same flow works

> **Tip:** If you don't have a menu handy, Google "restaurant menu" and screenshot one from your phone.

## TEST 6: AI Analysis — Without Preferences (Day 3)

> First clear your preferences: go to Preferences, deselect everything, remove all ingredient tags, save.

- [ ] **6.1** Scan a menu → extract text → tap "Analyze with AI"
- [ ] **6.2** Loading overlay: "AI is analyzing dishes..."
- [ ] **6.3** Results screen appears with dish cards
- [ ] **6.4** Header shows dish count + average score
- [ ] **6.5** Each card shows: dish name, health score badge (color-coded), calories
- [ ] **6.6** Tap a card → it expands showing macros, benefits, warnings, reasoning
- [ ] **6.7** Dishes are sorted by health score (highest first)
- [ ] **6.8** Tap "Back to Home" → returns to Home screen

## TEST 7: AI Analysis — With Preferences (Day 4)

- [ ] **7.1** Go to Preferences → select "Vegan" + "Low Sugar" → add "cheese" to avoid → Save
- [ ] **7.2** Scan the SAME menu as Test 6 → extract text → Analyze
- [ ] **7.3** Results should differ from Test 6:
  - Non-vegan dishes should have lower scores
  - Non-vegan dishes should show warnings like "Contains meat" or "Not vegan"
  - Dishes with cheese should have a warning
  - Sugary dishes should score lower
- [ ] **7.4** Verify the personalization is noticeable (compare mentally to Test 6 results)

## TEST 8: Scan History — Save & View (Day 4)

- [ ] **8.1** Go to Home → tap "Scan History"
- [ ] **8.2** The scan(s) from Tests 6 and 7 should appear as cards
- [ ] **8.3** Each card shows: "Menu Scan", date/time, dish count, average score
- [ ] **8.4** Most recent scan is at the top
- [ ] **8.5** Tap a scan card → Results screen opens showing that scan's dishes
- [ ] **8.6** Verify dishes match what you saw when you originally scanned

## TEST 9: Scan History — Delete (Day 4)

- [ ] **9.1** Go to Scan History
- [ ] **9.2** Tap the trash icon on a scan → confirmation dialog appears
- [ ] **9.3** Tap "Cancel" → nothing deleted
- [ ] **9.4** Tap trash again → tap "Delete" → scan disappears from the list
- [ ] **9.5** Go back to Home → return to History → confirm it's still gone (persisted)

## TEST 10: Edge Cases

- [ ] **10.1** **No internet:** Turn off WiFi/data → try scanning → should show "Network error" (not crash)
- [ ] **10.2** **Empty menu text:** If OCR returns nothing → should show "No text found" error
- [ ] **10.3** **Quick navigation:** Rapidly tap between Home, Preferences, History → no crashes
- [ ] **10.4** **Preferences with no selections:** Save empty preferences → scan menu → should work like default (no crash)
- [ ] **10.5** **Kill and reopen app:** Force close Expo Go → reopen → you should still be logged in and preferences/history should persist

---

## Quick Smoke Test (5 min version)

If short on time, run only these:
1. Open app → verify logged in (or log in)
2. Settings icon → Preferences → select "Vegan" → Save → go back → return → verify "Vegan" persisted
3. Scan Menu → pick gallery photo → Extract Text → Analyze with AI → verify results show vegan warnings
4. Home → Scan History → verify the scan appears → tap to view → verify dishes load
5. Delete the scan from history → confirm it's gone

---

## Firestore Console Check (manual)

After running the tests above, verify in [Firebase Console](https://console.firebase.google.com):
1. Go to Firestore Database
2. Browse `users/{your-user-id}/preferences/main` → should show your saved restrictions/goals
3. Browse `users/{your-user-id}/scans/` → should show remaining scan documents
4. **Deploy security rules** if still in test mode:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
