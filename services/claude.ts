import { CLAUDE_API_KEY } from './config';
import {
  DishAnalysis,
  UserPreferences,
  DietaryRestriction,
  HealthGoal,
} from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeResponse {
  content: { type: string; text: string }[];
}

const dietaryLabels: Record<DietaryRestriction, string> = {
  [DietaryRestriction.Vegan]: 'Vegan',
  [DietaryRestriction.Vegetarian]: 'Vegetarian',
  [DietaryRestriction.GlutenFree]: 'Gluten-Free',
  [DietaryRestriction.DairyFree]: 'Dairy-Free',
  [DietaryRestriction.Keto]: 'Keto',
  [DietaryRestriction.LowCarb]: 'Low Carb',
};

const goalLabels: Record<HealthGoal, string> = {
  [HealthGoal.WeightLoss]: 'Weight Loss',
  [HealthGoal.MuscleGain]: 'Muscle Gain',
  [HealthGoal.LowSugar]: 'Low Sugar',
  [HealthGoal.LowSodium]: 'Low Sodium',
  [HealthGoal.HighProtein]: 'High Protein',
};

/**
 * Send menu text to Claude API and get health-scored dish analyses.
 * Optionally accepts user preferences to personalize scoring.
 */
export async function analyzeMenu(
  menuText: string,
  preferences?: UserPreferences
): Promise<DishAnalysis[]> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured. Add EXPO_PUBLIC_CLAUDE_API_KEY to your .env file.');
  }

  const systemPrompt = `You are a nutritionist AI that analyzes restaurant menu items. You receive raw OCR text from a photographed menu.

Your job:
1. Identify ACTUAL dish names from the text. Ignore marketing labels (NEW, LIMITED TIME, BESTSELLER, etc.), section headers, prices, descriptions that aren't dishes, and any non-food text.
2. For each dish, provide a health analysis.

Respond with ONLY a valid JSON array (no markdown, no code fences, no extra text). Each element must have this exact structure:
{
  "dishName": "string",
  "healthScore": number (1-10, where 10 is healthiest),
  "calories": number (estimated),
  "macros": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "sugar": number (grams),
    "sodium": number (milligrams)
  },
  "warnings": ["string array of concerns, e.g. high sugar, high sodium, deep fried"],
  "benefits": ["string array of positives, e.g. high protein, good fiber, lean meat"],
  "reasoning": "One sentence explaining the score"
}

Scoring guide:
- 9-10: Grilled lean proteins, salads with light dressing, steamed vegetables
- 7-8: Balanced meals with whole grains, moderate portions, healthy fats
- 5-6: Average dishes, some processed ingredients, moderate calories
- 3-4: High calorie, fried foods, heavy sauces, large portions
- 1-2: Deep fried, excessive sugar/sodium, very processed

Be realistic with calorie and macro estimates based on typical restaurant portions.`;

  // Inject user preferences into prompt when available
  let personalizedPrompt = systemPrompt;
  if (preferences) {
    const sections: string[] = [];

    if (preferences.dietaryRestrictions.length > 0) {
      const labels = preferences.dietaryRestrictions
        .map((r) => dietaryLabels[r])
        .join(', ');
      sections.push(
        `USER DIETARY RESTRICTIONS: ${labels}. Flag dishes that violate these restrictions in warnings. Lower the health score by 2-3 points for dishes that don't comply.`
      );
    }

    if (preferences.goals.length > 0) {
      const labels = preferences.goals.map((g) => goalLabels[g]).join(', ');
      sections.push(
        `USER HEALTH GOALS: ${labels}. Adjust scoring to favor dishes that align with these goals.`
      );
    }

    if (preferences.avoidIngredients.length > 0) {
      sections.push(
        `INGREDIENTS TO AVOID: ${preferences.avoidIngredients.join(', ')}. If a dish likely contains these, add a warning and lower the score.`
      );
    }

    if (sections.length > 0) {
      personalizedPrompt +=
        '\n\n--- USER PREFERENCES ---\n' + sections.join('\n');
    }
  }

  let response: Response;
  try {
    response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: personalizedPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze the following restaurant menu text extracted via OCR. Identify each dish and provide health scores.\n\nMenu text:\n${menuText}`,
          },
        ],
      }),
    });
  } catch {
    throw new Error('Network error. Please check your internet connection.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message ?? `Claude API error (${response.status})`;
    throw new Error(message);
  }

  const data: ClaudeResponse = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from Claude API.');
  }

  // Parse the JSON response — handle potential markdown fences
  let jsonString = text.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No dishes found in the menu. Try a clearer photo.');
  }

  // Map to DishAnalysis type with generated IDs, sorted by health score descending
  const dishes: DishAnalysis[] = parsed.map((dish: any, index: number) => ({
    id: `dish-${index}-${Date.now()}`,
    dishName: dish.dishName ?? 'Unknown Dish',
    healthScore: Math.max(1, Math.min(10, Math.round(dish.healthScore ?? 5))),
    calories: dish.calories,
    macros: dish.macros ? {
      protein: dish.macros.protein,
      carbs: dish.macros.carbs,
      fat: dish.macros.fat,
      sugar: dish.macros.sugar,
      sodium: dish.macros.sodium,
    } : undefined,
    warnings: Array.isArray(dish.warnings) ? dish.warnings : [],
    benefits: Array.isArray(dish.benefits) ? dish.benefits : [],
    reasoning: dish.reasoning ?? '',
  }));

  // Sort by health score, highest first
  dishes.sort((a, b) => b.healthScore - a.healthScore);

  return dishes;
}
