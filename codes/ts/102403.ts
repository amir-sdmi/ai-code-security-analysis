import OpenAI from 'openai';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ChatMessage } from '../types';
import { config } from '../config';

/**
 * Constants for token management to control context size
 */
const MAX_CONTEXT_TOKENS = 4096;
const TOKENS_PER_CHARACTER = 0.25;

/**
 * ChatService handles interactions with multiple AI providers (OpenAI and Google Gemini)
 * with automatic fallback between them when one fails or returns low-quality responses
 */
export class ChatService {
  private openai: OpenAI;
  private geminiModel: GenerativeModel | null = null;
  private messages: ChatMessage[] = [];
  private currentGeminiModel = '';
  private apiFailureCount = 0;
  private circuitBreakerThreshold = 3;
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    
    // Initialize Gemini if API key is provided
    if (config.geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        
        // Use the preferred Gemini model from config
        const preferredGeminiModel = config.modelPreferences.gemini;
        
        try {
          this.geminiModel = genAI.getGenerativeModel({ model: preferredGeminiModel });
          this.currentGeminiModel = preferredGeminiModel;
          console.log(`Gemini model ${preferredGeminiModel} initialized successfully`);
        } 
        catch (primaryModelError) {
          console.warn(`Could not initialize ${preferredGeminiModel}, trying alternative models:`, primaryModelError);
          
          // Try alternative models if the preferred one fails
          const fallbackModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.0-pro']
            .filter(model => model !== preferredGeminiModel); // Filter out the preferred model as we already tried it
            
          let success = false;
          
          for (const modelName of fallbackModels) {
            try {
              this.geminiModel = genAI.getGenerativeModel({ model: modelName });
              this.currentGeminiModel = modelName;
              console.log(`Fallback to Gemini model ${modelName} successful`);
              success = true;
              break;
            } 
            catch (fallbackError) {
              console.warn(`Failed to initialize ${modelName}:`, fallbackError);
            }
          }
          
          if (!success) {
            throw new Error('All Gemini model initialization attempts failed');
          }
        }
      } catch (error) {
        console.error('Failed to initialize any Gemini model:', error);
        this.geminiModel = null;
        this.currentGeminiModel = '';
      }
    }
  }
    async getResponse(message: string): Promise<{ message: string; source?: string }> {
    // Circuit breaker pattern implementation
    if (this.apiFailureCount >= this.circuitBreakerThreshold) {
      console.log(`Circuit breaker triggered after ${this.apiFailureCount} consecutive failures`);
      return this.useFallbackStrategy();
    }
    
    try {
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }
      
      // Add user message to history
      this.messages.push({
        role: 'user',
        content: message
      });
      
      // Truncate history to stay within token limits
      this.truncateHistory();

      // Define the persona instructions for ChatGPT
      const systemMessage = `You are responding as the user's personal voice bot. 
      Answer questions about yourself as if you were the user, based on these personal characteristics:
      
      - You're ambitious and goal-oriented
      - Your superpower is deep analytical thinking
      - You want to grow in public speaking, technical leadership, and creative problem-solving
      - People might think you're always serious, but you have a playful side
      - You push your boundaries by taking on challenging projects outside your comfort zone
      
      Answer honestly and authentically, as if you were sharing your own personal experiences and traits.`;      let responseText;
      const useMockResponse = config.useMockResponses || !config.openaiApiKey;
      
      if (useMockResponse) {
        const msgLower = message.toLowerCase();
        
        if (msgLower.includes('superpower')) {
          responseText = "My #1 superpower is definitely deep analytical thinking. I can quickly break down complex problems, see patterns others might miss, and develop systematic approaches to solving challenges. This has helped me tremendously in both my professional work and personal projects.";
          
        } else if (msgLower.includes('grow')) {
          responseText = "The top 3 areas I'd like to grow in are public speaking, technical leadership, and creative problem-solving. I'm working on speaking more confidently in group settings, guiding technical decisions with more authority, and approaching problems with fresh perspectives.";
          
        } else if (msgLower.includes('misconception')) {
          responseText = "The biggest misconception my coworkers have about me is that I'm always serious. While I do take my work seriously, I actually have quite a playful side that comes out once people get to know me. I love a good laugh and bringing humor into the workplace when appropriate.";
          
        } else if (msgLower.includes('boundaries')) {
          responseText = "I push my boundaries by deliberately taking on projects outside my comfort zone. I believe growth happens when we're challenged, so I regularly seek opportunities that require me to learn new skills or work in unfamiliar contexts. It's uncomfortable at first, but the satisfaction of overcoming these challenges is worth it.";
          
        } else if (msgLower.includes('life story')) {
          responseText = "In a few sentences, my life story involves growing up with a passion for solving puzzles, which led me to study technology and data analysis. I've worked across several industries, each time taking on more challenging problems. Outside of work, I enjoy outdoor activities that clear my mind and spending time with family and friends who keep me grounded.";
          
        } else if (msgLower.includes('india') && msgLower.includes('capital')) {
          responseText = "India's capital is New Delhi. As someone who appreciates diverse cultures, I find New Delhi fascinating with its blend of historical monuments and modern infrastructure. It serves as the seat of all three branches of the Indian government.";
          
        } else if (msgLower.includes('hobby') || msgLower.includes('free time')) {
          responseText = "In my free time, I enjoy hiking and landscape photography. There's something about capturing the perfect sunset or mountain vista that helps me disconnect from work and gain new perspectives. I also enjoy coding side projects that solve small problems in my daily life.";
          
        } else if (msgLower.includes('challenge') || msgLower.includes('difficult')) {
          responseText = "The most challenging situation I've faced recently was leading a project with constantly shifting requirements. I overcame it by establishing clear communication channels, setting realistic expectations, and building in flexibility to our timeline. The experience taught me a lot about adaptability.";
          
        } else if (msgLower.includes('book') || msgLower.includes('reading')) {
          responseText = "I've been reading quite a bit on systems thinking lately. The last book that really influenced me was 'Thinking in Systems' by Donella Meadows. It's changed how I approach complex problems both in my professional work and personal life.";
          
        } else if (msgLower.includes('strength') || msgLower.includes('weakness')) {
          responseText = "My greatest strength is my persistence when facing difficult problems. I don't give up easily. My biggest weakness is probably that I sometimes get too focused on perfecting details when a good-enough solution would suffice. I'm working on finding better balance there.";
            } else {
          responseText = "That's an interesting question! As someone who values continuous growth and analytical thinking, I'm always looking for new challenges to tackle and ways to push my boundaries. Could you ask me something about my superpower, areas for growth, or how I approach challenges?";
        }      } else {
        try {
          const aiResponse = await this.getAIResponse(systemMessage);
          responseText = aiResponse.text;
          
          // Reset failure count on success
          this.apiFailureCount = 0;
          
          // Return the response with source info (message history will be updated below)
          return { message: responseText, source: aiResponse.source };
        } catch (apiError) {
          console.error('All API attempts failed:', apiError);
          
          // Increment failure count for circuit breaker
          this.apiFailureCount++;
          console.log(`API failure count: ${this.apiFailureCount}/${this.circuitBreakerThreshold}`);
          
          // Final fallback response when all APIs fail
          responseText = "I'm currently having trouble connecting to my knowledge base. As someone who values reliability, this is frustrating, but I'd be happy to try answering your question again in a moment.";
        }
      }
      
      // Add assistant response to history
      this.messages.push({
        role: 'assistant',
        content: responseText
      });
      
      // If we're using mock responses, indicate that in the response
      const source = useMockResponse ? "Mock Response" : undefined;

      return { message: responseText, source };
    } catch (error) {
      console.error('Error in getResponse:', error);
      throw error;
    }
  }

  // Method to generate streaming responses
  async *getStreamingResponse(message: string): AsyncGenerator<{ chunk: string; source: string }> {
    // Circuit breaker check
    if (this.apiFailureCount >= this.circuitBreakerThreshold) {
      yield {
        chunk: "I'm currently experiencing connectivity issues. Please try again in a minute.",
        source: "Circuit Breaker"
      };
      return;
    }

    try {
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }
      
      // Add user message to history
      this.messages.push({
        role: 'user',
        content: message
      });
      
      // Truncate history to stay within token limits
      this.truncateHistory();

      // Define the persona instructions for the AI
      const systemMessage = `You are responding as the user's personal voice bot. 
      Answer questions about yourself as if you were the user, based on these personal characteristics:
      
      - You're ambitious and goal-oriented
      - Your superpower is deep analytical thinking
      - You want to grow in public speaking, technical leadership, and creative problem-solving
      - People might think you're always serious, but you have a playful side
      - You push your boundaries by taking on challenging projects outside your comfort zone
      
      Answer honestly and authentically, as if you were sharing your own personal experiences and traits.`;
      
      // Use config to determine if we should use a mock response
      const useMockResponse = config.useMockResponses || !config.openaiApiKey;
      
      let responseText = '';
      let source = 'Unknown';
      
      if (useMockResponse) {
        // For mock responses, simulate streaming by yielding word by word
        const mockResponse = this.getMockResponse(message);
        const words = mockResponse.split(' ');
        
        for (const word of words) {
          responseText += word + ' ';
          yield { chunk: word + ' ', source: 'Mock Response' };
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        source = 'Mock Response';
      } else {
        try {
          // Stream from OpenAI if available
          if (config.openaiApiKey) {
            try {
              const stream = await this.openai.chat.completions.create({
                model: config.modelPreferences.openai,
                messages: [
                  { role: "system", content: systemMessage },
                  ...this.messages.map(msg => ({ 
                    role: msg.role as 'user' | 'assistant', 
                    content: msg.content 
                  }))
                ],
                stream: true, // Enable streaming
                temperature: 0.7,
                max_tokens: 300,
              });
              
              source = `OpenAI (${config.modelPreferences.openai})`;
              
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  responseText += content;
                  yield { chunk: content, source };
                }
              }
              
              // Reset failure count on success
              this.apiFailureCount = 0;
            } catch (openaiError) {
              console.error('OpenAI streaming failed:', openaiError);
              
              // Try Gemini if available as fallback (note: Gemini may not support streaming API)
              if (this.geminiModel) {
                try {
                  // Since Gemini may not have streaming, we'll return its response in chunks
                  const result = await this.getGeminiResponse(systemMessage);
                  const words = result.text.split(' ');
                  source = `Gemini (${this.currentGeminiModel})`;
                  
                  for (const word of words) {
                    responseText += word + ' ';
                    yield { chunk: word + ' ', source };
                    // Simulate typing delay
                    await new Promise(resolve => setTimeout(resolve, 30));
                  }
                  
                  // Reset failure count on success
                  this.apiFailureCount = 0;
                } catch (geminiError) {
                  console.error('Gemini streaming failed:', geminiError);
                  this.apiFailureCount++;
                  throw new Error('All streaming attempts failed');
                }
              } else {
                this.apiFailureCount++;
                throw new Error('No streaming providers available');
              }
            }
          } else if (this.geminiModel) {
            // If OpenAI is not available but Gemini is
            try {
              // Since Gemini may not have streaming, we'll return its response in chunks
              const result = await this.getGeminiResponse(systemMessage);
              const words = result.text.split(' ');
              source = `Gemini (${this.currentGeminiModel})`;
              
              for (const word of words) {
                responseText += word + ' ';
                yield { chunk: word + ' ', source };
                // Simulate typing delay
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              
              // Reset failure count on success
              this.apiFailureCount = 0;
            } catch (geminiError) {
              console.error('Gemini streaming failed:', geminiError);
              this.apiFailureCount++;
              throw new Error('Gemini streaming failed');
            }
          } else {
            throw new Error('No AI providers available');
          }
        } catch (error) {
          console.error('All streaming attempts failed:', error);
          this.apiFailureCount++;
          yield { 
            chunk: "I'm currently having trouble connecting to my knowledge base. Please try again soon.", 
            source: 'Error' 
          };
          return; // Stop generator
        }
      }
      
      // Add assistant response to history
      this.messages.push({
        role: 'assistant',
        content: responseText.trim()
      });
    } catch (error) {
      console.error('Error in streaming response:', error);
      yield { 
        chunk: "An error occurred while generating a response.", 
        source: 'Error' 
      };
    }
  }
  
  // Private method to get response from AI services with quality validation and fallback
  private async getAIResponse(systemMessage: string): Promise<{ text: string; source: string }> {
    const openAIAvailable = config.openaiApiKey && !config.useMockResponses;
    const geminiAvailable = this.geminiModel && config.geminiApiKey && !config.useMockResponses;
      if (openAIAvailable) {
      try {
        const preferredOpenAIModel = config.modelPreferences.openai;
        console.log(`Attempting to use OpenAI API with model ${preferredOpenAIModel}...`);
        
        const completion = await this.openai.chat.completions.create({
          model: preferredOpenAIModel,
          messages: [
            { role: "system", content: systemMessage },
            ...this.messages.map(msg => ({ 
              role: msg.role as 'user' | 'assistant', 
              content: msg.content 
            }))
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        
        const responseText = completion.choices[0].message.content;
        
        if (this.isQualityResponse(responseText)) {
          console.log('OpenAI provided a quality response');
          return { text: responseText || '', source: `OpenAI (${config.modelPreferences.openai})` };
        }
        
        console.log('OpenAI response failed quality check, attempting fallback...');
      } 
      catch (openaiError: unknown) {
        const errorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown error';
        console.error(`OpenAI API error (${errorMessage}), attempting fallback...`);
      }
    }
      // Try Gemini if available (either as fallback or primary if OpenAI not available)
    if (geminiAvailable && this.geminiModel) { // Explicit null check for TypeScript
      try {
        console.log(`Attempting to use Gemini API (model: ${this.currentGeminiModel})...`);
        
        // Convert messages for Gemini format
        const geminiMessages = this.messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));
        
        // Add system message at the beginning
        geminiMessages.unshift({
          role: 'user',
          parts: [{ text: `SYSTEM: ${systemMessage}` }]
        });
        
        // Configure generation parameters optimized for the current model
        const generationConfig = this.getOptimizedGenerationConfig();
        
        const result = await this.geminiModel.generateContent({
          contents: geminiMessages,
          generationConfig
        });
        
        const responseText = result.response.text();
        
        // Validate response quality
        if (this.isQualityResponse(responseText)) {
          console.log('Gemini provided a quality response');
          return { text: responseText, source: `Gemini (${this.currentGeminiModel})` };
        }
        
        console.log('Gemini response failed quality check');
        return { text: responseText, source: `Gemini (${this.currentGeminiModel}) - Low Quality` };
      } 
      catch (geminiError: unknown) {
        const errorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown error';
        console.error(`Gemini API error (${errorMessage})`);
        throw new Error(`Both AI services failed or provided low quality responses`);
      }
    }
    
    // If we get here, neither service was available or both failed
    throw new Error('No AI service available or all services failed');
  }
  // Helper method to get optimized generation config based on the current model
  private getOptimizedGenerationConfig() {
    // Base configuration that works for all models
    const baseConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 300
    };
    
    // Add model-specific optimizations
    if (this.currentGeminiModel.includes('flash')) {
      // Flash models perform better with these settings
      return {
        ...baseConfig,
        temperature: 0.6, // Slightly lower temperature for more focused responses
      };
    } else if (this.currentGeminiModel.includes('pro')) {
      // Pro models can handle more complex reasoning with these settings
      return {
        ...baseConfig,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 400
      };
    } else if (this.currentGeminiModel.includes('2.0')) {
      // Newer 2.0 models
      return {
        ...baseConfig,
        temperature: 0.65,
        topK: 45,
        topP: 0.92,
        maxOutputTokens: 350
      };
    }
    
    return baseConfig;
  }

  // Helper method to evaluate the quality of an AI response
  private isQualityResponse(text: string | null | undefined): boolean {
    if (!text) return false;
    
    // Minimum length check - responses should have some substance
    const minLength = 15;
    
    // Check for phrases that indicate low quality or non-answers
    const lowQualityPhrases = [
      "I don't know", 
      "I can't answer", 
      "I'm not sure how to respond",
      "I don't have enough information",
      "As an AI",
      "I'm sorry, but I cannot",
      "I cannot provide"
    ];
    
    // Check for overly generic responses
    const genericPhrases = [
      "That's an interesting question",
      "I'd need more context",
      "It depends on various factors"
    ];

    // Evaluate quality based on criteria
    const hasAdequateLength = text.length > minLength;
    const containsLowQualityPhrases = lowQualityPhrases.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );
    const isOverlyGeneric = genericPhrases.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase()) && text.length < 60
    );
    
    return hasAdequateLength && !containsLowQualityPhrases && !isOverlyGeneric;
  }

  // Helper method to estimate token count in a string
  private countTokens(text: string): number {
    if (!text) return 0;
    // Simple approximation: ~4 characters per token on average
    return Math.ceil(text.length * TOKENS_PER_CHARACTER);
  }
  
  // Method to keep message history within token limit
  private truncateHistory(): void {
    let tokenCount = 0;
    const newHistory: ChatMessage[] = [];
    
    // Reverse to keep most recent messages
    for (const msg of [...this.messages].reverse()) {
      const msgTokens = this.countTokens(msg.content);
      tokenCount += msgTokens;
      
      if (tokenCount > MAX_CONTEXT_TOKENS) break;
      newHistory.unshift(msg);
    }
    
    // Update messages with truncated history
    this.messages = newHistory;
  }

  // Estimate the number of tokens in a message based on its content
  private estimateTokens(message: string): number {
    // Simple heuristic: 1 token per 4 characters, including spaces and punctuation
    const tokenCount = Math.ceil(message.length * TOKENS_PER_CHARACTER);
    return Math.max(tokenCount, 1); // Ensure at least 1 token is returned
  }

  clearConversation(): void {
    this.messages = [];
  }

  getHistory(): ChatMessage[] {
    return this.messages;
  }

  // Fallback strategy when circuit breaker is triggered
  private useFallbackStrategy(): { message: string; source: string } {
    // Reset the failure count after a certain period (auto-recovery)
    setTimeout(() => {
      console.log('Circuit breaker reset after cooldown period');
      this.apiFailureCount = 0;
    }, 60000); // 1 minute cooldown
    
    return {
      message: "I'm currently experiencing connectivity issues with my knowledge services. As someone who values reliability and transparency, I want to let you know that I'm operating in a limited capacity right now. Please try again in a minute while the system recovers.",
      source: "Circuit Breaker Fallback"
    };
  }

  // Helper method for Gemini responses
  private async getGeminiResponse(systemMessage: string): Promise<{ text: string; source: string }> {
    if (!this.geminiModel) {
      throw new Error('Gemini model not initialized');
    }
    
    // Convert messages for Gemini format
    const geminiMessages = this.messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    
    // Add system message at the beginning
    geminiMessages.unshift({
      role: 'user',
      parts: [{ text: `SYSTEM: ${systemMessage}` }]
    });
    
    // Configure generation parameters
    const generationConfig = this.getOptimizedGenerationConfig();
    
    const result = await this.geminiModel.generateContent({
      contents: geminiMessages,
      generationConfig
    });
    
    return {
      text: result.response.text(),
      source: `Gemini (${this.currentGeminiModel})`
    };
  }
  
  // Get mock response based on input
  private getMockResponse(message: string): string {
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('superpower')) {
      return "My #1 superpower is definitely deep analytical thinking. I can quickly break down complex problems, see patterns others might miss, and develop systematic approaches to solving challenges. This has helped me tremendously in both my professional work and personal projects.";
    } else if (msgLower.includes('grow')) {
      return "The top 3 areas I'd like to grow in are public speaking, technical leadership, and creative problem-solving. I'm working on speaking more confidently in group settings, guiding technical decisions with more authority, and approaching problems with fresh perspectives.";
    } else if (msgLower.includes('misconception')) {
      return "The biggest misconception my coworkers have about me is that I'm always serious. While I do take my work seriously, I actually have quite a playful side that comes out once people get to know me. I love a good laugh and bringing humor into the workplace when appropriate.";
    } else if (msgLower.includes('boundaries')) {
      return "I push my boundaries by deliberately taking on projects outside my comfort zone. I believe growth happens when we're challenged, so I regularly seek opportunities that require me to learn new skills or work in unfamiliar contexts. It's uncomfortable at first, but the satisfaction of overcoming these challenges is worth it.";
    } else if (msgLower.includes('life story')) {
      return "In a few sentences, my life story involves growing up with a passion for solving puzzles, which led me to study technology and data analysis. I've worked across several industries, each time taking on more challenging problems. Outside of work, I enjoy outdoor activities that clear my mind and spending time with family and friends who keep me grounded.";
    } else {
      return "That's an interesting question! As someone who values continuous growth and analytical thinking, I'm always looking for new challenges to tackle and ways to push my boundaries. Could you ask me something about my superpower, areas for growth, or how I approach challenges?";
    }
  }
}
