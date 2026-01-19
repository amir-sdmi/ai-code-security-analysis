import { groq } from "@ai-sdk/groq"
import { xai } from "@ai-sdk/xai"
import { streamText } from "ai"
import { determineModelType, getSystemPrompt } from "@/utils/ai-utils"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Extract the messages from the body of the request
    const { messages } = await req.json()

    // Get the last user message to determine which model to use
    const lastUserMessage = messages.findLast((m: any) => m.role === "user")?.content || ""
    const modelType = determineModelType(lastUserMessage)

    // Get the system prompt
    const systemPrompt = getSystemPrompt()

    // Select the appropriate model
    const model =
      modelType === "xai"
        ? xai("grok-2") // Use Grok for technical questions
        : groq("llama-3.1-8b-instant") // Use Groq for general conversation

    console.log(
      `Using ${modelType} model for: "${lastUserMessage.substring(0, 50)}${lastUserMessage.length > 50 ? "..." : ""}"`,
    )

    // Call the language model
    const result = streamText({
      model,
      messages,
      system: systemPrompt,
    })

    // Respond with the stream
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API route:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
