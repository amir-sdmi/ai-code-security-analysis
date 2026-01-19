import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { fetchCycleLogs, fetchSymptomLogs, fetchActivityLogs } from "./apiService";

// Gemini API key - in production, this should come from environment variables or Supabase secrets
const GEMINI_API_KEY = "AIzaSyCGo4QPLUtsHTzO0f1E-rBaWumWoSKO2dY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export type AIInsight = {
  id: string;
  title: string;
  description: string;
  type: 'recommendation' | 'prediction' | 'insight';
  category: 'cycle' | 'nutrition' | 'activity' | 'sleep' | 'mental';
  confidence: number;
};

// Function to call Gemini API
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response text from Gemini's response structure
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected Gemini response structure:", data);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// This function now uses Gemini API to generate personalized insights
export const fetchPersonalizedInsights = async (userId: string): Promise<AIInsight[]> => {
  try {
    console.log("Fetching insights for user:", userId);
    
    // First try to get from Gemini API
    try {
      const userPrompt = `Generate 4 personalized health insights for a woman's health app user. 
      Format as JSON array with these properties: title (short), description (1-2 sentences), 
      type (one of: recommendation, prediction, insight), 
      category (one of: cycle, nutrition, activity, sleep, mental), 
      confidence (number between 0.6 and 0.95).
      Make insights specific to women's health topics like cycle tracking, hormonal health, 
      nutrition based on cycle phase, and mental wellbeing.`;
      
      const geminiResponse = await callGeminiAPI(userPrompt);
      
      try {
        // Parse the JSON response from Gemini
        const parsedInsights = JSON.parse(geminiResponse);
        
        // Validate and transform the response
        if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
          return parsedInsights.map(insight => ({
            id: uuidv4(),
            title: insight.title || "Health Insight",
            description: insight.description || "Personalized health recommendation based on your data",
            type: ["recommendation", "prediction", "insight"].includes(insight.type) 
              ? insight.type 
              : "recommendation",
            category: ["cycle", "nutrition", "activity", "sleep", "mental"].includes(insight.category)
              ? insight.category
              : "cycle",
            confidence: typeof insight.confidence === 'number' && insight.confidence >= 0.6 && insight.confidence <= 0.95
              ? insight.confidence
              : 0.8
          }));
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("Raw response:", geminiResponse);
      }
    } catch (geminiError) {
      console.error("Error using Gemini for insights:", geminiError);
    }
    
    // Fall back to mock insights if Gemini fails
    return generateMockInsights(userId);
  } catch (error) {
    console.error("Error in fetchPersonalizedInsights:", error);
    return generateMockInsights(userId);
  }
};

// Chat message function using Gemini
export const sendChatMessage = async (userId: string, message: string): Promise<string> => {
  console.log("Sending chat message for user:", userId, message);
  
  try {
    // First try to use Gemini API
    try {
      const userPrompt = `You are a health assistant for a women's health app called HerHealth. 
      A user has sent this message: "${message}"
      
      Respond in a helpful, accurate, and compassionate way. Focus on women's health topics like menstrual cycles, 
      pregnancy, menopause, general wellness, and mental health. If asked about serious medical conditions, 
      remind the user to consult with healthcare professionals.
      
      Keep your response under 150 words and maintain a supportive tone.`;
      
      return await callGeminiAPI(userPrompt);
    } catch (geminiError) {
      console.error("Error using Gemini for chat:", geminiError);
      
      // Try to send to backend AI service as backup
      const { data, error } = await supabase
        .functions.invoke('health-assistant-chat', {
          body: { userId, message }
        });
      
      if (error) {
        console.error("Error sending message to AI service:", error);
        throw error;
      }
      
      if (data && data.response) {
        return data.response;
      }
    }
    
    // Fallback with mock responses
    return generateMockResponse(message);
  } catch (error) {
    console.error("Error in sendChatMessage:", error);
    // Fall back to mock response
    return generateMockResponse(message);
  }
};

// Generate workout recommendations using Gemini
export const generateWorkoutRecommendations = async (
  userId: string, 
  cyclePhase: string,
  fitnessLevel: string,
  preferences: string[]
): Promise<any[]> => {
  try {
    const userPrompt = `Generate 3 workout recommendations for a woman in her ${cyclePhase} phase of menstrual cycle.
    Fitness level: ${fitnessLevel}
    Preferences: ${preferences.join(', ')}
    
    Format as JSON array with these properties for each workout:
    - title: brief workout name
    - description: 1-2 sentences about the workout
    - duration: time in minutes (between 15-60)
    - intensity: "low", "moderate", or "high"
    - benefits: array of 2-3 health benefits
    - exercises: array of 3-5 specific exercises to do`;
    
    try {
      const geminiResponse = await callGeminiAPI(userPrompt);
      const parsedWorkouts = JSON.parse(geminiResponse);
      
      if (Array.isArray(parsedWorkouts) && parsedWorkouts.length > 0) {
        return parsedWorkouts;
      }
    } catch (geminiError) {
      console.error("Error using Gemini for workouts:", geminiError);
    }
    
    // Fallback to mock workouts
    return [
      {
        title: "Gentle Flow Yoga",
        description: "A low-impact yoga session focused on relaxation and flexibility",
        duration: 30,
        intensity: "low",
        benefits: ["Stress reduction", "Improved flexibility", "Better sleep"],
        exercises: ["Cat-cow pose", "Child's pose", "Gentle twists", "Forward folds"]
      },
      {
        title: "Strength Building Circuit",
        description: "Build muscle and boost metabolism with this strength workout",
        duration: 45,
        intensity: "moderate",
        benefits: ["Increased strength", "Metabolism boost", "Improved posture"],
        exercises: ["Squats", "Modified push-ups", "Dumbbell rows", "Bridges"]
      },
      {
        title: "Cardio Dance",
        description: "Fun dance-based cardio to boost mood and energy",
        duration: 25,
        intensity: "moderate",
        benefits: ["Mood elevation", "Cardiovascular health", "Coordination"],
        exercises: ["Warm-up", "Dance intervals", "Stretching", "Cool down"]
      }
    ];
  } catch (error) {
    console.error("Error generating workout recommendations:", error);
    return [];
  }
};

// Function to generate meal suggestions
export const generateMealSuggestions = async (
  userId: string,
  cyclePhase: string = "general",
  dietaryPreferences: string[] = []
): Promise<any[]> => {
  try {
    console.log("Generating meal suggestions for user:", userId);
    
    const userPrompt = `Generate 3 meal suggestions for a woman in her ${cyclePhase} phase of menstrual cycle.
    Dietary preferences: ${dietaryPreferences.join(', ')}
    
    Format as JSON array with these properties for each meal:
    - id: unique string
    - title: meal name
    - description: short description (1-2 sentences)
    - nutritionInfo: object with calories, protein, carbs, fat (all numbers)
    - ingredients: array of strings (5-8 main ingredients)
    - benefits: array of strings (2-3 brief health benefits)
    - cyclePhaseRecommendation: brief explanation of why this meal is good for this cycle phase

    Make meals nutritionally appropriate for the specified cycle phase.`;
    
    try {
      const geminiResponse = await callGeminiAPI(userPrompt);
      
      try {
        // Parse the JSON response from Gemini
        const parsedMeals = JSON.parse(geminiResponse);
        
        // Validate and transform the response
        if (Array.isArray(parsedMeals) && parsedMeals.length > 0) {
          return parsedMeals.map(meal => ({
            ...meal,
            id: meal.id || uuidv4(),
            imageUrl: meal.imageUrl || getRandomMealImage(meal.title),
            recipeUrl: getRandomRecipeUrl()
          }));
        }
      } catch (parseError) {
        console.error("Error parsing Gemini meal response:", parseError);
        console.log("Raw response:", geminiResponse);
      }
    } catch (geminiError) {
      console.error("Error using Gemini for meal suggestions:", geminiError);
    }
    
    // Fall back to mock meals
    return generateMockMeals(cyclePhase, dietaryPreferences);
  } catch (error) {
    console.error("Error in generateMealSuggestions:", error);
    return generateMockMeals(cyclePhase, dietaryPreferences);
  }
};

// Function to generate sleep recommendations
export const getSleepRecommendations = async (
  userId: string,
  cyclePhase: string = "general"
): Promise<any[]> => {
  try {
    console.log("Generating sleep recommendations for user:", userId);
    
    const userPrompt = `Generate 3 sleep optimization recommendations for a woman in her ${cyclePhase} phase of menstrual cycle.
    
    Format as JSON array with these properties:
    - id: unique string
    - title: short title of recommendation
    - description: 1-2 sentences describing the recommendation
    - tips: array of 2-3 actionable tips
    - bedtimeSuggestion: suggested bedtime (e.g., "10:30 PM")
    - wakeSuggestion: suggested wake time (e.g., "6:30 AM")
    - cyclePhaseSpecific: boolean (true if specific to the cycle phase)
    - cyclePhaseContext: brief explanation of the hormonal context if cyclePhaseSpecific is true

    Tailor recommendations to address specific sleep challenges women face during this cycle phase.`;
    
    try {
      const geminiResponse = await callGeminiAPI(userPrompt);
      
      try {
        const parsedRecommendations = JSON.parse(geminiResponse);
        
        if (Array.isArray(parsedRecommendations) && parsedRecommendations.length > 0) {
          return parsedRecommendations.map(rec => ({
            ...rec,
            id: rec.id || uuidv4(),
            imageUrl: rec.imageUrl || getRandomSleepImage()
          }));
        }
      } catch (parseError) {
        console.error("Error parsing Gemini sleep response:", parseError);
        console.log("Raw response:", geminiResponse);
      }
    } catch (geminiError) {
      console.error("Error using Gemini for sleep recommendations:", geminiError);
    }
    
    // Fall back to mock sleep recommendations
    return generateMockSleepRecommendations(cyclePhase);
  } catch (error) {
    console.error("Error in getSleepRecommendations:", error);
    return generateMockSleepRecommendations(cyclePhase);
  }
};

// Mock mood predictions function
export const fetchMoodPredictions = async (userId: string): Promise<{ day: string; mood: number; energy: number }[]> => {
  try {
    console.log("Fetching mood predictions for user:", userId);
    
    // Try to get user's actual data to make better predictions
    const [cycles, symptoms, activities] = await Promise.all([
      fetchCycleLogs(userId),
      fetchSymptomLogs(userId),
      fetchActivityLogs(userId)
    ]);
    
    // Try to generate predictions using Gemini
    try {
      // Convert user data to simplified format for the prompt
      const cycleData = JSON.stringify(cycles).substring(0, 200) + "...";
      const symptomData = JSON.stringify(symptoms).substring(0, 200) + "...";
      
      const userPrompt = `Based on this partial cycle data: ${cycleData}
      And symptom data: ${symptomData}
      
      Generate mood and energy predictions for the next 14 days (starting today).
      Return as JSON array with objects for each day containing:
      - day: date in YYYY-MM-DD format
      - mood: number between 30-95
      - energy: number between 25-90
      
      Create realistic patterns that follow cyclical hormonal changes.`;
      
      const geminiResponse = await callGeminiAPI(userPrompt);
      
      try {
        const parsedPredictions = JSON.parse(geminiResponse);
        if (Array.isArray(parsedPredictions) && parsedPredictions.length > 0) {
          return parsedPredictions.map(pred => ({
            day: pred.day,
            mood: pred.mood,
            energy: pred.energy
          }));
        }
      } catch (parseError) {
        console.error("Error parsing Gemini predictions:", parseError);
      }
    } catch (geminiError) {
      console.error("Error using Gemini for mood predictions:", geminiError);
    }
    
    // Try to get from backend AI service if Gemini fails
    const { data, error } = await supabase
      .functions.invoke('mood-prediction', {
        body: { userId, cycles, symptoms, activities }
      });
    
    if (error) {
      console.error("Error calling mood prediction:", error);
      throw error;
    }
    
    if (data && data.predictions && Array.isArray(data.predictions)) {
      return data.predictions;
    }
    
    // Fall back to mock predictions
    return generateMockMoodPredictions();
  } catch (error) {
    console.error("Error in fetchMoodPredictions:", error);
    // Fall back to mock predictions
    return generateMockMoodPredictions();
  }
};

// Helper functions for images and mock data
const getRandomMealImage = (title: string): string => {
  const mealImages = [
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1170&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1170&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1153&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515443961218-a51367888e4b?q=80&w=1170&auto=format&fit=crop"
  ];
  
  // Simple hash function to get a deterministic image for the same meal title
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return mealImages[hash % mealImages.length];
};

const getRandomSleepImage = (): string => {
  const sleepImages = [
    "https://images.unsplash.com/photo-1455642305367-68834a9e7cb9?q=80&w=1169&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513705153361-9bc726c8db67?q=80&w=1074&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542736536-cabcba4e5ebb?q=80&w=1170&auto=format&fit=crop"
  ];
  
  return sleepImages[Math.floor(Math.random() * sleepImages.length)];
};

const getRandomRecipeUrl = (): string | undefined => {
  // 70% chance to return a URL, 30% chance to return undefined
  if (Math.random() > 0.3) {
    const urls = [
      "https://www.healthline.com/nutrition/11-recipes-for-hormone-balance",
      "https://www.womenshealthmag.com/food/g26101321/healthy-dinner-recipes/",
      "https://www.eatingwell.com/gallery/7886202/healthy-recipes-for-hormone-balance/",
      "https://www.medicalnewstoday.com/articles/322526"
    ];
    return urls[Math.floor(Math.random() * urls.length)];
  }
  return undefined;
};

// Helper function to generate mock insights for development
const generateMockInsights = (userId: string): AIInsight[] => {
  const today = new Date();
  const cycleDay = Math.floor(Math.random() * 28) + 1; // Random day in cycle
  
  return [
    {
      id: uuidv4(),
      title: "Cycle-based Nutrition",
      description: `Based on your cycle patterns, you're likely in day ${cycleDay}. Increasing iron-rich foods now may help with energy levels.`,
      type: "recommendation",
      category: "nutrition",
      confidence: 0.85
    },
    {
      id: uuidv4(),
      title: "Sleep Pattern Insight",
      description: "Your sleep data suggests you're getting 15% less deep sleep on days before your period starts. Consider a bedtime routine to improve sleep quality.",
      type: "insight",
      category: "sleep",
      confidence: 0.78
    },
    {
      id: uuidv4(),
      title: "Mood Pattern Detected",
      description: "We've noticed a pattern of lower mood reports 2-3 days before your period. Mindfulness activities may be especially helpful during this phase.",
      type: "prediction",
      category: "mental",
      confidence: 0.72
    },
    {
      id: uuidv4(),
      title: "Activity Optimization",
      description: "Your energy levels tend to peak around ovulation. This week might be ideal for higher intensity workouts if that aligns with your goals.",
      type: "recommendation",
      category: "activity",
      confidence: 0.81
    }
  ];
};

// Helper function for mock chat responses
const generateMockResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("period") || lowerMessage.includes("cycle")) {
    return "Your menstrual cycle typically consists of four phases: menstruation, the follicular phase, ovulation, and the luteal phase. Each phase is characterized by different hormone levels which can affect how you feel physically and emotionally. Tracking your symptoms can help you better understand your personal patterns.";
  }
  
  if (lowerMessage.includes("pain") || lowerMessage.includes("cramp")) {
    return "Menstrual cramps are a common experience. For relief, you might try applying heat, gentle exercise like yoga or walking, staying hydrated, and taking over-the-counter pain relievers if appropriate. If your pain is severe or interferes with daily activities, consider consulting with a healthcare provider.";
  }
  
  if (lowerMessage.includes("pregnant") || lowerMessage.includes("pregnancy")) {
    return "Pregnancy brings many changes to your body. It's important to stay in regular contact with healthcare providers, maintain a balanced diet, stay physically active as recommended by your doctor, and pay attention to your emotional wellbeing. Every pregnancy experience is unique.";
  }
  
  if (lowerMessage.includes("menopause")) {
    return "Menopause is a natural biological process marking the end of menstrual cycles. Symptoms can include hot flashes, sleep disruptions, and mood changes. Lifestyle adjustments like regular exercise, stress management, and a balanced diet can help manage symptoms. Hormone therapy and other treatments are also available - discuss options with your healthcare provider.";
  }
  
  return "Thank you for your question. I'm a health assistant focused on women's wellness topics. I can provide general information about menstrual cycles, symptoms, pregnancy, menopause, and overall wellness strategies. What specific aspect would you like to know more about?";
};

// Helper function for mock mood predictions
const generateMockMoodPredictions = (): { day: string; mood: number; energy: number }[] => {
  const predictions = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + i - 3); // Start 3 days ago
    
    predictions.push({
      day: currentDate.toISOString().split('T')[0],
      mood: Math.floor(Math.random() * 40) + 40, // Random between 40-80
      energy: Math.floor(Math.random() * 50) + 30 // Random between 30-80
    });
  }
  
  // Add more variation to make it look realistic
  const cyclePhases = [
    { mood: 60, energy: 45 },  // Menstruation
    { mood: 75, energy: 65 },  // Follicular
    { mood: 85, energy: 80 },  // Ovulation
    { mood: 75, energy: 70 },  // Early Luteal
    { mood: 55, energy: 50 },  // Late Luteal
  ];
  
  let phaseIndex = Math.floor(Math.random() * 5);
  
  return predictions.map((pred, i) => {
    // Change phase every 5-6 days
    if (i % 5 === 0 && i > 0) {
      phaseIndex = (phaseIndex + 1) % 5;
    }
    
    // Add randomness but keep within the phase pattern
    const phase = cyclePhases[phaseIndex];
    const randomVariation = Math.floor(Math.random() * 15) - 7; // -7 to +7
    
    return {
      day: pred.day,
      mood: Math.max(30, Math.min(95, phase.mood + randomVariation)),
      energy: Math.max(25, Math.min(90, phase.energy + randomVariation))
    };
  });
};

// Mock data generators
const generateMockMeals = (cyclePhase: string, dietaryPreferences: string[]): any[] => {
  const isVegetarian = dietaryPreferences.includes('vegetarian') || dietaryPreferences.includes('vegan');
  
  switch (cyclePhase) {
    case "menstrual":
      return [
        {
          id: uuidv4(),
          title: "Iron-Rich Lentil Bowl",
          description: "A warming bowl of spiced lentils with leafy greens to replenish iron levels during menstruation.",
          nutritionInfo: { calories: 380, protein: 18, carbs: 52, fat: 12 },
          ingredients: ["Lentils", "Spinach", "Sweet potatoes", "Turmeric", "Cumin", "Coconut milk"],
          imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1170&auto=format&fit=crop",
          benefits: ["Iron replenishment", "Anti-inflammatory", "Energy boosting"],
          cyclePhaseRecommendation: "Rich in iron to replenish what's lost during menstruation."
        },
        {
          id: uuidv4(),
          title: "Magnesium-Boost Smoothie",
          description: "A chocolate banana smoothie rich in magnesium to help ease menstrual cramps.",
          nutritionInfo: { calories: 320, protein: 15, carbs: 48, fat: 10 },
          ingredients: ["Banana", "Cacao powder", "Almond butter", "Chia seeds", "Almond milk", "Dates"],
          imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=1171&auto=format&fit=crop",
          benefits: ["Reduces cramping", "Mood boosting", "Energy sustaining"],
          cyclePhaseRecommendation: "High in magnesium which can help reduce menstrual cramps."
        },
        {
          id: uuidv4(),
          title: isVegetarian ? "Warming Ginger Quinoa Bowl" : "Warming Salmon & Quinoa Bowl",
          description: `A gentle, warming bowl with ${isVegetarian ? "tofu" : "salmon"}, ginger, and quinoa to ease inflammation and provide comfort.`,
          nutritionInfo: { calories: 410, protein: 22, carbs: 42, fat: 18 },
          ingredients: [isVegetarian ? "Tofu" : "Salmon", "Quinoa", "Ginger", "Broccoli", "Carrots", "Tahini dressing"],
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
          benefits: ["Anti-inflammatory", "Digestive support", "Omega-3 fatty acids"],
          cyclePhaseRecommendation: "Ginger helps reduce inflammation and menstrual pain."
        }
      ];
      
    case "follicular":
      return [
        {
          id: uuidv4(),
          title: "Spring Detox Salad",
          description: "A light, refreshing salad with fresh vegetables and herbs to support natural detoxification.",
          nutritionInfo: { calories: 320, protein: 12, carbs: 38, fat: 16 },
          ingredients: ["Arugula", "Asparagus", "Avocado", "Radishes", "Pumpkin seeds", "Lemon dressing"],
          imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1153&auto=format&fit=crop",
          benefits: ["Liver support", "Digestive health", "Skin clarity"],
          cyclePhaseRecommendation: "Light and cleansing foods support rising estrogen levels in the follicular phase."
        },
        {
          id: uuidv4(),
          title: isVegetarian ? "Mediterranean Chickpea Bowl" : "Mediterranean Chicken Bowl",
          description: `Fresh ${isVegetarian ? "chickpeas" : "chicken"} with crisp vegetables and herbs in a Mediterranean-inspired bowl.`,
          nutritionInfo: { calories: 380, protein: 24, carbs: 32, fat: 18 },
          ingredients: [isVegetarian ? "Chickpeas" : "Chicken breast", "Cucumber", "Cherry tomatoes", "Red onion", "Feta cheese", "Olive oil"],
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
          benefits: ["Balances hormones", "Supports collagen production", "Anti-inflammatory"],
          cyclePhaseRecommendation: "Fresh, light foods with healthy fats support follicular phase hormonal changes."
        },
        {
          id: uuidv4(),
          title: "Green Energy Breakfast",
          description: "An energizing breakfast bowl with greens, grains, and protein to start your day with stable energy.",
          nutritionInfo: { calories: 350, protein: 16, carbs: 42, fat: 14 },
          ingredients: ["Quinoa", "Kale", "Poached egg", "Avocado", "Hemp seeds", "Lemon"],
          imageUrl: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?q=80&w=1170&auto=format&fit=crop",
          benefits: ["Sustained energy", "Hormone balance", "Digestive support"],
          cyclePhaseRecommendation: "Supports rising energy levels during the follicular phase."
        }
      ];
      
    case "ovulation":
      return [
        {
          id: uuidv4(),
          title: "Antioxidant Power Bowl",
          description: "A colorful bowl packed with antioxidants to support optimal egg health during ovulation.",
          nutritionInfo: { calories: 390, protein: 15, carbs: 46, fat: 18 },
          ingredients: ["Blueberries", "Spinach", "Walnuts", "Quinoa", "Goat cheese", "Balsamic glaze"],
          imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1153&auto=format&fit=crop",
          benefits: ["Egg health", "Anti-inflammatory", "Hormone support"],
          cyclePhaseRecommendation: "Rich in antioxidants to support egg quality during ovulation."
        },
        {
          id: uuidv4(),
          title: isVegetarian ? "Fertility Boost Tofu Stir-fry" : "Fertility Boost Beef Stir-fry",
          description: `A nutrient-dense stir-fry with ${isVegetarian ? "tofu" : "grass-fed beef"} and vegetables to support fertility.`,
          nutritionInfo: { calories: 420, protein: 26, carbs: 38, fat: 20 },
          ingredients: [isVegetarian ? "Tofu" : "Grass-fed beef", "Broccoli", "Bell peppers", "Garlic", "Ginger", "Brown rice"],
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
          benefits: ["Fertility support", "Iron-rich", "Balances blood sugar"],
          cyclePhaseRecommendation: "Provides nutrients that support optimal fertility around ovulation."
        },
        {
          id: uuidv4(),
          title: "Zinc-Boost Oyster Mushroom Pasta",
          description: "A zinc-rich pasta dish with oyster mushrooms to support reproductive health during ovulation.",
          nutritionInfo: { calories: 380, protein: 14, carbs: 52, fat: 16 },
          ingredients: ["Oyster mushrooms", "Whole grain pasta", "Garlic", "Parsley", "Olive oil", "Lemon"],
          imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1170&auto=format&fit=crop",
          benefits: ["Reproductive health", "Balances hormones", "Supports ovulation"],
          cyclePhaseRecommendation: "Rich in zinc which supports reproductive health during ovulation."
        }
      ];
      
    case "luteal":
      return [
        {
          id: uuidv4(),
          title: "Serotonin-Boost Bowl",
          description: "A complex-carb rich bowl to boost serotonin and prevent PMS mood swings during the luteal phase.",
          nutritionInfo: { calories: 420, protein: 18, carbs: 58, fat: 14 },
          ingredients: ["Sweet potatoes", "Black beans", "Kale", "Avocado", "Pumpkin seeds", "Tahini dressing"],
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
          benefits: ["Mood stabilizing", "Reduces bloating", "Balances blood sugar"],
          cyclePhaseRecommendation: "Complex carbs help boost serotonin during the luteal phase to prevent mood swings."
        },
        {
          id: uuidv4(),
          title: "Magnesium-Rich Dark Chocolate Smoothie",
          description: "A satisfying smoothie with dark chocolate to satisfy cravings and provide luteal phase support.",
          nutritionInfo: { calories: 340, protein: 16, carbs: 42, fat: 16 },
          ingredients: ["Dark chocolate", "Banana", "Almond milk", "Almond butter", "Cacao nibs", "Cinnamon"],
          imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=1171&auto=format&fit=crop",
          benefits: ["Reduces cravings", "Mood boosting", "Magnesium-rich"],
          cyclePhaseRecommendation: "Satisfies chocolate cravings while providing magnesium to reduce PMS symptoms."
        },
        {
          id: uuidv4(),
          title: isVegetarian ? "Anti-Bloat Lentil Soup" : "Anti-Bloat Chicken Soup",
          description: `A comforting ${isVegetarian ? "lentil" : "chicken"} soup with anti-inflammatory herbs to reduce luteal phase bloating.`,
          nutritionInfo: { calories: 360, protein: 22, carbs: 38, fat: 12 },
          ingredients: [isVegetarian ? "Red lentils" : "Chicken breast", "Ginger", "Turmeric", "Carrots", "Celery", "Bone broth"],
          imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1170&auto=format&fit=crop",
          benefits: ["Reduces bloating", "Anti-inflammatory", "Digestive support"],
          cyclePhaseRecommendation: "Anti-inflammatory ingredients help reduce luteal phase bloating and discomfort."
        }
      ];
      
    default:
      return [
        {
          id: uuidv4(),
          title: "Mediterranean Power Bowl",
          description: "A balanced bowl with lean protein, healthy fats, and complex carbs for overall health.",
          nutritionInfo: { calories: 450, protein: 25, carbs: 48, fat: 18 },
          ingredients: [isVegetarian ? "Chickpeas" : "Grilled chicken", "Quinoa", "Cucumber", "Cherry tomatoes", "Feta cheese", "Olive oil"],
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop",
          benefits: ["Heart health", "Balanced energy", "Anti-inflammatory"],
          cyclePhaseRecommendation: "A balanced meal for any time of the month."
        },
        {
          id: uuidv4(),
          title: "Rainbow Antioxidant Salad",
          description: "A colorful salad packed with antioxidants and nutrients from a variety of vegetables.",
          nutritionInfo: { calories: 380, protein: 12, carbs: 42, fat: 20 },
          ingredients: ["Mixed greens", "Beets", "Carrots", "Avocado", "Walnuts", "Balsamic vinaigrette"],
          imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1153&auto=format&fit=crop",
          benefits: ["Detoxification", "Skin health", "Immune support"],
          cyclePhaseRecommendation: "Supports overall health throughout your cycle."
        },
        {
          id: uuidv4(),
          title: isVegetarian ? "Warming Ginger Tofu Soup" : "Warming Ginger Chicken Soup",
          description: `A soothing ${isVegetarian ? "tofu" : "chicken"} soup with ginger and turmeric to reduce inflammation.`,
          nutritionInfo: { calories: 320, protein: 22, carbs: 28, fat: 14 },
          ingredients: [isVegetarian ? "Tofu" : "Chicken", "Ginger", "Turmeric", "Carrots", "Celery", "Brown rice"],
          imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1170&auto=format&fit=crop",
          benefits: ["Digestive health", "Anti-inflammatory", "Immune boosting"],
          cyclePhaseRecommendation: "Good for overall wellness and reducing inflammation."
        }
      ];
  }
};

const generateMockSleepRecommendations = (cyclePhase: string): any[] => {
  switch (cyclePhase) {
    case "menstrual":
      return [
        {
          id: uuidv4(),
          title: "Temperature Adjustment",
          description: "Keep your bedroom slightly warmer during menstruation to counteract the natural temperature drop that can disturb sleep.",
          tips: [
            "Set your thermostat 2-3 degrees warmer than usual",
            "Use a heating pad before bed to warm up",
            "Wear warm socks to bed to regulate temperature"
          ],
          bedtimeSuggestion: "10:00 PM",
          wakeSuggestion: "7:00 AM",
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Your body temperature drops slightly during menstruation, making you feel colder."
        },
        {
          id: uuidv4(),
          title: "Iron-Rich Evening Snack",
          description: "Have a small iron-rich snack before bed to support blood replenishment during menstruation.",
          tips: [
            "Try dark chocolate with dried apricots",
            "A small handful of pumpkin seeds or cashews",
            "Avoid caffeine and alcohol which can worsen cramps and disrupt sleep"
          ],
          bedtimeSuggestion: "10:30 PM",
          wakeSuggestion: "7:30 AM",
          cyclePhaseSpecific: true,
          imageUrl: "https://images.unsplash.com/photo-1513705153361-9bc726c8db67?q=80&w=1074&auto=format&fit=crop"
        },
        {
          id: uuidv4(),
          title: "Extra Comfort Measures",
          description: "Use extra pillows for support and position yourself to minimize discomfort from cramps.",
          tips: [
            "Try sleeping in fetal position with a pillow between your knees",
            "Place a pillow under your lower back for support",
            "Use a heating pad on your abdomen for 15 minutes before sleep"
          ],
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Reducing physical discomfort can significantly improve sleep quality during menstruation."
        }
      ];
      
    case "follicular":
      return [
        {
          id: uuidv4(),
          title: "Evening Exercise",
          description: "Take advantage of increasing energy levels during the follicular phase with a moderate evening workout.",
          tips: [
            "Try yoga or light cardio 3-4 hours before bed",
            "Follow exercise with a cool shower to lower body temperature",
            "Finish all exercise at least 2 hours before bedtime"
          ],
          bedtimeSuggestion: "11:00 PM",
          wakeSuggestion: "6:30 AM",
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Rising estrogen during the follicular phase increases energy levels, making it a good time for evening exercise."
        },
        {
          id: uuidv4(),
          title: "Balanced Pre-Sleep Snack",
          description: "Focus on balanced blood sugar with a small protein and complex carb snack before bed.",
          tips: [
            "Try Greek yogurt with a small amount of berries",
            "A small apple with a tablespoon of almond butter",
            "Avoid high-sugar foods that may cause energy spikes"
          ],
          bedtimeSuggestion: "10:30 PM",
          wakeSuggestion: "6:00 AM",
          cyclePhaseSpecific: false
        },
        {
          id: uuidv4(),
          title: "Morning Light Exposure",
          description: "Get bright light exposure in the morning to regulate your circadian rhythm during this high-energy phase.",
          tips: [
            "Spend 15-20 minutes outside after waking up",
            "Keep your bedroom dark at night with blackout curtains",
            "Avoid blue light from devices at least 1 hour before bed"
          ],
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Setting a strong circadian rhythm during the follicular phase can improve sleep quality throughout your cycle."
        }
      ];
      
    case "ovulation":
      return [
        {
          id: uuidv4(),
          title: "Temperature Management",
          description: "Keep your bedroom cooler during ovulation to counteract the natural temperature rise that can disturb sleep.",
          tips: [
            "Set your bedroom temperature 2-3 degrees cooler than usual",
            "Use breathable, lightweight bedding",
            "Consider using a cooling pillow or mattress topper"
          ],
          bedtimeSuggestion: "10:45 PM",
          wakeSuggestion: "6:15 AM",
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Body temperature rises by about 0.5°F during ovulation, which can disrupt sleep if your room is too warm."
        },
        {
          id: uuidv4(),
          title: "Magnesium-Rich Evening Routine",
          description: "Include magnesium-rich foods or supplements in your evening routine to support deeper sleep during ovulation.",
          tips: [
            "Try a magnesium supplement 1-2 hours before bed (consult your healthcare provider)",
            "Take a warm bath with magnesium salts",
            "Include spinach or pumpkin seeds in your dinner"
          ],
          bedtimeSuggestion: "10:30 PM",
          wakeSuggestion: "6:30 AM",
          cyclePhaseSpecific: true,
          imageUrl: "https://images.unsplash.com/photo-1513705153361-9bc726c8db67?q=80&w=1074&auto=format&fit=crop"
        },
        {
          id: uuidv4(),
          title: "Evening Relaxation Practice",
          description: "Practice calming activities before bed to counter the potential increase in energy during ovulation.",
          tips: [
            "Try gentle yoga or stretching 1 hour before bed",
            "Practice 10 minutes of meditation or deep breathing",
            "Avoid stimulating content or conversations before sleep"
          ],
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Some women experience heightened energy during ovulation, making relaxation practices before bed especially important."
        }
      ];
      
    case "luteal":
      return [
        {
          id: uuidv4(),
          title: "Carbohydrate Timing",
          description: "Include complex carbohydrates with dinner to boost serotonin production and improve sleep during the luteal phase.",
          tips: [
            "Include sweet potatoes, brown rice, or quinoa with dinner",
            "Have a small carbohydrate-rich snack 2 hours before bed",
            "Combine carbs with a small amount of protein for balance"
          ],
          bedtimeSuggestion: "9:45 PM",
          wakeSuggestion: "6:45 AM",
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Declining estrogen and progesterone during the luteal phase can affect serotonin levels, impacting mood and sleep."
        },
        {
          id: uuidv4(),
          title: "Herbal Support",
          description: "Use calming herbs to counteract luteal phase anxiety or restlessness that can interfere with sleep.",
          tips: [
            "Try chamomile or lemon balm tea 1 hour before bed",
            "Consider a valerian or passionflower supplement (consult your healthcare provider)",
            "Use lavender essential oil in a diffuser in your bedroom"
          ],
          bedtimeSuggestion: "10:00 PM",
          wakeSuggestion: "7:00 AM",
          cyclePhaseSpecific: true,
          cyclePhaseContext: "Hormonal fluctuations during the luteal phase can increase anxiety and affect sleep quality."
        },
        {
          id: uuidv4(),
          title: "Anti-Inflammatory Evening Routine",
          description: "Reduce inflammation and bloating that can disrupt sleep during the luteal phase with targeted activities.",
          tips: [
            "Limit salt intake in the evening to reduce water retention",
            "Try gentle yoga poses that reduce bloating before bed",
            "Apply a warm compress to areas of tension or discomfort"
          ],
          cyclePhaseSpecific: true,
          imageUrl: "https://images.unsplash.com/photo-1513705153361-9bc726c8db67?q=80&w=1074&auto=format&fit=crop"
        }
      ];
      
    default:
      return [
        {
          id: uuidv4(),
          title: "Consistent Sleep Schedule",
          description: "Maintain a regular sleep/wake schedule to optimize your circadian rhythm and hormone balance.",
          tips: [
            "Go to bed and wake up at the same time every day",
            "Aim for 7-9 hours of sleep each night",
            "Allow no more than 30 minutes variation on weekends"
          ],
          bedtimeSuggestion: "10:30 PM",
          wakeSuggestion: "6:30 AM",
          cyclePhaseSpecific: false,
          imageUrl: "https://images.unsplash.com/photo-1542736536-cabcba4e5ebb?q=80&w=1170&auto=format&fit=crop"
        },
        {
          id: uuidv4(),
          title: "Relaxing Bedtime Routine",
          description: "Establish a calming pre-sleep routine to signal to your body it's time to wind down.",
          tips: [
            "Dim lights 1-2 hours before bed",
            "Avoid screens or use blue light blocking glasses",
            "Try reading, gentle stretching, or meditation"
          ],
          bedtimeSuggestion: "10:00 PM",
          wakeSuggestion: "7:00 AM",
          cyclePhaseSpecific: false
        },
        {
          id: uuidv4(),
          title: "Optimize Sleep Environment",
          description: "Create a sleep sanctuary that promotes deep, restorative sleep.",
          tips: [
            "Keep your room cool (65-68°F or 18-20°C)",
            "Use blackout curtains and reduce noise",
            "Invest in a supportive mattress and pillows"
          ],
          cyclePhaseSpecific: false,
          imageUrl: "https://images.unsplash.com/photo-1455642305367-68834a9e7cb9?q=80&w=1169&auto=format&fit=crop"
        }
      ];
  }
};
