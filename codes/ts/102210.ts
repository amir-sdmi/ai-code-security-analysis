import { ProjectInput } from './types';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
  strengths: string[];
  bestFor: string[];
}

export interface PromptMetadata {
  model: string;
  tokensUsed: number;
  cost: number;
  optimizationLevel: string;
  timestamp?: string;
}

export const AI_MODELS: Record<string, AIModel> = {
  'deepseek-chat': {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Advanced reasoning and code generation with free access',
    maxTokens: 8192,
    costPer1kTokens: 0,
    strengths: ['Code generation', 'Technical documentation', 'Complex reasoning', 'Mathematical thinking'],
    bestFor: ['Development projects', 'Technical specifications', 'API documentation', 'Algorithm design']
  },
  'claude-sonnet': {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Excellent for creative and analytical tasks with structured thinking',
    maxTokens: 8192,
    costPer1kTokens: 3.0,
    strengths: ['Creative writing', 'Analysis', 'Structured thinking', 'User experience design'],
    bestFor: ['Content creation', 'Business planning', 'User experience', 'Complex project planning']
  },
  'gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'ChatGPT (GPT-4o)',
    provider: 'OpenAI',
    description: 'Versatile multimodal AI with strong general capabilities',
    maxTokens: 8192,
    costPer1kTokens: 5.0,
    strengths: ['General intelligence', 'Multimodal', 'Versatile', 'Creative solutions'],
    bestFor: ['General projects', 'Multimodal apps', 'Versatile solutions', 'Creative development']
  },
  'gemini-pro': {
    id: 'google/gemini-pro',
    name: 'Google Gemini Pro',
    provider: 'Google',
    description: 'Large context window and multimodal capabilities',
    maxTokens: 32768,
    costPer1kTokens: 2.5,
    strengths: ['Large context', 'Multimodal', 'Data analysis', 'Research synthesis'],
    bestFor: ['Large documents', 'Data projects', 'Research tools', 'Complex analysis']
  },
  'cursor-small': {
    id: 'cursor/cursor-small',
    name: 'Cursor AI',
    provider: 'Cursor',
    description: 'IDE-integrated AI assistant for development workflows',
    maxTokens: 4096,
    costPer1kTokens: 1.0,
    strengths: ['IDE integration', 'Code completion', 'Workflow optimization', 'Real-time assistance'],
    bestFor: ['IDE workflows', 'Code completion', 'Development assistance', 'Project setup']
  },
  'perplexity-small': {
    id: 'perplexity/llama-3.1-sonar-small-128k-online',
    name: 'Perplexity AI',
    provider: 'Perplexity',
    description: 'Research-focused AI with real-time web access',
    maxTokens: 8192,
    costPer1kTokens: 1.5,
    strengths: ['Research', 'Real-time data', 'Information synthesis', 'Fact-checking'],
    bestFor: ['Research projects', 'Data gathering', 'Market analysis', 'Technical research']
  },
  'cohere-command': {
    id: 'cohere/command-r-plus',
    name: 'Cohere Command R+',
    provider: 'Cohere',
    description: 'Enterprise-focused AI with strong reasoning capabilities',
    maxTokens: 8192,
    costPer1kTokens: 2.0,
    strengths: ['Enterprise solutions', 'Business logic', 'Structured output', 'Professional writing'],
    bestFor: ['Enterprise projects', 'Business applications', 'Professional documentation', 'Workflow automation']
  },
  'huggingface-mixtral': {
    id: 'mistralai/mixtral-8x7b-instruct',
    name: 'Mixtral 8x7B (HuggingFace)',
    provider: 'Hugging Face',
    description: 'Open-source mixture of experts model',
    maxTokens: 8192,
    costPer1kTokens: 0.5,
    strengths: ['Open source', 'Cost effective', 'Multilingual', 'Code generation'],
    bestFor: ['Open source projects', 'Cost-sensitive applications', 'Multilingual support', 'Experimentation']
  }
};

export interface PromptOptimizationOptions {
  model: string;
  optimizationLevel: 'basic' | 'enhanced' | 'expert';
  includeExamples: boolean;
  includeConstraints: boolean;
  includeMetrics: boolean;
  targetAudience: 'developer' | 'business' | 'technical' | 'general';
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = '', baseUrl: string = 'https://openrouter.ai/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generatePrompt(
    projectInput: ProjectInput,
    options: PromptOptimizationOptions
  ): Promise<{ prompt: string; metadata: PromptMetadata }> {
    // If no API key is provided, fall back to the existing API endpoint
    if (!this.apiKey) {
      return this.generatePromptFallback(projectInput, options);
    }

    const optimizedSystemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(projectInput, options);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Prompt Generator'
        },
        body: JSON.stringify({
          model: options.model,
          messages: [
            { role: 'system', content: optimizedSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedPrompt = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      const modelInfo = AI_MODELS[options.model] || AI_MODELS['deepseek-chat'];
      const cost = (tokensUsed / 1000) * modelInfo.costPer1kTokens;

      return {
        prompt: generatedPrompt,
        metadata: {
          model: options.model,
          tokensUsed,
          cost,
          optimizationLevel: options.optimizationLevel,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      // Fall back to existing API if external API fails
      return this.generatePromptFallback(projectInput, options);
    }
  }

  private async generatePromptFallback(
    projectInput: ProjectInput,
    options: PromptOptimizationOptions
  ): Promise<{ prompt: string; metadata: PromptMetadata }> {
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectInput),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI prompt');
      }

      const data = await response.json();
      const tokensUsed = data.metadata?.tokensUsed || 0;
      const modelInfo = AI_MODELS[options.model] || AI_MODELS['deepseek-chat'];
      const cost = (tokensUsed / 1000) * modelInfo.costPer1kTokens;

      return {
        prompt: data.prompt,
        metadata: {
          model: options.model,
          tokensUsed,
          cost,
          optimizationLevel: options.optimizationLevel,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Fallback API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate prompt: ${errorMessage}`);
    }
  }

  private buildSystemPrompt(options: PromptOptimizationOptions): string {
    const aiToolName = this.getAIToolName(options.model);
    const aiCapabilities = this.getAICapabilities(options.model);

    const basePrompt = `You are an expert AI prompt engineer specializing in creating optimized prompts for ${aiToolName}, a powerful AI coding assistant.

Your task is to transform user project descriptions into highly effective, detailed prompts that leverage ${aiToolName}'s capabilities:
${aiCapabilities.map(cap => `- ${cap}`).join('\n')}`;

    const optimizationInstructions = {
      basic: 'Create a clear, structured prompt with essential project details.',
      enhanced: 'Create a comprehensive prompt with detailed specifications, best practices, and implementation guidance.',
      expert: 'Create an expert-level prompt with advanced architectural considerations, performance optimization, security requirements, and scalability planning.'
    };

    const audienceInstructions = {
      developer: 'Focus on technical implementation details, code architecture, and development best practices.',
      business: 'Emphasize business value, user experience, and project outcomes.',
      technical: 'Include technical specifications, system requirements, and integration details.',
      general: 'Balance technical and business considerations for a general audience.'
    };

    return `${basePrompt}

OPTIMIZATION LEVEL: ${options.optimizationLevel.toUpperCase()}
${optimizationInstructions[options.optimizationLevel]}

TARGET AUDIENCE: ${options.targetAudience.toUpperCase()}
${audienceInstructions[options.targetAudience]}

${options.includeExamples ? 'Include relevant examples and code snippets where appropriate.' : ''}
${options.includeConstraints ? 'Specify technical constraints, limitations, and requirements.' : ''}
${options.includeMetrics ? 'Include success metrics, KPIs, and measurable outcomes.' : ''}

Generate a prompt that will help ${this.getAIToolName(options.model)} create exceptional results for this project.`;
  }

  private getAIToolName(modelId: string): string {
    if (modelId.includes('deepseek')) return 'DeepSeek AI';
    if (modelId.includes('claude')) return 'Claude Sonnet 4';
    if (modelId.includes('gpt') || modelId.includes('openai')) return 'ChatGPT';
    if (modelId.includes('gemini')) return 'Google Gemini';
    if (modelId.includes('cursor')) return 'Cursor AI';
    if (modelId.includes('perplexity')) return 'Perplexity AI';
    if (modelId.includes('cohere')) return 'Cohere Command';
    return 'AI Assistant';
  }

  private getAICapabilities(modelId: string): string[] {
    const baseCapabilities = [
      'Advanced code generation and analysis',
      'Multi-language programming support',
      'Best practices and design patterns',
      'Code optimization and refactoring'
    ];

    if (modelId.includes('deepseek')) {
      return [
        ...baseCapabilities,
        'Deep reasoning and problem-solving',
        'Mathematical and algorithmic thinking',
        'Technical documentation generation'
      ];
    }

    if (modelId.includes('claude')) {
      return [
        ...baseCapabilities,
        'Structured thinking and analysis',
        'Creative problem-solving approaches',
        'Comprehensive project planning',
        'User experience considerations'
      ];
    }

    if (modelId.includes('gpt') || modelId.includes('openai')) {
      return [
        ...baseCapabilities,
        'Versatile general intelligence',
        'Creative and innovative solutions',
        'Integration with development tools',
        'Comprehensive documentation'
      ];
    }

    if (modelId.includes('gemini')) {
      return [
        ...baseCapabilities,
        'Large context understanding',
        'Multimodal capabilities',
        'Data analysis and insights',
        'Research and information synthesis'
      ];
    }

    if (modelId.includes('cursor')) {
      return [
        ...baseCapabilities,
        'IDE integration and workflow optimization',
        'Real-time code suggestions',
        'Project-aware assistance',
        'Development environment setup'
      ];
    }

    return baseCapabilities;
  }

  private buildUserPrompt(projectInput: ProjectInput, options: PromptOptimizationOptions): string {
    const aiToolName = this.getAIToolName(options.model);
    return `Please create an optimized prompt for ${aiToolName} based on this project:

PROJECT NAME: ${projectInput.projectName}
PROJECT TYPE: ${projectInput.projectType}
TARGET PLATFORM: ${projectInput.platform}
COMPLEXITY: ${projectInput.complexity}

PROJECT DESCRIPTION:
${projectInput.projectIdea}

SELECTED TECHNOLOGIES:
${projectInput.technologies.map(tech => `- ${tech.name}: ${tech.description}`).join('\n') || 'No specific technologies selected'}

ADDITIONAL REQUIREMENTS:
${projectInput.additionalRequirements || 'None specified'}

Please generate a comprehensive, actionable prompt that will help ${aiToolName} deliver exceptional results for this ${projectInput.projectType} project.`;
  }

  getModelRecommendation(projectInput: ProjectInput): string {
    const { projectType, complexity, technologies } = projectInput;
    
    // AI/ML projects work best with DeepSeek for technical depth
    if (projectType.includes('machine-learning') || projectType.includes('data-analysis')) {
      return 'deepseek-chat';
    }

    // Large, complex projects benefit from Gemini's large context
    if (complexity === 'advanced' || technologies.length > 5) {
      return 'gemini-pro';
    }

    // Creative and business-focused projects work well with Claude
    if (projectType.includes('web-application') || projectType.includes('mobile')) {
      return 'claude-sonnet';
    }

    // Desktop applications work well with Cursor for IDE integration
    if (projectType === 'desktop-application') {
      return 'cursor-small';
    }

    // API backends benefit from ChatGPT's versatility
    if (projectType === 'api-backend') {
      return 'gpt-4o';
    }

    // Research projects benefit from Perplexity's web access
    if (projectType.includes('research') || projectInput.projectIdea.toLowerCase().includes('research')) {
      return 'perplexity-small';
    }

    // Enterprise projects work well with Cohere
    if (projectInput.projectIdea.toLowerCase().includes('enterprise')) {
      return 'cohere-command';
    }

    // Default to DeepSeek for development projects
    return 'deepseek-chat';
  }

  estimateCost(tokensUsed: number, modelId: string): number {
    const model = Object.values(AI_MODELS).find(m => m.id === modelId);
    if (!model) return 0;
    
    return (tokensUsed / 1000) * model.costPer1kTokens;
  }
}

export const aiService = new AIService();
