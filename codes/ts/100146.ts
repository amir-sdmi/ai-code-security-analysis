import { myProvider } from '../providers';

/**
 * Analyze a document's text using Grok (artifact-model).
 * @param text The extracted text from the document
 * @param prompt Optional prompt for the AI (e.g., 'Summarize this')
 * @returns The AI's response as a string
 */
export async function analyzeDocument(
  text: string,
  prompt: string = 'Summarize this document.',
): Promise<string> {
  const model = myProvider.languageModel('artifact-model');
  const response = await model.doGenerate({
    prompt: [
      { role: 'system', content: [{ type: 'text', text: prompt }] },
      { role: 'user', content: [{ type: 'text', text }] },
    ],
  });
  // If the response is an object, extract the text property; otherwise, return as is
  if (typeof response === 'object' && response.text) {
    return response.text;
  }
  return String(response);
}
