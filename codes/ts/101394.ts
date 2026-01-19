import { type NextRequest, NextResponse } from "next/server"
import { AIClient } from "@/lib/ai-client"

export const dynamic = "force-dynamic"

const dailyVerses = [
  {
    verse: "This is the day the Lord has made; we will rejoice and be glad in it.",
    reference: "Psalm 118:24",
    theme: "joy",
  },
  {
    verse: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7",
    theme: "peace",
  },
  {
    verse:
      "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    reference: "Jeremiah 29:11",
    theme: "hope",
  },
]

function buildLocalDevotional(verse: string, reference: string, language: string) {
  return {
    verse,
    reference,
    theme: "general",
    devotional: `Reflect for a moment on "${verse}" (${reference}). It reminds us of God's enduring faithfulness. Ask yourself how this truth can shape your attitude today, and look for an opportunity to share hope with someone else.`,
    reflectionQuestions: [
      "What stands out to you in this verse?",
      "How can you apply its message today?",
      "Who could you encourage with this truth?",
    ],
    date: new Date().toISOString().split("T")[0],
    language,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get("language") || "English"
    const theme = searchParams.get("theme") || "general"

    // Select verse based on theme or random
    const selectedVerse =
      theme === "general"
        ? dailyVerses[Math.floor(Math.random() * dailyVerses.length)]
        : dailyVerses.find((v) => v.theme === theme) || dailyVerses[0]

    try {
      // Try to generate AI devotional using DeepSeek R1
      const systemPrompt = `You are an AI assistant creating daily devotionals for Christians. Write inspiring, biblically sound devotionals that help people connect with God and apply His word to their daily lives.`

      const devotionalPrompt = `
        Create an inspiring daily devotional based on this Bible verse:
        Verse: ${selectedVerse.verse}
        Reference: ${selectedVerse.reference}
        Language: ${language}
        Theme: ${theme}
        
        Structure the devotional with:
        1. Opening reflection (2-3 sentences connecting to daily life)
        2. Biblical insight (2-3 sentences explaining the verse's meaning)
        3. Practical application (2-3 sentences on how to live this out)
        4. Closing prayer or blessing (1-2 sentences)
        
        Target length: 200-300 words.
        Make it personal, encouraging, and actionable.
      `

      const devotional = await AIClient.generateText(devotionalPrompt, systemPrompt)

      const questionsPrompt = `
        Create 3 thoughtful reflection questions for this Bible verse:
        Verse: ${selectedVerse.verse} (${selectedVerse.reference})
        Language: ${language}
        
        Questions should:
        1. Help personal reflection
        2. Encourage practical application
        3. Deepen spiritual understanding
        
        Return just the 3 questions, one per line.
      `

      const questionsText = await AIClient.generateText(questionsPrompt, systemPrompt)
      const reflectionQuestions = questionsText
        .split("\n")
        .filter((q) => q.trim())
        .map((q) => q.replace(/^\d+\.?\s*/, "").trim())
        .slice(0, 3)

      return NextResponse.json({
        verse: selectedVerse.verse,
        reference: selectedVerse.reference,
        theme: selectedVerse.theme,
        devotional,
        reflectionQuestions,
        date: new Date().toISOString().split("T")[0],
        language,
        aiGenerated: true,
      })
    } catch (aiError) {
      console.error("AI devotional generation failed:", aiError)

      // Fallback to local devotional
      const fallback = buildLocalDevotional(selectedVerse.verse, selectedVerse.reference, language)

      return NextResponse.json({
        ...fallback,
        aiGenerated: false,
      })
    }
  } catch (error) {
    console.error("Devotional generation error:", error)
    return NextResponse.json({ error: "Failed to generate devotional" }, { status: 500 })
  }
}
