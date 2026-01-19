import { GoogleGenerativeAI } from "@google/generative-ai"

// Use GEMINI_API_KEY to match your .env file
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey)

// Use the correct current model name
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
