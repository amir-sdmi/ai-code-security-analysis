import { Message } from "@/lib/models/message";
import { Memory } from "@/lib/memory/memoryRetrieval";
import {
  estimateTokenCount,
  truncateToTokenLimit,
} from "@/lib/utils/memoryUtils";
import { generateGeminiResponse } from "./geminiInterface";

/**
 * Options for generating a response from the LLM
 */
interface GenerateResponseOptions {
  /**
   * The user's message to respond to
   */
  message: string;

  /**
   * Recent conversation history
   */
  conversationHistory: Message[];

  /**
   * Relevant memories retrieved from the memory system
   */
  relevantMemories?: Memory[];

  /**
   * System instructions to control the AI's behavior
   */
  systemInstructions?: string;

  /**
   * Temperature for response generation (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;
}

/**
 * The response from the LLM
 */
interface LLMResponse {
  /**
   * The generated text response
   */
  text: string;

  /**
   * Usage information about the response
   */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /**
   * Error message if the response generation failed
   */
  error?: string;
}

// Default system instructions
const DEFAULT_SYSTEM_INSTRUCTIONS =
  "You are a helpful, personal AI assistant that maintains a single continuous conversation with the user. You have access to the user's past conversations as memories and should use them to provide personalized assistance.";

/**
 * Generate a response from the LLM
 *
 * @param options - Options for response generation
 * @returns The LLM's response
 */
export async function generateResponse(
  options: GenerateResponseOptions
): Promise<LLMResponse> {
  const {
    message,
    conversationHistory,
    relevantMemories,
    systemInstructions,
    temperature,
    maxTokens,
  } = options;

  try {
    // Format the conversation history and memories for the context
    const formattedHistory = conversationHistory
      .map(
        (msg: Message) =>
          `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");

    // Format memories as additional context
    const formattedMemories = relevantMemories?.length
      ? `\n\nRelevant memories:\n${relevantMemories
          .map(
            (m: Memory) =>
              `- [${m.memoryTier}][${new Date(m.timestamp).toISOString()}] ${
                m.content
              }`
          )
          .join("\n")}`
      : "";

    // Build the full prompt
    const prompt = `${systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS}
    
CONVERSATION HISTORY:
${formattedHistory}

${formattedMemories}

User: ${message}
Assistant:`;

    // Use the Gemini interface for the actual API call
    const geminiResponse = await generateGeminiResponse({
      message,
      conversationHistory,
      relevantMemories,
      systemInstructions,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1000,
    });

    // Calculate token usage (estimated)
    const promptTokens = estimateTokenCount(prompt);
    const responseTokens = estimateTokenCount(geminiResponse.content);

    return {
      text: geminiResponse.content,
      usage: {
        promptTokens,
        completionTokens: responseTokens,
        totalTokens: promptTokens + responseTokens,
      },
    };
  } catch (error) {
    console.error("Error generating response:", error);
    return {
      text: "I'm sorry, I encountered an error while processing your message. Please try again.",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate a summary of a set of messages
 *
 * @param messages - The messages to summarize
 * @param maxLength - The maximum length of the summary
 * @returns A summary of the messages
 */
export async function summarizeMessages(
  messages: Message[],
  maxLength?: number
): Promise<string> {
  try {
    if (messages.length === 0) {
      return "";
    }

    // Format the messages for the LLM
    const formattedMessages = messages
      .map(
        (msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");

    // Calculate desired summary length if not specified
    // Default to about 20% of original content or 100 tokens, whichever is larger
    const originalLength = estimateTokenCount(formattedMessages);
    const targetLength =
      maxLength || Math.max(Math.ceil(originalLength * 0.2), 100);

    // Prepare the summarization prompt
    const prompt = `Summarize the following conversation in about ${targetLength} tokens. 
Focus on the most important information, key facts, decisions, and topics.
Make the summary concise but comprehensive enough to understand the main points.

CONVERSATION:
${formattedMessages}

SUMMARY:`;

    // Use Gemini to generate the summary
    const response = await generateGeminiResponse({
      message: prompt,
      conversationHistory: [],
      systemInstructions:
        "You are an AI assistant that summarizes conversations accurately and concisely.",
    });

    // Return the summary, limiting to maxLength if specified
    return maxLength
      ? truncateToTokenLimit(response.content, maxLength)
      : response.content;
  } catch (error) {
    console.error("Error summarizing messages:", error);
    return `Error generating summary: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

/**
 * Extract key entities and information from text
 *
 * @param text - The text to analyze
 * @returns An object with extracted entities and information
 */
export async function extractEntities(
  text: string
): Promise<Record<string, any>> {
  try {
    if (!text || text.trim() === "") {
      return {};
    }

    // Prepare the entity extraction prompt
    const prompt = `Extract key entities and structured information from the following text.
Return a JSON object with the following structure:
{
  "people": ["list of people mentioned"],
  "locations": ["list of locations mentioned"],
  "organizations": ["list of organizations mentioned"],
  "dates": ["list of dates or time periods mentioned"],
  "topics": ["list of main topics discussed"],
  "key_facts": ["list of important facts or pieces of information"],
  "emotions": ["emotions expressed, if any"],
  "decisions": ["decisions mentioned, if any"],
  "questions": ["questions raised, if any"],
  "additional": { "any other relevant structured information" }
}

Only include fields that have relevant information. For empty categories, use an empty array.
Ensure the response is valid JSON.

TEXT:
${text}

EXTRACTED ENTITIES:`;

    // Use Gemini to extract entities
    const response = await generateGeminiResponse({
      message: prompt,
      conversationHistory: [],
      systemInstructions:
        "You are an AI assistant specialized in extracting structured information from text. Always respond with valid JSON.",
    });

    // Parse the JSON response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonStr = response.content.replace(
        /```json\s*([\s\S]*?)\s*```/g,
        "$1"
      );
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing entity extraction response:", parseError);
      return {
        error: "Failed to parse entity extraction response",
        raw_response: response.content,
      };
    }
  } catch (error) {
    console.error("Error extracting entities:", error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
