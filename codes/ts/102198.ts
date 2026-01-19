// Gemini API Service for direct client-side integration
// This allows AI tools to work without a backend server

interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface GeminiResponse {
  content: string;
  error?: string;
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor() {
    // Try to get API key from environment or localStorage
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  localStorage.getItem('gemini_api_key') || 
                  '';
  }

  // Set API key at runtime
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('gemini_api_key', apiKey);
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Generate content using Gemini
  async generateContent({ prompt, temperature = 0.8, maxTokens = 1000 }: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      return {
        content: '',
        error: 'Gemini API key not configured. Please add your API key to use AI features.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 64
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content generated from Gemini API');
      }

      return {
        content: content.trim()
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Generate content for specific use cases
  async generateBlogPost(topic: string, audience: string, tone: string): Promise<GeminiResponse> {
    const prompt = `Write a comprehensive blog post about "${topic}" for ${audience} with a ${tone} tone. 
    
    Include:
    - Engaging headline
    - Clear introduction
    - 3-4 main sections with subheadings
    - Actionable insights
    - Compelling conclusion
    - Word count: 800-1200 words
    
    Make it informative, well-structured, and SEO-friendly.`;

    return this.generateContent({ prompt, maxTokens: 1500 });
  }

  async generateSocialMediaPost(platform: string, topic: string, tone: string): Promise<GeminiResponse> {
    const platformGuidelines = {
      'LinkedIn': 'professional, thought-leadership style with 1-3 sentences and relevant hashtags',
      'Twitter': 'concise, engaging, under 280 characters with relevant hashtags',
      'Instagram': 'visual storytelling style with emojis and hashtags',
      'Facebook': 'conversational, community-focused with call-to-action'
    };

    const guidelines = platformGuidelines[platform as keyof typeof platformGuidelines] || 'engaging social media style';

    const prompt = `Create a ${platform} post about "${topic}" with a ${tone} tone.
    
    Style: ${guidelines}
    
    Requirements:
    - Platform-optimized format
    - Engaging and shareable
    - Include relevant hashtags
    - Clear call-to-action if appropriate`;

    return this.generateContent({ prompt, maxTokens: 300 });
  }

  async generateAdCopy(product: string, audience: string, goal: string): Promise<GeminiResponse> {
    const prompt = `Create compelling ad copy for "${product}" targeting ${audience} with the goal to ${goal}.
    
    Include:
    - Attention-grabbing headline
    - Persuasive body text
    - Strong call-to-action
    - Address pain points and benefits
    - 3 variations: short, medium, and long versions
    
    Make it conversion-focused and emotionally compelling.`;

    return this.generateContent({ prompt, maxTokens: 600 });
  }

  async generateSEOMeta(topic: string, keywords: string): Promise<GeminiResponse> {
    const prompt = `Generate SEO-optimized meta tags for a page about "${topic}" targeting keywords: ${keywords}
    
    Create:
    1. Title tag (50-60 characters)
    2. Meta description (150-160 characters)
    3. H1 heading
    4. 3 alternative H2 headings
    5. 5 related long-tail keywords
    
    Make them compelling for users and optimized for search engines.`;

    return this.generateContent({ prompt, maxTokens: 400 });
  }

  async generateHashtags(params: {
    topic: string;
    platform: string;
    count: number;
    description?: string;
  }): Promise<string[]> {
    const prompt = `Generate ${params.count} trending hashtags for "${params.topic}" on ${params.platform}.
    
    ${params.description ? `Additional context: ${params.description}` : ''}
    
    Requirements:
    - Mix of popular and niche hashtags
    - Platform-specific optimization
    - Current trending tags
    - Engagement-focused hashtags
    
    Return only the hashtags with # symbols, one per line.`;

    const response = await this.generateContent({ prompt, maxTokens: 300 });
    
    if (!response.content) {
      throw new Error('Failed to generate hashtags');
    }

    // Extract hashtags from response
    const hashtagRegex = /#[\w\d_]+/g;
    const matches = response.content.match(hashtagRegex) || [];
    
    // If no hashtags found with #, try to extract words and add #
    if (matches.length === 0) {
      const words = response.content.split(/[\s,\n]+/).filter(word => word.length > 0);
      return words.slice(0, params.count).map(word => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
        return cleanWord ? `#${cleanWord}` : '';
      }).filter(Boolean);
    }
    
    return matches.slice(0, params.count);
  }

  async generateSocialMediaPost(params: {
    topic: string;
    platform: string;
    tone: string;
    audience?: string;
    includeEmojis: boolean;
    includeCallToAction: boolean;
    callToActionText?: string;
  }): Promise<string> {
    const charLimits: Record<string, string> = {
      'Twitter': '280 characters',
      'Instagram': '2,200 characters',
      'LinkedIn': '3,000 characters',
      'Facebook': '63,206 characters',
      'TikTok': '300 characters'
    };

    const prompt = `Create a ${params.tone.toLowerCase()} social media post for ${params.platform} about "${params.topic}".
    
    ${params.audience ? `Target audience: ${params.audience}` : ''}
    Platform limit: ${charLimits[params.platform] || 'No specific limit'}
    Include emojis: ${params.includeEmojis ? 'Yes' : 'No'}
    Include call-to-action: ${params.includeCallToAction ? 'Yes' : 'No'}
    ${params.callToActionText ? `Suggested CTA: ${params.callToActionText}` : ''}
    
    Make it engaging, platform-appropriate, and optimized for ${params.platform} audience behavior.`;

    const response = await this.generateContent({ prompt, maxTokens: 300 });
    
    if (!response.content) {
      throw new Error('Failed to generate social media post');
    }

    return response.content;
  }

  async generateAdCopy(params: {
    product: string;
    platform: string;
    goal: string;
    adFormat: string;
    targetAudience?: string;
    keyBenefits?: string;
    tone: string;
    budget?: string;
    additionalInfo?: string;
  }): Promise<string> {
    const prompt = `Create ${params.adFormat.toLowerCase()} ad copy for ${params.platform} to achieve ${params.goal}.
    
    Product/Service: ${params.product}
    ${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}
    ${params.keyBenefits ? `Key Benefits: ${params.keyBenefits}` : ''}
    Tone: ${params.tone}
    ${params.budget ? `Budget Context: ${params.budget}` : ''}
    ${params.additionalInfo ? `Additional Info: ${params.additionalInfo}` : ''}
    
    Create compelling, conversion-focused ad copy that follows ${params.platform} best practices.
    Include strong value propositions and clear calls-to-action.`;

    const response = await this.generateContent({ prompt, maxTokens: 400 });
    
    if (!response.content) {
      throw new Error('Failed to generate ad copy');
    }

    return response.content;
  }

  async generateSEOMeta(params: {
    topic: string;
    contentType: string;
    targetKeywords?: string;
    description?: string;
    industry?: string;
    location?: string;
  }): Promise<{
    title: string;
    metaDescription: string;
    h1: string;
    h2Suggestions: string[];
    keywords: string[];
    htmlMeta: string;
  }> {
    const prompt = `Generate comprehensive SEO content for a ${params.contentType.toLowerCase()} about "${params.topic}".
    
    ${params.targetKeywords ? `Target Keywords: ${params.targetKeywords}` : ''}
    ${params.description ? `Description: ${params.description}` : ''}
    ${params.industry ? `Industry: ${params.industry}` : ''}
    ${params.location ? `Location: ${params.location}` : ''}
    
    Provide in this exact format:
    TITLE: [50-60 character SEO title]
    META_DESCRIPTION: [150-160 character meta description]
    H1: [Main heading]
    H2_1: [First H2 suggestion]
    H2_2: [Second H2 suggestion]
    H2_3: [Third H2 suggestion]
    KEYWORDS: [5 comma-separated long-tail keywords]`;

    const response = await this.generateContent({ prompt, maxTokens: 500 });
    
    if (!response.content) {
      throw new Error('Failed to generate SEO content');
    }

    // Parse the structured response
    const lines = response.content.split('\n');
    const title = lines.find(line => line.startsWith('TITLE:'))?.replace('TITLE:', '').trim() || params.topic;
    const metaDescription = lines.find(line => line.startsWith('META_DESCRIPTION:'))?.replace('META_DESCRIPTION:', '').trim() || '';
    const h1 = lines.find(line => line.startsWith('H1:'))?.replace('H1:', '').trim() || params.topic;
    
    const h2Suggestions = [
      lines.find(line => line.startsWith('H2_1:'))?.replace('H2_1:', '').trim(),
      lines.find(line => line.startsWith('H2_2:'))?.replace('H2_2:', '').trim(),
      lines.find(line => line.startsWith('H2_3:'))?.replace('H2_3:', '').trim()
    ].filter(Boolean) as string[];
    
    const keywordsLine = lines.find(line => line.startsWith('KEYWORDS:'))?.replace('KEYWORDS:', '').trim() || '';
    const keywords = keywordsLine.split(',').map(k => k.trim()).filter(Boolean);

    // Generate HTML meta tags
    const htmlMeta = `<title>${title}</title>
<meta name="description" content="${metaDescription}">
<meta name="keywords" content="${keywords.join(', ')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDescription}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${metaDescription}">`;

    return {
      title,
      metaDescription,
      h1,
      h2Suggestions,
      keywords,
      htmlMeta
    };
  }

  async generateVideoIdea(params: {
    topic: string;
    platform: string;
    duration: string;
    style: string;
  }): Promise<string> {
    const prompt = `Create a detailed video concept for ${params.platform} about "${params.topic}".
    
    Duration: ${params.duration}
    Style: ${params.style}
    
    Provide:
    1. Hook/Opening (first 3 seconds)
    2. Main content structure
    3. Visual suggestions
    4. Script outline or key talking points
    5. Call-to-action
    6. Hashtag suggestions
    7. Best posting time recommendation
    
    Make it engaging, platform-specific, and optimized for ${params.platform} algorithm.`;

    const response = await this.generateContent({ prompt, maxTokens: 500 });
    
    if (!response.content) {
      throw new Error('Failed to generate video idea');
    }

    return response.content;
  }
}

// Create singleton instance
export const geminiService = new GeminiService();

// Export types for use in components
export type { GeminiRequest, GeminiResponse };
