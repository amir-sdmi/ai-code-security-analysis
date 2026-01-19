"use server"

import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { addConversationMessage, getUserPreferences, getUserRecentMeals } from "./db"

export async function generateAIResponse(userId: number, userMessage: string) {
  try {
    // Save user message to conversation history
    await addConversationMessage(userId, userMessage, true)

    // Get user preferences and recent meals for context
    const preferences = await getUserPreferences(userId)
    const recentMeals = await getUserRecentMeals(userId, 5)

    // Create context for the AI
    const userContext = {
      preferences: preferences || {
        dietary_restrictions: [],
        favorite_cuisines: [],
        disliked_ingredients: [],
        spice_level: 3,
      },
      recentMeals: recentMeals || [],
    }

    // Generate prompt for Grok
    const prompt = `
      You are TasteMate, an AI food recommendation assistant. Your goal is to help users discover new dishes based on their preferences and meal history.
      
      User preferences: ${JSON.stringify(userContext.preferences)}
      Recent meals: ${JSON.stringify(userContext.recentMeals)}
      
      User message: ${userMessage}
      
      Respond in a friendly, conversational manner. If the user is sharing what they ate, acknowledge it and consider it for future recommendations.
      If they're asking for recommendations, suggest dishes based on their preferences and history.
      Keep responses concise and focused on food recommendations.
    `

    // Generate response using Grok
    const { text } = await generateText({
      model: xai("grok-1"),
      prompt,
      maxTokens: 500,
    })

    // Save AI response to conversation history
    await addConversationMessage(userId, text, false)

    return text
  } catch (error) {
    console.error("Error generating AI response:", error)
    return "Sorry, I'm having trouble processing your request right now. Please try again later."
  }
}
