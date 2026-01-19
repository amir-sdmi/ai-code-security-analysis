interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found - AI enhancement will be disabled');
      this.apiKey = '';
    }
  }

  async generateEnhancedPrompt(
    originalInput: string,
    frameworks: string[],
    parameters: {
      audienceLevel: string;
      tone: string;
      outputFormat: string;
      wordCount: number;
    },
    useCase: string,
    model: string = 'deepseek/deepseek-r1' // Updated to use DeepSeek R1 as default
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required for AI enhancement');
    }
    const systemPrompt = this.createSystemPrompt(frameworks, parameters, useCase);
    const userPrompt = this.createUserPrompt(originalInput, parameters);

    const request: OpenRouterRequest = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PromptForge'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText || 'Unknown error'}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`Failed to generate enhanced prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSystemPrompt(frameworks: string[], parameters: any, useCase: string): string {
    return `You are an expert prompt engineering assistant specializing in applying advanced frameworks to transform basic prompts into highly effective, structured prompts.

Your expertise includes:
- TCREI Framework (Task, Context, Resources, Evaluate, Iterate)
- RSTI Framework (Revisit, Separate, Try different phrasing, Introduce constraints)
- TFCDC Framework (Thinking, Frameworks, Checkpoints, Debugging, Context)

TASK: Transform the user's basic prompt into a comprehensive, highly effective prompt that incorporates the detected frameworks: ${frameworks.join(', ')}.

GUIDELINES:
- Use Case: ${useCase}
- Audience Level: ${parameters.audienceLevel}
- Tone: ${parameters.tone}
- Output Format: ${parameters.outputFormat}
- Target Length: ${parameters.wordCount} words

FRAMEWORK APPLICATION:
${frameworks.includes('TCREI') ? `
- TCREI: Structure the prompt with clear Task definition, Context setting, Resource requirements, Evaluation criteria, and Iteration guidelines.
` : ''}
${frameworks.includes('RSTI') ? `
- RSTI: Apply micro-tuning with proven patterns, break complex instructions into clear segments, use precise phrasing, and introduce specific constraints.
` : ''}
${frameworks.includes('TFCDC') ? `
- TFCDC: Include systematic thinking approach, framework selection rationale, checkpoint validation, debugging instructions, and comprehensive documentation.
` : ''}

OUTPUT REQUIREMENTS:
1. Create a dramatically enhanced version that's 3-5x more detailed and specific
2. Include clear structure with sections and subsections
3. Add specific examples, constraints, and success criteria
4. Maintain the requested tone and format
5. Ensure the output guides toward ${parameters.outputFormat} structure
6. Include quality markers and evaluation criteria

Transform the basic prompt into a professional-grade, comprehensive prompt that would produce significantly better AI responses.`;
  }

  private createUserPrompt(originalInput: string, parameters: any): string {
    return `Transform this basic prompt into a comprehensive, professional-grade prompt:

"${originalInput}"

Target specifications:
- Audience: ${parameters.audienceLevel} level
- Tone: ${parameters.tone}
- Format: ${parameters.outputFormat}
- Length: Approximately ${parameters.wordCount} words

Provide only the enhanced prompt without any meta-commentary or explanations.`;
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      // Updated fallback models list with DeepSeek R1 first
      return [
        'deepseek/deepseek-r1',
        'deepseek/deepseek-r1-distill-llama-70b',
        'openai/gpt-4o-mini',
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-haiku',
        'google/gemini-pro'
      ];
    }
  }
}