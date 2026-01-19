import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateCorrelationMatrix, getTokenVolatility, simulatePriceChanges } from "./crypto-utils";
import { getTokenMarketCap, getToken24hVolume, getTokenPrice, estimateSlippage } from "./market-data";

// Initialize AI service clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// xAI initialization with OpenAI SDK but using xAI's API
const xai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

interface BaseOptimizationRequest {
  tokens: Array<{
    symbol: string;
    price: number;
    marketCap?: number;
    volume24h?: number;
    volatility?: number;
  }>;
  poolType: 'stable' | 'weighted' | 'stable-balanced';
  targetAPR?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
}

interface OptimizationResponse {
  tokenWeights: Record<string, number>; // symbol -> weight (percentage)
  predictedAPR: number;
  impermanentLossRisk: number; // 0 to 1 scale 
  rebalanceInterval: 'hourly' | 'daily' | 'weekly';
  slippageModel: {
    baseSlippage: number;
    volumeMultiplier: number;
  };
  feeRecommendation: number; // percentage
  status: 'success' | 'partial' | 'failed';
  message?: string;
  swapRouteOptimizations?: Array<{
    route: string[];
    efficiency: number;
  }>;
  aiProvider: 'openai' | 'xai' | 'gemini';
}

/**
 * Calculate optimized token weights and pool parameters using OpenAI
 */
export async function optimizeWithOpenAI(request: BaseOptimizationRequest): Promise<OptimizationResponse> {
  try {
    // Enrich token data with additional market information if not provided
    const enrichedTokens = await enrichTokenData(request.tokens);
    
    // Generate token weights prompt based on pool type
    let prompt = `You are a liquidity pool optimization expert. Design an optimal multi-token liquidity pool with these tokens:\n\n`;
    
    enrichedTokens.forEach(t => {
      prompt += `Token: ${t.symbol}\n`;
      prompt += `Price: $${t.price.toFixed(2)}\n`;
      prompt += `Market Cap: $${t.marketCap?.toLocaleString() || 'Unknown'}\n`;
      prompt += `24h Volume: $${t.volume24h?.toLocaleString() || 'Unknown'}\n`;
      prompt += `Volatility: ${t.volatility?.toFixed(4) || 'Unknown'}\n\n`;
    });
    
    prompt += `Pool Type: ${request.poolType}\n`;
    prompt += `Target APR: ${request.targetAPR || 'Not specified'}\n`;
    prompt += `Risk Tolerance: ${request.riskTolerance || 'medium'}\n\n`;
    
    prompt += `Provide the following in your response:
1. Token weights as percentages (must sum to 100%)
2. Predicted APR
3. Impermanent loss risk (0-1 scale)
4. Recommended rebalance interval (hourly, daily, or weekly)
5. Slippage model (base slippage and volume multiplier)
6. Fee recommendation as percentage
7. Swap route optimizations

Format your response as valid JSON like this:
{
  "tokenWeights": {"SYMBOL1": 40, "SYMBOL2": 30, "SYMBOL3": 30},
  "predictedAPR": 8.5,
  "impermanentLossRisk": 0.3,
  "rebalanceInterval": "daily",
  "slippageModel": {
    "baseSlippage": 0.1,
    "volumeMultiplier": 0.05
  },
  "feeRecommendation": 0.3,
  "swapRouteOptimizations": [
    {
      "route": ["SYMBOL1", "SYMBOL2", "SYMBOL3"],
      "efficiency": 0.92
    }
  ]
}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a DeFi liquidity pool optimization expert." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const result = JSON.parse(content);
    
    // Add AI provider info
    return {
      ...result,
      status: 'success',
      aiProvider: 'openai'
    };
  } catch (error) {
    console.error("OpenAI optimization error:", error);
    
    // Return a fallback response with equal weights
    return {
      tokenWeights: createEqualWeights(request.tokens),
      predictedAPR: estimateBaseAPR(request.poolType),
      impermanentLossRisk: request.poolType === 'stable' ? 0.05 : 0.3,
      rebalanceInterval: 'daily',
      slippageModel: {
        baseSlippage: 0.1,
        volumeMultiplier: 0.05
      },
      feeRecommendation: request.poolType === 'stable' ? 0.01 : 0.3,
      status: 'partial',
      message: `Error optimizing with OpenAI: ${error instanceof Error ? error.message : String(error)}`,
      aiProvider: 'openai'
    };
  }
}

/**
 * Calculate optimized token weights and pool parameters using xAI (Grok)
 */
export async function optimizeWithXAI(request: BaseOptimizationRequest): Promise<OptimizationResponse> {
  try {
    // Enrich token data with additional market information if not provided
    const enrichedTokens = await enrichTokenData(request.tokens);
    
    // Generate token weights prompt based on pool type
    let prompt = `You are a liquidity pool optimization expert. Design an optimal multi-token liquidity pool with these tokens:\n\n`;
    
    enrichedTokens.forEach(t => {
      prompt += `Token: ${t.symbol}\n`;
      prompt += `Price: $${t.price.toFixed(2)}\n`;
      prompt += `Market Cap: $${t.marketCap?.toLocaleString() || 'Unknown'}\n`;
      prompt += `24h Volume: $${t.volume24h?.toLocaleString() || 'Unknown'}\n`;
      prompt += `Volatility: ${t.volatility?.toFixed(4) || 'Unknown'}\n\n`;
    });
    
    prompt += `Pool Type: ${request.poolType}\n`;
    prompt += `Target APR: ${request.targetAPR || 'Not specified'}\n`;
    prompt += `Risk Tolerance: ${request.riskTolerance || 'medium'}\n\n`;
    
    prompt += `Provide the following in your response:
1. Token weights as percentages (must sum to 100%)
2. Predicted APR
3. Impermanent loss risk (0-1 scale)
4. Recommended rebalance interval (hourly, daily, or weekly)
5. Slippage model (base slippage and volume multiplier)
6. Fee recommendation as percentage
7. Swap route optimizations

Format your response as valid JSON like this:
{
  "tokenWeights": {"SYMBOL1": 40, "SYMBOL2": 30, "SYMBOL3": 30},
  "predictedAPR": 8.5,
  "impermanentLossRisk": 0.3,
  "rebalanceInterval": "daily",
  "slippageModel": {
    "baseSlippage": 0.1,
    "volumeMultiplier": 0.05
  },
  "feeRecommendation": 0.3,
  "swapRouteOptimizations": [
    {
      "route": ["SYMBOL1", "SYMBOL2", "SYMBOL3"],
      "efficiency": 0.92
    }
  ]
}`;

    // Call xAI API
    const response = await xai.chat.completions.create({
      model: "grok-2-1212", // the newest xAI model is "grok-2-1212" which was released February 24, 2025
      messages: [
        { role: "system", content: "You are a DeFi liquidity pool optimization expert." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from xAI");
    }
    
    const result = JSON.parse(content);
    
    // Add AI provider info
    return {
      ...result,
      status: 'success',
      aiProvider: 'xai'
    };
  } catch (error) {
    console.error("xAI optimization error:", error);
    
    // Return a fallback response with equal weights
    return {
      tokenWeights: createEqualWeights(request.tokens),
      predictedAPR: estimateBaseAPR(request.poolType) * 1.1, // xAI tends to be more optimistic
      impermanentLossRisk: request.poolType === 'stable' ? 0.05 : 0.25,
      rebalanceInterval: 'daily',
      slippageModel: {
        baseSlippage: 0.12,
        volumeMultiplier: 0.04
      },
      feeRecommendation: request.poolType === 'stable' ? 0.01 : 0.3,
      status: 'partial',
      message: `Error optimizing with xAI: ${error instanceof Error ? error.message : String(error)}`,
      aiProvider: 'xai'
    };
  }
}

/**
 * Calculate optimized token weights and pool parameters using Google Gemini
 */
export async function optimizeWithGemini(request: BaseOptimizationRequest): Promise<OptimizationResponse> {
  try {
    // Enrich token data with additional market information if not provided
    const enrichedTokens = await enrichTokenData(request.tokens);
    
    // Generate token weights prompt based on pool type
    let prompt = `You are a liquidity pool optimization expert. Design an optimal multi-token liquidity pool with these tokens:\n\n`;
    
    enrichedTokens.forEach(t => {
      prompt += `Token: ${t.symbol}\n`;
      prompt += `Price: $${t.price.toFixed(2)}\n`;
      prompt += `Market Cap: $${t.marketCap?.toLocaleString() || 'Unknown'}\n`;
      prompt += `24h Volume: $${t.volume24h?.toLocaleString() || 'Unknown'}\n`;
      prompt += `Volatility: ${t.volatility?.toFixed(4) || 'Unknown'}\n\n`;
    });
    
    prompt += `Pool Type: ${request.poolType}\n`;
    prompt += `Target APR: ${request.targetAPR || 'Not specified'}\n`;
    prompt += `Risk Tolerance: ${request.riskTolerance || 'medium'}\n\n`;
    
    prompt += `Provide the following in your response:
1. Token weights as percentages (must sum to 100%)
2. Predicted APR
3. Impermanent loss risk (0-1 scale)
4. Recommended rebalance interval (hourly, daily, or weekly)
5. Slippage model (base slippage and volume multiplier)
6. Fee recommendation as percentage
7. Swap route optimizations

Format your response as valid JSON like this:
{
  "tokenWeights": {"SYMBOL1": 40, "SYMBOL2": 30, "SYMBOL3": 30},
  "predictedAPR": 8.5,
  "impermanentLossRisk": 0.3,
  "rebalanceInterval": "daily",
  "slippageModel": {
    "baseSlippage": 0.1,
    "volumeMultiplier": 0.05
  },
  "feeRecommendation": 0.3,
  "swapRouteOptimizations": [
    {
      "route": ["SYMBOL1", "SYMBOL2", "SYMBOL3"],
      "efficiency": 0.92
    }
  ]
}`;

    // Call Gemini API
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    try {
      // Extract JSON from the text response, handling potential text wrapping
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const parsedResult = JSON.parse(jsonContent);
      
      // Add AI provider info
      return {
        ...parsedResult,
        status: 'success',
        aiProvider: 'gemini'
      };
    } catch (jsonError) {
      console.error("Error parsing Gemini response:", jsonError);
      throw new Error("Failed to parse Gemini JSON response");
    }
  } catch (error) {
    console.error("Gemini optimization error:", error);
    
    // Return a fallback response with equal weights
    return {
      tokenWeights: createEqualWeights(request.tokens),
      predictedAPR: estimateBaseAPR(request.poolType) * 0.9, // Gemini tends to be more conservative
      impermanentLossRisk: request.poolType === 'stable' ? 0.06 : 0.35,
      rebalanceInterval: 'weekly',
      slippageModel: {
        baseSlippage: 0.08,
        volumeMultiplier: 0.06
      },
      feeRecommendation: request.poolType === 'stable' ? 0.01 : 0.25,
      status: 'partial',
      message: `Error optimizing with Gemini: ${error instanceof Error ? error.message : String(error)}`,
      aiProvider: 'gemini'
    };
  }
}

/**
 * Auto-select best AI provider based on pool characteristics and optimize
 */
export async function optimizeMultiTokenPool(request: BaseOptimizationRequest, provider: 'auto' | 'openai' | 'xai' | 'gemini' = 'auto'): Promise<OptimizationResponse> {
  // If provider is specified, use that provider
  if (provider === 'openai') {
    return optimizeWithOpenAI(request);
  } else if (provider === 'xai') {
    return optimizeWithXAI(request);
  } else if (provider === 'gemini') {
    return optimizeWithGemini(request);
  }
  
  // Otherwise, auto-select based on pool characteristics
  const { tokens, poolType, riskTolerance } = request;
  
  // Check if all tokens are stablecoins for a stable pool
  const allStablecoins = poolType === 'stable' && tokens.every(token => 
    ['USDC', 'USDT', 'DAI', 'USDH', 'USDC'].includes(token.symbol)
  );
  
  // Check if pool contains high volatility tokens
  const hasHighVolatilityTokens = tokens.some(token => 
    token.volatility ? token.volatility > 0.03 : ['SOL', 'BTC', 'ETH', 'BONK', 'WIF'].includes(token.symbol)
  );
  
  // Check if pool is ecosystem-focused
  const isEcosystemFocused = tokens.some(token => 
    ['SOL', 'RAY', 'JUP', 'MNGO', 'JTO', 'PYTH'].filter(t => tokens.some(token => token.symbol === t)).length >= 3
  );
  
  // Select best provider based on characteristics
  if (allStablecoins || poolType === 'stable') {
    return optimizeWithOpenAI(request); // OpenAI is best for stablecoin pools
  } else if (hasHighVolatilityTokens && (riskTolerance === 'high' || riskTolerance === 'medium')) {
    return optimizeWithXAI(request); // xAI is best for high volatility tokens and higher risk tolerance
  } else if (isEcosystemFocused) {
    return optimizeWithGemini(request); // Gemini is best for ecosystem-focused pools
  } else {
    return optimizeWithOpenAI(request); // Default to OpenAI
  }
}

/**
 * Simulate a pool with the given parameters to determine expected performance
 */
export async function simulatePoolPerformance(
  tokenWeights: Record<string, number>,
  poolType: 'stable' | 'weighted' | 'stable-balanced',
  initialLiquidity: number,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<{
  expectedVolume: number;
  estimatedFees: number;
  impermanentLoss: number;
  netAPR: number;
  tokenPerformance: Record<string, { 
    priceChange: number;
    contribution: number;
  }>;
}> {
  try {
    // Get token symbols from weights
    const tokens = Object.keys(tokenWeights);
    
    // Simulate price changes over the specified timeframe
    const priceChanges = await simulatePriceChanges(tokens, timeframe);
    
    // Calculate impermanent loss based on price changes
    const impermanentLoss = calculateImpermanentLoss(tokenWeights, priceChanges);
    
    // Estimate trading volume based on token composition and liquidity
    const expectedVolume = await estimatePoolVolume(tokens, poolType, initialLiquidity, timeframe);
    
    // Calculate estimated fees based on volume and pool type
    const feeRate = poolType === 'stable' ? 0.01 : poolType === 'weighted' ? 0.3 : 0.15; // Percentage
    const estimatedFees = expectedVolume * (feeRate / 100);
    
    // Calculate net APR
    const netAPR = calculateNetAPR(estimatedFees, impermanentLoss, initialLiquidity, timeframe);
    
    // Calculate token performance
    const tokenPerformance: Record<string, { priceChange: number; contribution: number }> = {};
    
    for (const token of tokens) {
      const priceChange = priceChanges[token] || 0;
      const weight = tokenWeights[token] / 100; // Convert from percentage to decimal
      
      // Contribution to pool performance is based on weight and price change
      const contribution = weight * (priceChange > 0 ? priceChange : 0) * (1 - impermanentLoss);
      
      tokenPerformance[token] = {
        priceChange,
        contribution
      };
    }
    
    return {
      expectedVolume,
      estimatedFees,
      impermanentLoss,
      netAPR,
      tokenPerformance
    };
  } catch (error) {
    console.error("Error simulating pool performance:", error);
    
    // Return fallback performance metrics
    const tokens = Object.keys(tokenWeights);
    const tokenPerformance: Record<string, { priceChange: number; contribution: number }> = {};
    
    for (const token of tokens) {
      tokenPerformance[token] = {
        priceChange: 0,
        contribution: tokenWeights[token] / 100 / tokens.length
      };
    }
    
    return {
      expectedVolume: initialLiquidity * 0.15,
      estimatedFees: initialLiquidity * 0.005,
      impermanentLoss: poolType === 'stable' ? 0.002 : 0.02,
      netAPR: poolType === 'stable' ? 3.5 : 8.5,
      tokenPerformance
    };
  }
}

/**
 * Calculate optimal rebalancing strategy for the pool
 */
export async function calculateRebalancingStrategy(
  tokens: string[],
  initialWeights: Record<string, number>,
  poolType: 'stable' | 'weighted' | 'stable-balanced'
): Promise<{
  recommendedInterval: 'hourly' | 'daily' | 'weekly';
  thresholds: {
    priceDeviation: number;
    volumeSpike: number;
    weightDrift: number;
  };
  gasOptimization: {
    lowFeeWindows: string[];
    maxGasPrice: number;
  };
}> {
  try {
    // Default values
    let recommendedInterval: 'hourly' | 'daily' | 'weekly' = 'daily';
    let priceDeviation = 0.05; // 5%
    let volumeSpike = 3; // 3x normal volume
    let weightDrift = 0.1; // 10% drift in weights
    
    // Get volatility data for tokens
    const volatilityData: Record<string, number> = {};
    for (const token of tokens) {
      volatilityData[token] = await getTokenVolatility(token);
    }
    
    // Average volatility of the pool
    const totalVolatility = Object.values(volatilityData).reduce((a, b) => a + b, 0);
    const avgVolatility = totalVolatility / tokens.length;
    
    // Adjust parameters based on pool type and volatility
    if (poolType === 'stable') {
      // Stable pools need more frequent rebalancing but smaller thresholds
      recommendedInterval = 'daily';
      priceDeviation = 0.01; // 1% for stablecoins
      volumeSpike = 5; // More sensitive to volume spikes
      weightDrift = 0.05; // 5% weight drift
      
    } else if (poolType === 'weighted') {
      // Weighted pools based on volatility
      if (avgVolatility > 0.03) {
        // High volatility pools
        recommendedInterval = 'daily';
        priceDeviation = 0.08; // 8%
        weightDrift = 0.15; // 15% weight drift
      } else {
        // Lower volatility pools
        recommendedInterval = 'weekly';
        priceDeviation = 0.05; // 5%
        weightDrift = 0.1; // 10% weight drift
      }
      
    } else if (poolType === 'stable-balanced') {
      // Hybrid pools
      recommendedInterval = 'daily';
      priceDeviation = 0.03; // 3%
      weightDrift = 0.08; // 8% weight drift
    }
    
    return {
      recommendedInterval,
      thresholds: {
        priceDeviation,
        volumeSpike,
        weightDrift
      },
      gasOptimization: {
        lowFeeWindows: ["00:00-04:00 UTC", "13:00-15:00 UTC", "19:00-21:00 UTC"],
        maxGasPrice: 20 // Gwei
      }
    };
    
  } catch (error) {
    console.error("Error calculating rebalancing strategy:", error);
    
    // Return default rebalancing strategy
    return {
      recommendedInterval: 'daily',
      thresholds: {
        priceDeviation: 0.05, // 5%
        volumeSpike: 3, // 3x normal volume
        weightDrift: 0.1 // 10% drift in weights
      },
      gasOptimization: {
        lowFeeWindows: ["00:00-04:00 UTC", "13:00-15:00 UTC", "19:00-21:00 UTC"],
        maxGasPrice: 20 // Gwei
      }
    };
  }
}

function createEqualWeights(tokens: Array<{ symbol: string; price: number; marketCap?: number; volume24h?: number; volatility?: number; }>): Record<string, number> {
  const equalWeight = 100 / tokens.length;
  
  return tokens.reduce<Record<string, number>>((acc, token) => {
    acc[token.symbol] = parseFloat(equalWeight.toFixed(2));
    return acc;
  }, {});
}

/**
 * Estimate base APR based on pool type
 */
function estimateBaseAPR(poolType: 'stable' | 'weighted' | 'stable-balanced'): number {
  switch (poolType) {
    case 'stable':
      return 4.5; // Base APR for stable pools
    case 'weighted':
      return 9.5; // Base APR for weighted pools
    case 'stable-balanced':
      return 6.5; // Base APR for hybrid pools
    default:
      return 5.0; // Default value
  }
}

/**
 * Enrich token data with additional market information
 */
async function enrichTokenData(tokens: Array<{
  symbol: string;
  price: number;
  marketCap?: number;
  volume24h?: number;
  volatility?: number;
}>): Promise<Array<{
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  volatility: number;
}>> {
  const enrichedTokens = [...tokens];
  
  for (const token of enrichedTokens) {
    // Add marketCap if not present
    if (!token.marketCap) {
      try {
        token.marketCap = await getTokenMarketCap(token.symbol);
      } catch (err) {
        token.marketCap = 0;
      }
    }
    
    // Add 24h volume if not present
    if (!token.volume24h) {
      try {
        token.volume24h = await getToken24hVolume(token.symbol);
      } catch (err) {
        token.volume24h = 0;
      }
    }
    
    // Add volatility if not present
    if (!token.volatility) {
      try {
        token.volatility = await getTokenVolatility(token.symbol);
      } catch (err) {
        token.volatility = 0.01; // Default low volatility
      }
    }
  }
  
  return enrichedTokens as Array<{
    symbol: string;
    price: number;
    marketCap: number;
    volume24h: number;
    volatility: number;
  }>;
}

/**
 * Calculate impermanent loss based on price changes
 */
function calculateImpermanentLoss(weights: Record<string, number>, priceChanges: Record<string, number>): number {
  let hodlValue = 0;
  let poolValue = 0;
  
  // Calculate value if holding tokens separately
  for (const token in weights) {
    const weight = weights[token] / 100; // Convert percentage to decimal
    const priceChange = 1 + (priceChanges[token] || 0);
    hodlValue += weight * priceChange;
  }
  
  // Calculate value if holding in a pool
  const productTerm = Object.keys(weights).reduce((product, token) => {
    const weight = weights[token] / 100;
    const priceChange = 1 + (priceChanges[token] || 0);
    return product * Math.pow(priceChange, weight);
  }, 1);
  
  poolValue = productTerm;
  
  // Calculate impermanent loss
  const impermanentLoss = (poolValue / hodlValue) - 1;
  
  // Return as positive value (as it's typically a loss)
  return Math.max(0, -impermanentLoss);
}

/**
 * Calculate net APR based on fees, impermanent loss, and timeframe
 */
function calculateNetAPR(fees: number, impermanentLoss: number, liquidity: number, timeframe: 'day' | 'week' | 'month'): number {
  // Convert fees to annual
  let annualizationFactor = 0;
  
  if (timeframe === 'day') {
    annualizationFactor = 365;
  } else if (timeframe === 'week') {
    annualizationFactor = 52;
  } else if (timeframe === 'month') {
    annualizationFactor = 12;
  }
  
  const annualFees = fees * annualizationFactor;
  
  // Convert impermanent loss to annual estimate
  const annualImpermanentLoss = impermanentLoss * liquidity * annualizationFactor;
  
  // Calculate net APR
  const netAPR = ((annualFees - annualImpermanentLoss) / liquidity) * 100;
  
  return Math.max(0, netAPR);
}

/**
 * Estimate trading volume for a given pool
 */
async function estimatePoolVolume(
  tokens: string[],
  poolType: 'stable' | 'weighted' | 'stable-balanced',
  liquidity: number,
  timeframe: 'day' | 'week' | 'month'
): Promise<number> {
  // Base volume is a percentage of liquidity
  let baseVolumeRatio = 0;
  
  switch (poolType) {
    case 'stable':
      baseVolumeRatio = 0.15; // 15% daily volume for stable pools
      break;
    case 'weighted':
      baseVolumeRatio = 0.25; // 25% daily volume for weighted pools
      break;
    case 'stable-balanced':
      baseVolumeRatio = 0.2; // 20% daily volume for hybrid pools
      break;
    default:
      baseVolumeRatio = 0.15;
  }
  
  // Adjust for timeframe
  if (timeframe === 'week') {
    baseVolumeRatio *= 5; // Weekly volume is about 5x daily, not 7x due to weekend slowdown
  } else if (timeframe === 'month') {
    baseVolumeRatio *= 20; // Monthly volume is about 20x daily, not 30x due to varying activity
  }
  
  // Calculate expected volume
  let volumeMultiplier = 1.0;
  
  // Popular token combinations increase volume
  const majorTokenCount = tokens.filter(t => ['SOL', 'BTC', 'ETH', 'USDC', 'USDT'].includes(t)).length;
  if (majorTokenCount >= 2) {
    volumeMultiplier *= 1.5;
  }
  
  // Meme tokens can increase volume temporarily
  const memeTokenCount = tokens.filter(t => ['BONK', 'WIF'].includes(t)).length;
  if (memeTokenCount > 0) {
    volumeMultiplier *= 1.3;
  }
  
  // Final volume calculation
  return liquidity * baseVolumeRatio * volumeMultiplier;
}