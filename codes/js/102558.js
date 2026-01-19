/**
 * Shared Gemini API Utility
 * 
 * Provides standardized Gemini API interaction patterns for all phases.
 * Ensures consistency in timeout handling, response processing, error handling,
 * and interaction recording across the entire application.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { recordGeminiInteraction, updateGeminiInteraction } from '../../../backend/src/services/geminiPromptsService.js';
import logger from '../../utils/logger.js';

// Shared configuration constants
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';
const MAX_OUTPUT_TOKENS = parseInt(process.env.MAX_OUTPUT_TOKENS || '32000', 10);
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '300000', 10); // 5 minutes default

// Enhanced retry configuration
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 30000; // 30 seconds base delay
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes max delay
const JITTER_MAX_MS = 5000; // Up to 5 seconds random jitter

// Model tier configuration for fallback
const MODEL_TIERS = [
  {
    name: 'gemini-2.5-flash-preview-05-20',
    inputLimit: 1048576,  // 1M tokens
    outputLimit: 65536,   // 64k tokens  
    priority: 1,
    costTier: 'high',
    description: 'Primary model - Latest preview with thinking capabilities'
  },
  {
    name: 'gemini-2.0-flash',
    inputLimit: 1048576,  // 1M tokens
    outputLimit: 8192,    // 8k tokens
    priority: 2,
    costTier: 'medium',
    description: 'Fallback model - Stable and efficient'
  },
  {
    name: 'gemini-1.5-flash',
    inputLimit: 1048576,  // 1M tokens
    outputLimit: 8192,    // 8k tokens
    priority: 3,
    costTier: 'low',
    description: 'Secondary fallback - Proven reliability'
  },
  {
    name: 'gemini-1.5-pro',
    inputLimit: 2097152,  // 2M tokens
    outputLimit: 8192,    // 8k tokens
    priority: 4,
    costTier: 'high',
    description: 'High-capacity fallback - Large context window'
  }
];

/**
 * Log processing status to the processing log table
 * @param {number} jobId - Job ID
 * @param {number} phase - Phase number
 * @param {string} status - Status (started, retry, failed, completed)
 * @param {string} message - Detailed message
 */
async function logProcessingStatus(jobId, phase, status, message) {
  try {
    // Import the logger service dynamically to avoid circular dependencies
    const { LoggerService } = await import('../../../backend/src/services/loggerService.js');
    const processingLogger = new LoggerService('GeminiRetry');
    
    await processingLogger.logPhaseProcessing(jobId, phase, status, message);
  } catch (error) {
    // Fallback to console logging if database logging fails
    logger.warn(`[GeminiUtility] Failed to log to processing table: ${error.message}`);
    logger.info(`[Job ${jobId}] [Phase ${phase}] [${status.toUpperCase()}] ${message}`);
  }
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter and maximum cap
 * @param {number} attempt - Current attempt number (1-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {boolean} isRateLimited - Whether this is a rate limit error (longer delays)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, baseDelay = BASE_RETRY_DELAY_MS, isRateLimited = false) {
  // Base exponential backoff: 30s, 60s, 120s, 240s, 300s (capped)
  let delay = baseDelay * Math.pow(2, attempt - 1);
  
  // Apply rate limit multiplier if needed
  if (isRateLimited) {
    delay *= 2; // Double the delay for rate limit errors
  }
  
  // Cap the maximum delay
  delay = Math.min(delay, MAX_RETRY_DELAY_MS);
  
  // Add random jitter to avoid thundering herd (±2.5 seconds)
  const jitter = (Math.random() - 0.5) * JITTER_MAX_MS;
  delay += jitter;
  
  // Ensure minimum delay
  return Math.max(delay, 1000); // At least 1 second
}

/**
 * Get appropriate model tier based on estimated token usage and current attempt
 * @param {number} estimatedInputTokens - Estimated input token count
 * @param {number} requestedOutputTokens - Requested output token count  
 * @param {number} attempt - Current retry attempt number
 * @param {string} primaryModel - Primary model that failed (optional)
 * @returns {Object} Model tier configuration
 */
function selectModelTier(estimatedInputTokens, requestedOutputTokens = 8192, attempt = 1, primaryModel = null) {
  // For first attempt, use configured primary model
  if (attempt === 1 && !primaryModel) {
    const configuredModel = MODEL_TIERS.find(tier => tier.name === GEMINI_MODEL);
    if (configuredModel) {
      logger.info(`[ModelSelection] Using configured primary model: ${configuredModel.name}`);
      return configuredModel;
    }
  }
  
  // Filter models that can handle the token requirements
  const suitableModels = MODEL_TIERS.filter(tier => {
    const meetsInputLimit = estimatedInputTokens <= tier.inputLimit;
    const meetsOutputLimit = requestedOutputTokens <= tier.outputLimit;
    const notFailedPrimary = tier.name !== primaryModel; // Avoid the model that just failed
    
    return meetsInputLimit && meetsOutputLimit && (attempt === 1 || notFailedPrimary);
  });
  
  if (suitableModels.length === 0) {
    logger.warn(`[ModelSelection] No suitable models found for ${estimatedInputTokens} input / ${requestedOutputTokens} output tokens`);
    // Return the highest capacity model as last resort
    return MODEL_TIERS.find(tier => tier.name === 'gemini-1.5-pro') || MODEL_TIERS[0];
  }
  
  // For retries, prefer more stable models (higher priority number = more stable/older)
  let selectedModel;
  if (attempt === 1) {
    // Use highest priority suitable model
    selectedModel = suitableModels.sort((a, b) => a.priority - b.priority)[0];
  } else if (attempt <= 3) {
    // Use medium priority models for early retries  
    const mediumPriorityModels = suitableModels.filter(tier => tier.priority >= 2);
    selectedModel = mediumPriorityModels.length > 0 
      ? mediumPriorityModels.sort((a, b) => a.priority - b.priority)[0]
      : suitableModels.sort((a, b) => b.priority - a.priority)[0];
  } else {
    // Use most stable models for final attempts
    selectedModel = suitableModels.sort((a, b) => b.priority - a.priority)[0];
  }
  
  logger.info(`[ModelSelection] Attempt ${attempt}: Selected ${selectedModel.name} (${selectedModel.description})`);
  return selectedModel;
}

/**
 * Estimate token count from text length
 * @param {string|Array} prompt - The prompt (string or multipart array)
 * @returns {number} Estimated token count
 */
function estimateTokenCount(prompt) {
  if (typeof prompt === 'string') {
    // Rough estimate: 4 characters per token for text
    return Math.ceil(prompt.length / 4);
  } else if (Array.isArray(prompt)) {
    // For multipart prompts, estimate based on text parts only
    const textParts = prompt.filter(part => part.text || typeof part === 'string');
    const totalTextLength = textParts.reduce((acc, part) => {
      const text = part.text || part;
      return acc + (typeof text === 'string' ? text.length : 0);
    }, 0);
    return Math.ceil(totalTextLength / 4);
  }
  return 0;
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error should be retried
 */
function isRetryableError(error) {
  const errorMessage = error.message.toLowerCase();
  
  // Retry on server errors (5xx)
  if (errorMessage.includes('500') || errorMessage.includes('502') || 
      errorMessage.includes('503') || errorMessage.includes('504')) {
    return true;
  }
  
  // Retry on timeout errors
  if (errorMessage.includes('timeout') || error.name === 'AbortError') {
    return true;
  }
  
  // Retry on rate limit errors (but with longer delays)
  if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    return true;
  }
  
  // Retry on network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return true;
  }
  
  // Don't retry on authentication errors, model not found, etc.
  if (errorMessage.includes('api key') || errorMessage.includes('404') || 
      errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return false;
  }
  
  // Default to retry for unknown errors (conservative approach)
  return true;
}

/**
 * Check if error is rate limit related
 * @param {Error} error - The error to check
 * @returns {boolean} True if this is a rate limit error
 */
function isRateLimitError(error) {
  const errorMessage = error.message.toLowerCase();
  return errorMessage.includes('rate limit') || 
         errorMessage.includes('quota') || 
         errorMessage.includes('429');
}

/**
 * Validate Gemini model name against supported models
 * @param {string} model - Model name to validate
 * @returns {string} Validated model name (falls back to safe default if invalid)
 */
function validateGeminiModel(model) {
  const supportedModels = MODEL_TIERS.map(tier => tier.name).concat([
    'gemini-pro', // Legacy model for backwards compatibility
    'gemini-1.0-pro' // Legacy model for backwards compatibility
  ]);
  
  if (!supportedModels.includes(model)) {
    logger.warn(`[GeminiUtility] Unsupported model: "${model}". Falling back to gemini-2.5-flash-preview-05-20.`);
    logger.info(`[GeminiUtility] Supported models: ${supportedModels.join(', ')}`);
    return 'gemini-2.5-flash-preview-05-20';
  }
  
  return model;
}

// Validate the configured model
const VALIDATED_GEMINI_MODEL = validateGeminiModel(GEMINI_MODEL);
if (VALIDATED_GEMINI_MODEL !== GEMINI_MODEL) {
  logger.warn(`[GeminiUtility] Model changed from ${GEMINI_MODEL} to ${VALIDATED_GEMINI_MODEL}`);
}

/**
 * Shared Gemini configuration builder
 * @param {Object} options - Configuration options
 * @param {string} options.responseMimeType - Response MIME type (default: "application/json")
 * @param {Object} options.responseSchema - Response schema for structured output
 * @param {number} options.temperature - Creativity temperature (0.0 - 1.0, default: 1.0)
 * @param {number} options.topK - Top-K sampling parameter
 * @param {number} options.topP - Top-P sampling parameter
 * @param {number} options.maxOutputTokens - Maximum output tokens
 * @returns {Object} Gemini generation configuration
 */
export function buildGeminiConfig(options = {}) {
  const config = {
    temperature: options.temperature !== undefined ? options.temperature : 1.0, // Use Gemini default
  };

  // Only set maxOutputTokens if explicitly provided
  if (options.maxOutputTokens !== undefined) {
    config.maxOutputTokens = options.maxOutputTokens;
  }
  // If not provided, don't set any limit - let Gemini use its default

  // Add optional parameters if provided
  if (options.responseMimeType) {
    config.responseMimeType = options.responseMimeType;
  }
  
  if (options.responseSchema) {
    config.responseSchema = options.responseSchema;
  }
  
  if (options.topK !== undefined) {
    config.topK = options.topK;
  }
  
  if (options.topP !== undefined) {
    config.topP = options.topP;
  }

  return config;
}

/**
 * Safely extract and validate response text from Gemini API result
 * @param {Object} result - Gemini API result
 * @param {string} context - Context for error logging (e.g., "Phase 4 Block processing")
 * @returns {string} Validated response text
 * @throws {Error} If response is invalid or corrupted
 */
export async function extractResponseText(result, context = 'Gemini API') {
  try {
    // Log the initial response structure for debugging
    logger.debug(`[${context}] Extracting response text. Result type: ${typeof result}, has response: ${!!result.response}`);
    
    if (!result || !result.response) {
      throw new Error('Invalid Gemini result: missing response object');
    }
    
    // Try to get the text from the response
    let rawResponse;
    try {
      rawResponse = await result.response.text();
      logger.debug(`[${context}] Raw response extracted. Type: ${typeof rawResponse}, Length: ${rawResponse?.length || 'unknown'}`);
    } catch (textError) {
      logger.error(`[${context}] Error calling response.text(): ${textError.message}`);
      
      // Fallback: try to get text from candidates directly
      if (result.response.candidates && result.response.candidates.length > 0) {
        const candidate = result.response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          rawResponse = candidate.content.parts[0].text || '';
          logger.warn(`[${context}] Used fallback candidate text extraction`);
        } else {
          throw new Error('No text content found in response candidates');
        }
      } else {
        throw new Error('No candidates found in response and text() method failed');
      }
    }
    
    // Ensure we always get a proper string
    let responseText;
    if (typeof rawResponse === 'string') {
      responseText = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object' && rawResponse !== null) {
      // Check if it's a promise or other object
      if (typeof rawResponse.then === 'function') {
        // It's a promise, await it
        try {
          const awaited = await rawResponse;
          responseText = typeof awaited === 'string' ? awaited : JSON.stringify(awaited);
          logger.warn(`[${context}] Response was a promise, awaited and converted to string: ${responseText.length} chars`);
        } catch (promiseError) {
          logger.error(`[${context}] Failed to await response promise: ${promiseError.message}`);
          throw new Error('Response promise failed to resolve');
        }
      } else {
        // Properly stringify objects to prevent "[object Object]"
        responseText = JSON.stringify(rawResponse);
        logger.warn(`[${context}] Response was object, converted to JSON string: ${responseText.length} chars`);
      }
    } else {
      // Convert other types to string safely
      responseText = String(rawResponse || '');
      logger.warn(`[${context}] Response was ${typeof rawResponse}, converted to string: ${responseText.length} chars`);
    }
    
    // Validate response
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response received from Gemini');
    }
    
    // Check for "[object Object]" corruption
    if (responseText === '[object Object]' || responseText.includes('[object Object]')) {
      logger.error(`[${context}] CRITICAL: Response contains "[object Object]"`);
      logger.error(`[${context}] Raw response type: ${typeof rawResponse}`);
      logger.error(`[${context}] Raw response: ${JSON.stringify(rawResponse)}`);
      throw new Error('Response contains "[object Object]" - response processing error');
    }
    
    // Check for suspicious short responses that might indicate corruption
    if (responseText.length < 10 && !responseText.match(/^[{}\[\]"']+$/)) {
      logger.warn(`[${context}] Suspiciously short response: "${responseText}"`);
    }
    
    logger.info(`[${context}] Successfully extracted response text: ${responseText.length} chars`);
    return responseText;
    
  } catch (error) {
    logger.error(`[${context}] Error extracting response text: ${error.message}`);
    throw new Error(`Failed to extract response text: ${error.message}`);
  }
}

/**
 * Extract metadata from Gemini API response
 * @param {Object} result - Gemini API result object
 * @returns {Object} Structured metadata object
 */
export function extractGeminiMetadata(result) {
  const metadata = {
    modelUsed: GEMINI_MODEL,
    finishReason: null,
    tokenPrompt: 0,
    tokenCandidates: 0,
    tokenTotal: 0,
    safetyRatings: null,
    responseId: null,
    promptFeedback: null
  };
  
  try {
    if (result.response) {
      // Get finish reason from candidates if available
      if (result.response.candidates && result.response.candidates.length > 0) {
        const candidate = result.response.candidates[0];
        metadata.finishReason = candidate.finishReason || null;
        if (candidate.safetyRatings) {
          metadata.safetyRatings = candidate.safetyRatings;
        }
      }
      
      // Get token counts from usageMetadata (this is the key part that was missing)
      if (result.response.usageMetadata) {
        metadata.tokenPrompt = result.response.usageMetadata.promptTokenCount || 0;
        metadata.tokenCandidates = result.response.usageMetadata.candidatesTokenCount || 0;
        metadata.tokenTotal = result.response.usageMetadata.totalTokenCount || 0;
      }
      
      // Get prompt feedback if available
      if (result.response.promptFeedback) {
        metadata.promptFeedback = result.response.promptFeedback;
      }
      
      // Get response ID if available
      if (result.response.responseId) {
        metadata.responseId = result.response.responseId;
      }
    }
    
    if (metadata.tokenTotal > 0) {
      logger.info(`[Shared Gemini Utility] Extracted metadata: ${metadata.tokenTotal} total tokens, finish: ${metadata.finishReason}`);
    } else {
      logger.warn('[Shared Gemini Utility] Token count information not found in response');
    }
    
    return metadata;
  } catch (error) {
    logger.warn('[Shared Gemini Utility] Error extracting metadata:', error);
    return metadata;
  }
}

/**
 * Create a timeout promise for Gemini API calls
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} context - Context for error message
 * @returns {Promise} Promise that rejects after timeout
 */
export function createTimeoutPromise(timeoutMs = GEMINI_TIMEOUT_MS, context = 'Gemini API request') {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${context} timed out after ${timeoutMs/1000}s`));
    }, timeoutMs);
  });
}

/**
 * Single Gemini API call attempt (without retry logic)
 * @param {Object} params - Parameters for the API call
 * @returns {Promise<string>} The response text from Gemini
 * @throws {Error} If the API call fails
 */
async function attemptGeminiCall(params) {
  const {
    prompt,
    generationConfig,
    context,
    timeoutMs,
    model
  } = params;
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Configure the model with structured output if specified
  let modelConfig = { model: validateGeminiModel(model) };
    
    // For structured output, configure it in the model's generationConfig
    if (generationConfig.responseSchema || generationConfig.responseMimeType) {
    logger.debug(`[${context}] Configuring structured output mode`);
      modelConfig.generationConfig = {
        temperature: generationConfig.temperature,
        topK: generationConfig.topK,
        topP: generationConfig.topP,
        maxOutputTokens: generationConfig.maxOutputTokens
      };
      
      if (generationConfig.responseMimeType) {
        modelConfig.generationConfig.responseMimeType = generationConfig.responseMimeType;
      }
      if (generationConfig.responseSchema) {
        modelConfig.generationConfig.responseSchema = generationConfig.responseSchema;
      }
    }
    
    const geminiModel = genAI.getGenerativeModel(modelConfig);
    
    // Create timeout promise
    const timeoutPromise = createTimeoutPromise(timeoutMs, context);
    
    // Prepare the content request
    let contentRequest;
  if (typeof prompt === 'string') {
    contentRequest = prompt;
  } else if (Array.isArray(prompt)) {
    // Handle multi-part prompts (text + images)
    contentRequest = prompt;
    } else {
    throw new Error('Prompt must be a string or array of content parts');
  }
  
  // Make the API call with timeout
  const apiCall = geminiModel.generateContent(contentRequest);
  const result = await Promise.race([apiCall, timeoutPromise]);
  
  // Get response text
  const response = result.response;
  const responseText = response.text();
  
  return responseText;
}

/**
 * Standardized Gemini API call with robust retry mechanism and processing log integration
 * @param {Object} params - Parameters for the API call
 * @param {string} params.prompt - The prompt to send to Gemini
 * @param {number} params.jobId - Job ID for interaction recording
 * @param {number} params.phase - Phase number for interaction recording
 * @param {Object} params.generationConfig - Gemini generation configuration
 * @param {string} params.context - Context for logging (e.g., "Phase 4 Block enhancement")
 * @param {number} params.timeoutMs - Custom timeout in milliseconds
 * @param {string} params.model - Gemini model to use (defaults to validated model)
 * @param {Object} params.enhancedContext - Enhanced context for better debugging (optional)
 * @param {Object} params.enhancedContext.page - Page context information (id, title, navigationId, pageType)
 * @param {Object} params.enhancedContext.block - Block context information (uuid, title, type, orderIndex, contentType)
 * @param {Object} params.enhancedContext.item - Item context information (index, title, type, identifier) for array-based processing
 * @param {Object} params.enhancedContext.job - Job context information (id, phase, processingType, scope) for job-level processing
 * @returns {Promise<string>} The response text from Gemini
 * @throws {Error} If the API call fails after all retries
 */
export async function callGeminiAPI(params) {
  const {
    prompt,
    jobId,
    phase,
    generationConfig,
    context = `Phase ${phase}`,
    timeoutMs = GEMINI_TIMEOUT_MS,
    model = VALIDATED_GEMINI_MODEL,
    enhancedContext = null
  } = params;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_KEY environment variable is required');
  }

  const overallStartTime = Date.now();
  let lastError = null;
  let interactionId = null;
  
  // Log the start of the API call
  logger.info(`[${context}] Starting Gemini API call with retry mechanism (max ${MAX_RETRY_ATTEMPTS} attempts)`);
  logger.info(`[${context}] Config: model=${model}, timeout=${timeoutMs}ms, hasSchema=${!!generationConfig.responseSchema}`);
  
  // 🚨 NEW: Record interaction BEFORE API call with prompt and schema for debugging
  if (jobId) {
    try {
      logger.info(`[${context}] Pre-recording Gemini interaction for debugging...`);
      
      // 🚨 ENHANCED: Build comprehensive metadata with page/block/item context
      const enhancedMetadata = {
        context,
        generationConfig,
        responseSchema: generationConfig.responseSchema, // Include schema for debugging
        requestConfig: {
          context,
          structuredOutput: !!generationConfig.responseSchema,
          timeoutMs,
          maxRetryAttempts: MAX_RETRY_ATTEMPTS
        },
        startedAt: new Date().toISOString()
      };

      // 🚨 NEW: Add enhanced context for better debugging visibility
      if (enhancedContext) {
        enhancedMetadata.enhancedContext = {
          // Page context
          page: enhancedContext.page ? {
            id: enhancedContext.page.id,
            title: enhancedContext.page.title,
            navigationId: enhancedContext.page.navigation_id,
            pageType: enhancedContext.page.type || 'unknown'
          } : null,
          
          // Block context  
          block: enhancedContext.block ? {
            uuid: enhancedContext.block.uuid,
            title: enhancedContext.block.title,
            type: enhancedContext.block.type,
            orderIndex: enhancedContext.block.order_index || enhancedContext.block.order,
            contentType: enhancedContext.block.contentType
          } : null,
          
          // Item context (for array-based processing)
          item: enhancedContext.item ? {
            index: enhancedContext.item.index,
            title: enhancedContext.item.title,
            type: enhancedContext.item.type || 'array-item',
            identifier: enhancedContext.item.identifier
          } : null,
          
          // Job context (for job-level processing)
          job: enhancedContext.job ? {
            id: enhancedContext.job.id,
            phase: enhancedContext.job.phase,
            processingType: enhancedContext.job.processingType,
            scope: enhancedContext.job.scope
          } : null,
          
          // Processing level indicator
          processingLevel: enhancedContext.item ? 'item' : 
                          enhancedContext.block ? 'block' : 
                          enhancedContext.page ? 'page' : 
                          enhancedContext.job ? 'job' : 'unknown'
        };
      }
      
      const interactionResult = await recordGeminiInteraction({
        jobId,
        phase,
        prompt,
        response: null, // Will be updated after API call
        durationMs: null, // Will be updated after API call
        model,
        status: 'started', // Track that we started the call
        metadata: enhancedMetadata
      });
      
      // Store interaction ID for later update
      interactionId = interactionResult?.insertId || interactionResult?.id;
      logger.info(`[${context}] Pre-recorded interaction with ID: ${interactionId}`);
      
    } catch (recordError) {
      logger.warn(`[${context}] Failed to pre-record Gemini interaction: ${recordError.message}`);
      // Continue anyway - this is for debugging, not critical path
    }
    
    await logProcessingStatus(
      jobId, 
      phase, 
      'started', 
      `Starting Gemini API call using ${model} with ${MAX_RETRY_ATTEMPTS} max retries (prompt: ${prompt.length} chars, schema: ${generationConfig.responseSchema ? 'yes' : 'no'})`
    );
  }
  
  // 🚨 NEW: Analyse token requirements for model selection
  const estimatedInputTokens = estimateTokenCount(prompt);
  const requestedOutputTokens = generationConfig.maxOutputTokens || 8192;
  
  logger.info(`[${context}] Token analysis: ~${estimatedInputTokens} input, ${requestedOutputTokens} output requested`);
  
  // Track failed models to avoid repeating failures
  let failedModels = [];
  let selectedModelTier = null; // ✅ FIXED: Declare outside loop to avoid undefined error in catch block
  
  // Retry loop with exponential backoff and model fallback
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    const attemptStartTime = Date.now();
    
    try {
      // 🚨 NEW: Select appropriate model for this attempt
      selectedModelTier = selectModelTier(
        estimatedInputTokens, 
        requestedOutputTokens, 
        attempt, 
        attempt > 1 ? failedModels[failedModels.length - 1] : null
      );
      
      const modelToUse = selectedModelTier.name;
      
      logger.info(`[${context}] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} starting with model: ${modelToUse}`);
      
      // Log attempt start to processing logs for granular tracking
      if (jobId) {
        await logProcessingStatus(
          jobId, 
          phase, 
          'progress', 
          `Gemini API attempt ${attempt}/${MAX_RETRY_ATTEMPTS} starting (model: ${modelToUse}, timeout: ${timeoutMs/1000}s)`
        );
      }
      
      // 🚨 ENHANCED: Adjust generation config for model limitations
      const adjustedGenerationConfig = { ...generationConfig };
      if (requestedOutputTokens > selectedModelTier.outputLimit) {
        adjustedGenerationConfig.maxOutputTokens = selectedModelTier.outputLimit;
        logger.warn(`[${context}] Reducing output tokens from ${requestedOutputTokens} to ${selectedModelTier.outputLimit} for model ${modelToUse}`);
      }
      
      // Make the API call
      const responseText = await attemptGeminiCall({
        prompt,
        generationConfig: adjustedGenerationConfig,
        context: `${context} (attempt ${attempt}, model: ${modelToUse})`,
        timeoutMs,
        model: modelToUse
      });
      
      const attemptDuration = Date.now() - attemptStartTime;
      const totalDuration = Date.now() - overallStartTime;
      
      // Success!
      logger.info(`[${context}] ✅ Attempt ${attempt} succeeded in ${attemptDuration}ms (total: ${totalDuration}ms)`);
      logger.info(`[${context}] Response: ${responseText.length} characters`);
      
      if (jobId) {
        await logProcessingStatus(
          jobId, 
          phase, 
          'completed', 
          `Gemini API call succeeded on attempt ${attempt}/${MAX_RETRY_ATTEMPTS} (${attemptDuration}ms, response: ${responseText.length} chars)`
        );
      }
      
      // 🚨 NEW: Update the pre-recorded interaction with response and success status
      if (jobId && interactionId) {
        try {
          // 🚨 ENHANCED: Update with completion metadata including enhanced context
          const completionMetadata = {
              context,
              generationConfig,
              responseSchema: generationConfig.responseSchema,
              requestConfig: {
                context,
                structuredOutput: !!generationConfig.responseSchema,
                timeoutMs,
                maxRetryAttempts: MAX_RETRY_ATTEMPTS
              },
              startedAt: new Date(overallStartTime).toISOString(),
              completedAt: new Date().toISOString(),
              successfulAttempt: attempt,
              totalAttempts: attempt
          };

          // Preserve enhanced context from the initial recording
          if (enhancedContext) {
            completionMetadata.enhancedContext = {
              // Page context
              page: enhancedContext.page ? {
                id: enhancedContext.page.id,
                title: enhancedContext.page.title,
                navigationId: enhancedContext.page.navigation_id,
                pageType: enhancedContext.page.type || 'unknown'
              } : null,
              
              // Block context  
              block: enhancedContext.block ? {
                uuid: enhancedContext.block.uuid,
                title: enhancedContext.block.title,
                type: enhancedContext.block.type,
                orderIndex: enhancedContext.block.order_index || enhancedContext.block.order,
                contentType: enhancedContext.block.contentType
              } : null,
              
              // Item context (for array-based processing)
              item: enhancedContext.item ? {
                index: enhancedContext.item.index,
                title: enhancedContext.item.title,
                type: enhancedContext.item.type || 'array-item',
                identifier: enhancedContext.item.identifier
              } : null,
              
              // Job context (for job-level processing)
              job: enhancedContext.job ? {
                id: enhancedContext.job.id,
                phase: enhancedContext.job.phase,
                processingType: enhancedContext.job.processingType,
                scope: enhancedContext.job.scope
              } : null,
              
              // Processing level indicator
              processingLevel: enhancedContext.item ? 'item' : 
                              enhancedContext.block ? 'block' : 
                              enhancedContext.page ? 'page' : 
                              enhancedContext.job ? 'job' : 'unknown'
            };
          }

          await updateGeminiInteraction(interactionId, {
            response: responseText,
            durationMs: totalDuration,
            status: 'completed',
            metadata: completionMetadata
          });
          logger.info(`[${context}] Updated interaction ${interactionId} with success status`);
        } catch (updateError) {
          logger.warn(`[${context}] Failed to update Gemini interaction: ${updateError.message}`);
        }
      }
    
    return responseText;
    
  } catch (error) {
      const attemptDuration = Date.now() - attemptStartTime;
      lastError = error;
      
      // 🚨 NEW: Track failed model to avoid repeating failures
      const failedModel = attempt === 1 ? model : selectedModelTier?.name || model;
      if (!failedModels.includes(failedModel)) {
        failedModels.push(failedModel);
      }
      
      logger.error(`[${context}] ❌ Attempt ${attempt} failed after ${attemptDuration}ms: ${error.message}`);
      logger.error(`[${context}] Failed model: ${failedModel}, Total failed models: ${failedModels.length}`);
      
      // Log attempt failure to processing logs for granular tracking
      if (jobId) {
        await logProcessingStatus(
          jobId, 
          phase, 
          'retry', 
          `Gemini API attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed (model: ${failedModel}): ${error.message} (${attemptDuration}ms)`
        );
      }
      
      // Check if this error should be retried
      const shouldRetry = isRetryableError(error) && attempt < MAX_RETRY_ATTEMPTS;
      
      if (!shouldRetry) {
        logger.error(`[${context}] 🛑 Not retrying: ${!isRetryableError(error) ? 'non-retryable error' : 'max attempts reached'}`);
        
        if (jobId) {
          await logProcessingStatus(
            jobId, 
            phase, 
            'failed', 
            `Gemini API call failed permanently after ${attempt} attempts: ${error.message}`
          );
        }
        break;
      }
      
      // Calculate delay for next attempt
      const delayMs = calculateBackoffDelay(attempt);
      const delaySeconds = Math.round(delayMs / 1000);
      
      logger.warn(`[${context}] 🔄 Will retry in ${delaySeconds}s (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
      
      if (jobId) {
        await logProcessingStatus(
          jobId, 
          phase, 
          'retry', 
          `Attempt ${attempt} failed (${error.message}). Retrying in ${delaySeconds}s...`
        );
      }
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }
  
  // All attempts failed - update interaction with failure status
  const finalDuration = Date.now() - overallStartTime;
  
  if (jobId && interactionId) {
    try {
      await updateGeminiInteraction(interactionId, {
        response: null,
        durationMs: finalDuration,
        status: 'failed',
        error: lastError.message,
        metadata: {
          context,
          generationConfig,
          responseSchema: generationConfig.responseSchema,
          requestConfig: {
            context,
            structuredOutput: !!generationConfig.responseSchema,
            timeoutMs,
            maxRetryAttempts: MAX_RETRY_ATTEMPTS
          },
          startedAt: new Date(overallStartTime).toISOString(),
          failedAt: new Date().toISOString(),
          totalAttempts: MAX_RETRY_ATTEMPTS,
          lastError: lastError.message
        }
      });
      logger.info(`[${context}] Updated interaction ${interactionId} with failure status`);
    } catch (updateError) {
      logger.warn(`[${context}] Failed to update failed Gemini interaction: ${updateError.message}`);
    }
  }

  // All attempts failed
  logger.error(`[${context}] ❌ All ${MAX_RETRY_ATTEMPTS} attempts failed after ${finalDuration}ms`);
  logger.error(`[${context}] Final error: ${lastError.message}`);
  
  throw new Error(`Gemini API call failed after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError.message}`);
}

/**
 * Parse and validate JSON response from Gemini
 * @param {string} responseText - Raw response text from Gemini
 * @param {string} context - Context for error logging
 * @param {Function} validator - Optional validation function for parsed object
 * @returns {Object} Parsed and validated JSON object
 * @throws {Error} If parsing or validation fails
 */
export function parseGeminiResponse(responseText, context = 'Gemini response', validator = null) {
  logger.info(`[${context}] Attempting to parse response (${responseText.length} chars)`);
  logger.debug(`[${context}] Raw response snippet: ${responseText.substring(0, 200)}...`);
  
  try {
    let parsed;
    
    // Check for truncated JSON responses (common with token limits)
    const trimmed = responseText.trim();
    if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      logger.error(`[${context}] TRUNCATED JSON DETECTED: Response starts with '{' but doesn't end with '}'`);
      logger.error(`[${context}] Response length: ${responseText.length} chars`);
      logger.error(`[${context}] Last 100 chars: "${responseText.substring(responseText.length - 100)}"`);
      throw new Error('Truncated JSON response detected - likely hit token limit. Increase maxOutputTokens.');
    }
    
    if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
      logger.error(`[${context}] TRUNCATED JSON ARRAY DETECTED: Response starts with '[' but doesn't end with ']'`);
      logger.error(`[${context}] Response length: ${responseText.length} chars`);
      logger.error(`[${context}] Last 100 chars: "${responseText.substring(responseText.length - 100)}"`);
      throw new Error('Truncated JSON array response detected - likely hit token limit. Increase maxOutputTokens.');
    }
    
    // Method 1: Try to extract JSON from markdown code blocks
    const jsonCodeBlockRegexes = [
      /```(?:json)\s*([\s\S]*?)```/g,  // JSON-specific code block
      /```(?:javascript|js)\s*([\s\S]*?)```/g,  // JavaScript code block that might contain JSON
      /```\s*([\s\S]*?)```/g  // Any code block
    ];
    
    for (const regex of jsonCodeBlockRegexes) {
      const matches = [...responseText.matchAll(regex)];
      if (matches.length > 0) {
        for (const match of matches) {
          const extractedJson = match[1].trim();
          try {
            parsed = JSON.parse(extractedJson);
            logger.info(`[${context}] Successfully parsed JSON from code block`);
            break;
          } catch (extractedParseError) {
            logger.debug(`[${context}] Failed to parse extracted JSON from code block, trying next match`);
          }
        }
        if (parsed) break;
      }
    }
    
    // Method 2: If no code blocks found or parsing failed, try direct JSON parsing
    if (!parsed) {
      try {
        parsed = JSON.parse(responseText);
        logger.info(`[${context}] Successfully parsed raw response as JSON directly`);
      } catch (directParseError) {
        logger.debug(`[${context}] Response not directly valid JSON, attempting pattern matching`);
      }
    }
    
    // Method 3: Try finding JSON objects in the text using patterns
    if (!parsed) {
      const jsonPatterns = [
        /(\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\})/g,
        /(\{\s*"[^"]+"\s*:\s*(?:"[^"]*"|null|true|false|\d+|(?:\{.*?\})|(?:\[.*?\]))(?:\s*,\s*"[^"]+"\s*:\s*(?:"[^"]*"|null|true|false|\d+|(?:\{.*?\})|(?:\[.*?\])))*\s*})/g
      ];
      
      for (const pattern of jsonPatterns) {
        const matches = [...responseText.matchAll(pattern)];
        if (matches.length > 0) {
          const sortedMatches = matches.map(m => m[0])
            .sort((a, b) => b.length - a.length);
          
          for (const potentialJson of sortedMatches) {
            try {
              parsed = JSON.parse(potentialJson);
              logger.info(`[${context}] Successfully parsed JSON using pattern matching`);
              break;
            } catch (error) { 
              logger.debug(`[${context}] Failed to parse potential JSON match, trying next`);
            }
          }
          if (parsed) break;
        }
      }
    }
    
    // If we still don't have parsed JSON, that's an error
    if (!parsed) {
      throw new Error('Failed to extract any valid JSON from the model response');
    }
    
    // Run optional validation
    if (validator && typeof validator === 'function') {
      const validationResult = validator(parsed);
      if (validationResult !== true) {
        throw new Error(validationResult || 'Validation failed');
      }
    }
    
    logger.info(`[${context}] Successfully parsed and validated JSON response`);
    return parsed;
    
  } catch (parseError) {
    logger.error(`[${context}] Failed to parse JSON response: ${parseError.message}`);
    logger.error(`[${context}] Raw response: ${responseText.substring(0, 500)}...`);
    throw new Error(`Invalid JSON response: ${parseError.message}`);
  }
}

/**
 * Export configuration constants for use in phases
 */
export const GeminiConfig = {
  API_KEY: GEMINI_API_KEY,
  MODEL: GEMINI_MODEL,
  MAX_OUTPUT_TOKENS,
  TIMEOUT_MS: GEMINI_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
  BASE_RETRY_DELAY_MS
}; 