import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the generative model
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to generate content using Gemini
export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
} 