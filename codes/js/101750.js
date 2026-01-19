import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if we're in development mode and missing an API key
const isDev = process.env.NODE_ENV !== 'production';
const apiKey = process.env.GOOGLE_API_KEY || (isDev ? 'dummy_key_for_development' : undefined);

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

export const generateStory = async ({ prompt, category, ageRange, language }) => {
  try {
    // If we're using a dummy key, return mock data instead of calling the API
    if (apiKey === 'dummy_key_for_development') {
      console.log('Using mock data for development - no Google API key provided');
      return getMockStoryData(category, language);
    }
    
    const systemPrompt = `You are a creative children's story writer specializing in interactive stories for ages ${ageRange}. 
    Create engaging, age-appropriate stories with branching choices that teach positive values.
    
    Return a JSON object with this exact structure:
    {
      "title": {"en": "Story Title", "${language}": "Translated Title"},
      "summary": {"en": "Brief summary", "${language}": "Translated summary"},
      "startNodeId": "start",
      "nodes": [
        {
          "id": "start",
          "text": {"en": "Story text", "${language}": "Translated text"},
          "imageUrl": "description of scene for illustration",
          "choices": [
            {
              "text": {"en": "Choice text", "${language}": "Translated choice"},
              "nextNodeId": "node2",
              "emoji": "🌟"
            }
          ],
          "isEnding": false
        }
      ]
    }
    
    Guidelines:
    - Create 5-8 interconnected story nodes
    - Each node should have 2-3 meaningful choices
    - Include at least 2 different ending paths
    - Use simple, engaging language appropriate for the age group
    - Include positive themes like friendship, courage, kindness
    - Make imageUrl descriptive for AI image generation
    - Keep text length appropriate: 2-3 sentences per node for ages 5-6, 3-4 for ages 7-8`;

    const userPrompt = `Create an interactive ${category} story based on this idea: "${prompt}". 
    Make it engaging for children aged ${ageRange}. Include choices that matter and lead to different outcomes.`;

    // Use Gemini Flash (or other model based on what you have access to)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I'll create a children's story with the structure you requested." }] },
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    const storyText = response.text();
    
    // Parse the JSON from the response text
    // Need to extract JSON from possible text wrapper
    const jsonMatch = storyText.match(/(\{[\s\S]*\})/);
    const jsonString = jsonMatch ? jsonMatch[0] : storyText;
    
    const storyData = JSON.parse(jsonString);
    
    // Add thumbnail URL based on category
    const thumbnailPrompts = {
      adventure: "cartoon adventure scene with mountains and treasure",
      fantasy: "magical forest with sparkles and friendly creatures",
      educational: "colorful classroom or library scene",
      friendship: "happy children playing together",
      nature: "beautiful outdoor scene with animals and trees",
      family: "warm family scene with parents and children"
    };

    storyData.thumbnailUrl = `https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400`;
    
    return storyData;
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error('Failed to generate story');
  }
};

// Function to generate mock story data for development without API key
function getMockStoryData(category, language = 'en') {
  return {
    "title": {"en": "The Magic Forest Adventure", [language]: "The Magic Forest Adventure"},
    "summary": {"en": "A story about friendship and courage in a magical forest", [language]: "A story about friendship and courage in a magical forest"},
    "startNodeId": "start",
    "nodes": [
      {
        "id": "start",
        "text": {"en": "You find yourself at the edge of a magical forest. The trees whisper secrets and the path ahead splits in two directions.", [language]: "You find yourself at the edge of a magical forest. The trees whisper secrets and the path ahead splits in two directions."},
        "imageUrl": "forest entrance with magical glow and two paths",
        "choices": [
          {
            "text": {"en": "Take the bright, sunny path", [language]: "Take the bright, sunny path"},
            "nextNodeId": "sunny_path",
            "emoji": "☀️"
          },
          {
            "text": {"en": "Try the mysterious dark path", [language]: "Try the mysterious dark path"},
            "nextNodeId": "dark_path",
            "emoji": "🌙"
          }
        ],
        "isEnding": false
      },
      {
        "id": "sunny_path",
        "text": {"en": "The sunny path leads you to a beautiful meadow filled with colorful flowers and friendly animals.", [language]: "The sunny path leads you to a beautiful meadow filled with colorful flowers and friendly animals."},
        "imageUrl": "sunny meadow with flowers and animals",
        "choices": [
          {
            "text": {"en": "Make friends with the animals", [language]: "Make friends with the animals"},
            "nextNodeId": "animal_friends",
            "emoji": "🐿️"
          },
          {
            "text": {"en": "Continue exploring the meadow", [language]: "Continue exploring the meadow"},
            "nextNodeId": "explore_meadow",
            "emoji": "🌼"
          }
        ],
        "isEnding": false
      },
      {
        "id": "dark_path",
        "text": {"en": "The dark path reveals glowing mushrooms and mysterious sounds. You notice a small, lost fairy.", [language]: "The dark path reveals glowing mushrooms and mysterious sounds. You notice a small, lost fairy."},
        "imageUrl": "dark forest with glowing mushrooms and a tiny fairy",
        "choices": [
          {
            "text": {"en": "Help the lost fairy", [language]: "Help the lost fairy"},
            "nextNodeId": "help_fairy",
            "emoji": "🧚"
          },
          {
            "text": {"en": "Continue deeper into the forest", [language]: "Continue deeper into the forest"},
            "nextNodeId": "deeper_forest",
            "emoji": "🌲"
          }
        ],
        "isEnding": false
      },
      {
        "id": "animal_friends",
        "text": {"en": "The animals show you a hidden treasure of magic berries that grant wishes!", [language]: "The animals show you a hidden treasure of magic berries that grant wishes!"},
        "imageUrl": "animals gathered around magical glowing berries",
        "choices": [],
        "isEnding": true
      },
      {
        "id": "explore_meadow",
        "text": {"en": "You discover an ancient map leading to the heart of the forest where dreams come true.", [language]: "You discover an ancient map leading to the heart of the forest where dreams come true."},
        "imageUrl": "ancient magical map in a meadow",
        "choices": [],
        "isEnding": true
      },
      {
        "id": "help_fairy",
        "text": {"en": "The grateful fairy grants you the ability to speak with all forest creatures. You become a legend among the forest dwellers.", [language]: "The grateful fairy grants you the ability to speak with all forest creatures. You become a legend among the forest dwellers."},
        "imageUrl": "child with glowing aura surrounded by forest creatures",
        "choices": [],
        "isEnding": true
      },
      {
        "id": "deeper_forest",
        "text": {"en": "You find a magical tree house where forest protectors gather. They invite you to join their adventures.", [language]: "You find a magical tree house where forest protectors gather. They invite you to join their adventures."},
        "imageUrl": "elaborate tree house with magical lights and forest protectors",
        "choices": [],
        "isEnding": true
      }
    ],
    "thumbnailUrl": `https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400`
  };
}
