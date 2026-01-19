import { GoogleGenerativeAI } from "@google/generative-ai";

// API key for Gemini
const API_KEY = "Add Your API Key!!";

// StudySpace context to provide to Gemini for better responses
const STUDYSPACE_CONTEXT = `
You are an AI assistant for StudySpace, a productivity app for students with the following features:
1. Task Management: Users can create, organize, and track tasks with due dates and priorities.
2. Notes: Users can create and edit rich text notes for their studies.
3. Flashcards: Users can create flashcard sets for memorization and study.
4. Pomodoro Timer: Users can set work and break sessions to maintain focus.
`;

/**
 * Get a response from Gemini API using the direct REST API approach
 * @param {string} prompt - The user's message
 * @returns {Promise<string>} - The AI response
 */
export const getGeminiResponse = async (prompt) => {
  try {
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const url = `${endpoint}?key=${API_KEY}`;

    const data = {
      contents: [
        {
          parts: [
            { text: `${STUDYSPACE_CONTEXT}\n\nUser question: ${prompt}` },
          ],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return result.candidates[0].content.parts[0].text;
    } else {
      return "I couldn't generate a response. Can I help with something else?";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I'm having trouble connecting right now. Can I help with StudySpace features instead?";
  }
};

/**
 * Determine if we should use the Gemini API or predefined responses
 * @param {string} message - User's message
 * @returns {boolean} - Whether to use Gemini API
 */
export const shouldUseGemini = (message) => {
  const lowerText = message.toLowerCase();

  // Only use predefined responses for very basic greetings or short help queries
  if (
    (lowerText === "hello" ||
      lowerText === "hi" ||
      lowerText === "hey" ||
      lowerText === "help") &&
    lowerText.length < 8
  ) {
    return false;
  }

  // For almost everything else, use Gemini
  return true;
};
