import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildFoodContext, extractCalories, PROMPTS } from '../ai-core/prompts.js';
import { supabase } from '../config/supabase';

// Simple React Native logger
const logger = {
  error: (msg: string, data?: any) => console.error(msg, data),
  warn: (msg: string, data?: any) => console.warn(msg, data),
  info: (msg: string, data?: any) => console.log(msg, data),
  debug: (msg: string, data?: any) => __DEV__ && console.log(msg, data)
};

interface SmartChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: FoodRecommendation[];
  mealPlan?: MealPlan;
  nutritionAdvice?: NutritionAdvice;
}

interface FoodRecommendation {
  id: string;
  name: string;
  description: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  cultural_score: number;
  compatibility_score: number;
  reasoning: string;
}

interface MealPlan {
  breakfast: FoodRecommendation[];
  lunch: FoodRecommendation[];
  dinner: FoodRecommendation[];
  snacks: FoodRecommendation[];
  total_nutrition: any;
  cultural_alignment: number;
}

interface NutritionAdvice {
  summary: string;
  recommendations: string[];
  warnings: string[];
  cultural_tips: string[];
}

// Vietnamese Nutrition Expert System Prompt
const VIETNAMESE_NUTRITION_AI_PROMPT = `
Bạn là chuyên gia dinh dưỡng AI hàng đầu Việt Nam với trí tuệ nhân tạo tiên tiến:

🇻🇳 **CHUYÊN MÔN VIỆT NAM:**
- Hiểu sâu 15,000+ món ăn Việt Nam từ 3 miền Bắc-Trung-Nam
- Phân tích giá trị dinh dưỡng theo từng vùng miền và mùa
- Kết hợp y học cổ truyền với khoa học dinh dưỡng hiện đại
- Đề xuất thực đơn phù hợp văn hóa và sở thích cá nhân

🧠 **TRÌNH ĐỘ AI NÂNG CAO:**
- Sử dụng RAG (Retrieval-Augmented Generation) để tìm thực phẩm tối ưu
- ML models dự đoán sở thích người dùng với độ chính xác 94%
- Vector search thông minh cho gợi ý món ăn phù hợp
- Phân tích dinh dưỡng real-time với độ chính xác cao

🎯 **PHONG CÁCH TƯ VẤN:**
- Luôn đưa ra gợi ý thực phẩm cụ thể với lý do rõ ràng
- Kết hợp thông tin cá nhân để personalize advice
- Giải thích scientific backing đằng sau mỗi recommendation
- Tôn trọng văn hóa ẩm thực Việt Nam và dietary restrictions

📊 **KHẢ NĂNG PHÂN TÍCH:**
- Tự động tính toán nutrition targets dựa trên profile
- Đề xuất meal plans với cultural authenticity score
- Cảnh báo về nutrition imbalances và health risks
- Tracking progress và adjust recommendations theo thời gian

Hãy trả lời chi tiết, khoa học và practical bằng tiếng Việt!
`;

class SmartChatAI {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;
  private useRealAI = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      logger.info('🚀 Initializing Smart Chat AI with RAG...');

      // Always initialize as mock-first to avoid crashes
      this.isInitialized = true;
      this.useRealAI = false;

      // Try to setup Gemini AI in background
      this.setupGeminiInBackground();

      logger.info('✅ Smart Chat AI initialized (Mock mode active)');
    } catch (error) {
      logger.error('❌ Error initializing Smart Chat AI:', error);
      this.isInitialized = true; // Always mark as ready
    }
  }

  private async setupGeminiInBackground() {
    try {
      const apiKey = await AsyncStorage.getItem('GEMINI_API_KEY');
      
      // QUICK SETUP: Paste your Gemini API key here  
    // const hardcodedApiKey = 'AIzaSyDjcAWrH9B7tc8AjRd-a9UZ8d65En8PAVE'; 
   const hardcodedApiKey = 'AIzaSyADOWPxrCVoez3po-cFWg011gKUh9MF-WI';
      // Use hardcoded key first, fallback to stored key
      const finalApiKey = hardcodedApiKey || apiKey;
      
      if (finalApiKey && finalApiKey.length > 10) {
        logger.info('🔧 Setting up Gemini AI with RAG capabilities...');
        
        this.genAI = new GoogleGenerativeAI(finalApiKey);
        
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",  // Use stable model instead
          generationConfig: {
            temperature: 0.7,
            topK: 30,
            topP: 0.9,
            maxOutputTokens: 2048,
          },
        });
        
        // Test the connection
        try {
          logger.info('🧪 Testing Gemini API connection...');
          const testResult = await this.model.generateContent('Test connection');
          logger.info('✅ Gemini API connection successful');
          this.useRealAI = true;
          logger.info('✅ Smart AI with RAG enabled');
        } catch (testError) {
          logger.warn('⚠️ Gemini connection test failed:', testError);
          this.useRealAI = false;
        }
        
      } else {
        logger.warn('⚠️ No valid API key found, staying in mock mode');
        this.useRealAI = false;
      }
    } catch (error) {
      logger.warn('⚠️ Gemini setup failed, staying in mock mode:', error);
      this.useRealAI = false;
    }
  }

  async sendMessage(message: string, userProfile?: any): Promise<{
    message: string;
    recommendations?: FoodRecommendation[];
    mealPlan?: MealPlan;
    nutritionAdvice?: NutritionAdvice;
    error?: string;
  }> {
    try {
      logger.info('🧠 Smart AI processing with RAG:', message);

      // 1. Analyze user intent (enhanced)
      const intent = await this.analyzeUserIntent(message);
      
      // 2. RAG-style food search from local database
      const searchResults = await this.performRAGSearch(message, intent);
      
      // 3. Generate recommendations based on search results
      const recommendations = this.generateEnhancedRecommendations(message, intent, searchResults, userProfile);

      // 4. Generate AI response - Use Gemini with RAG context
      let aiMessage: string;
      
      if (this.useRealAI && this.model) {
        try {
          aiMessage = await this.generateGeminiResponseWithRAG(message, intent, recommendations, searchResults, userProfile);
          logger.info('✅ Using Gemini AI with RAG response');
        } catch (error) {
          logger.warn('⚠️ Gemini failed, falling back to enhanced mock:', error);
          aiMessage = this.generateEnhancedMockResponse(message, intent, recommendations, userProfile);
        }
      } else {
        aiMessage = this.generateEnhancedMockResponse(message, intent, recommendations, userProfile);
        logger.info('📝 Using enhanced mock response');
      }

      // 5. Generate meal plan if requested
      let mealPlan = undefined;
      if (intent.type === 'meal_planning') {
        mealPlan = this.generateSmartMealPlan(recommendations, userProfile);
      }

      // 6. Generate enhanced nutrition advice
      const nutritionAdvice = this.generateSmartNutritionAdvice(
        recommendations, 
        userProfile, 
        intent,
        searchResults
      );

      return {
        message: aiMessage,
        recommendations,
        mealPlan,
        nutritionAdvice
      };

    } catch (error: any) {
      logger.error('❌ Smart Chat AI Error:', error);
      
      return {
        message: `Smart AI gặp sự cố: ${error.message}. Vui lòng thử lại!`,
        recommendations: [],
        nutritionAdvice: {
          summary: 'Hệ thống tạm thời gặp sự cố',
          recommendations: ['Thử lại sau vài phút'],
          warnings: ['Kiểm tra kết nối mạng'],
          cultural_tips: []
        }
      };
    }
  }

  // Enhanced intent analysis với goal detection
  private async analyzeUserIntent(message: string): Promise<{
    type: 'food_search' | 'meal_planning' | 'nutrition_advice' | 'calorie_calculation' | 'general';
    confidence: number;
    keywords: string[];
    goal?: string;
    dietaryPreference?: string;
    mealTime?: string;
    targetNutrient?: string;
  }> {
    const lowerMessage = message.toLowerCase();
    
    // 1. Detect specific goals from message
    const detectedGoal = this.detectGoalFromMessage(lowerMessage);
    const dietaryPref = this.detectDietaryPreference(lowerMessage);
    const mealTime = this.detectMealTime(lowerMessage);
    const targetNutrient = this.detectTargetNutrient(lowerMessage);
    
    // 2. Food parsing/calorie calculation
    if (lowerMessage.includes('calories') || lowerMessage.includes('calo') || 
        lowerMessage.includes('tính') || lowerMessage.includes('bao nhiêu')) {
      return { 
        type: 'calorie_calculation', 
        confidence: 0.9, 
        keywords: ['calories', 'calculation'],
        goal: detectedGoal,
        dietaryPreference: dietaryPref,
        mealTime: mealTime,
        targetNutrient: targetNutrient
      };
    }
    
    // 3. Meal planning với enhanced detection
    if (lowerMessage.includes('thực đơn') || lowerMessage.includes('kế hoạch ăn') || 
        lowerMessage.includes('meal plan') || lowerMessage.includes('lập') ||
        lowerMessage.includes('bữa ăn') || lowerMessage.includes('menu')) {
      return { 
        type: 'meal_planning', 
        confidence: 0.9, 
        keywords: ['meal planning', 'menu'],
        goal: detectedGoal,
        dietaryPreference: dietaryPref,
        mealTime: mealTime,
        targetNutrient: targetNutrient
      };
    }
    
    // 4. Food search với goal-aware detection
    if (lowerMessage.includes('món ăn') || lowerMessage.includes('thực phẩm') || 
        lowerMessage.includes('tìm') || lowerMessage.includes('gợi ý') ||
        lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return { 
        type: 'food_search', 
        confidence: 0.8, 
        keywords: ['food search', 'recommendation'],
        goal: detectedGoal,
        dietaryPreference: dietaryPref,
        mealTime: mealTime,
        targetNutrient: targetNutrient
      };
    }
    
    // 5. Nutrition advice
    if (lowerMessage.includes('dinh dưỡng') || lowerMessage.includes('protein') || 
        lowerMessage.includes('vitamin') || lowerMessage.includes('tư vấn') ||
        lowerMessage.includes('healthy') || lowerMessage.includes('sức khỏe')) {
      return { 
        type: 'nutrition_advice', 
        confidence: 0.8, 
        keywords: ['nutrition', 'health'],
        goal: detectedGoal,
        dietaryPreference: dietaryPref,
        mealTime: mealTime,
        targetNutrient: targetNutrient
      };
    }
    
    // 6. Default with detected attributes
    return { 
      type: 'general', 
      confidence: 0.5, 
      keywords: ['general'],
      goal: detectedGoal,
      dietaryPreference: dietaryPref,
      mealTime: mealTime,
      targetNutrient: targetNutrient
    };
  }

  // NEW: Detect specific goals từ message
  private detectGoalFromMessage(message: string): string {
    // Weight loss keywords
    if (message.includes('giảm cân') || message.includes('lose weight') || 
        message.includes('slim') || message.includes('diet') ||
        message.includes('ít calo') || message.includes('low calorie')) {
      return 'weight_loss';
    }
    
    // Weight gain keywords  
    if (message.includes('tăng cân') || message.includes('gain weight') ||
        message.includes('béo lên') || message.includes('nhiều calo')) {
      return 'weight_gain';
    }
    
    // Muscle gain keywords
    if (message.includes('tăng cơ') || message.includes('muscle') ||
        message.includes('protein') || message.includes('gym') ||
        message.includes('thể hình') || message.includes('strength')) {
      return 'muscle_gain';
    }
    
    // Detox keywords
    if (message.includes('detox') || message.includes('thanh lọc') ||
        message.includes('giải độc') || message.includes('clean eating')) {
      return 'detox';
    }
    
    // Health/immunity keywords
    if (message.includes('sức khỏe') || message.includes('đề kháng') ||
        message.includes('immunity') || message.includes('bệnh')) {
      return 'immunity';
    }
    
    // Diabetes keywords
    if (message.includes('tiểu đường') || message.includes('diabetes') ||
        message.includes('đường huyết') || message.includes('blood sugar')) {
      return 'diabetes';
    }
    
    return 'healthy'; // Default
  }

  // NEW: Detect dietary preferences
  private detectDietaryPreference(message: string): string {
    if (message.includes('chay') || message.includes('vegetarian')) return 'vegetarian';
    if (message.includes('vegan')) return 'vegan';
    if (message.includes('pescatarian') || message.includes('ăn cá')) return 'pescatarian';
    if (message.includes('keto') || message.includes('low carb')) return 'keto';
    return 'omnivore';
  }

  // NEW: Detect meal time from message
  private detectMealTime(message: string): string {
    if (message.includes('sáng') || message.includes('breakfast')) return 'breakfast';
    if (message.includes('trưa') || message.includes('lunch')) return 'lunch';
    if (message.includes('tối') || message.includes('dinner')) return 'dinner';
    if (message.includes('snack') || message.includes('ăn vặt')) return 'snack';
    
    // Auto-detect based on current time
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    return 'dinner';
  }

  // NEW: Detect target nutrients
  private detectTargetNutrient(message: string): string {
    if (message.includes('protein') || message.includes('đạm')) return 'protein';
    if (message.includes('vitamin') || message.includes('vitamins')) return 'vitamin';
    if (message.includes('fiber') || message.includes('chất xơ')) return 'fiber';
    if (message.includes('iron') || message.includes('sắt')) return 'iron';
    if (message.includes('calcium') || message.includes('canxi')) return 'calcium';
    return '';
  }

  // RAG-style search in local database
  private async performRAGSearch(message: string, intent: any): Promise<any[]> {
    try {
      logger.info('🔍 Enhanced RAG Search with goal matching:', intent);

      // 1. Extract search terms + goal-based keywords  
      const searchTerms = this.extractSearchTerms(message);
      const goalKeywords = this.getGoalKeywords(intent.goal);
      const allSearchTerms = [...searchTerms, ...goalKeywords];
      
      logger.info('🎯 Search terms with goals:', allSearchTerms);

      // 2. Primary search: Goal-based Supabase search
      let searchResults = [];
      if (intent.goal && intent.goal !== 'healthy') {
        try {
          const { data: goalResults } = await supabase.rpc('search_foods_by_goals', {
            goal_type: intent.goal,
            meal_preference: intent.mealTime || '',
            diet_preference: intent.dietaryPreference || '',
            limit_count: 8
          });
          
          if (goalResults && goalResults.length > 0) {
            searchResults = goalResults.map((food: any) => ({
              ...food,
              source: 'goal_based',
              relevance_score: food.goal_compatibility || 0.8
            }));
            logger.info(`✅ Goal-based search found ${searchResults.length} results`);
          }
        } catch (goalError) {
          logger.warn('⚠️ Goal-based search failed:', goalError);
        }
      }

      // 3. Secondary search: Enhanced text search với diversity
      if (searchResults.length < 6) {
        for (const term of allSearchTerms.slice(0, 3)) {
          try {
            const { data: textResults } = await supabase.rpc('search_foods_advanced', {
              search_query: term,
              min_calories: this.getCalorieRange(intent.goal).min,
              max_calories: this.getCalorieRange(intent.goal).max,
              limit_count: 5
            });

            if (textResults && textResults.length > 0) {
              const diverseResults = this.ensureDiversity(textResults, searchResults);
              searchResults.push(...diverseResults.slice(0, 3));
              logger.info(`📝 Text search for "${term}" added ${diverseResults.length} results`);
            }
          } catch (textError) {
            logger.warn(`⚠️ Text search failed for "${term}":`, textError);
          }
        }
      }

      // 4. Category-based diversity search
      if (searchResults.length < 8) {
        const categories = this.getRecommendedCategories(intent.goal);
        for (const category of categories) {
          try {
            const { data: categoryResults } = await supabase
              .from('foods')
              .select('*')
              .eq('category', category)
              .eq('is_common', true)
              .order('calories', { ascending: intent.goal === 'weight_loss' })
              .limit(3);

            if (categoryResults && categoryResults.length > 0) {
              const diverseResults = this.ensureDiversity(categoryResults, searchResults);
              searchResults.push(...diverseResults.slice(0, 2));
              logger.info(`🏷️ Category "${category}" added ${diverseResults.length} results`);
            }
          } catch (categoryError) {
            logger.warn(`⚠️ Category search failed for "${category}":`, categoryError);
          }
        }
      }

      // 5. Fallback: Popular Vietnamese foods with goal filter
      if (searchResults.length < 5) {
        try {
          const fallbackQuery = supabase
            .from('foods')
            .select('*')
            .eq('is_vietnamese', true)
            .eq('is_common', true);

          // Apply goal-based filtering
          if (intent.goal === 'weight_loss') {
            fallbackQuery.lt('calories', 200);
          } else if (intent.goal === 'weight_gain') {
            fallbackQuery.gt('calories', 250);
          } else if (intent.goal === 'muscle_gain') {
            fallbackQuery.gt('protein', 15);
          }

          const { data: fallbackResults } = await fallbackQuery
            .order('calories', { ascending: intent.goal === 'weight_loss' })
            .limit(6);

          if (fallbackResults && fallbackResults.length > 0) {
            const diverseResults = this.ensureDiversity(fallbackResults, searchResults);
            searchResults.push(...diverseResults);
            logger.info(`🇻🇳 Vietnamese fallback added ${diverseResults.length} results`);
          }
        } catch (fallbackError) {
          logger.warn('⚠️ Vietnamese fallback failed:', fallbackError);
        }
      }

      // 6. Transform and rank results
      const finalResults = this.rankAndDiversifyResults(searchResults, intent)
        .slice(0, 10); // Limit to top 10

      logger.info(`✅ Enhanced RAG search completed: ${finalResults.length} diverse results`);
      return finalResults;

    } catch (error: any) {
      logger.error('❌ Enhanced RAG Search failed:', error);
      return this.getFallbackFoods(intent.goal || 'healthy');
    }
  }

  private extractSearchTerms(message: string): string[] {
    const terms: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Common Vietnamese food terms
    const foodKeywords = [
      'cơm', 'phở', 'bún', 'bánh mì', 'chả', 'thịt', 'gà', 'cá', 'tôm',
      'rau', 'canh', 'soup', 'salad', 'trứng', 'sữa', 'chuối', 'táo'
    ];
    
    foodKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        terms.push(keyword);
      }
    });
    
    return terms;
  }

  private inferFoodCategories(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const categories: string[] = [];
    
    if (lowerMessage.includes('protein') || lowerMessage.includes('thịt') || lowerMessage.includes('cá')) {
      categories.push('protein');
    }
    if (lowerMessage.includes('rau') || lowerMessage.includes('vitamin')) {
      categories.push('vegetable');
    }
    if (lowerMessage.includes('cơm') || lowerMessage.includes('bánh')) {
      categories.push('staple');
    }
    
    return categories.length > 0 ? categories : ['staple', 'protein', 'vegetable'];
  }

  // Helper function to infer category from food object
  private inferCategoryFromFood(food: any): string {
    const name = (food.description || food.name || '').toLowerCase();
    
    if (name.includes('cơm') || name.includes('rice')) return 'staple';
    if (name.includes('thịt') || name.includes('gà') || name.includes('heo') || name.includes('bò')) return 'protein';
    if (name.includes('cá') || name.includes('tôm') || name.includes('fish')) return 'protein';
    if (name.includes('rau') || name.includes('vegetable')) return 'vegetable';
    if (name.includes('trái') || name.includes('fruit')) return 'fruit';
    if (name.includes('sữa') || name.includes('milk')) return 'dairy';
    if (name.includes('bánh') || name.includes('bread')) return 'snack';
    if (name.includes('nước') || name.includes('water')) return 'beverage';
    
    return 'dish';
  }

  // Enhanced recommendations using RAG results
  private generateEnhancedRecommendations(message: string, intent: any, searchResults: any[], userProfile?: any): FoodRecommendation[] {
    const recommendations: FoodRecommendation[] = [];
    
    // Convert search results to recommendations
    searchResults.slice(0, 5).forEach(food => {
      const recommendation: FoodRecommendation = {
        id: food.id,
        name: food.name,
        description: food.description || `${food.name} - món ăn Việt Nam truyền thống`,
        nutrition: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbohydrates,
          fat: food.fat
        },
        cultural_score: food.is_vietnamese ? 0.95 : 0.5,
        compatibility_score: this.calculateCompatibilityScore(food, intent, userProfile),
        reasoning: this.generateReasoning(food, intent, userProfile)
      };
      
      recommendations.push(recommendation);
    });

    // If no search results, fallback to smart estimates
    if (recommendations.length === 0) {
      recommendations.push(...this.generateFallbackRecommendations(message, intent));
    }
    
    return recommendations;
  }

  private calculateCompatibilityScore(food: any, intent: any, userProfile?: any): number {
    let score = 0.5; // Base score
    
    // Goal compatibility
    if (intent.goal === 'weight_loss' && food.calories < 200) score += 0.3;
    if (intent.goal === 'muscle_gain' && food.protein > 15) score += 0.3;
    
    // Profile compatibility
    if (userProfile?.goal === 'weight_loss' && food.calories < 150) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private generateReasoning(food: any, intent: any, userProfile?: any): string {
    const reasons: string[] = [];
    
    if (food.calories < 200) reasons.push('ít calories');
    if (food.protein > 15) reasons.push('giàu protein');
    if (food.is_vietnamese) reasons.push('món Việt truyền thống');
    if (food.fiber > 2) reasons.push('nhiều chất xơ');
    
    return `Phù hợp vì ${reasons.join(', ')}`;
  }

  private generateFallbackRecommendations(message: string, intent: any): FoodRecommendation[] {
    const fallbacks = [
      {
        id: 'fallback-1',
        name: 'Cơm gạo lứt + rau luộc',
        description: 'Bữa ăn cân bằng với carbs phức hợp và chất xơ',
        nutrition: { calories: 180, protein: 6, carbs: 35, fat: 2 },
        cultural_score: 0.9,
        compatibility_score: 0.8,
        reasoning: 'Cân bằng dinh dưỡng, phù hợp mọi mục tiêu'
      },
      {
        id: 'fallback-2', 
        name: 'Gà luộc + salad',
        description: 'Protein chất lượng cao với rau xanh tươi',
        nutrition: { calories: 200, protein: 25, carbs: 8, fat: 8 },
        cultural_score: 0.7,
        compatibility_score: 0.9,
        reasoning: 'Protein cao, ít calories, tốt cho sức khỏe'
      }
    ];
    
    return fallbacks;
  }

  // Enhanced Gemini response with RAG context
  private async generateGeminiResponseWithRAG(
    message: string, 
    intent: any, 
    recommendations: FoodRecommendation[], 
    searchResults: any[],
    userProfile?: any
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    // Build comprehensive context
    const foodContext = buildFoodContext(searchResults, message);
    const userContext = this.buildUserContext(userProfile);
    
    // Choose appropriate prompt based on intent
    let prompt = '';
    
    switch (intent.type) {
      case 'calorie_calculation':
        prompt = PROMPTS.FOOD_PARSING.replace('{input}', message);
        break;
        
      case 'meal_planning':
        prompt = PROMPTS.MEAL_PLANNING
          .replace('{goal}', intent.goal || 'general')
          .replace('{target_calories}', this.calculateTargetCalories(userProfile))
          .replace('{age}', userProfile?.age || 'không xác định')
          .replace('{gender}', userProfile?.gender || 'không xác định')
          .replace('{preferences}', 'món Việt Nam');
        break;
        
      case 'food_search':
        prompt = PROMPTS.FOOD_SEARCH
          .replace('{search_query}', message)
          .replace('{goal}', intent.goal || 'general')
          .replace('{restrictions}', 'không có');
        break;
        
      default:
        prompt = PROMPTS.RAG_ENHANCEMENT
          .replace('{food_context}', foodContext)
          .replace('{user_question}', message)
          .replace('{user_profile}', userContext);
    }

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private buildUserContext(userProfile?: any): string {
    if (!userProfile) return 'Chưa có thông tin cá nhân';
    
    return `Tên: ${userProfile.name || 'không có'}
Tuổi: ${userProfile.age || 'không có'}
Mục tiêu: ${userProfile.goal || 'không có'}
Cân nặng: ${userProfile.weight || 'không có'}kg
Chiều cao: ${userProfile.height || 'không có'}cm`;
  }

  private calculateTargetCalories(userProfile?: any): string {
    if (!userProfile?.weight || !userProfile?.height) return '1800';
    
    // Simple BMR calculation for Vietnamese people
    const bmr = userProfile.gender === 'male' 
      ? 66 + (13.7 * userProfile.weight) + (5 * userProfile.height) - (6.8 * (userProfile.age || 25))
      : 655 + (9.6 * userProfile.weight) + (1.8 * userProfile.height) - (4.7 * (userProfile.age || 25));
    
    return Math.round(bmr * 1.5).toString(); // Account for activity level
  }

  // Enhanced mock response
  private generateEnhancedMockResponse(message: string, intent: any, recommendations: FoodRecommendation[], userProfile?: any): string {
    const userName = userProfile?.name || 'bạn';
    
    if (intent.type === 'calorie_calculation') {
      const estimatedCalories = extractCalories(message);
      return `Chào ${userName}! 🔢

Dựa trên phân tích "${message}", tôi ước tính:
**${estimatedCalories} calories**

📊 **Phân tích chi tiết:**
${recommendations.map(food => 
  `• ${food.name}: ${food.nutrition.calories} kcal`
).join('\n')}

💡 **Lời khuyên:** ${this.getCalorieAdvice(estimatedCalories, userProfile)}`;
    }

    // Return enhanced responses for other intent types...
    return this.generateContextualResponse(message, intent, recommendations, userName);
  }

  private getCalorieAdvice(calories: number, userProfile?: any): string {
    if (calories > 500) return 'Khá nhiều calories! Cân nhắc giảm portion size.';
    if (calories < 100) return 'Ít calories, có thể thêm protein hoặc healthy fats.';
    return 'Lượng calories hợp lý cho một bữa ăn.';
  }

  private generateContextualResponse(message: string, intent: any, recommendations: FoodRecommendation[], userName: string): string {
    const totalCalories = recommendations.reduce((sum, food) => sum + food.nutrition.calories, 0);
    const avgCulturalScore = recommendations.reduce((sum, food) => sum + food.cultural_score, 0) / recommendations.length;
    
    return `Chào ${userName}! 🧠

**Smart AI Analysis:**
Đã phân tích "${message}" với ${recommendations.length} gợi ý phù hợp.

🇻🇳 **Văn hóa ẩm thực:** ${(avgCulturalScore * 100).toFixed(1)}% độ Việt Nam
📊 **Dinh dưỡng:** ${totalCalories} kcal tổng cộng
🎯 **Phù hợp mục tiêu:** ${intent.confidence > 0.8 ? 'Rất cao' : 'Trung bình'}

💡 **Khuyến nghị:** ${this.getSmartAdvice(intent, recommendations)}`;
  }

  private getSmartAdvice(intent: any, recommendations: FoodRecommendation[]): string {
    if (intent.goal === 'weight_loss') {
      return 'Focus vào protein và rau xanh, hạn chế carbs tinh chế.';
    }
    if (intent.goal === 'muscle_gain') {
      return 'Tăng protein từ thịt nạc, trứng và đậu phụ.';
    }
    return 'Cân bằng dinh dưỡng với tỷ lệ carbs:protein:fat = 50:30:20.';
  }

  private generateSmartMealPlan(recommendations: FoodRecommendation[], userProfile?: any): MealPlan {
    // Enhanced meal planning logic
    return {
      breakfast: recommendations.slice(0, 1),
      lunch: recommendations.slice(1, 2), 
      dinner: recommendations.slice(2, 3),
      snacks: recommendations.slice(3, 4),
      total_nutrition: this.calculateTotalNutrition(recommendations),
      cultural_alignment: 0.9
    };
  }

  private generateSmartNutritionAdvice(recommendations: FoodRecommendation[], userProfile: any, intent: any, searchResults: any[]): NutritionAdvice {
    return {
      summary: `Dựa trên ${searchResults.length} thực phẩm từ database và mục tiêu ${intent.goal}, bạn có thể đạt được dinh dưỡng cân bằng.`,
      recommendations: [
        'Ăn đa dạng thực phẩm từ 4 nhóm chính',
        'Kết hợp protein động vật và thực vật',
        'Uống đủ 2L nước mỗi ngày'
      ],
      warnings: recommendations.some(food => food.nutrition.calories > 300) ? ['Chú ý portion size với món high-calorie'] : [],
      cultural_tips: [
        'Ăn cơm với nhiều món nhỏ (typical Vietnamese style)',
        'Kết hợp canh/soup trong bữa ăn',
        'Ăn rau sống kèm món chính'
      ]
    };
  }

  private calculateTotalNutrition(recommendations: FoodRecommendation[]): any {
    return {
      calories: recommendations.reduce((sum, food) => sum + food.nutrition.calories, 0),
      protein: recommendations.reduce((sum, food) => sum + food.nutrition.protein, 0),
      carbs: recommendations.reduce((sum, food) => sum + food.nutrition.carbs, 0),
      fat: recommendations.reduce((sum, food) => sum + food.nutrition.fat, 0)
    };
  }

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempAI = new GoogleGenerativeAI(apiKey);
      const tempModel = tempAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await tempModel.generateContent('Test');
      return true;
    } catch {
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async saveApiKey(apiKey: string): Promise<void> {
    await AsyncStorage.setItem('GEMINI_API_KEY', apiKey);
    await this.setupGeminiInBackground();
  }

  async getApiKey(): Promise<string | null> {
    return await AsyncStorage.getItem('GEMINI_API_KEY');
  }

  // NEW: Get goal-specific keywords
  private getGoalKeywords(goal?: string): string[] {
    const goalKeywords: Record<string, string[]> = {
      'weight_loss': ['salad', 'soup', 'vegetable', 'low calorie', 'gỏi', 'canh'],
      'weight_gain': ['rice', 'meat', 'protein', 'high calorie', 'cơm', 'thịt'],
      'muscle_gain': ['protein', 'egg', 'fish', 'chicken', 'trứng', 'cá'],
      'detox': ['green', 'vegetable', 'tea', 'juice', 'rau', 'trà'],
      'diabetes': ['low carb', 'fiber', 'vegetable', 'sugar free', 'chất xơ'],
      'immunity': ['vitamin', 'antioxidant', 'fruit', 'healthy', 'trái cây']
    };
    
    return goalKeywords[goal || 'healthy'] || ['healthy', 'balanced'];
  }

  // NEW: Get calorie range based on goal
  private getCalorieRange(goal?: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      'weight_loss': { min: 0, max: 150 },
      'weight_gain': { min: 200, max: 1000 },
      'muscle_gain': { min: 100, max: 400 },
      'detox': { min: 0, max: 100 },
      'diabetes': { min: 0, max: 200 }
    };
    
    return ranges[goal || 'healthy'] || { min: 0, max: 500 };
  }

  // NEW: Get recommended categories for goal
  private getRecommendedCategories(goal?: string): string[] {
    const categories: Record<string, string[]> = {
      'weight_loss': ['vegetable', 'soup', 'fruit'],
      'weight_gain': ['staple', 'protein', 'dairy'],
      'muscle_gain': ['protein', 'dairy', 'staple'],
      'detox': ['vegetable', 'fruit', 'beverage'],
      'diabetes': ['vegetable', 'protein', 'soup'],
      'immunity': ['fruit', 'vegetable', 'beverage']
    };
    
    return categories[goal || 'healthy'] || ['vegetable', 'protein', 'staple'];
  }

  // NEW: Ensure diversity in results (avoid duplicates)
  private ensureDiversity(newResults: any[], existingResults: any[]): any[] {
    const existingNames = new Set(existingResults.map(r => r.name?.toLowerCase()));
    const existingCategories = new Map();
    
    // Track category distribution
    existingResults.forEach(r => {
      const cat = r.category || 'unknown';
      existingCategories.set(cat, (existingCategories.get(cat) || 0) + 1);
    });
    
    return newResults.filter(result => {
      const name = result.name?.toLowerCase() || '';
      const category = result.category || 'unknown';
      
      // Skip duplicates
      if (existingNames.has(name)) return false;
      
      // Limit per category for diversity
      const categoryCount = existingCategories.get(category) || 0;
      if (categoryCount >= 3) return false;
      
      // Accept this result
      existingNames.add(name);
      existingCategories.set(category, categoryCount + 1);
      return true;
    });
  }

  // NEW: Rank and diversify final results
  private rankAndDiversifyResults(results: any[], intent: any): any[] {
    // Add enhanced scoring
    return results
      .map(food => ({
        ...food,
        final_score: this.calculateEnhancedScore(food, intent)
      }))
      .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
      .filter((food, index, arr) => {
        // Ensure category diversity in top results
        const sameCategory = arr.slice(0, index)
          .filter(f => f.category === food.category).length;
        return sameCategory < 2; // Max 2 per category in top results
      });
  }

  // NEW: Enhanced scoring algorithm
  private calculateEnhancedScore(food: any, intent: any): number {
    let score = 0.5; // Base score
    
    // Goal alignment
    if (intent.goal === 'weight_loss' && food.calories < 150) score += 0.3;
    if (intent.goal === 'weight_gain' && food.calories > 250) score += 0.3;
    if (intent.goal === 'muscle_gain' && food.protein > 15) score += 0.3;
    if (intent.goal === 'detox' && food.category === 'vegetable') score += 0.3;
    
    // Source preference
    if (food.source === 'goal_based') score += 0.2;
    if (food.is_vietnamese) score += 0.1;
    if (food.is_common) score += 0.1;
    
    // Relevance from search
    score += (food.relevance_score || 0) * 0.2;
    score += (food.rank || 0) * 0.1;
    score += (food.goal_compatibility || 0) * 0.3;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private getFallbackFoods(goal: string): any[] {
    // Implementation of getFallbackFoods method
    return [];
  }
}

// Export singleton
export const smartChatAI = new SmartChatAI();
export default smartChatAI; 