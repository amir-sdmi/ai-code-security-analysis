// Gemini AI Service for Borouge ESG Intelligence
const { GoogleGenerativeAI } = require('@google/generative-ai');
const BoPromptLoader = require('../utils/bo-prompt-loader');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 16384, // Enhanced for enterprise
        temperature: 0.1, // Low temperature for consistent, factual analysis
        topP: 0.8,
        topK: 40
      }
    });
    this.boPromptLoader = new BoPromptLoader();
    this.requestCount = 0;
    this.maxDailyRequests = 1500; // Optimized for Gemini 1.5 Flash free tier
    this.maxInputTokens = 32000; // Maximum input tokens per request
    this.maxOutputTokens = parseInt(process.env.GEMINI_MAX_TOKENS) || 16384; // Enhanced for enterprise
    this.enterpriseMode = process.env.ANALYSIS_DEPTH === 'enterprise';
  }

  /**
   * Generate Borouge ESG intelligence analysis
   */
  async generateESGIntelligence(articles, originalQuery) {
    try {
      if (this.requestCount >= this.maxDailyRequests) {
        throw new Error('Daily Gemini API limit reached');
      }

      if (!articles || articles.length === 0) {
        throw new Error('No articles provided for analysis');
      }

      this.requestCount++;

      // Build enhanced prompt using Bo_Prompt with token optimization
      const enhancedPrompt = this.buildOptimizedPrompt(originalQuery, articles);

      console.log('Generating ESG intelligence with Gemini...');
      console.log('Articles count:', articles.length);
      console.log('Query:', originalQuery);
      console.log('Estimated input tokens:', this.estimateTokens(enhancedPrompt));

      // Generate content with Gemini
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const rawAnalysis = response.text();

      console.log('Gemini response received, length:', rawAnalysis.length);

      // Parse the response using Bo_Prompt loader
      const parsedResponse = this.boPromptLoader.parseBoPromptResponse(rawAnalysis);

      // Extract additional context
      const borogueContext = this.extractBorogueContext(parsedResponse.structuredAnalysis, originalQuery);
      const queryType = this.detectQueryType(originalQuery);
      const confidence = this.calculateConfidence(articles.length, parsedResponse.hasValidJson);

      return {
        rawAnalysis: parsedResponse.rawAnalysis,
        structuredAnalysis: parsedResponse.structuredAnalysis,
        borogueContext: borogueContext,
        queryType: queryType,
        confidence: confidence,
        sourceCount: articles.length,
        hasValidJson: parsedResponse.hasValidJson,
        topSources: articles.slice(0, 5).map(article => ({
          title: article.title,
          source: article.source,
          url: article.url,
          relevanceScore: article.relevanceScore,
          publishedAt: article.publishedAt
        })),
        processingMetadata: {
          timestamp: new Date().toISOString(),
          requestsRemaining: this.maxDailyRequests - this.requestCount,
          promptLength: enhancedPrompt.length,
          responseLength: rawAnalysis.length
        }
      };

    } catch (error) {
      console.error('Gemini ESG intelligence generation error:', error);
      throw new Error(`ESG intelligence generation failed: ${error.message}`);
    }
  }

  /**
   * Detect query type for categorization
   */
  detectQueryType(query) {
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('regulat') || lowercaseQuery.includes('polic') || lowercaseQuery.includes('compli')) {
      return 'regulatory_intelligence';
    } else if (lowercaseQuery.includes('compet') || lowercaseQuery.includes('sabic') || lowercaseQuery.includes('dow')) {
      return 'competitive_intelligence';
    } else if (lowercaseQuery.includes('market') || lowercaseQuery.includes('price') || lowercaseQuery.includes('demand')) {
      return 'market_analysis';
    } else if (lowercaseQuery.includes('esg') || lowercaseQuery.includes('sustain') || lowercaseQuery.includes('carbon')) {
      return 'esg_analysis';
    } else if (lowercaseQuery.includes('technolog') || lowercaseQuery.includes('innovat') || lowercaseQuery.includes('r&d')) {
      return 'technology_intelligence';
    } else {
      return 'general_intelligence';
    }
  }

  /**
   * Extract Borouge-specific context from analysis
   */
  extractBorogueContext(structuredAnalysis, originalQuery) {
    if (!structuredAnalysis) return {};
    
    return {
      executiveSummary: structuredAnalysis.executiveSummary || '',
      priorityFindings: (structuredAnalysis.criticalFindings || [])
        .filter(f => f.priority === 'HIGH')
        .map(f => f.title),
      financialExposure: {
        shortTerm: structuredAnalysis.financialImpact?.shortTerm || '',
        mediumTerm: structuredAnalysis.financialImpact?.mediumTerm || '',
        longTerm: structuredAnalysis.financialImpact?.longTerm || '',
        investmentRequired: structuredAnalysis.financialImpact?.investmentRequired || ''
      },
      competitivePositioning: structuredAnalysis.competitiveBenchmarking || '',
      strategicActions: structuredAnalysis.strategicRecommendations || [],
      riskLevel: this.assessRiskLevel(structuredAnalysis.criticalFindings || []),
      monitoringNeeds: structuredAnalysis.monitoringRequirements || '',
      revenueImpact: this.extractFinancialMentions(JSON.stringify(structuredAnalysis)),
      timeframe: this.extractTimeframeMentions(JSON.stringify(structuredAnalysis)),
      competitors: this.extractCompetitorMentions(JSON.stringify(structuredAnalysis)),
      originalQuery: originalQuery,
      analysisTimestamp: new Date().toISOString()
    };
  }

  /**
   * Enhanced risk assessment with comprehensive analysis
   */
  assessRiskLevel(criticalFindings) {
    if (!criticalFindings || criticalFindings.length === 0) {
      return 'LOW';
    }

    // Count findings by priority
    const highPriorityCount = criticalFindings.filter(f =>
      f.priority === 'HIGH' || f.priority === 'CRITICAL'
    ).length;
    const mediumPriorityCount = criticalFindings.filter(f =>
      f.priority === 'MEDIUM' || f.priority === 'MODERATE'
    ).length;
    const totalFindings = criticalFindings.length;

    // Enhanced risk assessment logic
    if (highPriorityCount >= 3) return 'CRITICAL';
    if (highPriorityCount >= 2) return 'HIGH';
    if (highPriorityCount >= 1 || mediumPriorityCount >= 4) return 'HIGH';
    if (mediumPriorityCount >= 2 || totalFindings >= 5) return 'MEDIUM';
    if (totalFindings >= 2) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Extract financial mentions from text
   */
  extractFinancialMentions(text) {
    const financialPatterns = [
      /\$\d+\.?\d*\s*[bB]illion/g,
      /€\d+\.?\d*\s*[bB]illion/g,
      /\d+%\s*of\s*revenue/g,
      /EBITDA.*\d+/g
    ];
    
    let mentions = [];
    financialPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) mentions.push(...matches);
    });
    
    return mentions;
  }

  /**
   * Extract timeframe mentions from text
   */
  extractTimeframeMentions(text) {
    const timePatterns = [
      /\d+-\d+\s*years?/g,
      /immediate/gi,
      /short[- ]?term/gi,
      /long[- ]?term/gi,
      /\d+\s*months?/g
    ];
    
    let timeframes = [];
    timePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) timeframes.push(...matches);
    });
    
    return timeframes;
  }

  /**
   * Extract competitor mentions from text
   */
  extractCompetitorMentions(text) {
    const competitors = ['SABIC', 'Dow', 'ExxonMobil', 'EQUATE', 'QAPCO', 'Borealis'];
    return competitors.filter(comp => 
      text.toLowerCase().includes(comp.toLowerCase())
    );
  }

  /**
   * Calculate confidence score based on various factors
   */
  calculateConfidence(sourceCount, hasValidJson) {
    let confidence = 0.5; // Base confidence
    
    // Source count factor
    if (sourceCount >= 10) confidence += 0.3;
    else if (sourceCount >= 5) confidence += 0.2;
    else if (sourceCount >= 3) confidence += 0.1;
    
    // JSON structure factor
    if (hasValidJson) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      dailyRequestCount: this.requestCount,
      maxDailyRequests: this.maxDailyRequests,
      remainingRequests: this.maxDailyRequests - this.requestCount,
      resetTime: 'Daily at 00:00 UTC'
    };
  }

  /**
   * Reset daily counter
   */
  resetDailyCounter() {
    this.requestCount = 0;
  }

  /**
   * Build optimized prompt with token management
   */
  buildOptimizedPrompt(originalQuery, articles) {
    // Start with base Bo_Prompt
    const basePrompt = this.boPromptLoader.buildEnhancedPrompt(originalQuery, articles);

    // Estimate tokens and optimize if needed
    const estimatedTokens = this.estimateTokens(basePrompt);

    if (estimatedTokens > this.maxInputTokens * 0.9) { // Use 90% of limit for safety
      console.log(`Prompt too long (${estimatedTokens} tokens), optimizing...`);
      return this.optimizePromptLength(basePrompt, originalQuery, articles);
    }

    return basePrompt;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Optimize prompt length while maintaining quality
   */
  optimizePromptLength(originalPrompt, query, articles) {
    // Prioritize most relevant articles
    const sortedArticles = articles
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 8); // Limit to top 8 articles

    // Truncate article content to essential information
    const optimizedArticles = sortedArticles.map(article => ({
      ...article,
      content: this.truncateContent(article.content || article.description || '', 500),
      description: this.truncateContent(article.description || '', 200)
    }));

    return this.boPromptLoader.buildEnhancedPrompt(query, optimizedArticles);
  }

  /**
   * Truncate content while preserving meaning
   */
  truncateContent(content, maxLength) {
    if (content.length <= maxLength) return content;

    // Find last complete sentence within limit
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');

    return lastSentence > maxLength * 0.7
      ? truncated.substring(0, lastSentence + 1)
      : truncated + '...';
  }

  /**
   * Validate query for ESG relevance
   */
  validateESGQuery(query) {
    const esgKeywords = [
      'esg', 'sustainability', 'environmental', 'carbon', 'emissions',
      'governance', 'social', 'regulation', 'policy', 'compliance',
      'circular economy', 'renewable', 'green', 'climate', 'biodiversity'
    ];

    const lowercaseQuery = query.toLowerCase();
    const hasESGKeywords = esgKeywords.some(keyword => lowercaseQuery.includes(keyword));

    return {
      isValid: hasESGKeywords || query.length > 10, // Allow general queries if substantial
      suggestions: hasESGKeywords ? [] : [
        'carbon emissions petrochemical industry',
        'ESG regulations chemical companies',
        'sustainability initiatives polymer industry',
        'environmental compliance UAE petrochemicals',
        'circular economy plastic recycling'
      ]
    };
  }

  /**
   * Get enhanced usage statistics
   */
  getEnhancedUsageStats() {
    return {
      dailyRequestCount: this.requestCount,
      maxDailyRequests: this.maxDailyRequests,
      remainingRequests: this.maxDailyRequests - this.requestCount,
      utilizationPercentage: Math.round((this.requestCount / this.maxDailyRequests) * 100),
      maxInputTokens: this.maxInputTokens,
      maxOutputTokens: this.maxOutputTokens,
      resetTime: 'Daily at 00:00 UTC',
      tier: 'Gemini 1.5 Flash Free Tier'
    };
  }
}

module.exports = GeminiService;
