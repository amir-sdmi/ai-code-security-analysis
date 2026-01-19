import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY, // Use GEMINI_API_KEY as before
      // Configure models. You can specify an array of models
      models: ['gemini-1.5-flash-latest'],
    }),
  ],
});
