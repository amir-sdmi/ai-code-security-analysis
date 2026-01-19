import axios from "axios";

const API_URL = "/api/ingredients/";

// Create new ingredient
const createIngredient = async (ingredientData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, ingredientData, config);

  return response.data;
};

// Get user ingredients
const getIngredients = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);

  return response.data;
};

// Delete user ingredient
const deleteIngredient = async (ingredientId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + ingredientId, config);

  return response.data;
};

//Generate recipes using ChatGPT
const generateRecipes = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + "generate", {}, config);

  return response.data;
};

const ingredientService = {
  createIngredient,
  getIngredients,
  deleteIngredient,
  generateRecipes,
};

export default ingredientService;
