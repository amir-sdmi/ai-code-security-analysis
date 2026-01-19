import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.DEEP_SEEK_URL,
  apiKey: process.env.DEEP_SEEK_API_KEY
});

/**
 * Generates content using DeepSeek AI model
 * @param prompt The input prompt for content generation
 * @returns The generated content as a string
 */
export async function generateDeepSeekContent(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "deepseek-chat",
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}