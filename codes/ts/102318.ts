import { GoogleGenAI, Modality } from "@google/genai";
import 'dotenv/config.js';
import { z } from 'zod';
import * as fs from "fs";

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Zod schema for recipe validation
const GeneratedRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  servings: z.number().positive(),
  preparationTime: z.number().positive(),
  cookingTime: z.number().positive(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    notes: z.string().optional(),
    preparation: z.string().optional(),
    cost: z.object({
      perUnit: z.number().min(0),
      unit: z.string().min(1),
      total: z.number().min(0),
      perServing: z.number().min(0),
      bulkDiscount: z.number().min(0).optional()
    }).optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
  })),
  instructions: z.array(z.object({
    step: z.number().positive(),
    description: z.string().min(1),
    technique: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    temperature: z.string().optional(),
    time: z.string().optional(),
    tips: z.array(z.string()).optional(),
    safety: z.array(z.string()).optional(),
    visualCues: z.array(z.string()).optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
  })),
  nutritionalInfo: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
    sugar: z.number(),
  }),
  costEstimate: z.object({
    totalCost: z.number(),
    costPerServing: z.number(),
    bulkDiscount: z.number(),
    costBreakdown: z.array(z.object({
      category: z.string(),
      cost: z.number(),
      percentage: z.number(),
    })),
  }),
  tips: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string().optional(),
    icon: z.string().optional(),
  })),
  variations: z.array(z.object({
    name: z.string(),
    description: z.string(),
    modifications: z.array(z.string()).optional(),
    image: z.string().optional(),
  })),
  pairings: z.array(z.object({
    name: z.string(),
    description: z.string(),
    reason: z.string().optional(),
    image: z.string().optional(),
  })),
  images: z.object({
    main: z.string(),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
    presentation: z.string(),
    variations: z.array(z.string()).optional(),
    plating: z.array(z.string()).optional(),
  }),
  icons: z.object({
    preparation: z.string(),
    cooking: z.string(),
    difficulty: z.string(),
    servings: z.string(),
    cost: z.string(),
  }),
});

export type GeneratedRecipe = z.infer<typeof GeneratedRecipeSchema>;

export class GeminiService {
  private static readonly DEFAULT_MODEL = "gemini-2.0-flash";
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Generates content using the Gemini API with retry logic.
   * @param prompt - The prompt to send to Gemini.
   * @param model - The model to use.
   * @returns The generated text response.
   */
  private static async generateContentWithRetry(
    prompt: string,
    model: string = this.DEFAULT_MODEL,
    retryCount: number = 0
  ): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      
      if (!response.text) {
        throw new Error('No response text received from Gemini API');
      }
      return response.text;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.warn(`Retry attempt ${retryCount + 1} for Gemini API call`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.generateContentWithRetry(prompt, model, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Cleans and parses JSON response from Gemini
   * @param response - The raw response from Gemini
   * @returns Parsed JSON object
   */
  private static cleanAndParseJson(response: string): any {
    // Remove any markdown code block formatting
    let cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    
    // If the response starts with a backtick, remove it
    if (cleanedResponse.startsWith('`')) {
      cleanedResponse = cleanedResponse.substring(1);
    }
    
    // If the response ends with a backtick, remove it
    if (cleanedResponse.endsWith('`')) {
      cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 1);
    }

    try {
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse JSON:', cleanedResponse);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  /**
   * Helper to generate an image from a prompt using Gemini image model.
   * Returns a data URL (base64 PNG).
   */
  private static async generateImageFromPrompt(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          return `data:image/png;base64,${imageData}`;
        }
      }
    }
    throw new Error("No image generated by Gemini");
  }

  /**
   * Generates a detailed recipe using Gemini AI.
   * @param prompt The recipe description or requirements.
   * @returns A structured recipe object with all details.
   */
  static async generateRecipe(prompt: string, servings: number = 1): Promise<GeneratedRecipe> {
    const RECIPE_GENERATION_PROMPT = `You are a professional chef and recipe developer. Generate a detailed recipe based on the following prompt: ${prompt}

    IMPORTANT: Return ONLY a valid JSON object with no additional text. The response must be parseable JSON.

    Guidelines for the JSON response:
    1. Use metric units for measurements (g, kg, ml, l, etc.)
    2. Use INR for costs
    3. All numeric values must be actual numbers, not strings
    4. Calculate ingredient quantities based on ${servings} servings
    5. Cost Calculation Guidelines:
       - Research current market prices for ingredients in India
       - Cost per unit should be in INR (e.g., cost per kg, cost per piece)
       - Calculate total cost for each ingredient: quantity × cost per unit
       - Calculate cost per serving: total cost ÷ number of servings
       - Apply bulk purchase discounts where applicable (typically 5-15% for larger quantities)
       - Include wastage factor (typically 5-10% of total cost)
       - Consider seasonal variations in prices
       - Account for packaging costs if relevant
       - All costs must be realistic for Indian market prices
    6. Detailed Instructions Guidelines:
       - Break down each step into clear, detailed instructions
       - Include specific techniques and methods
       - Mention exact temperatures and cooking times
       - Include tips for each step
       - Specify equipment needed
       - Include safety precautions
       - Mention visual cues for doneness
       - Include preparation tips
       - Add notes about ingredient preparation
       - Include timing for each step
    7. Image Generation Guidelines:
       For each ingredient:
       - High-quality, clear photo of the raw ingredient
       - Show the ingredient in its best form
       - Include measurement/quantity in the image
       - Show any special preparation needed
       
       For the main dish:
       - Professional food photography style
       - Show the dish from multiple angles
       - Include garnishes and presentation
       - Show the dish in proper lighting
       - Include plating suggestions
       
       For preparation steps:
       - Show key techniques
       - Include before/after states
       - Show proper equipment usage
       - Include safety demonstrations
       - Show proper measurements
       
       For final presentation:
       - Professional plating
       - Include garnishes
       - Show serving suggestions
       - Include portion sizes
       - Show accompaniments

    The JSON structure should be:
    {
      "name": "string",
      "description": "string",
      "category": "string (one of: BREAKFAST, LUNCH, DINNER, SNACKS, BEVERAGES)",
      "type": "string (one of: VEG, NON_VEG, EGG)",
      "servings": number,
      "preparationTime": number,
      "cookingTime": number,
      "difficulty": "string (one of: EASY, MEDIUM, HARD)",
      "ingredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string",
          "notes": "string (optional)",
          "preparation": "string (how to prepare this ingredient)",
          "cost": {
            "perUnit": number, // Cost per unit in INR
            "unit": "string", // Unit of measurement (kg, piece, etc.)
            "total": number, // Total cost for the ingredient
            "perServing": number, // Cost per serving
            "bulkDiscount": number // Bulk purchase discount if applicable
          },
          "image": "string (URL or description of image)",
          "icon": "string (icon name)"
        }
      ],
      "instructions": [
        {
          "step": number,
          "description": "string",
          "technique": "string (specific cooking technique used)",
          "equipment": ["string (list of equipment needed)"],
          "temperature": "string (if applicable)",
          "time": "string (duration of this step)",
          "tips": ["string (tips for this step)"],
          "safety": ["string (safety precautions)"],
          "visualCues": ["string (how to know when done)"],
          "image": "string (URL or description of image)",
          "icon": "string (icon name)"
        }
      ],
      "nutritionalInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number
      },
      "costEstimate": {
        "totalCost": number, // Total cost of all ingredients
        "costPerServing": number, // Total cost divided by number of servings
        "bulkDiscount": number, // Total bulk discount applied
        "costBreakdown": [
          {
            "category": "string", // Category of ingredient (e.g., "Vegetables", "Spices", etc.)
            "cost": number, // Total cost for this category
            "percentage": number // Percentage of total cost
          }
        ]
      },
      "tips": [
        {
          "title": "string",
          "description": "string",
          "category": "string (e.g., 'Preparation', 'Cooking', 'Storage')",
          "icon": "string (icon name)"
        }
      ],
      "variations": [
        {
          "name": "string",
          "description": "string",
          "modifications": ["string (list of changes)"],
          "image": "string (URL or description of image)"
        }
      ],
      "pairings": [
        {
          "name": "string",
          "description": "string",
          "reason": "string (why this pairing works)",
          "image": "string (URL or description of image)"
        }
      ],
      "images": {
        "main": "string (URL or description of image)",
        "ingredients": ["string"],
        "steps": ["string"],
        "presentation": "string (URL or description of image)",
        "variations": ["string"],
        "plating": ["string"]
      },
      "icons": {
        "preparation": "string (icon name)",
        "cooking": "string (icon name)",
        "difficulty": "string (icon name)",
        "servings": "string (icon name)",
        "cost": "string (icon name)"
      }
    }

    Cost Calculation Example:
    For a recipe with 4 servings:
    - Rice: 500g at ₹60/kg
      - Cost per unit: ₹60/kg
      - Quantity: 0.5kg
      - Total cost: ₹30
      - Cost per serving: ₹7.50
      - Bulk discount: ₹3 (10% off)
    
    - Vegetables: 1kg at ₹80/kg
      - Cost per unit: ₹80/kg
      - Quantity: 1kg
      - Total cost: ₹80
      - Cost per serving: ₹20
      - Wastage factor: ₹8 (10%)
    
    Total cost: ₹110
    Total bulk discount: ₹3
    Net cost: ₹107
    Cost per serving: ₹26.75

    Remember:
    1. All costs must be in INR
    2. All measurements must be in metric units
    3. All numeric values must be actual numbers
    4. Include detailed cost breakdowns
    5. Provide detailed step-by-step instructions
    6. Include high-quality image suggestions
    7. Use appropriate icons for better UX
    8. Scale all quantities and costs for ${servings} servings`;

    try {
      // First, generate the recipe JSON
      const response = await this.generateContentWithRetry(RECIPE_GENERATION_PROMPT);
      const parsedResponse = this.cleanAndParseJson(response);
      const validatedRecipe = GeneratedRecipeSchema.parse(parsedResponse);

      // Helper to check if a string is a valid URL
      const isValidUrl = (url: string | undefined) => typeof url === 'string' && url.startsWith('http');

      try {
        // Generate main image if not a valid URL
        if (!isValidUrl(validatedRecipe.images.main)) {
          validatedRecipe.images.main = await this.generateImageFromPrompt(
            `Professional food photography of: ${validatedRecipe.name}, ${validatedRecipe.description}, beautifully plated, garnished, in a restaurant setting with proper lighting`
          );
        }

        // Generate presentation image if not a valid URL
        if (!isValidUrl(validatedRecipe.images.presentation)) {
          validatedRecipe.images.presentation = await this.generateImageFromPrompt(
            `Professional food presentation: ${validatedRecipe.name}, plated elegantly, with garnishes and accompaniments, in a restaurant setting`
          );
        }

        // Generate ingredient images if not valid URLs
        for (let i = 0; i < validatedRecipe.ingredients.length; i++) {
          const ing = validatedRecipe.ingredients[i];
          if (!isValidUrl(ing.image)) {
            ing.image = await this.generateImageFromPrompt(
              `High-quality photo of ingredient: ${ing.name}${ing.notes ? ", " + ing.notes : ""}, raw, fresh, properly measured, on a clean surface`
            );
            // Update images.ingredients array if present
            if (validatedRecipe.images.ingredients[i]) {
              validatedRecipe.images.ingredients[i] = ing.image;
            }
          }
        }

        // Generate step images if not valid URLs
        for (let i = 0; i < validatedRecipe.instructions.length; i++) {
          const step = validatedRecipe.instructions[i];
          if (!isValidUrl(step.image)) {
            step.image = await this.generateImageFromPrompt(
              `Step ${step.step} for ${validatedRecipe.name}: ${step.description}, showing proper technique, equipment, and visual result`
            );
            // Update images.steps array if present
            if (validatedRecipe.images.steps[i]) {
              validatedRecipe.images.steps[i] = step.image;
            }
          }
        }

        // Generate plating images if not valid URLs
        if (validatedRecipe.images.plating && validatedRecipe.images.plating.length > 0) {
          for (let i = 0; i < validatedRecipe.images.plating.length; i++) {
            if (!isValidUrl(validatedRecipe.images.plating[i])) {
              validatedRecipe.images.plating[i] = await this.generateImageFromPrompt(
                `Professional plating suggestion for ${validatedRecipe.name}: elegant presentation, proper portion size, garnishes, and accompaniments`
              );
            }
          }
        }
      } catch (imageError) {
        console.warn('Error generating images:', imageError);
        // Continue with the recipe even if image generation fails
      }

      return validatedRecipe;
    } catch (error) {
      console.error('Error in recipe generation:', error);
      if (error instanceof z.ZodError) {
        console.error('Recipe validation error:', error.errors);
        throw new Error('Generated recipe did not match expected format');
      }
      if (error instanceof SyntaxError) {
        console.error('JSON parsing error:', error);
        throw new Error('Failed to parse recipe response');
      }
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }
}

/*
// Example usage:
(async () => {
  try {
    const result = await GeminiService.generateContent(
      "Create a detailed meal plan for a week that includes breakfast, lunch, and dinner. Focus on healthy, balanced meals."
    );
    console.log(result);
  } catch (err) {
    console.error(err);
  }
})();
*/