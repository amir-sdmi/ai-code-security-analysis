import { NextRequest, NextResponse } from "next/server";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const endpoint = "https://models.github.ai/inference";
// const model = "deepseek/DeepSeek-V3-0324";
const model = "openai/gpt-4.1";
const client = ModelClient(endpoint, new AzureKeyCredential(process.env.CHATGPT_KEY!));

const gemini = new GoogleGenerativeAI(process.env.GEMINI_KEY!);
console.log("GEMINI_API_KEY Loaded:", process.env.GEMINI_KEY);

const geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
const useGemini=true
export async function POST(req: NextRequest) {
 
  try {
    const { codeContext, mode, question } = await req.json();

    let systemPrompt = "";
    if (mode === "timeComplexity") {
      systemPrompt = `You're a code complexity analyzer. Analyze and explain the time and space complexity of the code.`;
    } else if (mode === "explanation") {
      systemPrompt = `You are a helpful teacher. Start with "Step 1:", and don’t use filler.`;
    } else if (mode === "hint") {
      systemPrompt = `You're a helpful tutor. Give ONE hint, not the answer.`;
    } else if (mode === "quiz") {
      systemPrompt = `You are a tutor. Generate ONE MCQ in this JSON format:
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 2,
  "hint": "..."
}
`;
    } else if (mode === "chat") {
      systemPrompt = `You are a helpful assistant. Answer beginner-level questions related to this code.`;
    }

    const finalPrompt = `${systemPrompt}\n\n${mode === "chat" ? `User question: ${question}\n\n` : ""}Code:\n\`\`\`\n${codeContext}\n\`\`\``;

    // ➤ Use Gemini
    if (useGemini) {
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      });
    const rawReply = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Error: No reply";

// Remove markdown code block if present
const reply = rawReply.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      return NextResponse.json({ reply });
    }

    // ➤ Use DeepSeek / OpenAI
    const response = await client.path("/chat/completions").post({
      body: {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${mode === "chat" ? question + "\n\n" : ""}Code:\n\`\`\`\n${codeContext}\n\`\`\`` },
        ],
        temperature: 0.3,
        top_p: 1,
        max_tokens: 1000,
      },
    });

    if (isUnexpected(response)) {
      return NextResponse.json({ error: response.body.error.message }, { status: 500 });
    }

    const reply = response.body.choices?.[0]?.message?.content;
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("💥 Error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
