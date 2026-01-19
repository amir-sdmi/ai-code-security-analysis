export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string | null = null;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  private constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    console.log('🔧 Gemini API Key configured:', !!this.apiKey);
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public isConfigured(): boolean {
    const configured = !!this.apiKey && this.apiKey.length > 20 && !this.apiKey.includes('your_');
    console.log('🔧 Gemini isConfigured:', configured);
    return configured;
  }

  public async generateCharacterImage(characterDescription: string, actualTraits?: {
    gender?: string;
    hairColor?: string;
    eyeColor?: string;
    ethnicity?: string;
    age?: string;
  }): Promise<string> {
    console.log('🎨 Gemini generateCharacterImage called with:', characterDescription);
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini API key not configured properly, using fallback');
      throw new Error('Gemini API key not configured properly');
    }

    try {
      console.log('🚀 Making Gemini API request for character image...');
      
      // Use Gemini to generate a detailed image prompt
      const prompt = `Based on this character description: "${characterDescription}"

Create a detailed, professional image generation prompt for creating a realistic character portrait. Include:
- Physical appearance details
- Clothing/style
- Facial features
- Expression/mood
- Lighting and composition suggestions
- Art style (photorealistic portrait)

Format as a single, detailed prompt suitable for image generation AI.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      });

      console.log('✅ Gemini API response received');
      const imagePrompt = response.candidates[0].content.parts[0].text;
      console.log('🎯 Generated image prompt:', imagePrompt);
      
      // Return a curated image URL based on the description and actual traits
      const imageUrl = this.getCuratedImageFromDescription(characterDescription, imagePrompt, actualTraits);
      console.log('🖼️ Selected image URL:', imageUrl);
      
      return imageUrl;
    } catch (error: any) {
      console.error('❌ Gemini character image generation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection and API key.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid Gemini API key. Please check your API key configuration.');
      } else if (error.message.includes('403')) {
        throw new Error('Gemini API access forbidden. Please verify your API key permissions.');
      } else if (error.message.includes('429')) {
        throw new Error('Gemini API rate limit exceeded. Please try again in a moment.');
      }
      
      throw error;
    }
  }

  public async generateStoryResponse(
    userMessage: string, 
    theme: string, 
    conversationHistory: any[]
  ): Promise<string> {
    console.log('📝 Gemini generateStoryResponse called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackResponse(userMessage, theme, conversationHistory.length);
    }

    try {
      console.log('🚀 Making Gemini API request for story response...');
      
      const systemPrompt = `You are a professional story writer and creative assistant specializing in ${theme} stories. 

Your role is to:
1. Help users develop their story ideas through conversation
2. Ask clarifying questions about plot, characters, and setting
3. Provide creative suggestions and plot developments
4. When the user is ready (after 3-4 exchanges or when they explicitly ask), generate a complete screenplay

Keep responses conversational, creative, and focused on ${theme} genre elements. When generating a complete story, format it as a proper screenplay with scene headings, character names, dialogue, and action descriptions.`;

      const conversationContext = conversationHistory.slice(-6).map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const prompt = `${systemPrompt}

Previous conversation:
${conversationContext}

User: ${userMessage}

Please respond as the story assistant.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      });

      console.log('✅ Gemini story response generated');
      return response.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      return this.getFallbackResponse(userMessage, theme, conversationHistory.length);
    }
  }

  public async generateCompleteStory(
    theme: string, 
    storyIdea: string, 
    conversationContext?: string
  ): Promise<string> {
    console.log('📖 Gemini generateCompleteStory called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackStory(theme, storyIdea);
    }

    try {
      console.log('🚀 Making Gemini API request for complete story...');
      
      const prompt = `Create a complete ${theme} story screenplay based on this concept: "${storyIdea}"

${conversationContext ? `Additional context from our conversation: ${conversationContext}` : ''}

Please format the story as a professional screenplay with:
- Scene headings (EXT./INT. LOCATION - TIME)
- Character names in ALL CAPS when speaking
- Dialogue
- Action descriptions in parentheses
- Multiple acts with clear story progression

The story should be engaging, well-structured, and approximately 1000-1500 words long.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
        }
      });

      console.log('✅ Gemini complete story generated');
      return response.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      return this.getFallbackStory(theme, storyIdea);
    }
  }

  public async generateStoryIdeas(theme: string, count: number = 5): Promise<Array<{title: string, description: string, prompt: string}>> {
    console.log('💡 Gemini generateStoryIdeas called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackStoryIdeas(theme, count);
    }

    try {
      console.log('🚀 Making Gemini API request for story ideas...');
      
      const prompt = `Generate ${count} unique and creative ${theme} story ideas. For each idea, provide:
1. A compelling title
2. A brief description (1-2 sentences)
3. A conversation starter prompt to help develop the idea

Format as JSON array with objects containing "title", "description", and "prompt" fields.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      });

      const content = response.candidates[0].content.parts[0].text;
      console.log('📝 Gemini story ideas response:', content);
      
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const ideas = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed story ideas:', ideas);
          return ideas;
        }
        console.log('⚠️ No JSON found in response, using fallback');
        return this.getFallbackStoryIdeas(theme, count);
      } catch (parseError) {
        console.log('⚠️ JSON parse error, using fallback:', parseError);
        return this.getFallbackStoryIdeas(theme, count);
      }
    } catch (error) {
      console.error('❌ Error generating story ideas:', error);
      return this.getFallbackStoryIdeas(theme, count);
    }
  }

  public validateImageMatch(imageUrl: string, description: string, expectedTraits: {
    gender?: string;
    hairColor?: string;
    eyeColor?: string;
    ethnicity?: string;
    age?: string;
  }): { isValid: boolean; mismatches: string[]; confidence: number } {
    console.log('🔍 Validating image match for traits:', expectedTraits);
    console.log('🖼️ Image URL being validated:', imageUrl);
    
    const mismatches: string[] = [];
    const warnings: string[] = [];
    
    // Extract traits from image URL to match against expected traits
    const imageTraits = this.extractTraitsFromImageUrl(imageUrl);
    console.log('🔬 Extracted image traits:', imageTraits);
    
    let matchedTraits = 0;
    let totalTraits = 0;
    
    // Check gender match
    if (expectedTraits.gender) {
      totalTraits++;
      const expectedGender = expectedTraits.gender.toLowerCase();
      const imageGender = imageTraits.gender?.toLowerCase() || '';
      
      if (imageGender && imageGender === expectedGender) {
        matchedTraits++;
        console.log(`✅ Gender match: ${expectedGender}`);
      } else if (imageGender && imageGender !== expectedGender) {
        mismatches.push(`Expected ${expectedTraits.gender} but image shows ${imageTraits.gender || 'unknown'}`);
        console.log(`❌ Gender mismatch: expected ${expectedGender}, got ${imageGender}`);
      } else {
        // Fallback to description analysis for generic images
        const descLower = description.toLowerCase();
        const hasCorrectGender = descLower.includes(expectedGender) || 
                                 (expectedGender === 'male' && (descLower.includes('man') || descLower.includes('boy'))) ||
                                 (expectedGender === 'female' && (descLower.includes('woman') || descLower.includes('girl')));
        
        if (hasCorrectGender) {
          matchedTraits += 0.7; // Partial credit for description match
        } else {
          mismatches.push(`Expected ${expectedTraits.gender} but image may not match`);
        }
      }
    }
    
    // Check ethnicity match
    if (expectedTraits.ethnicity) {
      totalTraits++;
      const expectedEthnicity = expectedTraits.ethnicity.toLowerCase();
      const imageEthnicity = imageTraits.ethnicity?.toLowerCase() || '';
      
      if (imageEthnicity && imageEthnicity === expectedEthnicity) {
        matchedTraits++;
        console.log(`✅ Ethnicity match: ${expectedEthnicity}`);
      } else if (imageEthnicity && imageEthnicity !== expectedEthnicity) {
        mismatches.push(`Expected ${expectedTraits.ethnicity} but image shows ${imageTraits.ethnicity || 'unknown'}`);
        console.log(`❌ Ethnicity mismatch: expected ${expectedEthnicity}, got ${imageEthnicity}`);
      } else {
        // Partial credit if we can't determine from URL
        matchedTraits += 0.5;
        warnings.push(`Cannot verify ${expectedTraits.ethnicity} ethnicity from image`);
      }
    }
    
    // Check hair color match  
    if (expectedTraits.hairColor) {
      totalTraits++;
      const expectedHair = expectedTraits.hairColor.toLowerCase();
      const imageHair = imageTraits.hairColor?.toLowerCase() || '';
      
      if (imageHair && imageHair === expectedHair) {
        matchedTraits++;
        console.log(`✅ Hair color match: ${expectedHair}`);
      } else if (imageHair && imageHair !== expectedHair) {
        mismatches.push(`Expected ${expectedTraits.hairColor} hair but image shows ${imageTraits.hairColor || 'unknown'}`);
        console.log(`❌ Hair color mismatch: expected ${expectedHair}, got ${imageHair}`);
      } else {
        // Can't determine from URL, give partial credit
        matchedTraits += 0.4;
        warnings.push(`Expected ${expectedTraits.hairColor} hair - verify visual match`);
      }
    }
    
    // Check eye color match (hardest to determine from URL, mostly warning)
    if (expectedTraits.eyeColor) {
      totalTraits++;
      const expectedEyes = expectedTraits.eyeColor.toLowerCase();
      // Eye color rarely determinable from URL, so give partial credit
      matchedTraits += 0.5;
      warnings.push(`Expected ${expectedTraits.eyeColor} eyes - verify visual match`);
    }
    
    // Age is typically not determinable from URL patterns
    if (expectedTraits.age) {
      totalTraits++;
      matchedTraits += 0.6; // Give benefit of doubt for age
    }
    
    // Calculate confidence score based on actual trait matching
    const confidence = totalTraits > 0 ? Math.max(0, Math.min(1, matchedTraits / totalTraits)) : 0;
    
    // Apply penalty for critical mismatches (gender, ethnicity)
    const criticalMismatches = mismatches.filter(m => 
      m.includes('gender') || m.includes('ethnicity') || 
      m.includes('Expected male') || m.includes('Expected female') ||
      m.includes('caucasian') || m.includes('asian') || m.includes('african') || m.includes('hispanic')
    );
    
    const finalConfidence = criticalMismatches.length > 0 ? 
      Math.min(confidence, 0.4) : // Cap at 40% for critical mismatches
      confidence;
    
    const isValid = mismatches.length === 0 && finalConfidence > 0.7;
    
    console.log(`🎯 Image validation result: ${isValid ? 'VALID' : 'INVALID'} (confidence: ${(finalConfidence * 100).toFixed(1)}%)`);
    if (mismatches.length > 0) console.log('❌ Mismatches:', mismatches);
    if (warnings.length > 0) console.log('⚠️ Warnings:', warnings);
    
    return {
      isValid,
      mismatches: [...mismatches, ...warnings],
      confidence: finalConfidence
    };
  }

  private extractTraitsFromImageUrl(imageUrl: string): {
    gender?: string;
    ethnicity?: string;
    hairColor?: string;
  } {
    // Extract traits from the structured image URL patterns we use
    const traits: { gender?: string; ethnicity?: string; hairColor?: string } = {};
    
    // Try to match our image URL patterns
    const urlPattern = /\/(male|female)-(caucasian|asian|african|hispanic|middle-eastern|mixed)-(black|brown|blonde|red|auburn|gray|white)/i;
    const match = imageUrl.match(urlPattern);
    
    if (match) {
      traits.gender = match[1];
      traits.ethnicity = match[2];
      traits.hairColor = match[3];
    } else {
      // Try to extract from URL or description context
      if (imageUrl.includes('male')) traits.gender = 'male';
      else if (imageUrl.includes('female')) traits.gender = 'female';
      
      if (imageUrl.includes('asian')) traits.ethnicity = 'asian';
      else if (imageUrl.includes('african')) traits.ethnicity = 'african';
      else if (imageUrl.includes('hispanic')) traits.ethnicity = 'hispanic';
      else if (imageUrl.includes('caucasian')) traits.ethnicity = 'caucasian';
      
      if (imageUrl.includes('blonde')) traits.hairColor = 'blonde';
      else if (imageUrl.includes('red')) traits.hairColor = 'red';
      else if (imageUrl.includes('auburn')) traits.hairColor = 'auburn';
      else if (imageUrl.includes('black')) traits.hairColor = 'black';
    }
    
    return traits;
  }

  private getCuratedImageFromDescription(description: string, enhancedPrompt: string, actualTraits?: {
    gender?: string;
    hairColor?: string;
    eyeColor?: string;
    ethnicity?: string;
    age?: string;
  }): string {
    console.log('🎨 Getting curated image for description:', description);
    console.log('🎯 Actual traits provided:', actualTraits);
    
    // Use actual traits if provided, otherwise parse from description
    const traits = actualTraits || this.parseCharacterTraits(description);
    console.log('🔍 Final traits used:', traits);
    
    // Try to find best matching image based on all traits
    const selectedImage = this.selectBestMatchingImage(traits, description);
    
    // Validate the selection
    const validation = this.validateImageMatch(selectedImage, description, traits);
    
    if (!validation.isValid && validation.confidence < 0.4) {
      console.log('⚠️ Low confidence match, might need regeneration');
      // In the UI, this can trigger a "regenerate" option
    }
    
    return selectedImage;
  }

  private parseCharacterTraits(description: string): {
    gender?: string;
    hairColor?: string;
    eyeColor?: string;
    ethnicity?: string;
    age?: string;
  } {
    const descLower = description.toLowerCase();
    const traits: any = {};
    
    // Gender detection
    if (descLower.includes('male') || descLower.includes('man') || descLower.includes('boy')) {
      traits.gender = 'male';
    } else if (descLower.includes('female') || descLower.includes('woman') || descLower.includes('girl')) {
      traits.gender = 'female';
    }
    
    // Hair color detection
    const hairColors = ['red', 'blonde', 'brown', 'black', 'gray', 'white', 'auburn', 'silver'];
    for (const color of hairColors) {
      if (descLower.includes(color + ' hair') || descLower.includes(color + '-haired')) {
        traits.hairColor = color;
        break;
      }
    }
    
    // Eye color detection
    const eyeColors = ['blue', 'green', 'brown', 'hazel', 'gray', 'amber'];
    for (const color of eyeColors) {
      if (descLower.includes(color + ' eyes') || descLower.includes(color + '-eyed')) {
        traits.eyeColor = color;
        break;
      }
    }
    
    // Ethnicity detection
    const ethnicities = ['african', 'asian', 'hispanic', 'caucasian', 'middle-eastern', 'latino', 'black', 'white'];
    for (const ethnicity of ethnicities) {
      if (descLower.includes(ethnicity)) {
        traits.ethnicity = ethnicity;
        break;
      }
    }
    
    // Age detection
    if (descLower.includes('young')) {
      traits.age = 'young';
    } else if (descLower.includes('old') || descLower.includes('elder')) {
      traits.age = 'older';
    }
    
    return traits;
  }

  private selectBestMatchingImage(traits: any, description: string): string {
    const descLower = description.toLowerCase();
    
    // Enhanced character image database with comprehensive trait matching
    const characterImages = {
      // Male Caucasian
      'male-caucasian-brown': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-caucasian-blonde': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-caucasian-red': 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-caucasian-auburn': 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-caucasian-black': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Male African/African American
      'male-african-black': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-african-brown': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Male Asian
      'male-asian-black': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-asian-brown': 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-asian-auburn': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Male Hispanic/Latino
      'male-hispanic-brown': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'male-hispanic-black': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Female Caucasian
      'female-caucasian-blonde': 'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-caucasian-brown': 'https://images.unsplash.com/photo-1507101105822-7472b28e22ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-caucasian-red': 'https://images.unsplash.com/photo-1521296797187-726205347ca9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-caucasian-auburn': 'https://images.unsplash.com/photo-1521296797187-726205347ca9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-caucasian-black': 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Female African/African American
      'female-african-black': 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-african-brown': 'https://images.unsplash.com/photo-1588361035994-295e21daa761?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Female Asian
      'female-asian-black': 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-asian-brown': 'https://images.unsplash.com/photo-1601233749202-95d04d5b3c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-asian-auburn': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      
      // Female Hispanic/Latino
      'female-hispanic-brown': 'https://images.unsplash.com/photo-1615109398623-88346a601842?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
      'female-hispanic-black': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
    };
    
    // Build composite key for best matching image using parsed traits
    const genderKey = traits.gender || 'male';
    const ethnicityKey = traits.ethnicity || 'caucasian';
    const hairKey = traits.hairColor || 'brown';
    
    console.log(`🔍 Selecting image for traits: gender=${genderKey}, ethnicity=${ethnicityKey}, hair=${hairKey}`);
    
    // Try exact match first
    const exactKey = `${genderKey}-${ethnicityKey}-${hairKey}`;
    console.log(`🎯 Trying exact match key: ${exactKey}`);
    
    if (characterImages[exactKey as keyof typeof characterImages]) {
      const selectedUrl = characterImages[exactKey as keyof typeof characterImages];
      console.log(`✅ Exact match found: ${exactKey} -> ${selectedUrl}`);
      return selectedUrl;
    }
    
    // Try fallback with same gender and ethnicity, different hair colors (prioritized order)
    const prioritizedHairColors = ['brown', 'black', 'auburn', 'red', 'blonde'];
    for (const fallbackHair of prioritizedHairColors) {
      if (fallbackHair === hairKey) continue; // Skip the one we already tried
      
      const fallbackKey = `${genderKey}-${ethnicityKey}-${fallbackHair}`;
      if (characterImages[fallbackKey as keyof typeof characterImages]) {
        const selectedUrl = characterImages[fallbackKey as keyof typeof characterImages];
        console.log(`🔄 Hair color fallback: ${fallbackKey} -> ${selectedUrl}`);
        return selectedUrl;
      }
    }
    
    // Try fallback with same gender, different ethnicities (keeping original hair if possible)
    const prioritizedEthnicities = [ethnicityKey, 'caucasian', 'asian', 'african', 'hispanic'].filter((v, i, a) => a.indexOf(v) === i);
    for (const fallbackEthnicity of prioritizedEthnicities) {
      if (fallbackEthnicity === ethnicityKey) continue; // Skip original which we already tried
      
      // Try with original hair color first
      const fallbackKey = `${genderKey}-${fallbackEthnicity}-${hairKey}`;
      if (characterImages[fallbackKey as keyof typeof characterImages]) {
        const selectedUrl = characterImages[fallbackKey as keyof typeof characterImages];
        console.log(`🔄 Ethnicity fallback (same hair): ${fallbackKey} -> ${selectedUrl}`);
        return selectedUrl;
      }
      
      // Then try with common hair colors
      for (const commonHair of ['brown', 'black']) {
        const commonKey = `${genderKey}-${fallbackEthnicity}-${commonHair}`;
        if (characterImages[commonKey as keyof typeof characterImages]) {
          const selectedUrl = characterImages[commonKey as keyof typeof characterImages];
          console.log(`🔄 Ethnicity + hair fallback: ${commonKey} -> ${selectedUrl}`);
          return selectedUrl;
        }
      }
    }
    
    // Ultimate fallback - guaranteed to exist
    const ultimateFallback = genderKey === 'male' ? 'male-caucasian-brown' : 'female-caucasian-blonde';
    const fallbackUrl = characterImages[ultimateFallback as keyof typeof characterImages];
    console.log(`⚠️ Ultimate fallback: ${ultimateFallback} -> ${fallbackUrl}`);
    return fallbackUrl;
  }

  private async makeAPIRequest(endpoint: string, body: any): Promise<any> {
    const url = `${this.baseURL}${endpoint}?key=${this.apiKey}`;
    console.log('🌐 Making Gemini API request to:', endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error Response:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: { message: errorText } };
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (response.status === 403) {
          throw new Error('API access forbidden. Please check your Gemini account status.');
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${error.error?.message || 'Invalid request format'}`);
        } else {
          throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log('✅ Gemini API Response received');
      return responseData;
    } catch (fetchError: any) {
      console.error('❌ Network error in Gemini API request:', fetchError);
      
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection and API key configuration.');
      }
      
      throw fetchError;
    }
  }

  private getFallbackResponse(userMessage: string, theme: string, messageCount: number): string {
    const userMessageLower = userMessage.toLowerCase();

    if (userMessageLower.includes('suggest') || userMessageLower.includes('idea') || 
        userMessageLower.includes('help') || userMessageLower.includes('don\'t know')) {
      const ideas = this.getFallbackStoryIdeas(theme, 3);
      return `Here are some exciting ${theme} story ideas I can help you develop:

${ideas.map((idea, i) => 
  `${i + 1}. **${idea.title}**: ${idea.description}`
).join('\n\n')}

Which of these interests you, or would you like me to suggest different concepts? I can also help you develop your own unique idea!`;
    }

    if (userMessageLower.includes('generate') || userMessageLower.includes('create story') || 
        userMessageLower.includes('write story') || userMessageLower.includes('complete story')) {
      return "I'd love to help you create a complete story! Since I don't have access to advanced AI right now, let me work with the details you've shared. Could you tell me more about:\n\n• Your main character\n• The central conflict or challenge\n• The setting where this takes place\n• How you'd like the story to end\n\nWith these details, I can help craft your story!";
    }

    const responses = [
      `That's an interesting ${theme} concept! Tell me more about the main character - what's their background and motivation?`,
      `I love that idea! What's the central conflict or challenge your protagonist will face?`,
      `Great concept! What's the setting for this story? The environment can really enhance the ${theme} elements.`,
      `Fascinating! What's the climax or turning point you envision for this story?`,
      `Excellent! Who are the supporting characters that will help or hinder your protagonist?`,
      `Intriguing! What's the emotional journey you want your audience to experience?`
    ];

    return responses[messageCount % responses.length];
  }

  private getFallbackStory(theme: string, storyIdea: string): string {
    const storyTemplates = {
      fantasy: `# The Enchanted Quest

## Act I: The Discovery
*Based on your idea: ${storyIdea}*

**FADE IN:**

**EXT. MYSTICAL FOREST - DAWN**

*Morning mist swirls through ancient trees. ARIA (20s), a young village healer with determined eyes, walks carefully along a hidden path, carrying a worn leather satchel.*

**ARIA**
(to herself)
The old texts spoke of this place... but I never believed the stories were real.

*She stops before a shimmering barrier of light between two massive oak trees.*

**ARIA** (CONT'D)
(reaching toward the light)
Here goes nothing...

*As her hand touches the barrier, it ripples like water and she steps through.*

## Act II: The Challenge

**INT. ENCHANTED REALM - CONTINUOUS**

*Aria emerges into a breathtaking magical realm. Floating islands drift overhead, connected by bridges of pure light. Mystical creatures soar through crystal-clear air.*

**ELDER SAGE** (V.O.)
(ancient, wise voice)
Welcome, chosen one. You have entered the realm between worlds.

*An ethereal figure materializes before her - the ELDER SAGE, translucent and glowing.*

**ELDER SAGE** (CONT'D)
Your world is in great danger. The Shadow of Despair grows stronger each day, feeding on the loss of hope in mortal hearts.

**ARIA**
(overwhelmed but determined)
What can I do? I'm just a village healer.

**ELDER SAGE**
You possess something rare - the ability to kindle hope in others. But first, you must find the three Crystals of Light hidden in this realm.

## Act III: The Resolution

**EXT. CRYSTAL CAVERN - DAY**

*Aria stands before a magnificent cavern filled with singing crystals. She holds three glowing gems - the Crystals of Light.*

**ARIA**
(with newfound confidence)
I understand now. The real magic isn't in these crystals - it's in believing that even in the darkest times, hope can light the way.

*She raises the crystals, and they merge into a brilliant beacon of light that pierces through the gathering darkness.*

**ELDER SAGE**
(appearing beside her)
You have learned the greatest truth of all. Hope is not something you find - it's something you choose to carry.

*The light spreads across both realms, pushing back the shadows and restoring balance.*

**FADE OUT.**

**THE END**

*A story about discovering that true magic comes from within, and that hope is the most powerful force in any realm.*`,

      'sci-fi': `# Quantum Horizon

## Act I: The Signal
*Based on your idea: ${storyIdea}*

**FADE IN:**

**INT. SPACE STATION ALPHA - COMMUNICATIONS BAY - NIGHT**

*DR. SARAH CHEN (35), a brilliant quantum physicist, monitors deep space communications. Warning lights flash across her console.*

**SARAH**
(into comm device)
Control, I'm detecting an anomalous quantum signature from Sector 7. This pattern... it's impossible.

**CONTROL VOICE** (V.O.)
Impossible how, Dr. Chen?

**SARAH**
(studying the data)
It's a message, but it's coming from... the future. Thirty-seven hours from now.

## Act II: The Discovery

**INT. QUANTUM LAB - DAY**

*Sarah works frantically with holographic displays showing complex equations. Her colleague, DR. MARCUS WEBB (40s), enters.*

**MARCUS**
Sarah, you've been here all night. What's so urgent about this signal?

**SARAH**
(turning to face him)
Marcus, what if I told you that tomorrow, at 14:32 hours, a quantum cascade failure will destroy this station and everyone on it?

**MARCUS**
(skeptical)
I'd say you need sleep.

*Sarah activates a holographic playback of the future message.*

**FUTURE SARAH** (HOLOGRAM)
(desperate)
If you're receiving this, you have less than 38 hours. The quantum drive will overload during the scheduled test. You must—

*The message cuts to static.*

## Act III: The Choice

**INT. QUANTUM DRIVE CHAMBER - DAY**

*Sarah stands before the massive quantum drive, her hands hovering over the control panel. The countdown shows 00:02:15.*

**SARAH**
(to herself)
The future isn't set in stone. We always have a choice.

*She begins entering a new sequence - not the one from the manual, but one based on her own calculations.*

**MARCUS**
(over comm)
Sarah, that's not the approved sequence!

**SARAH**
(determined)
The approved sequence leads to disaster. Sometimes you have to trust the science, even when it seems impossible.

*She initiates the new sequence. The drive hums to life with a different resonance - stable, controlled.*

**COMPUTER VOICE**
Quantum drive online. All systems nominal.

*Sarah smiles as she realizes they've changed their future.*

**SARAH**
(into comm)
Control, this is Dr. Chen. The future just got a little brighter.

**FADE OUT.**

**THE END**

*A story about how knowledge, courage, and the willingness to challenge the impossible can change destiny itself.*`,

      // Add more themes as needed
    };

    return storyTemplates[theme as keyof typeof storyTemplates] || storyTemplates.fantasy;
  }

  private getFallbackStoryIdeas(theme: string, count: number) {
    const fallbackIdeas = {
      fantasy: [
        {
          title: "The Last Dragon Keeper",
          description: "A young apprentice discovers they're the last person who can communicate with dragons, just as an ancient evil awakens.",
          prompt: "Tell me more about your dragon keeper character. What's their background? How do they discover their ability?"
        },
        {
          title: "The Enchanted Library",
          description: "A librarian finds that books in their library are portals to the worlds within them, but something dark is escaping.",
          prompt: "What kind of worlds exist in these books? What dark force is trying to escape into our reality?"
        },
        {
          title: "The Crystal Prophecy",
          description: "Five magical crystals scattered across the realm must be reunited before the next eclipse, or darkness will reign forever.",
          prompt: "Who scattered the crystals and why? What makes your protagonist the chosen one to reunite them?"
        }
      ],
      'sci-fi': [
        {
          title: "The Memory Thief",
          description: "In a future where memories can be extracted and sold, a detective investigates stolen memories that contain impossible events.",
          prompt: "What impossible events are hidden in these memories? Who is stealing them and why?"
        },
        {
          title: "Colony Ship Omega",
          description: "The last human colony ship discovers they're not alone in space, and their new neighbors have been waiting for them.",
          prompt: "What have these alien neighbors been waiting for? Are they friendly or do they have other plans for humanity?"
        }
      ],
      // Add more themes as needed
    };

    const ideas = fallbackIdeas[theme as keyof typeof fallbackIdeas] || fallbackIdeas.fantasy;
    return ideas.slice(0, count);
  }
}

export const geminiService = GeminiService.getInstance();