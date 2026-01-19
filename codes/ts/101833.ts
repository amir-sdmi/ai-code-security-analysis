// /lib/openai.ts

// This file contains functions to interact with the OpenAI API.
// For example, generating text, analyzing content, etc.

import { OpenAI } from 'openai';
import { ProposalStructuredContext } from '@/features/proposals/types/Proposal';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only needed for client-side usage (we'll use server-side primarily)
});

/**
 * Generates a text completion using OpenAI
 *
 * @param prompt The prompt to send to OpenAI.
 * @returns A promise that resolves to the generated text.
 */
export async function generateTextWithOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured.');
    throw new Error('OpenAI API key not set.');
  }

  try {
    const response = await openai.completions.create({
      model: 'gpt-4o-mini',
      prompt: prompt,
      max_tokens: 500,
    });

    return response.choices[0].text.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Error generating text.');
  }
}

/**
 * Extract and format text content from a file
 *
 * @param file File object from form upload
 * @returns The extracted text content
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer]);

  if (fileType === 'text/plain') {
    return await blob.text();
  } else if (fileType === 'application/pdf') {
    // In a production app you'd use a PDF parsing library
    // For now return a placeholder
    return `[PDF Content from ${file.name}]`;
  } else if (fileType.includes('word') || fileType.includes('docx')) {
    // In a production app you'd use a DOCX parsing library
    // For now return a placeholder
    return `[DOCX Content from ${file.name}]`;
  }

  return `[Content from ${file.name} (${fileType})]`;
}

/**
 * Generates introduction content for proposals using ChatGPT
 *
 * @param userText Free text input from user about the proposal context
 * @param fileContents Array of extracted text from uploaded files
 * @returns An object containing the introduction text and structured context
 */
export async function generateProposalIntroduction(
  userText: string,
  fileContents: string[],
): Promise<{
  introduction: string;
  structuredContext: ProposalStructuredContext;
}> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured.');
    throw new Error('OpenAI API key not set.');
  }

  try {
    const parsedFileContent = fileContents.join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are a senior business copywriter working for a digital consultancy. Your job is to generate the introduction paragraph of a commercial proposal based on the client's context and business needs. Write in a clear, persuasive, and professional tone. Do it in French.",
        },
        {
          role: 'user',
          content: `Voici les informations fournies par l'utilisateur (texte libre et/ou fichiers) :
---
${userText}
---
${parsedFileContent}
---

En vous basant uniquement sur ces informations :
1. Rédigez un paragraphe d'introduction professionnel (200 mots max), à insérer au début d'une proposition commerciale.
2. Fournissez un résumé structuré du projet et du client sous la forme d'un objet JSON contenant :
{
  "clientName": "",
  "projectName": "",
  "objectives": [],
  "tone": ""
}`,
        },
      ],
      temperature: 0.7,
    });

    const generatedContent = response.choices[0].message.content || '';

    // Parse the response to separate introduction and structured context
    const parts = parseAIResponse(generatedContent);

    return {
      introduction: parts.introduction,
      structuredContext: parts.structuredContext,
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Error generating proposal introduction.');
  }
}

/**
 * Parse the AI response to extract the introduction and structured context
 *
 * @param response Full response from OpenAI
 * @returns Object containing separated introduction and structured context
 */
function parseAIResponse(response: string): {
  introduction: string;
  structuredContext: ProposalStructuredContext;
} {
  // Default return values
  const defaultResult = {
    introduction: '',
    structuredContext: {
      clientName: '',
      projectName: '',
      objectives: [],
      tone: '',
    } as ProposalStructuredContext,
  };

  try {
    // Try to find a JSON object anywhere in the response (code block or not)
    const jsonMatch = response.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    let jsonString = '';
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    } else {
      // Fallback: look for the first curly-brace block in the text
      const fallbackJson = response.match(/({[\s\S]*?})/);
      if (fallbackJson && fallbackJson[1]) {
        jsonString = fallbackJson[1];
      }
    }

    let structuredContext = defaultResult.structuredContext;
    if (jsonString) {
      try {
        structuredContext = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse JSON from AI response', e);
      }
    }

    // Extract the introduction text (everything before the JSON block or the whole text if no JSON)
    let introduction = response;
    if (jsonString) {
      const idx = response.indexOf(jsonString);
      if (idx > 0) {
        introduction = response.substring(0, idx).trim();
      } else if (idx === 0) {
        introduction = '';
      }
    }

    // Clean up the introduction from potential markdown or labels
    introduction = introduction
      .replace(/^[0-9]+\.\s*/, '') // Remove numbered list markers
      .replace(/^Introduction\s*:\s*/i, '') // Remove "Introduction:" label
      .replace(/^\*\*[^*]+\*\*\s*:?.*$/gm, '') // Remove bold headers
      .replace(/```[a-zA-Z]*[\s\S]*?```/g, '') // Remove code blocks
      .trim();

    return {
      introduction,
      structuredContext,
    };
  } catch (e) {
    console.error('Error parsing AI response:', e);
    return defaultResult;
  }
}

// Export all functions
const openaiService = {
  generateTextWithOpenAI,
  extractTextFromFile,
  generateProposalIntroduction,
};

export default openaiService;
