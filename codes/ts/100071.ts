import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Make sure to set the XAI_API_KEY environment variable
  const result = streamText({
    model: xai('grok-3'), // Using the latest Grok model
    system: 'You are a helpful assistant powered by Grok. You provide accurate, helpful, and friendly responses.',
    messages,
    maxTokens: 1000, // Limit response length for better performance
    temperature: 0.7, // Add temperature for response variety
  });

  return result.toDataStreamResponse();
} 