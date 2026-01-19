
import { genkit } from 'genkit';

/**
 * Genkit AI initialization
 * 
 * Currently using Genkit as a lightweight abstraction layer for AI flows.
 * The actual AI calls are made to OpenRouter's API with DeepSeek Chat model.
 */
export const ai = genkit({
  // No plugins are currently active
  // The space-explainer flow makes direct API calls to OpenRouter
});
