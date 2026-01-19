import { Agent, setDefaultOpenAIClient } from '@openai/agents';
import OpenAI from 'openai';

// Configure OpenAI client to use Gemini API
const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// Set the custom client as default
setDefaultOpenAIClient(geminiClient);

let agent: Agent;

export const getSimpleAgent = () => {
  if (agent) {
    return agent;
  }

  agent = new Agent({
    name: "Day Check-in Agent",
    instructions: `
      You are a friendly agent. Start by saying: "How has your day been going so far?" and wait for the user's response.
    `,
    model: "gemini-2.5-flash", // Using Gemini 2.5 Flash model
    modelSettings: {
      temperature: 0.7,
      maxTokens: 1000,
    }
  });

  return agent;
};
