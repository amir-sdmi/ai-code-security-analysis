import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export class AIService {
  constructor() {
    this.models = {
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gemini-pro': 'gemini-pro',
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-2.0-flash': 'gemini-2.0-flash'
    };
  }

  // Generate embeddings using OpenAI only (to maintain 1536 dimensions)
  // async generateEmbeddings(text) {
  //   try {
  //     console.log("inside generateEmbeddings function");
  //     // Only use OpenAI for embeddings to ensure consistent 1536 dimensions
  //     const response = await openai.embeddings.create({
  //       model: 'text-embedding-3-small',
  //       input: text,
  //     });

  //     return response.data[0].embedding;
  //   } catch (error) {
  //     logger.error('OpenAI embeddings failed:', error.message);

  //     // Always use simple embedding fallback for any OpenAI error
  //     logger.warn('Using simple embedding fallback due to OpenAI failure');
  //     return this.generateSimpleEmbedding(text);
  //   }
  // }

  async generateEmbeddings(text) {
    try {
      console.log("inside generateEmbeddings function");
      if (!text || typeof text !== 'string' || text.length === 0) {
        throw new Error('Invalid input: text must be a non-empty string');
      }
      if (text.length > 8192) {
        console.warn('Text input truncated to 8192 characters for embedding');
        text = text.slice(0, 8192);
      }

      // const maxRetries = 3;
      // let lastError = null;

      // for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        console.log('OpenAI embedding generated successfully');
        return response.data[0].embedding;
      } catch (error) {
        // lastError = error;
        // logger.warn(`OpenAI attempt ${attempt} failed:`, {
        //   message: error.message,
        //   code: error.code,
        //   status: error.status,
        // });
        //   if (error.code === 'invalid_api_key' || error.status === 401) {
        //     break;
        //   }
        //   if (attempt < maxRetries) {
        //     const delay = 1000 * Math.pow(2, attempt - 1);
        //     logger.info(`Retrying OpenAI after ${delay}ms`);
        //     await new Promise(resolve => setTimeout(resolve, delay));
        //   }
        // }
        // }

        logger.warn('OpenAI failed, attempting Gemini embedding');
        try {
          const model = genAI.getGenerativeModel({ model: 'embedding-001' });
          const result = await model.embedContent(text);
          console.log('Gemini embedding generated successfully');
          // return result.embedding.values;
          const geminiEmbedding = result.embedding.values;
          const paddedEmbedding = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(geminiEmbedding.length, 1536); i++) {
            paddedEmbedding[i] = geminiEmbedding[i];
          }
          return paddedEmbedding;
        } catch (geminiError) {
          logger.error('Gemini embedding failed:', {
            message: geminiError.message,
            details: geminiError,
          });
          logger.warn('Using simple embedding fallback due to OpenAI and Gemini failure');
          return this.generateSimpleEmbedding(text);
        }
      }
    } catch (error) {
      logger.error('Unexpected error in generateEmbeddings:', {
        message: error.message,
        stack: error.stack,
      });
      logger.warn('Using simple embedding fallback due to unexpected error');
      return this.generateSimpleEmbedding(text);
    }
  }

  // Generate simple hash-based embedding with 1536 dimensions to match Astra DB
  generateSimpleEmbedding(text) {
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 1536] += charCode;
    }
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  // Generate chat response using specified model
  async generateResponse(model, messages, context = '', language = 'en') {
    try {
      const systemPrompt = this.buildSystemPrompt(context, language);
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      if (model.startsWith('gpt')) {
        return await this.generateOpenAIResponse(model, fullMessages);
      } else if (model.startsWith('gemini')) {
        return await this.generateGeminiResponse(model, fullMessages);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      logger.error('Error generating AI response:', error);

      // Fallback to Gemini 1.5 Flash if other models fail
      if (!model.startsWith('gemini')) {
        logger.info('Falling back to Gemini 1.5 Flash');
        try {
          const systemPrompt = this.buildSystemPrompt(context, language);
          const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
          ];
          return await this.generateGeminiResponse('gemini-1.5-flash', fullMessages);
        } catch (fallbackError) {
          logger.error('Fallback to Gemini also failed:', fallbackError);
          throw new Error('All AI services failed');
        }
      }

      throw new Error('Failed to generate response');
    }
  }

  // Generate response using OpenAI
  async generateOpenAIResponse(model, messages) {
    try {
      const response = await openai.chat.completions.create({
        model: this.models[model],
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      if (error.code === 'insufficient_quota') {
        logger.warn('OpenAI quota exceeded, falling back to Gemini');
        throw new Error('QUOTA_EXCEEDED');
      }
      throw error;
    }
  }

  // Generate response using Gemini
  async generateGeminiResponse(modelName, messages) {
    try {
      const geminiModel = this.models[modelName] || 'gemini-2.0-flash';
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        systemInstruction: this._extractSystemInstruction(messages),
      });

      const { history: userHistory, lastUserMessage } = this._convertMessagesToGeminiFormat(messages);
      const context = this._extractSystemInstruction(messages);
      const fullHistory = [
        {
          role: 'user',
          parts: [{ text: context }]
        },
        ...userHistory
      ];

      const chat = model.startChat({
        history: fullHistory
      });

      const result = await chat.sendMessage(lastUserMessage);
      const response = await result.response;

      return {
        content: response.text(),
        usage: { total_tokens: 0 }
      };
    } catch (error) {
      logger.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }


  // Convert OpenAI-style messages to Gemini format
  _convertMessagesToGeminiFormat(messages) {
    const history = [];
    let lastUserMessage = '';

    // Skip system message as it's handled separately
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    for (let i = 0; i < conversationMessages.length - 1; i += 2) {
      const userMsg = conversationMessages[i];
      const assistantMsg = conversationMessages[i + 1];

      if (userMsg && userMsg.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: userMsg.content }]
        });
      }

      if (assistantMsg && assistantMsg.role === 'assistant') {
        history.push({
          role: 'model',
          parts: [{ text: assistantMsg.content }]
        });
      }
    }

    // Get the last user message
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      lastUserMessage = lastMessage.content;
    }

    return { history, lastUserMessage };
  }

  // Extract system instruction from messages
  _extractSystemInstruction(messages) {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage ? systemMessage.content : '';
  }

  // Build system prompt with context and language
  buildSystemPrompt(context, language) {
    const languageInstructions = {
      'en': 'Respond in English.',
      'es': 'Responde en español.',
      'fr': 'Répondez en français.',
      'de': 'Antworten Sie auf Deutsch.',
      'hi': 'हिंदी में उत्तर दें।',
      'ne': 'नेपालीमा जवाफ दिनुहोस्।',
      'zh': '用中文回答。',
      'ja': '日本語で答えてください。'
    };

    const basePrompt = `You are a helpful AI assistant for a business. You should provide accurate, helpful, and professional responses based on the company's documentation and knowledge base.

${languageInstructions[language] || languageInstructions['en']}

If you have relevant context from the company's documents, use it to provide accurate answers. If you don't have specific information, politely say so and offer to help in other ways.

Keep responses concise but informative. Be friendly and professional.`;

    if (context) {
      return `${basePrompt}

Relevant company information:
${context}

Use this information to answer the user's question accurately.`;
    }

    return basePrompt;
  }

  // Stream response for real-time chat
  async generateStreamResponse(model, messages, context = '', language = 'en') {
    try {
      const systemPrompt = this.buildSystemPrompt(context, language);
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      if (model.startsWith('gpt')) {
        try {
          return await openai.chat.completions.create({
            model: this.models[model],
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          });
        } catch (error) {
          if (error.code === 'insufficient_quota') {
            logger.warn('OpenAI quota exceeded, falling back to Gemini streaming');
            return await this.generateGeminiStreamResponse('gemini-1.5-flash', fullMessages);
          }
          throw error;
        }
      } else if (model.startsWith('gemini')) {
        return await this.generateGeminiStreamResponse(model, fullMessages);
      } else {
        // For non-streaming models, return regular response wrapped as async iterable
        const response = await this.generateResponse(model, messages, context, language);
        return this.createAsyncIterable(response.content);
      }
    } catch (error) {
      logger.error('Error generating stream response:', error);

      // Final fallback to Gemini 1.5 Flash
      try {
        logger.info('Falling back to Gemini 1.5 Flash streaming');
        const systemPrompt = this.buildSystemPrompt(context, language);
        const fullMessages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ];
        return await this.generateGeminiStreamResponse('gemini-1.5-flash', fullMessages);
      } catch (fallbackError) {
        logger.error('All streaming methods failed:', fallbackError);
        throw new Error('Failed to generate stream response');
      }
    }
  }

  // Generate streaming response using Gemini
  async generateGeminiStreamResponse(modelName, messages) {
    try {
      const geminiModel = this.models[modelName] || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        systemInstruction: this._extractSystemInstruction(messages)
      });

      const { history, lastUserMessage } = this._convertMessagesToGeminiFormat(messages);

      const chat = model.startChat({
        history: history
      });

      const result = await chat.sendMessageStream(lastUserMessage);

      // Convert Gemini stream to OpenAI-compatible format
      return this.convertGeminiStreamToOpenAI(result.stream);
    } catch (error) {
      logger.error('Gemini streaming error:', error);
      throw new Error(`Gemini streaming failed: ${error.message}`);
    }
  }

  // Convert Gemini stream to OpenAI-compatible format
  async* convertGeminiStreamToOpenAI(geminiStream) {
    try {
      for await (const chunk of geminiStream) {
        const text = chunk.text();
        if (text) {
          yield {
            choices: [{
              delta: {
                content: text
              }
            }]
          };
        }
      }
    } catch (error) {
      logger.error('Error converting Gemini stream:', error);
      throw error;
    }
  }

  // Create async iterable from string content
  async* createAsyncIterable(content) {
    yield {
      choices: [{
        delta: {
          content: content
        }
      }]
    };
  }

  // Translate text to specified language
  async translateText(text, targetLanguage) {
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Translate the following text to ${targetLanguage}. Only return the translation, no additional text.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.warn('OpenAI translation failed, falling back to Gemini:', error.message);

      try {
        // Fallback to Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Translate the following text to ${targetLanguage}. Only return the translation, no additional text.\n\nText: ${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (geminiError) {
        logger.error('Both translation services failed:', geminiError);
        throw new Error('Failed to translate text');
      }
    }
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the following text. Return only the language code (e.g., en, es, fr, de, hi, ne, zh, ja).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      logger.warn('OpenAI language detection failed, falling back to Gemini:', error.message);

      try {
        // Fallback to Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Detect the language of the following text. Return only the language code (e.g., en, es, fr, de, hi, ne, zh, ja).\n\nText: ${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim().toLowerCase();
      } catch (geminiError) {
        logger.error('Both language detection services failed:', geminiError);
        return 'en'; // Default to English
      }
    }
  }
}

export const aiService = new AIService();