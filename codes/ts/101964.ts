/**
 * JarvisAPIService.ts
 * 
 * This service handles all API interactions for the JARVIS AI assistant,
 * including speech recognition, natural language processing, assistant responses,
 * and text-to-speech functionality.
 */

import { getGeminiResponse } from '../utils/AIUtils';

interface JarvisResponse {
  text: string;
  confidence: number;
}

class JarvisAPIService {
  /**
   * Converts speech to text using Google Speech-to-Text API
   * @param audioData The audio data to convert
   * @returns The transcribed text
   */
  async speechToText(audioData: any): Promise<string> {
    console.log('Processing speech to text...', audioData);
    
    try {
      // In a real implementation, you would send the audio data to Google Speech-to-Text API
      // For now, we'll simulate a response with a more realistic delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a production environment, you would implement actual speech-to-text here
      // For demo purposes, we'll return a simulated response based on the audio data
      if (audioData && audioData.uri) {
        console.log('Audio URI detected:', audioData.uri);
        // Return a more dynamic response for demonstration
        const responses = [
          "What's the weather like today?",
          "Tell me about artificial intelligence",
          "What time is it?",
          "How does the internet work?",
          "Tell me a fun fact",
          "What are the latest technology trends?",
          "How does quantum computing work?",
          "Tell me about space exploration",
          "What's new in renewable energy?",
          "How can I improve my productivity?"
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
      }
      
      return "What's the weather like today?";
    } catch (error) {
      console.error('Error in speechToText:', error);
      throw new Error('Failed to process speech to text');
    }
  }

  /**
   * Processes natural language using Google Cloud Natural Language API
   * In this implementation, we'll use Gemini API instead
   * @param text The text to process
   * @returns The processed text with intent and entities
   */
  async processLanguage(text: string): Promise<any> {
    console.log('Processing natural language:', text);
    
    try {
      // Use Gemini API to analyze the text
      const prompt = `Analyze the following text and extract the intent and entities. 
      Return the result as JSON with intent, entities, and sentiment fields.
      
      Text: "${text}"`;
      
      const response = await getGeminiResponse(prompt);
      
      // Try to parse the response as JSON
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
        
        // Fallback to simple intent detection
        const lowercaseText = text.toLowerCase();
        
        if (lowercaseText.includes('weather')) {
          return {
            intent: 'weather',
            entities: {
              location: 'current',
              timeframe: 'today'
            },
            sentiment: 'neutral'
          };
        } else if (lowercaseText.includes('hello') || lowercaseText.includes('hi')) {
          return {
            intent: 'greeting',
            entities: {},
            sentiment: 'positive'
          };
        } else {
          return {
            intent: 'unknown',
            entities: {},
            sentiment: 'neutral'
          };
        }
      }
    } catch (error) {
      console.error('Error processing language:', error);
      
      // Fallback to simple intent detection
      const lowercaseText = text.toLowerCase();
      
      if (lowercaseText.includes('weather')) {
        return {
          intent: 'weather',
          entities: {
            location: 'current',
            timeframe: 'today'
          },
          sentiment: 'neutral'
        };
      } else if (lowercaseText.includes('hello') || lowercaseText.includes('hi')) {
        return {
          intent: 'greeting',
          entities: {},
          sentiment: 'positive'
        };
      } else {
        return {
          intent: 'unknown',
          entities: {},
          sentiment: 'neutral'
        };
      }
    }
  }

  /**
   * Gets a response using the Gemini API
   * @param intent The intent of the user's request
   * @param entities The entities in the user's request
   * @returns The assistant's response
   */
  async getAssistantResponse(intent: string, entities: any): Promise<JarvisResponse> {
    console.log('Getting assistant response for intent:', intent);
    
    try {
      // Create a prompt for Gemini based on the intent and entities
      let prompt = `You are JARVIS, an advanced AI assistant created by Pranav Aitha. 
      Respond in a helpful, concise, and slightly technical manner.
      
      The user's intent is: ${intent}`;
      
      if (entities && Object.keys(entities).length > 0) {
        prompt += `\nEntities detected: ${JSON.stringify(entities)}`;
      }
      
      prompt += `\n\nProvide a helpful response as JARVIS:`;
      
      const response = await getGeminiResponse(prompt);
      
      return {
        text: response,
        confidence: 0.95
      };
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Fallback responses
      switch (intent) {
        case 'weather':
          return {
            text: `The weather ${entities.location === 'current' ? 'here' : 'in ' + entities.location} ${entities.timeframe === 'today' ? 'today' : 'on ' + entities.timeframe} is sunny with a high of 75°F.`,
            confidence: 0.95
          };
        case 'greeting':
          return {
            text: "Hello! How can I assist you today?",
            confidence: 0.99
          };
        default:
          return {
            text: "I'm not sure I understand. Could you please rephrase your question?",
            confidence: 0.7
          };
      }
    }
  }

  /**
   * Converts text to speech using Google Cloud Text-to-Speech API
   * @param text The text to convert
   * @returns The audio data
   */
  async textToSpeech(text: string): Promise<any> {
    // In a real implementation, you would send the text to Google Cloud Text-to-Speech API
    console.log('Converting text to speech:', text);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return a simulated response
      return {
        audioData: "simulated-audio-data",
        format: "mp3"
      };
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Process a complete user request from text input
   * @param text The user's text input
   * @returns The assistant's response
   */
  async processTextRequest(text: string): Promise<string> {
    try {
      console.log('Processing text request:', text);
      // For direct text requests, we can use Gemini API directly
      const prompt = `You are JARVIS, an advanced AI assistant created by Pranav Aitha. 
      Respond in a helpful, concise, and slightly technical manner.
      
      User query: ${text}`;
      
      return await getGeminiResponse(prompt);
    } catch (error) {
      console.error('Error processing text request:', error);
      return "I'm sorry, I encountered an error processing your request.";
    }
  }

  /**
   * Process a complete user request from audio input
   * @param audioData The user's audio input
   * @returns The assistant's response
   */
  async processAudioRequest(audioData: any): Promise<{text: string, audio: any}> {
    try {
      console.log('Processing audio request...');
      // Convert speech to text
      const text = await this.speechToText(audioData);
      console.log('Speech converted to text:', text);
      
      // Get response using Gemini API
      const response = await this.processTextRequest(text);
      console.log('Response generated:', response);
      
      // Convert the response to speech
      const speechResponse = await this.textToSpeech(response);
      console.log('Text converted to speech');
      
      return {
        text: response,
        audio: speechResponse
      };
    } catch (error) {
      console.error('Error processing audio request:', error);
      return {
        text: "I'm sorry, I encountered an error processing your request.",
        audio: null
      };
    }
  }
}

// Export a singleton instance
export default new JarvisAPIService();