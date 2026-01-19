export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface GeminiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // Base64 encoded images
}

/**
 * GeminiService - Integration with Google Gemini API using latest SDK
 * Based on Gemini API Quickstart Guide 2025
 */
export class GeminiService {
  private client: any; // Will be dynamically imported
  private config: GeminiConfig;
  private isInitialized: boolean = false;

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      ...config
    };
  }

  /**
   * Initialize the Gemini client with dynamic import
   */
  async initialize(): Promise<void> {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      this.client = new GoogleGenAI({ 
        apiKey: this.config.apiKey 
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      throw new Error('Gemini API initialization failed. Please check your API key and internet connection.');
    }
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(
    messages: GeminiMessage[],
    options?: Partial<GeminiConfig>
  ): Promise<GeminiResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = options?.model || this.config.model || 'gemini-2.0-flash';
      const temperature = options?.temperature || this.config.temperature;
      const maxTokens = options?.maxTokens || this.config.maxTokens;

      // Convert messages to Gemini format
      const contents = this.formatMessagesForGemini(messages);

      const response = await this.client.models.generateContent({
        model,
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: options?.topP || this.config.topP,
        }
      });

      return {
        text: response.text || '',
        usage: {
          inputTokens: response.usage?.promptTokens || 0,
          outputTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop'
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate content with streaming
   */
  async *generateContentStream(
    messages: GeminiMessage[],
    options?: Partial<GeminiConfig>
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = options?.model || this.config.model || 'gemini-2.0-flash';
      const temperature = options?.temperature || this.config.temperature;
      const maxTokens = options?.maxTokens || this.config.maxTokens;

      const contents = this.formatMessagesForGemini(messages);

      const stream = await this.client.models.generateContentStream({
        model,
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: options?.topP || this.config.topP,
        }
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error(`Gemini streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images using Gemini 2.0 Flash
   */
  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageData: string; text?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = options?.model || 'gemini-2.0-flash';

      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        generationConfig: {
          responseModalities: ['Text', 'Image']
        }
      });

      let imageData = '';
      let text = '';

      for (const part of response.response.candidates[0].content.parts) {
        if (part.text) {
          text = part.text;
        } else if (part.inlineData) {
          imageData = part.inlineData.data;
        }
      }

      return { imageData, text };
    } catch (error) {
      console.error('Gemini image generation error:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Use Gemini with Google Search grounding
   */
  async generateWithSearch(
    query: string,
    options?: Partial<GeminiConfig>
  ): Promise<GeminiResponse & { sources?: string[] }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = options?.model || 'gemini-2.0-flash';

      const response = await this.client.models.generateContent({
        model,
        contents: query,
        tools: [{
          googleSearchRetrieval: {}
        }],
        generationConfig: {
          temperature: options?.temperature || this.config.temperature,
          maxOutputTokens: options?.maxTokens || this.config.maxTokens,
        }
      });

      // Extract sources from grounding metadata if available
      const sources = response.groundingMetadata?.webSearchQueries || [];

      return {
        text: response.text || '',
        usage: {
          inputTokens: response.usage?.promptTokens || 0,
          outputTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        sources
      };
    } catch (error) {
      console.error('Gemini search grounding error:', error);
      throw new Error(`Search grounding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute code using Gemini's code execution capability
   */
  async executeCode(
    code: string,
    language: string = 'python',
    options?: Partial<GeminiConfig>
  ): Promise<GeminiResponse & { executionResult?: any }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = 'gemini-2.0-flash'; // Using available 2.0 Flash model

      const response = await this.client.models.generateContent({
        model,
        contents: `Execute this ${language} code and provide the results:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        tools: [{
          codeExecution: {}
        }],
        generationConfig: {
          temperature: options?.temperature || 0.1, // Lower temperature for code
          maxOutputTokens: options?.maxTokens || this.config.maxTokens,
        }
      });

      return {
        text: response.text || '',
        usage: {
          inputTokens: response.usage?.promptTokens || 0,
          outputTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        executionResult: response.executionResult
      };
    } catch (error) {
      console.error('Gemini code execution error:', error);
      throw new Error(`Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Simple test call
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Hello',
        generationConfig: {
          maxOutputTokens: 10
        }
      });

      return !!response.text;
    } catch (error) {
      console.error('Gemini availability check failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Return the latest models based on 2025 documentation
      return [
        'gemini-2.0-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  /**
   * Format messages for Gemini API
   */
  private formatMessagesForGemini(messages: GeminiMessage[]): any[] {
    return messages.map(message => {
      if (message.role === 'system') {
        // System messages should be handled as system instructions
        return null;
      }

      const parts: any[] = [{ text: message.content }];

      // Add images if present
      if (message.images && message.images.length > 0) {
        message.images.forEach(imageData => {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg', // Default, could be detected
              data: imageData
            }
          });
        });
      }

      return {
        role: message.role === 'assistant' ? 'model' : 'user',
        parts
      };
    }).filter(Boolean);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default GeminiService; 