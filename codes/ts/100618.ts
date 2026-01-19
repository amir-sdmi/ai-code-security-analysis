
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionResponse {
  message: ChatMessage;
}

const API_KEY = "AIzaSyCqFmyhmyq8cCS_ksYPbNKIXV85ggFX9Qs";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateResponse = async (
  messages: ChatMessage[],
  category: string
): Promise<ChatCompletionResponse> => {
  try {
    console.log(`Sending request to Gemini API for category: ${category}`, messages);
    
    // Convert the chat history to a single string prompt
    const prompt = messages.map(msg => 
      `${msg.role === 'system' ? 'Instructions' : msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const finalPrompt = `You are a legal assistant specialized in ${category} law. Provide accurate, helpful, and clear guidance.\n\n${prompt}`;

    // Get the generative model - using gemini-1.5-flash instead of gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API Response:', text);

    return {
      message: {
        role: 'assistant',
        content: text
      }
    };
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};
