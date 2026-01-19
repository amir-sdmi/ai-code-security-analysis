const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  // Removed `fs` as it is not supported in the browser
  const mime = require("mime-types");
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Updated to use gemini-1.5-flash-latest model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // Updated from gemini-2.5-pro-exp-03-25
  });
  
  const generationConfig = {
    temperature: 0.7, // Reduced from 1 for more focused responses
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096, // Reduced to a more practical size
    responseModalities: [],
    responseMimeType: "text/plain",
  };
  
  export const chatSession = model.startChat({
    generationConfig,
  });
  
  // Export the genAI instance for potential future use
  export default genAI;