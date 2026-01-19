import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export async function POST(request: Request) {
  // Check authentication
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question, answer } = await request.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Use Gemini to generate related questions
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const prompt = `
      Based on the following question and answer about Christian faith or the Bible, generate 3 related follow-up questions that the user might be interested in asking next.
      
      Original Question: "${question}"
      
      Answer provided: "${answer}"
      
      Generate 3 concise, specific follow-up questions that would help the user deepen their understanding of the topic.
      
      Format your response as JSON with the following structure:
      {
        "questions": [
          {
            "id": "1",
            "text": "First related question"
          },
          {
            "id": "2",
            "text": "Second related question"
          },
          {
            "id": "3",
            "text": "Third related question"
          }
        ]
      }
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the response as JSON
    try {
      // Find JSON in the response (in case the model adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      const parsedResponse = JSON.parse(jsonString)

      return NextResponse.json(parsedResponse)
    } catch (e) {
      console.error("Error parsing JSON response:", e)

      // Fallback response if parsing fails
      return NextResponse.json({
        questions: [
          {
            id: "1",
            text: `How can I apply this understanding of "${question.substring(0, 30)}..." in my daily life?`,
          },
          {
            id: "2",
            text: "What does the Bible say about this topic in the New Testament?",
          },
          {
            id: "3",
            text: "How have other Christians historically approached this question?",
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error in related-questions route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
