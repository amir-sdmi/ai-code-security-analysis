import { GoogleGenerativeAI } from '@google/generative-ai';

// This would typically be stored in an environment variable
// For demo purposes, setting a default API key - in production, use environment variables
const GEMINI_API_KEY = "AIzaSyAreMqWt6cpVH_NmCZvvre7JGcOKosQFC0"; // Example API key for demo

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Context information about SoftShell for the AI
const SYSTEM_CONTEXT = `
You are an AI assistant for SoftShell, a software license marketplace that helps users sell their unused software licenses. 
Respond to user queries about the platform with friendly, concise answers.
If you don't know the answer to a question, guide the user to contact support via the contact form.

Key information about SoftShell:
- SoftShell allows users to sell unused software licenses for immediate revenue
- The platform connects sellers with buyers
- SoftShell handles compliance and ensures secure transactions
- The selling process involves: 1) Upload license, 2) Get valuation, 3) Get paid
- Payments are typically processed within 48 hours
- SoftShell supports major software vendors
`;

// Predefined example questions and answers for mock mode
const exampleQAs = [
  {
    question: "How do I sell my license?",
    answer: "Selling your license is easy! Just follow these 3 steps: 1) Upload your license details through our secure portal, 2) Receive an AI-powered valuation within minutes, 3) Accept the offer and get paid within 48 hours. Would you like more details about any of these steps?"
  },
  {
    question: "What types of licenses can I sell?",
    answer: "SoftShell supports a wide range of software licenses from major vendors including Microsoft, Adobe, Oracle, Autodesk, and many more. Both perpetual and subscription licenses can be sold on our platform, as long as they are transferable under the vendor's terms."
  },
  {
    question: "How much can I get for my license?",
    answer: "The value of your license depends on several factors including the software vendor, version, remaining subscription period, and current market demand. Our AI valuation system analyzes real-time market data to offer the best possible price. Typically, users can recover 40-70% of the original purchase price for unused licenses."
  },
  {
    question: "Is selling software licenses legal?",
    answer: "Yes, selling transferable software licenses is legal in most jurisdictions. SoftShell ensures compliance with all relevant regulations and vendor terms. We handle the verification process to confirm that licenses can be legally transferred before completing any transaction."
  },
  {
    question: "How long does payment take?",
    answer: "Once you accept an offer, payment is typically processed within 48 hours. SoftShell offers multiple payment options including bank transfer, PayPal, and cryptocurrency for your convenience."
  }
];

// Find the closest matching example question
const findClosestExample = (userQuery) => {
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  // Check for direct keyword matches first
  if (normalizedQuery.includes("sell") && normalizedQuery.includes("license")) {
    return exampleQAs[0];
  }
  if (normalizedQuery.includes("types") || normalizedQuery.includes("what") && normalizedQuery.includes("licenses")) {
    return exampleQAs[1];
  }
  if (normalizedQuery.includes("how much") || normalizedQuery.includes("value") || normalizedQuery.includes("price")) {
    return exampleQAs[2];
  }
  if (normalizedQuery.includes("legal") || normalizedQuery.includes("allowed")) {
    return exampleQAs[3];
  }
  if (normalizedQuery.includes("payment") || normalizedQuery.includes("how long") || normalizedQuery.includes("when")) {
    return exampleQAs[4];
  }
  
  // Fallback to the first example if no match is found
  return null;
};

// Mock response in case the API key isn't provided
const getMockResponse = async (userQuery) => {
  console.log("Using mock response for query:", userQuery);
  const example = findClosestExample(userQuery);
  
  if (example) {
    console.log("Found matching example:", example.question);
    return example.answer;
  }
  
  console.log("No matching example found, using default response");
  return "I'm not sure how to answer that specific question. Could you try rephrasing, or would you like to ask about how to sell licenses, supported license types, valuation, legality, or payment processes?";
};

// Get response from Gemini API
const getGeminiResponse = async (userQuery, chatHistory) => {
  try {
    console.log("Attempting to get response from Gemini for query:", userQuery);
    
    // Format chat history for Gemini
    const formattedHistory = chatHistory
      .filter(msg => msg.id > 1) // Skip welcome message to avoid confusion
      .map(msg => ({
        role: msg.fromUser ? "user" : "model",
        parts: [{ text: msg.text }]
      }));
    
    console.log("Using Gemini API with key:", GEMINI_API_KEY.substring(0, 5) + "...");
    
    // Try using gemini-pro, it may be available even in free tier with limitations
    try {
      console.log("Attempting to use gemini-pro model");
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(userQuery);
      const response = result.response.text();
      console.log("Successfully received response from gemini-pro");
      return response;
    } catch (proError) {
      console.error("Error with gemini-pro, falling back to flash model:", proError);
      
      // Fall back to flash model
      console.log("Attempting to use gemini-1.0-flash model");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create a simplified prompt without complex formatting
      const simplifiedPrompt = `${SYSTEM_CONTEXT}\n\nUser question: ${userQuery}\n\nPlease provide a helpful response:`;
      
      // Generate a response using the flash model with simplified prompt
      const result = await model.generateContent(simplifiedPrompt);
      
      if (result && result.response) {
        const response = result.response.text();
        console.log("Successfully received response from gemini-1.0-flash");
        return response;
      } else {
        throw new Error("Invalid response from Gemini flash model");
      }
    }
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Instead of silently falling back to mock, include error info in the response
    if (error.message && error.message.includes("API key")) {
      return "I'm having trouble with my AI capabilities due to an API key issue. Please contact support to resolve this. In the meantime, I can still help with basic questions about SoftShell.";
    }
    
    // Fall back to mock response but inform the user
    const mockResponse = await getMockResponse(userQuery);
    return `Note: I'm currently using pre-written responses due to a technical issue with the Gemini API. Here's what I know about your question:\n\n${mockResponse}`;
  }
};

export { getGeminiResponse, exampleQAs };