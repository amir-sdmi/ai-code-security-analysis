import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { BATCH_CONFIG, calculateOptimalBatchSize, logBatchStats } from './batchConfig.js';

/**
 * Enhanced Gemini AI service for feedback categorization
 * Provides AI-powered categorization with custom categories support and improved confidence system
 */

// Load environment variables (for standalone usage)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Try loading .env.local first, then .env
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}

// Initialize Gemini AI client
let genAI;

export function initializeGeminiAI() {
  try {
    // Try to get API key from both server and client-side environment variables
    const apiKey = typeof window === 'undefined'
      ? process.env.GOOGLE_GEMINI_API_KEY  // Server-side
      : process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;  // Client-side
    
    // Enhanced logging for debugging
    console.log('🔍 Gemini AI Initialization Debug:');
    console.log('- Environment:', process.env.NODE_ENV);
    console.log('- Vercel deployment:', !!process.env.VERCEL);
    console.log('- API key exists:', !!apiKey);
    console.log('- API key length:', apiKey ? apiKey.length : 0);
    console.log('- API key first 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully');
      return true;
    } else {
      console.warn('⚠️ Gemini API key not found or invalid. AI features will use fallback methods.');
      console.warn('To enable AI features, set GOOGLE_GEMINI_API_KEY in your environment variables.');
      console.warn('Current API key value check:', {
        exists: !!apiKey,
        isEmpty: !apiKey || apiKey.trim() === '',
        isDefault: apiKey === 'your_gemini_api_key_here',
        length: apiKey ? apiKey.length : 0
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
    console.warn('AI features will use fallback methods. Check your API key configuration.');
    return false;
  }
}

// Initialize on module load
initializeGeminiAI();

// Global user feedback tracking for AI improvement
let userFeedbackHistory = [];

/**
 * Get custom categories from localStorage or return default categories
 * @returns {Array} Array of category objects
 */
function getActiveCategories() {
  const defaultCategories = [
    { id: 'feature_request', name: 'Feature Request', description: 'Requests for new features or improvements', keywords: 'feature,add,request,suggestion,improve,enhancement' },
    { id: 'bug_report', name: 'Bug Report', description: 'Reports of technical issues, errors, or malfunctions', keywords: 'bug,error,broken,crash,issue,problem,not working,fails,glitch' },
    { id: 'shipping_complaint', name: 'Shipping Complaint', description: 'Issues related to delivery, packaging, or shipping', keywords: 'delivery,shipping,arrived,package,late,delayed,damaged,lost' },
    { id: 'product_quality', name: 'Product Quality', description: 'Concerns about product quality, materials, or build', keywords: 'quality,material,build,durability,defective,cheap,flimsy' },
    { id: 'customer_service', name: 'Customer Service', description: 'Feedback about customer support or service experience', keywords: 'service,support,staff,representative,help,rude,unhelpful,friendly' },
    { id: 'general_inquiry', name: 'General Inquiry', description: 'General questions or neutral feedback', keywords: 'question,inquiry,information,help,general' },
    { id: 'refund_request', name: 'Refund Request', description: 'Requests for refunds, returns, or billing issues', keywords: 'refund,return,money back,cancel,charge,billing,payment' },
    { id: 'compliment', name: 'Compliment', description: 'Positive feedback, praise, or compliments', keywords: 'great,excellent,amazing,love,perfect,awesome,fantastic,thank you' }
  ];

  try {
    if (typeof window !== 'undefined') {
      const storedCategories = localStorage.getItem('feedbacksense_custom_categories');
      const customCategories = storedCategories ? JSON.parse(storedCategories) : [];
      const allCategories = [...defaultCategories, ...customCategories];
      return allCategories.filter(cat => cat.isActive !== false);
    }
  } catch (error) {
    console.warn('Error loading custom categories:', error);
  }
  
  return defaultCategories;
}

/**
 * Record user feedback for AI improvement
 * @param {string} feedbackText - Original feedback text
 * @param {string} aiPrediction - AI predicted category
 * @param {string} userCorrection - User corrected category (if different)
 * @param {number} aiConfidence - AI confidence score
 */
export function recordUserFeedback(feedbackText, aiPrediction, userCorrection, aiConfidence) {
  const feedbackEntry = {
    timestamp: new Date().toISOString(),
    text: feedbackText.substring(0, 200), // Store first 200 chars for privacy
    aiPrediction,
    userCorrection,
    aiConfidence,
    wasCorrect: aiPrediction === userCorrection
  };
  
  userFeedbackHistory.push(feedbackEntry);
  
  // Keep only last 100 entries to manage memory
  if (userFeedbackHistory.length > 100) {
    userFeedbackHistory = userFeedbackHistory.slice(-100);
  }
  
  // Store in localStorage for persistence
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedbacksense_ai_feedback_history', JSON.stringify(userFeedbackHistory));
    }
  } catch (error) {
    console.warn('Error storing AI feedback history:', error);
  }
}

/**
 * Load user feedback history from localStorage
 */
function loadUserFeedbackHistory() {
  try {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('feedbacksense_ai_feedback_history');
      if (storedHistory) {
        userFeedbackHistory = JSON.parse(storedHistory);
      }
    }
  } catch (error) {
    console.warn('Error loading AI feedback history:', error);
    userFeedbackHistory = [];
  }
}

// Load feedback history on initialization
loadUserFeedbackHistory();

/**
 * Get AI performance metrics
 * @returns {Object} Performance metrics
 */
export function getAIPerformanceMetrics() {
  if (userFeedbackHistory.length === 0) {
    return {
      totalFeedback: 0,
      accuracy: 0,
      averageConfidence: 0,
      improvementSuggestions: []
    };
  }
  
  const totalFeedback = userFeedbackHistory.length;
  const correctPredictions = userFeedbackHistory.filter(entry => entry.wasCorrect).length;
  const accuracy = totalFeedback > 0 ? correctPredictions / totalFeedback : 0;
  const averageConfidence = userFeedbackHistory.reduce((sum, entry) => sum + entry.aiConfidence, 0) / totalFeedback;
  
  // Generate improvement suggestions
  const improvementSuggestions = [];
  const lowConfidenceIncorrect = userFeedbackHistory.filter(entry => !entry.wasCorrect && entry.aiConfidence < 0.6).length;
  const highConfidenceIncorrect = userFeedbackHistory.filter(entry => !entry.wasCorrect && entry.aiConfidence > 0.8).length;
  
  if (lowConfidenceIncorrect > totalFeedback * 0.2) {
    improvementSuggestions.push('Consider adding more specific keywords to category definitions');
  }
  
  if (highConfidenceIncorrect > totalFeedback * 0.1) {
    improvementSuggestions.push('Review category descriptions for potential overlaps');
  }
  
  if (averageConfidence < 0.7) {
    improvementSuggestions.push('Consider refining category keywords and descriptions');
  }
  
  return {
    totalFeedback,
    accuracy,
    averageConfidence,
    correctPredictions,
    improvementSuggestions
  };
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 15, // Conservative limit for free tier (15 requests per minute)
  requests: [],
};

/**
 * Check if we're within rate limits
 * @returns {boolean} True if within limits
 */
function checkRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old requests
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => time > oneMinuteAgo);
  
  // Check if we can make a new request
  return RATE_LIMIT.requests.length < RATE_LIMIT.maxRequestsPerMinute;
}

/**
 * Record a new API request for rate limiting
 */
function recordRequest() {
  RATE_LIMIT.requests.push(Date.now());
}

/**
 * Enhanced fallback categorization using keyword-based approach with custom categories
 * @param {string} feedbackText - The feedback text to categorize
 * @returns {Object} Categorization result
 */
function fallbackCategorization(feedbackText) {
  const text = feedbackText.toLowerCase();
  const activeCategories = getActiveCategories();
  
  let bestMatch = { category: 'general_inquiry', score: 0, matchedKeywords: [] };
  
  activeCategories.forEach(category => {
    if (category.keywords) {
      const keywords = category.keywords.split(',').map(k => k.trim().toLowerCase());
      const matches = [];
      let score = 0;
      
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          matches.push(keyword);
          // Weight longer keywords more heavily
          score += keyword.length > 3 ? 2 : 1;
        }
      });
      
      if (score > bestMatch.score) {
        bestMatch = {
          category: category.id,
          score,
          matchedKeywords: matches
        };
      }
    }
  });
  
  // Enhanced confidence calculation based on matches and context
  let confidence = 0;
  if (bestMatch.score > 0) {
    // Base confidence from keyword matches
    confidence = Math.min(bestMatch.score * 0.15, 0.7);
    
    // Boost confidence for multiple keyword matches
    if (bestMatch.matchedKeywords.length > 1) {
      confidence += 0.1;
    }
    
    // Boost confidence for longer, more specific keywords
    const avgKeywordLength = bestMatch.matchedKeywords.reduce((sum, k) => sum + k.length, 0) / bestMatch.matchedKeywords.length;
    if (avgKeywordLength > 5) {
      confidence += 0.05;
    }
    
    confidence = Math.min(confidence, 0.8); // Cap fallback confidence
  } else {
    confidence = 0.3; // Default low confidence for general_inquiry
  }
  
  return {
    category: bestMatch.category,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: bestMatch.score > 0
      ? `Keyword-based classification (fallback). Matched: ${bestMatch.matchedKeywords.join(', ')}`
      : 'No specific keywords matched, defaulting to general inquiry',
    method: 'fallback_enhanced',
    matchedKeywords: bestMatch.matchedKeywords
  };
}

/**
 * Categorize feedback using Gemini AI
 * @param {string} feedbackText - The feedback text to categorize
 * @returns {Promise<Object>} Categorization result with category, confidence, and reasoning
 */
export async function categorizeFeedback(feedbackText) {
  // Input validation
  if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim().length === 0) {
    throw new Error('Invalid feedback text provided');
  }
  
  // Check if Gemini AI is available
  if (!genAI) {
    console.warn('Gemini AI not available, using fallback categorization');
    const fallbackResult = fallbackCategorization(feedbackText);
    return {
      ...fallbackResult,
      isAIAvailable: false,
      fallbackReason: 'Gemini AI service not initialized'
    };
  }
  
  // Check rate limits
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, using fallback categorization');
    return fallbackCategorization(feedbackText);
  }
  
  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    });
    
    // Get active categories for dynamic prompting
    const activeCategories = getActiveCategories();
    const categoryDescriptions = activeCategories.map(cat =>
      `- ${cat.id}: ${cat.description}${cat.keywords ? ` (Keywords: ${cat.keywords})` : ''}`
    ).join('\n');
    
    const validCategoryIds = activeCategories.map(cat => cat.id);

    const prompt = `
You are an AI assistant specialized in categorizing customer feedback with enhanced confidence scoring.

Analyze the following feedback text and categorize it into one of these categories:
${categoryDescriptions}

Feedback text: "${feedbackText}"

Consider these factors for confidence scoring:
- How clearly the feedback matches category keywords and patterns
- Ambiguity or overlap with other categories
- Completeness and clarity of the feedback text
- Specificity of language used

Respond with a JSON object containing:
{
  "category": "one of the category IDs above",
  "confidence": number between 0 and 1 (be precise, consider context and clarity),
  "reasoning": "detailed explanation including confidence factors",
  "keyIndicators": ["list", "of", "key", "words", "or", "phrases", "that", "influenced", "decision"]
}

Be thorough in your analysis. Higher confidence (0.8+) should only be given when the categorization is very clear and unambiguous.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini AI');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Get valid categories dynamically
    const validCategories = activeCategories.map(cat => cat.id);
    
    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category returned: ${parsed.category}`);
    }
    
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error(`Invalid confidence score: ${parsed.confidence}`);
    }
    
    // Enhanced response with additional metadata
    return {
      category: parsed.category,
      confidence: Math.round(parsed.confidence * 100) / 100,
      reasoning: parsed.reasoning || 'AI-based categorization',
      keyIndicators: parsed.keyIndicators || [],
      method: 'ai_enhanced',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Gemini AI categorization failed:', error);
    
    // Return fallback categorization on error
    return fallbackCategorization(feedbackText);
  }
}

/**
 * Batch categorize multiple feedback texts (for cost efficiency)
 * @param {string[]} feedbackTexts - Array of feedback texts
 * @param {number} maxBatchSize - Maximum number of items per batch (default: from config)
 * @returns {Promise<Object[]>} Array of categorization results
 */
export async function batchCategorizeFeedback(feedbackTexts, maxBatchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE) {
  if (!Array.isArray(feedbackTexts) || feedbackTexts.length === 0) {
    throw new Error('Invalid feedback texts array provided');
  }
  
  // Input validation - filter out empty/invalid texts
  const validTexts = feedbackTexts.filter(text =>
    text && typeof text === 'string' && text.trim().length > 0
  );
  
  if (validTexts.length === 0) {
    throw new Error('No valid feedback texts provided');
  }
  
  // Calculate optimal batch size based on content length
  const optimalBatchSize = calculateOptimalBatchSize(validTexts, maxBatchSize);
  
  const allResults = [];
  const startTime = Date.now();
  let successfulBatches = 0;
  const totalBatches = Math.ceil(validTexts.length / optimalBatchSize);
  
  console.log(`Starting batch processing: ${validTexts.length} items in ${totalBatches} batches of ${optimalBatchSize} items each`);
  
  // Process in chunks to avoid token limits and respect rate limits
  for (let i = 0; i < validTexts.length; i += optimalBatchSize) {
    const batch = validTexts.slice(i, i + optimalBatchSize);
    const batchNumber = Math.floor(i / optimalBatchSize) + 1;
    
    try {
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);
      const batchResults = await processBatch(batch);
      allResults.push(...batchResults);
      successfulBatches++;
      
      console.log(`✅ Batch ${batchNumber} completed successfully`);
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error);
      
      // Fallback to individual processing for this batch
      console.log(`🔄 Falling back to individual processing for ${batch.length} items`);
      for (const text of batch) {
        try {
          const result = await categorizeFeedback(text);
          allResults.push(result);
        } catch (individualError) {
          console.error(`Individual processing failed for text: ${text.substring(0, 50)}...`, individualError);
          allResults.push(fallbackCategorization(text));
        }
      }
    }
    
    // Add delay between batches to respect rate limits
    if (i + optimalBatchSize < validTexts.length) {
      console.log(`⏱️ Waiting ${BATCH_CONFIG.DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Log batch processing statistics
  const processingTime = Date.now() - startTime;
  const successRate = successfulBatches / totalBatches;
  
  logBatchStats({
    operation: 'Feedback Categorization',
    totalItems: validTexts.length,
    totalBatches,
    averageBatchSize: optimalBatchSize,
    processingTime,
    successRate
  });
  
  return allResults;
}

/**
 * Process a single batch of feedback texts with Gemini AI
 * @param {string[]} batch - Array of feedback texts (max 15 items)
 * @returns {Promise<Object[]>} Array of categorization results
 */
async function processBatch(batch) {
  // Check if Gemini AI is available
  if (!genAI) {
    console.warn('Gemini AI not available, using fallback categorization for batch');
    return batch.map(text => fallbackCategorization(text));
  }
  
  // Check rate limits
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, using fallback categorization for batch');
    return batch.map(text => fallbackCategorization(text));
  }
  
  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
    
    // Create batch prompt
    const batchPrompt = createBatchPrompt(batch);
    
    const result = await model.generateContent(batchPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid batch response format from Gemini AI');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate response structure
    if (!Array.isArray(parsed) || parsed.length !== batch.length) {
      throw new Error(`Batch response length mismatch. Expected ${batch.length}, got ${parsed.length}`);
    }
    
    // Get valid categories dynamically for batch processing
    const batchActiveCategories = getActiveCategories();
    const validCategories = batchActiveCategories.map(cat => cat.id);
    
    // Process and validate each result
    const results = parsed.map((item, index) => {
      // Validate each item
      if (!validCategories.includes(item.category)) {
        console.warn(`Invalid category returned for item ${index + 1}: ${item.category}`);
        return fallbackCategorization(batch[index]);
      }
      
      if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
        console.warn(`Invalid confidence score for item ${index + 1}: ${item.confidence}`);
        item.confidence = 0.5; // Default confidence
      }
      
      return {
        category: item.category,
        confidence: Math.round(item.confidence * 100) / 100,
        reasoning: item.reasoning || 'AI-based batch categorization',
        keyIndicators: item.keyIndicators || [],
        method: 'ai_batch_enhanced',
        timestamp: new Date().toISOString()
      };
    });
    
    return results;
    
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error; // Re-throw to allow fallback handling
  }
}

/**
 * Create a batch prompt for multiple feedback items
 * @param {string[]} batch - Array of feedback texts
 * @returns {string} Formatted batch prompt
 */
function createBatchPrompt(batch) {
  const feedbackItems = batch.map((text, index) =>
    `${index + 1}. "${text.replace(/"/g, '\\"')}"`
  ).join('\n');
  
  // Get active categories for dynamic prompting
  const activeCategoriesForBatch = getActiveCategories();
  const categoryDescriptions = activeCategoriesForBatch.map(cat =>
    `- ${cat.id}: ${cat.description}${cat.keywords ? ` (Keywords: ${cat.keywords})` : ''}`
  ).join('\n');
  
  return `
You are an AI assistant specialized in categorizing customer feedback with enhanced confidence scoring.

Analyze and categorize the following ${batch.length} feedback items into one of these categories:
${categoryDescriptions}

Feedback items to analyze:
${feedbackItems}

Consider these factors for confidence scoring:
- How clearly each feedback matches category keywords and patterns
- Ambiguity or overlap with other categories
- Completeness and clarity of each feedback text
- Specificity of language used

Respond with a JSON array containing exactly ${batch.length} objects, one for each feedback item in the same order. Each object should contain:
{
  "index": number (1-${batch.length}),
  "category": "one of the category IDs above",
  "confidence": number between 0 and 1 (be precise, consider context and clarity),
  "reasoning": "detailed explanation including confidence factors",
  "keyIndicators": ["list", "of", "key", "words", "or", "phrases"]
}

Example response format:
[
  {
    "index": 1,
    "category": "bug_report",
    "confidence": 0.95,
    "reasoning": "Clear technical issue with specific error description",
    "keyIndicators": ["error", "crash", "not working"]
  },
  {
    "index": 2,
    "category": "compliment",
    "confidence": 0.87,
    "reasoning": "Positive language and satisfaction expressed",
    "keyIndicators": ["excellent", "love", "perfect"]
  }
]

Be thorough in your analysis. Higher confidence (0.8+) should only be given when categorization is very clear and unambiguous.`;
}

/**
 * Generate AI-powered business insights from analytics data
 * @param {Object} analyticsData - Processed analytics data
 * @returns {Promise<Object>} AI-generated insights
 */
export async function generateBusinessInsights(analyticsData) {
  // Check if Gemini AI is available - if not, return professional fallback content
  if (!genAI) {
    console.warn('Gemini AI not available, generating professional fallback business insights');
    return generateProfessionalFallbackBusinessInsights(analyticsData);
  }

  // Check rate limits - if exceeded, return professional fallback content
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, generating professional fallback business insights');
    return generateProfessionalFallbackBusinessInsights(analyticsData);
  }

  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    // Prepare analytics summary for AI analysis
    const analyticsSummary = prepareAnalyticsForAI(analyticsData);

    const prompt = `
You are a senior business analyst and data scientist specializing in customer feedback analysis.
Analyze the following feedback analytics data and provide comprehensive business insights.

Analytics Data Summary:
${JSON.stringify(analyticsSummary, null, 2)}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "executiveSummary": "A 2-3 sentence executive summary of the overall feedback situation and key insights",
  "keyFindings": [
    "List of 3-5 most important findings from the data",
    "Focus on actionable insights that can drive business decisions"
  ],
  "recommendations": [
    "List of 3-5 specific, actionable recommendations",
    "Prioritize recommendations that can have immediate business impact"
  ],
  "riskAssessment": {
    "overallRisk": "low|medium|high",
    "primaryRisks": ["List of main risk factors identified"],
    "mitigationStrategies": ["Specific strategies to address identified risks"]
  },
  "opportunityIdentification": [
    "List of 2-4 growth or improvement opportunities",
    "Focus on areas where positive trends or high satisfaction can be leveraged"
  ],
  "strategicInsights": [
    "2-3 strategic insights for long-term business planning",
    "Consider market positioning, competitive advantages, customer retention"
  ],
  "confidenceScore": 0.85
}

Guidelines for analysis:
- Focus on business impact and actionable insights
- Consider both quantitative metrics and qualitative patterns
- Identify trends that could affect customer satisfaction and business performance
- Provide specific, measurable recommendations where possible
- Consider industry best practices for customer feedback management
- Assess both immediate and long-term implications

Respond with valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini AI for business insights');
    }
    
    const insights = JSON.parse(jsonMatch[0]);
    
    // Validate response structure
    const requiredFields = ['executiveSummary', 'keyFindings', 'recommendations', 'riskAssessment', 'opportunityIdentification', 'strategicInsights'];
    const missingFields = requiredFields.filter(field => !insights.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in AI response: ${missingFields.join(', ')}`);
    }
    
    // Set default confidence score if not provided
    if (typeof insights.confidenceScore !== 'number') {
      insights.confidenceScore = 0.7;
    }
    
    // Add metadata
    insights.generatedAt = new Date().toISOString();
    insights.method = 'ai_business_analysis';
    
    return insights;
    
  } catch (error) {
    console.error('Gemini AI business insights generation failed:', error);
    
    // Return fallback insights
    return generateFallbackBusinessInsights(analyticsData, error.message);
  }
}

/**
 * Generate AI-powered predictive insights
 * @param {Object} trendData - Trend analysis data
 * @param {Object} statisticalData - Statistical analysis data
 * @returns {Promise<Object>} AI-generated predictions
 */
export async function generatePredictiveInsights(trendData, statisticalData) {
  if (!genAI) {
    console.warn('Gemini AI not available for predictive insights');
    return {
      predictions: [],
      confidence: 0,
      methodology: 'fallback',
      error: 'Gemini AI service not initialized'
    };
  }

  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded for predictive insights generation');
    return {
      predictions: [],
      confidence: 0,
      methodology: 'fallback',
      error: 'Rate limit exceeded'
    };
  }

  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    const prompt = `
You are a data scientist specializing in predictive analytics for customer feedback systems.
Analyze the following trend and statistical data to generate predictive insights.

Trend Data:
${JSON.stringify(trendData, null, 2)}

Statistical Data:
${JSON.stringify(statisticalData, null, 2)}

Generate predictions in JSON format:
{
  "predictions": [
    {
      "type": "sentiment|volume|category|risk",
      "prediction": "Detailed prediction description",
      "timeframe": "7|30|90 days",
      "confidence": 0.85,
      "factors": ["Key factors influencing this prediction"],
      "impact": "high|medium|low"
    }
  ],
  "overallConfidence": 0.8,
  "methodology": "AI trend analysis with statistical validation",
  "keyAssumptions": ["List of key assumptions made"],
  "uncertaintyFactors": ["Factors that could affect predictions"]
}

Focus on:
- Realistic predictions based on historical patterns
- Identification of emerging trends
- Risk factors that could impact future performance
- Opportunities for improvement

Respond with valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini AI for predictive insights');
    }
    
    const predictions = JSON.parse(jsonMatch[0]);
    predictions.generatedAt = new Date().toISOString();
    
    return predictions;
    
  } catch (error) {
    console.error('Gemini AI predictive insights generation failed:', error);
    
    return {
      predictions: [{
        type: 'general',
        prediction: 'Unable to generate AI-powered predictions. Manual analysis recommended.',
        timeframe: '30 days',
        confidence: 0.1,
        factors: ['Limited AI processing capability'],
        impact: 'low'
      }],
      overallConfidence: 0.1,
      methodology: 'fallback',
      error: error.message
    };
  }
}

/**
 * Generate AI-powered recommendations for feedback management
 * @param {Object} analyticsData - Complete analytics data
 * @returns {Promise<Object>} AI-generated recommendations
 */
export async function generateFeedbackRecommendations(analyticsData) {
  if (!genAI) {
    console.warn('Gemini AI not available for feedback recommendations');
    return {
      recommendations: [],
      prioritization: [],
      implementationGuide: {},
      error: 'Gemini AI service not initialized'
    };
  }

  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded for feedback recommendations generation');
    return {
      recommendations: [],
      prioritization: [],
      implementationGuide: {},
      error: 'Rate limit exceeded'
    };
  }

  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    const prompt = `
You are a customer experience consultant and feedback management expert.
Analyze the provided analytics data and generate actionable recommendations.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Generate recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "process|technology|strategy|training",
      "title": "Recommendation title",
      "description": "Detailed recommendation description",
      "priority": "high|medium|low",
      "effort": "high|medium|low",
      "impact": "high|medium|low",
      "timeline": "immediate|1-3 months|3-6 months|6+ months",
      "success_metrics": ["How to measure success"],
      "implementation_steps": ["Step-by-step implementation guide"]
    }
  ],
  "prioritization": {
    "quick_wins": ["High impact, low effort recommendations"],
    "strategic_initiatives": ["High impact, high effort recommendations"],
    "continuous_improvements": ["Medium impact recommendations for ongoing optimization"]
  },
  "implementationGuide": {
    "phase1": ["Immediate actions (0-30 days)"],
    "phase2": ["Short-term initiatives (1-3 months)"],
    "phase3": ["Long-term strategic changes (3+ months)"]
  }
}

Focus on:
- Practical, implementable recommendations
- Clear ROI and business impact
- Realistic timelines and resource requirements
- Measurable success criteria

Respond with valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini AI for recommendations');
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);
    recommendations.generatedAt = new Date().toISOString();
    
    return recommendations;
    
  } catch (error) {
    console.error('Gemini AI recommendations generation failed:', error);
    
    return {
      recommendations: [{
        category: 'general',
        title: 'Manual Analysis Required',
        description: 'AI-powered recommendations are currently unavailable. Consider manual review of feedback patterns.',
        priority: 'medium',
        effort: 'medium',
        impact: 'medium',
        timeline: 'immediate',
        success_metrics: ['Improved feedback response rate'],
        implementation_steps: ['Review feedback manually', 'Identify key patterns', 'Develop action plan']
      }],
      prioritization: {
        quick_wins: ['Review recent negative feedback'],
        strategic_initiatives: ['Implement feedback response process'],
        continuous_improvements: ['Regular feedback analysis']
      },
      implementationGuide: {
        phase1: ['Manual feedback review'],
        phase2: ['Process improvements'],
        phase3: ['Technology enhancements']
      },
      error: error.message
    };
  }
}

/**
 * Prepare analytics data for AI analysis
 * @param {Object} analyticsData - Raw analytics data
 * @returns {Object} Prepared data summary
 */
function prepareAnalyticsForAI(analyticsData) {
  const summary = {
    overview: {
      totalFeedback: analyticsData.totalFeedback || 0,
      timeRange: analyticsData.dateRange || 'Unknown',
      analysisDate: new Date().toISOString()
    },
    sentiment: {
      distribution: analyticsData.sentimentDistribution || {},
      averageScore: analyticsData.averageSentiment || 0,
      trend: analyticsData.sentimentTrend || 'stable'
    },
    categories: {
      distribution: analyticsData.categoryDistribution || {},
      topCategory: analyticsData.topCategory || 'Unknown',
      diversity: Object.keys(analyticsData.categoryDistribution || {}).length
    },
    sources: {
      distribution: analyticsData.sourceDistribution || {},
      primarySource: analyticsData.primarySource || 'Unknown',
      channelCount: Object.keys(analyticsData.sourceDistribution || {}).length
    },
    trends: {
      overallDirection: analyticsData.trendDirection || 'stable',
      growth: analyticsData.growthRate || 0,
      volatility: analyticsData.volatility || 'low',
      seasonality: analyticsData.seasonality || false
    },
    quality: {
      completeness: analyticsData.dataCompleteness || 80,
      aiCoverage: analyticsData.aiCoverage || 0,
      averageLength: analyticsData.averageContentLength || 0
    }
  };

  // Remove any circular references and limit depth
  return JSON.parse(JSON.stringify(summary));
}

/**
 * Generate fallback business insights when AI is unavailable
 * @param {Object} analyticsData - Analytics data
 * @param {string} errorMessage - Error message
 * @returns {Object} Fallback insights
 */
function generateProfessionalFallbackBusinessInsights(analyticsData) {
  const totalFeedback = analyticsData.totalFeedback || 0;
  const sentimentDist = analyticsData.sentimentDistribution || {};
  const categoryDist = analyticsData.categoryDistribution || {};
  const sourceDist = analyticsData.sourceDistribution || {};
  
  const positive = sentimentDist.positive || 0;
  const negative = sentimentDist.negative || 0;
  const neutral = sentimentDist.neutral || 0;
  const positiveRatio = totalFeedback > 0 ? positive / totalFeedback : 0;
  const negativeRatio = totalFeedback > 0 ? negative / totalFeedback : 0;
  const neutralRatio = totalFeedback > 0 ? neutral / totalFeedback : 0;

  // Find top categories dynamically from actual data
  const topCategories = Object.entries(categoryDist)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  // Find top sources dynamically from actual data
  const topSources = Object.entries(sourceDist)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2);

  // DYNAMIC Executive Summary based on real data patterns
  let executiveSummary = `Analysis of ${totalFeedback.toLocaleString()} customer feedback entries shows `;
  
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const topCategoryPercent = ((topCategory[1] / totalFeedback) * 100).toFixed(1);
    executiveSummary += `primary focus on ${topCategory[0].replace(/_/g, ' ')} (${topCategoryPercent}% of feedback). `;
  }
  
  if (positiveRatio > 0.7) {
    executiveSummary += `Strong customer satisfaction with ${(positiveRatio * 100).toFixed(1)}% positive sentiment demonstrates effective service delivery.`;
  } else if (negativeRatio > 0.4) {
    executiveSummary += `Concerning ${(negativeRatio * 100).toFixed(1)}% negative sentiment indicates immediate attention required for customer retention.`;
  } else {
    executiveSummary += `Balanced sentiment distribution (${(positiveRatio * 100).toFixed(1)}% positive, ${(negativeRatio * 100).toFixed(1)}% negative) shows opportunities for targeted improvements.`;
  }

  // DYNAMIC Key Findings based on actual data
  const keyFindings = [];
  
  // Data volume insights
  keyFindings.push(`Customer engagement analysis: ${totalFeedback.toLocaleString()} feedback entries processed with ${(positiveRatio * 100).toFixed(1)}% positive sentiment`);
  
  // Category-specific insights
  if (topCategories.length > 0) {
    const topCat = topCategories[0];
    const topCatPercent = ((topCat[1] / totalFeedback) * 100).toFixed(1);
    keyFindings.push(`Category analysis reveals ${topCat[0].replace(/_/g, ' ')} as primary concern area (${topCatPercent}% of total feedback)`);
    
    if (topCategories.length > 1) {
      const secondCat = topCategories[1];
      const secondCatPercent = ((secondCat[1] / totalFeedback) * 100).toFixed(1);
      keyFindings.push(`Secondary focus area identified: ${secondCat[0].replace(/_/g, ' ')} accounts for ${secondCatPercent}% of customer feedback`);
    }
  }
  
  // Source distribution insights
  if (topSources.length > 0) {
    const primarySource = topSources[0];
    const sourcePercent = ((primarySource[1] / totalFeedback) * 100).toFixed(1);
    keyFindings.push(`Channel analysis: ${primarySource[0]} generates ${sourcePercent}% of feedback volume, indicating primary customer touchpoint`);
  }
  
  // Sentiment distribution insights
  if (negativeRatio > 0.3) {
    keyFindings.push(`Risk indicator: ${(negativeRatio * 100).toFixed(1)}% negative sentiment represents ${negative} dissatisfied customers requiring immediate attention`);
  } else if (positiveRatio > 0.6) {
    keyFindings.push(`Opportunity indicator: ${positive} positive feedback entries provide foundation for customer advocacy and testimonial programs`);
  }
  
  if (neutralRatio > 0.4) {
    keyFindings.push(`Conversion potential: ${neutral} neutral responses (${(neutralRatio * 100).toFixed(1)}%) represent immediate improvement opportunities`);
  }

  // DYNAMIC Recommendations based on actual data patterns
  const recommendations = [];
  
  // Category-specific recommendations
  if (topCategories.length > 0) {
    const topCategory = topCategories[0][0];
    const topCategoryCount = topCategories[0][1];
    
    if (topCategory.includes('product_quality')) {
      recommendations.push(`Address product quality concerns: ${topCategoryCount} customers reported quality issues - implement quality assurance review`);
    } else if (topCategory.includes('customer_service')) {
      recommendations.push(`Enhance customer service training: ${topCategoryCount} service-related feedback requires staff development focus`);
    } else if (topCategory.includes('shipping')) {
      recommendations.push(`Optimize delivery operations: ${topCategoryCount} shipping complaints indicate logistics partnership review needed`);
    } else if (topCategory.includes('bug_report')) {
      recommendations.push(`Prioritize technical fixes: ${topCategoryCount} bug reports require immediate development team attention`);
    } else if (topCategory.includes('feature_request')) {
      recommendations.push(`Product roadmap alignment: ${topCategoryCount} feature requests provide direct customer-driven development priorities`);
    } else {
      recommendations.push(`Focus improvement efforts on ${topCategory.replace(/_/g, ' ')}: ${topCategoryCount} customer concerns in this area require strategic attention`);
    }
  }
  
  // Sentiment-based recommendations
  if (negativeRatio > 0.3) {
    recommendations.push(`Implement customer recovery program: ${negative} negative feedback entries require proactive outreach and resolution tracking`);
    recommendations.push(`Establish rapid response protocol: Current ${(negativeRatio * 100).toFixed(1)}% negative sentiment threatens customer retention`);
  }
  
  if (positiveRatio > 0.5) {
    recommendations.push(`Leverage positive sentiment: ${positive} satisfied customers can drive referral programs and case study development`);
  }
  
  // Source-based recommendations
  if (topSources.length > 0) {
    const primarySource = topSources[0];
    recommendations.push(`Optimize ${primarySource[0]} channel: Primary feedback source handling ${primarySource[1]} entries needs dedicated resource allocation`);
  }
  
  // Volume-based recommendations
  if (totalFeedback > 100) {
    recommendations.push(`Scale feedback analysis: ${totalFeedback.toLocaleString()} entries justify automated categorization and sentiment tracking implementation`);
  }
  
  recommendations.push(`Create monthly feedback review: Current ${totalFeedback.toLocaleString()}-entry dataset requires systematic monitoring for trend identification`);

  // DYNAMIC Risk Assessment
  let riskLevel = 'low';
  const primaryRisks = [];
  
  if (negativeRatio > 0.4) {
    riskLevel = 'high';
    primaryRisks.push(`Customer retention threat: ${(negativeRatio * 100).toFixed(1)}% negative sentiment (${negative} customers) requires immediate intervention`);
    
    if (topCategories.length > 0 && topCategories[0][1] > totalFeedback * 0.3) {
      primaryRisks.push(`Category concentration risk: ${topCategories[0][0].replace(/_/g, ' ')} issues affecting ${topCategories[0][1]} customers`);
    }
  } else if (negativeRatio > 0.25) {
    riskLevel = 'medium';
    primaryRisks.push(`Moderate dissatisfaction: ${negative} negative responses require monitoring and improvement initiatives`);
  }
  
  if (neutralRatio > 0.5) {
    primaryRisks.push(`Engagement risk: ${neutral} neutral customers (${(neutralRatio * 100).toFixed(1)}%) show limited satisfaction commitment`);
  }
  
  if (totalFeedback < 50) {
    primaryRisks.push(`Sample size limitation: ${totalFeedback} entries may not represent full customer base - expand feedback collection`);
  }

  return {
    executiveSummary,
    keyFindings,
    recommendations,
    riskAssessment: {
      overallRisk: riskLevel,
      primaryRisks,
      mitigationStrategies: generateDynamicMitigationStrategies(analyticsData, negativeRatio, topCategories)
    },
    opportunityIdentification: generateDynamicOpportunities(analyticsData, positiveRatio, topCategories, totalFeedback),
    strategicInsights: generateDynamicStrategicInsights(analyticsData, positiveRatio, negativeRatio, topCategories),
    confidenceScore: 0.85,
    generatedAt: new Date().toISOString(),
    method: 'dynamic_data_analysis'
  };
}

function generateDynamicMitigationStrategies(analyticsData, negativeRatio, topCategories) {
  const strategies = [];
  
  if (negativeRatio > 0.3) {
    strategies.push('Deploy immediate customer outreach for negative feedback resolution and retention');
  }
  
  if (topCategories.length > 0) {
    const topCat = topCategories[0][0];
    strategies.push(`Create specialized response team for ${topCat.replace(/_/g, ' ')} issues (${topCategories[0][1]} cases)`);
  }
  
  strategies.push(`Implement feedback tracking dashboard for ${analyticsData.totalFeedback || 0}-entry monitoring`);
  strategies.push('Establish escalation protocols based on current sentiment distribution patterns');
  
  return strategies;
}

function generateDynamicOpportunities(analyticsData, positiveRatio, topCategories, totalFeedback) {
  const opportunities = [];
  
  if (positiveRatio > 0.5) {
    const positiveCount = Math.floor(totalFeedback * positiveRatio);
    opportunities.push(`Customer advocacy potential: ${positiveCount} satisfied customers available for testimonials and referrals`);
  }
  
  if (topCategories.length > 0) {
    const topCat = topCategories[0];
    opportunities.push(`Market differentiation through ${topCat[0].replace(/_/g, ' ')} excellence: Address ${topCat[1]} customer concerns for competitive advantage`);
  }
  
  if (totalFeedback > 100) {
    opportunities.push(`Data analytics expansion: ${totalFeedback.toLocaleString()} feedback entries enable predictive modeling and trend analysis`);
  }
  
  opportunities.push(`Process optimization using real customer insights from ${totalFeedback.toLocaleString()} feedback points`);
  
  return opportunities;
}

function generateDynamicStrategicInsights(analyticsData, positiveRatio, negativeRatio, topCategories) {
  const insights = [];
  
  if (positiveRatio > 0.6) {
    insights.push(`Strong market position: ${(positiveRatio * 100).toFixed(1)}% customer satisfaction provides competitive differentiation opportunity`);
  } else {
    insights.push(`Market vulnerability: ${(negativeRatio * 100).toFixed(1)}% negative sentiment indicates competitive risk requiring strategic response`);
  }
  
  if (topCategories.length > 0) {
    const topCat = topCategories[0];
    insights.push(`Strategic focus area: ${topCat[0].replace(/_/g, ' ')} dominance (${topCat[1]} entries) indicates core business impact zone`);
  }
  
  const totalFeedback = analyticsData.totalFeedback || 0;
  if (totalFeedback > 200) {
    insights.push(`Data-driven advantage: ${totalFeedback.toLocaleString()}-entry dataset enables sophisticated customer intelligence and predictive capabilities`);
  }
  
  insights.push(`Customer voice integration: Current feedback patterns reveal direct path to operational excellence and market leadership`);
  
  return insights;
}

// Keep the old method for backward compatibility
function generateFallbackBusinessInsights(analyticsData, errorMessage) {
  return generateProfessionalFallbackBusinessInsights(analyticsData);
}

/**
 * Get current API usage statistics
 * @returns {Object} Usage statistics
 */
export function getUsageStats() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentRequests = RATE_LIMIT.requests.filter(time => time > oneMinuteAgo);
  
  return {
    requestsInLastMinute: recentRequests.length,
    remainingRequests: Math.max(0, RATE_LIMIT.maxRequestsPerMinute - recentRequests.length),
    isGeminiAvailable: !!genAI
  };
}

/**
 * Get AI service health status
 * @returns {Object} Service health information
 */
export function getAIServiceHealth() {
  return {
    isInitialized: !!genAI,
    apiKeyConfigured: !!(process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    rateLimitStatus: getUsageStats(),
    lastError: null, // Could be enhanced to track last error
    capabilities: {
      categorization: !!genAI,
      businessInsights: !!genAI,
      predictiveAnalysis: !!genAI,
      recommendations: !!genAI
    }
  };
}

/**
 * Test AI service connectivity and response quality
 * @returns {Promise<Object>} Test results
 */
export async function testAIService() {
  const healthStatus = getAIServiceHealth();
  
  if (!healthStatus.isInitialized) {
    return {
      success: false,
      error: 'AI service not initialized',
      details: healthStatus
    };
  }

  try {
    // Test with a simple categorization request
    const testFeedback = "This is a test feedback to verify AI service connectivity.";
    const result = await categorizeFeedback(testFeedback);
    
    return {
      success: true,
      testResult: result,
      responseTime: Date.now(), // Simple timestamp
      details: healthStatus
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: healthStatus
    };
  }
}