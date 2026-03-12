# Viral Mechanics — Detailed Plan

> Currently the app has **ZERO sharing functionality**. This is the #1 growth unlock.

---

## Priority 1: Shareable Dish Card

**Where:** `dish-detail.tsx` — add Share button

**What it generates:**
```
┌─────────────────────────────────┐
│  CLEAN PLATE AI                 │
│                                 │
│  Grilled Salmon Fillet          │
│          ┌──────┐               │
│          │  90  │  / 100        │
│          └──────┘               │
│  Beats 87% of menu items        │
│                                 │
│  High Protein  ·  Omega-3s     │
│  480 cal · 32g P · 4g C        │
│                                 │
│  Scan any menu → cleanplateai   │
│  [QR CODE]                      │
└─────────────────────────────────┘
```

**Why it goes viral:** People brag about healthy choices. Score + percentile triggers comparison/FOMO. QR code converts viewers to users.

**Files to create/modify:**
- `app/(main)/dish-detail.tsx` — add Share button
- NEW: `components/ShareCard.tsx` — branded card layout (rendered offscreen, captured as image)
- NEW: `services/sharing.ts` — image generation via `react-native-view-shot` + system share sheet via `expo-sharing`

**Dependencies to install:**
```bash
npx expo install expo-sharing react-native-view-shot react-native-qrcode-svg react-native-svg
```

**Implementation steps:**
1. Install dependencies
2. Build `ShareCard` component (1080x1350 for Instagram-friendly aspect ratio)
3. Add QR code pointing to `cleanplateai.com` (or app store link)
4. Capture card as image using `captureRef` from `react-native-view-shot`
5. Share via `Sharing.shareAsync(uri)` from `expo-sharing`
6. Add Share button to dish-detail UI (bottom of screen or in header)

---

## Priority 2: Menu Verdict Card

**Where:** `results.tsx` — add verdict summary + Share button

**What it generates:**
```
┌─────────────────────────────────┐
│  MENU VERDICT                   │
│  Olive Garden  ·  EXCELLENT     │
│                                 │
│  Avg Score: 7.2 / 10            │
│  Best:  Grilled Salmon (9.0)    │
│  Worst: Alfredo Pasta (3.2)     │
│  Healthy options: 8/12 (67%)    │
│                                 │
│  @cleanplateai                  │
└─────────────────────────────────┘
```

**Why it goes viral:** "I just rated my favorite restaurant" — friends debate, organic reach.

**Files to modify:**
- `app/(main)/results.tsx` — add verdict hero section + Share button
- Reuse `components/ShareCard.tsx` with a `variant="verdict"` prop

---

## Priority 3 (Post-launch): Comparison Mode
- Select 2 restaurants from history → side-by-side card → shareable
- "Chipotle vs Sweetgreen: which is actually healthier?"
- New screen: `app/(main)/compare.tsx`

## Priority 4 (Post-launch): Personal Stats
- Weekly health score trend, best finds, streak tracking
- "My clean eating week" — accountability posts on social
- New screen: `app/(main)/stats.tsx`
