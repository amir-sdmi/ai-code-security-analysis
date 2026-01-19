import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Get the Gemini model - using the updated model name format
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Define config interface
interface CustomGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

// Define interfaces for structured budget data
export interface Finding {
  key: string;
  value: string;
  priority: "high" | "medium" | "low";
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  amount: string;
  description: string;
}

export interface TimelinePhase {
  title: string;
  items: string[];
}

export interface StructuredBudgetData {
  title: string;
  subtitle: string;
  findings: Finding[];
  allocations: BudgetAllocation[];
  implementationTimeline: TimelinePhase[];
}

// Define interface for structured chat responses
export interface ChatResponseItem {
  type: "text" | "list" | "suggestion" | "resource" | "warning" | "code";
  content: string;
  items?: string[];
  title?: string;
  url?: string;
  language?: string;
}

export interface StructuredChatResponse {
  title: string;
  summary: string;
  content: ChatResponseItem[];
}

/**
 * Get a response from Gemini AI
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<string>} - The AI's response
 */
export const getGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    throw error;
  }
};

/**
 * Get a structured JSON chat response from Gemini AI
 * @param {string} prompt - The user's input prompt with JSON instructions
 * @returns {Promise<StructuredChatResponse>} - The structured chat data
 */
export const getStructuredChatResponse = async (prompt: string): Promise<StructuredChatResponse> => {
  try {
    // Add instructions to ensure we get a valid JSON response
    const jsonPrompt = `${prompt}
    
IMPORTANT: Your entire response must be valid JSON following this exact structure without any other text, markdown, or explanation:
{
  "title": "Response title (short)",
  "summary": "A brief summary of the answer",
  "content": [
    {
      "type": "text",
      "content": "Regular paragraph text information"
    },
    {
      "type": "list",
      "title": "Optional list title",
      "items": ["List item 1", "List item 2", "List item 3"]
    },
    {
      "type": "suggestion",
      "content": "A suggestion or recommendation"
    },
    {
      "type": "resource",
      "title": "Resource name",
      "content": "Resource description",
      "url": "https://example.com"
    },
    {
      "type": "warning",
      "content": "Important warning or caution information"
    },
    {
      "type": "code",
      "language": "javascript",
      "content": "console.log('Example code snippet');"
    }
  ]
}

Remember that not all types need to be included - only include what's relevant to the query. Focus on providing clear, accurate healthcare finance information.
`;

    const result = await model.generateContent(jsonPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the response as JSON
      return JSON.parse(text) as StructuredChatResponse;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      // Try to extract JSON from the response if it contains other text
      const jsonMatch = text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as StructuredChatResponse;
        } catch (extractError) {
          console.error("Failed to extract JSON from response:", extractError);
          throw new Error("Invalid JSON response from Gemini");
        }
      } else {
        throw new Error("Could not find JSON in Gemini response");
      }
    }
  } catch (error) {
    console.error("Error getting structured Gemini response:", error);
    throw error;
  }
};

/**
 * Get a structured JSON response from Gemini AI
 * @param {string} prompt - The user's input prompt with JSON instructions
 * @returns {Promise<StructuredBudgetData>} - The structured data
 */
export const getStructuredBudgetData = async (prompt: string): Promise<StructuredBudgetData> => {
  try {
    // Add instructions to ensure we get a valid JSON response
    const jsonPrompt = `${prompt}
    
IMPORTANT: Your entire response must be valid JSON following this exact structure without any other text, markdown, or explanation:
{
  "title": "Healthcare Budget Analysis: [Location] State",
  "subtitle": "Based on economic indicators of ₹[GDP] Crores GDP and [Population] Lakhs population",
  "findings": [
    {
      "key": "Finding description",
      "value": "Budget implication description",
      "priority": "high/medium/low"
    }
  ],
  "allocations": [
    {
      "category": "Category name",
      "percentage": number,
      "amount": "₹X Crores",
      "description": "Rationale for allocation"
    }
  ],
  "implementationTimeline": [
    {
      "title": "Phase 1 (Year 1)",
      "items": ["Implementation step 1", "Implementation step 2"]
    },
    {
      "title": "Phase 2 (Years 2-3)",
      "items": ["Implementation step 1", "Implementation step 2"]
    }
  ]
}
`;

    const result = await model.generateContent(jsonPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the response as JSON
      return JSON.parse(text) as StructuredBudgetData;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      // Try to extract JSON from the response if it contains other text
      const jsonMatch = text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as StructuredBudgetData;
        } catch (extractError) {
          console.error("Failed to extract JSON from response:", extractError);
          throw new Error("Invalid JSON response from Gemini");
        }
      } else {
        throw new Error("Could not find JSON in Gemini response");
      }
    }
  } catch (error) {
    console.error("Error getting structured Gemini response:", error);
    throw error;
  }
};

/**
 * Start a chat session with Gemini
 * @returns {object} - Chat session object
 */
export const startGeminiChat = (systemInstruction?: string) => {
  try {
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
      systemInstruction: systemInstruction, // Use provided system instruction or undefined
    });
    return chat;
  } catch (error) {
    console.error("Error starting Gemini chat:", error);
    throw error;
  }
};

/**
 * Send a message in an existing chat session
 * @param {object} chat - The chat session object
 * @param {string} message - The user's message
 * @returns {Promise<string>} - The AI's response
 */
export const sendChatMessage = async (chat: any, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * Generate content with specific parameters
 * @param {string} prompt - The user's input prompt
 * @param {object} config - Configuration options for generation
 * @returns {Promise<string>} - The AI's response
 */
export const generateCustomContent = async (prompt: string, config: CustomGenerationConfig = {}): Promise<string> => {
  try {
    const generationConfig = {
      temperature: config.temperature || 0.7,
      topP: config.topP || 0.8,
      topK: config.topK || 40,
      maxOutputTokens: config.maxOutputTokens || 2048,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating custom content:", error);
    throw error;
  }
};

/**
 * Stream a response from Gemini
 * @param {string} prompt - The user's input prompt
 * @param {function} onChunk - Callback function for each chunk of the response
 */
export const streamResponse = async (prompt: string, onChunk: (text: string) => void): Promise<void> => {
  try {
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  } catch (error) {
    console.error("Error streaming response:", error);
    throw error;
  }
};

// Export a default configuration object
export const defaultConfig: CustomGenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
};