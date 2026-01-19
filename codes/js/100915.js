import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI object with the API key
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const getLegalAdvice = async (question, chatHistory = []) => {
  try {
    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    let contextPrompt = '';
    if (chatHistory.length > 0) {
      contextPrompt = `Previous conversation context:\n${chatHistory.map(chat => 
        `Q: ${chat.question}\nA: ${chat.answer}\n`
      ).join('\n')}\n\nNow, regarding the follow-up question:`;
    }
    
    const prompt = `As a legal assistant, please provide a clear and structured explanation for the following legal question. Your response should be formatted in a clean, readable way:

${contextPrompt}

Title: [Topic of the Question]

Prerequisites:
1. [First requirement]
2. [Second requirement]
   • Additional details if needed
   • Important points to note

Step-by-Step Guide:

Step 1: [First Major Step]
• Key action items
• Important details to consider
• Relevant information

Step 2: [Second Major Step]
• Main points
• Critical considerations
• Required actions

[Continue with additional steps as needed]

Important Information:

Legal Considerations:
• Key legal requirements
• Important deadlines
• Mandatory procedures

Best Practices:
• Professional recommendations
• Helpful tips
• Practical advice

Additional Resources:
• Relevant forms or documents
• Helpful contacts
• Useful references

Note: Format the response with proper spacing and clear section breaks for better readability.

Question: ${question}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting legal advice:', error);
    throw error;
  }
};