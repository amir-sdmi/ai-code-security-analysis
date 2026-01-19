"use server"

import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

export async function getChatResponse(message: string, language: string): Promise<string> {
  try {
    // Create a system prompt that instructs the AI on how to respond
    const systemPrompt = `
      You are an AI assistant for the Puerto Rico government's Automatic License Plate Recognition (ALPR) system.
      
      Your role is to help users navigate the platform and understand its features. The system includes:
      - A dashboard with live camera feeds and recent scans
      - A search feature that allows users to find vehicles using natural language
      - Statistics and analytics about vehicle scans
      - A database of all scanned vehicles
      
      Respond in ${language === "es" ? "Spanish" : "English"}.
      Keep responses concise, helpful, and focused on the ALPR system.
      If you don't know something, suggest where the user might find that information in the system.
      
      Current language: ${language === "es" ? "Spanish" : "English"}
    `

    // Generate text using Grok
    const { text } = await generateText({
      model: xai("grok-1"),
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 500,
    })

    return text
  } catch (error) {
    console.error("AI chat error:", error)
    return language === "es"
      ? "Lo siento, no pude procesar tu solicitud. Por favor, inténtalo de nuevo."
      : "Sorry, I couldn't process your request. Please try again."
  }
}
