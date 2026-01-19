// Enhanced AI Recipe Generation Service with Real OpenAI Integration
// This creates dynamic recipes using ChatGPT based on user's leftover ingredients

// OpenAI API Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Ingredient categories and their common pairings (kept for fallback)
const ingredientCategories = {
  proteins: {
    items: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'eggs', 'tofu', 'beans', 'lentils', 'chickpeas'],
    pairings: ['vegetables', 'grains', 'herbs', 'spices']
  },
  vegetables: {
    items: ['tomatoes', 'onions', 'garlic', 'carrots', 'potatoes', 'bell peppers', 'spinach', 'broccoli', 'mushrooms', 'zucchini', 'cucumber', 'lettuce', 'celery', 'corn'],
    pairings: ['proteins', 'grains', 'herbs', 'dairy']
  },
  grains: {
    items: ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'flour', 'noodles', 'couscous'],
    pairings: ['proteins', 'vegetables', 'dairy']
  },
  dairy: {
    items: ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'mozzarella', 'parmesan', 'feta'],
    pairings: ['vegetables', 'grains', 'proteins']
  },
  herbs: {
    items: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'mint', 'dill'],
    pairings: ['proteins', 'vegetables', 'grains']
  },
  spices: {
    items: ['salt', 'pepper', 'paprika', 'cumin', 'garlic powder', 'onion powder', 'chili powder', 'turmeric'],
    pairings: ['proteins', 'vegetables']
  },
  pantry: {
    items: ['olive oil', 'vegetable oil', 'vinegar', 'lemon', 'lime', 'soy sauce', 'honey', 'sugar', 'baking powder'],
    pairings: ['proteins', 'vegetables', 'grains']
  }
};

// OpenAI API call function
const callOpenAI = async (prompt) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional chef and nutritionist specializing in creating recipes from leftover ingredients. You help reduce food waste by creating delicious, healthy meals. Always respond with valid JSON in the exact format requested.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
};

// Generate recipe prompt for OpenAI
const generateRecipePrompt = (ingredients, preferences) => {
  const { mealType, dietaryPreferences, cookingTime, servingSize } = preferences;
  
  const dietaryText = dietaryPreferences && dietaryPreferences.length > 0 
    ? `The recipe must be ${dietaryPreferences.join(', ')}.` 
    : '';
  
  const timeText = cookingTime ? `The total cooking time should be around ${cookingTime} minutes.` : '';
  
  return `Create a ${mealType || 'meal'} recipe using these leftover ingredients: ${ingredients.join(', ')}.

Requirements:
- Use ALL the provided ingredients as the main components
- Suggest minimal additional ingredients (pantry staples like oil, salt, pepper, etc.)
- ${dietaryText}
- ${timeText}
- Serves ${servingSize || 4} people
- Focus on reducing food waste by maximizing use of leftovers

Please respond with a JSON object in this exact format:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "totalTime": 30,
  "servings": 4,
  "difficulty": "Easy|Medium|Hard",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup", "isLeftover": true},
    {"name": "additional ingredient", "amount": "2", "unit": "tbsp", "isLeftover": false}
  ],
  "instructions": [
    {"step": 1, "instruction": "First step description", "time": 5},
    {"step": 2, "instruction": "Second step description", "time": 10}
  ],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 15,
    "fiber": 8,
    "sugar": 5
  },
  "tags": ["healthy", "quick", "leftover-friendly"],
  "aiInsights": {
    "tips": ["Chef tip 1", "Chef tip 2"],
    "healthBenefits": ["Health benefit 1", "Health benefit 2"],
    "variations": ["Variation 1", "Variation 2"]
  },
  "alternatives": [
    {
      "title": "Alternative Recipe Name",
      "description": "How to modify the recipe",
      "modifications": ["Change 1", "Change 2"]
    }
  ]
}`;
};

// Fallback recipe generation (original logic)
const generateFallbackRecipe = (ingredients, preferences) => {
  // ... existing code ...
  const categorized = categorizeIngredients(ingredients);
  const complementary = generateComplementaryIngredients(ingredients, preferences.mealType, preferences.dietaryPreferences);
  
  // Create a basic recipe structure
  const recipe = {
    id: Date.now(),
    title: `${preferences.mealType || 'Leftover'} Recipe with ${ingredients.slice(0, 2).join(' and ')}`,
    description: `A delicious ${preferences.mealType || 'meal'} made with your leftover ingredients`,
    totalTime: preferences.cookingTime ? parseInt(preferences.cookingTime) : 30,
    servings: preferences.servingSize || 4,
    difficulty: 'Easy',
    ingredients: [
      ...ingredients.map(ing => ({
        name: ing,
        amount: '1',
        unit: 'portion',
        isLeftover: true
      })),
      ...complementary.slice(0, 3).map(ing => ({
        name: ing,
        amount: 'as needed',
        unit: '',
        isLeftover: false
      }))
    ],
    instructions: [
      { step: 1, instruction: 'Prepare all ingredients by washing and chopping as needed.', time: 5 },
      { step: 2, instruction: `Combine your leftover ${ingredients.join(', ')} in a suitable cooking method.`, time: 15 },
      { step: 3, instruction: 'Season with salt, pepper, and any additional spices to taste.', time: 5 },
      { step: 4, instruction: 'Cook until heated through and flavors are well combined.', time: 10 },
      { step: 5, instruction: 'Serve hot and enjoy your waste-free meal!', time: 0 }
    ],
    nutrition: {
      calories: 350,
      protein: 20,
      carbs: 30,
      fat: 12,
      fiber: 6,
      sugar: 8
    },
    tags: ['leftover-friendly', 'waste-reduction', 'quick'],
    aiInsights: {
      tips: [
        'Taste and adjust seasoning as you cook',
        'Feel free to add herbs or spices you have on hand'
      ],
      healthBenefits: [
        'Using leftovers reduces food waste',
        'Combining different ingredients provides varied nutrients'
      ],
      variations: [
        'Add a protein if missing for a more filling meal',
        'Include fresh herbs for extra flavor'
      ]
    },
    alternatives: [
      {
        title: 'Spicier Version',
        description: 'Add heat with chili peppers or hot sauce',
        modifications: ['Add 1 tsp chili flakes', 'Include hot sauce to taste']
      }
    ]
  };

  return recipe;
};

// Categorize user ingredients (helper function)
const categorizeIngredients = (ingredients) => {
  const categorized = {
    proteins: [],
    vegetables: [],
    grains: [],
    dairy: [],
    herbs: [],
    spices: [],
    pantry: [],
    unknown: []
  };

  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    let categorized_flag = false;

    Object.keys(ingredientCategories).forEach(category => {
      if (ingredientCategories[category].items.some(item => 
        lowerIngredient.includes(item) || item.includes(lowerIngredient)
      )) {
        categorized[category].push(ingredient);
        categorized_flag = true;
      }
    });

    if (!categorized_flag) {
      categorized.unknown.push(ingredient);
    }
  });

  return categorized;
};

// Generate complementary ingredients
const generateComplementaryIngredients = (userIngredients, mealType, dietaryPreferences) => {
  const categorized = categorizeIngredients(userIngredients);
  const complementary = [];

  // Basic pantry items that are almost always needed
  const basicPantry = ['olive oil', 'salt', 'pepper'];
  complementary.push(...basicPantry);

  // Add protein if missing
  if (categorized.proteins.length === 0 && !dietaryPreferences?.includes('vegan')) {
    if (dietaryPreferences?.includes('vegetarian')) {
      complementary.push('eggs', 'cheese');
    } else {
      complementary.push('chicken breast');
    }
  }

  // Add vegetables if missing
  if (categorized.vegetables.length === 0) {
    complementary.push('onions', 'garlic');
  }

  // Add grains for lunch/dinner if missing
  if ((mealType === 'lunch' || mealType === 'dinner') && categorized.grains.length === 0) {
    complementary.push('rice');
  }

  // Add herbs for flavor
  if (categorized.herbs.length === 0) {
    complementary.push('fresh herbs (basil, parsley, or cilantro)');
  }

  return [...new Set(complementary)]; // Remove duplicates
};

// Main recipe generation function with OpenAI integration
export const generateRecipe = async (ingredients, preferences) => {
  try {
    if (!ingredients || ingredients.length === 0) {
      throw new Error('Please add at least one ingredient to generate a recipe');
    }

    // Try OpenAI first
    if (OPENAI_API_KEY) {
      try {
        console.log('🤖 Generating recipe with OpenAI...');
        const prompt = generateRecipePrompt(ingredients, preferences);
        const aiResponse = await callOpenAI(prompt);
        
        // Parse the JSON response
        const recipe = JSON.parse(aiResponse);
        
        // Add ID and timestamp
        recipe.id = Date.now();
        recipe.createdAt = new Date().toISOString();
        recipe.source = 'openai';
        
        console.log('✅ OpenAI recipe generated successfully');
        
        return {
          success: true,
          recipe: recipe,
          aiInsights: recipe.aiInsights || generateAIInsights(ingredients, preferences),
          alternatives: recipe.alternatives || generateAlternatives(recipe, preferences)
        };
        
      } catch (openaiError) {
        console.warn('⚠️ OpenAI generation failed, falling back to local generation:', openaiError.message);
        // Fall through to fallback generation
      }
    }

    // Fallback to local generation
    console.log('🔄 Using fallback recipe generation...');
    const recipe = generateFallbackRecipe(ingredients, preferences);
    recipe.source = 'fallback';
    
    return {
      success: true,
      recipe: recipe,
      aiInsights: generateAIInsights(ingredients, preferences),
      alternatives: generateAlternatives(recipe, preferences)
    };
    
  } catch (error) {
    console.error('❌ Recipe generation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate recipe. Please try again.'
    };
  }
};

// Generate AI insights about the recipe (fallback function)
const generateAIInsights = (ingredients, preferences) => {
  const insights = [];
  const categorized = categorizeIngredients(ingredients);
  
  if (ingredients.length >= 5) {
    insights.push("🎯 Excellent! You have a great variety of ingredients to work with.");
  }
  
  if (categorized.proteins.length > 0) {
    insights.push(`🥩 Your ${categorized.proteins.join(', ')} will provide excellent protein for this meal.`);
  }
  
  if (categorized.vegetables.length >= 3) {
    insights.push("🥬 Great vegetable variety! This will make your dish colorful and nutritious.");
  }
  
  if (preferences.dietaryPreferences?.includes('vegetarian')) {
    insights.push("🌱 This vegetarian recipe maximizes the flavors of your plant-based ingredients.");
  }
  
  if (preferences.cookingTime === '15') {
    insights.push("⚡ Perfect for a quick meal! We've designed this to be ready in no time.");
  }
  
  insights.push("♻️ Great job reducing food waste by using your leftover ingredients!");
  
  return insights;
};

// Generate recipe alternatives (fallback function)
const generateAlternatives = (baseRecipe, preferences) => {
  const alternatives = [];
  
  // Spicier version
  alternatives.push({
    title: "🌶️ Spicier Version",
    description: "Add some heat to wake up your taste buds",
    modifications: [
      "Add 1 tsp red pepper flakes",
      "Include fresh jalapeños or hot sauce",
      "Use spicy seasonings like cayenne or paprika"
    ]
  });
  
  // Healthier version
  alternatives.push({
    title: "🥗 Lighter Version",
    description: "Reduce calories while keeping great flavor",
    modifications: [
      "Use less oil or cooking spray",
      "Add more vegetables for bulk",
      "Reduce any cheese or cream by half"
    ]
  });
  
  // Vegetarian version (if not already)
  if (!preferences.dietaryPreferences?.includes('vegetarian')) {
    alternatives.push({
      title: "🌱 Vegetarian Version",
      description: "Plant-based twist on this recipe",
      modifications: [
        "Replace meat with tofu, tempeh, or extra beans",
        "Use vegetable broth instead of meat broth",
        "Add nutritional yeast for umami flavor"
      ]
    });
  }
  
  return alternatives;
};

export default { generateRecipe }; 