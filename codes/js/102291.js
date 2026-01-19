/**
 * Enhanced AI Provider Orchestrator
 *
 * Professional AI integration using:
 * - Claude Code SDK for sophisticated multi-turn conversations
 * - Gemini API for advanced research and analysis
 * - Session management for complex optimizations
 * - Cost tracking and performance metrics
 * - MCP integration for custom scheduling tools
 */

import ClaudeCodeIntegration from '../sdk/ClaudeCodeIntegration.js';
import SessionManager from './SessionManager.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger.js';

const execAsync = promisify(exec);

class EnhancedAIProviderOrchestrator {
  constructor() {
    this.claudeSDK = new ClaudeCodeIntegration();
    this.sessionManager = new SessionManager();
    this.geminiAPI = new GeminiAPIProvider();

    this.providers = {
      claude: new ClaudeCodeProvider(this.claudeSDK, this.sessionManager),
      gpt4: new GPT4OptimizationProvider(),
      gemini: this.geminiAPI,
      grok: new GrokCreativeProvider(),
      sonar: new SonarRealTimeProvider()
    };

    this.usage = {
      claude: 0,
      gpt4: 0,
      gemini: 0,
      grok: 0,
      sonar: 0
    };

    this.sessionMetrics = {
      activeSessions: 0,
      totalCost: 0,
      averageSessionDuration: 0,
      successRate: 0
    };

    logger.info('Enhanced AI Provider Orchestrator initialized', {
      providers: Object.keys(this.providers),
      claudeSDK: 'enabled',
      geminiCLI: 'enabled',
      sessionManager: 'active'
    });
  }

  /**
   * Get the appropriate provider for a specific task
   */
  getProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown AI provider: ${providerName}`);
    }

    this.usage[providerName]++;
    return this.providers[providerName];
  }

  /**
   * Start a new scheduling optimization session
   */
  async startOptimizationSession(config) {
    try {
      const sessionId = await this.sessionManager.startSchedulingSession(config);
      this.sessionMetrics.activeSessions++;

      logger.info('Optimization session started', {
        sessionId,
        sport: config.sport,
        provider: 'claude_code_sdk'
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to start optimization session:', error);
      throw error;
    }
  }

  /**
   * Execute multi-turn scheduling optimization
   */
  async executeMultiTurnOptimization(sessionId, phases) {
    try {
      const startTime = Date.now();

      const result = await this.sessionManager.runCompleteOptimization(sessionId, {
        phases: phases.map(phase => ({
          ...phase,
          options: {
            ...phase.options,
            allowedTools: this.getAllowedTools(phase.sport),
            mcpConfig: this.claudeSDK.mcpConfig
          }
        }))
      });

      const duration = Date.now() - startTime;
      this.updateSessionMetrics(duration, result.summary.optimization_summary.total_cost);

      logger.info('Multi-turn optimization completed', {
        sessionId,
        phases: result.results.length,
        duration,
        cost: result.summary.optimization_summary.total_cost
      });

      return result;
    } catch (error) {
      logger.error('Multi-turn optimization failed:', { sessionId, error });
      throw error;
    }
  }

  /**
   * Execute with fallback providers using session management
   */
  async executeWithFallback(primaryProvider, fallbackProviders, task, ...args) {
    const providers = [primaryProvider, ...fallbackProviders];

    for (const providerName of providers) {
      try {
        const provider = this.getProvider(providerName);

        let result;
        if (providerName === 'claude' && task === 'optimizeSchedule') {
          // Use Claude Code SDK for complex optimization
          result = await provider.optimizeScheduleWithSDK(...args);
        } else if (providerName === 'gemini') {
          // Use Gemini CLI for research and analysis
          result = await provider.executeWithCLI(task, ...args);
        } else {
          // Use traditional method for other providers
          result = await provider[task](...args);
        }

        logger.info('AI task completed successfully', {
          provider: providerName,
          task,
          success: true,
          fallbackUsed: providerName !== primaryProvider
        });

        return {
          ...result,
          provider: providerName,
          fallbackUsed: providerName !== primaryProvider,
          enhanced: providerName === 'claude' || providerName === 'gemini'
        };
      } catch (error) {
        logger.warn(`AI provider ${providerName} failed for task ${task}`, {
          provider: providerName,
          task,
          error: error.message
        });

        // Continue to next provider
        continue;
      }
    }

    throw new Error(`All AI providers failed for task: ${task}`);
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics() {
    const sessionAnalytics = this.sessionManager.getAnalytics();

    return {
      usage: this.usage,
      sessions: sessionAnalytics,
      metrics: this.sessionMetrics,
      providers: {
        claude: { type: 'claude_code_sdk', status: 'active' },
        gemini: { type: 'gemini_cli', status: 'active' },
        gpt4: { type: 'ai_sdk', status: 'active' },
        grok: { type: 'ai_sdk', status: 'active' },
        sonar: { type: 'ai_sdk', status: 'active' }
      },
      total_requests: Object.values(this.usage).reduce((sum, count) => sum + count, 0)
    };
  }

  /**
   * Stream creative solutions using Claude Code SDK
   */
  async* streamCreativeSolutions(problem, options = {}) {
    try {
      for await (const chunk of this.claudeSDK.streamCreativeSolutions(problem, options)) {
        yield chunk;
      }
    } catch (error) {
      logger.error('Creative solutions streaming failed:', error);
      throw error;
    }
  }

  /**
   * Validate constraints using Claude Code SDK
   */
  async validateConstraints(schedule, constraints, options = {}) {
    try {
      return await this.claudeSDK.validateConstraints(schedule, constraints, options);
    } catch (error) {
      logger.error('Constraint validation failed:', error);
      throw error;
    }
  }

  // Helper methods
  getAllowedTools(sport) {
    const baseTools = [
      'mcp__big12-data',
      'mcp__constraint-validator',
      'mcp__travel-optimizer',
      'mcp__schedule-tools'
    ];

    const sportSpecificTools = {
      Football: ['mcp__schedule-tools__football_optimizer'],
      Basketball: ['mcp__schedule-tools__basketball_optimizer'],
      Baseball: ['mcp__schedule-tools__series_optimizer'],
      Tennis: ['mcp__schedule-tools__tennis_optimizer']
    };

    return [
      ...baseTools,
      ...(sportSpecificTools[sport] || [])
    ];
  }

  updateSessionMetrics(duration, cost) {
    this.sessionMetrics.totalCost += cost;
    this.sessionMetrics.averageSessionDuration
      = (this.sessionMetrics.averageSessionDuration + duration) / 2;
  }

  async shutdown() {
    await this.sessionManager.shutdown();
    logger.info('Enhanced AI Provider Orchestrator shutdown complete');
  }
}

/**
 * Claude Code SDK Provider
 */
class ClaudeCodeProvider {
  constructor(claudeSDK, sessionManager) {
    this.claudeSDK = claudeSDK;
    this.sessionManager = sessionManager;
    this.name = 'Claude Code SDK';
    this.strengths = ['multi-turn optimization', 'complex reasoning', 'session management'];
  }

  async optimizeScheduleWithSDK(schedulingData, teams, preferences) {
    try {
      // Start optimization session
      const sessionId = await this.sessionManager.startSchedulingSession({
        sport: preferences.sport || 'Unknown',
        teams,
        constraints: schedulingData.constraints,
        preferences
      });

      // Execute optimization phase
      const result = await this.sessionManager.executeOptimizationPhase(
        sessionId,
        'schedule_optimization',
        this.buildOptimizationPrompt(schedulingData, teams, preferences),
        { maxTurns: 3 }
      );

      return {
        strategy: 'claude_code_sdk_optimization',
        optimizations: result.phaseResult,
        sessionId,
        metrics: result.metrics,
        confidence: 0.95,
        provider: this.name
      };
    } catch (error) {
      logger.error('Claude Code SDK optimization failed:', error);
      throw error;
    }
  }

  async analyzeConstraints(constraints, teams) {
    try {
      const schedule = { games: [], teams, sport: 'Analysis' };
      const result = await this.claudeSDK.validateConstraints(schedule, constraints);

      return {
        analysis: result.validation,
        confidence: 0.92,
        provider: this.name
      };
    } catch (error) {
      logger.error('Claude Code SDK constraint analysis failed:', error);
      throw error;
    }
  }

  buildOptimizationPrompt(schedulingData, teams, preferences) {
    return `Optimize Big 12 Conference schedule using advanced AI analysis:

Teams: ${teams.length}
Constraints: ${schedulingData.constraints?.length || 0}
Preferences: ${JSON.stringify(preferences)}

Use multi-turn reasoning to:
1. Analyze current scheduling challenges
2. Identify optimization opportunities
3. Generate specific improvement recommendations
4. Validate solutions against constraints
5. Provide implementation guidance

Focus on Big 12 Conference requirements and best practices.`;
  }
}

/**
 * Gemini API Provider
 */
class GeminiAPIProvider {
  constructor() {
    this.name = 'Gemini API';
    this.strengths = ['deep research', 'comprehensive analysis', 'structured output'];
  }

  async executeWithAPI(task, ...args) {
    try {
      const { google } = await import('@ai-sdk/google');
      const { generateText } = await import('ai');

      const prompt = this.buildPromptForTask(task, ...args);

      logger.info('Executing Gemini API request', { task, prompt: `${prompt.substring(0, 100)}...` });

      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        prompt,
        maxTokens: 4000,
        temperature: 0.7
      });

      return {
        analysis: result.text,
        confidence: 0.88,
        provider: this.name,
        method: 'gemini_api'
      };
    } catch (error) {
      logger.error('Gemini API execution failed:', error);
      throw error;
    }
  }

  async analyzeHistoricalPatterns(schedulingData, sportId) {
    return await this.executeWithAPI('historical_analysis', schedulingData, sportId);
  }

  async researchBestPractices(topic, sportContext) {
    return await this.executeWithAPI('research', topic, sportContext);
  }

  async generateStructuredOutput(data, format) {
    return await this.executeWithAPI('structured_output', data, format);
  }

  buildPromptForTask(task, ...args) {
    switch (task) {
      case 'historical_analysis':
        return `Conduct comprehensive historical analysis of Big 12 Conference scheduling patterns for sport ID ${args[1]}. Analyze trends, successful strategies, and optimization opportunities. Provide structured recommendations.`;

      case 'research':
        return `Research best practices for ${args[0]} in collegiate athletics context: ${args[1]}. Provide evidence-based recommendations with specific examples and implementation strategies.`;

      case 'structured_output':
        return `Convert and structure the following data into ${args[1]} format: ${JSON.stringify(args[0])}. Ensure proper validation and completeness.`;

      default:
        return `Analyze the following Big 12 Conference scheduling data and provide detailed insights: ${JSON.stringify(args)}`;
    }
  }

  parseGeminiResponse(response) {
    try {
      // Try to parse as JSON first
      return JSON.parse(response);
    } catch {
      // If not JSON, return as structured text analysis
      return {
        analysis: response,
        structured: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Keep existing GPT4, Grok, and Sonar providers for compatibility
class GPT4OptimizationProvider {
  constructor() {
    this.name = 'GPT-4';
    this.strengths = ['optimization', 'creativity', 'problem solving'];
  }

  async optimizeSchedule(schedulingData, teams, preferences) {
    // Use existing aiSDKService integration
    const aiSDK = await import('../../ai-ml/aiSDKService.js');
    return await aiSDK.default.optimizeSchedule(schedulingData, preferences.sport || 'general', 'gpt');
  }

  async analyzePerformance(schedule) {
    const aiSDK = await import('../../ai-ml/aiSDKService.js');
    return await aiSDK.default.optimizeSchedule(schedule, 'performance_analysis', 'gpt');
  }
}

class GrokCreativeProvider {
  constructor() {
    this.name = 'Grok';
    this.strengths = ['unconventional approaches', 'creative problem solving'];
  }

  async solveComplexConflicts(conflicts) {
    const aiSDK = await import('../../ai-ml/aiSDKService.js');
    return await aiSDK.default.streamSchedulingSolutions(
      `Solve these scheduling conflicts: ${JSON.stringify(conflicts)}`,
      'grok'
    );
  }
}

class SonarRealTimeProvider {
  constructor() {
    this.name = 'Sonar';
    this.strengths = ['real-time data', 'external research', 'fact verification'];
  }

  async gatherRealTimeData(teams, seasonYear) {
    const aiSDK = await import('../../ai-ml/aiSDKService.js');
    return await aiSDK.default.researchSchedulingStrategies(
      `Real-time data for ${teams.length} teams in ${seasonYear}`,
      seasonYear,
      'sonar'
    );
  }
}

export default EnhancedAIProviderOrchestrator;
export {
  ClaudeCodeProvider,
  GeminiAPIProvider,
  GPT4OptimizationProvider,
  GrokCreativeProvider,
  SonarRealTimeProvider
};