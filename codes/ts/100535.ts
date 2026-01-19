import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/server.config';

const genAI = new GoogleGenerativeAI(config.API_KEY);
const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function mainGenerateTags(input: any): Promise<string> {
  console.log('Input provided:', input);

  // Refined prompt for better tag generation
  const prompt = `
    You are an advanced AI designed to create relevant, concise, and SEO-friendly hashtags for digital content. Analyze the following details carefully and generate only 3 or 4 accurate hashtags:

    Title: ${input.title}
    Description: ${input.description}
    Summary: ${input.summary}

    Instructions:
    1. Focus on the key topics, themes, and concepts from the title and description.
    2. Generate only  4 hashtags that are highly relevant and aligned with the content's context.
    3. Ensure the hashtags are concise, unique, and SEO-friendly.
    4. Avoid generic, redundant, or unrelated hashtags.
    5. Output the hashtags as a single comma-separated string.
   

    Generate Hashtags:
  `;

  try {
    // Use Gemini to generate tags
    const result = await model2.generateContent(prompt);

    // Process and return the tags, ensuring only a single hash symbol
    let tags = result.response.text().trim();

    // Remove any extra hash symbols
    tags = tags.replace(/##/g, '#');

    console.log('Generated Tags:', tags);
    return tags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return 'Error generating tags.';
  }
}
