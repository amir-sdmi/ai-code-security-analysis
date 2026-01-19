import { Message } from '../types/ai';
import { geminiSimplifiedService } from './gemini-simplified'; // Use Gemini service

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function handleAIChat(
  input: string,
  previousMessages: Message[],
  options: ChatOptions = {}
) {
  const {
    model = 'gemini-2.0-flash', // Default to Gemini model
    temperature = 0.7,
    maxTokens = 2048
  } = options;

  // Construct the prompt for Gemini
  const prompt = previousMessages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n') + `\nuser: ${input}`;

  try {
    const responseContent = await geminiSimplifiedService.generateText(prompt);

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error handling AI chat:', error);
    throw new Error('Failed to get response from AI');
  }
}