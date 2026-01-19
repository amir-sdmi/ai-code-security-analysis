import { Browser, chromium, Page } from 'playwright';
import { BaseAgent } from './baseAgent';
import { AgentResponse, Message } from '../interfaces/agent.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// List of blocked domains for security
const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'internal.',
  'private.',
  'admin.',
  '.local',
];

export class WebAgent extends BaseAgent {
  private browser: Browser | null = null;
  private activePage: Page | null = null;
  private screenshotDir: string;
  
  constructor(screenshotDir: string = path.join(__dirname, '../../screenshots')) {
    const systemPrompt = `You are a Web Browsing Agent for Morpheus AI.
Your role is to browse the internet, retrieve information, and summarize content for the user.
- You should only visit websites that are safe and appropriate.
- You should provide accurate summaries of web content.
- You can take screenshots of websites for visual reference.
- You must respect website terms of service and rate limits.
- You should extract key information from pages to answer user queries effectively.`;
    
    super('Web Agent', 'Researches and summarizes information using web browsing', systemPrompt);
    this.screenshotDir = screenshotDir;
  }
  
  async initialize(): Promise<boolean> {
    await super.initialize();
    
    try {
      // Create screenshot directory if it doesn't exist
      if (!fs.existsSync(this.screenshotDir)) {
        fs.mkdirSync(this.screenshotDir, { recursive: true });
      }
      
      // Close any existing browser instance
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      // Launch browser in headless mode with additional options for stability
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Verify browser was launched
      if (!this.browser) {
        throw new Error('Browser failed to initialize');
      }
      
      // Test creating a page to ensure browser is working
      const testPage = await this.browser.newPage();
      await testPage.close();
      
      console.log('Web Agent initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Web Agent:', error);
      this.browser = null; // Reset the browser if initialization failed
      return false;
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.activePage) {
      await this.activePage.close();
      this.activePage = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async processMessage(message: string, history: Message[]): Promise<AgentResponse> {
    // Extract URLs or browsing commands from the message
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    
    if (urlMatch) {
      return this.browseUrl(urlMatch[0]);
    }
    
    if (message.toLowerCase().includes('screenshot')) {
      return this.takeScreenshot();
    }
    
    if (message.toLowerCase().includes('extract') || message.toLowerCase().includes('scrape')) {
      return this.extractContent();
    }
    
    // Use Gemini to interpret the request
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      // Create a chat session with system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'system',
            parts: [{ text: this.systemPrompt }]
          }
        ]
      });

      // Format history for Gemini
      const historyMessages = this.formatMessagesForGemini(history);
      
      // Send the current message
      const result = await chat.sendMessage(message);
      const response = result.response.text();
      
      // Check if response contains a URL
      const responseUrlMatch = response.match(/https?:\/\/[^\s]+/);
      if (responseUrlMatch) {
        await this.browseUrl(responseUrlMatch[0]);
        return this.createResponse(
          `${response}\n\nI've navigated to the suggested URL: ${responseUrlMatch[0]}`
        );
      }
      
      return this.createResponse(response);
    } catch (error: any) {
      return this.createResponse(
        `I encountered an error processing your request: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  async browseUrl(url: string): Promise<AgentResponse> {
    // Check if URL is blocked
    if (this.isUrlBlocked(url)) {
      return this.createResponse(
        `I cannot access this URL as it appears to be an internal or potentially unsafe resource.`,
        false,
        'URL blocked for security reasons'
      );
    }
    
    try {
      // Always ensure browser is initialized
      if (!this.browser) {
        console.log('Browser not initialized, attempting to launch...');
        // Launch browser directly instead of calling initialize()
        try {
          this.browser = await chromium.launch({
            headless: true
          });
          console.log('Browser launched successfully');
        } catch (browserError: any) {
          console.error('Failed to launch browser:', browserError);
          return this.createResponse(
            `Error initializing browser: ${browserError.message}`,
            false,
            browserError.message
          );
        }
      }
      
      // Verify browser is available before continuing
      if (!this.browser) {
        return this.createResponse(
          'Failed to initialize browser after retry.',
          false,
          'Browser initialization failed'
        );
      }
      
      // Close existing page if there is one
      if (this.activePage) {
        await this.activePage.close();
        this.activePage = null;
      }
      
      // Create a new page with better error handling
      try {
        this.activePage = await this.browser.newPage();
      } catch (pageError: any) {
        console.error('Failed to create new page:', pageError);
        return this.createResponse(
          `Error creating browser page: ${pageError.message}`,
          false,
          pageError.message
        );
      }
      
      // Navigate to the URL with timeout
      await this.activePage.goto(url, { 
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });
      
      // Take a screenshot
      const screenshotPath = await this.saveScreenshot();
      
      // Get the page title
      const title = await this.activePage.title();
      
      // Extract main content
      const content = await this.extractMainContent();
      
      return this.createResponse(
        `Successfully navigated to ${url}\nTitle: ${title}\n\nPage Content Summary:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`,
        true,
        undefined,
        { 
          url,
          title,
          screenshotPath,
          contentLength: content.length
        }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error navigating to ${url}: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  async takeScreenshot(): Promise<AgentResponse> {
    if (!this.activePage) {
      return this.createResponse(
        'No active page to screenshot. Please navigate to a URL first.',
        false,
        'No active page'
      );
    }
    
    try {
      const screenshotPath = await this.saveScreenshot();
      return this.createResponse(
        `Screenshot taken and saved to ${screenshotPath}`,
        true,
        undefined,
        { screenshotPath }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error taking screenshot: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  async extractContent(): Promise<AgentResponse> {
    if (!this.activePage) {
      return this.createResponse(
        'No active page to extract content from. Please navigate to a URL first.',
        false,
        'No active page'
      );
    }
    
    try {
      const content = await this.extractMainContent();
      const title = await this.activePage.title();
      const url = this.activePage.url();
      
      return this.createResponse(
        `Content extracted from ${url}\nTitle: ${title}\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`,
        true,
        undefined,
        { 
          url,
          title,
          content,
          contentLength: content.length
        }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error extracting content: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  async searchWeb(query: string): Promise<AgentResponse> {
    // Simple search implementation using Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return this.browseUrl(searchUrl);
  }
  
  private async saveScreenshot(): Promise<string> {
    if (!this.activePage) throw new Error('No active page');
    
    // Generate a unique filename based on timestamp and URL
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlHash = crypto.createHash('md5').update(this.activePage.url()).digest('hex').substring(0, 8);
    const filename = `screenshot-${timestamp}-${urlHash}.png`;
    const filePath = path.join(this.screenshotDir, filename);
    
    // Take screenshot
    await this.activePage.screenshot({ path: filePath, fullPage: false });
    
    return filePath;
  }
  
  private async extractMainContent(): Promise<string> {
    if (!this.activePage) throw new Error('No active page');
    
    // Extract the main content of the page
    // This is a simple implementation; could be enhanced with more sophisticated extraction logic
    const content = await this.activePage.evaluate(() => {
      // Try to find main content
      const selectors = [
        'main',
        'article',
        '#content',
        '.content',
        '#main',
        '.main',
        '.post-content',
        '.article-content'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent || '';
        }
      }
      
      // Fallback to body text but remove scripts, styles, etc.
      return document.body.innerText || '';
    });
    
    return content.trim();
  }
  
  private isUrlBlocked(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return BLOCKED_DOMAINS.some(domain => {
        if (domain.startsWith('.')) {
          // Check if the hostname ends with this domain (e.g., .local)
          return hostname.endsWith(domain);
        } else {
          // Check if the domain is contained within the hostname
          return hostname.includes(domain);
        }
      });
    } catch (error) {
      // If URL parsing fails, block it to be safe
      return true;
    }
  }
} 