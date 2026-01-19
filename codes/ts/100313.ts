
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure environment variables are loaded, especially for local dev.
// The .env.local should be automatically loaded by Next.js,
// but this makes it more explicit for Genkit's context.
import { config } from 'dotenv';
config({ path: '.env.local' });

const geminiApiKey = process.env.GEMINI_API_KEY;

// This console.log is for debugging to confirm the key is being read.
// It will be removed later.
if (process.env.NODE_ENV !== 'production') {
  console.log(`Attempting to use GEMINI_API_KEY: ${geminiApiKey}`);
}

if (!geminiApiKey && process.env.NODE_ENV !== 'production') {
  console.warn(
    'GEMINI_API_KEY not found in environment variables. Poem generation will likely fail.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: geminiApiKey, // Explicitly pass the API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for text generation
});

// Ensure the flow file is loaded so Genkit knows about it.
// This is typically handled by dev.ts but can be good to have here for clarity
// if Genkit startup doesn't always run dev.ts first in all contexts.
import '@/ai/flows/generate-poem.ts';
