const asyncHandler = require("express-async-handler");

const Ingredient = require("../models/ingredientModel");
const User = require("../models/userModel");

// @desc    Get ingredients
// @route   GET /api/ingredients
// @access  Private
const getIngredients = asyncHandler(async (req, res) => {
  const ingredients = await Ingredient.find({ user: req.user.id });

  res.status(200).json(ingredients);
});

// @desc    Add ingredient
// @route   POST /api/ingredients
// @access  Private
const addIngredient = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.quantity) {
    res.status(400);
    throw new Error("Please provide both name and quantity for the ingredient");
  }

  const ingredient = await Ingredient.create({
    name: req.body.name,
    quantity: req.body.quantity,
    user: req.user.id,
  });

  res.status(200).json(ingredient);
});

// @desc    Update ingredient
// @route   PUT /api/ingredients/:id
// @access  Private
const updateIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (!ingredient) {
    res.status(400);
    throw new Error("Ingredient not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged in user matches the ingredient user
  if (ingredient.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  const updatedIngredient = await Ingredient.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  res.status(200).json(updatedIngredient);
});

// @desc    Delete ingredient
// @route   DELETE /api/ingredients/:id
// @access  Private
const deleteIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (!ingredient) {
    res.status(400);
    throw new Error("Ingredient not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged in user matches the ingredient user
  if (ingredient.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  await ingredient.remove();

  res.status(200).json({ id: req.params.id });
});

// @desc   Generate recipes using ChatGPT
// @route  POST /api/ingredients/generate
// @access Private
const OpenAI = require("openai");

const generateRecipes = asyncHandler(async (req, res) => {
  const userIngredients = await Ingredient.find({ user: req.user.id });

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged-in user has ingredients
  if (userIngredients.length === 0) {
    res.status(401);
    throw new Error("User has no ingredients");
  }

  for (const ingredient of userIngredients) {
    if (ingredient.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error("User not authorized");
    }
  }

  const ingredientsList = userIngredients.map((i) => i.name).join(", ");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0613",
      messages: [
        {
          role: "system",
          content:
            "You are a renown chef and food connoisseur with a passion for cooking. You have a large collection of recipes that you have collected over the years and love helping others find delicious and unique recipes that cater towards the ingredients they have in their fridge. However, you're given a restraint as you have to remember that these people are students in college with limited cooking equipment and knowledge. You have to make sure that the recipes you give them are easy to follow and don't require too many ingredients.",
        },
        {
          role: "user",
          content: `I have these ingredients: ${ingredientsList}. What's a delicious recipe I can make with these ingredients? Include the instructions for each one along with a brief description of the recipe. Make sure you only use the ingredients that are listed.`,
        },
      ],
      max_tokens: 1024,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices received from OpenAI.");
    }

    res.send([response.choices[0].message.content]);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Server error while generating recipes",
      error: error.message,
    });
  }
});

module.exports = {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  generateRecipes,
};
