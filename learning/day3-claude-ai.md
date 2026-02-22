# Day 3 — Claude API + Health Analysis

## What Was Built
- Claude API integration (Messages endpoint, claude-sonnet-4-20250514)
- Health analysis: each dish gets a score 1-10, estimated calories, macros, warnings, benefits
- Results screen with ranked dish cards (sorted by health score, highest first)
- Expandable DishCard component: tap to see macros, warnings, benefits, reasoning
- Color-coded score badges (green 8+, yellow 5-7, red 1-4)
- Full end-to-end flow: photo → OCR → "Analyze with AI" → results
- Moved all API keys from hardcoded values to `.env` file (security fix)

## Lessons Learned

### 1. Expo SDK 49+ has built-in .env support
No need for `react-native-dotenv` or any package. Just prefix variables with `EXPO_PUBLIC_` in a `.env` file and access them via `process.env.EXPO_PUBLIC_*`. Expo loads them automatically. **Must restart Expo dev server after changing .env values.**

### 2. Claude API returns markdown fences sometimes
Even when the system prompt says "respond with ONLY valid JSON", Claude occasionally wraps the response in ```json fences. The parser must strip these before `JSON.parse()`. Current implementation handles this with a regex strip.

### 3. Expo CLI `fetch failed` on startup is a network issue
`TypeError: fetch failed` during `npx expo start` happens when Expo can't reach its servers to check dependency versions. Fix: run `npx expo start --offline` to skip the remote version check. The app works fine — it only needs internet for Vision/Claude API calls.

### 4. Passing complex data between screens via params
Expo Router's `useLocalSearchParams` only handles strings. To pass the `DishAnalysis[]` array to the results screen, we `JSON.stringify()` it in the push and `JSON.parse()` it on the other side. Works fine for reasonable menu sizes (<50 dishes).

### 5. Score validation matters
Claude might return scores outside 1-10 range or non-integer values. The parser clamps scores with `Math.max(1, Math.min(10, Math.round(score)))` to ensure type safety.

## Files Created
```
services/claude.ts              — analyzeMenu() → DishAnalysis[] (Claude Messages API)
components/DishCard.tsx          — Expandable dish card (score badge, macros, tags)
app/(main)/results.tsx           — Results screen (FlatList of DishCards)
.env                             — All API keys (gitignored)
.env.example                     — Template with placeholder values
```

## Files Modified
```
services/config.ts               — Reads from process.env instead of hardcoded values
services/firebase.ts             — Firebase config from process.env
components/MenuTextDisplay.tsx    — Added "Analyze with AI" button + loading state
app/(main)/scan.tsx              — Added analyzing state + analyzeWithAI() + navigation to results
```

## Key Config
- Claude API model: `claude-sonnet-4-20250514`
- Claude API endpoint: `https://api.anthropic.com/v1/messages`
- All API keys now in `.env` with `EXPO_PUBLIC_` prefix
- Max tokens: 4096 (enough for ~30 dishes)

## UI Polish Deferred
- Results screen UI needs improvement (deferred to Day 7 polish day)
- DishCard design could be more visually appealing
- Consider adding a summary visualization (chart or gauge) at the top
