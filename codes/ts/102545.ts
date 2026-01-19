import { UserProfile, Recipe, MealPlan, DailyMeals } from '../types';
import OpenAI from 'openai';
import { db } from '../config/firebase';

export class AIService {
  private static openai: OpenAI;

  /**
   * Initialize OpenAI client
   */
  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Generate personalized weekly meal plan based on user preferences
   */
  static async generateWeeklyMealPlan(userProfile: UserProfile): Promise<MealPlan> {
    try {
      // TEMPORARY: Return mock data instead of calling ChatGPT
      console.log('🔄 [AIService] Using mock data instead of ChatGPT API call');
      
      // ORIGINAL CHATGPT CODE (COMMENTED OUT)
      // const mealPlan = await this.generateMealPlanWithChatGPT(userProfile);
      // await this.saveMealPlan(mealPlan);
      // return mealPlan;
      
      const today = new Date();
      const weekStartDate = this.getWeekStartDate(today);
      
      console.log(`📅 [AIService] Today: ${today.toISOString().split('T')[0]}`);
      console.log(`📅 [AIService] Week start: ${weekStartDate.toISOString().split('T')[0]}`);
      
      // Generate 7 days of meals starting from the week start date
      const meals = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(weekStartDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        console.log(`📅 [AIService] Day ${i + 1}: ${dateString} (${currentDate.toLocaleDateString('en-US', { weekday: 'short' })})`);
        
        meals.push({
          date: dateString,
          breakfast: {
            id: "mock-breakfast",
            name: "Avocado Toast with Poached Egg",
            image: "",
            ingredients: [
              { id: "1", name: "Whole grain bread", amount: "2", unit: "slices" },
              { id: "2", name: "Avocado", amount: "1/2", unit: "piece" },
              { id: "3", name: "Egg", amount: "1", unit: "large" },
              { id: "4", name: "Cherry tomatoes", amount: "5", unit: "pieces" },
              { id: "5", name: "Olive oil", amount: "1", unit: "tsp" },
              { id: "6", name: "Salt & pepper", amount: "to taste", unit: "" }
            ],
            steps: [
              "Toast the bread.",
              "Mash avocado and spread on toast.",
              "Poach the egg and place on top.",
              "Drizzle with olive oil, season, and add tomatoes."
            ],
            nutrition: { calories: 350, protein: 13, fat: 18, carbs: 35 },
            cookingTime: 15,
            difficulty: "easy" as const,
            tags: ["breakfast", "healthy", "quick"],
            cuisine: "American",
            budget: "standard" as const
          },
          lunch: {
            id: "mock-lunch",
            name: "Chicken Teriyaki Rice Bowl",
            image: "",
            ingredients: [
              { id: "1", name: "Chicken breast", amount: "120", unit: "g" },
              { id: "2", name: "Cooked rice", amount: "1", unit: "cup" },
              { id: "3", name: "Broccoli florets", amount: "1", unit: "cup" },
              { id: "4", name: "Carrot", amount: "1/2", unit: "piece" },
              { id: "5", name: "Teriyaki sauce", amount: "2", unit: "tbsp" },
              { id: "6", name: "Sesame seeds", amount: "1", unit: "tsp" }
            ],
            steps: [
              "Grill or pan-fry chicken with teriyaki sauce.",
              "Steam broccoli and carrots.",
              "Serve chicken and veggies over rice.",
              "Sprinkle with sesame seeds."
            ],
            nutrition: { calories: 520, protein: 32, fat: 9, carbs: 70 },
            cookingTime: 25,
            difficulty: "medium" as const,
            tags: ["lunch", "asian", "protein"],
            cuisine: "Japanese",
            budget: "standard" as const
          },
          dinner: {
            id: "mock-dinner",
            name: "Salmon & Quinoa Power Bowl",
            image: "",
            ingredients: [
              { id: "1", name: "Salmon fillet", amount: "120", unit: "g" },
              { id: "2", name: "Quinoa", amount: "3/4", unit: "cup" },
              { id: "3", name: "Spinach", amount: "1", unit: "cup" },
              { id: "4", name: "Red bell pepper", amount: "1/2", unit: "piece" },
              { id: "5", name: "Feta cheese", amount: "2", unit: "tbsp" },
              { id: "6", name: "Lemon juice", amount: "1", unit: "tbsp" }
            ],
            steps: [
              "Cook quinoa as per instructions.",
              "Pan-sear or bake salmon.",
              "Assemble bowl with spinach, quinoa, salmon, peppers, and feta.",
              "Drizzle with lemon juice."
            ],
            nutrition: { calories: 480, protein: 34, fat: 18, carbs: 45 },
            cookingTime: 30,
            difficulty: "medium" as const,
            tags: ["dinner", "high-protein", "healthy"],
            cuisine: "Mediterranean",
            budget: "standard" as const
          },
          totalCalories: 1350,
          totalProtein: 79,
          totalFat: 45,
          totalCarbs: 150
        });
      }
      
      const mockMealPlan: MealPlan = {
        id: `meal-plan-${Date.now()}`,
        userId: userProfile.id,
        week: weekStartDate.toISOString().split('T')[0],
        meals: meals,
        createdAt: new Date()
      };
      
      // Save the generated meal plan to Firebase
      await this.saveMealPlan(mockMealPlan);
      
      console.log('✅ [AIService] Mock meal plan generated and saved successfully!');
      console.log(`📅 [AIService] Week start: ${weekStartDate.toISOString().split('T')[0]}`);
      console.log(`🍽️ [AIService] Generated ${meals.length} days of meals`);
      return mockMealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan');
    }
  }

  /**
   * Generate meal plan using ChatGPT with professional diet planner prompt
   */
  // @ts-expect-error - Temporarily unused while using mock data
  private static async generateMealPlanWithChatGPT(userProfile: UserProfile): Promise<MealPlan> {
    const today = new Date();
    const weekStartDate = this.getWeekStartDate(today);
    
    const prompt = this.buildDietPlannerPrompt(userProfile);
    
    try {
      const openai = this.getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional registered dietitian and nutritionist with 15+ years of experience in personalized meal planning. You specialize in creating balanced, nutritious, and delicious meal plans that meet individual dietary needs, preferences, and health goals. You always provide practical, realistic meal suggestions that people can actually prepare and enjoy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from ChatGPT');
      }

      // Parse the ChatGPT response and convert to our meal plan format
      const mealPlan = this.parseChatGPTResponse(response, userProfile, weekStartDate);
      
      return mealPlan;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      // Fallback to mock data if ChatGPT fails
      return this.generateFallbackMealPlan(userProfile, weekStartDate);
    }
  }

  /**
   * Build comprehensive prompt for ChatGPT as a professional diet planner
   */
  private static buildDietPlannerPrompt(userProfile: UserProfile): string {
    const dailyCalories = this.calculateDailyCalories(userProfile);
    const idealRatios = this.getIdealNutritionRatios(userProfile.goal);
    
    return `Create a personalized 7-day meal plan for a ${userProfile.age}-year-old ${userProfile.gender} with the following profile:

**Personal Information:**
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Goal: ${userProfile.goal}

**Nutritional Targets:**
- Daily Calories: ${dailyCalories} calories
- Protein: ${idealRatios.protein * 100}% of daily calories
- Fat: ${idealRatios.fat * 100}% of daily calories
- Carbs: ${idealRatios.carbs * 100}% of daily calories

**Preferences & Restrictions:**
- Cuisine Preferences: ${userProfile.cuisinePreferences.join(', ') || 'No specific preferences'}
- Budget: ${userProfile.budget}
- Cooking Time: ${userProfile.cookingTime}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}
- Dislikes: ${userProfile.dislikes.join(', ') || 'None'}

**Requirements:**
1. Provide 3 meals per day (breakfast, lunch, dinner) for 7 days
2. Each meal should include:
   - Recipe name
   - Brief description (1-2 sentences)
   - Estimated calories
   - Protein, fat, and carbs in grams
   - Cooking time
   - Difficulty level (Easy/Medium/Hard)
   - Cuisine type
   - Key ingredients (5-8 main ingredients)
   - Tags for meal type and dietary considerations

3. Ensure variety throughout the week
4. Consider seasonal availability and budget constraints
5. Make sure meals are balanced and meet nutritional targets
6. Include some quick/easy options for busy days

Please format your response as a structured meal plan that can be easily parsed into a JSON format. Focus on practical, delicious, and nutritious meals that align with the user's preferences and goals.`;
  }

  /**
   * Parse ChatGPT response and convert to meal plan format
   */
  private static parseChatGPTResponse(response: string, userProfile: UserProfile, weekStartDate: Date): MealPlan {
    try {
      // For now, we'll use a structured approach to parse the response
      // In a production environment, you might want to ask ChatGPT to return JSON directly
      const dailyMeals: DailyMeals[] = [];
      
      // Extract meal information from the response
      const mealData = this.extractMealDataFromResponse(response);
      
      // Generate 7 days of meals
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        const dayMeals = this.createDailyMealsFromData(mealData, currentDate, userProfile);
        dailyMeals.push(dayMeals);
      }

      return {
        id: `meal-plan-${Date.now()}`,
        userId: userProfile.id,
        week: weekStartDate.toISOString().split('T')[0],
        meals: dailyMeals,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error parsing ChatGPT response:', error);
      // Fallback to mock data
      return this.generateFallbackMealPlan(userProfile, weekStartDate);
    }
  }

  /**
   * Extract meal data from ChatGPT response
   */
  private static extractMealDataFromResponse(response: string): { breakfast: Recipe[]; lunch: Recipe[]; dinner: Recipe[] } {
    // This is a simplified parser - in production, you might want to use more sophisticated parsing
    // or ask ChatGPT to return structured JSON
    const mealData = {
      breakfast: [] as Recipe[],
      lunch: [] as Recipe[],
      dinner: [] as Recipe[]
    };

    // Extract meal suggestions from the response
    // This is a basic implementation - you might want to enhance this based on your needs
    const lines = response.split('\n');
    let currentMealType = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('breakfast')) {
        currentMealType = 'breakfast';
      } else if (lowerLine.includes('lunch')) {
        currentMealType = 'lunch';
      } else if (lowerLine.includes('dinner')) {
        currentMealType = 'dinner';
      } else if (currentMealType && line.trim()) {
        // Extract recipe information from the line
        const recipe = this.parseRecipeFromLine(line, currentMealType);
        if (recipe) {
          mealData[currentMealType as keyof typeof mealData].push(recipe);
        }
      }
    }

    return mealData;
  }

  /**
   * Parse recipe information from a line of text
   */
  private static parseRecipeFromLine(line: string, mealType: string): Recipe | null {
    // Basic parsing - extract recipe name and create a basic recipe object
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 5) return null;

    // Extract recipe name (assume it's the first meaningful text)
    const recipeName = trimmedLine.split(' ').slice(0, 3).join(' ').replace(/[^\w\s]/g, '');
    
    if (!recipeName) return null;

    // Create a basic recipe with estimated nutrition
    const estimatedCalories = this.estimateCaloriesForMeal(mealType);
    const nutrition = this.estimateNutritionForMeal(mealType, estimatedCalories);

    return {
      id: `recipe-${Date.now()}-${Math.random()}`,
      name: recipeName,
      image: '',
      ingredients: [
        { id: `ingredient-${Date.now()}`, name: 'Main ingredient', amount: '1 portion', unit: 'piece' }
      ],
      steps: ['Follow basic cooking instructions'],
      nutrition: {
        calories: estimatedCalories,
        protein: nutrition.protein,
        fat: nutrition.fat,
        carbs: nutrition.carbs
      },
      cookingTime: 30,
      difficulty: 'medium' as const,
      tags: [mealType, 'ai-generated'],
      cuisine: 'International',
      budget: 'standard' as const
    };
  }

  /**
   * Create daily meals from extracted data
   */
  private static createDailyMealsFromData(mealData: any, date: Date, userProfile: UserProfile): DailyMeals {
    // Select meals for the day from the available data
    const breakfast = this.selectMealFromData(mealData.breakfast, 'breakfast') || this.getFallbackRecipe(400);
    const lunch = this.selectMealFromData(mealData.lunch, 'lunch') || this.getFallbackRecipe(600);
    const dinner = this.selectMealFromData(mealData.dinner, 'dinner') || this.getFallbackRecipe(500);

    const totalCalories = breakfast.nutrition.calories + lunch.nutrition.calories + dinner.nutrition.calories;
    const totalProtein = breakfast.nutrition.protein + lunch.nutrition.protein + dinner.nutrition.protein;
    const totalFat = breakfast.nutrition.fat + lunch.nutrition.fat + dinner.nutrition.fat;
    const totalCarbs = breakfast.nutrition.carbs + lunch.nutrition.carbs + dinner.nutrition.carbs;

    return {
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
    };
  }

  /**
   * Select a meal from available data
   */
  private static selectMealFromData(meals: Recipe[], mealType: string): Recipe | null {
    if (!meals || meals.length === 0) return null;
    
    // Simple selection - take the first available meal
    // In production, you might want more sophisticated selection logic
    return meals[0];
  }

  /**
   * Estimate calories for different meal types
   */
  private static estimateCaloriesForMeal(mealType: string): number {
    switch (mealType) {
      case 'breakfast': return 400;
      case 'lunch': return 600;
      case 'dinner': return 500;
      default: return 500;
    }
  }

  /**
   * Estimate nutrition for different meal types
   */
  private static estimateNutritionForMeal(mealType: string, calories: number): { protein: number; fat: number; carbs: number } {
    const ratios = {
      breakfast: { protein: 0.25, fat: 0.30, carbs: 0.45 },
      lunch: { protein: 0.30, fat: 0.25, carbs: 0.45 },
      dinner: { protein: 0.35, fat: 0.25, carbs: 0.40 }
    };

    const ratio = ratios[mealType as keyof typeof ratios] || ratios.lunch;
    
    return {
      protein: Math.round((calories * ratio.protein) / 4), // 4 calories per gram of protein
      fat: Math.round((calories * ratio.fat) / 9), // 9 calories per gram of fat
      carbs: Math.round((calories * ratio.carbs) / 4) // 4 calories per gram of carbs
    };
  }

  /**
   * Generate fallback meal plan if ChatGPT fails
   */
  private static generateFallbackMealPlan(userProfile: UserProfile, weekStartDate: Date): MealPlan {
    const dailyMeals: DailyMeals[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayMeals = this.generateDailyMealsSync(userProfile, this.getFallbackRecipes(), currentDate, this.calculateDailyCalories(userProfile));
      dailyMeals.push(dayMeals);
    }

    return {
      id: `meal-plan-${Date.now()}`,
      userId: userProfile.id,
      week: weekStartDate.toISOString().split('T')[0],
      meals: dailyMeals,
      createdAt: new Date(),
    };
  }

  /**
   * Get available recipes from Firebase Firestore
   */
  private static async getAvailableRecipes(userProfile: UserProfile): Promise<Recipe[]> {
    try {
      console.log('📚 [AIService] Fetching recipes from Firebase...');
      
      // Query recipes from Firestore using Admin SDK
      const recipesSnapshot = await db.collection('recipes').get();
      
      if (recipesSnapshot.empty) {
        console.log('ℹ️ [AIService] No recipes found in database, using fallback recipes');
        return this.getFallbackRecipes();
      }
      
      const recipes: Recipe[] = [];
      recipesSnapshot.forEach((doc) => {
        const recipeData = doc.data() as Recipe;
        recipes.push({
          ...recipeData,
          id: doc.id // Ensure the document ID is used as recipe ID
        });
      });
      
      console.log(`✅ [AIService] Retrieved ${recipes.length} recipes from Firebase`);
      return recipes;
    } catch (error) {
      console.error('❌ [AIService] Error fetching recipes from Firebase:', error);
      console.log('🔄 [AIService] Falling back to mock recipes');
      return this.getFallbackRecipes();
    }
  }



  /**
   * Generate meals for a specific day
   */
  private static async generateDailyMeals(
    userProfile: UserProfile, 
    recipes: Recipe[], 
    date: Date, 
    dailyCalories: number
  ): Promise<DailyMeals> {
    
    // Filter recipes by meal type and preferences
    const breakfastRecipes = this.filterRecipesForMeal(recipes, 'breakfast', userProfile);
    const lunchRecipes = this.filterRecipesForMeal(recipes, 'lunch', userProfile);
    const dinnerRecipes = this.filterRecipesForMeal(recipes, 'dinner', userProfile);

    // Generate meals with appropriate calorie distribution
    const breakfast = this.selectOptimalRecipe(breakfastRecipes, dailyCalories * 0.25, userProfile);
    const lunch = this.selectOptimalRecipe(lunchRecipes, dailyCalories * 0.35, userProfile);
    const dinner = this.selectOptimalRecipe(dinnerRecipes, dailyCalories * 0.40, userProfile);

    const totalCalories = breakfast.nutrition.calories + lunch.nutrition.calories + dinner.nutrition.calories;
    const totalProtein = breakfast.nutrition.protein + lunch.nutrition.protein + dinner.nutrition.protein;
    const totalFat = breakfast.nutrition.fat + lunch.nutrition.fat + dinner.nutrition.fat;
    const totalCarbs = breakfast.nutrition.carbs + lunch.nutrition.carbs + dinner.nutrition.carbs;

    return {
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
    };
  }

  /**
   * Generate meals for a specific day (synchronous version)
   */
  private static generateDailyMealsSync(
    userProfile: UserProfile, 
    recipes: Recipe[], 
    date: Date, 
    dailyCalories: number
  ): DailyMeals {
    
    // Filter recipes by meal type and preferences
    const breakfastRecipes = this.filterRecipesForMeal(recipes, 'breakfast', userProfile);
    const lunchRecipes = this.filterRecipesForMeal(recipes, 'lunch', userProfile);
    const dinnerRecipes = this.filterRecipesForMeal(recipes, 'dinner', userProfile);

    // Generate meals with appropriate calorie distribution
    const breakfast = this.selectOptimalRecipe(breakfastRecipes, dailyCalories * 0.25, userProfile);
    const lunch = this.selectOptimalRecipe(lunchRecipes, dailyCalories * 0.35, userProfile);
    const dinner = this.selectOptimalRecipe(dinnerRecipes, dailyCalories * 0.40, userProfile);

    const totalCalories = breakfast.nutrition.calories + lunch.nutrition.calories + dinner.nutrition.calories;
    const totalProtein = breakfast.nutrition.protein + lunch.nutrition.protein + dinner.nutrition.protein;
    const totalFat = breakfast.nutrition.fat + lunch.nutrition.fat + dinner.nutrition.fat;
    const totalCarbs = breakfast.nutrition.carbs + lunch.nutrition.carbs + dinner.nutrition.carbs;

    return {
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
    };
  }

  /**
   * Filter recipes for specific meal type
   */
  private static filterRecipesForMeal(recipes: Recipe[], mealType: string, userProfile: UserProfile): Recipe[] {
    return recipes.filter(recipe => {
      // Check if recipe is suitable for the meal type
      const isSuitableForMeal = this.isRecipeSuitableForMeal(recipe, mealType);
      
      // Check if recipe matches user preferences
      const matchesPreferences = this.matchesUserPreferences(recipe, userProfile);
      
      return isSuitableForMeal && matchesPreferences;
    });
  }

  /**
   * Check if recipe is suitable for specific meal type
   */
  private static isRecipeSuitableForMeal(recipe: Recipe, mealType: string): boolean {
    const mealTags = {
      breakfast: ['breakfast', 'morning', 'oatmeal', 'eggs', 'toast', 'smoothie'],
      lunch: ['lunch', 'main', 'protein', 'vegetables', 'rice', 'noodles'],
      dinner: ['dinner', 'evening', 'soup', 'light', 'comfort']
    };

    const tags = mealTags[mealType as keyof typeof mealTags] || [];
    return recipe.tags.some(tag => tags.includes(tag.toLowerCase()));
  }

  /**
   * Check if recipe matches user preferences
   */
  private static matchesUserPreferences(recipe: Recipe, userProfile: UserProfile): boolean {
    // Check cuisine preferences
    if (userProfile.cuisinePreferences.length > 0) {
      if (!userProfile.cuisinePreferences.includes(recipe.cuisine)) {
        return false;
      }
    }

    // Check budget
    if (recipe.budget !== userProfile.budget) {
      return false;
    }

    // Check cooking time
    const maxTime = this.getMaxCookingTime(userProfile.cookingTime);
    if (recipe.cookingTime > maxTime) {
      return false;
    }

    // Check allergies (exclude recipes with allergenic ingredients)
    if (userProfile.allergies.length > 0) {
      const hasAllergen = recipe.ingredients.some(ingredient =>
        userProfile.allergies.some(allergy =>
          ingredient.name.toLowerCase().includes(allergy.toLowerCase())
        )
      );
      if (hasAllergen) {
        return false;
      }
    }

    // Check dislikes
    if (userProfile.dislikes.length > 0) {
      const hasDislike = recipe.ingredients.some(ingredient =>
        userProfile.dislikes.some(dislike =>
          ingredient.name.toLowerCase().includes(dislike.toLowerCase())
        )
      );
      if (hasDislike) {
        return false;
      }
    }

    return true;
  }

  /**
   * Select optimal recipe based on calorie target and preferences
   */
  private static selectOptimalRecipe(recipes: Recipe[], targetCalories: number, userProfile: UserProfile): Recipe {
    if (recipes.length === 0) {
      // Return fallback recipe if no suitable recipes found
      return this.getFallbackRecipe(targetCalories);
    }

    // Score recipes based on multiple factors
    const scoredRecipes = recipes.map(recipe => {
      let score = 0;

      // Calorie match score (closer to target = higher score)
      const calorieDiff = Math.abs(recipe.nutrition.calories - targetCalories);
      score += Math.max(0, 100 - calorieDiff / 10);

      // Nutrition balance score
      const proteinRatio = recipe.nutrition.protein / recipe.nutrition.calories * 4;
      const fatRatio = recipe.nutrition.fat / recipe.nutrition.calories * 9;
      const carbRatio = recipe.nutrition.carbs / recipe.nutrition.calories * 4;

      // Ideal ratios based on meal type
      const idealRatios = this.getIdealNutritionRatios(userProfile.goal);
      score += this.calculateNutritionScore(proteinRatio, fatRatio, carbRatio, idealRatios);

      // Cooking time preference score
      const timeScore = this.calculateTimeScore(recipe.cookingTime, userProfile.cookingTime);
      score += timeScore;

      // Cuisine preference score
      if (userProfile.cuisinePreferences.includes(recipe.cuisine)) {
        score += 20;
      }

      return { recipe, score };
    });

    // Sort by score and select the best recipe
    scoredRecipes.sort((a, b) => b.score - a.score);
    return scoredRecipes[0].recipe;
  }

  /**
   * Calculate daily calorie target based on user profile
   */
  private static calculateDailyCalories(userProfile: UserProfile): number {
    // Basic BMR calculation using Mifflin-St Jeor Equation
    let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
    bmr = userProfile.gender === 'male' ? bmr + 5 : bmr - 161;
    
    // Activity multiplier (assuming moderate activity)
    const tdee = bmr * 1.55;
    
    // Adjust based on goal
    switch (userProfile.goal) {
      case 'lose_fat':
        return Math.round(tdee - 500); // 500 calorie deficit
      case 'gain_muscle':
        return Math.round(tdee + 300); // 300 calorie surplus
      case 'control_sugar':
        return Math.round(tdee - 200); // Slight deficit
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  }

  /**
   * Get maximum cooking time in minutes
   */
  private static getMaxCookingTime(cookingTime: string): number {
    switch (cookingTime) {
      case '<15':
        return 15;
      case '15-30':
        return 30;
      case '>30':
        return 60;
      default:
        return 30;
    }
  }

  /**
   * Get ideal nutrition ratios based on goal
   */
  private static getIdealNutritionRatios(goal: string): { protein: number; fat: number; carbs: number } {
    switch (goal) {
      case 'lose_fat':
        return { protein: 0.3, fat: 0.25, carbs: 0.45 };
      case 'gain_muscle':
        return { protein: 0.35, fat: 0.2, carbs: 0.45 };
      case 'control_sugar':
        return { protein: 0.25, fat: 0.35, carbs: 0.4 };
      case 'maintain':
      default:
        return { protein: 0.25, fat: 0.3, carbs: 0.45 };
    }
  }

  /**
   * Calculate nutrition score
   */
  private static calculateNutritionScore(
    proteinRatio: number, 
    fatRatio: number, 
    carbRatio: number, 
    idealRatios: { protein: number; fat: number; carbs: number }
  ): number {
    const proteinScore = Math.max(0, 50 - Math.abs(proteinRatio - idealRatios.protein) * 100);
    const fatScore = Math.max(0, 50 - Math.abs(fatRatio - idealRatios.fat) * 100);
    const carbScore = Math.max(0, 50 - Math.abs(carbRatio - idealRatios.carbs) * 100);
    
    return proteinScore + fatScore + carbScore;
  }

  /**
   * Calculate time score based on user preference
   */
  private static calculateTimeScore(cookingTime: number, userPreference: string): number {
    const maxTime = this.getMaxCookingTime(userPreference);
    if (cookingTime <= maxTime) {
      return 30 - (cookingTime / maxTime) * 20; // Shorter time = higher score
    }
    return 0;
  }

  /**
   * Get week start date (Sunday)
   */
  private static getWeekStartDate(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.getFullYear(), date.getMonth(), diff);
  }

  /**
   * Save meal plan to Firebase Firestore
   */
  private static async saveMealPlan(mealPlan: MealPlan): Promise<void> {
    try {
      console.log('💾 [AIService] Saving meal plan to Firebase...');
      
      // Convert Date objects to Firestore Timestamps
      const mealPlanData = {
        ...mealPlan,
        createdAt: new Date(mealPlan.createdAt)
      };
      
      // Save to Firestore using Admin SDK
      await db.collection('mealPlans').doc(mealPlan.id).set(mealPlanData);
      
      console.log('✅ [AIService] Meal plan saved successfully to Firebase');
    } catch (error) {
      console.error('❌ [AIService] Error saving meal plan to Firebase:', error);
      // Don't throw error as meal plan generation can still succeed
    }
  }

  /**
   * Get fallback recipes when database is unavailable
   */
  private static getFallbackRecipes(): Recipe[] {
    return [
      {
        id: 'fallback-1',
        name: 'Oatmeal with Berries',
        image: '',
        ingredients: [
          { id: '1', name: 'Oats', amount: '1/2', unit: 'cup' },
          { id: '2', name: 'Berries', amount: '1/2', unit: 'cup' },
          { id: '3', name: 'Almonds', amount: '2', unit: 'tbsp' }
        ],
        steps: ['Cook oats with water or milk', 'Top with berries and almonds'],
        nutrition: { calories: 320, protein: 12, fat: 8, carbs: 55 },
        cookingTime: 10,
        difficulty: 'easy' as const,
        tags: ['breakfast', 'healthy', 'quick'],
        cuisine: 'International',
        budget: 'economic' as const
      },
      {
        id: 'fallback-2',
        name: 'Chicken Breast with Vegetables',
        image: '',
        ingredients: [
          { id: '1', name: 'Chicken breast', amount: '150', unit: 'g' },
          { id: '2', name: 'Broccoli', amount: '1', unit: 'cup' },
          { id: '3', name: 'Garlic', amount: '3', unit: 'cloves' }
        ],
        steps: ['Season and cook chicken', 'Steam vegetables', 'Combine and serve'],
        nutrition: { calories: 450, protein: 35, fat: 15, carbs: 25 },
        cookingTime: 25,
        difficulty: 'medium' as const,
        tags: ['lunch', 'protein', 'healthy'],
        cuisine: 'International',
        budget: 'standard' as const
      }
    ];
  }

  /**
   * Get fallback recipe for specific calorie target
   */
  private static getFallbackRecipe(targetCalories: number): Recipe {
    return {
      id: 'fallback-recipe',
      name: 'Balanced Meal',
      image: '',
      ingredients: [
        { id: '1', name: 'Protein source', amount: '100', unit: 'g' },
        { id: '2', name: 'Vegetables', amount: '1', unit: 'cup' },
        { id: '3', name: 'Grains', amount: '1/2', unit: 'cup' }
      ],
      steps: ['Cook protein', 'Prepare vegetables', 'Serve with grains'],
      nutrition: { 
        calories: targetCalories, 
        protein: Math.round(targetCalories * 0.25 / 4), 
        fat: Math.round(targetCalories * 0.3 / 9), 
        carbs: Math.round(targetCalories * 0.45 / 4) 
      },
      cookingTime: 20,
      difficulty: 'easy' as const,
      tags: ['balanced', 'healthy'],
      cuisine: 'International',
      budget: 'standard' as const
    };
  }

  /**
   * Get meal plan for specific week from Firebase
   */
  static async getMealPlan(userId: string, week: string): Promise<MealPlan | null> {
    try {
      console.log(`📅 [AIService] Getting meal plan from Firebase - User: ${userId}, Week: ${week}`);
      
      // Query meal plans from Firestore using Admin SDK
      const querySnapshot = await db.collection('mealPlans')
        .where('userId', '==', userId)
        .where('week', '==', week)
        .get();
      
      if (querySnapshot.empty) {
        console.log(`ℹ️ [AIService] No meal plan found for user ${userId}, week ${week}`);
        return null;
      }
      
      // Get the first (and should be only) meal plan for this user and week
      const doc = querySnapshot.docs[0];
      const mealPlanData = doc.data() as MealPlan;
      
      // Convert Firestore Timestamp back to Date
      const mealPlan: MealPlan = {
        ...mealPlanData,
        id: doc.id,
        createdAt: mealPlanData.createdAt instanceof Date ? mealPlanData.createdAt : new Date(mealPlanData.createdAt)
      };
      
      console.log('✅ [AIService] Meal plan retrieved successfully from Firebase');
      return mealPlan;
    } catch (error) {
      console.error('❌ [AIService] Error getting meal plan from Firebase:', error);
      return null;
    }
  }

  /**
   * Regenerate meals for a specific day
   */
  static async regenerateDayMeals(userId: string, week: string, date: string, mealType: string): Promise<MealPlan | null> {
    try {
      console.log(`🔄 [AIService] Regenerating day meals - User: ${userId}, Week: ${week}, Date: ${date}, Meal: ${mealType}`);
      
      // Get current meal plan
      const mealPlan = await this.getMealPlan(userId, week);
      if (!mealPlan) {
        throw new Error('Meal plan not found');
      }

      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get available recipes
      const recipes = await this.getAvailableRecipes(userProfile);

      // Find the day to regenerate
      const dayIndex = mealPlan.meals.findIndex(day => day.date === date);
      if (dayIndex === -1) {
        throw new Error('Day not found in meal plan');
      }

      // Calculate daily calorie target
      const dailyCalories = this.calculateDailyCalories(userProfile);

      // Regenerate the specific day
      const regeneratedDay = await this.generateDailyMeals(userProfile, recipes, new Date(date), dailyCalories);
      mealPlan.meals[dayIndex] = regeneratedDay;

      // Save updated meal plan
      await this.saveMealPlan(mealPlan);

      console.log('✅ [AIService] Day meals regenerated and saved successfully');
      return mealPlan;
    } catch (error) {
      console.error('❌ [AIService] Error regenerating day meals:', error);
      throw error;
    }
  }

  /**
   * Get recipe suggestions based on user preferences
   */
  static async getRecipeSuggestions(userId: string, mealType: string, limit: number = 10): Promise<Recipe[]> {
    try {
      console.log(`📖 [AIService] Getting recipe suggestions - User: ${userId}, Meal: ${mealType}, Limit: ${limit}`);
      
      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get available recipes
      const recipes = await this.getAvailableRecipes(userProfile);

      // Filter for meal type
      const filteredRecipes = this.filterRecipesForMeal(recipes, mealType, userProfile);

      // Sort by relevance and return top results
      const suggestions = filteredRecipes.slice(0, limit);
      
      console.log(`✅ [AIService] Retrieved ${suggestions.length} recipe suggestions`);
      return suggestions;
    } catch (error) {
      console.error('❌ [AIService] Error getting recipe suggestions:', error);
      return this.getFallbackRecipes().slice(0, limit);
    }
  }

  /**
   * Get user profile from Firebase Firestore
   */
  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`👤 [AIService] Getting user profile from Firebase - User: ${userId}`);
      
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`ℹ️ [AIService] User profile not found for ${userId}`);
        return null;
      }
      
      const userProfile = userDoc.data() as UserProfile;
      console.log('✅ [AIService] User profile retrieved successfully from Firebase');
      return userProfile;
    } catch (error) {
      console.error('❌ [AIService] Error getting user profile from Firebase:', error);
      return null;
    }
  }
} 