// User types
export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Dietary preferences
export enum DietaryRestriction {
  Vegan = 'vegan',
  Vegetarian = 'vegetarian',
  GlutenFree = 'glutenFree',
  DairyFree = 'dairyFree',
  Keto = 'keto',
  LowCarb = 'lowCarb',
}

export enum HealthGoal {
  WeightLoss = 'weightLoss',
  MuscleGain = 'muscleGain',
  LowSugar = 'lowSugar',
  LowSodium = 'lowSodium',
  HighProtein = 'highProtein',
}

export interface UserPreferences {
  dietaryRestrictions: DietaryRestriction[];
  avoidIngredients: string[];
  goals: HealthGoal[];
}

// Score colors
export enum ScoreColor {
  Green = 'green',
  Yellow = 'yellow',
  Red = 'red',
}

// Nutrition macros
export interface Macros {
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  sodium?: number; // milligrams
}

// Individual dish analysis
export interface DishAnalysis {
  id: string;
  dishName: string;
  healthScore: number; // 1-10
  calories?: number;
  macros?: Macros;
  warnings: string[];
  benefits: string[];
  reasoning: string;
  nutritionSource?: 'usda' | 'ai-estimate'; // Data source for nutrition info
  usdaMatchConfidence?: number; // 0-100 confidence score for USDA matches
}

// Full scan result
export interface ScanResult {
  id: string;
  userId: string;
  restaurantName: string;
  menuText: string;
  dishes: DishAnalysis[];
  timestamp: Date;
  imageURL?: string;
}

// Subscription status
export interface SubscriptionStatus {
  isPremium: boolean;
  isTrialing: boolean;
  expirationDate?: Date;
  productIdentifier?: string;
}

// Helper to get score color
export function getScoreColor(score: number): ScoreColor {
  if (score >= 8) return ScoreColor.Green;
  if (score >= 5) return ScoreColor.Yellow;
  return ScoreColor.Red;
}
