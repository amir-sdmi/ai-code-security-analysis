import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { openai } from "@ai-sdk/openai"
import type { TarotCard, TarotSpread } from "@/types/tarot"

interface ReadingParams {
  cards: TarotCard[]
  spread: TarotSpread
  userPrompt: string
  interpretationStyle: string
  apiKey?: string // Optional API key parameter
}

interface AIReading {
  overallReading: string
  cardInterpretations: {
    [key: number]: {
      meaning: string
      advice: string
      symbolism: string
    }
  }
  keyInsights: string[]
  actionSteps: string[]
}

// Custom error class for API key issues
export class APIKeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "APIKeyError"
  }
}

// Function to get the appropriate model with proper API key handling
function getModelWithKey(apiKey?: string) {
  // Priority 1: Check for Grok/XAI key first
  if (process.env.XAI_API_KEY) {
    console.log("Using Grok/XAI model")
    return xai("grok-beta")
  }

  // Priority 2: Check OPENAI_API_KEY environment variable
  let openaiKey = process.env.OPENAI_API_KEY

  // Priority 3: Check NEXT_PUBLIC_OPENAI_API_KEY environment variable
  if (!openaiKey) {
    openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  }

  // Priority 4: Check the passed apiKey parameter
  if (!openaiKey && apiKey) {
    openaiKey = apiKey
  }

  // Priority 5: Check localStorage (client-side only)
  if (!openaiKey && typeof window !== "undefined") {
    openaiKey = localStorage.getItem("openai_api_key") || undefined
  }

  if (openaiKey && openaiKey.trim().length > 0) {
    console.log("Using OpenAI model")
    return openai("gpt-4o", { apiKey: openaiKey.trim() })
  }

  // No valid API key found
  throw new APIKeyError(
    "No AI API key found. Please set one of the following:\n" +
      "1. OPENAI_API_KEY environment variable\n" +
      "2. NEXT_PUBLIC_OPENAI_API_KEY environment variable\n" +
      "3. Pass apiKey parameter to generateTarotReading\n" +
      "4. Set localStorage.setItem('openai_api_key', 'your-key') in browser console",
  )
}

export async function generateTarotReading({
  cards,
  spread,
  userPrompt,
  interpretationStyle,
  apiKey,
}: ReadingParams): Promise<AIReading> {
  const cardDescriptions = cards
    .map(
      (card, index) =>
        `Position ${index + 1} (${spread.positions[index].name}): ${card.name} of ${card.suit} - Keywords: ${card.keywords.join(", ")}`,
    )
    .join("\n")

  const spreadDescription = spread.positions.map((pos) => `${pos.name}: ${pos.description}`).join("\n")

  const prompt = `You are a master tarot reader with deep knowledge of symbolism, psychology, and mystical traditions. 

READING CONTEXT:
Spread: ${spread.name}
Interpretation Style: ${interpretationStyle}
User's Question/Situation: "${userPrompt}"

SPREAD POSITIONS:
${spreadDescription}

CARDS DRAWN:
${cardDescriptions}

Please provide a comprehensive tarot reading. Respond ONLY with valid JSON in exactly this format:

{
  "overallReading": "A detailed 3-4 paragraph overall interpretation that weaves together all the cards in relation to the user's question, considering the spread positions and their meanings. Make this deeply insightful and personalized to their situation.",
  "cardInterpretations": {
    ${cards
      .map(
        (_, index) => `"${index}": {
      "meaning": "Detailed interpretation of card ${index + 1} in its position, relating to the user's question",
      "advice": "Specific guidance and advice based on this card", 
      "symbolism": "Deep symbolic meaning and archetypal significance"
    }`,
      )
      .join(",\n    ")}
  },
  "keyInsights": [
    "Key insight 1 - profound and actionable",
    "Key insight 2 - profound and actionable",
    "Key insight 3 - profound and actionable"
  ],
  "actionSteps": [
    "Specific action step 1 the user can take",
    "Specific action step 2 the user can take", 
    "Specific action step 3 the user can take"
  ]
}

INTERPRETATION STYLE GUIDELINES:
- Traditional: Focus on classic meanings, established symbolism, and time-tested interpretations
- Intuitive: Emphasize feelings, first impressions, and personal resonance with the imagery
- Psychological: Use Jungian concepts, archetypes, and psychological insights
- Mystical: Incorporate Kabbalah, numerology, esoteric wisdom, and spiritual connections

Make the reading deeply personal, insightful, and actionable. Use rich, evocative language that captures the mystical nature of tarot while providing practical wisdom.`

  try {
    console.log("Attempting to generate tarot reading...")

    const model = getModelWithKey(apiKey)

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })

    console.log("Successfully received response from AI model")

    // Clean the response - remove any markdown formatting or extra text
    const cleanedText = text.trim()

    // Find JSON content between curly braces
    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in response:", cleanedText)
      throw new Error("Invalid response format - no JSON found")
    }

    const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1)
    console.log("Extracted JSON from response")

    let reading: AIReading
    try {
      reading = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Attempted to parse:", jsonString)
      throw new Error("Failed to parse AI response as JSON")
    }

    // Validate the response structure
    if (!reading.overallReading) {
      throw new Error("Missing overallReading in response")
    }
    if (!reading.cardInterpretations) {
      throw new Error("Missing cardInterpretations in response")
    }
    if (!reading.keyInsights || !Array.isArray(reading.keyInsights)) {
      throw new Error("Missing or invalid keyInsights in response")
    }
    if (!reading.actionSteps || !Array.isArray(reading.actionSteps)) {
      throw new Error("Missing or invalid actionSteps in response")
    }

    // Validate card interpretations
    for (let i = 0; i < cards.length; i++) {
      const cardInterp = reading.cardInterpretations[i]
      if (!cardInterp || !cardInterp.meaning || !cardInterp.advice || !cardInterp.symbolism) {
        throw new Error(`Missing or incomplete interpretation for card ${i + 1}`)
      }
    }

    console.log("Successfully generated and validated AI reading")
    return reading
  } catch (error) {
    console.error("Error in generateTarotReading:", error)

    // Re-throw APIKeyError to be handled by the calling component
    if (error instanceof APIKeyError) {
      throw error
    }

    // For other errors, provide a fallback reading
    console.log("Falling back to local reading generation")
    return generateFallbackReading(cards, spread, userPrompt, interpretationStyle)
  }
}

// Fallback reading generator
function generateFallbackReading(
  cards: TarotCard[],
  spread: TarotSpread,
  userPrompt: string,
  interpretationStyle: string,
): AIReading {
  const cardInterpretations: { [key: number]: { meaning: string; advice: string; symbolism: string } } = {}

  cards.forEach((card, index) => {
    const position = spread.positions[index]
    cardInterpretations[index] = {
      meaning: `The ${card.name} in the ${position.name} position suggests themes of ${card.keywords.join(", ")}. This card speaks to the energy surrounding ${position.description.toLowerCase()}, indicating that these qualities are particularly relevant to your current situation.`,
      advice: `Focus on embodying the qualities of ${card.keywords[0]} as you navigate this aspect of your journey. The ${card.name} encourages you to embrace ${card.keywords.slice(1).join(" and ")} while remaining mindful of the lessons this card offers.`,
      symbolism: `The ${card.name} carries the archetypal energy of ${card.keywords.join(", ")}. In the context of your question about "${userPrompt}", this card represents the deeper spiritual forces and universal patterns at work in your life, guiding you toward greater understanding and growth.`,
    }
  })

  return {
    overallReading: `Your ${spread.name} reading reveals a complex tapestry of energies surrounding your question: "${userPrompt}". The cards suggest that you are at a significant point in your journey, where the influences of ${cards.map((c) => c.name).join(", ")} are converging to guide you forward.\n\nThe overall message from your cards speaks to themes of transformation, growth, and the need to balance different aspects of your life. Each position in your spread tells part of a larger story about your current path and the wisdom available to you at this time.\n\nTrust in the process and remain open to the insights that emerge from this reading. The universe is providing you with the guidance you need to move forward with confidence and clarity. Remember that tarot is a tool for reflection and self-discovery, and the true wisdom lies within your own intuition and understanding.`,
    cardInterpretations,
    keyInsights: [
      `The presence of ${cards[0]?.name} suggests that ${cards[0]?.keywords[0]} is a key theme in your current situation`,
      `Your cards indicate a need to balance ${cards[1]?.keywords[0] || "different energies"} with ${cards[2]?.keywords[0] || "new perspectives"}`,
      `The overall energy of your reading points toward ${cards[cards.length - 1]?.name || "positive transformation"} and personal growth`,
    ],
    actionSteps: [
      `Reflect deeply on the message of the ${cards[0]?.name} and how ${cards[0]?.keywords[0]} applies to your current situation`,
      `Take practical steps to embody the energy of ${cards[1]?.name || "your second card"} in your daily life`,
      `Remain open to the transformative potential that the ${cards[cards.length - 1]?.name || "final card"} represents`,
    ],
  }
}
