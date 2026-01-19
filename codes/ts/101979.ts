import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertRecipeSchema, insertSavedRecipeSchema } from "@shared/schema";
import { generateAIRecipe, suggestRecipes } from "./gemini";
import { processChatMessage, fetchTextFromGemini } from "./chat";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create an API router
  const apiRouter = express.Router();
  
  // Get all recipes
  apiRouter.get("/recipes", async (req: Request, res: Response) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });
  
  // Get a specific recipe by ID
  apiRouter.get("/recipes/:id", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });
  
  // Search recipes
  apiRouter.get("/recipes/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const filters = req.query.filters ? (req.query.filters as string).split(",") : [];
      
      const recipes = await storage.searchRecipes(query, filters);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search recipes" });
    }
  });
  
  // Get similar recipes
  apiRouter.get("/recipes/:id/similar", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      const similarRecipes = await storage.getSimilarRecipes(recipeId, limit);
      res.json(similarRecipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch similar recipes" });
    }
  });
  
  // Get saved recipes
  apiRouter.get("/recipes/saved", async (req: Request, res: Response) => {
    try {
      // In a real app with authentication, we would get userId from authenticated session
      // For demo purposes, we'll use a default user ID
      const userId = 1;
      
      const savedRecipes = await storage.getSavedRecipes(userId);
      res.json(savedRecipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved recipes" });
    }
  });
  
  // Save a recipe
  apiRouter.post("/recipes/saved", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validator = z.object({
        recipeId: z.number()
      });
      
      const { recipeId } = validator.parse(req.body);
      
      // In a real app with authentication, we would get userId from authenticated session
      // For demo purposes, we'll use a default user ID
      const userId = 1;
      
      // Check if recipe exists
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if already saved
      const isAlreadySaved = await storage.isRecipeSaved(userId, recipeId);
      if (isAlreadySaved) {
        return res.status(409).json({ message: "Recipe is already saved" });
      }
      
      const savedRecipe = await storage.saveRecipe({
        userId,
        recipeId
      });
      
      res.status(201).json(savedRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save recipe" });
    }
  });
  
  // Remove a saved recipe
  apiRouter.delete("/recipes/saved/:id", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      
      // In a real app with authentication, we would get userId from authenticated session
      // For demo purposes, we'll use a default user ID
      const userId = 1;
      
      await storage.unsaveRecipe(userId, recipeId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove saved recipe" });
    }
  });
  
  // Generate a recipe with AI
  apiRouter.post("/recipes/generate", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validator = z.object({
        description: z.string(),
        dietaryPreferences: z.array(z.string()).optional(),
        cookingTime: z.number().optional()
      });
      
      const generationRequest = validator.parse(req.body);
      
      // Generate recipe with Gemini
      const generatedRecipe = await generateAIRecipe(generationRequest);
      
      // Save the generated recipe
      const recipe = await storage.createRecipe({
        ...generatedRecipe,
        isAIGenerated: true
      });
      
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Recipe generation error:", error);
      res.status(500).json({ message: "Failed to generate recipe" });
    }
  });
  
  // Get recipe suggestions
  apiRouter.get("/recipes/suggest", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string || "";
      
      // Get suggestions using Gemini
      const suggestions = await suggestRecipes(query);
      
      res.json(suggestions);
    } catch (error) {
      console.error("Recipe suggestion error:", error);
      res.status(500).json({ message: "Failed to get recipe suggestions" });
    }
  });
  
  // Chat with recipe assistant
  apiRouter.post("/recipes/chat", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validator = z.object({
        message: z.string()
      });
      
      const { message } = validator.parse(req.body);
      
      // Process chat message
      const chatResponse = await processChatMessage(message);
      
      res.json(chatResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Chat processing error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  
  // Generate meal plan for a day
  apiRouter.post("/meal-planner/generate-day", async (req: Request, res: Response) => {
    try {
      const { day } = req.body;
      if (!day) {
        return res.status(400).json({ error: "Day is required" });
      }
      
      // Use Gemini to generate meal plan for the day
      const prompt = `Create a healthy meal plan for ${day}. For each meal (breakfast, lunch, dinner), provide a title and a brief description. Format the response as a JSON object with the following structure:
      {
        "breakfast": { "title": "Meal title", "description": "Brief description" },
        "lunch": { "title": "Meal title", "description": "Brief description" },
        "dinner": { "title": "Meal title", "description": "Brief description" }
      }
      Make all meals healthy, varied, and interesting.`;
      
      let geminiResponse;
      try {
        // Using the Gemini integration
        geminiResponse = await fetchTextFromGemini(prompt);
        
        // Extract the JSON from the response
        const jsonMatch = geminiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         geminiResponse.match(/\{[\s\S]*\}/);
                         
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const mealPlan = JSON.parse(jsonStr);
          
          // Add IDs to each meal
          if (mealPlan.breakfast) mealPlan.breakfast.id = Math.floor(Math.random() * 1000);
          if (mealPlan.lunch) mealPlan.lunch.id = Math.floor(Math.random() * 1000);
          if (mealPlan.dinner) mealPlan.dinner.id = Math.floor(Math.random() * 1000);
          
          return res.json(mealPlan);
        } else {
          throw new Error("Failed to parse meal plan from AI response");
        }
      } catch (error) {
        console.error("Error with Gemini meal plan generation:", error);
        // Fallback data in case of error
        return res.json({
          breakfast: { 
            id: Math.floor(Math.random() * 1000),
            title: "Healthy Breakfast Bowl", 
            description: "Oatmeal with fresh berries, banana slices, and a drizzle of honey"
          },
          lunch: { 
            id: Math.floor(Math.random() * 1000),
            title: "Mediterranean Salad", 
            description: "Mixed greens with cucumber, tomatoes, feta cheese, olives, and grilled chicken" 
          },
          dinner: { 
            id: Math.floor(Math.random() * 1000),
            title: "Baked Salmon", 
            description: "Herb-crusted salmon with roasted vegetables and quinoa" 
          }
        });
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ error: "Failed to generate meal plan" });
    }
  });
  
  // Mount the API router
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
