import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config"

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// List of popular Bible verses for fallback
const POPULAR_VERSES = [
  {
    reference: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  },
  { reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  {
    reference: "Jeremiah 29:11",
    text: 'For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future.',
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  },
  { reference: "Psalm 23:1", text: "The LORD is my shepherd, I lack nothing." },
  {
    reference: "Isaiah 40:31",
    text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
  },
  {
    reference: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
  },
  {
    reference: "Psalm 46:1",
    text: "God is our refuge and strength, an ever-present help in trouble.",
  },
  {
    reference: "2 Corinthians 5:17",
    text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
  },
  {
    reference: "Proverbs 3:5-6",
    text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  },
]

export async function GET() {
  try {
    // Get a random verse from popular verses
    const randomIndex = Math.floor(Math.random() * POPULAR_VERSES.length)
    const randomVerse = POPULAR_VERSES[randomIndex]
    const verse = randomVerse.text
    const reference = randomVerse.reference

    try {
      // Use Gemini to generate reflection and application
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
        For the Bible verse: "${verse}" (${reference})
        
        Please provide:
        1. A brief reflection (2-3 sentences) on the meaning and significance of this verse
        2. A practical application (2-3 sentences) on how to apply this verse in daily life
        
        Format your response as JSON with the following structure:
        {
          "reflection": "Your reflection on the verse",
          "application": "Your practical application"
        }
      `

      // Generate content
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Parse the response as JSON
      let parsedResponse
      try {
        // Find JSON in the response (in case the model adds extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : text
        parsedResponse = JSON.parse(jsonString)
      } catch (e) {
        console.error("Error parsing JSON response:", e)
        throw new Error("Failed to parse response")
      }

      // Combine the verse and reflection
      const fullResponse = {
        verse,
        reference,
        reflection: parsedResponse.reflection,
        application: parsedResponse.application,
      }

      return NextResponse.json(fullResponse)
    } catch (apiError) {
      console.error("Gemini API error:", apiError)

      // Fallback response if the API call fails
      const fallbackResponse = {
        verse,
        reference,
        reflection:
          "This verse reminds us of God's unfailing love and guidance in our lives. It offers comfort and direction when we face uncertainty or challenges.",
        application:
          "Take a moment today to reflect on how this verse applies to your current situation. Consider writing it down and meditating on it throughout the day.",
      }

      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error("Error in verse route:", error)

    // Ultimate fallback if everything else fails
    const emergencyFallback = {
      verse: "I can do all things through Christ who strengthens me.",
      reference: "Philippians 4:13",
      reflection:
        "This verse reminds us that with God's help, we can overcome any challenge. When we feel weak or inadequate, we can draw strength from our faith in Christ.",
      application:
        "When facing difficulties today, remember to rely on Christ's strength rather than your own. Take a moment to pray for His guidance and strength.",
    }

    return NextResponse.json(emergencyFallback)
  }
}
