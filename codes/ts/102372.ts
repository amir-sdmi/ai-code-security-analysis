import { Ingredient, NutritionData } from "@/types/recipe";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";

// Recipe type definition
interface Recipe {
  id: string;
  title: string;
  category: string;
  cookingTime: number;
  difficulty: string;
  featuredImage: string;
  averageRating: number;
  adminName: string;
  createdAt: string;
}
export const categoryOptions = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
"beverage",
];
// Sample data - replace with actual API call
export const sampleRecipes: Recipe[] = [
  {
    id: "1",
    title: "Spicy Thai Basil Chicken",
    category: "dinner",
    cookingTime: 25,
    difficulty: "medium",
    featuredImage:
      "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.7,
    adminName: "Chef Mike",
    createdAt: "2023-10-15T14:48:00.000Z"
  },
  {
    id: "2",
    title: "Blueberry Pancakes",
    category: "breakfast",
    cookingTime: 20,
    difficulty: "easy",
    featuredImage:
      "https://images.unsplash.com/photo-1565299543923-37dd37887442?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.5,
    adminName: "Breakfast King",
    createdAt: "2023-10-12T08:30:00.000Z"
  },
  {
    id: "3",
    title: "Homemade Pizza Dough",
    category: "dinner",
    cookingTime: 90,
    difficulty: "hard",
    featuredImage:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.2,
    adminName: "Pizza Master",
    createdAt: "2023-10-08T16:20:00.000Z"
  },
  {
    id: "4",
    title: "Chocolate Lava Cake",
    category: "dessert",
    cookingTime: 30,
    difficulty: "medium",
    featuredImage:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.9,
    adminName: "Dessert Queen",
    createdAt: "2023-09-29T19:15:00.000Z"
  },
  {
    id: "5",
    title: "Green Smoothie Bowl",
    category: "breakfast",
    cookingTime: 10,
    difficulty: "easy",
    featuredImage:
      "https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.1,
    adminName: "Healthy Eats",
    createdAt: "2023-10-02T07:45:00.000Z"
  },
  {
    id: "6",
    title: "Classic Beef Burger",
    category: "lunch",
    cookingTime: 35,
    difficulty: "medium",
    featuredImage:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.6,
    adminName: "Burger Pro",
    createdAt: "2023-09-25T12:30:00.000Z"
  },
  {
    id: "7",
    title: "Vegetable Stir Fry",
    category: "dinner",
    cookingTime: 15,
    difficulty: "easy",
    featuredImage:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.3,
    adminName: "Veggie Lover",
    createdAt: "2023-10-05T18:15:00.000Z"
  },
  {
    id: "8",
    title: "Homemade Pasta Carbonara",
    category: "dinner",
    cookingTime: 40,
    difficulty: "medium",
    featuredImage:
      "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    averageRating: 4.8,
    adminName: "Pasta Master",
    createdAt: "2023-10-10T19:20:00.000Z"
  }
];



export const generateCompleteRecipe = async ({
  titleForGeneration,
  setValue,
  setIngredients,
  setSteps,
  setTips,
  setIsGenerating,
  categoryOptions, 
  calculateNutrition,
}: {
  titleForGeneration: string;
  setValue: any;
  setIngredients: (ingredients: any[]) => void;
  setSteps: (steps: any[]) => void;
  setTips: (tips: any[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  categoryOptions: string[];
  calculateNutrition: any;

}) => {
  if (!titleForGeneration || titleForGeneration.length < 3) {
    toast.error("Please enter a recipe title first");
    return;
  }

  setIsGenerating(true);
  const loadingToastId = toast.loading("Generating recipe content...");

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create a structured prompt for the AI
    const prompt = `Create a detailed recipe for "${titleForGeneration}".
  
  I need the following information (answer with ONLY the requested information for each field, no explanations):
  
  1. DESCRIPTION: Write a detailed description of the dish (4-6 sentences).
  2. COOKING_TIME: How many minutes to prepare and cook (just the number)?
  3. SERVINGS: How many people does this serve (number between 1-8)?
  4. DIFFICULTY: Is this Easy, Medium, or Hard to make?
  5. CATEGORY: Which one best fits: ${categoryOptions.join(", ")}?
  6. INGREDIENTS: List 5-10 ingredients with quantities and units (one per line, format: quantity unit name).
  7. STEPS: List 4-8 detailed preparation steps (one per line, numbered).
  8. TIPS: Provide 3-5 useful cooking tips (one per line).
  
  Be practical, accurate, and detailed in your responses.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();


    // Parse the response using a line-by-line approach instead of JSON parsing
    const sections: any = {
      description: "",
      cookingTime: "",
      servings: "",
      difficulty: "",
      category: "",
      ingredients: [],
      steps: [],
      tips: []
    };

    // Extract each section using regex patterns
    const descriptionMatch = response.match(
      /DESCRIPTION:?\s*(.*?)(?=\d+\.\s*COOKING_TIME|$)/s
    );
    if (descriptionMatch && descriptionMatch[1]) {
      sections.description = descriptionMatch[1].trim();
    }

    const cookingTimeMatch = response.match(/COOKING_TIME:?\s*(\d+)/);
    if (cookingTimeMatch && cookingTimeMatch[1]) {
      sections.cookingTime = cookingTimeMatch[1].trim();
    }

    const servingsMatch = response.match(/SERVINGS:?\s*(\d+)/);
    if (servingsMatch && servingsMatch[1]) {
      sections.servings = servingsMatch[1].trim();
    }

    const difficultyMatch = response.match(
      /DIFFICULTY:?\s*(Easy|Medium|Hard)/i
    );
    if (difficultyMatch && difficultyMatch[1]) {
      sections.difficulty = difficultyMatch[1].toLowerCase();
    }

    const categoryMatch = response.match(/CATEGORY:?\s*([^0-9\n]+)(?=\d|$)/);
    if (categoryMatch && categoryMatch[1]) {
      const category = categoryMatch[1].trim();
      // Find the closest match in categoryOptions
      const matchedCategory =
        categoryOptions.find(
          (c) => c.toLowerCase() === category.toLowerCase()
        ) || categoryOptions[0];
      sections.category = matchedCategory;
    }

    // Extract ingredients section
    const ingredientsSection = response.match(
      /INGREDIENTS:?\s*([\s\S]*?)(?=\d+\.\s*STEPS|$)/
    );
    if (ingredientsSection && ingredientsSection[1]) {
      const ingredientLines = ingredientsSection[1]
        .trim()
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("INGREDIENTS"));

      sections.ingredients = ingredientLines
        .map((line: string) => {
          // Try to extract quantity, unit, and name
          const parts = line.split(" ");
          if (parts.length >= 3) {
            // Assume first part is quantity, second is unit, rest is name
            return {
              quantity: parts[0],
              unit: parts[1],
              name: parts
                .slice(2)
                .join(" ")
                .replace(/^\W+|\W+$/g, "") // Remove non-word chars from start/end
            };
          } else if (parts.length === 2) {
            // Assume first part is quantity, no unit, second is name
            return {
              quantity: parts[0],
              unit: "",
              name: parts[1].replace(/^\W+|\W+$/g, "")
            };
          } else {
            // Just a name
            return {
              quantity: "",
              unit: "",
              name: line.replace(/^\W+|\W+$/g, "")
            };
          }
        })
        .filter((ing: any) => ing.name.trim());
    }

    // Extract steps section
    const stepsSection = response.match(
      /STEPS:?\s*([\s\S]*?)(?=\d+\.\s*TIPS|$)/
    );
    if (stepsSection && stepsSection[1]) {
      const stepLines = stepsSection[1]
        .trim()
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("STEPS"));

      sections.steps = stepLines
        .map((line: string) => {
          // Remove numbers and periods from the beginning
          return { description: line.replace(/^\d+\.?\s*/, "").trim() };
        })
        .filter((step: any) => step.description);
    }

    // Extract tips section
    const tipsSection = response.match(/TIPS:?\s*([\s\S]*?)(?=\d+\.|$)/s);
    if (tipsSection && tipsSection[1]) {
      const tipLines = tipsSection[1]
        .trim()
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("TIPS"));

      sections.tips = tipLines
        .map((line: string) => {
          // Remove bullets, numbers, etc. from the beginning
          return { description: line.replace(/^[-•*\d]+\.?\s*/, "").trim() };
        })
        .filter((tip: any) => tip.description);
    }

    // Fill the form with generated data
    setValue("title", titleForGeneration);

    if (sections.description) {
      setValue("description", sections.description);
    }

    if (sections.cookingTime) {
      setValue("cookingTime", sections.cookingTime);
    }

    if (sections.servings) {
      setValue("servings", sections.servings);
    }

    if (sections.difficulty) {
      setValue("difficulty", sections.difficulty);
    }

    if (sections.category) {
      setValue("category", sections.category);
    }

    // Set ingredients
    if (sections.ingredients.length > 0) {
      setIngredients(sections.ingredients);
      
      // Now calculate nutrition with a slight delay to ensure UI updates first
      setTimeout(() => {
        calculateNutrition(sections.ingredients);
      }, 1000);
    }

    // Set steps
    if (sections.steps.length > 0) {
      setSteps(sections.steps);
    }

    // Set tips
    if (sections.tips.length > 0) {
      setTips(sections.tips);
    }

    toast.success(
      "Recipe generated successfully! Feel free to edit any details.",
      {
        id: loadingToastId,
        duration: 4000
      }
    );
  } catch (error) {
    console.error("Error generating recipe:", error);
    toast.error(
      "Failed to generate recipe. Please try again or enter details manually.",
      {
        id: loadingToastId
      }
    );
  } finally {
    setIsGenerating(false);
  }
};




export const calculateNutrition = async (
  ingredients: Ingredient[],
  setNutrition: (data: NutritionData) => void,
  setIsCalculating: (isCalculating: boolean) => void
): Promise<void> => {
  if (!ingredients || ingredients.length === 0) {
    toast.error("Please add ingredients before calculating nutrition");
    return;
  }

  setIsCalculating(true);
  const loadingToastId = toast.loading("Calculating nutritional information...");

  try {
    // Format ingredients for the AI prompt
    const ingredientsList = ingredients
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
      .join("\n");

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create the prompt for nutrition calculation
// Create an advanced prompt for accurate nutrition calculation
const prompt = `
I need detailed nutritional information for a recipe with the following ingredients:

${ingredientsList}

Please analyze each ingredient carefully, accounting for:
- Precise measurements and units (grams, cups, tablespoons, etc.)
- Different states of ingredients (raw, cooked, diced, whole)
- Specific varieties or brands when specified

Calculate the TOTAL nutrition facts for the entire recipe and format your response EXACTLY as follows with ONLY numeric values:

CALORIES: [number]
PROTEIN: [number]
CARBS: [number]
FAT: [number]
SUGAR: [number]
FIBER: [number]

Do not include units in the actual values, additional explanations, serving size calculations, or any other text. If any ingredient lacks sufficient information for accurate calculation, make a reasonable estimate based on similar ingredients and note this in a separate section AFTER providing the formatted nutrition data.
`;

    // Generate the nutrition information
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    
    // More flexible regex patterns that handle various formats
    const caloriesMatch = response.match(/CALORIES:?\s*(\d+)|calories:?\s*(\d+)|calories\D*(\d+)|(\d+)\s*calories/i);
    const proteinMatch = response.match(/PROTEIN:?\s*(\d+)|protein:?\s*(\d+)|protein\D*(\d+)|(\d+)\s*g\s*protein/i);
    const carbsMatch = response.match(/CARBS:?\s*(\d+)|carbs:?\s*(\d+)|carbohydrates:?\s*(\d+)|carbs\D*(\d+)|(\d+)\s*g\s*carbs/i);
    const fatMatch = response.match(/FAT:?\s*(\d+)|fat:?\s*(\d+)|fat\D*(\d+)|(\d+)\s*g\s*fat/i);
    const sugarMatch = response.match(/SUGAR:?\s*(\d+)|sugar:?\s*(\d+)|sugar\D*(\d+)|(\d+)\s*g\s*sugar/i);
    const fiberMatch = response.match(/FIBER:?\s*(\d+)|fiber:?\s*(\d+)|fiber\D*(\d+)|(\d+)\s*g\s*fiber/i);
    
    
    // Helper function to extract the first numeric match from multiple capture groups
    const extractFirstMatch = (match: RegExpMatchArray | null): number => {
      if (!match) return 0;
      
      // Find the first non-undefined, non-empty capture group
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          return parseInt(match[i]);
        }
      }
      return 0;
    };
    
    // Create nutrition object
    const nutritionData: NutritionData = {
      calories: extractFirstMatch(caloriesMatch),
      protein: extractFirstMatch(proteinMatch),
      carbs: extractFirstMatch(carbsMatch),
      fat: extractFirstMatch(fatMatch),
      sugar: extractFirstMatch(sugarMatch),
      fiber: extractFirstMatch(fiberMatch)
    };
    
    setNutrition(nutritionData);

    
    toast.success("Nutritional information calculated!", {
      id: loadingToastId,
      duration: 3000
    });
    
    // Removed return statement as the function is of type Promise<void>
  } catch (error) {
    console.error("Error calculating nutrition:", error);
    toast.error("Failed to calculate nutrition. Please try again later.", {
      id: loadingToastId
    });
  } finally {
    setIsCalculating(false);
  }
};




// generate recipe image 

export const generateRecipeImage = async (
  recipeTitle: string,
  setValue: any,
  setIsGeneratingImage: (arg0: boolean) => void,
  setPreviewImage: (arg0: string) => void,
) => {
  if (!recipeTitle) {
    toast.error("Please enter a recipe title first");
    return;
  }

  setIsGeneratingImage(true);
  const loadingToastId = toast.loading("Generating recipe image...");

  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
    );
    
    // For image generation capabilities, use Gemini 1.5 Pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a prompt for image generation
    const prompt = `Generate a realistic, professional high-quality photo of "${recipeTitle}". 
    The image should look appetizing, well-lit, styled like a high-end cookbook photograph.
    Include colorful ingredients, appropriate garnishes, and elegant plating.`;
    
    // Call the model to generate the image
    const result = await model.generateContent(prompt);
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;
    
    let imageUrl = '';
    
    // Check if we have any image parts in the response
    if (parts && parts.length > 0) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          // Get base64 image data
          const base64Data = part.inlineData.data;
          imageUrl = `data:${part.inlineData.mimeType};base64,${base64Data}`;
          break;
        }
      }
    }
    
    // If no image was generated, fall back to Unsplash
    if (!imageUrl) {
   toast.error('unfortunately no image was generated, you can upload yours!')
    }
    
    // Set the image
    setPreviewImage(imageUrl);
    setValue("featuredImage", imageUrl);
    
    toast.success("Recipe image generated!", {
      id: loadingToastId,
    });
  } catch (error) {
    console.error("Failed to generate image with Gemini:", error);
    
    // Fall back to Unsplash on error
    try {
      const placeholderUrl = `https://source.unsplash.com/random/800x600/?food,${encodeURIComponent(recipeTitle)}`;
      setPreviewImage(placeholderUrl);
      setValue("featuredImage", placeholderUrl);
      
      toast.success("Used alternative image source", {
        id: loadingToastId,
      });
    } catch (fallbackError) {
      console.error("Even fallback image failed:", fallbackError);
      toast.error("Could not generate image. Please try again.", {
        id: loadingToastId,
      });
    }
  } finally {
    setIsGeneratingImage(false);
  }
};