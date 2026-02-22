import { DishAnalysis, Macros } from '../types';
import { USDA_API_KEY } from './config';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const SEARCH_TIMEOUT = 5000; // 5 seconds per search

// USDA search result — the search endpoint already includes nutrients inline
interface USDASearchFood {
  fdcId: number;
  description: string;
  score: number;
  dataType: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}

// Map of USDA nutrient IDs to our macro fields
const NUTRIENT_MAP: { [key: number]: keyof Macros | 'calories' } = {
  1003: 'protein',   // Protein (g)
  1005: 'carbs',     // Carbohydrate, by difference (g)
  1004: 'fat',       // Total lipid (fat) (g)
  2000: 'sugar',     // Total sugars (g)
  1093: 'sodium',    // Sodium (mg)
  1008: 'calories',  // Energy (kcal)
};

/**
 * Search USDA database for a food and return the top match with nutrients.
 * The search endpoint already includes nutrients, so no second call is needed.
 */
async function searchFood(query: string): Promise<USDASearchFood | null> {
  if (!USDA_API_KEY) {
    console.warn('USDA API key not found, skipping enrichment');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

    const response = await fetch(
      `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${USDA_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('USDA rate limit hit');
      }
      return null;
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      console.log(`USDA: no results for "${query}"`);
      return null;
    }

    const topMatch = data.foods[0] as USDASearchFood;
    console.log(
      `USDA match for "${query}": "${topMatch.description}" (score: ${topMatch.score}, type: ${topMatch.dataType}, nutrients: ${topMatch.foodNutrients?.length ?? 0})`
    );
    return topMatch;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`USDA search timed out for "${query}"`);
    } else {
      console.error('USDA search error:', error);
    }
    return null;
  }
}

/**
 * Extract macro nutrients from USDA search result's inline nutrients.
 */
function extractMacros(food: USDASearchFood): { macros: Partial<Macros>; calories: number | undefined } | null {
  const nutrients = food.foodNutrients;
  if (!nutrients || nutrients.length === 0) {
    console.log(`USDA: no nutrients in search result for "${food.description}"`);
    return null;
  }

  const macros: Partial<Macros> = {};
  let calories: number | undefined;

  for (const nutrient of nutrients) {
    const field = NUTRIENT_MAP[nutrient.nutrientId];
    if (field) {
      if (field === 'calories') {
        calories = Math.round(nutrient.value);
      } else {
        macros[field] = Math.round(nutrient.value);
      }
    }
  }

  // Only return if we have at least protein or calories
  if (calories || macros.protein) {
    console.log(
      `USDA nutrients for "${food.description}": cal=${calories}, P=${macros.protein}g, C=${macros.carbs}g, F=${macros.fat}g`
    );
    return { macros, calories };
  }

  console.log(`USDA: insufficient nutrient data for "${food.description}"`);
  return null;
}

/**
 * Clean dish name for better USDA matching.
 * Removes common menu modifiers that confuse search.
 */
function cleanDishName(dishName: string): string {
  return dishName
    .toLowerCase()
    .replace(/\b(grilled|fried|baked|roasted|steamed|sautéed|sauteed|fresh|organic|homemade|signature|our|famous|classic|special|house|deluxe|premium|artisan)\b/gi, '')
    .replace(/[®™©]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enrich Claude's dish analysis with USDA nutrition data.
 * Uses only the search endpoint (which already includes nutrients inline),
 * so we need just 1 API call per dish instead of 2.
 */
export async function enrichDishesWithNutrition(dishes: DishAnalysis[]): Promise<DishAnalysis[]> {
  if (!USDA_API_KEY) {
    console.log('No USDA API key found, returning dishes with AI estimates');
    return dishes.map(dish => ({
      ...dish,
      nutritionSource: 'ai-estimate' as const,
    }));
  }

  console.log(`Starting USDA enrichment for ${dishes.length} dishes...`);

  const enrichedDishes = await Promise.all(
    dishes.map(async (dish) => {
      try {
        // Search USDA database (nutrients come back inline)
        const cleanedName = cleanDishName(dish.dishName);
        const searchResult = await searchFood(cleanedName);

        if (!searchResult) {
          return {
            ...dish,
            nutritionSource: 'ai-estimate' as const,
          };
        }

        // Extract macros directly from search result
        const usdaData = extractMacros(searchResult);
        if (!usdaData) {
          return {
            ...dish,
            nutritionSource: 'ai-estimate' as const,
          };
        }

        // Merge: keep Claude's qualitative analysis, replace quantitative data with USDA
        return {
          ...dish,
          calories: usdaData.calories || dish.calories,
          macros: {
            ...dish.macros,
            ...usdaData.macros,
          },
          nutritionSource: 'usda' as const,
          usdaMatchConfidence: Math.round(searchResult.score),
        };
      } catch (error) {
        console.error(`Error enriching dish "${dish.dishName}":`, error);
        return {
          ...dish,
          nutritionSource: 'ai-estimate' as const,
        };
      }
    })
  );

  const usdaCount = enrichedDishes.filter(d => d.nutritionSource === 'usda').length;
  console.log(`Enriched ${usdaCount}/${dishes.length} dishes with USDA data`);

  return enrichedDishes;
}
