# Day 2 — Camera + Google Vision OCR

## What Was Built
- Image capture via camera or gallery (expo-image-picker)
- Image resize/compression before API call (expo-image-manipulator)
- Google Cloud Vision API integration (TEXT_DETECTION endpoint)
- Full scan flow: pick image → preview → extract text → display results
- Updated home screen with "Scan Menu" navigation button

## Lessons Learned

### 1. expo-image-picker > expo-camera for Expo Go
`expo-camera` requires a custom dev client (EAS build). `expo-image-picker` works in Expo Go out of the box and handles both camera and gallery in one API. Use image-picker during development, switch to camera later if needed.

### 2. Resize images before Vision API calls
Raw phone photos are 3-12MB. Vision API accepts up to 10MB but charges per request. Resizing to 1024px width + JPEG compression (0.8 quality) brings images down to ~100-200KB with no OCR quality loss. This also makes the API call much faster.

### 3. Vision API returns `fullTextAnnotation.text` for complete OCR
The TEXT_DETECTION feature returns individual words in `textAnnotations[]` AND the full reconstructed text in `fullTextAnnotation.text`. Always use `fullTextAnnotation.text` — it preserves line breaks and reading order.

### 4. OCR text contains marketing noise
Real-world menus include labels like "NEW", "LIMITED TIME", "BESTSELLER", prices, and promotional text. The OCR extracts ALL of it. This means the AI analysis step (Day 3) must be smart enough to:
- Distinguish dish names from marketing labels
- Understand "NEW Iced Matcha Latte" means a new menu item, not a dish called "New"
- Ignore non-food content (prices, promo text, logos)
This is a key insight for prompt engineering in Day 3.

### 5. expo-image-manipulator base64 output
`ImageManipulator.manipulateAsync()` accepts a `base64: true` option that returns the image as base64 directly — no need for expo-file-system to read the file separately. Clean one-step resize + encode.

## Files Created
```
services/config.ts              — API keys (Vision API key)
services/vision.ts              — extractTextFromImage() function
components/ScanButton.tsx        — Reusable button (primary/secondary variants)
components/MenuTextDisplay.tsx   — Scrollable OCR text display card
app/(main)/scan.tsx              — Full scan flow screen (3 states: pick/processing/result)
```

## Files Modified
```
app.json                        — Added expo-image-picker plugin + permissions
app/(main)/home.tsx              — Replaced placeholder with "Scan Menu" button
```

## Key Config
- Vision API key stored in `services/config.ts`
- Google Cloud project: CleanFoodFinder-VisionAI
- Vision API endpoint: `https://vision.googleapis.com/v1/images:annotate`
- Image resize: 1024px width, JPEG 0.8 quality
