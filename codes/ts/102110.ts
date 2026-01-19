import { Product } from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Takes a stratified sample from a product array to ensure representative analysis
 * @param products Array of products to sample from
 * @param maxSampleSize Maximum number of products to include in sample
 * @returns Representative sample of products
 */
function stratifySampleProducts(products: Product[], maxSampleSize: number): Product[] {
  if (products.length <= maxSampleSize) {
    return [...products]; // Return all products if fewer than the max sample size
  }
  
  const sampleSize = Math.min(maxSampleSize, products.length);
  const result: Product[] = [];
  
  // Take samples from beginning, middle, and end to get a representative sample
  const beginning = Math.floor(sampleSize * 0.4); // 40% from beginning
  const middle = Math.floor(sampleSize * 0.3);    // 30% from middle
  const end = sampleSize - beginning - middle;    // 30% from end
  
  // Get beginning samples
  for (let i = 0; i < beginning; i++) {
    result.push(products[i]);
  }
  
  // Get middle samples
  const middleStartIndex = Math.floor((products.length - middle) / 2);
  for (let i = 0; i < middle; i++) {
    result.push(products[middleStartIndex + i]);
  }
  
  // Get end samples
  const endStartIndex = products.length - end;
  for (let i = 0; i < end; i++) {
    result.push(products[endStartIndex + i]);
  }
  
  return result;
}

/**
 * Analyzes product data to detect product types and suggest enhancements
 * @param products List of products to analyze
 * @returns Analysis results with product types and enhancement suggestions
 */
export async function analyzeProductTypes(products: Product[]): Promise<{
  productTypes: string[];
  enhancementSuggestions: string[];
  commonMissingFields: { field: string; percentage: number }[];
}> {
  if (!products || products.length === 0) {
    return {
      productTypes: [],
      enhancementSuggestions: [],
      commonMissingFields: []
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("No OpenAI API key found for product type detection");
      // Fallback to basic analysis without AI
      return fallbackProductAnalysis(products);
    }

    // Get a larger sample of products (max 25) for better analysis
    // For very large datasets, we'll stratify the sample by taking products from beginning, middle and end
    const sampleProducts = stratifySampleProducts(products, 25);
    
    // Generate JSON prompt for OpenAI with more specific instructions for better analysis
    const prompt = `
      Analyze the following product data with these objectives:
      
      1. Identify the main product types/categories represented in these items
         - Be specific about product types and their distinguishing characteristics
         - Group similar items under appropriate category names
      
      2. Suggest specific enhancements that would improve these listings for e-commerce success:
         - Identify patterns of missing or weak content that could be improved
         - Provide actionable suggestions tailored to this specific product dataset
         - Consider SEO optimization, conversion best practices, and competitive differentiation
         - Focus on high-impact improvements that would make these listings more compelling
      
      3. Identify the most commonly missing or incomplete fields across listings:
         - Calculate the approximate percentage of listings missing each field
         - Prioritize fields by importance for marketplace success
         - Explain the impact of each missing field on listing performance
      
      Products dataset:
      ${JSON.stringify(sampleProducts, null, 2)}
      
      Provide your detailed analysis in JSON format with these fields:
      - productTypes: Array of product type/category names
      - enhancementSuggestions: Array of specific, actionable suggestions for improving these listings
      - commonMissingFields: Array of objects containing {field: string, percentage: number, impact: string} representing fields that are often missing or incomplete
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a senior e-commerce product data expert specializing in marketplace optimization and product listing enhancement. You have extensive knowledge of what makes product listings perform well on platforms like Amazon, eBay, Etsy, and Walmart."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500 // Increased for more detailed analysis
    });

    // Parse and return the analysis results
    const analysisResults = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      productTypes: analysisResults.productTypes || [],
      enhancementSuggestions: analysisResults.enhancementSuggestions || [],
      commonMissingFields: analysisResults.commonMissingFields || []
    };
  } catch (error) {
    console.error("Error analyzing product types:", error);
    
    // Try using Gemini API as fallback if OpenAI fails
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        console.log("Attempting to use Gemini API for product analysis");
        // Use Gemini for analysis (fallback)
        return await geminiProductAnalysis(products);
      }
    } catch (geminiError) {
      console.error("Gemini fallback also failed:", geminiError);
    }
    
    // If all AI methods fail, use basic analysis
    return fallbackProductAnalysis(products);
  }
}

/**
 * Attempts to analyze products using Gemini API
 * @param products List of products to analyze
 * @returns Analysis results
 */
async function geminiProductAnalysis(products: Product[]): Promise<{
  productTypes: string[];
  enhancementSuggestions: string[];
  commonMissingFields: { field: string; percentage: number }[];
}> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("No Gemini API key available");
  }
  
  try {
    // Sample the products
    const sampleProducts = stratifySampleProducts(products, 20);
    
    const prompt = `
      Analyze these product listings to identify:
      1. Main product types/categories
      2. Specific enhancement suggestions for these listings
      3. Commonly missing fields with approximate percentages
      
      Products: ${JSON.stringify(sampleProducts, null, 2)}
      
      Respond in JSON format with: 
      {
        "productTypes": ["type1", "type2"],
        "enhancementSuggestions": ["suggestion1", "suggestion2"],
        "commonMissingFields": [{"field": "name", "percentage": 50}]
      }
    `;
    
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    const response = await fetch(`${apiUrl}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    let analysisText = "";
    
    if (data.candidates && data.candidates.length > 0) {
      analysisText = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Empty response from Gemini");
    }
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }
    
    const analysisResults = JSON.parse(jsonMatch[0]);
    
    return {
      productTypes: analysisResults.productTypes || [],
      enhancementSuggestions: analysisResults.enhancementSuggestions || [],
      commonMissingFields: analysisResults.commonMissingFields || []
    };
  } catch (error) {
    console.error("Error using Gemini for product analysis:", error);
    throw error; // Let the caller handle the fallback
  }
}

/**
 * Fallback method when AI analysis is not available
 * @param products List of products to analyze
 * @returns Enhanced analysis results with detailed insights
 */
function fallbackProductAnalysis(products: Product[]): {
  productTypes: string[];
  enhancementSuggestions: string[];
  commonMissingFields: { field: string; percentage: number }[];
} {
  // Count categories to determine product types
  const categoryCount: Record<string, number> = {};
  
  // Track missing fields
  const missingFieldsCount: Record<string, number> = {
    title: 0,
    description: 0,
    price: 0,
    brand: 0,
    category: 0,
    images: 0,
    bullet_points: 0,
    keywords: 0,
    dimensions: 0,
    weight: 0
  };
  
  // Track quality issues
  const qualityIssues: Record<string, number> = {
    short_title: 0,
    short_description: 0,
    missing_dimensions: 0,
    generic_title: 0
  };
  
  // Analyze each product
  products.forEach(product => {
    // Count categories
    if (product.category) {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    }
    
    // Check for missing fields
    if (!product.title || product.title.trim() === '') missingFieldsCount.title++;
    if (!product.description || product.description.trim() === '') missingFieldsCount.description++;
    if (!product.price) missingFieldsCount.price++;
    if (!product.brand || product.brand.trim() === '') missingFieldsCount.brand++;
    if (!product.category || product.category.trim() === '') missingFieldsCount.category++;
    if (!product.images || product.images.length === 0) missingFieldsCount.images++;
    if (!product.bullet_points || product.bullet_points.length === 0) missingFieldsCount.bullet_points++;
    
    // Check for quality issues
    if (product.title && product.title.length < 20) qualityIssues.short_title++;
    if (product.description && product.description.length < 100) qualityIssues.short_description++;
    if (product.title && product.title.toLowerCase().includes('product')) qualityIssues.generic_title++;
  });
  
  // Get top categories
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);
  
  // Calculate missing field percentages
  const totalProducts = products.length;
  const missingFieldsPercentage = Object.entries(missingFieldsCount)
    .map(([field, count]) => ({
      field,
      percentage: Math.round((count / totalProducts) * 100)
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
  
  // Generate more detailed enhancement suggestions based on actual issues found
  const suggestions = [
    "Add more descriptive product titles with key features and benefits",
    "Ensure all products have detailed descriptions of at least 200 characters",
    "Include high-quality product images from multiple angles",
    "Add bullet points highlighting key product features and benefits",
    "Ensure all products have accurate and competitive pricing information",
    "Add specific dimensions, weights, and measurements where applicable",
    "Use brand names consistently across all products in the same category"
  ];
  
  // Add specific suggestions based on detected issues
  if (qualityIssues.short_title > 0) {
    const percentage = Math.round((qualityIssues.short_title / totalProducts) * 100);
    if (percentage > 20) {
      suggestions.push(`Improve ${percentage}% of product titles that are too short (less than 20 characters)`);
    }
  }
  
  if (qualityIssues.short_description > 0) {
    const percentage = Math.round((qualityIssues.short_description / totalProducts) * 100);
    if (percentage > 20) {
      suggestions.push(`Enhance ${percentage}% of product descriptions that lack detail (less than 100 characters)`);
    }
  }
  
  if (qualityIssues.generic_title > 0) {
    const percentage = Math.round((qualityIssues.generic_title / totalProducts) * 100);
    if (percentage > 10) {
      suggestions.push(`Replace generic titles (containing "product") with specific, feature-rich titles in ${percentage}% of listings`);
    }
  }
  
  return {
    productTypes: sortedCategories.length > 0 ? sortedCategories : ["Uncategorized Products"],
    enhancementSuggestions: suggestions,
    commonMissingFields: missingFieldsPercentage
  };
}