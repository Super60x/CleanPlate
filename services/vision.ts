import * as ImageManipulator from 'expo-image-manipulator';
import { VISION_API_KEY } from './config';

const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

/**
 * Extract text from an image using Google Cloud Vision API.
 * Resizes the image first to reduce bandwidth and API cost.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  // Step 1: Resize image to max 1024px width (saves bandwidth + faster API response)
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!manipulated.base64) {
    throw new Error('Failed to convert image to base64.');
  }

  // Step 2: Call Google Cloud Vision API
  const body = {
    requests: [
      {
        image: { content: manipulated.base64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Please check your internet connection.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message ?? `API error (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();

  // Step 3: Extract text from response
  const fullText = data.responses?.[0]?.fullTextAnnotation?.text;

  if (!fullText) {
    throw new Error('No text found in this image. Try a clearer photo of the menu.');
  }

  return fullText.trim();
}

export interface BatchOCRResult {
  pageIndex: number;
  text: string | null;
  error?: string;
}

/**
 * Extract text from multiple images using Google Cloud Vision batch API.
 * Processes up to 16 images per API call. Reports progress via callback.
 */
export async function extractTextFromMultipleImages(
  imageUris: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ combinedText: string; results: BatchOCRResult[] }> {
  const total = imageUris.length;
  const results: BatchOCRResult[] = [];

  // Step 1: Resize all images (batches of 4 to manage memory)
  const resizedImages: { base64: string; index: number }[] = [];
  const RESIZE_BATCH = 4;

  for (let i = 0; i < imageUris.length; i += RESIZE_BATCH) {
    const batch = imageUris.slice(i, i + RESIZE_BATCH);
    const resized = await Promise.all(
      batch.map(async (uri, batchIdx) => {
        const globalIdx = i + batchIdx;
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          if (!manipulated.base64) throw new Error('Base64 conversion failed');
          return { base64: manipulated.base64, index: globalIdx };
        } catch {
          results.push({ pageIndex: globalIdx, text: null, error: 'Image processing failed' });
          return null;
        }
      })
    );
    resizedImages.push(...resized.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  // Step 2: Send to Vision API in batches of 16
  const VISION_BATCH = 16;
  let processedCount = 0;

  for (let i = 0; i < resizedImages.length; i += VISION_BATCH) {
    const batch = resizedImages.slice(i, i + VISION_BATCH);

    const body = {
      requests: batch.map(img => ({
        image: { content: img.base64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      })),
    };

    try {
      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        for (const img of batch) {
          results.push({ pageIndex: img.index, text: null, error: `API error (${response.status})` });
        }
      } else {
        const data = await response.json();
        for (let j = 0; j < batch.length; j++) {
          const fullText = data.responses?.[j]?.fullTextAnnotation?.text;
          results.push({
            pageIndex: batch[j].index,
            text: fullText?.trim() || null,
            error: fullText ? undefined : 'No text found in this page',
          });
        }
      }
    } catch {
      for (const img of batch) {
        results.push({ pageIndex: img.index, text: null, error: 'Network error' });
      }
    }

    processedCount += batch.length;
    onProgress?.(processedCount, total);
  }

  // Step 3: Sort by page index and combine text
  results.sort((a, b) => a.pageIndex - b.pageIndex);

  const successfulTexts = results
    .filter(r => r.text !== null)
    .map((r, idx) => `--- Page ${idx + 1} ---\n${r.text}`)
    .join('\n\n');

  if (!successfulTexts) {
    throw new Error('Could not extract text from any page. Try clearer photos.');
  }

  return { combinedText: successfulTexts, results };
}
