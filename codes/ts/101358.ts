import openai from "@/lib/openai";
import { analyzeWebsite } from "./websiteAnalyzer";

interface DraftInput {
  name: string;
  url: string;
  description?: string;
  locale?: string;
  targetCountry?: string;
}

export async function generatePersonaDraft(
  brand: DraftInput
): Promise<{
  name: string;
  description: string;
  locale: string;
  intent: string;
  tone: string;
  demographics: {
    age: string;
    income: string;
    education: string;
    interests: string[];
  };
  gamingPreferences?: {
    gameTypes: string[];
    betSize: string;
    frequency: string;
  };
  systemPrompt: string;
  userPrompt: string;
}> {
  console.log(`🤖 Generating custom persona for brand: ${brand.name}`);
  
  // Analyze the brand's website first
  const websiteAnalysis = await analyzeWebsite(brand.url);
  
  // Determine locale based on target country or market focus
  const locale = brand.locale || 
    (brand.targetCountry === 'BR' ? 'pt-BR' :
     brand.targetCountry === 'DE' ? 'de-DE' :
     brand.targetCountry === 'ES' ? 'es-ES' :
     brand.targetCountry === 'FR' ? 'fr-FR' :
     websiteAnalysis.marketFocus === 'Brazil' ? 'pt-BR' :
     websiteAnalysis.marketFocus === 'Germany' ? 'de-DE' :
     'en-US');

  const prompt = `
You are a persona architect for ChatGPT brand monitoring. Create a detailed, realistic persona for someone who would naturally ask ChatGPT about this brand.

BRAND ANALYSIS:
Name: ${brand.name}
URL: ${brand.url}
Description: ${brand.description || ''}
Industry: ${websiteAnalysis.industry}
Target Audience: ${websiteAnalysis.targetAudience}
Brand Tone: ${websiteAnalysis.brandTone}
Key Features: ${websiteAnalysis.keyFeatures.join(', ')}
Value Proposition: ${websiteAnalysis.valueProposition}
Gaming Types: ${websiteAnalysis.gamingTypes?.join(', ') || 'N/A'}
Market Focus: ${websiteAnalysis.marketFocus}
Locale: ${locale}

Create a persona who would realistically search for and ask ChatGPT about this specific brand. The persona should be:
1. Someone who matches the brand's target audience
2. Has realistic motivations to research this brand
3. Would naturally use ChatGPT to get information
4. Specific to this brand's industry and market

Return a JSON object with these exact keys:
{
  "name": "Descriptive persona name reflecting their role/interest",
  "description": "2-3 sentence description of who they are and why they'd research this brand",
  "locale": "${locale}",
  "intent": "Their specific goal when researching this brand",
  "tone": "casual/professional/enthusiastic/neutral",
  "demographics": {
    "age": "age range (e.g., '25-35')",
    "income": "income bracket appropriate for this brand",
    "education": "education level",
    "interests": ["interest1", "interest2", "interest3"]
  },
  ${websiteAnalysis.gamingTypes ? `
  "gamingPreferences": {
    "gameTypes": ${JSON.stringify(websiteAnalysis.gamingTypes)},
    "betSize": "betting size preference",
    "frequency": "how often they play"
  },` : ''}
  "systemPrompt": "Detailed system prompt that defines this persona's background, motivations, and how they would naturally ask about this brand. Include their demographic details, interests, and why they're researching ${brand.name}.",
  "userPrompt": "A natural, conversational query this persona would ask ChatGPT about ${brand.name}. Should feel authentic and specific to their needs and the brand's offerings."
}

Make it realistic and specific to this exact brand and market. No generic responses.
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const json = JSON.parse(chat.choices[0].message.content || '{}');

  // Validate required fields
  const requiredFields = ['name', 'description', 'locale', 'intent', 'tone', 'demographics', 'systemPrompt', 'userPrompt'];
  for (const field of requiredFields) {
    if (!json[field]) {
      throw new Error(`OpenAI response missing required field: ${field}`);
    }
  }

  console.log(`✅ Generated custom persona: ${json.name} for ${brand.name}`);
  
  return json;
}
