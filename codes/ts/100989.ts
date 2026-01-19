import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface LinkedInValidation {
  isValid: boolean;
  profileExists: boolean;
  message: string;
}

export const validateLinkedInProfile = async (url: string): Promise<LinkedInValidation> => {
  try {
    // Basic URL validation
    const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    
    if (!linkedInRegex.test(url)) {
      return {
        isValid: false,
        profileExists: false,
        message: "Invalid LinkedIn profile URL format"
      };
    }

    // Extract username from URL
    const username = url.split('/in/')[1].replace('/', '');

    // Use Gemini to analyze the username
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analyze this LinkedIn profile username: "${username}"
    Determine if it looks like a real profile name.
    
    Return a JSON object with these exact fields:
    {
      "isValid": boolean,
      "reason": string
    }
    
    Example response:
    {
      "isValid": true,
      "reason": "Username follows common name pattern"
    }

    Only return valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    // Clean the response text to ensure it's valid JSON
    const cleanedResponse = response.trim().replace(/^```json\n|\n```$/g, '');
    
    try {
      const analysis = JSON.parse(cleanedResponse);
      
      return {
        isValid: true,
        profileExists: analysis.isValid,
        message: analysis.reason || (analysis.isValid ? 
          "Valid LinkedIn profile format" : 
          "URL format is valid but profile name appears suspicious")
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fallback to basic validation if JSON parsing fails
      return {
        isValid: true,
        profileExists: true,
        message: "Valid LinkedIn URL format (basic validation)"
      };
    }

  } catch (error) {
    console.error('LinkedIn validation error:', error);
    return {
      isValid: false,
      profileExists: false,
      message: "Failed to validate LinkedIn profile"
    };
  }
};