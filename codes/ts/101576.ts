/**
 * ChatGPT Service
 * Provides an interface for interacting with ChatGPT through Playwright
 */

import { PlaywrightClient } from '../core/playwright-client';
import { TokenManager, createTokenManager } from '../core/token-manager';
import { apiCacheService } from './cache-service';

// Interface for ChatGPT request options
interface ChatGPTRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  stream?: boolean;
  cacheKey?: string;
}

// Interface for ChatGPT response
interface ChatGPTResponse {
  id: string;
  text: string;
  model: string;
  finish_reason: string;
  created: number;
}

/**
 * Service for interacting with ChatGPT
 */
export class ChatGPTService {
  private playwrightClient: PlaywrightClient;
  private tokenManager: TokenManager;
  private initialized: boolean = false;
  
  constructor(tokenManager?: TokenManager) {
    this.tokenManager = tokenManager || createTokenManager();
    this.playwrightClient = new PlaywrightClient(this.tokenManager);
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      await this.playwrightClient.initialize();
      this.initialized = true;
      console.log('ChatGPT service initialized');
    } catch (error) {
      console.error('Failed to initialize ChatGPT service:', error);
      throw new Error(`Failed to initialize ChatGPT service: ${error}`);
    }
  }
  
  /**
   * Check if authenticated with ChatGPT
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have a valid token
      const isTokenValid = await this.tokenManager.isTokenValid();
      
      if (!isTokenValid) {
        console.log('No valid token found');
        return false;
      }
      
      // Initialize if needed
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Verify by checking login status
      return await this.playwrightClient.isLoggedIn();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
  
  /**
   * Send a prompt to ChatGPT with caching
   */
  async sendPrompt(options: ChatGPTRequestOptions): Promise<ChatGPTResponse> {
    // Check cache first
    if (options.cacheKey) {
      const cachedResponse = await apiCacheService.get(options.cacheKey);
      if (cachedResponse) {
        console.log('Using cached response for:', options.cacheKey);
        return JSON.parse(cachedResponse as string);
      }
    }
    
    try {
      // Initialize if needed
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if authenticated
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Not authenticated with ChatGPT');
      }
      
      // Send the prompt
      const response = await this.playwrightClient.sendPrompt({
        prompt: options.prompt,
        model: options.model,
        temperature: options.temperature,
        stream: options.stream,
      });
      
      // Cache the response
      if (options.cacheKey) {
        await apiCacheService.set(
          options.cacheKey,
          JSON.stringify(response),
          1800 // 30 minutes cache
        );
      }
      
      return response;
    } catch (error) {
      console.error('Error sending prompt to ChatGPT:', error);
      throw new Error(`Failed to send prompt: ${error}`);
    }
  }
  
  /**
   * Close the service
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.playwrightClient.close();
      this.initialized = false;
      console.log('ChatGPT service closed');
    }
  }
}

/**
 * Create a ChatGPT service instance
 */
export function createChatGPTService(tokenManager?: TokenManager): ChatGPTService {
  return new ChatGPTService(tokenManager);
}

// Singleton instance
export const chatGPTService = new ChatGPTService();