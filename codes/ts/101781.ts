'use server';

import {
  CharacterNameInput,
  GenerateCharacterNamesReturnType,
} from '@/types/name-generator';

/**
 * Call the Gemini API with the provided input, using structured output
 */
async function callGeminiAI(prompt: string, count?: number) {
  const API_KEY = process.env.GEMINI_API_TOKEN;

  if (!API_KEY) {
    throw new Error('GEMINI_API_TOKEN not found in environment variables');
  }

  console.log('Calling Gemini API with prompt:', prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.18,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              names: {
                type: 'ARRAY',
                items: {
                  type: 'STRING',
                },
                description: count
                  ? `Array of exactly ${count} character names`
                  : 'Array of character names',
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Error calling Gemini API: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

// Add to the CharacterNameInput type interface or add locally:
interface ExtendedCharacterNameInput extends CharacterNameInput {
  systemPromptOverride?: string;
  userPromptOverride?: string;
}

/**
 * Generate character names using Gemini API
 */
export async function generateCharacterNamesWithGemini(
  input: ExtendedCharacterNameInput
): GenerateCharacterNamesReturnType {
  try {
    const {
      genre,
      styles,
      complexity,
      gender,
      count,
      length,
      systemPromptOverride,
      userPromptOverride,
    } = input;

    const nameExampleWithCount = JSON.stringify({
      names: Array.from({ length: count! }, (_, i) => `Name${i + 1}`),
    });

    // Use override system prompt if provided, otherwise use default
    const systemPrompt =
      systemPromptOverride ||
      `You are an expert at generating creative names for game characters with specific themes and styles.

### RESPONSE FORMAT REQUIREMENTS:
- **You MUST respond with VALID JSON**
- **Your response MUST be ONLY a JSON object** with a "names" array containing EXACTLY "${count}" strings.
- **Do NOT include explanations or extra text**—only the JSON response.
- **Ensure the JSON object is fully closed** (}).

---

### **INSTRUCTIONS:**
Generate **EXACTLY** "${count}" unique character names based on the given attributes.

- **Genre**: "${genre}"
- **Styles**: [${styles?.join(', ') || 'None specified'}]  
  - _(If no styles are specified, use general themes and typical game characters for the genre.)_
- **Gender Association**: ${gender}
- **Name Length**: ${length}
  - **Short Names**: Single, easy-to-remember names.
  - **Medium Names**: More detailed, with 1-2 name components.
  - **Long Names**: Complex, with 2-3 name components (**never more than three**).

### **Complexity Level**: ${complexity}/5  
_(Describes name complexity, similar to temperature for LLMs.)_

#### **Complexity Guide:**
- **1/5** = Simple and easy to remember  
- **2/5** = Slightly more complex but still common  
- **3/5** = Balanced complexity (mix of common and unique names)  
- **4/5** = More unique and complex (may include special characters or unique spellings)  
- **5/5** = Highly unique and complex (may include invented names or rare words and special characters or unique spellings) - Special characters must be properly escaped. Each name should still be a single JSON string.

---

### **FINAL CHECK BEFORE RESPONDING**  
✅ Ensure the response follows ALL requirements, especially:  
- **EXACT number of names ("${count}") in the "names" array**  
- **No explanations, extra text, or markdown! Only pure, valid JSON**  

#### Example Output:
${nameExampleWithCount}
`;

    // Use override user prompt if provided, otherwise use default
    const userPrompt = userPromptOverride || `${JSON.stringify(input)}`;

    // Combine prompts for the Gemini API call
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Call the Gemini API with structured output
    const geminiResult = await callGeminiAI(fullPrompt, count!);

    // Extract the names directly from the structured JSON response
    const responseJson =
      geminiResult.candidates?.[0]?.content?.parts?.[0]?.functionCall
        ?.response || geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseJson) {
      return {
        success: false,
        message: 'Empty or invalid response from Gemini API',
        names: [],
      };
    }

    // Parse the JSON response if it's a string or use it directly if it's already parsed
    try {
      let namesData;
      if (typeof responseJson === 'string') {
        namesData = JSON.parse(responseJson);
      } else {
        namesData = responseJson;
      }

      if (Array.isArray(namesData.names) && namesData.names.length > 0) {
        return {
          success: true,
          message: `Generated ${namesData.names.length} character names successfully with Gemini`,
          names: namesData.names.slice(0, count),
        };
      } else {
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Error parsing Gemini API response:', error);
      return {
        success: false,
        message: `Parse error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        names: [],
      };
    }
  } catch (error) {
    console.error('Error generating character names with Gemini:', error);
    return {
      success: false,
      message: `Gemini AI error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      names: [],
    };
  }
}
