import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiChat = {
  // Function to get a response from Gemini
  getResponse: async (prompt) => {
    try {
      // Use gemini-2.0-flash model for faster responses
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Generate content based on the prompt
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error("Error getting response from Gemini:", error);
      return "I'm sorry, I couldn't process your request at the moment. Please try again later.";
    }
  },
};
