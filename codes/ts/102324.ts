/**
 * Google Gemini 2.5 Pro Service
 * Optimized for high accuracy content generation and analysis
 */

import axios, { AxiosResponse } from 'axios';

interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

interface GeminiRequest {
  prompt: string;
  systemInstruction?: string;
  context?: string;
}

interface GeminiResponse {
  text: string;
  finishReason: string;
  safetyRatings?: any[];
}

export class GeminiService {
  private config: GeminiConfig;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-2.0-flash-exp', // Latest Gemini 2.5 Pro model
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      ...config
    };
  }

  /**
   * Generate content using Gemini 2.5 Pro
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.config.apiKey) {
      throw new Error('Google API key not configured');
    }

    try {
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: request.prompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          topK: this.config.topK,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Add system instruction if provided
      if (request.systemInstruction) {
        payload.contents.unshift({
          role: "user",
          parts: [{ text: request.systemInstruction }]
        });
      }

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return this.parseResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Gemini 2.5 Pro API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Generate SEO-optimized content with enhanced prompts
   */
  async generateSEOContent(options: {
    topic: string;
    keywords: string[];
    contentType: 'blog' | 'product' | 'category' | 'meta';
    language?: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    seoRequirements?: {
      target_keyword: string;
      keyword_density: string;
      meta_description_length: number;
      title_length: number;
      min_word_count: number;
    };
  }): Promise<GeminiResponse> {
    const systemInstruction = `You are a world-class content writer and SEO expert specializing in creating engaging, valuable content that ranks well in search engines. You have deep expertise in both Thai and English content creation.

CRITICAL INSTRUCTIONS:
1. ALWAYS write in the requested language - if Thai is requested, write EVERYTHING in Thai
2. Create comprehensive, detailed content that provides real value to readers
3. Use natural, conversational language that sounds human-written
4. Include specific examples, actionable tips, and practical advice
5. Structure content with clear headings and well-organized sections
6. Integrate keywords naturally without keyword stuffing

For Thai content:
- Write in natural, modern Thai language
- Use appropriate formality level (สุภาพ but accessible)
- Include Thai-specific examples and cultural references
- Use Thai business terminology correctly
- Make content relevant to Thai market conditions

For English content:
- Use clear, engaging American English
- Include relevant statistics and examples
- Write in a conversational but professional tone
- Make content actionable and practical

QUALITY STANDARDS:
- Every paragraph must provide unique value
- Include specific, actionable advice
- Use real-world examples and case studies
- Write engaging introductions and conclusions
- Create scannable content with proper formatting`;

    const prompt = this.buildSEOPrompt(options);

    return await this.generateContent({
      prompt,
      systemInstruction
    });
  }

  /**
   * Analyze content for SEO optimization
   */
  async analyzeContent(content: string, targetKeywords: string[]): Promise<{
    score: number;
    suggestions: string[];
    keywordAnalysis: Record<string, number>;
    readabilityScore: number;
  }> {
    const prompt = `Analyze the following content for SEO optimization:

Content:
${content}

Target Keywords: ${targetKeywords.join(', ')}

Please provide:
1. Overall SEO score (0-100)
2. Specific improvement suggestions
3. Keyword density analysis
4. Readability assessment
5. Content structure recommendations

Format your response as JSON with the following structure:
{
  "score": number,
  "suggestions": ["suggestion1", "suggestion2"],
  "keywordAnalysis": {"keyword": density_percentage},
  "readabilityScore": number,
  "structureRecommendations": ["rec1", "rec2"]
}`;

    const response = await this.generateContent({ prompt });
    
    try {
      return JSON.parse(response.text);
    } catch (error) {
      // Fallback to basic analysis if JSON parsing fails
      return this.basicContentAnalysis(content, targetKeywords);
    }
  }

  private buildSEOPrompt(options: {
    topic: string;
    keywords: string[];
    contentType: 'blog' | 'product' | 'category' | 'meta';
    language?: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
  }): string {
    const isThaiContent = options.language === 'th';
    const primaryKeyword = options.keywords[0] || options.topic;
    
    const lengthGuide = {
      short: isThaiContent ? '400-600 คำ' : '500-800 words',
      medium: isThaiContent ? '800-1200 คำ' : '1000-1500 words', 
      long: isThaiContent ? '1500-2500 คำ' : '2000-3000 words'
    };

    const baseContext = `
CONTENT MISSION: Create exceptional ${options.contentType} content about "${options.topic}" that genuinely helps readers while achieving top search rankings.

TARGET AUDIENCE ANALYSIS:
- Primary intent: ${this.analyzeUserIntent(options.topic, options.contentType)}
- Knowledge level: Mixed (beginners to intermediate)
- Pain points: ${this.identifyPainPoints(options.topic, isThaiContent)}
- Desired outcomes: ${this.identifyDesiredOutcomes(options.topic, isThaiContent)}

KEYWORD STRATEGY:
- Primary keyword: "${primaryKeyword}" (use naturally 3-5 times)
- Secondary keywords: ${options.keywords.slice(1).join(', ') || 'Related semantic terms'}
- LSI keywords: ${this.generateLSIKeywords(options.topic, isThaiContent)}

CONTENT SPECIFICATIONS:
- Language: ${options.language || 'English'} (${isThaiContent ? 'ใช้ภาษาไทยที่เป็นธรรมชาติและเหมาะสม' : 'Natural, conversational English'})
- Tone: ${this.enhanceTone(options.tone, isThaiContent)}
- Target length: ${lengthGuide[options.length || 'medium']}
- Reading level: ${isThaiContent ? 'ระดับมัธยมศึกษา' : 'Grade 8-10 (accessible but authoritative)'}`;

    switch (options.contentType) {
      case 'blog':
        return this.buildAdvancedBlogPrompt(baseContext, options, isThaiContent);
      case 'product':
        return this.buildAdvancedProductPrompt(baseContext, options, isThaiContent);
      case 'category':
        return this.buildAdvancedCategoryPrompt(baseContext, options, isThaiContent);
      case 'meta':
        return this.buildAdvancedMetaPrompt(baseContext, options, isThaiContent);
      default:
        return baseContext;
    }
  }

  private buildAdvancedBlogPrompt(baseContext: string, options: any, isThaiContent: boolean): string {
    const primaryKeyword = options.keywords[0] || options.topic;
    const language = isThaiContent ? 'Thai' : 'English';
    
    return `Write a comprehensive blog post about "${options.topic}" in ${language}.

REQUIREMENTS:
- Language: Write EVERYTHING in ${language} ${isThaiContent ? '(ภาษาไทยเท่านั้น)' : '(English only)'}
- Primary keyword: "${primaryKeyword}" (use naturally 3-5 times)
- Secondary keywords: ${options.keywords.slice(1).join(', ') || 'related terms'}
- Length: ${isThaiContent ? '800-1200 คำ' : '1000-1500 words'}
- Tone: Professional but conversational and engaging

STRUCTURE:
${isThaiContent ? `
1. หัวข้อที่น่าสนใจ (รวมคีย์เวิร์ดหลัก)
2. บทนำ (150-200 คำ) - เริ่มด้วยสถิติหรือคำถามที่น่าสนใจ
3. ความเข้าใจพื้นฐาน - อธิบายแนวคิดหลัก
4. ประโยชน์และข้อดี - รายการประโยชน์ที่ชัดเจน
5. วิธีการปฏิบัติ - คำแนะนำทีละขั้นตอน
6. ข้อผิดพลาดที่ควรหลีกเลี่ยง - ปัญหาที่พบบ่อย
7. ตัวอย่างและกรณีศึกษา - เรื่องราวจริง
8. บทสรุป - สรุปประเด็นสำคัญและขั้นตอนถัดไป` : `
1. Compelling title (include primary keyword)
2. Introduction (150-200 words) - Start with interesting statistic or question
3. Understanding the basics - Explain core concepts
4. Key benefits and advantages - Clear list of benefits
5. Step-by-step implementation - Actionable instructions
6. Common mistakes to avoid - Frequent pitfalls
7. Examples and case studies - Real-world stories
8. Conclusion - Summarize key points and next steps`}

CONTENT GUIDELINES:
${isThaiContent ? `
- ใช้ภาษาไทยที่เป็นธรรมชาติและเข้าใจง่าย
- ให้ตัวอย่างที่เกี่ยวข้องกับตลาดไทย
- ใช้คำศัพท์ทางธุรกิจที่เหมาะสม
- เขียนในระดับความเป็นทางการที่เหมาะสม
- ให้คำแนะนำที่ปฏิบัติได้จริง` : `
- Use natural, conversational English
- Include relevant examples and statistics
- Provide actionable, practical advice
- Write in an engaging, helpful tone
- Include specific tips and strategies`}

Write the complete blog post now, ensuring every section provides real value and actionable insights.`;
  }

  private buildAdvancedProductPrompt(baseContext: string, options: any, isThaiContent: boolean): string {
    return `${baseContext}

ADVANCED PRODUCT DESCRIPTION FRAMEWORK:
${isThaiContent ? `
1. หัวข้อสินค้าที่น่าสนใจ
2. ประโยชน์หลักและคุณสมบัติ
3. ข้อมูลทางเทคนิค
4. การใช้งานและการประยุกต์
5. การแก้ปัญหาของลูกค้า
6. เรียกร้องให้ดำเนินการ` : `
1. Compelling product title
2. Key benefits and features
3. Technical specifications
4. Use cases and applications
5. Customer pain points addressed
6. Strong call-to-action`}

Focus on conversion optimization and user trust building.`;
  }

  private buildAdvancedCategoryPrompt(baseContext: string, options: any, isThaiContent: boolean): string {
    return `${baseContext}

ADVANCED CATEGORY DESCRIPTION FRAMEWORK:
${isThaiContent ? `
1. ภาพรวมของหมวดหมู่
2. หมวดหมู่ย่อยหรือผลิตภัณฑ์หลัก
3. ประโยชน์ของหมวดหมู่นี้
4. คู่มือการเลือกซื้อ
5. แบรนด์หรือตัวเลือกยอดนิยม
6. หมวดหมู่ที่เกี่ยวข้อง` : `
1. Category overview
2. Key subcategories or products
3. Benefits of this category
4. How to choose/buying guide
5. Popular brands or options
6. Related categories`}

Help users navigate and understand the category effectively.`;
  }

  private buildAdvancedMetaPrompt(baseContext: string, options: any, isThaiContent: boolean): string {
    return `${baseContext}

META DESCRIPTION OPTIMIZATION:
${isThaiContent ? `
- ความยาว: 120-150 ตัวอักษร
- รวมคีย์เวิร์ดหลัก
- สร้างความน่าสนใจและคลิก
- อธิบายเนื้อหาอย่างแม่นยำ
- รวมการเรียกร้องให้ดำเนินการ` : `
- Length: 150-160 characters
- Include primary keyword
- Make it compelling and click-worthy
- Accurately describe the content
- Include a call-to-action if appropriate`}

Create a meta description that improves click-through rates.`;
  }

  // Helper methods for intelligent content analysis
  private analyzeUserIntent(topic: string, contentType: string): string {
    if (contentType === 'blog') {
      if (topic.includes('how to') || topic.includes('วิธี')) return 'Learn and implement';
      if (topic.includes('best') || topic.includes('ดีที่สุด')) return 'Compare and choose';
      if (topic.includes('what is') || topic.includes('คืออะไร')) return 'Understand and learn';
      return 'Gain knowledge and insights';
    }
    return 'Find and purchase';
  }

  private identifyPainPoints(topic: string, isThaiContent: boolean): string {
    const commonPains = isThaiContent ? [
      'ขาดความรู้และประสบการณ์',
      'ไม่แน่ใจในการตัดสินใจ',
      'กลัวทำผิดพลาด',
      'ต้องการคำแนะนำจากผู้เชี่ยวชาญ'
    ] : [
      'Lack of knowledge and experience',
      'Uncertainty in decision making',
      'Fear of making mistakes',
      'Need for expert guidance'
    ];
    return commonPains.join(', ');
  }

  private identifyDesiredOutcomes(topic: string, isThaiContent: boolean): string {
    return isThaiContent ? 
      'ความเข้าใจที่ชัดเจน, การปฏิบัติที่ประสบความสำเร็จ, ความมั่นใจในการตัดสินใจ' :
      'Clear understanding, successful implementation, confident decision making';
  }

  private generateLSIKeywords(topic: string, isThaiContent: boolean): string {
    // This would ideally connect to a keyword research API
    return isThaiContent ? 
      'คำที่เกี่ยวข้อง, แนวคิด, วิธีการ, เทคนิค' :
      'related terms, concepts, methods, techniques';
  }

  private enhanceTone(tone: string | undefined, isThaiContent: boolean): string {
    const baseTone = tone || 'professional';
    if (isThaiContent) {
      return `${baseTone} แต่เป็นมิตรและเข้าถึงได้ง่าย`;
    }
    return `${baseTone} yet friendly and accessible`;
  }

  private parseResponse(data: any): GeminiResponse {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated by Gemini 2.5 Pro');
    }

    const candidate = data.candidates[0];
    
    // Check for safety blocks
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Content blocked by safety filters');
    }

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini 2.5 Pro');
    }

    return {
      text: candidate.content.parts[0].text,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings
    };
  }

  private basicContentAnalysis(content: string, keywords: string[]): {
    score: number;
    suggestions: string[];
    keywordAnalysis: Record<string, number>;
    readabilityScore: number;
  } {
    const words = content.split(/\s+/).length;
    const suggestions: string[] = [];
    let score = 70;

    // Keyword analysis
    const keywordAnalysis: Record<string, number> = {};
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      const density = (matches.length / words) * 100;
      keywordAnalysis[keyword] = density;

      if (density < 0.5) {
        suggestions.push(`Increase usage of keyword "${keyword}"`);
        score -= 5;
      } else if (density > 3) {
        suggestions.push(`Reduce keyword "${keyword}" density`);
        score -= 3;
      }
    });

    // Basic readability
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 1.5)));

    if (readabilityScore < 60) {
      suggestions.push('Use shorter sentences for better readability');
      score -= 5;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      suggestions,
      keywordAnalysis,
      readabilityScore
    };
  }
}

// Export default instance with the provided API key
export const geminiService = new GeminiService({
  apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyDTITCw_UcgzUufrsCFuxp9HXri6Y0XrDo'
});

export default GeminiService;