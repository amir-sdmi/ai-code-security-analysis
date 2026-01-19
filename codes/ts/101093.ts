import OpenAI from 'openai'

// OpenRouter configuration for DeepSeek V3
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI Agent Payment System",
  }
})

 

// DeepSeek V3 model configuration
const AI_MODEL = "deepseek/deepseek-chat-v3-0324";

export async function generateAIResponse(
  query: string,
  context?: string
): Promise<string> {
  try {
    console.log("🤖 Generating AI response with DeepSeek V3...");
    console.log("📝 Query:", query.substring(0, 100) + "...");
    console.log(
      "🔑 API Key configured:",
      !!process.env.OPENROUTER_API_KEY || !!process.env.OPENAI_API_KEY
    );

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant powered by DeepSeek V3. Provide accurate, informative, and engaging responses. Keep responses concise but comprehensive. ${context ? `Additional context: ${context}` : ""}`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.error("❌ Empty response from AI model");
      return "I apologize, but I couldn't generate a response. Please try again.";
    }

    console.log("✅ AI response generated successfully");
    console.log("📊 Response length:", response.length);
    return response;
  } catch (error: any) {
    console.error("❌ AI API error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      response: error.response?.data,
    });

    // Provide more specific error messages
    if (error.status === 401 || error.message?.includes("401")) {
      throw new Error(
        "Invalid API key. Please check your OpenRouter API key in environment variables."
      );
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.status === 402) {
      throw new Error(
        "Insufficient credits. Please check your OpenRouter account."
      );
    } else if (error.status === 400) {
      throw new Error(
        "Invalid request. The model or parameters may be incorrect."
      );
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error("Network error. Please check your internet connection.");
    } else {
      throw new Error(
        `AI service error: ${error.message || "Unknown error occurred"}`
      );
    }
  }
}
