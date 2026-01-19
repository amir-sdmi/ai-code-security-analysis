import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, generateToken, verifyPassword, hashPassword } from "./storage";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Stripe from "stripe";
import {
  analyzeImageRequestSchema,
  analyzeImageResponseSchema,
  loginSchema,
  registerSchema,
  authResponseSchema,
  insertSavedRecipeSchema,
  type AnalyzeImageResponse,
  type YoutubeVideo,
  type AuthResponse,
  type User,
  type InsertSavedRecipe,
  type SavedRecipe,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { getMockAnalysisResponse } from "./mockData";
import { searchYouTubeVideos } from "./services/youtubeService";

// Simple mock user ID for guest access
const GUEST_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Flag to enable development mode with mock data when API quota is exceeded
  const USE_MOCK_DATA_ON_QUOTA_EXCEEDED = false;
  
  // Initialize the Google Generative AI API with the user-provided key
  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || ""
  );

  // Define the model to use for image analysis
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  app.post("/api/analyze-image", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = analyzeImageRequestSchema.parse(req.body);
      const { imageData } = validatedData;

      // Remove the data URL prefix to get the base64 string
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, "");

      // Prepare the image part
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
          },
        },
      ];

      // Generate content using Gemini API
      const prompt = `
      You are a professional culinary consultant, food scientist, and master chef specializing in detailed recipe analysis and development.
      
      Analyze this food image in extreme detail and provide:
      
      1. The exact name of the dish with any regional variations or authentic naming
      2. A comprehensive yet concise description of the dish including cultural context, origin, and traditional serving occasions
      3. Detailed tags/categories (cuisine type, regional cuisine, diet type, meal type, cooking method, flavor profile, texture)
      
      4. A single comprehensive, authentic recipe for how to make this dish. Include:
         - Creative and descriptive title that captures the recipe's unique aspects
         - Detailed description highlighting what makes this version special
         - Precise preparation time, cooking time, and total time (also include active vs passive time breakdown)
         - Exact servings with portion size information
         - Specific difficulty level with brief explanation of what makes it that level
         - Comprehensive dietary tags including allergies (gluten-free, dairy-free, nut-free, etc.)
         - Complete list of required equipment and tools with descriptions and alternatives
         - Complete ingredients list organized by preparation stage or component with precise measurements, prep notes, and quality indicators
         - Step-by-step instructions with detailed professional chef techniques, visual cues for doneness, and time estimates for each step
         - Technique details explaining complex cooking methods with visual cues and common errors
         - Complete nutritional profile with macronutrient breakdown, allergens, and dietary compliance information
         - Cultural context including origin, history, traditional serving customs, and festive relevance
         - Plating and presentation guidance with garnishing tips and photography suggestions
         - Science behind the recipe explaining key reactions and techniques
         - Sensory guidance describing taste progression, aroma indicators, and texture descriptors
         - Success indicators showing how to recognize when each step is done correctly
         - Healthy alternatives for key ingredients with specific substitution ratios
         - Detailed dietary notes and meal planning suggestions
         - Recipe variations with precise adjustments and flavor profiles
         - Expert chef tips and common mistakes to avoid
         - Storage instructions and reheating methods
         - Wine or beverage pairing suggestions
         - Complementary side dishes with preparation details
      
      Format your response as a JSON object with the following structure:
      {
        "foodName": "Complete authentic name of the dish",
        "description": "Comprehensive description with cultural context",
        "tags": ["cuisine", "regional", "diet type", "meal type", "cooking method", "flavor profile", "texture"],
        "recipes": [
          {
            "title": "Descriptive recipe title",
            "description": "Detailed recipe description with what makes it unique",
            "prepTime": "Precise prep time",
            "cookTime": "Precise cook time",
            "totalTime": "Total time",
            "activeTime": "Time requiring active cooking",
            "passiveTime": "Time not requiring active attention",
            "servings": number,
            "servingSize": "Description of portion size",
            "difficulty": "Difficulty level with brief explanation",
            "tags": ["dietary restriction", "allergy info"],
            "equipment": [
              {
                "name": "Equipment name",
                "description": "What it's used for in this recipe",
                "alternatives": ["Alternative tools if available"],
                "difficultyToUse": "How challenging this tool is to use properly"
              }
            ],
            "ingredientGroups": [
              {
                "groupName": "Component or preparation stage name",
                "ingredients": ["Detailed ingredients with measurements"],
                "preparationNotes": "Special notes about preparing this group"
              }
            ],
            "ingredients": ["Complete list of all ingredients with measurements"],
            "instructions": ["Detailed steps with technique information"],
            "techniqueDetails": [
              {
                "name": "Technique name",
                "description": "Detailed explanation of the technique",
                "visualCues": ["How to tell when done correctly"],
                "commonErrors": ["Mistakes to avoid with this technique"]
              }
            ],
            "chefTips": ["Professional cooking tips"],
            "commonMistakes": ["Mistakes to avoid"],
            "storageInstructions": "How to store and for how long",
            "reheatingMethods": "Best ways to reheat",
            "beveragePairings": ["Complementary drink suggestions"],
            "successIndicators": ["How to know each critical step is done correctly"],
            "nutritionInfo": {
              "calories": number,
              "protein": "amount in grams",
              "carbs": "amount in grams",
              "fats": "amount in grams",
              "fiber": "amount in grams",
              "sugar": "amount in grams",
              "sodium": "amount in mg",
              "vitamins": ["key vitamins and minerals present"],
              "healthyAlternatives": ["specific alternative with substitution ratio"],
              "dietaryNotes": ["detailed note about nutritional benefits"],
              "macronutrientRatio": {
                "protein": number as percentage,
                "carbs": number as percentage,
                "fats": number as percentage
              },
              "allergens": ["Common allergens present in the recipe"],
              "dietaryCompliance": ["Diets this recipe complies with"]
            },
            "variations": [
              {
                "type": "variation type",
                "description": "Detailed description of this variation",
                "adjustments": ["precise ingredient adjustments with measurements"]
              }
            ],
            "sideDishSuggestions": [
              {
                "name": "Side dish name",
                "description": "Detailed description",
                "preparationTime": "Precise preparation time",
                "pairingReason": "Why this complements the main dish"
              }
            ],
            "culturalContext": {
              "origin": "Geographic origin of the dish",
              "history": "Brief history of the dish's development",
              "traditionalServing": "How it's traditionally served",
              "festiveRelevance": ["Holidays or celebrations associated with this dish"]
            },
            "presentationGuidance": {
              "platingSuggestions": ["Professional plating ideas"],
              "garnishingTips": ["Effective garnishing techniques"],
              "photoTips": ["How to take appealing photos of the dish"]
            },
            "cookingScience": {
              "keyReactions": ["Important chemical/cooking reactions"],
              "techniquePurpose": ["Scientific reasons for specific techniques"],
              "safetyTips": ["Food safety considerations"]
            },
            "sensoryGuidance": {
              "tasteProgression": ["How flavors develop during eating"],
              "aromaIndicators": ["What smells indicate doneness or quality"],
              "textureDescriptors": ["Detailed texture profiles and how to achieve them"]
            },
            "mealPlanningNotes": ["Suggestions for incorporating into meal plans"]
          }
        ]
      }

      Ensure the JSON is valid with no trailing commas. Make your response extremely detailed, professional, and useful for both amateur and professional cooks, but still ensure the JSON is properly formatted and parseable.
      `;

      try {
        // Start a chat session and send message with the food image
        const chatSession = model.startChat({
          history: [],
        });
        
        const result = await chatSession.sendMessage([prompt, ...imageParts]);
        const response = result.response;
        const text = response.text();

        // Extract the JSON from the response - handle multiple possible formats
        let jsonContent = '';
        
        // First try to extract JSON from code blocks (most common format)
        const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonContent = codeBlockMatch[1].trim();
        } 
        // Then try to find JSON object directly 
        else {
          // Look for a complete JSON object with outer braces
          const directJsonMatch = text.match(/(\{[\s\S]*\})/);
          if (directJsonMatch && directJsonMatch[1]) {
            jsonContent = directJsonMatch[1].trim();
          } else {
            // As a last resort, use the whole text and hope for the best
            jsonContent = text.trim();
          }
        }
        
        // Additional cleanup to ensure valid JSON
        // Remove any trailing commas which are not valid in JSON
        jsonContent = jsonContent
          .replace(/,\s*}/g, '}') // Fix trailing commas in objects
          .replace(/,\s*\]/g, ']'); // Fix trailing commas in arrays
        
        // Extra validation and debug info before parsing
        if (!jsonContent || jsonContent.trim() === '') {
          console.error("Empty JSON content from Gemini API");
          console.log("Full API text response:", text);
          return res.status(500).json({
            error: "Empty response from AI",
            details: "The AI service returned an empty response. Please try with a clearer food image."
          });
        }

        // Log first part of the JSON response for debugging (limit to first 100 chars)
        console.log("Attempting to parse Gemini response:", jsonContent.substring(0, 100) + '...');
        
        // Parse the JSON response
        try {
          // Attempt to parse JSON with additional safety checks
          let parsedData;
          try {
            parsedData = JSON.parse(jsonContent);
          } catch (jsonParseError) {
            console.error("JSON parsing error:", jsonParseError);
            console.log("Invalid JSON content:", jsonContent.substring(0, 500) + '...');
            
            // Try to clean up the JSON further before giving up
            const cleanedJson = jsonContent
              .replace(/(\w+):/g, '"$1":') // Convert unquoted property names to quoted
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas in objects/arrays
              
            try {
              parsedData = JSON.parse(cleanedJson);
              console.log("Successfully parsed after cleanup");
            } catch (secondAttemptError) {
              // Still failed, return proper error
              return res.status(500).json({
                error: "Invalid response format", 
                details: "The AI service returned data in an unexpected format. Please try again with a clearer food image."
              });
            }
          }
          
          // Log success and check for required fields
          console.log("Successfully parsed JSON response");
          if (!parsedData.foodName) {
            console.warn("Missing foodName in parsed data");
          }
          if (!Array.isArray(parsedData.recipes) || parsedData.recipes.length === 0) {
            console.warn("Missing or empty recipes array in parsed data");
          }
          
          // Process and normalize the response to ensure it matches our schema
          // For example, handle any nested structures, ensure arrays exist, etc.
          const normalizedData = {
            ...parsedData,
            recipes: parsedData.recipes?.map((recipe: any) => ({
              ...recipe,
              // Ensure required fields have defaults if missing
              servings: recipe.servings || 4,
              ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
              instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
              // Handle variations edge cases (if it exists but isn't in expected format)
              variations: Array.isArray(recipe.variations) ? recipe.variations.map((v: any) => ({
                type: v.type || 'spicy',
                description: v.description || '',
                adjustments: Array.isArray(v.adjustments) ? v.adjustments : []
              })) : [],
              // Handle nutrition info edge cases
              nutritionInfo: recipe.nutritionInfo ? {
                ...recipe.nutritionInfo,
                // Handle calories whether it's a number or string containing a number
                calories: typeof recipe.nutritionInfo.calories === 'number' ? 
                  recipe.nutritionInfo.calories : 
                  (typeof recipe.nutritionInfo.calories === 'string' ? 
                    parseInt(recipe.nutritionInfo.calories, 10) || 0 : 0),
                // Ensure required fields exist with proper formats
                protein: recipe.nutritionInfo.protein?.toString() || "0g",
                carbs: recipe.nutritionInfo.carbs?.toString() || "0g",
                fats: recipe.nutritionInfo.fats?.toString() || "0g",
                fiber: recipe.nutritionInfo.fiber?.toString() || "0g",
                sugar: recipe.nutritionInfo.sugar?.toString() || "0g",
                // Handle optional fields
                sodium: recipe.nutritionInfo.sodium?.toString() || undefined,
                vitamins: Array.isArray(recipe.nutritionInfo.vitamins) ? 
                  recipe.nutritionInfo.vitamins : [],
                // Handle complex structures that might come as arrays or objects
                healthyAlternatives: Array.isArray(recipe.nutritionInfo.healthyAlternatives) ? 
                  recipe.nutritionInfo.healthyAlternatives.map((alt: any) => 
                    typeof alt === 'string' ? alt : 
                    (alt.ingredient && alt.alternative ? 
                      `${alt.ingredient} → ${alt.alternative} (${alt.effect || 'alternative'})` : 
                      JSON.stringify(alt)
                    )
                  ) : [],
                dietaryNotes: Array.isArray(recipe.nutritionInfo.dietaryNotes) ? 
                  recipe.nutritionInfo.dietaryNotes.map((note: any) => typeof note === 'string' ? note : JSON.stringify(note)) : []
              } : {
                calories: 0,
                protein: "0g",
                carbs: "0g",
                fats: "0g",
                fiber: "0g",
                sugar: "0g",
                healthyAlternatives: [],
                dietaryNotes: []
              }
            })) || []
          };
          
          // Validate the response against our schema
          try {
            // Log the structure of the data before validation to debug
            console.log("Normalized data structure (for debugging):", 
              JSON.stringify({
                foodName: typeof normalizedData.foodName,
                description: typeof normalizedData.description,
                tags: Array.isArray(normalizedData.tags) ? "array" : typeof normalizedData.tags,
                recipes: Array.isArray(normalizedData.recipes) ? 
                  normalizedData.recipes.map((r: any) => ({
                    title: typeof r.title,
                    description: typeof r.description,
                    nutritionInfo: r.nutritionInfo ? {
                      calories: typeof r.nutritionInfo.calories,
                      protein: typeof r.nutritionInfo.protein,
                      carbs: typeof r.nutritionInfo.carbs,
                      fats: typeof r.nutritionInfo.fats,
                    } : "missing"
                  })) : "not-array"
              }, null, 2)
            );
            
            // Special handling for nested objects within the response
            const finalData = {
              // Convert top-level fields to strings
              foodName: String(normalizedData.foodName || ""),
              description: String(normalizedData.description || ""),
              tags: Array.isArray(normalizedData.tags) ? 
                normalizedData.tags.map((tag: any) => String(tag || "")) : [],
              recipes: normalizedData.recipes?.map((recipe: any) => ({
                ...recipe,
                // Convert all property values to strings if they're not already
                title: String(recipe.title || ""),
                description: String(recipe.description || ""),
                prepTime: String(recipe.prepTime || ""),
                cookTime: String(recipe.cookTime || ""),
                totalTime: String(recipe.totalTime || ""),
                servingSize: String(recipe.servingSize || ""),
                difficulty: String(recipe.difficulty || ""),
                storageInstructions: String(recipe.storageInstructions || ""),
                reheatingMethods: String(recipe.reheatingMethods || ""),
                chefTips: Array.isArray(recipe.chefTips) ? 
                  recipe.chefTips.map((tip: any) => String(tip || "")) : [],
                commonMistakes: Array.isArray(recipe.commonMistakes) ? 
                  recipe.commonMistakes.map((mistake: any) => String(mistake || "")) : [],
                beveragePairings: Array.isArray(recipe.beveragePairings) ? 
                  recipe.beveragePairings.map((pairing: any) => String(pairing || "")) : [],
                ingredients: Array.isArray(recipe.ingredients) ? 
                  recipe.ingredients.map((ing: any) => {
                    // Handle objects that might be returned instead of strings
                    if (ing === null || ing === undefined) return "";
                    
                    // If it's an object with item and quantity properties (common format from Gemini API)
                    if (typeof ing === 'object') {
                      if (ing.item && ing.quantity) {
                        let formattedIngredient = `${ing.quantity} ${ing.item}`;
                        
                        // Add preparation note if available
                        if (ing.prep && ing.prep !== "null") {
                          formattedIngredient += `, ${ing.prep}`;
                        }
                        
                        // Add quality information if available
                        if (ing.quality && ing.quality !== "null") {
                          formattedIngredient += ` (${ing.quality})`;
                        }
                        
                        return formattedIngredient;
                      }
                      
                      // If it has a name property
                      if (ing.name) {
                        let formatted = ing.name;
                        if (ing.amount) formatted = `${ing.amount} ${formatted}`;
                        if (ing.notes) formatted += ` - ${ing.notes}`;
                        return formatted;
                      }
                      
                      // If all else fails, turn it into a JSON string
                      return JSON.stringify(ing);
                    }
                    
                    return String(ing);
                  }) : [],
                instructions: Array.isArray(recipe.instructions) ? 
                  recipe.instructions.map((inst: any) => {
                    // Handle objects that might be returned instead of strings
                    if (inst === null || inst === undefined) return "";
                    
                    if (typeof inst === 'object') {
                      // For numbered instruction objects (common format)
                      if (inst.number && inst.instruction) {
                        return String(inst.instruction);
                      }
                      
                      // For step objects with action and ingredients
                      if (inst.action) {
                        let formattedStep = inst.action;
                        
                        // Include ingredients if available
                        if (inst.ingredients) {
                          if (Array.isArray(inst.ingredients) && inst.ingredients.length > 0) {
                            formattedStep += ` ${inst.ingredients.join(', ')}`;
                          } else if (typeof inst.ingredients === 'string') {
                            formattedStep += ` ${inst.ingredients}`;
                          }
                        }
                        
                        // Add any additional details
                        if (inst.duration) {
                          formattedStep += ` for ${inst.duration}`;
                        }
                        
                        if (inst.note) {
                          formattedStep += ` (${inst.note})`;
                        }
                        
                        return formattedStep;
                      }
                      
                      // For step objects with text or description
                      if (inst.text) return String(inst.text);
                      if (inst.description) return String(inst.description);
                      if (inst.step) return String(inst.step);
                      
                      // If all else fails, turn it into a JSON string but formatted more nicely
                      return JSON.stringify(inst);
                    }
                    
                    return String(inst);
                  }) : [],
                tags: Array.isArray(recipe.tags) ? 
                  recipe.tags.map((tag: any) => String(tag || "")) : [],
                nutritionInfo: recipe.nutritionInfo ? {
                  ...recipe.nutritionInfo,
                  protein: String(recipe.nutritionInfo.protein || "0g"),
                  carbs: String(recipe.nutritionInfo.carbs || "0g"),
                  fats: String(recipe.nutritionInfo.fats || "0g"),
                  fiber: String(recipe.nutritionInfo.fiber || "0g"),
                  sugar: String(recipe.nutritionInfo.sugar || "0g"),
                  sodium: recipe.nutritionInfo.sodium ? String(recipe.nutritionInfo.sodium) : undefined,
                  vitamins: Array.isArray(recipe.nutritionInfo.vitamins) ? 
                    recipe.nutritionInfo.vitamins.map((v: any) => String(v || "")) : [],
                  healthyAlternatives: Array.isArray(recipe.nutritionInfo.healthyAlternatives) ? 
                    recipe.nutritionInfo.healthyAlternatives.map((alt: any) => String(alt || "")) : [],
                  dietaryNotes: Array.isArray(recipe.nutritionInfo.dietaryNotes) ? 
                    recipe.nutritionInfo.dietaryNotes.map((note: any) => String(note || "")) : []
                } : {
                  calories: 0,
                  protein: "0g",
                  carbs: "0g",
                  fats: "0g",
                  fiber: "0g",
                  sugar: "0g",
                  healthyAlternatives: [],
                  dietaryNotes: []
                },
                variations: Array.isArray(recipe.variations) ? 
                  recipe.variations.map((v: any) => ({
                    type: String(v.type || ""),
                    description: String(v.description || ""),
                    adjustments: Array.isArray(v.adjustments) ? 
                      v.adjustments.map((adj: any) => String(adj || "")) : []
                  })) : [],
                sideDishSuggestions: Array.isArray(recipe.sideDishSuggestions) ? 
                  recipe.sideDishSuggestions.map((s: any) => ({
                    name: String(s.name || ""),
                    description: String(s.description || ""),
                    preparationTime: String(s.preparationTime || ""),
                    pairingReason: String(s.pairingReason || "")
                  })) : []
              }))
            };
            
            // Fetch related YouTube videos for the recipe
            let youtubeVideos: YoutubeVideo[] = [];
            try {
              console.log("Fetching YouTube videos for:", finalData.foodName);
              youtubeVideos = await searchYouTubeVideos(finalData.foodName, 5);
              console.log(`Found ${youtubeVideos.length} YouTube videos`);
            } catch (youtubeError) {
              console.error("Error fetching YouTube videos:", youtubeError);
              // Continue with empty videos rather than failing the request
            }

            // Add YouTube videos to the response
            const responseWithVideos = {
              ...finalData,
              youtubeVideos
            };

            const validatedResponse = analyzeImageResponseSchema.parse(responseWithVideos);
            return res.status(200).json(validatedResponse);
          } catch (validationErr) {
            console.error("Schema validation error:", validationErr);
            
            if (USE_MOCK_DATA_ON_QUOTA_EXCEEDED) {
              console.log("Using mock data due to schema validation errors");
              
              const mockResponse = getMockAnalysisResponse();
              // Use the mock data without any demo mode indicators
              return res.status(200).json(mockResponse);
            }
            
            return res.status(500).json({
              error: "Invalid AI response",
              details: "The AI service provided a response that doesn't match our expected format. Please try again with a clearer food image."
            });
          }
        } catch (err) {
          console.error("Error parsing Gemini API response:", err);
          console.log("Raw response:", text);
          
          if (USE_MOCK_DATA_ON_QUOTA_EXCEEDED) {
            console.log("Using mock data due to parsing error");
            
            const mockResponse = getMockAnalysisResponse();
            // Use the mock data without any demo mode indicators
            return res.status(200).json(mockResponse);
          }
          
          return res.status(500).json({ 
            error: "Could not parse the AI response properly",
            details: "The response format from Gemini API was unexpected" 
          });
        }
      } catch (apiError: any) {
        console.error("API request error:", apiError);
        
        // Check if it's a quota or rate limit error (status code 429)
        if (apiError.status === 429) {
          // If in development mode, use mock data for demo purposes when quota is exceeded
          if (USE_MOCK_DATA_ON_QUOTA_EXCEEDED) {
            console.log("API quota exceeded, using mock data in development mode");
            
            // Use mock recipe data without any demo mode indicators
            const mockResponse = getMockAnalysisResponse();
            return res.status(200).json(mockResponse);
          }
          
          // In production mode, return the actual error
          return res.status(429).json({
            error: "API quota exceeded",
            details: "The Gemini API quota has been exceeded. Please try again later or upgrade your API plan.",
            retryAfter: apiError?.errorDetails?.[2]?.retryDelay || "60s"
          });
        }

        return res.status(500).json({
          error: "AI service error",
          details: "There was a problem connecting to the AI service. Please try again later."
        });
      }
    } catch (err) {
      console.error("Error in image analysis:", err);
      
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationError.message 
        });
      }
      
      // Handle PayloadTooLargeError from Express
      if ((err as any)?.type === 'entity.too.large' || 
          (err as Error).message?.includes('request entity too large')) {
        return res.status(413).json({
          error: "Image too large",
          details: "The uploaded image exceeds the maximum size limit. Please upload a smaller image (max 5MB)."
        });
      }
      
      return res.status(500).json({ 
        error: "Error analyzing image", 
        details: err instanceof Error ? err.message : "Unknown error" 
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists"
        });
      }
      
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "This username is already taken"
        });
      }
      
      // Create new user
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
        displayName: validatedData.username
      });
      
      // Create session token
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days token expiration
      
      await storage.createSession({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Return user data and token
      const authResponse: AuthResponse = {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImage: user.profileImage
        },
        token,
        message: "Registration successful"
      };
      
      return res.status(201).json(authResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: fromZodError(error).message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
      
      // Verify password
      const [storedHash, salt] = user.password.split(':');
      const isValid = verifyPassword(validatedData.password, storedHash, salt);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
      
      // Create session token
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days token expiration
      
      await storage.createSession({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Return user data and token
      const authResponse: AuthResponse = {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImage: user.profileImage
        },
        token,
        message: "Login successful"
      };
      
      return res.status(200).json(authResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: fromZodError(error).message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (token) {
        await storage.deleteSession(token);
      }
      
      return res.status(200).json({
        success: true,
        message: "Logout successful"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Return a guest user instead
      return res.status(200).json({
        success: true,
        user: {
          id: GUEST_USER_ID,
          username: "guest",
          email: "guest@example.com",
          displayName: "Guest User",
          profileImage: null
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user information",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Saved recipes routes
  app.get("/api/recipes", async (req: Request, res: Response) => {
    try {
      const recipes = await storage.getSavedRecipes(GUEST_USER_ID);
      
      return res.status(200).json({
        success: true,
        recipes
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve saved recipes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/recipes", async (req: Request, res: Response) => {
    try {
      
      // Extract recipe data from request
      const recipeData: AnalyzeImageResponse = req.body.recipe;
      
      if (!recipeData || !recipeData.foodName || !Array.isArray(recipeData.recipes) || recipeData.recipes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe data"
        });
      }
      
      // Create saved recipe entry
      const savedRecipe = await storage.createSavedRecipe({
        userId: GUEST_USER_ID,
        recipeData: recipeData,
        foodName: recipeData.foodName,
        description: recipeData.description,
        imageUrl: req.body.imageUrl || null,
        tags: recipeData.tags || [],
        favorite: false
      });
      
      return res.status(201).json({
        success: true,
        message: "Recipe saved successfully",
        recipe: savedRecipe
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to save recipe",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/recipes/:id", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      
      if (isNaN(recipeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe ID"
        });
      }
      
      const recipe = await storage.getSavedRecipeById(recipeId);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
      
      // Check if recipe belongs to the guest user
      if (recipe.userId !== GUEST_USER_ID) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this recipe"
        });
      }
      
      return res.status(200).json({
        success: true,
        recipe
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve recipe",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.delete("/api/recipes/:id", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      
      if (isNaN(recipeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe ID"
        });
      }
      
      const recipe = await storage.getSavedRecipeById(recipeId);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
      
      // Check if recipe belongs to the guest user
      if (recipe.userId !== GUEST_USER_ID) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this recipe"
        });
      }
      
      const deleted = await storage.deleteSavedRecipe(recipeId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete recipe"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Recipe deleted successfully"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete recipe",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.patch("/api/recipes/:id/favorite", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      const { favorite } = req.body;
      
      if (isNaN(recipeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe ID"
        });
      }
      
      if (typeof favorite !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "Favorite status must be a boolean"
        });
      }
      
      const recipe = await storage.getSavedRecipeById(recipeId);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
      
      // Check if recipe belongs to the guest user
      if (recipe.userId !== GUEST_USER_ID) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this recipe"
        });
      }
      
      const updatedRecipe = await storage.updateSavedRecipe(recipeId, { favorite });
      
      return res.status(200).json({
        success: true,
        message: favorite ? "Recipe marked as favorite" : "Recipe removed from favorites",
        recipe: updatedRecipe
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update favorite status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Setup Stripe instance
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY environment variable not set. Stripe payments will not work.');
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  
  // Stripe API routes
  app.post('/api/stripe/create-customer', async (req: Request, res: Response) => {
    if (!req.body.userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    try {
      const user = await storage.getUser(req.body.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create a Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString()
        }
      });
      
      // Update the user with the Stripe customer ID
      const updatedUser = await storage.updateStripeCustomerId(user.id, customer.id);
      
      res.json({
        customerId: customer.id,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          subscriptionStatus: updatedUser.subscriptionStatus,
          subscriptionTier: updatedUser.subscriptionTier,
          credits: updatedUser.credits
        }
      });
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return res.status(500).json({ 
        error: 'Failed to create Stripe customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/stripe/create-subscription', async (req: Request, res: Response) => {
    if (!req.body.userId || !req.body.priceId) {
      return res.status(400).json({ error: 'Missing userId or priceId' });
    }
    
    try {
      const user = await storage.getUser(req.body.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // If the user doesn't have a Stripe customer ID, create one
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: req.body.priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update the user with subscription info
      await storage.updateUserStripeInfo(user.id, {
        customerId, 
        subscriptionId: subscription.id
      });
      
      // Return the subscription and client secret
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ 
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/stripe/check-subscription', async (req: Request, res: Response) => {
    if (!req.body.userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    try {
      const user = await storage.getUser(req.body.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // If user doesn't have a subscription, return the current credits
      if (!user.stripeSubscriptionId) {
        return res.json({
          active: false,
          credits: user.credits,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionTier: user.subscriptionTier
        });
      }
      
      // Get the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Return the subscription status and user credits
      return res.json({
        active: subscription.status === 'active',
        subscriptionStatus: subscription.status,
        subscriptionTier: user.subscriptionTier,
        credits: user.credits,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      return res.status(500).json({ 
        error: 'Failed to check subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/stripe/update-credits', async (req: Request, res: Response) => {
    if (!req.body.userId || req.body.credits === undefined) {
      return res.status(400).json({ error: 'Missing userId or credits' });
    }
    
    try {
      const user = await storage.getUser(req.body.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const credits = Math.max(0, req.body.credits); // Ensure credits can't be negative
      const updatedUser = await storage.updateUserCredits(user.id, credits);
      
      return res.json({
        success: true,
        credits: updatedUser.credits
      });
    } catch (error) {
      console.error('Error updating credits:', error);
      return res.status(500).json({ 
        error: 'Failed to update credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Stripe webhook endpoint to handle subscription events
  app.post('/api/stripe/webhook', async (req: Request, res: Response) => {
    let event;
    
    try {
      // Verify webhook signature
      const signature = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        return res.status(400).json({ 
          error: 'Stripe webhook secret not set'
        });
      }
      
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return res.status(400).json({ 
        error: 'Webhook signature verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Handle the event
    const data = event.data.object as any;
    
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = data as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const users = await storage.getUserByStripeCustomerId(customerId);
          if (!users) {
            console.error('User not found for customer ID:', customerId);
            break;
          }
          
          // Update subscription status and add credits based on the plan
          const status = subscription.status;
          let tier = 'basic';
          let creditAmount = 20; // Default to basic plan credits
          
          // Check the subscription items for the price ID to determine the plan
          const item = subscription.items.data[0];
          if (item && item.price.id) {
            const priceId = item.price.id;
            // Set tier and credits based on the price ID
            // The premium plan typically costs more and offers more credits
            if (priceId.includes('premium')) {
              tier = 'premium';
              creditAmount = 50;
            }
          }
          
          // Update user with subscription status and credits
          await storage.updateUser(users.id, {
            subscriptionStatus: status,
            subscriptionTier: tier,
            // Only add credits if subscription is active or trialing
            ...(status === 'active' || status === 'trialing' ? { 
              credits: Math.max(users.credits || 0, creditAmount) 
            } : {})
          });
          
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = data as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const users = await storage.getUserByStripeCustomerId(customerId);
          if (!users) {
            console.error('User not found for customer ID:', customerId);
            break;
          }
          
          // Update user to mark subscription as canceled
          await storage.updateUser(users.id, {
            subscriptionStatus: 'canceled',
            // Don't remove existing credits, just mark as canceled
          });
          
          break;
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return res.status(500).json({ 
        error: 'Error handling webhook event',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
