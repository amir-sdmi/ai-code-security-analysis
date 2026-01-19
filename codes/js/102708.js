/**
 * Agent module for handling Claude integration
 * @module lib/agent
 */

import { analyzeWithClaude } from "./claude";

/**
 * Processes a prompt using Cursor's integrated Claude
 * @param {string} prompt - The prompt to process
 * @param {Object} options - Additional options
 * @param {string} [options.context] - Additional context for Claude
 * @returns {Promise<{response: string}>} Processing results
 */
export async function processPrompt(prompt, options = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }

  try {
    // Prepare the prompt with context if provided
    const fullPrompt = options.context 
      ? `${options.context}\n\n${prompt}`
      : prompt;

    // Get Claude's analysis through Cursor
    const response = await analyzeWithClaude(fullPrompt);

    return { response };
  } catch (error) {
    console.error("Error processing prompt:", error);
    throw error;
  }
} 