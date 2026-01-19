import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCache, setCache } from '@/src/lib/redis';

// Define the OpenRouter API URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Define the model to use
const MODEL = 'meta-llama/llama-4-scout:free';

// Define the system prompt for business health analysis
const SYSTEM_PROMPT = `You are an expert financial analyst and business consultant. Your task is to analyze financial data and provide a comprehensive business health assessment.

IMPORTANT: Your response MUST be a valid JSON object with NO additional text, explanations, or markdown formatting. Do not include any text before or after the JSON object.

Please analyze the provided financial data and generate a JSON object with the following structure:
{
  "healthScore": 0-100,  // Overall business health score
  "healthTrend": number,  // Trend indicator (-1 to 1)
  "issues": [
    {
      "title": "string",
      "description": "string",
      "priority": "high|medium|low",
      "category": "string",
      "impact": "string",
      "recommendations": ["string"]
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "timeframe": "30-days|3-6-months|6-12-months",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "category": "string"
    }
  ]
}

Guidelines:
1. Return ONLY the JSON object with no additional text
2. Do not include markdown formatting (no triple backticks)
3. Ensure all fields are properly escaped
4. Include at least 3-5 issues and recommendations
5. Use consistent category names throughout`;

// Enhanced financial data for more realistic insights
const SAMPLE_FINANCIAL_DATA = {
  revenue: {
    current: 1450000,
    previous: 1250000,
    trend: 0.16,
    quarterlyTrend: [1150000, 1250000, 1350000, 1450000]
  },
  expenses: {
    current: 1180000,
    previous: 950000,
    trend: 0.242,
    quarterlyTrend: [850000, 950000, 1050000, 1180000],
    breakdown: {
      cogs: 680000,
      marketing: 120000,
      salaries: 250000,
      rent: 45000,
      software: 35000,
      other: 50000
    }
  },
  profit: {
    current: 270000,
    previous: 300000,
    trend: -0.1,
    quarterlyTrend: [300000, 300000, 300000, 270000]
  },
  cashFlow: {
    current: 180000,
    previous: 250000,
    trend: -0.28,
    operatingCashFlow: 320000,
    investingCashFlow: -90000,
    financingCashFlow: -50000
  },
  accountsReceivable: {
    current: 520000,
    previous: 380000,
    trend: 0.368,
    agingBuckets: {
      "0-30": 220000,
      "31-60": 150000,
      "61-90": 100000,
      "90+": 50000
    }
  },
  accountsPayable: {
    current: 380000,
    previous: 280000,
    trend: 0.357
  },
  inventory: {
    current: 620000,
    previous: 520000,
    trend: 0.192,
    turnoverRate: 4.2,
    previousTurnoverRate: 5.1
  },
  customerConcentration: {
    top3Percentage: 48,
    previousTop3Percentage: 35,
    top3Customers: [
      { name: "Enterprise Corp", revenue: 350000, growth: 0.25 },
      { name: "Mega Industries", revenue: 220000, growth: 0.15 },
      { name: "Tech Solutions Inc", revenue: 126000, growth: 0.05 }
    ]
  },
  ratios: {
    currentRatio: 1.05,
    previousCurrentRatio: 1.32,
    quickRatio: 0.72,
    previousQuickRatio: 0.95,
    debtToEquity: 1.68,
    previousDebtToEquity: 1.38,
    grossMargin: 0.28,
    previousGrossMargin: 0.36,
    netMargin: 0.186,
    previousNetMargin: 0.24,
    dso: 42, // Days Sales Outstanding
    previousDso: 35
  },
  marketData: {
    industryAverageGrossMargin: 0.34,
    industryAverageNetMargin: 0.22,
    industryAverageCurrentRatio: 1.5,
    competitorGrowthRates: [0.08, 0.12, 0.15, 0.09]
  }
};

// Default error response in case API call fails
const ERROR_RESPONSE = {
  healthScore: 0,
  healthTrend: 0,
  issues: [],
  recommendations: []
};

// Generate a cache key based on the request data
function generateCacheKey(data: any): string {
  const { model, financialData } = data;
  const dataHash = JSON.stringify(financialData || SAMPLE_FINANCIAL_DATA);
  return `business-health:${model}:${Buffer.from(dataHash).toString('base64').slice(0, 64)}`;
}

// Function to calculate health score based on financial data
function calculateHealthScore(data: any, isReset: boolean = false) {
  if (isReset) {
    return {
      healthScore: 0,
      healthTrend: 0,
      issues: [],
      recommendations: []
    };
  }

  // Calculate base score based on financial metrics
  let score = 50; // Start with a neutral score
  
  // Adjust based on profitability (40% weight)
  const profitMargin = (data.profit.current / data.revenue.current) * 100;
  const profitMarginIndustryAvg = (data.marketData.industryAverageNetMargin * 100);
  const profitScore = (profitMargin / profitMarginIndustryAvg) * 40;
  
  // Adjust based on liquidity (30% weight)
  const currentRatioScore = (data.ratios.currentRatio / data.marketData.industryAverageCurrentRatio) * 15;
  const quickRatioScore = (data.ratios.quickRatio / 1.0) * 15; // Assuming 1.0 is target quick ratio
  
  // Adjust based on efficiency (20% weight)
  const dsoScore = (data.ratios.previousDso / Math.max(1, data.ratios.dso)) * 10; // Lower DSO is better
  const inventoryTurnoverScore = (data.inventory.turnoverRate / data.inventory.previousTurnoverRate) * 10;
  
  // Adjust based on growth (10% weight)
  const revenueGrowthScore = data.revenue.trend * 5;
  const profitGrowthScore = (data.profit.trend > 0 ? 1 : -1) * 5;
  
  // Calculate final score (0-100)
  score = Math.max(0, Math.min(100, 
    profitScore + 
    currentRatioScore + 
    quickRatioScore + 
    dsoScore + 
    inventoryTurnoverScore + 
    revenueGrowthScore + 
    profitGrowthScore
  ));
  
  // Calculate trend (simplified for this example)
  const trend = (data.revenue.trend * 0.6) + (data.profit.trend * 0.4);
  
  return {
    healthScore: Math.round(score),
    healthTrend: parseFloat(trend.toFixed(2)),
    issues: [],
    recommendations: []
  };
}

export async function POST(request: Request) {
  try {
    // Parse the request body once
    const requestData = await request.json();
    const model = requestData.model || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'meta-llama/llama-4-scout:free';
    const isReset = requestData.reset === true;
    
    // If this is a reset request, return zeros immediately
    if (isReset) {
      console.log('Reset request received, returning zeroed health data');
      return NextResponse.json({
        healthScore: 0,
        healthTrend: 0,
        issues: [],
        recommendations: []
      });
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey({
      model,
      financialData: requestData.financialData || SAMPLE_FINANCIAL_DATA
    });
    
    // Try to get cached response
    const cachedResponse = await getCache(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response');
      return NextResponse.json(cachedResponse);
    }
    
    console.log('Request received with model:', model);
    
    // Debug log environment variables
    console.log('Available environment variables:', {
      NEXT_PUBLIC_OPENROUTER_INSIGHTS_KEY: process.env.NEXT_PUBLIC_OPENROUTER_INSIGHTS_KEY ? '***' : 'Not set',
      NEXT_PUBLIC_OPENROUTER_CHAT_KEY: process.env.NEXT_PUBLIC_OPENROUTER_CHAT_KEY ? '***' : 'Not set',
      NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? '***' : 'Not set',
      NEXT_PUBLIC_DEFAULT_MODEL: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'Not set'
    });
    
    // Determine which API key to use based on the model
    let apiKey: string | undefined;
    
    if (model.includes('deepseek')) {
      apiKey = process.env.NEXT_PUBLIC_OPENROUTER_CHAT_KEY;
      console.log('Using DeepSeek API key');
    } else if (model.includes('llama')) {
      apiKey = process.env.NEXT_PUBLIC_OPENROUTER_INSIGHTS_KEY;
      console.log('Using Llama API key');
    } else {
      // Fallback to default OPENROUTER_API_KEY if set
      apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      console.log('Using default API key');
    }
    
    // If no API key is available, return error
    if (!apiKey) {
      const errorMsg = `No API key found for model: ${model}. Please check your environment variables.`;
      console.error('API Key Error:', errorMsg);
      console.log('Available environment variables:', {
        NEXT_PUBLIC_OPENROUTER_INSIGHTS_KEY: process.env.NEXT_PUBLIC_OPENROUTER_INSIGHTS_KEY ? '***' : 'Not set',
        NEXT_PUBLIC_OPENROUTER_CHAT_KEY: process.env.NEXT_PUBLIC_OPENROUTER_CHAT_KEY ? '***' : 'Not set',
        NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? '***' : 'Not set',
        NEXT_PUBLIC_DEFAULT_MODEL: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'Not set'
      });
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }
    
    // Use financial data from request or fallback to sample data
    const financialData = requestData.financialData || SAMPLE_FINANCIAL_DATA;
    
    // Prepare the request payload with model-specific parameters
    const openRouterRequest: any = {
      model: model,
      temperature: 0.3, // Lower temperature for more focused responses
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Analyze the following financial data and provide a business health assessment. Focus on key metrics like revenue growth (${(financialData.revenue.trend * 100).toFixed(1)}%), 
          profit margins (${((financialData.profit.current / financialData.revenue.current) * 100).toFixed(1)}%), 
          cash flow (${financialData.cashFlow.current.toLocaleString()}), 
          and any concerning trends.\n\nFinancial Data:\n${JSON.stringify(financialData, null, 2)}`
        }
      ]
    };

    // Only add response_format for models that support it
    if (!model.includes('meta-llama') && !model.includes('llama')) {
      openRouterRequest.response_format = { type: 'json_object' };
    }

    console.log(`Calling OpenRouter API with model: ${model}`);
    console.log('Request payload:', JSON.stringify(openRouterRequest, null, 2));
    
    // Call the OpenRouter API
    let response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Financial Analytics App'
      },
        body: JSON.stringify(openRouterRequest)
      });
      
      console.log(`API Response Status: ${response.status} ${response.statusText}`);
      
      // Log response headers for debugging
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('Response Headers:', responseHeaders);
    } catch (error) {
      console.error('Network error calling OpenRouter API:', error);
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      
      // If rate limited, return mock data instead of throwing an error
      if (response.status === 429) {
        console.log('Rate limit exceeded - returning mock data');
        
        const mockData = {
          healthScore: 42,
          healthTrend: -0.15,
          issues: [
            {
              id: 'mock-1',
              title: 'High Expenses',
              description: 'Your expenses have increased by 24% compared to last month.',
              priority: 'high',
              category: 'Expenses',
              impact: 'High',
              recommendations: ['Review and optimize recurring expenses', 'Negotiate with suppliers for better rates'],
              dateDetected: new Date().toISOString()
            },
            {
              id: 'mock-2',
              title: 'Declining Revenue',
              description: 'Revenue has decreased by 15% compared to last quarter.',
              priority: 'medium',
              category: 'Revenue',
              impact: 'High',
              recommendations: ['Launch marketing campaign', 'Introduce new products/services'],
              dateDetected: new Date().toISOString()
            }
          ],
          recommendations: [
            {
              id: 'rec-1',
              title: 'Expense Review',
              description: 'Conduct a thorough review of all expenses to identify areas for cost reduction.',
              timeframe: '30-days',
              impact: 'high',
              effort: 'medium',
              category: 'Finance',
              dateGenerated: new Date().toISOString()
            },
            {
              id: 'rec-2',
              title: 'Revenue Growth Strategy',
              description: 'Develop and implement strategies to boost revenue, such as upselling or expanding to new markets.',
              timeframe: '3-6-months',
              impact: 'high',
              effort: 'high',
              category: 'Strategy',
              dateGenerated: new Date().toISOString()
            }
          ]
        };
        
        // Cache the mock data
        await setCache(cacheKey, mockData);
        return NextResponse.json(mockData);
      }
      
      // For other errors, throw the error
      throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
    }
    
    // Parse the response as JSON
    let data;
    try {
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error('Error reading API response:', error);
      throw new Error(`Failed to process API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Extract the AI response
    let aiResponse;
    try {
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('No choices in API response');
      }
      
      aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Empty AI response content');
      }
      
      if (!aiResponse) {
        throw new Error('Empty response from AI');
      }
      
      console.log('Raw AI Response:', aiResponse);
      
      // Parse the AI response and ensure it's valid JSON
      let parsedResponse;
      let responseToParse = aiResponse.trim();
      
      // First, calculate the health score based on financial data
      const financialData = requestData.financialData || SAMPLE_FINANCIAL_DATA;
      const calculatedHealth = calculateHealthScore(financialData);
      
      try {
        // Try to parse the response directly first
        parsedResponse = JSON.parse(responseToParse);
      } catch (e) {
        // If direct parse fails, try to extract JSON from markdown code blocks
        const jsonMatch = responseToParse.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedResponse = JSON.parse(jsonMatch[1]);
          } catch (innerError) {
            console.error('Failed to parse JSON from markdown:', innerError);
            // Fall back to calculated health score if parsing fails
            return NextResponse.json(calculatedHealth);
          }
        } else {
          // Try to find a JSON object in the response as a last resort
          const jsonObjectMatch = responseToParse.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            try {
              parsedResponse = JSON.parse(jsonObjectMatch[0]);
            } catch (innerError) {
              console.error('Failed to parse JSON object from response:', innerError);
              return NextResponse.json(calculatedHealth);
            }
          } else {
            console.error('No valid JSON found in the response');
            return NextResponse.json(calculatedHealth);
          }
        }
      }
      
      // Ensure the response has the required fields
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        console.warn('Invalid response format: expected an object');
        return NextResponse.json(calculatedHealth);
      }
      
      // Ensure required fields exist with default values
      parsedResponse.healthScore = typeof parsedResponse.healthScore === 'number' ? 
        Math.max(0, Math.min(100, parsedResponse.healthScore)) : calculatedHealth.healthScore;
      
      parsedResponse.healthTrend = typeof parsedResponse.healthTrend === 'number' ? 
        Math.max(-1, Math.min(1, parsedResponse.healthTrend)) : 0;
      
      // Ensure issues and recommendations are arrays
      if (!Array.isArray(parsedResponse.issues)) {
        parsedResponse.issues = [];
      }
      
      if (!Array.isArray(parsedResponse.recommendations)) {
        parsedResponse.recommendations = [];
      }
      
      console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
      
      // Ensure required fields exist
      parsedResponse.healthScore = typeof parsedResponse.healthScore === 'number' ? 
        Math.max(0, Math.min(100, parsedResponse.healthScore)) : 0;
      
      parsedResponse.healthTrend = typeof parsedResponse.healthTrend === 'number' ? 
        Math.max(-1, Math.min(1, parsedResponse.healthTrend)) : 0;
      
      // Ensure issues and recommendations are arrays
      if (!Array.isArray(parsedResponse.issues)) {
        parsedResponse.issues = [];
      }
      
      if (!Array.isArray(parsedResponse.recommendations)) {
        parsedResponse.recommendations = [];
      }
      
      // Add IDs and dates to each item
      parsedResponse.issues = parsedResponse.issues.map((issue: any) => ({
        title: issue.title || 'Unnamed Issue',
        description: issue.description || 'No description provided',
        priority: ['high', 'medium', 'low'].includes(issue.priority?.toLowerCase()) ? 
          issue.priority.toLowerCase() : 'medium',
        category: issue.category || 'General',
        impact: issue.impact || 'Moderate',
        recommendations: Array.isArray(issue.recommendations) ? 
          issue.recommendations : [],
        id: uuidv4(),
        dateDetected: new Date().toISOString()
      }));
      
      parsedResponse.recommendations = parsedResponse.recommendations.map((rec: any) => ({
        title: rec.title || 'Unnamed Recommendation',
        description: rec.description || 'No description provided',
        timeframe: ['30-days', '3-6-months', '6-12-months'].includes(rec.timeframe) ? 
          rec.timeframe : '3-6-months',
        impact: ['high', 'medium', 'low'].includes(rec.impact?.toLowerCase()) ? 
          rec.impact.toLowerCase() : 'medium',
        effort: ['high', 'medium', 'low'].includes(rec.effort?.toLowerCase()) ? 
          rec.effort.toLowerCase() : 'medium',
        category: rec.category || 'General',
        id: uuidv4(),
        dateGenerated: new Date().toISOString()
      }));
      
      // If no issues or recommendations, add some default ones based on calculated health
      if (parsedResponse.issues.length === 0) {
        const defaultIssue = {
          id: uuidv4(),
          title: 'Financial Health Assessment Required',
          description: 'Unable to determine specific issues. A detailed financial analysis is recommended.',
          priority: 'medium',
          category: 'Analysis',
          impact: 'Unknown',
          recommendations: [],
          dateDetected: new Date().toISOString()
        };
        
        // Add health-specific guidance if available
        if (calculatedHealth.healthScore < 40) {
          defaultIssue.title = 'Critical Financial Health Issues Detected';
          defaultIssue.description = 'Your financial health score indicates significant concerns that require immediate attention.';
          defaultIssue.priority = 'high';
          defaultIssue.impact = 'Critical';
        } else if (calculatedHealth.healthScore < 70) {
          defaultIssue.title = 'Moderate Financial Health Concerns';
          defaultIssue.description = 'Your financial health shows some areas of concern that should be addressed.';
          defaultIssue.priority = 'medium';
          defaultIssue.impact = 'Moderate';
        }
        
        parsedResponse.issues.push(defaultIssue);
      }
      
      if (parsedResponse.recommendations.length === 0) {
        parsedResponse.recommendations.push({
          id: uuidv4(),
          title: 'Conduct Comprehensive Financial Review',
          description: 'Perform a detailed review of all financial statements and cash flow to identify areas of concern.',
          timeframe: '30-days',
          impact: 'high',
          effort: 'medium',
          category: 'Financial Management',
          dateGenerated: new Date().toISOString()
        });
      }
      
      // Cache the successful response
      await setCache(cacheKey, parsedResponse);
      
      return NextResponse.json(parsedResponse);
      
    } catch (error) {
      console.error('Failed to process AI response:', error);
      console.error('AI response was:', aiResponse);
      
      // Return a fallback response with error details
      const fallbackResponse = {
        healthScore: 0,
        healthTrend: 0,
        issues: [{
          id: uuidv4(),
          title: 'Error Processing AI Response',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          priority: 'high',
          category: 'System Error',
          impact: 'Critical',
          recommendations: [{
            id: uuidv4(),
            title: 'Check AI Service Status',
            description: 'Verify that the AI service is running and properly configured.',
            timeframe: 'immediate',
            impact: 'high',
            effort: 'low',
            category: 'Technical',
            dateGenerated: new Date().toISOString()
          }],
          dateDetected: new Date().toISOString()
        }],
        recommendations: [{
          id: uuidv4(),
          title: 'Contact Support',
          description: 'Reach out to technical support with the error details.',
          timeframe: 'immediate',
          impact: 'high',
          effort: 'low',
          category: 'Support',
          dateGenerated: new Date().toISOString()
        }]
      };
      
      return NextResponse.json(fallbackResponse, { status: 200 });
    }
  } catch (error) {
    console.error('Error in business health API route:', error);
    
    // Return a well-formed error response with CORS headers
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API Error:', errorMessage);
    
    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
