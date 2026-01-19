import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';

// Try to get API key from multiple sources
let API_KEY = process.env.API_KEY;

// For browser environment, try to get from localStorage or window
if (typeof window !== 'undefined') {
  API_KEY = API_KEY || localStorage.getItem('GEMINI_API_KEY') || (window as any).GEMINI_API_KEY;
}

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will not work. Please set the API key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Provide a fallback to avoid error if API_KEY is undefined

// Function to set API key
export const setGeminiApiKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
  }
  // Note: This won't update the current ai instance, but will work for new requests
  console.log('API key set successfully');
};

// Function to check if API key is configured
export const isApiKeyConfigured = (): boolean => {
  return !!(API_KEY && API_KEY !== "MISSING_API_KEY");
};

/**
 * Analyzes the content of a document using a streaming response from Gemini.
 * @param documentText The extracted text from the document.
 * @param prompt The user's question or prompt for analysis.
 * @returns An async iterator for streaming the response chunks.
 */
export const analyzeDocumentContentStream = async (documentText: string, prompt: string) => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  const fullPrompt = `
    DOCUMENT ANALYSIS

    You are an expert analyst. Below is the text extracted from a document. Your task is to answer the user's question based *only* on the provided document content. Do not use any external knowledge.

    Please provide a well-structured response with clear sections and bullet points where appropriate.

    --- DOCUMENT CONTENT START ---
    ${documentText.substring(0, 30000)} 
    --- DOCUMENT CONTENT END ---

    USER'S QUESTION:
    "${prompt}"

    Your analysis:
  `;

  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL_TEXT,
    contents: fullPrompt,
    config: {
        temperature: 0.2,
    }
  });

  return response;
};

/**
 * Analyzes the content of a PDF using a streaming response from Gemini.
 * @param pdfText The extracted text from the PDF document.
 * @param prompt The user's question or prompt for analysis.
 * @returns An async iterator for streaming the response chunks.
 */
export const analyzePdfContentStream = async (pdfText: string, prompt: string) => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  const fullPrompt = `
    DOCUMENT ANALYSIS

    You are an expert analyst. Below is the text extracted from a PDF document. Your task is to answer the user's question based *only* on the provided document content. Do not use any external knowledge.

    --- DOCUMENT CONTENT START ---
    ${pdfText.substring(0, 30000)} 
    --- DOCUMENT CONTENT END ---

    USER'S QUESTION:
    "${prompt}"

    Your analysis:
  `;

  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL_TEXT,
    contents: fullPrompt,
    config: {
        temperature: 0.2,
    }
  });

  return response;
};

/**
 * Extracts text from a PDF file using Gemini's document analysis capabilities.
 * @param file The PDF file to extract text from.
 * @returns The extracted text content.
 */
export const extractPdfText = async (file: File): Promise<string> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  if (file.type !== 'application/pdf') {
    throw new Error("File is not a PDF");
  }

  // Convert file to base64 for Gemini
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Use FileReader for more reliable base64 conversion
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; // Remove data URL prefix
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });

  const prompt = `Extract all the text content from this PDF document. Return only the raw text content, preserving the original formatting and structure. Do not add any analysis or commentary.`;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64
              }
            }
          ]
        }]
      }),
      60000 // 60 second timeout
    );

    return response.text || "No text extracted";
  } catch (error) {
    console.error("PDF text extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extracts text from a Word document using alternative methods since Gemini doesn't support .docx directly.
 * @param file The Word document file to extract text from.
 * @returns The extracted text content.
 */
export const extractWordText = async (file: File): Promise<string> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  const supportedTypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (!supportedTypes.includes(file.type)) {
    throw new Error("File is not a Word document");
  }

  try {
    // Method 1: Try to extract text using a different approach
    // Since Gemini doesn't support .docx directly, we'll try to convert it to a supported format
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For .docx files, try to extract text using a different method
      console.log('Processing .docx file with alternative method');
      
      // Try to read the file as text first (some .docx files might be readable)
      try {
        const textContent = await file.text();
        if (textContent && textContent.length > 0) {
          console.log('Successfully read .docx as text');
          return textContent;
        }
      } catch (textError) {
        console.log('Could not read .docx as text, trying alternative approach');
      }
      
      // Method 2: Try to convert to PDF-like format for Gemini
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1]; // Remove data URL prefix
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(file);
      });

      const prompt = `This is a Word document (.docx) file. Please extract all the text content from this document. Return only the raw text content, preserving the original formatting and structure. Do not add any analysis or commentary.`;

      try {
        // Try with a generic document MIME type that Gemini might support
        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'application/octet-stream', // Try generic binary type
                    data: base64
                  }
                }
              ]
            }]
          }),
          60000 // 60 second timeout
        );

        return response.text || "No text extracted";
      } catch (geminiError) {
        console.log('Gemini processing failed, trying fallback method');
        
        // Method 3: Fallback - try to extract text using a different approach
        // This is a simplified approach that might work for some .docx files
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Look for text content in the binary data (simplified approach)
        let extractedText = '';
        const textDecoder = new TextDecoder('utf-8');
        
        // Try to find readable text in chunks
        for (let i = 0; i < uint8Array.length; i += 1024) {
          const chunk = uint8Array.slice(i, Math.min(i + 1024, uint8Array.length));
          try {
            const decoded = textDecoder.decode(chunk);
            // Filter out non-printable characters and keep readable text
            const cleanText = decoded.replace(/[^\x20-\x7E\n\r\t]/g, '');
            if (cleanText.length > 10) { // Only keep chunks with substantial text
              extractedText += cleanText + ' ';
            }
          } catch (decodeError) {
            // Skip chunks that can't be decoded
            continue;
          }
        }
        
        if (extractedText.trim().length > 0) {
          console.log('Extracted text using fallback method');
          return extractedText.trim();
        }
        
        throw new Error('Unable to extract text from .docx file - format not supported');
      }
    } else {
      // For .doc files, try the original approach
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1]; // Remove data URL prefix
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(file);
      });

      const prompt = `Extract all the text content from this Word document. Return only the raw text content, preserving the original formatting and structure. Do not add any analysis or commentary.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL_TEXT,
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64
                }
              }
            ]
          }]
        }),
        60000 // 60 second timeout
      );

      return response.text || "No text extracted";
    }
  } catch (error) {
    console.error("Word document text extraction error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unsupported MIME type')) {
        throw new Error('Word document format not supported by AI service. Please try converting to PDF or text format.');
      } else if (error.message.includes('Unable to extract text')) {
        throw new Error('Unable to extract text from this Word document. The file may be corrupted or in an unsupported format.');
      }
    }
    
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Processes a text file by reading its content directly.
 * @param file The text file to process.
 * @returns The text content.
 */
export const extractTextFileContent = async (file: File): Promise<string> => {
  if (file.type !== 'text/plain') {
    throw new Error("File is not a text file");
  }

  try {
    const text = await file.text();
    return text || "No content found";
  } catch (error) {
    console.error("Text file reading error:", error);
    throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Analyzes Word document content and provides a comprehensive summary.
 * @param wordText The extracted text from the Word document.
 * @returns A comprehensive summary of the document.
 */
export const analyzeWordDocument = async (wordText: string): Promise<string> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  const analysisPrompt = `Analyze this Word document content and provide a comprehensive, well-structured summary.

Please format your response with clear sections and bullet points:

📋 **Document Overview**
- Document type and purpose
- Main topics and themes
- Overall structure and organization

🔍 **Key Content Analysis**
- Important points and findings
- Critical information and data
- Notable insights or conclusions

📚 **Educational Value**
- Learning objectives and outcomes
- Key concepts and takeaways
- Potential applications or use cases

💡 **Summary & Recommendations**
- Brief executive summary
- Educational recommendations
- Additional considerations

Word Document Content:
${wordText.substring(0, 30000)}`; // Limit to 30k characters for analysis

  try {
    const response: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: analysisPrompt,
      }),
      60000 // 60 second timeout for Word document processing
    );

    return response.text || "No content generated";
  } catch (error) {
    console.error('Word document analysis error:', error);
    throw new Error(`Word document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Analyzes text file content and provides a comprehensive summary.
 * @param textContent The content of the text file.
 * @returns A comprehensive summary of the text content.
 */
export const analyzeTextFile = async (textContent: string): Promise<string> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error("API_KEY not configured");
  }

  const analysisPrompt = `Analyze this text content and provide a comprehensive, well-structured summary.

Please format your response with clear sections and bullet points:

📋 **Content Overview**
- Content type and purpose
- Main topics and themes
- Overall structure and organization

🔍 **Key Content Analysis**
- Important points and findings
- Critical information and data
- Notable insights or conclusions

📚 **Educational Value**
- Learning objectives and outcomes
- Key concepts and takeaways
- Potential applications or use cases

💡 **Summary & Recommendations**
- Brief executive summary
- Educational recommendations
- Additional considerations

Text Content:
${textContent.substring(0, 30000)}`; // Limit to 30k characters for analysis

  try {
    const response: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: analysisPrompt,
      }),
      30000 // 30 second timeout for text file processing
    );

    return response.text || "No content generated";
  } catch (error) {
    console.error('Text file analysis error:', error);
    throw new Error(`Text file analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateCourseDescription = async (topic: string): Promise<string | null> => {
  if (!API_KEY) return "AI features disabled. API Key not configured.";
  try {
    const prompt = `Generate a concise and engaging course description (2-3 sentences) for an online course about "${topic}". Focus on the key benefits and what students will learn. Provide the output as plain text without any Markdown formatting.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating course description:", error);
    return "Failed to generate description. Please try again.";
  }
};

export const generateLessonContent = async (courseTitle: string, moduleTitle: string, lessonTopic: string): Promise<string | null> => {
  if (!API_KEY) return "AI features disabled. API Key not configured.";
  try {
    const prompt = `Generate educational content for a lesson titled "${lessonTopic}" within the module "${moduleTitle}" for the course "${courseTitle}". The content should be informative, clear, and suitable for online learning. Provide a few paragraphs of plain text, without any Markdown formatting.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson content:", error);
    return "Failed to generate lesson content. Please try again.";
  }
};

export const generateModuleSuggestions = async (courseTitle: string, courseDescription: string): Promise<string[] | null> => {
  if (!API_KEY) return ["AI features disabled. API Key not configured."];
  try {
    const prompt = `Based on the course titled "${courseTitle}" with the description: "${courseDescription}", suggest a minimum of 10 relevant module titles that would provide comprehensive coverage of the course topic. The modules should follow a logical learning progression from basic concepts to advanced topics. Return a JSON array of strings. Example: ["Module 1: Introduction", "Module 2: Core Concepts", "Module 3: Advanced Topics", ...]`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
        // Ensure we have at least 10 suggestions, if not, add generic ones
        if (parsedData.length < 10) {
          const additionalModules = [
            "Module " + (parsedData.length + 1) + ": Advanced Concepts",
            "Module " + (parsedData.length + 2) + ": Practical Applications",
            "Module " + (parsedData.length + 3) + ": Case Studies",
            "Module " + (parsedData.length + 4) + ": Best Practices",
            "Module " + (parsedData.length + 5) + ": Troubleshooting",
            "Module " + (parsedData.length + 6) + ": Optimization Techniques",
            "Module " + (parsedData.length + 7) + ": Industry Standards",
            "Module " + (parsedData.length + 8) + ": Future Trends",
            "Module " + (parsedData.length + 9) + ": Project Work",
            "Module " + (parsedData.length + 10) + ": Final Assessment"
          ];
          return [...parsedData, ...additionalModules.slice(0, 10 - parsedData.length)];
        }
        return parsedData;
      }
      console.warn("Gemini returned non-array or non-string array for module suggestions:", parsedData);
      return ["Could not parse module suggestions correctly."];
    } catch (e) {
      console.error("Failed to parse JSON response for module suggestions:", e, "Raw response:", jsonStr);
      return ["Error parsing AI suggestions."];
    }

  } catch (error) {
    console.error("Error generating module suggestions:", error);
    return ["Failed to generate module suggestions."];
  }
};

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

export const processFileWithGemini = async (file: File): Promise<{ summary: string; extractedText?: string; error?: string }> => {
  if (!API_KEY) {
    return { 
      summary: "AI features disabled. API Key not configured.",
      error: "API_KEY not configured"
    };
  }

  // Check file size (Gemini has limits)
  const maxSize = 4 * 1024 * 1024; // 4MB limit for better reliability
  if (file.size > maxSize) {
    return {
      summary: "File too large for processing. Maximum size is 4MB.",
      error: "File size exceeds limit"
    };
  }

  try {
    const mimeType = file.type;
    
    // Validate file type
    const supportedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!supportedTypes.includes(mimeType)) {
      return {
        summary: `Unsupported file type: ${mimeType}. Please upload a supported file type.`,
        error: `Unsupported file type: ${mimeType}`
      };
    }
    
    // For PDFs, use the specialized approach
    if (mimeType === 'application/pdf') {
      console.log('Processing PDF with specialized method');
      
      try {
        // First extract text from PDF
        const extractedText = await extractPdfText(file);
        console.log(`Extracted ${extractedText.length} characters from PDF`);
        
        // Then analyze the extracted text
        const analysisPrompt = `Analyze this PDF content and provide a comprehensive, well-structured summary.

Please format your response with clear sections and bullet points:

📋 **Document Overview**
- Document type and purpose
- Main topics and themes
- Overall structure and organization

🔍 **Key Content Analysis**
- Important points and findings
- Critical information and data
- Notable insights or conclusions

📚 **Educational Value**
- Learning objectives and outcomes
- Key concepts and takeaways
- Potential applications or use cases

💡 **Summary & Recommendations**
- Brief executive summary
- Educational recommendations
- Additional considerations

PDF Content:
${extractedText.substring(0, 30000)}`; // Limit to 30k characters for analysis

        const response: GenerateContentResponse = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: analysisPrompt,
          }),
          60000 // 60 second timeout for PDF processing
        );

        return { 
          summary: response.text || "No content generated",
          extractedText: extractedText
        };
        
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        return {
          summary: "Failed to process PDF. The file may be corrupted or password-protected.",
          error: `PDF processing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`
        };
      }
    }
    
    // For Word documents, use the specialized approach
    if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing Word document with specialized method');
      
      try {
        let extractedText = '';
        
        // First try the standard Gemini approach
        try {
          extractedText = await extractWordText(file);
          console.log(`Extracted ${extractedText.length} characters from Word document using Gemini`);
        } catch (geminiError) {
          console.log('Gemini approach failed, trying alternative method:', geminiError);
          
          // If Gemini fails, try alternative method
          extractedText = await processWordDocumentAlternative(file);
          console.log(`Extracted ${extractedText.length} characters from Word document using alternative method`);
        }
        
        // Then analyze the extracted text
        const summary = await analyzeWordDocument(extractedText);

        return { 
          summary: summary,
          extractedText: extractedText
        };
        
      } catch (wordError) {
        console.error('Word document processing error:', wordError);
        return {
          summary: "Failed to process Word document. The file may be corrupted, password-protected, or in an unsupported format. Try converting to PDF or text format.",
          error: `Word document processing failed: ${wordError instanceof Error ? wordError.message : 'Unknown error'}`
        };
      }
    }
    
    // For text files, use the specialized approach
    if (mimeType === 'text/plain') {
      console.log('Processing text file with specialized method');
      
      try {
        // First extract text content
        const extractedText = await extractTextFileContent(file);
        console.log(`Extracted ${extractedText.length} characters from text file`);
        
        // Then analyze the text content
        const summary = await analyzeTextFile(extractedText);

        return { 
          summary: summary,
          extractedText: extractedText
        };
        
      } catch (textError) {
        console.error('Text file processing error:', textError);
        return {
          summary: "Failed to process text file. The file may be corrupted or in an unsupported encoding.",
          error: `Text file processing failed: ${textError instanceof Error ? textError.message : 'Unknown error'}`
        };
      }
    }
    
    // For other file types, use base64 conversion
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`File size: ${file.size} bytes, type: ${mimeType}`);
    
    // For PDFs, we might need a different approach if they're too large
    if (mimeType === 'application/pdf' && file.size > 2 * 1024 * 1024) { // 2MB
      console.log('Large PDF detected, using simplified processing');
      
      // For large PDFs, try a simpler approach
      const prompt = `This is a large PDF document. Please provide a general summary of what type of document this appears to be and any key information you can extract. Focus on:
      1. Document type and purpose
      2. Main topics or themes
      3. Key information if available
      4. Overall structure and organization
      
      Note: This is a large document, so provide a high-level summary.`;
      
      // Try to process just the first part of the file
      const firstChunk = uint8Array.slice(0, Math.min(1024 * 1024, uint8Array.length)); // First 1MB
      let base64 = '';
      
      try {
        // Use direct conversion for the first chunk
        const binaryString = String.fromCharCode.apply(null, Array.from(firstChunk));
        base64 = btoa(binaryString);
        
        // Validate base64
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64)) {
          throw new Error('Invalid base64 for large PDF chunk');
        }
        
        console.log(`Large PDF chunk base64 size: ${base64.length} characters`);
        
      } catch (chunkError) {
        console.error('Large PDF chunk conversion failed:', chunkError);
        throw new Error('Failed to convert large PDF chunk to base64');
      }
      
      const response = await withTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL_TEXT,
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64
                }
              }
            ]
          }]
        }),
        60000
      );
      
      return { 
        summary: response.text || "No content generated",
        extractedText: "Large PDF - only partial content processed"
      };
    }
    
    // Convert to base64 using improved method
    let base64 = '';
    const chunkSize = 512; // Smaller chunks for better reliability
    
    try {
      // Method 1: Direct conversion for small files
      if (uint8Array.length < 1024 * 1024) { // Less than 1MB
        console.log('Using direct conversion method for main processing');
        const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
        base64 = btoa(binaryString);
      } else {
        // Method 2: Chunked conversion for larger files
        console.log('Using chunked conversion method for main processing');
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          
          // Convert chunk to string safely
          let chunkString = '';
          for (let j = 0; j < chunk.length; j++) {
            chunkString += String.fromCharCode(chunk[j]);
          }
          
          // Convert to base64
          base64 += btoa(chunkString);
        }
      }
      
      // Validate base64 string
      if (!base64 || base64.length === 0) {
        throw new Error('Failed to convert file to base64');
      }
      
      // Check if base64 is valid (should only contain valid base64 characters)
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64)) {
        throw new Error('Invalid base64 encoding generated');
      }
      
      // Test if we can decode it back
      try {
        atob(base64);
        console.log('Base64 validation: SUCCESS');
      } catch (decodeError) {
        throw new Error('Base64 validation failed - cannot decode');
      }
      
      console.log(`Successfully converted file to base64. Size: ${base64.length} characters`);
      
    } catch (error) {
      console.error('Base64 conversion error:', error);
      
      // Try alternative method using FileReader
      console.log('Trying alternative base64 conversion method...');
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1]; // Remove data URL prefix
            resolve(base64Data);
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(file);
        });
        
        // Validate alternative base64
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Data)) {
          throw new Error('Alternative base64 conversion also failed');
        }
        
        base64 = base64Data;
        console.log(`Alternative base64 conversion successful. Size: ${base64.length} characters`);
        
      } catch (altError) {
        console.error('Alternative method also failed:', altError);
        throw new Error(`All base64 conversion methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    let prompt: string;
    let response: GenerateContentResponse;

    if (mimeType.startsWith('image/')) {
      // Handle images with OCR and analysis
      prompt = `Analyze this image and provide a comprehensive, well-structured summary. If there's text in the image, extract and include it.

Please format your response with clear sections and bullet points:

📋 **Image Overview**
- Main content and subject matter
- Visual elements and composition
- Overall purpose or context

🔍 **Content Analysis**
- Key information or data presented
- Important details and features
- Any text content (OCR results)

📚 **Educational Value**
- Learning potential and applications
- Key concepts or insights
- Educational use cases

💡 **Summary & Recommendations**
- Brief description of the image
- Educational recommendations
- Additional observations

Provide a clear, structured summary that would be useful for educational purposes.`;

      response = await withTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL_TEXT,
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64
                }
              }
            ]
          }]
        }),
        60000 // 60 second timeout for file processing
      );
    } else if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType === 'text/plain') {
      // For text-based documents, first extract text then summarize
      console.log(`Processing ${mimeType} file with base64 size: ${base64.length}`);
      
      prompt = `Extract and analyze the content from this document. Provide a comprehensive summary including:
      1. Main topics and themes
      2. Key points and important information
      3. Document structure and organization
      4. Educational value and learning objectives
      
      Format the response as a clear, structured summary suitable for educational use.`;

      try {
        response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64
                  }
                }
              ]
            }]
          }),
          60000 // 60 second timeout for file processing
        );
        
        console.log('Successfully sent file to Gemini for processing');
        
      } catch (apiError) {
        console.error('Gemini API error:', apiError);
        throw new Error(`Gemini API error: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`);
      }
    } else {
      return {
        summary: "Unsupported file type for AI processing.",
        error: "Unsupported file type"
      };
    }

    const summary = response.text || "No content generated";
    
    // For text documents, also extract the raw text content
    let extractedText: string | undefined;
    if (!mimeType.startsWith('image/')) {
      try {
        const textExtractionResponse = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{
              role: "user",
              parts: [
                { text: "Extract only the raw text content from this document, preserving the original formatting and structure. Do not add any analysis or commentary." },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64
                  }
                }
              ]
            }]
          }),
          45000 // 45 second timeout for text extraction
        );
        extractedText = textExtractionResponse.text || undefined;
      } catch (error) {
        console.warn("Failed to extract raw text:", error);
      }
    }

    return { summary, extractedText };

  } catch (error) {
    console.error("Error processing file with Gemini:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return {
          summary: "Network timeout. Please check your connection and try again.",
          error: "Network timeout"
        };
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        return {
          summary: "API quota exceeded. Please try again later.",
          error: "API quota exceeded"
        };
      } else if (error.message.includes('stack')) {
        return {
          summary: "File processing error. The file may be too large or complex.",
          error: "Processing error - file too large or complex"
        };
      } else if (error.message.includes('base64') || error.message.includes('Invalid value')) {
        return {
          summary: "File encoding error. The file format may not be supported.",
          error: "File encoding error - unsupported format"
        };
      } else if (error.message.includes('400') || error.message.includes('Invalid value')) {
        return {
          summary: "File processing error. The file may be corrupted or in an unsupported format.",
          error: "File format error - corrupted or unsupported"
        };
      }
    }
    
    return {
      summary: "Failed to process file. Please try again with a different file.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

export const generateFileSummary = async (fileName: string, fileType: string, content: string): Promise<string> => {
  if (!API_KEY) return "AI features disabled. API Key not configured.";
  
  try {
    const prompt = `Based on the file "${fileName}" (type: ${fileType}), create a concise educational summary of the content. Focus on:
    1. Main learning objectives or key topics
    2. Important concepts and takeaways
    3. How this content could be used in an educational context
    4. Suggested learning activities or discussion points
    
    Provide a clear, structured summary that would help educators and students understand the value of this content.`;

    const response: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
      }),
      30000 // 30 second timeout
    );
    
    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Error generating file summary:", error);
    return "Failed to generate summary. Please try again.";
  }
};

// Test function to verify file processing works
export const testFileProcessing = async (): Promise<boolean> => {
  try {
    // Create a simple text file for testing
    const testContent = "This is a test document about artificial intelligence and machine learning. It covers basic concepts and applications.";
    const testFile = new File([testContent], "test.txt", { type: "text/plain" });
    
    const result = await processFileWithGemini(testFile);
    
    if (result.error) {
      console.error("Test failed:", result.error);
      return false;
    }
    
    console.log("Test successful:", result.summary);
    return true;
  } catch (error) {
    console.error("Test error:", error);
    return false;
  }
};

// Test function to verify Word document processing
export const testWordDocumentProcessing = async (): Promise<boolean> => {
  try {
    // Create a simple Word document content for testing
    // Note: This is a simplified test - in real scenarios, Word documents would be actual .doc/.docx files
    const testContent = "This is a test Word document about artificial intelligence and machine learning. It covers basic concepts and applications.";
    const testFile = new File([testContent], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    
    const result = await processFileWithGemini(testFile);
    
    if (result.error) {
      console.error("Word document test failed:", result.error);
      return false;
    }
    
    console.log("Word document test successful:", result.summary);
    return true;
  } catch (error) {
    console.error("Word document test error:", error);
    return false;
  }
};

// Comprehensive test function for all supported file types
export const testAllFileTypes = async (): Promise<{ [key: string]: boolean }> => {
  const results: { [key: string]: boolean } = {};
  
  try {
    console.log("Starting comprehensive file type tests...");
    
    // Test text file processing
    const textContent = "This is a test text file about artificial intelligence and machine learning. It covers basic concepts and applications.";
    const textFile = new File([textContent], "test.txt", { type: "text/plain" });
    results.textFile = await testFileProcessing();
    
    // Test Word document processing
    const wordContent = "This is a test Word document about artificial intelligence and machine learning. It covers basic concepts and applications.";
    const wordFile = new File([wordContent], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    results.wordDocument = await testWordDocumentProcessing();
    
    // Test alternative Word document processing
    results.alternativeWordProcessing = await testAlternativeWordProcessing();
    
    // Test text extraction functions
    try {
      const extractedText = await extractTextFileContent(textFile);
      results.textExtraction = extractedText.length > 0;
      console.log("Text extraction test:", results.textExtraction ? "SUCCESS" : "FAILED");
    } catch (error) {
      results.textExtraction = false;
      console.error("Text extraction test failed:", error);
    }
    
    console.log("Comprehensive test results:", results);
    return results;
    
  } catch (error) {
    console.error("Comprehensive test error:", error);
    return results;
  }
};

// Simple base64 test with known data
export const testSimpleBase64 = (): boolean => {
  try {
    const testString = "Hello, World!";
    const base64 = btoa(testString);
    const decoded = atob(base64);
    
    console.log('Simple base64 test:', {
      original: testString,
      base64: base64,
      decoded: decoded,
      success: testString === decoded
    });
    
    return testString === decoded;
  } catch (error) {
    console.error('Simple base64 test failed:', error);
    return false;
  }
};

// Debug function to test base64 conversion
export const testBase64Conversion = async (file: File): Promise<boolean> => {
  try {
    console.log(`Testing base64 conversion for file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`ArrayBuffer size: ${arrayBuffer.byteLength}, Uint8Array length: ${uint8Array.length}`);
    
    // Try different base64 conversion methods
    let base64 = '';
    const chunkSize = 512; // Smaller chunks for better reliability
    
    try {
      // Method 1: Direct conversion for small files
      if (uint8Array.length < 1024 * 1024) { // Less than 1MB
        console.log('Using direct conversion method');
        const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
        base64 = btoa(binaryString);
      } else {
        // Method 2: Chunked conversion for larger files
        console.log('Using chunked conversion method');
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          
          // Convert chunk to string safely
          let chunkString = '';
          for (let j = 0; j < chunk.length; j++) {
            chunkString += String.fromCharCode(chunk[j]);
          }
          
          // Convert to base64
          base64 += btoa(chunkString);
        }
      }
      
      // Validate base64
      if (!base64 || base64.length === 0) {
        console.error('Base64 string is empty');
        return false;
      }
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const isValid = base64Regex.test(base64);
      
      console.log(`Base64 conversion result: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Base64 length: ${base64.length}`);
      console.log(`Base64 starts with: ${base64.substring(0, 50)}...`);
      console.log(`Base64 ends with: ...${base64.substring(base64.length - 10)}`);
      
      // Test if we can decode it back
      try {
        const decoded = atob(base64);
        console.log('Base64 decode test: SUCCESS');
      } catch (decodeError) {
        console.error('Base64 decode test: FAILED', decodeError);
        return false;
      }
      
      return isValid;
      
    } catch (conversionError) {
      console.error('Base64 conversion failed:', conversionError);
      
      // Try alternative method
      console.log('Trying alternative base64 conversion method...');
      try {
        // Alternative: Use FileReader
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1]; // Remove data URL prefix
            
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            const isValid = base64Regex.test(base64Data);
            
            console.log(`Alternative method result: ${isValid ? 'SUCCESS' : 'FAILED'}`);
            console.log(`Alternative base64 length: ${base64Data.length}`);
            
            resolve(isValid);
          };
          reader.onerror = () => {
            console.error('FileReader failed');
            resolve(false);
          };
          reader.readAsDataURL(file);
        });
      } catch (altError) {
        console.error('Alternative method also failed:', altError);
        return false;
      }
    }
    
  } catch (error) {
    console.error("Base64 test error:", error);
    return false;
  }
};

/**
 * Alternative method to process Word documents since Gemini doesn't support .docx MIME type.
 * @param file The Word document file to process.
 * @returns The extracted text content.
 */
export const processWordDocumentAlternative = async (file: File): Promise<string> => {
  console.log('Using alternative method for Word document processing');
  
  try {
    // Method 1: Try to read as text (works for some .docx files)
    try {
      const textContent = await file.text();
      if (textContent && textContent.length > 0) {
        console.log('Successfully read Word document as text');
        return textContent;
      }
    } catch (textError) {
      console.log('Could not read Word document as text');
    }
    
    // Method 2: Try to extract text from binary data
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';
    const textDecoder = new TextDecoder('utf-8');
    
    // Try to find readable text in chunks
    for (let i = 0; i < uint8Array.length; i += 2048) {
      const chunk = uint8Array.slice(i, Math.min(i + 2048, uint8Array.length));
      try {
        const decoded = textDecoder.decode(chunk);
        // Filter out non-printable characters and keep readable text
        const cleanText = decoded.replace(/[^\x20-\x7E\n\r\t]/g, '');
        if (cleanText.length > 20) { // Only keep chunks with substantial text
          extractedText += cleanText + ' ';
        }
      } catch (decodeError) {
        // Skip chunks that can't be decoded
        continue;
      }
    }
    
    if (extractedText.trim().length > 0) {
      console.log('Extracted text using binary method');
      return extractedText.trim();
    }
    
    throw new Error('Unable to extract text from Word document');
    
  } catch (error) {
    console.error('Alternative Word document processing error:', error);
    throw new Error(`Word document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test function to verify alternative Word document processing
export const testAlternativeWordProcessing = async (): Promise<boolean> => {
  try {
    console.log('Testing alternative Word document processing...');
    
    // Create a simple test content that mimics Word document content
    const testContent = "This is a test Word document about artificial intelligence and machine learning. It covers basic concepts and applications. The document contains multiple paragraphs and various topics related to AI development.";
    const testFile = new File([testContent], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    
    const result = await processWordDocumentAlternative(testFile);
    
    if (result && result.length > 0) {
      console.log('Alternative Word processing test successful:', result);
      return true;
    } else {
      console.error('Alternative Word processing test failed: No content extracted');
      return false;
    }
  } catch (error) {
    console.error('Alternative Word processing test error:', error);
    return false;
  }
};
