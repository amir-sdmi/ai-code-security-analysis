import { Agent } from '@mastra/core'
import { z } from 'zod'
import { ExtractionResult } from '@/lib/mastra/config'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { ServerOCRService } from '../services/ocr-server'

const extractionSchema = z.object({
  pageNumber: z.string(),
  sanskritText: z.string(),
  hindiCommentary: z.string().optional(),
  verseNumbers: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
})

export class ExtractionAgent extends Agent {
  constructor() {
    const googleAI = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
    })
    
    super({
      name: 'extraction-agent',
      instructions: `You are an expert in Sanskrit and Devanagari script extraction using multiple OCR engines. Your task is to:
1. Extract ALL Sanskrit text from the image with 100% accuracy using Gemini
2. Identify and extract verse numbers in Devanagari numerals (१, २, ३, etc.)
3. Separate Sanskrit verses from Hindi commentary if present
4. Mark any unclear portions with [?]
5. Never summarize or truncate - extract every visible character
6. Pay special attention to verse numbers - they should be sequential (not random jumps)
7. Compare results from multiple OCR engines for best accuracy`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: googleAI('gemini-1.5-pro') as any, // Typecast to fix version mismatch
    })
  }

  async extractFromImageMultiOCR(
    imageBase64: string, 
    pageInfo: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _engines: ('gemini')[] = ['gemini']
  ): Promise<ExtractionResult & { ocrResults?: unknown }> {
    try {
      // On server, we can only use Gemini
      const geminiResult = await ServerOCRService.extractWithGemini(imageBase64)
      
      const result: ExtractionResult & { ocrResults?: unknown } = {
        pageNumber: pageInfo.match(/\d+/)?.[0] || '1',
        sanskritText: geminiResult.sanskritText,
        hindiCommentary: geminiResult.hindiCommentary,
        verseNumbers: geminiResult.verseNumbers,
        warnings: geminiResult.warnings || [],
        ocrResults: {
          primary: geminiResult,
          alternatives: [
            {
              engine: 'gemini',
              text: geminiResult.sanskritText + (geminiResult.hindiCommentary ? '\n\n' + geminiResult.hindiCommentary : ''),
              confidence: 95
            },
          ],
          bestEngine: 'gemini'
        }
      }

      return result
    } catch (error) {
      console.error('Multi-OCR extraction failed:', error)
      // Fallback to single Gemini extraction
      return this.extractFromImage(imageBase64, pageInfo)
    }
  }

  async extractFromImage(imageBase64: string, pageInfo: string): Promise<ExtractionResult> {
    const prompt = `Extract ALL text from this image of ${pageInfo}.
Include:
- Page number
- ALL Sanskrit verses with their exact verse numbers as shown in Devanagari
- Hindi commentary sections (if any)
- Mark unclear text with [?]

CRITICAL: Verify verse numbers are logical and sequential. If you see ५० (50) followed by ५८ (58), double-check - it might actually be १७ (17) and १८ (18).

Output as JSON with structure:
{
  "pageNumber": "XX",
  "sanskritText": "full Sanskrit text with verse numbers",
  "hindiCommentary": "Hindi text if present",
  "verseNumbers": ["17", "18", "19"],
  "warnings": ["any issues noticed"]
}`

    try {
      // Use AI SDK with structured output
      const { generateObject } = await import('ai')
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      })
      
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: google('gemini-1.5-pro') as any,
        schema: extractionSchema,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image',
                image: Buffer.from(imageBase64, 'base64')
              },
            ],
          },
        ],
      })
      
      return result.object
    } catch (error) {
      console.error('Error in AI generation:', error)
      throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async verifyVerseNumbers(imageBase64: string, extractedNumbers: string[]): Promise<string[]> {
    const prompt = `Double-check: What are the exact verse numbers on this page? List them as they appear in Devanagari and their decimal equivalents.
Currently extracted: ${extractedNumbers.join(', ')}`

    try {
      const { generateObject } = await import('ai')
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      const { z } = await import('zod')
      
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      })
      
      const verificationSchema = z.object({
        verseNumbers: z.array(z.string())
      })
      
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: google('gemini-1.5-pro') as any,
        schema: verificationSchema,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image',
                image: Buffer.from(imageBase64, 'base64')
              },
            ],
          },
        ],
      })
      
      return result.object.verseNumbers
    } catch (error) {
      console.error('Verse verification failed:', error)
      return extractedNumbers
    }
  }
}