import axios from 'axios'

class OpenRouterService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    this.baseURL = 'https://openrouter.ai/api/v1'
    // Use ChatGPT model to test OpenRouter API
    this.model = 'openai/gpt-3.5-turbo'
    
    console.log('🔑 OpenRouter API Key configured:', this.apiKey ? 'Yes (length: ' + this.apiKey.length + ')' : 'No')
    console.log('🤖 Using model:', this.model)
    console.log('🎯 Starting with model:', this.model)
    
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn('⚠️ OpenRouter API key not found or not configured properly.')
      console.log('💡 To fix this:')
      console.log('1. Get an API key from https://openrouter.ai/keys')
      console.log('2. Add it to your .env file as VITE_OPENROUTER_API_KEY=your_key_here')
      console.log('3. Restart the development server (npm run dev)')
    }
  }

  async generateRecipe(ingredients, preferences = {}) {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add a valid API key to your .env file and restart the server.')
    }

    console.log(`🤖 Using model: ${this.model}`)
    //console.log(`🔑 API Key (first 20 chars): ${this.apiKey.substring(0, 20)}...`)
    
    try {
      const prompt = this.buildRecipePrompt(ingredients, preferences)
      
      const requestHeaders = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
      
      console.log('📤 Request headers:', { 
        'Authorization': requestHeaders.Authorization.substring(0, 30) + '...', 
        'Content-Type': requestHeaders['Content-Type']
      })
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional chef and recipe creator. Create detailed, practical recipes using the provided ingredients. Always respond in valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: requestHeaders
        }
      )

      const generatedText = response.data.choices[0].message.content
      console.log(`✅ Success with model: ${this.model}`)
      
      return this.parseRecipeResponse(generatedText, ingredients)
      
    } catch (error) {
      console.warn(`❌ Model ${this.model} failed:`, error.response?.status || error.message)
      
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key in the .env file.')
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your OpenRouter account.')
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.')
      } else if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message)
      } else {
        throw new Error('Failed to generate recipe with AI. Please try again.')
      }
    }
  }

  buildRecipePrompt(ingredients, preferences = {}) {
    const ingredientList = ingredients.join(', ')
    const dietary = preferences.dietary || []
    const cuisine = preferences.cuisine || 'any'
    const difficulty = preferences.difficulty || 'any'
    const cookingTime = preferences.cookingTime || 'any'

    let prompt = `Create a delicious recipe using these ingredients: ${ingredientList}.`
    
    if (dietary.length > 0) {
      prompt += ` The recipe should be ${dietary.join(' and ')}.`
    }
    
    if (cuisine !== 'any') {
      prompt += ` Make it ${cuisine} cuisine style.`
    }
    
    if (difficulty !== 'any') {
      prompt += ` The difficulty should be ${difficulty}.`
    }
    
    if (cookingTime !== 'any') {
      prompt += ` Cooking time should be ${cookingTime}.`
    }

    prompt += `

Please respond with a JSON object in this exact format:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "calories": 350,
  "ingredients": [
    {"name": "ingredient name", "amount": "1 cup", "emoji": "🥄"},
    {"name": "ingredient name", "amount": "2 tbsp", "emoji": "🧄"}
  ],
  "instructions": [
    "Step 1: detailed instruction",
    "Step 2: detailed instruction",
    "Step 3: detailed instruction"
  ],
  "tags": ["vegetarian", "quick", "healthy"],
  "tips": "Optional cooking tips"
}

Important: 
- Use only the provided ingredients as main ingredients
- You can suggest common pantry items (salt, pepper, olive oil, etc.) if needed
- Provide realistic cooking times and serving sizes
- Include step-by-step instructions
- Add relevant tags like "vegetarian", "vegan", "quick", "healthy", etc.
- Only respond with valid JSON, no additional text`

    return prompt
  }

  parseRecipeResponse(responseText, originalIngredients) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : responseText
      
      const recipe = JSON.parse(jsonText)
      
      // Validate required fields and add defaults
      const validatedRecipe = {
        id: Date.now().toString(), // Generate unique ID
        title: recipe.title || 'Generated Recipe',
        description: recipe.description || 'A delicious recipe created just for you!',
        cookingTime: recipe.cookingTime || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'medium',
        calories: recipe.calories || null,
        ingredients: this.validateIngredients(recipe.ingredients || []),
        instructions: recipe.instructions || ['Follow the preparation steps'],
        tags: recipe.tags || ['ai-generated'],
        tips: recipe.tips || '',
        sourceIngredients: originalIngredients,
        createdAt: new Date().toISOString(),
        isGenerated: true
      }

      return validatedRecipe
    } catch (error) {
      console.error('Failed to parse recipe response:', error)
      // Return a fallback recipe if parsing fails
      return this.createFallbackRecipe(originalIngredients)
    }
  }

  validateIngredients(ingredients) {
    return ingredients.map(ingredient => ({
      name: ingredient.name || 'Unknown ingredient',
      amount: ingredient.amount || '1 piece',
      emoji: ingredient.emoji || '🥄'
    }))
  }

  createFallbackRecipe(ingredients) {
    return {
      id: Date.now().toString(),
      title: `Recipe with ${ingredients.join(', ')}`,
      description: 'A simple recipe created with your available ingredients.',
      cookingTime: 30,
      servings: 2,
      difficulty: 'easy',
      calories: null,
      ingredients: ingredients.map(ing => ({
        name: ing,
        amount: '1 piece',
        emoji: '🥄'
      })),
      instructions: [
        'Prepare all ingredients',
        'Combine ingredients according to your preference',
        'Cook until done',
        'Season to taste and serve'
      ],
      tags: ['ai-generated', 'simple'],
      tips: 'Adjust seasoning and cooking time to your taste.',
      sourceIngredients: ingredients,
      createdAt: new Date().toISOString(),
      isGenerated: true
    }
  }

  // Method to test the API connection
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('API key not configured')
    }

    try {
      await this.generateRecipe(['tomato', 'cheese'], { difficulty: 'easy' })
      return true
    } catch (error) {
      throw error
    }
  }
}

export const openRouterService = new OpenRouterService()
export default openRouterService