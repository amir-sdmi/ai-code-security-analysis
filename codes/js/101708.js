import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from '../models/message.model.js';  // Add this import

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({ 
  //we are going to use gemini-2.0-flash-exp in hackathon 
  // for development purpose you can use gemini-1.5-pro model
    model: "gemini-2.0-flash-exp",
    systemInstruction: `
    You are BUTO AI, a professional software development assistant.
    ALL responses must be valid JSON objects following this exact structure:
    {
      "explanation": "Your response text here, using markdown formatting",
      "files": {},
      "buildSteps": [],
      "runCommands": []
    }

    Response types:
    1. For general questions/conversation:
      - Put your response in the "explanation" field
      - Leave other fields as empty arrays/objects
      
    2. For code generation:
      - Put implementation details in "explanation"
      - Add code files in "files" object
      - Include relevant build/run instructions
    
    Examples:

    1. General question response:
    {
      "explanation": "To optimize database performance, you should: \n\n1. Index frequently queried columns\n2. Use query caching\n3. Optimize table structures",
      "files": {},
      "buildSteps": [],
      "runCommands": []
    }

    2. Code generation response:
    {
      "explanation": "Here's a Python hello world program with detailed explanation...",
      "files": {
        "hello.py": "print('Hello, World!')"
      },
      "buildSteps": ["Install Python 3.x"],
      "runCommands": ["python hello.py"]
    }

    Rules:
    - ALWAYS return a valid JSON object
    - NEVER return plain text responses
    - Use markdown formatting in explanations
    - Include all four fields in every response
    - Keep code and explanations separate
    - Follow language-specific best practices
    - Provide complete, functional code
    `,
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const removeAllTripleBackticks = (text) => {
  // Remove all instances of ```
  return text.replace(/```/g, '');
};

const extractJsonObject = (text) => {
  // Find the first '{'
  const start = text.indexOf('{');
  // Find the last '}'
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in response');
  }
  // Extract substring and remove backticks
  const jsonString = text.slice(start, end + 1).replace(/`/g, '');
  return JSON.parse(jsonString);
};

const generateResultWithRetry = async (prompt, retries = 3, backoff = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Remove any markdown code block formatting if present
        const cleanedResponse = responseText
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        
        const finalResponse = extractJsonObject(cleanedResponse);

        return finalResponse;
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (error.status === 503) {
        console.log(`API overloaded, attempt ${i + 1} of ${retries}. Waiting ${backoff}ms...`);
        if (i < retries - 1) {
          await delay(backoff);
          backoff *= 2; // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }
  
  throw new Error('Maximum retries reached');
};

// Add function to get project context
const getProjectContext = async (projectId, currentPrompt) => {
  try {
    const previousMessages = await Message.find({
      projectId,
      isAiResponse: true,
      files: { $exists: true, $ne: [] }
    })
    .sort({ timestamp: -1 })
    .limit(5);  // Get last 5 AI responses with files

    if (previousMessages.length === 0) return currentPrompt;

    const context = previousMessages.map(msg => ({
      prompt: msg.prompt,
      files: msg.files.reduce((acc, file) => {
        acc[file.name] = file.content;
        return acc;
      }, {})
    })).reverse();

    return `
Previous context:
${context.map(ctx => `
Prompt: ${ctx.prompt}
Generated files:
${Object.entries(ctx.files).map(([name, content]) => `
File: ${name}
\`\`\`
${content}
\`\`\`
`).join('\n')}
`).join('\n')}

Current request: ${currentPrompt}

Based on the previous context, please update or create new files as needed. Maintain consistency with existing code.`;
  } catch (error) {
    console.error('Error getting project context:', error);
    return currentPrompt;
  }
};

export const generateResult = async (prompt, projectId) => {
  try {
    // Get context-aware prompt
    const contextualPrompt = await getProjectContext(projectId, prompt);
    
    const response = await generateResultWithRetry(contextualPrompt);
    return {
      explanation: response.explanation || "No explanation provided",
      files: response.files || {},
      buildSteps: response.buildSteps || [],
      runCommands: response.runCommands || []
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      explanation: error.status === 503 
        ? "The AI service is currently overloaded. Please try again in a few moments."
        : "Error: Failed to process the AI response. Please try again.",
      files: {},
      buildSteps: [],
      runCommands: []
    };
  }
};