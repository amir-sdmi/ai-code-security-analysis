import { generateText } from './geminiService';
import { Recipe } from '../types/recipe';
import { generateRecipeWithGemini } from './geminiService';
import { generateRecipeImage } from './runwareService';
import { fetchUserPreferences, fetchUserRecipes, fetchSavedRecipes } from './recipeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe as ServiceRecipe } from './recipeService';
import { usePreferencesStore, DietaryProfile, SpiceLevel, CookingSkill, PreferencesState } from '@/stores/preferencesStore';
import { supabase } from '@/lib/supabase';

// Import the personalized recipe service
import { 
  getPersonalizedRecipeIdeas, 
  RecipeIdea,
  convertIdeaToRecipe 
} from './personalizedRecipeService';

// Re-export RecipeIdea for components
export type { RecipeIdea };

// Types for personalized suggestions
export interface PersonalizedSuggestion {
  id: string;
  title: string;
  reasonText: string;
  imagePrompt: string;
  accentColorType: 'healthy' | 'comfort' | 'quick' | 'adventurous';
  timeInMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string; // Generated from imagePrompt
}

export interface SeasonalInsight {
  ingredient: string;
  recipeTitle: string;
  description: string;
  imageUrl: string;
}

export interface UserProfile {
  dietaryProfile: DietaryProfile;
  allergies: string[];
  favoriteIngredients: string[];
  dislikedIngredients?: string[];
  cuisineTypes: string[];
  cookingSkill: CookingSkill;
  spiceLevel: SpiceLevel;
  cookingGoals: string[];
  cookingTimeLimit: number;
  mealPrepTimePreference?: number;
  lastViewedRecipes?: string[];
  savedRecipes?: string[];
  weeklyGoal?: number;
  weeklyProgress?: number;
}

// Cache keys with 24-hour expiry
const CACHE_KEYS = {
  PERSONALIZED_SUGGESTIONS: 'personalized_suggestions',
  SEASONAL_INSIGHTS: 'seasonal_insights',
  LAST_GENERATED: 'last_generated_timestamp'
};

// Cache duration (24 hours instead of 4 hours for card caching)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper function to create cache key for seasonal content
const createSeasonalCacheKey = (): string => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `seasonal-insights-${today}`;
};

// Helper function to check if cache is valid (within 24 hours)
const isCacheValid = (timestamp: string): boolean => {
  const cacheTime = new Date(timestamp);
  const now = new Date();
  const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

/**
 * Get personalized quick cook suggestion based on user profile
 */
export const getPersonalizedQuickCookSuggestion = async (
  userProfile: UserProfile
): Promise<ServiceRecipe> => {
  try {
    // Cache key for personalized recipe
    const cacheKey = `personalized_quick_cook`;
    
    // Check if we have a cached recipe
    const cachedRecipe = await AsyncStorage.getItem(cacheKey);
    if (cachedRecipe) {
      const parsedRecipe = JSON.parse(cachedRecipe);
      // Only use cache if it's less than 12 hours old
      if (parsedRecipe.timestamp && Date.now() - parsedRecipe.timestamp < 12 * 60 * 60 * 1000) {
        return parsedRecipe.recipe;
      }
    }
    
    // Build recipe generation parameters based on user profile and context
    const params = {
      ingredients: [],
      mealType: 'quick',
      dietaryRestrictions: [...userProfile.dietaryProfile, ...userProfile.allergies],
      cookingTime: userProfile.mealPrepTimePreference || 30,
      difficulty: getDifficultyFromSkillLevel(userProfile.cookingSkill),
      servings: 2, // Default serving size
      cuisine: getRandomCuisine(userProfile.cuisineTypes)
    };
    
    // Generate recipe using Gemini
    const recipe = await generateRecipeWithGemini(params);
    
    // Generate image using Runware
    try {
      const imageUrl = await generateRecipeImage(recipe);
      if (imageUrl) {
        recipe.image = imageUrl;
        recipe.heroImage = imageUrl;
      }
    } catch (error) {
      console.error('Failed to generate image for personalized recipe:', error);
    }
    
    // Add required properties for ServiceRecipe
    const serviceRecipe: ServiceRecipe = {
      ...recipe,
      cuisineType: params.cuisine || 'Other',
      mealType: params.mealType ? [params.mealType] : ['other'],
      dietaryInfo: params.dietaryRestrictions || []
    };
    
    // Cache the recipe
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      recipe: serviceRecipe,
      timestamp: Date.now()
    }));
    
    return serviceRecipe;
  } catch (error) {
    console.error('Error generating personalized quick cook suggestion:', error);
    throw error;
  }
};

/**
 * Get personalized cooking tips based on user profile and history
 */
export const getPersonalizedCookingTips = async (userProfile: UserProfile): Promise<string[]> => {
  try {
    // Create prompt for Gemini
    const prompt = `Generate 3 personalized cooking tips for a home cook with the following profile:
- Cooking skill level: ${userProfile.cookingSkill}
- Dietary preferences: ${Array.isArray(userProfile.dietaryProfile) ? userProfile.dietaryProfile.join(', ') : userProfile.dietaryProfile}
- Preferred cuisines: ${userProfile.cuisineTypes.join(', ')}
- Meal prep time preference: ${userProfile.mealPrepTimePreference} minutes

Format your response as a JSON array of strings, each containing a single tip. Keep each tip concise (under 100 characters) and practical.
Only respond with the JSON array, no other text.`;

    // Get tips from Gemini
    const response = await generateText(prompt);
    
    // Clean and parse the JSON array from the response
    let tipsText = response.trim();
    // Remove Markdown fences if present
    if (tipsText.startsWith('```')) {
      const firstNewLine = tipsText.indexOf('\n');
      const lastFence = tipsText.lastIndexOf('```');
      if (firstNewLine !== -1 && lastFence !== -1) {
        tipsText = tipsText.slice(firstNewLine + 1, lastFence).trim();
      }
    }
    // Extract only the array portion
    const firstBracket = tipsText.indexOf('[');
    const lastBracket = tipsText.lastIndexOf(']');
    if (firstBracket > -1 && lastBracket > firstBracket) {
      tipsText = tipsText.slice(firstBracket, lastBracket + 1);
    }
    try {
      const tips = JSON.parse(tipsText);
      return Array.isArray(tips) ? tips : getDefaultCookingTips();
    } catch (error) {
      console.error('Error parsing cooking tips after cleaning:', error);
      console.error('Raw response:', response);
      console.error('Cleaned tipsText:', tipsText);
      return getDefaultCookingTips();
    }
  } catch (error) {
    console.error('Error generating personalized cooking tips:', error);
    return getDefaultCookingTips();
  }
};

/**
 * Get personalized recipe ideas based on user profile (legacy function for backward compatibility)
 */
export const getPersonalizedRecipeIdeasLegacy = async (userProfile: UserProfile, count: number = 5): Promise<ServiceRecipe[]> => {
  try {
    // Use the new service to get recipe ideas
    const ideas = await getPersonalizedRecipeIdeas(userProfile, count);
    
    // Convert RecipeIdea[] to ServiceRecipe[] for backward compatibility
    return ideas.map((idea) => {
      const recipe = convertIdeaToRecipe(idea);
      return {
        ...recipe,
        cuisineType: 'Other',
        mealType: ['other'],
        dietaryInfo: []
      } as ServiceRecipe;
    });
  } catch (error) {
    console.error('Error generating personalized recipe ideas:', error);
    return []; // Return empty array instead of throwing to prevent crashes
  }
};

/**
 * Get difficulty level based on user's skill level
 */
const getDifficultyFromSkillLevel = (skillLevel?: CookingSkill): string => {
  if (!skillLevel) return 'medium';
  
  switch (skillLevel.toLowerCase()) {
    case 'beginner':
      return 'easy';
    case 'intermediate':
      return 'medium';
    case 'advanced':
      return 'hard';
    default:
      return 'medium';
  }
};

/**
 * Get a random cuisine from user preferences or default list
 */
const getRandomCuisine = (userPreferredCuisines: string[] = []): string => {
  if (!userPreferredCuisines || userPreferredCuisines.length === 0) {
    // Default cuisines
    const defaultCuisines = ['italian', 'mediterranean', 'american', 'mexican', 'asian'];
    return defaultCuisines[Math.floor(Math.random() * defaultCuisines.length)];
  }
  
  // Return a random cuisine from user preferences
  return userPreferredCuisines[Math.floor(Math.random() * userPreferredCuisines.length)];
};

/**
 * Get default cooking tips
 */
const getDefaultCookingTips = (): string[] => {
  return [
    "Salt your pasta water generously for better flavor",
    "Let meat rest after cooking to retain juices",
    "Prep and measure ingredients before cooking for efficiency",
    "Keep knives sharp for safer, more efficient cutting",
    "Clean as you go to make post-cooking cleanup easier"
  ];
};

/**
 * Load user profile from storage or API
 */
export const loadUserProfile = async (): Promise<UserProfile> => {
  try {
    // Try to load from AsyncStorage first
    const storedProfile = await AsyncStorage.getItem('user_profile');
    if (storedProfile) {
      return JSON.parse(storedProfile);
    }
    
    // If not available, fetch from API
    const preferences = await fetchUserPreferences();
    const recipes = await fetchUserRecipes();
    const savedRecipes = await fetchSavedRecipes();
    
    // Build profile from fetched data
    const profile: UserProfile = {
      dietaryProfile: preferences.dietaryProfile || [],
      allergies: preferences.allergies || [],
      dislikedIngredients: preferences.dislikedIngredients || [],
      cuisineTypes: preferences.cuisineTypes || [],
      cookingSkill: preferences.cookingSkill || 'Intermediate',
      spiceLevel: preferences.spiceLevel || 'medium',
      cookingGoals: preferences.cookingGoals || [],
      cookingTimeLimit: preferences.cookingTimeLimit || 30,
      mealPrepTimePreference: preferences.mealPrepTimePreference || 30,
      favoriteIngredients: preferences.favoriteIngredients || [],
      lastViewedRecipes: recipes.map(r => r.id),
      savedRecipes: savedRecipes.map(r => r.id),
      weeklyGoal: preferences.weeklyGoal || 5,
      weeklyProgress: preferences.weeklyProgress || 0
    };
    
    // Save to AsyncStorage for future use
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    
    return profile;
  } catch (error) {
    console.error('Error loading user profile:', error);
    
    // Return default profile
    return {
      dietaryProfile: 'noRestrictions',
      allergies: [],
      dislikedIngredients: [],
      favoriteIngredients: [],
      cuisineTypes: ['italian', 'american', 'mexican'],
      cookingSkill: 'Intermediate',
      spiceLevel: 'medium',
      cookingGoals: [],
      cookingTimeLimit: 30,
      mealPrepTimePreference: 30,
      weeklyGoal: 5,
      weeklyProgress: 0
    };
  }
};

/**
 * Simulates AI-generated personalized recipe suggestions
 * In a real app, this would call your AI service (OpenAI, Claude, etc.)
 */
export const generatePersonalizedSuggestions = async (userProfile: UserProfile): Promise<PersonalizedSuggestion[]> => {
  // Check cache first
  const cachedData = await getCachedSuggestions();
  if (cachedData) {
    return cachedData;
  }

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate suggestions based on user profile
  const suggestions = await simulateAIPersonalization(userProfile);
  
  // Cache the results
  await cacheSuggestions(suggestions);
  
  return suggestions;
};

/**
 * Simulates AI-generated seasonal insights
 */
export const generateSeasonalInsights = async (): Promise<SeasonalInsight[]> => {
  try {
    // Create cache key for seasonal insights
    const cacheKey = createSeasonalCacheKey();
    
    // Check if we have cached seasonal insights in Supabase (24-hour caching)
    try {
      const { data: cachedData, error: cacheError } = await supabase
        .from('ai_recipe_cache')
        .select('response_data, created_at')
        .eq('cache_key', cacheKey)
        .eq('cache_type', 'seasonal_insights')
        .single();

      if (cachedData && !cacheError && isCacheValid(cachedData.created_at)) {
        console.log('Returning cached seasonal insights for cards');
        return cachedData.response_data as SeasonalInsight[];
      }
    } catch (error) {
      console.log('Cache miss for seasonal insights, generating fresh content');
  }

    // Generate fresh seasonal insights
    console.log('Generating fresh seasonal insights for cards');
    
    // Get current season and date context
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentSeason = getCurrentSeason();
    
    const prompt = `Generate 4 seasonal recipe insights for ${currentMonth} (${currentSeason} season).
    
    Each insight should focus on:
    1. A seasonal ingredient that's at its peak right now
    2. A recipe idea that showcases this ingredient
    3. Why this ingredient is special in ${currentMonth}
    4. An appealing description that makes people want to cook with it
    
    Format as a JSON array:
    [
      {
        "ingredient": "seasonal ingredient name",
        "recipeTitle": "Recipe title featuring this ingredient",
        "description": "Why this ingredient is perfect right now and what makes the recipe special",
        "imageUrl": "https://source.unsplash.com/400x300/?seasonal-ingredient-food",
        "season": "${currentSeason}",
        "month": "${currentMonth}"
      }
    ]
    
    Focus on ingredients that are truly in season for ${currentMonth} in most regions.`;

    const response = await generateText(prompt);
    if (!response) {
      throw new Error('Failed to generate seasonal insights');
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format for seasonal insights');
    }

    const seasonalData = JSON.parse(jsonMatch[0]);
    
    // Validate and format the data
    const seasonalInsights: SeasonalInsight[] = seasonalData.map((item: any, index: number) => ({
      ingredient: item.ingredient || `Seasonal ingredient ${index + 1}`,
      recipeTitle: item.recipeTitle || `${currentSeason} Recipe ${index + 1}`,
      description: item.description || `A delicious ${currentSeason.toLowerCase()} recipe featuring seasonal ingredients.`,
      imageUrl: item.imageUrl || `https://source.unsplash.com/400x300/?${encodeURIComponent(item.ingredient || 'seasonal food')}&sig=${index}`,
      season: currentSeason,
      month: currentMonth
    }));
  
    // Cache the result for 24 hours in Supabase
    try {
      await supabase
        .from('ai_recipe_cache')
        .upsert({
          cache_key: cacheKey,
          cache_type: 'seasonal_insights',
          response_data: seasonalInsights,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      console.log('Cached seasonal insights for 24 hours');
    } catch (cacheError) {
      console.error('Failed to cache seasonal insights:', cacheError);
    }

    return seasonalInsights;
  } catch (error) {
    console.error('Error generating seasonal insights:', error);
    
    // Fallback seasonal insights
    const currentSeason = getCurrentSeason();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    return [
      {
        ingredient: 'Seasonal vegetables',
        recipeTitle: `${currentSeason} Harvest Bowl`,
        description: `A nutritious bowl featuring the best ${currentSeason.toLowerCase()} ingredients available right now.`,
        imageUrl: `https://source.unsplash.com/400x300/?${currentSeason.toLowerCase()}-vegetables`,
        season: currentSeason,
        month: currentMonth
      },
      {
        ingredient: 'Fresh herbs',
        recipeTitle: `${currentMonth} Herb Garden Pasta`,
        description: `Light and fresh pasta showcasing the vibrant herbs of ${currentMonth}.`,
        imageUrl: `https://source.unsplash.com/400x300/?fresh-herbs-pasta`,
        season: currentSeason,
        month: currentMonth
      }
    ];
  }
};

// Helper function to determine current season
const getCurrentSeason = (): string => {
  const month = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1
  
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
};

/**
 * Simulates AI personalization logic
 * In production, this would be replaced with actual AI API calls
 */
const simulateAIPersonalization = async (profile: UserProfile): Promise<PersonalizedSuggestion[]> => {
  const suggestions: PersonalizedSuggestion[] = [];
  
  // Base suggestions templates organized by dietary profile
  const suggestionTemplates = {
    vegetarian: [
      {
        title: 'Mediterranean Chickpea Power Bowl',
        reasonText: `Perfect for your vegetarian lifestyle with protein-packed chickpeas`,
        imagePrompt: 'colorful mediterranean chickpea bowl with vegetables',
        accentColorType: 'healthy' as const,
        timeInMinutes: 25,
        difficulty: 'Easy' as const
      },
      {
        title: 'Creamy Mushroom Risotto',
        reasonText: `A comforting vegetarian classic that matches your ${profile.spiceLevel} spice preference`,
        imagePrompt: 'creamy mushroom risotto with herbs',
        accentColorType: 'comfort' as const,
        timeInMinutes: 35,
        difficulty: 'Medium' as const
      }
    ],
    vegan: [
      {
        title: 'Rainbow Buddha Bowl',
        reasonText: `Packed with plant-based nutrition for your vegan lifestyle`,
        imagePrompt: 'colorful vegan buddha bowl with quinoa and vegetables',
        accentColorType: 'healthy' as const,
        timeInMinutes: 20,
        difficulty: 'Easy' as const
      },
      {
        title: 'Coconut Thai Curry',
        reasonText: `Aromatic and satisfying, perfect for your ${profile.spiceLevel} spice level`,
        imagePrompt: 'thai green curry with vegetables and coconut milk',
        accentColorType: 'adventurous' as const,
        timeInMinutes: 30,
        difficulty: 'Medium' as const
      }
    ],
    keto: [
      {
        title: 'Garlic Butter Salmon',
        reasonText: `High-fat, low-carb perfection for your keto goals`,
        imagePrompt: 'pan seared salmon with garlic butter and asparagus',
        accentColorType: 'healthy' as const,
        timeInMinutes: 20,
        difficulty: 'Easy' as const
      },
      {
        title: 'Cauliflower Mac & Cheese',
        reasonText: `Keto-friendly comfort food that satisfies cravings`,
        imagePrompt: 'creamy cauliflower mac and cheese casserole',
        accentColorType: 'comfort' as const,
        timeInMinutes: 30,
        difficulty: 'Medium' as const
      }
    ],
    noRestrictions: [
      {
        title: 'Honey Garlic Chicken Thighs',
        reasonText: `A crowd-pleasing favorite that's ready in under 30 minutes`,
        imagePrompt: 'glazed honey garlic chicken thighs with rice',
        accentColorType: 'quick' as const,
        timeInMinutes: 25,
        difficulty: 'Easy' as const
      },
      {
        title: 'Classic Beef Stroganoff',
        reasonText: `Comfort food at its finest, perfect for your ${profile.cookingSkill?.toLowerCase()} skill level`,
        imagePrompt: 'creamy beef stroganoff with egg noodles',
        accentColorType: 'comfort' as const,
        timeInMinutes: 40,
        difficulty: 'Medium' as const
      }
    ]
  };

  // Get templates based on dietary profile
  const profileKey = profile.dietaryProfile as keyof typeof suggestionTemplates;
  let templates = [...(suggestionTemplates[profileKey] || suggestionTemplates.noRestrictions)];
  
  // Add time-based suggestion if user has time constraints
  if (profile.cookingTimeLimit <= 20) {
    const quickTemplate = {
      title: '15-Minute Stir Fry',
      reasonText: `Quick and easy, perfect for your ${profile.cookingTimeLimit}-minute time limit`,
      imagePrompt: 'quick vegetable stir fry in wok',
      accentColorType: 'quick' as const,
      timeInMinutes: 15,
      difficulty: 'Easy' as const
    };
    templates = [quickTemplate, ...templates];
  }

  // Generate suggestions with unique IDs and image URLs
  for (let i = 0; i < Math.min(3, templates.length); i++) {
    const template = templates[i];
    suggestions.push({
      id: `ai-${Date.now()}-${i}`,
      ...template,
      imageUrl: generateImageUrl(template.imagePrompt)
    });
  }

  return suggestions;
};

/**
 * Generates image URL from prompt (using Unsplash as placeholder)
 */
const generateImageUrl = (prompt: string): string => {
  const keywords = prompt.replace(/\s+/g, ',');
  return `https://source.unsplash.com/400x300/?${keywords}`;
};

/**
 * Cache management functions
 */
const getCachedSuggestions = async (): Promise<PersonalizedSuggestion[] | null> => {
  try {
    const lastGenerated = await AsyncStorage.getItem(CACHE_KEYS.LAST_GENERATED);
    if (!lastGenerated) return null;

    const timeDiff = Date.now() - parseInt(lastGenerated);
    if (timeDiff > CACHE_DURATION) return null;

    const cached = await AsyncStorage.getItem(CACHE_KEYS.PERSONALIZED_SUGGESTIONS);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error getting cached suggestions:', error);
    return null;
  }
};

const cacheSuggestions = async (suggestions: PersonalizedSuggestion[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.PERSONALIZED_SUGGESTIONS, JSON.stringify(suggestions));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_GENERATED, Date.now().toString());
  } catch (error) {
    console.error('Error caching suggestions:', error);
  }
};

/**
 * Helper to get user profile from store
 */
export const getUserProfile = (): UserProfile => {
  const store = usePreferencesStore.getState();
  return {
    dietaryProfile: store.dietaryProfile,
    allergies: store.allergies,
    favoriteIngredients: store.favoriteIngredients,
    cuisineTypes: store.cuisineTypes,
    cookingSkill: store.cookingSkill,
    spiceLevel: store.spiceLevel,
    cookingGoals: store.cookingGoals,
    cookingTimeLimit: store.cookingTimeLimit
  };
};

/**
 * Force refresh suggestions (clears cache)
 */
export const refreshPersonalizedContent = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.PERSONALIZED_SUGGESTIONS,
      CACHE_KEYS.SEASONAL_INSIGHTS,
      CACHE_KEYS.LAST_GENERATED
    ]);
  } catch (error) {
    console.error('Error refreshing personalized content:', error);
  }
};
