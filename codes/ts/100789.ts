import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, userBirthData } = await request.json()

    // Generate daily report using Grok
    const prompt = `You are KIRA, an advanced AI astrologer and palm reader. Generate a personalized daily report for today (${new Date().toLocaleDateString()}).

User's Birth Details:
- Date: ${userBirthData.birthDate}
- Time: ${userBirthData.birthTime || "Unknown"}
- Location: ${userBirthData.birthPlace}

Generate a comprehensive daily report covering:
1. **Today's Energy Overview** - Overall energy and cosmic influences
2. **Health & Wellness** - Physical and mental health guidance for today
3. **Career & Money** - Professional opportunities and financial insights
4. **Love & Relationships** - Romantic and social connections guidance
5. **Family & Home** - Family dynamics and domestic matters
6. **Spiritual Guidance** - Meditation, growth, and spiritual practices
7. **Lucky Elements** - Colors, numbers, or activities that will bring good fortune
8. **Daily Affirmation** - A powerful affirmation for today

Make it personal, specific to today's date, and include actionable advice. Format with ** for headings.`

    const { text } = await generateText({
      model: xai("grok-2-1212"),
      prompt,
      maxTokens: 1200,
      temperature: 0.7,
    })

    // Store the daily report using direct API call
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({
        user_id: userId,
        report_content: text,
        report_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Database error: ${response.statusText}`)
    }

    return NextResponse.json({ report: text })
  } catch (error) {
    console.error("Error generating daily report:", error)
    return NextResponse.json({ error: "Failed to generate daily report" }, { status: 500 })
  }
}
