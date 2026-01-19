import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Google Generative AI client
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Get a streaming response from Gemini 2.0 Flash model
 * @param {string} prompt - The user's prompt
 * @param {Array} history - Optional conversation history
 * @returns {AsyncGenerator} - A stream of response chunks
 */
export async function* getGeminiStream(prompt, history = []) {
  try {
    // Use Gemini 2.0 Flash for real-time streaming
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Format history for the Gemini API
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Create a chat session with history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    // Get streaming response
    const result = await chat.sendMessageStream(prompt);
    
    // Yield each chunk as it arrives
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Error in getGeminiStream:', error);
    throw error;
  }
}

/**
 * Get a streaming response from Gemini 1.5 Pro model with multimodal support
 * @param {string} prompt - The user's prompt
 * @param {string} imageBase64 - Optional base64-encoded image data
 * @param {Array} history - Optional conversation history
 * @returns {AsyncGenerator} - A stream of response chunks
 */
export async function* getGeminiMultimodalStream(prompt, imageBase64 = null, history = []) {
  try {
    // Use Gemini 1.5 Pro for multimodal support
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Prepare content parts
    const parts = [{ text: prompt }];
    
    // Add image if provided
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      });
    }
    
    // Get streaming response
    const result = await model.generateContentStream(parts);
    
    // Yield each chunk as it arrives
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Error in getGeminiMultimodalStream:', error);
    throw error;
  }
}

/**
 * Convert audio to text using Google's Speech-to-Text API
 * @param {string} audioBase64 - Base64-encoded audio data
 * @returns {Promise<string>} - Transcribed text
 */
export async function convertAudioToText(audioBase64) {
  // This is a placeholder for now
  // In a real implementation, you would use Google's Speech-to-Text API
  console.log('Audio transcription requested (placeholder implementation)');
  return 'Transcribed audio text';
}