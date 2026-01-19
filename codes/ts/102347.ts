"use server"

import { GoogleGenAI } from "@google/genai"

export type ProductImageAnalysis = {
  productType: string
  exactColors: string[]
  materials: string[]
  shape: string
  dimensions: string
  brandingElements: string[]
  uniqueFeatures: string[]
  packaging: string
  fullDescription: string
  marketingHighlights: string[]
  visualAppearance: {
    mainColor: string
    secondaryColors: string[]
    texture: string
    finish: string
    transparency?: string
    patterns?: string[]
    colorHexCodes?: {
      [key: string]: string // Maps color name to hex code
    }
  }
  productDetails: {
    category: string
    subcategory: string
    intendedUse: string
    targetAudience?: string
    size?: string
    weight?: string
  }
  visualElements: {
    logo?: {
      position: string
      description: string
    }
    text?: string[]
    designFeatures: string[]
  }
  // New detailed sections
  detailedParts: {
    [key: string]: {
      description: string
      exactColors: string[]
      texture: string
      shape: string
      details: string[]
      position: string
    }
  }
  colorProfile: {
    dominantColors: {
      name: string
      hexCode: string
      percentage: number
    }[]
    colorRelationships: string
    colorAccuracy: string
  }
  preciseDetails: {
    edges: string
    highlights: string
    shadows: string
    reflections: string
    transparentAreas: string[]
  }
}

export async function analyzeProductImage(imageBase64: string): Promise<ProductImageAnalysis> {
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "" })

    // Clean the base64 string if it includes the data URL prefix
    let cleanImageBase64 = imageBase64
    if (cleanImageBase64.includes("base64,")) {
      cleanImageBase64 = cleanImageBase64.split("base64,")[1]
    }

    // Create a much more detailed prompt for Gemini to analyze the product image
    const prompt = `
Analyze this product image with EXTREME DETAIL and provide a COMPREHENSIVE JSON description. Your analysis must be hyper-precise, capturing every visual element, color nuance, and detail visible in the image.

Return the following JSON structure with maximum detail:

{
  "productType": "Extremely specific product type and category",
  "exactColors": ["List ALL exact color names with precise descriptions", "e.g., 'vibrant tangerine orange' not just 'orange'", "include ALL colors visible in the product"],
  "materials": ["Comprehensive list of ALL materials visible in the product"],
  "shape": "Extremely detailed description of the product shape including all contours and proportions",
  "dimensions": "Precise approximate dimensions or proportions",
  "brandingElements": ["Complete list of ALL visible logos, text, and branding elements"],
  "uniqueFeatures": ["Exhaustive list of ALL distinctive design features"],
  "packaging": "Detailed description of packaging if visible",
  "fullDescription": "A comprehensive 200-250 word description capturing EVERY visual aspect of the product",
  "marketingHighlights": ["5-7 key selling points visible in the image"],
  "visualAppearance": {
    "mainColor": "The dominant color with extremely precise name",
    "secondaryColors": ["ALL other notable colors with extremely precise names"],
    "texture": "Detailed description of the product's texture",
    "finish": "Precise description (matte, glossy, satin, etc.)",
    "transparency": "Detailed description if applicable",
    "patterns": ["Any patterns visible on the product"],
    "colorHexCodes": {
      "color name": "approximate hex code",
      "another color": "approximate hex code"
    }
  },
  "productDetails": {
    "category": "Precise main product category",
    "subcategory": "Specific subcategory",
    "intendedUse": "Detailed description of what the product is used for",
    "targetAudience": "Who would use this product",
    "size": "Size information if visible",
    "weight": "Weight information if visible"
  },
  "visualElements": {
    "logo": {
      "position": "Precise location of the logo",
      "description": "Detailed description of the logo"
    },
    "text": ["ALL visible text on the product, exactly as it appears"],
    "designFeatures": ["ALL notable design elements"]
  },
  "detailedParts": {
    "part1": {
      "name": "Name of this part (e.g., 'lid', 'handle', 'beak', 'eyes', 'face')",
      "description": "Detailed description of this specific part",
      "exactColors": ["Precise color names for this part"],
      "texture": "Texture of this specific part",
      "shape": "Shape description of this part",
      "details": ["List of notable details about this part"],
      "position": "Where this part is located on the product"
    },
    "part2": {
      "name": "Name of another part",
      "description": "Detailed description",
      "exactColors": ["Precise color names"],
      "texture": "Texture description",
      "shape": "Shape description",
      "details": ["Notable details"],
      "position": "Position description"
    }
    // Include entries for EVERY distinct part of the product
  },
  "colorProfile": {
    "dominantColors": [
      {
        "name": "Precise color name",
        "hexCode": "Approximate hex code",
        "percentage": "Approximate percentage of product"
      },
      // Include at least 3-5 dominant colors
    ],
    "colorRelationships": "How the colors relate to each other",
    "colorAccuracy": "Statement about the importance of preserving these exact colors"
  },
  "preciseDetails": {
    "edges": "Description of the edges and borders of the product",
    "highlights": "Description of highlighted areas",
    "shadows": "Description of shadowed areas",
    "reflections": "Description of any reflective properties",
    "transparentAreas": ["List of any transparent or translucent areas"]
  }
}

CRITICAL INSTRUCTIONS:
1. Be OBSESSIVELY PRECISE about colors - use extremely specific color names (e.g., "burnt sienna orange" not just "orange" or "deep midnight navy blue" not just "blue")
2. Include EVERY visible text element on the product, exactly as it appears
3. Be EXHAUSTIVELY detailed about materials, textures, and finishes
4. Focus ONLY on what is ACTUALLY VISIBLE in the image, not assumptions
5. Return ONLY valid JSON with no additional text or explanations
6. Ensure all JSON fields are properly formatted with quotes and commas
7. Make sure the JSON is complete and properly closed with all brackets
8. DO NOT identify the product as an Amazon brand unless you can clearly see "Amazon" or "Amazon Basics" text on the product itself
9. DO NOT make assumptions about the brand - only include brand information if it's clearly visible in the image
10. Break down the product into its component parts and describe EACH part in extreme detail
11. For animals, toys, or characters, describe facial features, expressions, and anatomical details with extreme precision
12. For color-critical elements (like a penguin's beak), be EXTREMELY specific about the exact color shade
13. Provide approximate hex codes for all major colors to ensure color accuracy
14. If the product has distinct sections or components, describe EACH one separately in the detailedParts section

This analysis will be used to create a product advertisement where EXACT color reproduction and detail preservation are CRITICAL. Your analysis must be so detailed that someone could recreate the exact product from your description alone.
`

    try {
      console.log("Analyzing product image with Gemini 2.5 Flash - Enhanced Detail Mode")

      // Generate content using the Gemini 2.5 Flash model with image input
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: cleanImageBase64 } }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Very low temperature for maximum precision
          thinkingBudget: 1000, // Increased thinking budget for more detailed analysis
        },
      })

      const analysisText = response.response?.text() || ""
      console.log("Raw image analysis result:", analysisText)

      // Extract JSON from the response - more robust approach
      let jsonStr = ""
      let analysisJson: Partial<ProductImageAnalysis> = {}

      try {
        // Try different methods to extract valid JSON

        // Method 1: If the response contains markdown code blocks, extract just the JSON
        if (analysisText.includes("```json")) {
          const start = analysisText.indexOf("```json") + 7
          const end = analysisText.lastIndexOf("```")
          if (start > 7 && end > start) {
            jsonStr = analysisText.substring(start, end).trim()
          }
        } else if (analysisText.includes("```")) {
          const start = analysisText.indexOf("```") + 3
          const end = analysisText.lastIndexOf("```")
          if (start > 3 && end > start) {
            jsonStr = analysisText.substring(start, end).trim()
          }
        }

        // Method 2: If we still don't have clean JSON, try to extract it by finding the first { and last }
        if (!jsonStr || !jsonStr.trim().startsWith("{") || !jsonStr.trim().endsWith("}")) {
          const firstBrace = analysisText.indexOf("{")
          const lastBrace = analysisText.lastIndexOf("}")
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = analysisText.substring(firstBrace, lastBrace + 1)
          }
        }

        // Try to parse the extracted JSON
        if (jsonStr) {
          try {
            analysisJson = JSON.parse(jsonStr) as Partial<ProductImageAnalysis>
            console.log("Successfully parsed JSON:", analysisJson)
          } catch (parseError) {
            console.error("Error parsing extracted JSON:", parseError)
            // If JSON parsing fails, we'll use the default values below
          }
        } else {
          console.warn("Could not extract JSON from Gemini response")
        }
      } catch (extractError) {
        console.error("Error extracting JSON from response:", extractError)
      }

      // Ensure all required fields are present with fallback values
      const defaultAnalysis: ProductImageAnalysis = {
        productType: "Unknown product",
        exactColors: ["unknown"],
        materials: ["unknown"],
        shape: "Unknown shape",
        dimensions: "Unknown dimensions",
        brandingElements: [],
        uniqueFeatures: [],
        packaging: "Unknown packaging",
        fullDescription: "No description available",
        marketingHighlights: [],
        visualAppearance: {
          mainColor: "unknown",
          secondaryColors: [],
          texture: "unknown",
          finish: "unknown",
        },
        productDetails: {
          category: "unknown",
          subcategory: "unknown",
          intendedUse: "unknown",
        },
        visualElements: {
          designFeatures: [],
        },
        detailedParts: {},
        colorProfile: {
          dominantColors: [],
          colorRelationships: "unknown",
          colorAccuracy: "Colors must be preserved exactly as they appear in the original image.",
        },
        preciseDetails: {
          edges: "unknown",
          highlights: "unknown",
          shadows: "unknown",
          reflections: "unknown",
          transparentAreas: [],
        },
      }

      // Extract text description even if JSON parsing failed
      if (!analysisJson.fullDescription && analysisText) {
        // Try to extract a description from the raw text if JSON parsing failed
        const sentences = analysisText
          .split(/[.!?]/)
          .filter((s) => s.trim().length > 20)
          .slice(0, 3)
        if (sentences.length > 0) {
          defaultAnalysis.fullDescription = sentences.join(". ") + "."
        }

        // Try to extract colors
        const colorKeywords = [
          "black",
          "white",
          "red",
          "blue",
          "green",
          "yellow",
          "brown",
          "gray",
          "grey",
          "purple",
          "orange",
          "pink",
          "gold",
          "silver",
          "bronze",
          "copper",
          "beige",
          "tan",
          "cream",
          "ivory",
          "teal",
          "turquoise",
          "navy",
          "maroon",
          "olive",
          "mint",
          "coral",
          "amber",
          "burgundy",
          "crimson",
          "cyan",
          "indigo",
          "lavender",
          "magenta",
          "mauve",
          "ochre",
          "periwinkle",
          "rust",
          "salmon",
          "scarlet",
          "slate",
          "vermilion",
          "violet",
        ]

        const foundColors = []
        for (const color of colorKeywords) {
          if (analysisText.toLowerCase().includes(color)) {
            // Try to extract more specific color descriptions
            const colorRegex = new RegExp(`(\\w+\\s+)?${color}(\\s+\\w+)?`, "gi")
            const matches = analysisText.match(colorRegex)
            if (matches && matches.length > 0) {
              matches.forEach((match) => {
                if (!foundColors.includes(match.trim())) {
                  foundColors.push(match.trim())
                }
              })
            } else {
              foundColors.push(color)
            }
          }
        }

        if (foundColors.length > 0) {
          defaultAnalysis.exactColors = foundColors
        }
      }

      // Merge with defaults for any missing fields
      const finalAnalysis: ProductImageAnalysis = {
        productType: analysisJson.productType || defaultAnalysis.productType,
        exactColors: analysisJson.exactColors || defaultAnalysis.exactColors,
        materials: analysisJson.materials || defaultAnalysis.materials,
        shape: analysisJson.shape || defaultAnalysis.shape,
        dimensions: analysisJson.dimensions || defaultAnalysis.dimensions,
        brandingElements: analysisJson.brandingElements || defaultAnalysis.brandingElements,
        uniqueFeatures: analysisJson.uniqueFeatures || defaultAnalysis.uniqueFeatures,
        packaging: analysisJson.packaging || defaultAnalysis.packaging,
        fullDescription: analysisJson.fullDescription || defaultAnalysis.fullDescription,
        marketingHighlights: analysisJson.marketingHighlights || defaultAnalysis.marketingHighlights,
        visualAppearance: {
          mainColor: analysisJson.visualAppearance?.mainColor || defaultAnalysis.visualAppearance.mainColor,
          secondaryColors:
            analysisJson.visualAppearance?.secondaryColors || defaultAnalysis.visualAppearance.secondaryColors,
          texture: analysisJson.visualAppearance?.texture || defaultAnalysis.visualAppearance.texture,
          finish: analysisJson.visualAppearance?.finish || defaultAnalysis.visualAppearance.finish,
          transparency: analysisJson.visualAppearance?.transparency,
          patterns: analysisJson.visualAppearance?.patterns,
          colorHexCodes: analysisJson.visualAppearance?.colorHexCodes || {},
        },
        productDetails: {
          category: analysisJson.productDetails?.category || defaultAnalysis.productDetails.category,
          subcategory: analysisJson.productDetails?.subcategory || defaultAnalysis.productDetails.subcategory,
          intendedUse: analysisJson.productDetails?.intendedUse || defaultAnalysis.productDetails.intendedUse,
          targetAudience: analysisJson.productDetails?.targetAudience,
          size: analysisJson.productDetails?.size,
          weight: analysisJson.productDetails?.weight,
        },
        visualElements: {
          logo: analysisJson.visualElements?.logo,
          text: analysisJson.visualElements?.text,
          designFeatures: analysisJson.visualElements?.designFeatures || defaultAnalysis.visualElements.designFeatures,
        },
        detailedParts: analysisJson.detailedParts || defaultAnalysis.detailedParts,
        colorProfile: {
          dominantColors: analysisJson.colorProfile?.dominantColors || defaultAnalysis.colorProfile.dominantColors,
          colorRelationships:
            analysisJson.colorProfile?.colorRelationships || defaultAnalysis.colorProfile.colorRelationships,
          colorAccuracy: analysisJson.colorProfile?.colorAccuracy || defaultAnalysis.colorProfile.colorAccuracy,
        },
        preciseDetails: {
          edges: analysisJson.preciseDetails?.edges || defaultAnalysis.preciseDetails.edges,
          highlights: analysisJson.preciseDetails?.highlights || defaultAnalysis.preciseDetails.highlights,
          shadows: analysisJson.preciseDetails?.shadows || defaultAnalysis.preciseDetails.shadows,
          reflections: analysisJson.preciseDetails?.reflections || defaultAnalysis.preciseDetails.reflections,
          transparentAreas:
            analysisJson.preciseDetails?.transparentAreas || defaultAnalysis.preciseDetails.transparentAreas,
        },
      }

      console.log("Structured product analysis:", finalAnalysis)
      return finalAnalysis
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error)
      // Return default values if analysis fails
      return {
        productType: "Unknown product",
        exactColors: ["unknown"],
        materials: ["unknown"],
        shape: "Unknown shape",
        dimensions: "Unknown dimensions",
        brandingElements: [],
        uniqueFeatures: [],
        packaging: "Unknown packaging",
        fullDescription: "Unable to analyze product image.",
        marketingHighlights: [],
        visualAppearance: {
          mainColor: "unknown",
          secondaryColors: [],
          texture: "unknown",
          finish: "unknown",
        },
        productDetails: {
          category: "unknown",
          subcategory: "unknown",
          intendedUse: "unknown",
        },
        visualElements: {
          designFeatures: [],
        },
        detailedParts: {},
        colorProfile: {
          dominantColors: [],
          colorRelationships: "unknown",
          colorAccuracy: "Colors must be preserved exactly as they appear in the original image.",
        },
        preciseDetails: {
          edges: "unknown",
          highlights: "unknown",
          shadows: "unknown",
          reflections: "unknown",
          transparentAreas: [],
        },
      }
    }
  } catch (error) {
    console.error("Error in analyzeProductImage:", error)
    return {
      productType: "Unknown product",
      exactColors: ["unknown"],
      materials: ["unknown"],
      shape: "Unknown shape",
      dimensions: "Unknown dimensions",
      brandingElements: [],
      uniqueFeatures: [],
      packaging: "Unknown packaging",
      fullDescription: "Unable to analyze product image.",
      marketingHighlights: [],
      visualAppearance: {
        mainColor: "unknown",
        secondaryColors: [],
        texture: "unknown",
        finish: "unknown",
      },
      productDetails: {
        category: "unknown",
        subcategory: "unknown",
        intendedUse: "unknown",
      },
      visualElements: {
        designFeatures: [],
      },
      detailedParts: {},
      colorProfile: {
        dominantColors: [],
        colorRelationships: "unknown",
        colorAccuracy: "Colors must be preserved exactly as they appear in the original image.",
      },
      preciseDetails: {
        edges: "unknown",
        highlights: "unknown",
        shadows: "unknown",
        reflections: "unknown",
        transparentAreas: [],
      },
    }
  }
}
