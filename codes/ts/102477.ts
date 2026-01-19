import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the API with the key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Validate API key
if (!apiKey) {
  console.error("Gemini API key is missing. Make sure NEXT_PUBLIC_GEMINI_API_KEY is set in your .env file");
}

// Initialize the GenAI instance
const genAI = new GoogleGenerativeAI(apiKey || "");

// Get the Gemini model (use Gemini Flash 2.0)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Configure safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Generic function to generate content with Gemini
export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file.");
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw new Error('Failed to generate content. Please check your API key in .env file and try again.');
  }
}

/**
 * Analyzes a resume using Gemini API
 * @param resumeText The resume text to analyze
 * @param jobDescription Optional job description for context
 * @returns Analysis results
 */
export async function analyzeResume(resumeText: string, jobDescription?: string) {
  try {
    // Use the initialized flash model
    const prompt = `Please analyze this resume accurately${jobDescription ? ' for the following job description' : ''}:
    
    ${jobDescription ? `Job Description:\n${jobDescription}\n\nResume:\n` : ''}${resumeText}
    
    Provide a structured analysis with the following components:
    1. A concise summary of the resume's key points and overall assessment
    2. Overall ATS compatibility score (0-100)
    3. Section scores for different parts (experience, education, skills, etc.)
    4. Keyword match percentage
    5. Missing important keywords
    6. Strengths of the resume
    7. Areas for improvement
    
    Format the response ONLY as a JSON object with the following structure, without any text before or after:
    {
      "summary": string,
      "score": number,
      "sectionScores": { "section": number },
      "keywordMatches": number,
      "missingKeywords": string[],
      "strengths": string[],
      "improvements": string[]
    }
    
    IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // First try direct parsing
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed initial JSON parse, attempting to extract JSON:', error);
      
      // Try to extract a valid JSON object from the text
      const jsonRegex = /{[\s\S]*}/g;
      const match = text.match(jsonRegex);
      
      if (match && match[0]) {
        try {
          const extractedJson = JSON.parse(match[0]);
          return extractedJson;
        } catch (jsonError) {
          console.error('Failed to parse extracted JSON:', jsonError);
        }
      }
      
      // If all else fails, return a default structure with the raw text as a note
      return {
        summary: "Unable to generate a detailed analysis. Please try again.",
        score: 70,
        sectionScores: { "overall": 70 },
        keywordMatches: 60,
        missingKeywords: [],
        strengths: ["Resume has some good elements"],
        improvements: ["Unable to parse detailed analysis - please try again"],
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Extracts text from a PDF file
 * @param file PDF file to extract text from
 * @returns Extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // First try simple text extraction
    let simpleText = await file.text();
    
    // If the extracted text looks like PDF binary data, it's not properly extracted
    if (simpleText.startsWith('%PDF-') || simpleText.includes('endobj') || simpleText.includes('/Type /Page')) {
      console.warn('Detected raw PDF binary data, content needs better extraction');
      
      // Try to use a more targeted extraction approach
      try {
        // Create a prompt for extracting text from a PDF
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        // If file size is too large for model context window, return instruction message
        if (base64Data.length > 500000) { // ~500KB limit for base64
          return `This PDF file is too large for automated text extraction. Please copy the text manually into the text area.`;
        }
        
        // Create a prompt to extract text
        const prompt = `I'm going to give you a base64-encoded PDF file. Your task is to extract all the text content from it and return ONLY the extracted text with no additional commentary.

Here's the PDF file (base64 encoded):
${base64Data}

Please return ONLY the extracted text content from the PDF.`;

        // Generate content with a timeout to avoid long-running requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });
          clearTimeout(timeoutId);
          
          const response = await result.response;
          const extractedText = response.text();
          
          if (extractedText && extractedText.trim().length > 0 && !extractedText.includes("I apologize")) {
            return extractedText;
          }
        } catch (genError) {
          console.error("Error extracting text with Gemini:", genError);
          // Continue to fallback
        }
      } catch (e) {
        console.error("Error with advanced PDF extraction:", e);
        // Continue to fallback
      }
      
      // If extraction failed, provide guidance
      return `[This PDF requires manual text extraction. 

For best results:
1. Open this PDF in a PDF reader
2. Select all text (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)
4. Paste into the resume text area]`;
    }
    
    // If the text looks valid, return it
    if (simpleText && simpleText.length > 100 && !simpleText.includes('')) {
      return simpleText;
    }
    
    // If we have very little text or it contains placeholder characters, provide guidance
    return `[This PDF contains limited or no extractable text. It may be a scanned document or image-based PDF.
    
For best results:
1. Try uploading a text-based PDF 
2. Or manually type the resume content in the text area]`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is not password protected and contains selectable text.');
  }
}

// Update the analyzeResumePDF function to handle errors better
export async function analyzeResumePDF(file: File, jobDescription?: string) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    const text = await extractTextFromPDF(file);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from PDF. Please ensure the file contains selectable text.');
    }

    return analyzeResume(text, jobDescription);
  } catch (error) {
    console.error('Error analyzing PDF resume:', error);
    throw error;
  }
}

/**
 * Analyzes a job description using Gemini API
 * @param jobDescription The job description text to analyze
 * @returns Structured analysis of the job description
 */
export async function analyzeJobDescription(jobDescription: string) {
  try {
    const prompt = `Please analyze this job description and provide a structured summary with the following components:
    1. A brief, concise summary (1-2 sentences)
    2. Key requirements - list the 3-5 most important skills, qualifications, or experience needed
    3. Key responsibilities - list the 3-5 most important job duties or tasks
    
    Keep each section brief and to the point. Focus on the most important information only.
    
    Job Description:
    ${jobDescription}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Split the text into sections
    const sections = text.split(/\n\s*\n/);
    
    // Extract relevant parts
    let summary = "";
    let requirements: string[] = [];
    let responsibilities: string[] = [];
    
    for (const section of sections) {
      if (section.toLowerCase().includes("summary") || section.match(/^[^:•\n-]*$/)) {
        summary = section.replace(/^summary:?\s*/i, "").trim();
      } else if (section.toLowerCase().includes("requirement") || section.toLowerCase().includes("qualification") || section.toLowerCase().includes("skill")) {
        requirements = extractListItems(section);
      } else if (section.toLowerCase().includes("responsibilit") || section.toLowerCase().includes("dutie")) {
        responsibilities = extractListItems(section);
      }
    }
    
    // If summary wasn't extracted properly, use the first section
    if (!summary && sections.length > 0) {
      summary = sections[0].trim();
    }
    
    // Return structured data but in a format easily converted to text
    return {
      summary,
      requirements,
      responsibilities,
      plainText: {
        summary,
        requirements: requirements.join("\n"),
        responsibilities: responsibilities.join("\n")
      }
    };
  } catch (error) {
    console.error('Error analyzing job description:', error);
    return {
      summary: "Unable to analyze job description. Please try again.",
      requirements: [] as string[],
      responsibilities: [] as string[],
      plainText: {
        summary: "Unable to analyze job description. Please try again.",
        requirements: "",
        responsibilities: ""
      }
    };
  }
}

/**
 * Helper function to extract list items from a text section
 */
function extractListItems(text: string): string[] {
  // Remove section header
  const content = text.replace(/^[^:]*:\s*/i, "");
  
  // Try to find list items with bullets, numbers, or dashes
  const listItemRegex = /(?:^|\n)[•\-*\d]+\.?\s*([^\n]+)/g;
  const matches = Array.from(content.matchAll(listItemRegex));
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim());
  }
  
  // If no list items found, split by newlines
  return content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Generate a cover letter using the Gemini API
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  position: string,
  options: { formalTone: boolean; includingSkills: boolean }
) {
  try {
    // Create the prompt with all the necessary information
    const prompt = `Create a personalized cover letter based on the resume and job description below:
    
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Company: ${companyName}
    Position: ${position}
    Tone: ${options.formalTone ? 'Formal and professional' : 'Conversational but professional'}
    Include Specific Skills: ${options.includingSkills ? 'Yes, highlight quantifiable achievements and specific skills' : 'Focus more on general qualifications and fit'}
    
    Please create a well-structured cover letter that:
    1. Grabs attention in the opening paragraph
    2. Highlights relevant experience and skills from the resume that match the job description
    3. Explains why the candidate is a good fit for the company culture
    4. Includes a clear call to action in the closing paragraph
    
    Also provide metadata in the following JSON format at the end:
    {
      "keywords": ["keyword1", "keyword2", "keyword3"], // Important keywords used in the letter
      "wordCount": 320, // Total word count
      "tips": ["Use consistent formatting", "Add more industry jargon", "Consider mentioning a company achievement"] // 2-3 tips for improvement
    }
    
    Generate the cover letter first, followed by the metadata JSON.`;

    // Generate the content using the initialized flash model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract cover letter and metadata
    const jsonStartIndex = text.lastIndexOf('{');
    if (jsonStartIndex !== -1) {
      const coverLetter = text.substring(0, jsonStartIndex).trim();
      const jsonStr = text.substring(jsonStartIndex);
      
      try {
        const metadata = JSON.parse(jsonStr);
        return { coverLetter, metadata };
      } catch (e) {
        return { coverLetter, metadata: {} };
      }
    } else {
      return { coverLetter: text, metadata: {} };
    }
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw error;
  }
}

/**
 * Generate a cover letter from a PDF resume using the Gemini API
 */
export async function generateCoverLetterFromPDF(
  pdfFile: File,
  jobDescription: string,
  companyName: string,
  position: string,
  options: { formalTone: boolean; includingSkills: boolean }
) {
  try {
    // First extract text from PDF
    const resumeText = await extractTextFromPDF(pdfFile);
    
    // Then generate cover letter using the extracted text
    return generateCoverLetter(resumeText, jobDescription, companyName, position, options);
  } catch (error) {
    console.error("Error generating cover letter from PDF:", error);
    throw error;
  }
}

/**
 * Get personalized learning recommendations using the Gemini API
 */
export async function getLearningRecommendations(resumeText: string, jobDescription?: string) {
  try {
    // Create the prompt
    let prompt = `Based on the following resume, provide personalized learning recommendations:
    
    ${resumeText}
    
    Analyze the skills and experience in this resume and provide a JSON response with the following:
    {
      "recommendedCourses": [
        {
          "id": "1",
          "title": "Course title",
          "provider": "Provider name",
          "duration": "X hours",
          "level": "Beginner/Intermediate/Advanced",
          "rating": 4.8,
          "students": 12500,
          "image": "https://placehold.co/100/e9e9e9/999999?text=Course",
          "relevance": 95,
          "category": "technical/soft"
        }
      ],
      "skillGaps": [
        {
          "skill": "Skill name",
          "currentLevel": 25,
          "requiredLevel": 70,
          "category": "technical/soft",
          "description": "Description of why this skill is important"
        }
      ],
      "projects": [
        {
          "id": "1",
          "title": "Project title",
          "skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
          "difficulty": "Beginner/Intermediate/Advanced",
          "duration": "Estimated time to complete",
          "description": "Brief description of the project"
        }
      ]
    }
    
    IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.`;

    if (jobDescription) {
      prompt += `\n\nConsider the following job description for more targeted recommendations:
      
      ${jobDescription}`;
    }

    // Generate the content using the initialized flash model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // First try to parse the whole response as JSON
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed initial JSON parse, attempting to extract JSON:', error);
      
      // Try to extract a valid JSON object from the text
      const jsonRegex = /{[\s\S]*}/g;
      const match = text.match(jsonRegex);
      
      if (match && match[0]) {
        try {
          const extractedJson = JSON.parse(match[0]);
          return extractedJson;
        } catch (jsonError) {
          console.error('Failed to parse extracted JSON:', jsonError);
        }
      }
      
      // If JSON parsing fails, return a default response
      return {
        recommendedCourses: [
          {
            id: "1",
            title: "Web Development Fundamentals",
            provider: "Coursera",
            duration: "10 hours",
            level: "Beginner",
            rating: 4.7,
            students: 15000,
            image: "https://placehold.co/100/e9e9e9/999999?text=Web",
            relevance: 90,
            category: "technical"
          },
          {
            id: "2",
            title: "Professional Communication Skills",
            provider: "LinkedIn Learning",
            duration: "5 hours",
            level: "All Levels",
            rating: 4.8,
            students: 8000,
            image: "https://placehold.co/100/e9e9e9/999999?text=Comm",
            relevance: 85,
            category: "soft"
          }
        ],
        skillGaps: [
          {
            skill: "JavaScript",
            currentLevel: 30,
            requiredLevel: 70,
            category: "technical",
            description: "Foundation for web development"
          },
          {
            skill: "Communication",
            currentLevel: 45,
            requiredLevel: 75,
            category: "soft",
            description: "Essential for team collaboration and client interaction"
          }
        ],
        projects: [
          {
            id: "1",
            title: "Personal Portfolio Website",
            skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
            difficulty: "Beginner",
            duration: "2 weeks",
            description: "Create a responsive portfolio website to showcase your skills and projects."
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error getting learning recommendations:", error);
    // Instead of throwing, return a default response
    return {
      recommendedCourses: [
        {
          id: "1",
          title: "Web Development Fundamentals",
          provider: "Coursera",
          duration: "10 hours",
          level: "Beginner",
          rating: 4.7,
          students: 15000,
          image: "https://placehold.co/100/e9e9e9/999999?text=Web",
          relevance: 90,
          category: "technical"
        },
        {
          id: "2",
          title: "Professional Communication Skills",
          provider: "LinkedIn Learning",
          duration: "5 hours",
          level: "All Levels",
          rating: 4.8,
          students: 8000,
          image: "https://placehold.co/100/e9e9e9/999999?text=Comm",
          relevance: 85,
          category: "soft"
        }
      ],
      skillGaps: [
        {
          skill: "JavaScript",
          currentLevel: 30,
          requiredLevel: 70,
          category: "technical",
          description: "Foundation for web development"
        },
        {
          skill: "Communication",
          currentLevel: 45,
          requiredLevel: 75,
          category: "soft",
          description: "Essential for team collaboration and client interaction"
        }
      ],
      projects: [
        {
          id: "1",
          title: "Personal Portfolio Website",
          skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
          difficulty: "Beginner",
          duration: "2 weeks",
          description: "Create a responsive portfolio website to showcase your skills and projects."
        }
      ]
    };
  }
}

/**
 * Get learning recommendations from a PDF resume using the Gemini API
 */
export async function getLearningRecommendationsFromPDF(pdfFile: File, jobDescription?: string) {
  try {
    // First extract text from PDF
    const resumeText = await extractTextFromPDF(pdfFile);
    
    // Check if we got a guidance message instead of actual text
    if (resumeText.includes('[This PDF requires manual text extraction') || 
        resumeText.includes('This PDF file is too large') ||
        resumeText.includes('[This PDF contains limited or no extractable text')) {
      console.warn('PDF text extraction returned guidance message:', resumeText);
      
      // Return default recommendations instead of throwing
      return {
        recommendedCourses: [
          {
            id: "1",
            title: "Web Development Fundamentals",
            provider: "Coursera",
            duration: "10 hours",
            level: "Beginner",
            rating: 4.7,
            students: 15000,
            image: "https://placehold.co/100/e9e9e9/999999?text=Web",
            relevance: 90,
            category: "technical"
          },
          {
            id: "2",
            title: "Professional Communication Skills",
            provider: "LinkedIn Learning",
            duration: "5 hours",
            level: "All Levels",
            rating: 4.8,
            students: 8000,
            image: "https://placehold.co/100/e9e9e9/999999?text=Comm",
            relevance: 85,
            category: "soft"
          }
        ],
        skillGaps: [
          {
            skill: "JavaScript",
            currentLevel: 30,
            requiredLevel: 70,
            category: "technical",
            description: "Foundation for web development"
          },
          {
            skill: "Communication",
            currentLevel: 45,
            requiredLevel: 75,
            category: "soft",
            description: "Essential for team collaboration and client interaction"
          }
        ],
        projects: [
          {
            id: "1",
            title: "Personal Portfolio Website",
            skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
            difficulty: "Beginner",
            duration: "2 weeks",
            description: "Create a responsive portfolio website to showcase your skills and projects."
          }
        ]
      };
    }
    
    // Then get recommendations using the extracted text
    return getLearningRecommendations(resumeText, jobDescription);
  } catch (error) {
    console.error("Error getting learning recommendations from PDF:", error);
    // Return default recommendations instead of throwing
    return {
      recommendedCourses: [
        {
          id: "1",
          title: "Web Development Fundamentals",
          provider: "Coursera",
          duration: "10 hours",
          level: "Beginner",
          rating: 4.7,
          students: 15000,
          image: "https://placehold.co/100/e9e9e9/999999?text=Web",
          relevance: 90,
          category: "technical"
        },
        {
          id: "2",
          title: "Professional Communication Skills",
          provider: "LinkedIn Learning",
          duration: "5 hours",
          level: "All Levels",
          rating: 4.8,
          students: 8000,
          image: "https://placehold.co/100/e9e9e9/999999?text=Comm",
          relevance: 85,
          category: "soft"
        }
      ],
      skillGaps: [
        {
          skill: "JavaScript",
          currentLevel: 30,
          requiredLevel: 70,
          category: "technical",
          description: "Foundation for web development"
        },
        {
          skill: "Communication",
          currentLevel: 45,
          requiredLevel: 75,
          category: "soft",
          description: "Essential for team collaboration and client interaction"
        }
      ],
      projects: [
        {
          id: "1",
          title: "Personal Portfolio Website",
          skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
          difficulty: "Beginner",
          duration: "2 weeks",
          description: "Create a responsive portfolio website to showcase your skills and projects."
        }
      ]
    };
  }
}

/**
 * Get a response from the AI chatbot using the Gemini API
 */
export async function getChatResponse(messages: { role: string; content: string }[], contextText?: string) {
  try {
    // Prepare the conversation history
    const history = messages.slice(-6); // Include only last 6 messages for context
    
    // Create the prompt
    let prompt = `You are an AI resume and job application assistant. Be helpful, concise, and provide specific advice.
    
    CONVERSATION HISTORY:
    ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    `;
    
    if (contextText && contextText.trim()) {
      prompt += `CONTEXT DOCUMENTS:
      ${contextText}
      
      Please consider this context when providing advice.
      `;
    }
    
    prompt += `Please respond to the user's most recent message.`;

    // Generate the content using the initialized flash model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting chat response:", error);
    throw error;
  }
} 