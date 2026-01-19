declare global {
  var _repomixCache: Record<string, string | null>;
}

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { processRepository } from "./repomix";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Use a capable model
});

const generationConfig = {
  temperature: 0.7,       // Controls randomness - lower is more deterministic
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,    // Adjust as needed for expected response length
  responseMimeType: "application/json",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Helper function to add delay with exponential backoff
 * @param attempt Current attempt number (starting from 1)
 * @returns Promise that resolves after the calculated delay
 */
const backoffDelay = async (attempt: number): Promise<void> => {
  // Exponential backoff formula: base * (2^attempt) with some randomization
  const delayMs = 1000 * Math.pow(2, attempt - 1) * (0.5 + Math.random());
  const cappedDelayMs = Math.min(delayMs, 10000); // Cap at 10 seconds
  console.log(`Rate limited by Gemini API. Backing off for ${Math.round(cappedDelayMs/1000)} seconds...`);
  return new Promise(resolve => setTimeout(resolve, cappedDelayMs));
};

/**
 * A wrapper function that handles retries with exponential backoff
 * @param apiCall The async function to retry
 * @param maxRetries Maximum number of retry attempts
 * @returns The result of the apiCall function
 */
async function withRetry<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // If this is a rate limit error (429)
      if (error.message && error.message.includes('429')) {
        console.log(`Gemini API rate limit hit (attempt ${attempt}/${maxRetries})`);
        
        // If we haven't reached max retries, wait and retry
        if (attempt < maxRetries) {
          await backoffDelay(attempt);
          continue;
        }
      }
      
      // For other errors or if we've exceeded max retries, throw the error
      throw error;
    }
  }
  
  // This should never be reached because the loop will either return or throw
  // But TypeScript requires it for type safety
  throw lastError;
}

/**
 * Generates an analysis of a technology based on its repository details using Gemini.
 * Now includes full repository code analysis using Repomix for deeper insights.
 * @param repoName The name of the repository.
 * @param repoDescription The description of the repository.
 * @param readmeContent The content of the repository's README file (or null).
 * @param owner The repository owner's login.
 * @param githubToken GitHub API token for authentication.
 * @param userPreferences Optional user preferences for personalized recommendations
 * @returns The generated analysis JSON object, or null if an error occurs.
 */
export async function generateTechAnalysis(
  repoName: string,
  repoDescription: string | null,
  readmeContent: string | null,
  owner: string,
  githubToken: string,
  userPreferences?: {
    programmingLanguages?: string[];
    experienceLevel?: string;
    techInterests?: string[];
    goals?: string;
  }
): Promise<any> {
  if (!apiKey) {
      console.error("Gemini API key is not configured.");
      return "Error: AI Analysis is not configured correctly.";
  }

  // Process the entire repository using Repomix
  console.log(`Starting Repomix processing for ${owner}/${repoName}...`);
  const repoContent = await processRepository(owner, repoName, githubToken);
  console.log(`Repomix processing ${repoContent ? 'completed' : 'failed'} for ${owner}/${repoName}`);

  // User preferences context for personalization
  const userContext = userPreferences 
    ? `
User Information:
- Programming Languages: ${userPreferences.programmingLanguages?.join(', ') || 'Not specified'}
- Experience Level: ${userPreferences.experienceLevel || 'Not specified'}
- Tech Interests: ${userPreferences.techInterests?.join(', ') || 'Not specified'}
- Goals: ${userPreferences.goals || 'Not specified'}
`
    : '';

  // Construct the prompt
  const context = `
Repository Name: ${repoName}
Repository Owner: ${owner}
Repository Description: ${repoDescription || 'Not provided.'}

README Content (excerpt):
---
${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...' : '') : 'Not available.'}
---

${repoContent ? `\n\nFull Repository Analysis (via Repomix):\n${repoContent.substring(0, 30000)}${repoContent.length > 30000 ? '...(content truncated)' : ''}` : 'Repository code analysis not available.'}
${userContext}
`;

  const prompt = `
Analyze the technology represented by the following GitHub repository based *only* on the provided context. Your analysis should feel personal and direct, like you're giving advice to a specific developer.

${context}

${userPreferences ? 'IMPORTANT: Personalize your analysis based on the user information provided. Tailor each section to consider the user\'s programming languages, experience level, tech interests, and goals. Make specific references to the user\'s background when explaining if the technology is right for them.' : 'Create a general analysis for a typical developer.'}

Return your analysis as a JSON object with 5 insightful sections, using the EXACT questions below. Each section should have the provided title (question) and content.

Your response format:
{
  "sections": [
    {
      "title": "Is this technology right for YOU?",
      "content": "Your analysis here, written in markdown format. Takes into account the reader's specific background, current stack, and career goals. For example: 'If you're already comfortable with Python and looking to build AI agents beyond simple chatbots, this is worth your time.'"
    },
    {
      "title": "Will this tech be dead in 6 months or is it worth your time?",
      "content": "Your analysis here, written in markdown format. Cut through the hype and marketing BS. Tell the reader if they're chasing a fad or something with staying power."
    },
    {
      "title": "Can you master this over a weekend, or will it consume your life?",
      "content": "Your analysis here, written in markdown format. Give the real learning curve without sugarcoating. Help the reader decide if the time investment makes sense."
    },
    {
      "title": "How will this make you more valuable than the devs who ignore it?",
      "content": "Your analysis here, written in markdown format. Show the career/skill advantage the reader will gain. Connect the tech to their professional growth."
    },
    {
      "title": "What's the \"aha!\" moment that makes this worth the struggle?",
      "content": "Your analysis here, written in markdown format. Identify the payoff that makes the learning curve worthwhile. Show the light at the end of the tunnel."
    }
  ]
}

Your response must be valid JSON only, with no other text or explanation. Make your content conversational, direct, and address the reader with "you" and "your". Keep the content actionable and insightful.

IMPORTANT: Do NOT start ANY of your responses with greetings like "Hey there!", "Hi", "Hello", or similar phrases. Jump straight into the analysis.
`;

  try {
    console.log(`Sending prompt to Gemini for ${repoName}...`);
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // Start a new chat session each time
    });

    const result = await withRetry(() => chatSession.sendMessage(prompt));
    const responseText = result.response.text();
    console.log(`Received response from Gemini for ${repoName}.`);
    
    try {
      // Try to parse the JSON response
      const jsonResponse = JSON.parse(responseText);
      return jsonResponse;
    } catch (parseError) {
      console.error(`Error parsing JSON response for ${repoName}:`, parseError);
      
      // Attempt to clean the response for better JSON parsing
      let cleanedText = responseText;
      
      // Remove potential markdown code blocks that might surround the JSON
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```$/, '');
      
      // Try to find the JSON object boundaries
      const jsonStartIndex = cleanedText.indexOf('{');
      const jsonEndIndex = cleanedText.lastIndexOf('}');
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const potentialJson = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        try {
          const reattemptParse = JSON.parse(potentialJson);
          console.log(`Successfully parsed JSON after cleanup for ${repoName}`);
          return reattemptParse;
        } catch (secondError) {
          console.error(`Failed second attempt to parse JSON for ${repoName}:`, secondError);
        }
      }
      
      // If all parsing attempts fail, return a fallback response
      return { 
        error: true, 
        message: "Could not parse the AI response as JSON. Please try again later.", 
        sections: [
          {
            title: "Is this technology right for YOU?",
            content: "We couldn't generate a detailed analysis at this time. Please check back later."
          },
          {
            title: "Will this tech be dead in 6 months or is it worth your time?",
            content: "Analysis unavailable due to technical issues."
          },
          {
            title: "Can you master this over a weekend, or will it consume your life?",
            content: "Analysis unavailable due to technical issues."
          },
          {
            title: "How will this make you more valuable than the devs who ignore it?",
            content: "Analysis unavailable due to technical issues."
          },
          {
            title: "What's the \"aha!\" moment that makes this worth the struggle?",
            content: "Analysis unavailable due to technical issues."
          }
        ],
        rawContent: responseText 
      };
    }

  } catch (error: any) {
      console.error(`Error generating analysis for ${repoName} with Gemini:`, error);
      if (error.message && error.message.includes('SAFETY')) {
          return {
            error: true,
            message: "Error: The response could not be generated due to safety filters.",
            sections: []
          };
      }
      return {
        error: true,
        message: `Error: ${error.message || 'An unknown error occurred during analysis.'}`,
        sections: []
      };
  }
}

/**
 * Generates a brief description of a technology based on repository details
 * This serves as a summary for the Description tab
 * @param repoName The name of the repository
 * @param repoDescription The original GitHub description
 * @param readmeContent The README content (or null)
 * @param owner The repository owner
 * @param githubToken GitHub API token for authentication
 * @returns A promise that resolves to a brief technology description
 */
export async function generateTechDescription(
  repoName: string,
  repoDescription: string | null,
  readmeContent: string | null,
  owner: string,
  githubToken: string
): Promise<string> {
  if (!apiKey) {
    console.error("Gemini API key is not configured.");
    return "Error: AI Description is not configured correctly.";
  }

  // Process the repository to get better context
  console.log(`Starting Repomix processing for brief description of ${owner}/${repoName}...`);
  const repoContent = await processRepository(owner, repoName, githubToken);
  console.log(`Repomix processing for description ${repoContent ? 'completed' : 'failed'} for ${owner}/${repoName}`);

  // Construct the prompt
  const context = `
Repository Name: ${repoName}
Repository Owner: ${owner}
Original Repository Description: ${repoDescription || 'Not provided.'}

README Content (excerpt):
---
${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...' : '') : 'Not available.'}
---

${repoContent ? `Full Repository Analysis (via Repomix):
${repoContent.substring(0, 30000)}${repoContent.length > 30000 ? '...(content truncated)' : ''}` : 'Repository code analysis not available.'}
`;

  const prompt = `
Based *only* on the provided context (including README and full repository analysis if available), generate an informative and engaging description paragraph (around 3-5 sentences) for the technology represented by the '${repoName}' repository owned by '${owner}'. 

${context}

Focus on summarizing the core purpose, key features, or intended use case. The tone should be suitable for a technical audience looking to understand the project quickly. Output only the description text, with no extra formatting or explanation.
`;

  try {
    console.log(`Sending description prompt to Gemini for ${repoName}...`);
    
    // Use a separate config for text response
    const textGenerationConfig = {
      ...generationConfig, // Inherit base config
      responseMimeType: "text/plain", 
      maxOutputTokens: 512, // Smaller max for description
    };

    const chatSession = model.startChat({
      generationConfig: textGenerationConfig,
      safetySettings,
      history: [],
    });

    const result = await withRetry(() => chatSession.sendMessage(prompt));
    const responseText = result.response.text();
    console.log(`Received description from Gemini for ${repoName}.`);
    return responseText.trim(); // Return the trimmed text

  } catch (error: any) {
      console.error(`Error generating description for ${repoName} with Gemini:`, error);
      if (error.message && error.message.includes('SAFETY')) {
          return "Error: The description could not be generated due to safety filters.";
      }
      return "Error: AI description could not be generated at this time.";
  }
}

/**
 * Generates a step by step guide for learning a technology using Gemini API
 */
export async function generateStepByStepGuide(
  repoName: string,
  repoDescription: string | null,
  readmeContent: string | null,
  owner: string,
  githubToken: string | undefined
): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      error: true,
      message: "Gemini API key is not configured.",
    };
  }

  try {
    // Get repository content from Repomix for deeper context
    console.log(`Starting Repomix processing for ${owner}/${repoName}...`);
    // Cache results to avoid repeated processing for the same repo
    const cacheKey = `${owner}/${repoName}`;
    // Use global cache if available or create it
    if (!global._repomixCache) {
      global._repomixCache = {};
    }
    
    let repoContent = null;
    // Check if we have cached results first
    if (global._repomixCache[cacheKey]) {
      console.log(`Using cached Repomix results for ${owner}/${repoName}`);
      repoContent = global._repomixCache[cacheKey];
    } else if (githubToken) {
      // Process repository and cache results
      repoContent = await processRepository(owner, repoName, githubToken);
      global._repomixCache[cacheKey] = repoContent;
      console.log(`Cached Repomix results for ${owner}/${repoName}`);
    }

    // Build context for the Gemini API - use smaller token counts to avoid quota issues
    const context = `
Repository Name: ${repoName}
Repository Owner: ${owner}
Repository Description: ${repoDescription || 'Not provided.'}
README Content: ${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...(content truncated)' : '') : 'Not available.'}
${repoContent ? `\n\nRepository Analysis (via Repomix):\n${repoContent.substring(0, 7000)}${repoContent.length > 7000 ? '...(content truncated)' : ''}` : 'Repository code analysis not available.'}
`;

    // Build the prompt for Gemini - explicitly format for JSON compatibility
    const prompt = `You are an expert technical instructor tasked with creating a comprehensive step-by-step guide for learning and using the technology "${repoName}". 

Use the provided repository information to create a detailed, practical guide that would help developers get started with this technology. The guide should be actionable, with practical code examples where appropriate.

${context}

IMPORTANT: Return ONLY valid JSON with NO MARKDOWN FORMATTING around it. Do NOT wrap your response in markdown code blocks (e.g., \`\`\`json). The response should be exactly in this format:

{
  "title": "Complete Guide to Implementing ${repoName}",
  "introduction": "A thorough introduction to the technology and what the guide will cover. Explain what problems this technology solves and why someone would want to use it.",
  "steps": [
    {
      "title": "Step Title - Start with a clear action verb", 
      "content": "Detailed explanation of this step including implementation details and insights. Write this as if you're teaching someone who needs clear instructions. Minimum 3-4 sentences per step.",
      "code": "// Practical, runnable code example that demonstrates this specific step\\n// Include comments explaining key parts\\n// Make sure all quotes are properly escaped\\n// Include import statements or dependencies when relevant",
      "list": ["Key point 1 about implementation", "Common mistake to avoid", "Tip for better usage"]
    }
  ]
}

Structure your guide with 5-7 logical steps that build on each other, from setup to advanced implementation:
1. Start with installation/setup instructions
2. Basic configuration 
3. Implementing core functionality
4. Advanced features or customization
5. Deployment or integration with other tools
6. Troubleshooting common issues (optional)
7. Best practices and optimization (optional)

CRITICAL: DO NOT use double quotes inside string values unless you escape them with a backslash. For example, write \\"quoted text\\" not "quoted text" when inside a JSON string. All quotes inside strings must be escaped.

I need a raw JSON response with NO CODE BLOCKS or other formatting. Again, do NOT wrap your response in \`\`\`json blocks.

Each step should provide VERY SPECIFIC implementation details, with real code that someone could copy and use. Include exact file paths, function names, and configuration options when possible.
`;

    // Call the Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Switch to Flash model for faster responses
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Execute the prompt with retry for rate limiting
    let result;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        result = await withRetry(() => model.generateContent(prompt));
        break; // Success, exit the retry loop
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error?.message?.includes('429') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Rate limit hit, retrying (${retryCount}/${maxRetries})...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          continue;
        }
        
        // For rate limit errors that we couldn't recover from, return a friendly error
        if (error?.message?.includes('429')) {
          return {
            error: true,
            message: "API rate limit exceeded. Please try again in a few minutes."
          };
        }
        
        // Not a rate limit or we've exceeded retries
        throw error;
      }
    }
    
    if (!result) {
      return {
        error: true,
        message: "Failed to generate content."
      };
    }

    let responseText = "";
    try {
      const response = result.response;
      try {
        responseText = response.text();
      } catch (e) {
        // Ignore if we can't get the text
      }
      console.log(`Received response from Gemini for guide generation: ${repoName}`);
      
      // Try to parse the returned JSON
      console.log(`Attempting to parse JSON: ${responseText.substring(0, 100)}...`);
      
      try {
        // Direct parse attempt first
        return JSON.parse(responseText);
      } catch (parseError) {
        console.log("Initial JSON parse failed, applying more aggressive fixes");
        // If failed, try to sanitize and fix the JSON
        const sanitized = sanitizeJsonString(responseText);
        
        try {
          return JSON.parse(sanitized);
        } catch (sanitizeError) {
          console.error("Failed to parse even after sanitization:", sanitizeError);
          // Last resort: provide a fallback guide
          return createFallbackGuide(repoName, owner);
        }
      }
    } catch (jsonError: any) {
      console.error("Failed to parse Gemini response as JSON:", jsonError);
      
      return {
        error: true,
        message: "Failed to parse AI response. The response was not in the expected format.",
        rawContent: responseText,
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Check specifically for rate limit errors
    if (error instanceof Error && error.message.includes('429')) {
      return {
        error: true,
        message: "API rate limit exceeded. Please try again in a few minutes.",
      };
    }
    
    return {
      error: true,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

function createFallbackGuide(repoName: string, owner: string): any {
  return {
    title: `Getting Started with ${repoName}`,
    introduction: `This guide will help you learn how to use ${repoName}. Note: This is a fallback guide due to formatting issues with the AI response.`,
    steps: [
      {
        title: "Installation",
        content: `To use ${repoName}, first follow the instructions in the repository.`,
      },
      {
        title: "Basic Usage",
        content: "Check the README for basic usage instructions.",
      },
      {
        title: "Additional Resources",
        content: `Visit the GitHub repository for more details: https://github.com/${owner}/${repoName}`,
      },
    ],
    error: true,
    message: "Failed to parse AI response. Using fallback guide.",
  };
}

/**
 * Helper function for sanitizing JSON strings that might have formatting issues
 */
export function sanitizeJsonString(jsonString: string): string {
  let cleaned = jsonString.trim();
  
  // First, strip markdown code blocks if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
    console.log("Removed markdown code block wrapping");
  }

  // Try to find and extract JSON object if not the entire string
  if (!cleaned.startsWith("{")) {
    const jsonObjectMatch = cleaned.match(/{[\s\S]*?}/);
    if (jsonObjectMatch) {
      cleaned = jsonObjectMatch[0];
      console.log("Extracted JSON object from text");
    }
  }

  // Check if it's already valid JSON
  if (isValidJson(cleaned)) {
    return cleaned;
  }
  
  // First pass of basic cleanup
  cleaned = cleaned
    .replace(/(\w+)\s*:/g, '"$1":')  // Convert unquoted property names to quoted
    .replace(/:\s*'([^']*)'/g, ':"$1"')  // Convert single quoted values to double quotes
    .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
    .replace(/\\'/g, "'"); // Fix escaped single quotes
  
  try {
    // Test if it's already valid
    JSON.parse(cleaned);
    return cleaned;
  } catch (e: any) {
    console.log("Initial JSON parse failed, applying more aggressive fixes");
    
    // Check if it's a specific error at line 6
    if (e.message && (e.message.includes('line 6') || e.message.includes('position 4'))) {
      console.log("Detected common error pattern on line 6, applying targeted fix");
      
      // Split the string into lines for easier manipulation
      const lines = cleaned.split('\n');
      
      // If we have at least 6 lines, try to fix line 6 specifically
      if (lines.length >= 6) {
        const problematicLine = lines[5]; // Line 6 (0-indexed)
        console.log("Problematic line:", problematicLine);
        
        // Common patterns in line 6 that cause issues
        if (problematicLine.includes('"steps":')) {
          // Check for missing comma after the steps array opening
          if (problematicLine.includes('"steps": [')) {
            // Already looks correct, might be an issue in the next line
          } 
          // Sometimes the JSON has problematic characters or unclosed quotes
          // Replace the entire line with a known good format
          lines[5] = '  "steps": [';
          
          // Check the next line if possible
          if (lines.length > 6) {
            // Make sure the next line starts a proper object
            if (!lines[6].trimStart().startsWith('{')) {
              lines[6] = '    {';
            }
          }
        }
        cleaned = lines.join('\n');
      }
      
      // Look for specific patterns that frequently break the JSON
      cleaned = cleaned.replace(/"steps":\s*\[([\s\S]*?)(]|}$)/, '"steps": [{\n$1\n    }, {');
    }
    
    // More aggressive cleaning if still invalid
    if (!isValidJson(cleaned)) {
      // Attempt specific structural fixes for common patterns
      
      // If the content doesn't start with {, add it
      if (!cleaned.trim().startsWith('{')) {
        cleaned = '{' + cleaned.trim();
      }
      
      // If the content doesn't end with }, add it
      if (!cleaned.trim().endsWith('}')) {
        cleaned = cleaned.trim() + '}';
      }
      
      // Fix steps array pattern issues - this is the most common problem
      // First, replace any incomplete steps array with a properly formatted one
      if (cleaned.includes('"steps":')) {
        // Extract the steps array content
        const stepsPattern = /"steps"\s*:\s*\[([\s\S]*?)(?:\]\s*}|\}$)/;
        const stepsMatch = cleaned.match(stepsPattern);
        
        if (stepsMatch && stepsMatch[1]) {
          const stepsContent = stepsMatch[1].trim();
          
          // Split steps by looking for closing } followed by comma or other indicators of step separation
          const stepItems = stepsContent.split(/\}\s*,\s*\{/);
          
          // Rebuild steps array with proper formatting
          let newStepsArray = '"steps": [';
          
          stepItems.forEach((step, index) => {
            // Clean up the individual step
            let cleanStep = step.trim();
            
            // Add opening brace if missing
            if (!cleanStep.startsWith('{')) {
              cleanStep = '{' + cleanStep;
            }
            
            // Add closing brace if missing
            if (!cleanStep.endsWith('}')) {
              cleanStep = cleanStep + '}';
            }
            
            // Add to array
            newStepsArray += cleanStep;
            
            // Add separator between steps
            if (index < stepItems.length - 1) {
              newStepsArray += ', ';
            }
          });
          
          // Close the array
          newStepsArray += ']';
          
          // Replace the steps section in the original JSON
          cleaned = cleaned.replace(/"steps"\s*:\s*\[([\s\S]*?)(?:\]\s*}|\}$)/, newStepsArray);
        }
      }
      
      // Last resort - extremely aggressive cleaning
      if (!isValidJson(cleaned)) {
        // Try to extract each section manually and rebuild
        const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
        const introMatch = cleaned.match(/"introduction"\s*:\s*"([^"]+)"/);
        
        // Build minimum valid JSON if we can
        if (titleMatch && introMatch) {
          cleaned = `{
            "title": "${titleMatch[1]}",
            "introduction": "${introMatch[1]}",
            "steps": [
              {
                "title": "Getting Started",
                "content": "Initial steps to get started with this technology.",
                "code": "// Basic starter code"
              }
            ]
          }`;
        }
      }
    }
    
    // Final pass attempt - often the JSON has issues around the steps array
    // Try to reconstruct using the parts we can extract reliably
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (err: any) {
      console.log("JSON still invalid, attempting reconstruction", err.message);
      
      // Extract the key parts even if the JSON is malformed
      const titleMatch = cleaned.match(/"title":\s*"([^"]*)"/);
      const introMatch = cleaned.match(/"introduction":\s*"([^"]*)"/);
      
      if (titleMatch && introMatch) {
        console.log("Found title and intro, rebuilding JSON");
        
        // Try to extract step information - even partial
        const stepsPattern = /"steps"\s*:\s*\[([\s\S]*?)(]|}$)/;
        const stepsMatch = cleaned.match(stepsPattern);
        let stepsContent = '';
        
        if (stepsMatch && stepsMatch[1]) {
          // Try to extract individual steps, even if imperfect
          const stepObjects = stepsMatch[1].split('},').filter(s => s.includes('"title"'));
          
          stepsContent = stepObjects.map(stepStr => {
            const stepTitleMatch = stepStr.match(/"title":\s*"([^"]*)"/);
            const stepContentMatch = stepStr.match(/"content":\s*"([^"]*)"/);
            
            const title = stepTitleMatch ? stepTitleMatch[1] : "Step";
            const content = stepContentMatch ? stepContentMatch[1] : "Details for this step";
            
            return `    {
      "title": "${title}",
      "content": "${content}"
    }`;
          }).join(',\n');
        }
        
        // If we couldn't extract steps, create a minimal default
        if (!stepsContent) {
          stepsContent = `    {
      "title": "Getting Started",
      "content": "Start using ${titleMatch[1]}"
    }`;
        }
        
        // Rebuild full JSON with what we could extract
        return `{
  "title": "${titleMatch[1]}",
  "introduction": "${introMatch[1]}",
  "steps": [
${stepsContent}
  ]
}`;
      }
      
      // If we can't extract even the title and intro, return a minimal valid JSON
      return `{
  "title": "Guide for Using This Technology",
  "introduction": "This guide will help you learn how to use this technology effectively.",
  "steps": [
    {
      "title": "Getting Started",
      "content": "Check the repository documentation for more details."
    }
  ]
}`;
    }
  }
}

function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e: any) {
    return false;
  }
}
