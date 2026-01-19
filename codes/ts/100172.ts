import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the provided key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateDocumentation = async (repoContent: string): Promise<string> => {
  try {
    // Use gemini-1.0-pro instead of gemini-pro as it's the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `generate a beautiful and comprehensive README.md file for a Git repository that I will provide. This README should automatically extract information from the codebase to include:

    A project overview: A concise summary of what the project does.
    Code documentation: Explanations of key modules, functions, and their purpose, inferred from the code and any existing comments.
    Local setup instructions: Clear, step-by-step instructions on how to clone the repository and run the project locally. This should include prerequisites, installation steps, and how to start the application.
    Technologies used: A visually appealing list of the technologies utilized in the project.

    Here is the repository content:
    ${repoContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating documentation:', error);
    throw new Error('Failed to generate documentation');
  }
};