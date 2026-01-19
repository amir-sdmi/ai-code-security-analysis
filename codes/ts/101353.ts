import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "../../../db";
import { recipes, groceryItems } from "../../../db/schema";

// Define the schema for the structured recipe output
const RecipeSchema = z.object({
  name: z.string().describe("The name of the recipe"),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe("The name of the ingredient/grocery item"),
        amount: z
          .string()
          .optional()
          .describe('The amount needed (e.g., "2 cups", "1 lb")'),
        notes: z
          .string()
          .optional()
          .describe("Any additional notes about the ingredient"),
      })
    )
    .describe("List of ingredients needed for the recipe"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeText } = body;

    if (!recipeText || typeof recipeText !== "string") {
      return NextResponse.json(
        { error: "Recipe text is required and must be a string" },
        { status: 400 }
      );
    }

    // Use Vercel AI with ChatGPT-4 mini to parse the recipe
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: RecipeSchema,
      prompt: `
        Parse the following recipe text and extract the recipe name and ingredients list.
        The recipe text may be in any format - it could be a paragraph, a list, or structured text.
        Extract all ingredients mentioned and try to identify quantities where possible.
        
        Recipe text:
        ${recipeText}
        
        Please provide:
        1. A clear recipe name
        2. A list of all ingredients with their amounts (if specified) and any relevant notes
      `,
    });

    const parsedRecipe = result.object;

    // Insert the recipe into the database
    const [newRecipe] = await db
      .insert(recipes)
      .values({
        name: parsedRecipe.name,
      })
      .returning();

    // Insert the grocery items linked to the recipe
    const groceryItemsToInsert = parsedRecipe.ingredients.map((ingredient) => ({
      name: ingredient.amount
        ? `${ingredient.amount} ${ingredient.name}${
            ingredient.notes ? ` (${ingredient.notes})` : ""
          }`
        : `${ingredient.name}${
            ingredient.notes ? ` (${ingredient.notes})` : ""
          }`,
      recipeId: newRecipe.id,
      checked: false,
    }));

    const newGroceryItems = await db
      .insert(groceryItems)
      .values(groceryItemsToInsert)
      .returning();

    return NextResponse.json({
      success: true,
      recipe: newRecipe,
      groceryItems: newGroceryItems,
      parsedData: parsedRecipe,
    });
  } catch (error) {
    console.error("Error processing recipe:", error);

    // Handle specific AI/OpenAI errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to process recipe: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error while processing recipe" },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to test the API
export async function GET() {
  return NextResponse.json({
    message: "Recipe processing API is running",
    usage: 'POST to this endpoint with { "recipeText": "your recipe here" }',
  });
}
