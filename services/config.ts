// API keys loaded from .env file (EXPO_PUBLIC_ prefix)
// See .env.example for required variables

export const VISION_API_KEY = process.env.EXPO_PUBLIC_VISION_API_KEY ?? '';
export const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
export const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY ?? '';

// RevenueCat (subscriptions)
export const RC_GOOGLE_KEY = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY ?? '';
export const RC_APPLE_KEY = process.env.EXPO_PUBLIC_RC_APPLE_KEY ?? '';
