import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Add type definitions at the top
interface Flashcard {
  question: string;
  answer: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface MatchingQuestion {
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[];
}

interface TrueFalseQuestion {
  question: string;
  isTrue: boolean;
}

interface GeneratedQuestions {
  flashcards?: Flashcard[];
  mcqs?: MCQ[];
  matchingQuestions?: MatchingQuestion[];
  trueFalseQuestions?: TrueFalseQuestion[];
}

// Initialize the Gemini API with environment variable
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Create a safe initialization of the Gemini client
const getGenAI = () => {
  if (!API_KEY) {
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
    return null;
  }
  try {
    return new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
    return null;
  }
};

// Configure safety settings for Gemini API
const getSafetySettings = () => [
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
 * Process a document using Gemini API with fallback to manual extraction
 * @param fileContent Base64 encoded file content
 * @param fileName Name of the file
 * @param fileType MIME type of the file
 * @param onProgress Callback for progress updates
 * @returns Extracted text content
 */
export async function processDocumentWithGemini(
  fileContent: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Try Gemini API first
  try {
    const genAI = getGenAI();
    if (genAI) {
      onProgress?.(10);
      
      // Decode base64 content
      let fileBuffer: Buffer;
      
      if (fileContent.startsWith('data:') && fileContent.includes('base64,')) {
        const base64Data = fileContent.split('base64,')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (/^[A-Za-z0-9+/=]+$/.test(fileContent.substring(0, 100))) {
        fileBuffer = Buffer.from(fileContent, 'base64');
      } else {
        // Plain text
        return fileContent;
      }
      
      // Create a model instance with better prompting
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Add content validation function
      const isQuestionRelevant = (question: string, documentContent: string): boolean => {
        // Remove technical terms related to PDF structure and implementation
        const technicalTerms = [
          '/Parent', '/Root', '/Pages', '/Type', '/Count', 'PDF object', 'PDF structure',
          'filter', 'content filtering', 'validation', 'implementation', 'function', 'code',
          'API', 'Gemini', 'processing', 'extraction', 'technical', 'programming',
          'interface', 'method', 'parameter', 'variable', 'buffer', 'string'
        ];
        
        const containsTechnicalTerm = technicalTerms.some(term => 
          question.toLowerCase().includes(term.toLowerCase())
        );
        
        if (containsTechnicalTerm) return false;
        
        // Check if question terms appear in document content
        const questionTerms = question
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(' ')
          .filter(term => term.length > 3) // Only consider words longer than 3 characters
          .filter(term => !technicalTerms.includes(term.toLowerCase())); // Exclude technical terms
        
        if (questionTerms.length === 0) return false; // If no valid terms remain, reject the question
        
        const contentWords = documentContent
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(' ');
        
        // Question is relevant if at least 40% of its significant terms appear in content
        const matchingTerms = questionTerms.filter(term => contentWords.includes(term));
        return matchingTerms.length / questionTerms.length >= 0.4;
      };

      // Update the Gemini API prompt
      const generateQuestionsPrompt = `
You are a specialized educational content analyzer. Your task is to generate questions based ONLY on the main educational content of this document.

IMPORTANT RULES:
1. ONLY generate questions about the actual educational content, facts, and concepts in the document
2. DO NOT generate questions about:
   - The document format, structure, or technical aspects
   - The implementation or processing of the document
   - Any programming concepts or code
   - Content filtering or validation
   - APIs or technical tools
   - File handling or data processing

Focus exclusively on:
1. The main subject matter and key concepts
2. Important facts and information
3. Core ideas and theories
4. Real-world examples and applications
5. Relationships between concepts

Format requirements:
1. Questions must be clear and concise
2. Focus on testing understanding of the actual subject matter
3. Use simple, non-technical language
4. Avoid any references to document processing or technical implementation

Remember: You are helping students learn the subject matter, not the technical aspects of the document.
`;

      // Check if file is PDF
      const fileExt = fileName.toLowerCase().split('.').pop() || '';
      if (fileType === 'pdf' || fileExt === 'pdf') {
        onProgress?.(20);
        
        // Use Gemini's File API for PDF processing
        try {
          // Create a file part from the buffer
          const filePart = {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: 'application/pdf'
            }
          };
          
          // Generate content with the PDF
          const result = await model.generateContent([
            filePart,
            generateQuestionsPrompt
          ]);
          
          onProgress?.(100);
          
          // Get the response text
          const response = await result.response;
          const text = response.text();
          
          if (text && text.trim().length > 0) {
            // Filter out irrelevant questions before returning
            const questions: GeneratedQuestions = JSON.parse(text);
            
            // Filter flashcards
            if (questions.flashcards) {
              questions.flashcards = questions.flashcards.filter((card: Flashcard) => 
                isQuestionRelevant(card.question, fileContent) &&
                isQuestionRelevant(card.answer, fileContent)
              );
            }
            
            // Filter MCQs
            if (questions.mcqs) {
              questions.mcqs = questions.mcqs.filter((mcq: MCQ) => 
                isQuestionRelevant(mcq.question, fileContent)
              );
            }
            
            // Filter matching questions
            if (questions.matchingQuestions) {
              questions.matchingQuestions = questions.matchingQuestions.filter((q: MatchingQuestion) => 
                q.leftItems.every((item: string) => isQuestionRelevant(item, fileContent)) &&
                q.rightItems.every((item: string) => isQuestionRelevant(item, fileContent))
              );
            }
            
            // Filter true/false questions
            if (questions.trueFalseQuestions) {
              questions.trueFalseQuestions = questions.trueFalseQuestions.filter((q: TrueFalseQuestion) => 
                isQuestionRelevant(q.question, fileContent)
              );
            }
            
            console.log('Successfully extracted and filtered questions using Gemini API');
            return JSON.stringify(questions);
          }
        } catch (geminiError) {
          console.error('Gemini API PDF processing failed:', geminiError);
          // Fall back to manual extraction
        }
      }
    }
  } catch (error) {
    console.error('Error using Gemini API:', error);
    // Fall back to manual extraction
  }
  
  // Fallback to manual extraction
  console.log('Falling back to manual document extraction');
  return extractTextManually(fileContent, fileName, fileType, onProgress);
}

/**
 * Extract text from a document manually (fallback method)
 * @param fileContent Base64 encoded file content
 * @param fileName Name of the file
 * @param fileType MIME type of the file
 * @param onProgress Callback for progress updates
 * @returns Extracted text content
 */
export async function extractTextManually(
  fileContent: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Decode base64 content
    let fileBuffer: Buffer;
    
    if (fileContent.startsWith('data:') && fileContent.includes('base64,')) {
      const base64Data = fileContent.split('base64,')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (/^[A-Za-z0-9+/=]+$/.test(fileContent.substring(0, 100))) {
      fileBuffer = Buffer.from(fileContent, 'base64');
    } else {
      // Plain text
      return fileContent;
    }
    
    // Process by file type
    const fileExt = fileName.toLowerCase().split('.').pop() || '';
    
    if (fileType === 'pdf' || fileExt === 'pdf') {
      onProgress?.(20);
      return await extractTextFromPdf(fileBuffer, onProgress);
    } 
    else if (fileType === 'word' || fileExt === 'docx' || fileExt === 'doc') {
      onProgress?.(20);
      return await extractTextFromWord(fileBuffer, fileExt);
    } 
    else if (fileType === 'powerpoint' || fileExt === 'pptx' || fileExt === 'ppt') {
      onProgress?.(20);
      return await extractTextFromPowerPoint(fileBuffer);
    } 
    else if (fileType === 'spreadsheet' || fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
      onProgress?.(20);
      return await extractTextFromSpreadsheet(fileBuffer, fileExt);
    } 
    else if (['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'gif'].includes(fileExt)) {
      onProgress?.(20);
      return "Image processing is currently limited. Please convert text content to a document format.";
    }
    else {
      // Default: try to extract as text
      onProgress?.(100);
      return fileBuffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Error extracting file content:', error);
    return "Error extracting content. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from PDF
 * @param pdfBuffer PDF file buffer
 * @param onProgress Callback for progress updates
 * @returns Extracted text
 */
async function extractTextFromPdf(pdfBuffer: Buffer, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Convert Buffer to ArrayBuffer in a type-safe way
    const arrayBuffer = new Uint8Array(pdfBuffer).buffer;
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let extractedText = '';
    const totalPages = pdf.numPages;
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      extractedText += pageText + ' ';
      
      onProgress?.(20 + Math.floor((i / totalPages) * 70)); // Progress from 20% to 90%
    }
    
    onProgress?.(100);
    return extractedText;
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    return "Error extracting PDF content with PDF.js. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from Word document
 * @param fileBuffer Word file buffer
 * @param fileExt File extension
 * @returns Extracted text
 */
async function extractTextFromWord(fileBuffer: Buffer, fileExt: string): Promise<string> {
  try {
    if (fileExt === 'docx') {
      // For DOCX files
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else {
      // For DOC files (older format)
      return fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\r\n]/g, '');
    }
  } catch (error) {
    console.error('Error extracting Word document:', error);
    return "Error extracting Word document content. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from PowerPoint document
 * @param fileBuffer PowerPoint file buffer
 * @returns Extracted text
 */
async function extractTextFromPowerPoint(fileBuffer: Buffer): Promise<string> {
  try {
    // PowerPoint is more complex, we'll extract what we can
    const textParts = fileBuffer.toString('utf-8').match(/[A-Za-z0-9\s.,;:'"\-_!@#$%^&*()]+/g);
    if (textParts && textParts.length > 0) {
      return textParts.join(' ');
    }
    return "PowerPoint content extraction is limited. Please convert to PDF for better results.";
  } catch (error) {
    console.error('Error extracting PowerPoint content:', error);
    return "Error extracting PowerPoint content. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from spreadsheet
 * @param fileBuffer Spreadsheet file buffer
 * @param fileExt File extension
 * @returns Extracted text
 */
async function extractTextFromSpreadsheet(fileBuffer: Buffer, fileExt: string): Promise<string> {
  try {
    if (fileExt === 'csv') {
      // For CSV, convert to string
      return fileBuffer.toString('utf-8');
    } else {
      // For Excel files
      const workbook = XLSX.read(fileBuffer);
      
      // Get all sheet names
      const sheetNames = workbook.SheetNames;
      
      // Combine content from all sheets
      return sheetNames.map(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join('\n\n');
    }
  } catch (error) {
    console.error('Error extracting spreadsheet content:', error);
    return "Error extracting spreadsheet content. The file may be corrupted or in an unsupported format.";
  }
} 