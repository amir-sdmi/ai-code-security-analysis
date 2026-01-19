
/**
 * @fileOverview Core AI configuration for the Red Mansion learning platform.
 * 
 * This file sets up the GenKit framework with Google's Gemini 2.0 Flash model
 * to power all AI-driven features throughout the application including:
 * - Text analysis and explanations for classical Chinese literature
 * - Character relationship mapping and insights
 * - Learning progress analysis and personalized recommendations
 * - Writing assistance for literary analysis
 */

// Import the core GenKit framework for AI functionality
import {genkit} from 'genkit';
// Import Google AI plugin to access Gemini models
import {googleAI} from '@genkit-ai/googleai';

/**
 * Main AI instance configuration
 * 
 * Creates a GenKit instance configured with:
 * - Google AI plugin for accessing Gemini models
 * - Gemini 2.0 Flash model specifically chosen for its excellent Chinese language
 *   understanding and reasoning capabilities needed for classical literature analysis
 * 
 * This instance is exported and used across all AI flows in the application
 */
export const ai = genkit({
  plugins: [googleAI()], // Enable Google AI services integration
  model: 'googleai/gemini-2.0-flash', // Use Gemini 2.0 Flash for optimal Chinese literature processing
});
