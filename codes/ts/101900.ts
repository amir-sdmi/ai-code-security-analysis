import { Character } from '@/types/game';
import { I18n } from './i18n';

/**
 * Response structure from Grok API
 */
interface GrokAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Client for interacting with Grok AI API
 * Handles mystery generation and character dialogue
 */
export class GrokClient {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';
  private model = 'grok-3-mini'; // Cost-effective model for game content
  private maxTokens = 7000; // Sufficient for detailed mystery content
  private i18n: I18n;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.i18n = I18n.getInstance();
  }

  /**
   * Generates language-specific instruction for AI responses
   * Ensures all content matches user's selected language
   */
  private getLanguageInstruction(): string {
    const currentLang = this.i18n.getCurrentLanguage();
    switch (currentLang) {
      case 'ru':
        return 'Отвечай ТОЛЬКО на Русском языке. Весь контент должен быть на Русском языке.';
      case 'uk':
        return 'Відповідай ТІЛЬКИ українською мовою. Весь контент повинен бути Українською мовою.';
      case 'es':
        return 'Responde SOLAMENTE en español. Todo el contenido debe estar en español.';
      case 'de':
        return 'Antworte NUR auf Deutsch. Alle Inhalte müssen auf Deutsch sein.';
      default:
        return 'Respond ONLY in English language. All content must be in English.';
    }
  }

  /**
   * Gets localized term for "detective" based on current language
   * Used in character dialogues to address the player
   */
  private getDetectiveName(): string {
    const currentLang = this.i18n.getCurrentLanguage();
    switch (currentLang) {
      case 'ru':
        return 'детектив';
      case 'uk':
        return 'детектив';
      case 'es':
        return 'detective';
      case 'de':
        return 'Detektiv';
      default:
        return 'detective';
    }
  }

  /**
   * Generates a complete murder mystery scenario
   * Creates setting, victim, suspects, and assigns killer randomly
   */
  async generateMystery(suspectCount: number = 5): Promise<any> {
    const languageInstruction = this.getLanguageInstruction();

    const prompt = `${languageInstruction}

Generate a murder mystery game with the following structure:
    
    1. Setting: an intriguing and cinematic combination of time and place for the crime
    2. Create a victim and murder details (weapon, location, time)
    3. Generate exactly ${suspectCount} witnesses/suspects, one of whom is the killer
    4. Each character needs: id (generate unique string), name, age, occupation, description, backstory, alibi, connections (array of other character names), isKiller (boolean - only one should be true)
    5. Make backstory detailed and well described. 5-10 lines
    6. Make 'setting' not too long, up to 100-120 characters maximum
    7. Create logical connections between characters
    8. Use names according to the location
    9. The killer's alibi should have subtle lies/inconsistencies
    10. Add evidence to the crime scene; this could include items belonging to other suspects (including the murderer). There should be a reason why these items are there and a connection to their owners. It doesn't necessarily have to be related to the murder; they could just be random items.
    11. Try to give an answer that is no longer than 6000 tokens
    
    Return ONLY valid JSON with this exact structure:
    {
      "setting": "string",
      "victim": "string", 
      "murderWeapon": "string",
      "murderLocation": "string",
      "belongings": string,
      "murderTime": "string",
      "backstory": "string",
      "characters": [
        {
          "id": "string",
          "name": "string",
          "age": number,
          "occupation": "string",
          "description": "string",
          "backstory": "string",
          "alibi": "string",
          "connections": ["string"],
          "isKiller": boolean
        }
      ]
    }`;

    const result = await this.makeRequest(prompt);
    try {
      return result;
    } catch (error) {
      console.error('Failed to parse mystery data:', error);
      throw new Error('Failed to generate valid mystery data');
    }
  }

  /**
   * Generates character responses to player questions
   * Handles truth/lies based on character's killer status
   */
  async getCharacterResponse(
    character: Character,
    playerQuestion: string,
    conversationHistory: string[]
  ): Promise<{ response: string; isLie: boolean }> {
    const languageInstruction = this.getLanguageInstruction();
    const detectiveName = this.getDetectiveName();

    const prompt = `${languageInstruction}

You are ${character.name}, a ${character.occupation}.
    
    Character details:
    - Age: ${character.age}
    - Description: ${character.description}
    - Backstory: ${character.backstory}
    - Alibi: ${character.alibi}
    - Is killer: ${character.isKiller}
    - Connections: ${character.connections.join(', ')}
    
    Rules:
    - If you're NOT the killer, always tell the truth
    - If you ARE the killer, you may lie to protect yourself, but be subtle
    - Stay in character with your personality and background
    - Reference your connections to other characters when relevant
    - Keep responses conversational and realistic
    - If lying, make it subtle - don't contradict yourself too obviously
    - Highlight important details (like: time, event, alibi, witnesses...) in your response that may be considered important for the investigation: make it bold
    - Do not highlite '${detectiveName}' in your response
    - Use short sentences and natural language
    - Use a tone that matches your character's personality
    - Name the person asking the question - ${detectiveName}
    - Start your reply with a greeting only for the first message. Next, answer the question immediately
    - With very little chance, when you tell the truth, you may be slightly mistaken or forget something
    
    Previous conversation: ${conversationHistory.join('\n')}
    
    Player asks: "${playerQuestion}"
    
    Respond as this character would, and indicate if this response contains a lie.
    Return ONLY valid JSON in this format: {"response": "your response here", "isLie": true/false}`;

    const result = await this.makeRequest(prompt);
    try {
      const parsed = JSON.parse(result);
      return {
        response: parsed.response || result,
        isLie: parsed.isLie || false
      };
    } catch (error) {
      console.error('Failed to parse character response:', error);
      // Fallback to raw response if JSON parsing fails
      return { response: result, isLie: false };
    }
  }

  /**
   * Makes HTTP request to Grok API
   * Handles authentication and error responses
   */
  private async makeRequest(prompt: string, retries: number = 3): Promise<string> {
    const languageInstruction = this.getLanguageInstruction();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `You are a creative AI assistant helping create an interactive murder mystery game. Always return valid JSON when requested. ${languageInstruction}`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: this.maxTokens,
            stream: false,
            stop: null,
          }),
        });

        if (response.status === 503 && attempt < retries) {
          console.log(`Attempt ${attempt} failed with 503, retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: GrokAPIResponse = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        if (attempt === retries) {
          console.error('Grok API request failed after all retries:', error);
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}