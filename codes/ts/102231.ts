import { GoogleGenerativeAI } from '@google/generative-ai';
import { Browser, BrowserConfig } from '../browser/Browser.js';
import { DomTree, PageStructure } from '../dom/DomTree.js';
import { z } from 'zod';

// Action schemas for structured output
const ActionSchema = z.object({
  type: z.enum(['navigate', 'click', 'type', 'scroll', 'wait', 'extract', 'complete']),
  selector: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  nextStep: z.string().optional()
});

const TaskProgressSchema = z.object({
  completed: z.boolean(),
  progress: z.number().min(0).max(1),
  currentStep: z.string(),
  nextActions: z.array(ActionSchema),
  extractedData: z.record(z.any()).optional()
});

export type Action = z.infer<typeof ActionSchema>;
export type TaskProgress = z.infer<typeof TaskProgressSchema>;

export interface AgentConfig {
  browserConfig?: BrowserConfig;
  maxSteps?: number;
  stepDelay?: number;
  debugMode?: boolean;
  screenshotOnError?: boolean;
}

/**
 * AI Agent - Intelligent automation agent powered by Gemini
 */
export class Agent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private browser: Browser;
  private domTree: DomTree;
  private config: AgentConfig;
  private currentTask: string = '';
  private stepCount: number = 0;
  private history: Array<{ step: number; action: Action; result: string; pageUrl: string }> = [];

  constructor(config: AgentConfig = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    this.config = {
      maxSteps: 20,
      stepDelay: 1000,
      debugMode: false,
      screenshotOnError: true,
      ...config
    };

    this.browser = new Browser(this.config.browserConfig);
    this.domTree = new DomTree();
  }

  /**
   * Execute a natural language task
   */
  async executeTask(task: string): Promise<TaskProgress> {
    this.currentTask = task;
    this.stepCount = 0;
    this.history = [];

    try {
      // Start browser
      await this.browser.launch();
      
      if (this.config.debugMode) {
        console.log(`🤖 Starting task: ${task}`);
      }

      // Get initial action from AI
      let progress = await this.planNextAction('', task);
      
      while (!progress.completed && this.stepCount < (this.config.maxSteps || 20)) {
        const action = progress.nextActions[0];
        if (!action) break;

        // Execute the action
        const result = await this.executeAction(action);
        
        // Get page state after action
        const pageState = await this.getCurrentPageState();
        
        // Add to history
        this.history.push({
          step: this.stepCount,
          action,
          result,
          pageUrl: await this.browser.getCurrentUrl()
        });

        if (this.config.debugMode) {
          console.log(`Step ${this.stepCount}: ${action.type} - ${action.reasoning}`);
        }

        // Plan next action based on results
        progress = await this.planNextAction(pageState, task, result);
        
        this.stepCount++;
        
        // Add delay between steps
        if (this.config.stepDelay) {
          await new Promise(resolve => setTimeout(resolve, this.config.stepDelay));
        }
      }

      return progress;

    } catch (error) {
      if (this.config.screenshotOnError) {
        await this.browser.screenshot({ path: `./error-${Date.now()}.png` });
      }
      throw error;
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Plan the next action using AI
   */
  private async planNextAction(
    pageState: string, 
    originalTask: string, 
    lastResult?: string
  ): Promise<TaskProgress> {
    const prompt = this.buildPlanningPrompt(pageState, originalTask, lastResult);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse the structured response
      const parsed = this.parseAIResponse(response);
      
      return TaskProgressSchema.parse(parsed);
    } catch (error) {
      if (this.config.debugMode) {
        console.error('AI planning error:', error);
      }
      
      // Fallback response
      return {
        completed: true,
        progress: 1,
        currentStep: 'Error occurred',
        nextActions: [],
        extractedData: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: Action): Promise<string> {
    try {
      switch (action.type) {
        case 'navigate':
          if (!action.url) throw new Error('URL required for navigate action');
          await this.browser.goto(action.url);
          return `Navigated to ${action.url}`;

        case 'click':
          if (!action.selector) throw new Error('Selector required for click action');
          await this.browser.click(action.selector);
          return `Clicked element: ${action.selector}`;

        case 'type':
          if (!action.selector || !action.text) {
            throw new Error('Selector and text required for type action');
          }
          await this.browser.type(action.selector, action.text);
          return `Typed "${action.text}" into ${action.selector}`;

        case 'scroll':
          if (action.selector) {
            await this.browser.scroll({ selector: action.selector });
            return `Scrolled to element: ${action.selector}`;
          } else {
            await this.browser.scroll({ y: 500 });
            return 'Scrolled down page';
          }

        case 'wait':
          const waitTime = parseInt(action.text || '2000');
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return `Waited ${waitTime}ms`;

        case 'extract':
          const extractedData = await this.extractData(action.text || '');
          return `Extracted data: ${JSON.stringify(extractedData)}`;

        case 'complete':
          return 'Task completed successfully';

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (this.config.debugMode) {
        console.error(`Action failed:`, error);
      }
      return `Action failed: ${errorMsg}`;
    }
  }

  /**
   * Get current page state for AI analysis
   */
  private async getCurrentPageState(): Promise<string> {
    const html = await this.browser.getContent();
    const url = await this.browser.getCurrentUrl();
    
    this.domTree.loadHtml(html, url);
    const structure = this.domTree.getPageStructure();
    
    return this.formatPageStateForAI(structure);
  }

  /**
   * Format page structure for AI consumption
   */
  private formatPageStateForAI(structure: PageStructure): string {
    let state = `=== CURRENT PAGE STATE ===\n`;
    state += `URL: ${structure.url}\n`;
    state += `Title: ${structure.title}\n\n`;

    if (structure.headings.length > 0) {
      state += `HEADINGS:\n`;
      structure.headings.slice(0, 5).forEach(h => {
        state += `${' '.repeat((h.level - 1) * 2)}${h.text} (${h.selector})\n`;
      });
      state += '\n';
    }

    if (structure.interactiveElements.length > 0) {
      state += `INTERACTIVE ELEMENTS:\n`;
      structure.interactiveElements.slice(0, 15).forEach(el => {
        state += `- ${el.type.toUpperCase()}: ${el.description} (${el.selector})\n`;
        if (el.href) state += `  URL: ${el.href}\n`;
      });
      state += '\n';
    }

    if (structure.forms.length > 0) {
      state += `FORMS:\n`;
      structure.forms.forEach((form, idx) => {
        state += `Form ${idx + 1} (${form.selector}):\n`;
        form.fields.slice(0, 5).forEach(field => {
          state += `  - ${field.description} (${field.selector})\n`;
        });
        if (form.submitButton) {
          state += `  - Submit: ${form.submitButton.description} (${form.submitButton.selector})\n`;
        }
      });
      state += '\n';
    }

    if (structure.mainContent) {
      state += `MAIN CONTENT (first 800 chars):\n`;
      state += structure.mainContent.substring(0, 800) + '\n\n';
    }

    return state;
  }

  /**
   * Build the AI planning prompt
   */
  private buildPlanningPrompt(pageState: string, task: string, lastResult?: string): string {
    let prompt = `You are an intelligent web automation agent. Your task is to help complete the following objective using browser automation:

TASK: ${task}

`;

    if (this.history.length > 0) {
      prompt += `PREVIOUS ACTIONS:\n`;
      this.history.slice(-3).forEach(h => {
        prompt += `Step ${h.step}: ${h.action.type} - ${h.action.reasoning} => ${h.result}\n`;
      });
      prompt += '\n';
    }

    if (lastResult) {
      prompt += `LAST ACTION RESULT: ${lastResult}\n\n`;
    }

    prompt += pageState;

    prompt += `
INSTRUCTIONS:
1. Analyze the current page state and the task objective
2. Determine if the task is complete or what the next action should be
3. Choose the most appropriate action type: navigate, click, type, scroll, wait, extract, or complete
4. Be specific with selectors and reasoning
5. Consider the user's intent and be efficient

Respond ONLY with a valid JSON object in this exact format:
{
  "completed": boolean,
  "progress": number (0-1),
  "currentStep": "description of current step",
  "nextActions": [
    {
      "type": "action_type",
      "selector": "css_selector_if_needed",
      "text": "text_to_type_or_extract_if_needed",
      "url": "url_if_navigating",
      "reasoning": "why this action makes sense",
      "confidence": number (0-1),
      "nextStep": "what happens after this action"
    }
  ],
  "extractedData": {} // optional extracted information
}

Only include the JSON response, no other text.`;

    return prompt;
  }

  /**
   * Parse AI response and handle potential formatting issues
   */
  private parseAIResponse(response: string): any {
    try {
      // Clean the response
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      if (this.config.debugMode) {
        console.error('Failed to parse AI response:', response);
      }
      
      // Fallback response
      return {
        completed: false,
        progress: 0,
        currentStep: 'Failed to parse AI response',
        nextActions: [{
          type: 'wait',
          text: '2000',
          reasoning: 'Waiting due to parsing error',
          confidence: 0.1
        }]
      };
    }
  }

  /**
   * Extract specific data from the current page
   */
  private async extractData(query: string): Promise<any> {
    const structure = this.domTree.getPageStructure();
    
    // Simple extraction based on query
    const extracted: any = {};
    
    if (query.toLowerCase().includes('title')) {
      extracted.title = structure.title;
    }
    
    if (query.toLowerCase().includes('links')) {
      extracted.links = structure.interactiveElements
        .filter(el => el.type === 'link')
        .map(el => ({ text: el.text, href: el.href }));
    }
    
    if (query.toLowerCase().includes('text') || query.toLowerCase().includes('content')) {
      extracted.content = structure.mainContent;
    }
    
    if (query.toLowerCase().includes('headings')) {
      extracted.headings = structure.headings;
    }

    return extracted;
  }

  /**
   * Get task execution history
   */
  getHistory(): Array<{ step: number; action: Action; result: string; pageUrl: string }> {
    return [...this.history];
  }

  /**
   * Get current task details
   */
  getCurrentTask(): { task: string; stepCount: number; maxSteps: number } {
    return {
      task: this.currentTask,
      stepCount: this.stepCount,
      maxSteps: this.config.maxSteps || 20
    };
  }
} 