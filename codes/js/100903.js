// src/utils/conversationUtils.js
import { v4 as uuidv4 } from "uuid";

/**
 * Generates a guided conversation flow template based on user choice.
 * Safe defaults are used if no trait or theme is yet inferred.
 */
export function generateConversationFlowTemplate({
  selectedOption,
  inferredTrait = "",
  inferredTheme = ""
}) {
  return {
    acknowledgment: `That’s a meaningful choice. Thanks for naming something like "${selectedOption}".`,

    reflectionPrompt: `Want to share what "${selectedOption}" looked like for you?`,

    followUpIfSkipped:
      inferredTrait || inferredTheme
        ? `No pressure. Maybe this shaped your ${inferredTrait || "perspective"} or your relationship with ${inferredTheme || "something meaningful"}.`
        : `No pressure. Want help naming what "${selectedOption}" might have shaped in you?`,

    insightTemplate:
      inferredTrait || inferredTheme
        ? `This may have shaped your ${inferredTrait || "values"} or your relationship with ${inferredTheme || "connection"}.`
        : "",

    timeCheckPrompt:
      inferredTrait
        ? `Pause here or go one layer deeper into your ${inferredTrait}?`
        : "",

    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Very basic NLP-like function for inferring identity traits and themes from user reflection text.
 */
export function inferIdentityTraitsFromInput(userText = "", selectedOption = "") {
  const lowerText = userText.toLowerCase();

  // Basic keyword matching to infer traits and themes
  // This is a very simplified version of what a real NLP model would do. Need to update with chatGPT or similar.
  const inferredTrait =
    lowerText.includes("resilience") ? "resilience" :
    lowerText.includes("curious") || lowerText.includes("wonder") ? "curiosity" :
    lowerText.includes("discipline") ? "discipline" :
    "";

  const inferredTheme =
    lowerText.includes("belonging") ? "belonging" :
    lowerText.includes("freedom") ? "freedom" :
    lowerText.includes("connection") ? "connection" :
    "";

  const dominantEmotion =
    lowerText.includes("excited") ? "excitement" :
    lowerText.includes("anxious") ? "anxiety" :
    lowerText.includes("grateful") ? "gratitude" :
    "";

  return { inferredTrait, inferredTheme, dominantEmotion };
}
// This function generates a conversation flow template based on the user's selected option and inferred traits/themes.
// It uses UUID for unique identification and timestamps for creation and update tracking.
// The function also includes a basic NLP-like mechanism to infer traits and themes from user input.
// The inferred traits and themes are used to customize the conversation flow, making it more relevant to the user's experience.