
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai"; // Needed for safety settings

/**
 * Analyzes a resume against a job description using Google Gemini via LangChain.
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<{score: number, goodPoints: string[], badPoints: string[]}>}
 */
export const analyzeResumeWithAI = async (resumeText, jobDescription) => {
  console.log("Starting AI analysis using Gemini..."); // Changed log message back

  if (!resumeText?.trim() || !jobDescription?.trim()) {
    throw new Error("Missing resumeText or jobDescription for AI analysis.");
  }

  try {
    
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY, 
      model: "gemini-1.5-flash", 
      temperature: 0.2, 
      maxOutputTokens: 2000, 
      
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

   
    const prompt = new PromptTemplate({
      inputVariables: ["resumeText", "jobDescription"],
      template: `
You are an AI assistant specialized in analyzing resumes against job descriptions.
Given a job description and a candidate's resume, provide a score (out of 100) indicating how well the resume matches the job description.
Also, list specific "Good Points" and "Bad Points" that directly relate to the job description, as a JSON object. Focus on quantifiable achievements and relevant skills.

Job Description:
{jobDescription}

Resume:
{resumeText}

JSON Output format:
{{
  "score": number,
  "goodPoints": string[],
  "badPoints": string[]
}}
Ensure the output is valid JSON and nothing else. Do not include any extra text or markdown outside the JSON.
`
    });

    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      resumeText,
      jobDescription,
    });

   
    let cleanedResponse = response.trim();
  
    const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
        cleanedResponse = jsonMatch[1]; // Use the content inside the markdown block
    } else {
       
        console.warn("AI response did not contain a JSON markdown block. Attempting to parse raw response (trimmed).");
    }
    

    let parsed;
    try {
        parsed = JSON.parse(cleanedResponse); // Parse the cleaned response
    } catch (jsonError) {
        console.error("Failed to parse AI response as JSON:", cleanedResponse); // Log the cleaned response
        throw new Error(`AI returned invalid JSON. Response snippet: ${cleanedResponse.substring(0, 200)}...`);
    }

    if (
      typeof parsed.score !== "number" ||
      !Array.isArray(parsed.goodPoints) ||
      !Array.isArray(parsed.badPoints)
    ) {
      throw new Error(`Invalid response format from Gemini. Expected score (number), goodPoints (array), badPoints (array). Received: ${JSON.stringify(parsed)}`);
    }

    return parsed;
  } catch (error) {
    console.error("Error in analyzeResumeWithAI:", error);
   
    throw new Error(`AI analysis failed: ${error.message}. Please verify your Google Gemini API key and model access.`);
  }
};
