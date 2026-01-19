// src/services/nlp.js
const { generateResponse, getJsonResponse } = require('./gemini');
const gitaApiService = require('./gita-api');
const { DEBUG, TEST_MODE } = require('../config/config');

/**
 * Use Gemini to identify themes and relevant verses for a user query
 * @param {string} query - User's question or concern
 * @returns {Promise<Object>} - Object containing themes and verse references
 */
/**
 * Use Gemini to identify themes and relevant verses for a user query
 * @param {string} query - User's question or concern
 * @returns {Promise<Object>} - Object containing themes and verse references
 */
async function analyzeQueryWithGemini(query) {
  console.log(`Analyzing query with Gemini: "${query}"`);
  
  const prompt = `
You are an expert on the Bhagavad Gita and helping people apply its wisdom to modern problems.

USER QUERY: "${query}"

Based on this query, identify the most relevant wisdom from the Bhagavad Gita.

INSTRUCTIONS:
1. Identify 1-3 primary themes from the Bhagavad Gita that relate to this query.
   Choose from: anxiety, anger, attachment, duty, peace, relationships, knowledge, action, devotion, meditation, self_realization, suffering, renunciation.

2. Select 2-3 specific verses from the Bhagavad Gita that directly address this query.
   - Format each verse reference as "chapter.verse" (e.g., "2.47")
   - IMPORTANT: Choose verses from throughout the Gita, not just the most famous ones
   - DO NOT default to verse 2.47 unless it is specifically relevant to this query
   - Select verses from different chapters if possible to provide varied perspectives

3. Provide a brief reasoning for why these themes and verses are relevant to the query.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (JSON format):
{
  "themes": ["primary_theme", "secondary_theme"],
  "verses": ["chapter.verse", "chapter.verse"],
  "reasoning": "Brief explanation of why these themes and verses are relevant"
}

You must return valid JSON only. Do not include any text before or after the JSON.
`;

  try {
    const response = await generateResponse(prompt);
    console.log("Raw Gemini response received");
    
    // Try to parse the entire response as JSON first
    try {
      const parsedResponse = JSON.parse(response.trim());
      console.log("Successfully parsed entire response as JSON");
      
      // Validate the response structure
      if (!parsedResponse.themes || !Array.isArray(parsedResponse.themes) || 
          !parsedResponse.verses || !Array.isArray(parsedResponse.verses)) {
        console.error("Response doesn't have required fields");
        throw new Error("Invalid response structure");
      }
      
      // Convert themes to the format expected by the rest of your code
      const themeObjects = parsedResponse.themes.map(theme => ({
        theme,
        score: 1 // Giving all themes from Gemini the same score
      }));
      
      return {
        themes: themeObjects,
        verses: parsedResponse.verses,
        reasoning: parsedResponse.reasoning || "This recommendation was selected based on the themes and context of your query."
      };
    } catch (directParseError) {
      console.log("Direct JSON parsing failed, trying regex extraction");
      
      // Extract JSON from response using regex
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed JSON using regex extraction");
          
          // Validate the response structure
          if (!parsedResponse.themes || !Array.isArray(parsedResponse.themes) || 
              !parsedResponse.verses || !Array.isArray(parsedResponse.verses)) {
            console.error("Extracted JSON doesn't have required fields");
            throw new Error("Invalid response structure in extracted JSON");
          }
          
          // Convert themes to the format expected by the rest of your code
          const themeObjects = parsedResponse.themes.map(theme => ({
            theme,
            score: 1 // Giving all themes from Gemini the same score
          }));
          
          return {
            themes: themeObjects,
            verses: parsedResponse.verses,
            reasoning: parsedResponse.reasoning || "This recommendation was selected based on the themes and context of your query."
          };
        } catch (parseError) {
          console.error("Error parsing JSON from Gemini response:", parseError.message);
          throw new Error("Invalid JSON format in Gemini response");
        }
      } else {
        console.error("Could not extract JSON using regex");
        throw new Error("Could not extract JSON from Gemini response");
      }
    }
  } catch (error) {
    console.error("Error analyzing query with Gemini:", error.message);
    
    // Create a more varied fallback based on the query content
    const queryLower = query.toLowerCase();
    
    // Map keywords to different fallback verses
    let fallbackVerses = ['2.47', '2.48']; // Default
    
    if (queryLower.includes('angry') || queryLower.includes('anger') || queryLower.includes('mad') || queryLower.includes('upset')) {
      fallbackVerses = ['2.62', '2.63']; // Verses about anger
    } 
    else if (queryLower.includes('fear') || queryLower.includes('anxiety') || queryLower.includes('worry') || queryLower.includes('stress')) {
      fallbackVerses = ['2.14', '2.56']; // Verses about overcoming fear
    }
    else if (queryLower.includes('peace') || queryLower.includes('calm') || queryLower.includes('happiness')) {
      fallbackVerses = ['2.66', '2.71']; // Verses about finding peace
    }
    else if (queryLower.includes('relationship') || queryLower.includes('friend') || queryLower.includes('family')) {
      fallbackVerses = ['6.5', '6.6']; // Verses about relationships
    }
    else if (queryLower.includes('work') || queryLower.includes('job') || queryLower.includes('duty')) {
      fallbackVerses = ['3.35', '18.47']; // Verses about duty and work
    }
    else {
      // Use a simple hash of the query to select from different default options
      const hashCode = query.split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
      
      const fallbackOptions = [
        ['2.47', '2.48'], // Action without attachment
        ['6.5', '6.6'],   // Mind as friend or enemy
        ['2.14', '5.22'], // Transient nature of pleasure and pain
        ['9.26', '12.13'], // Devotion and qualities of devotees
        ['3.35', '18.47']  // Following one's own duty
      ];
      
      fallbackVerses = fallbackOptions[hashCode];
    }
    
    // Determine themes based on the fallback verses
    let themes = [
      { theme: "self_realization", score: 1 },
      { theme: "action", score: 1 }
    ];
    
    if (fallbackVerses[0] === '2.62' || fallbackVerses[0] === '2.63') {
      themes = [{ theme: "anger", score: 1 }, { theme: "peace", score: 1 }];
    } 
    else if (fallbackVerses[0] === '2.14' || fallbackVerses[0] === '2.56') {
      themes = [{ theme: "anxiety", score: 1 }, { theme: "peace", score: 1 }];
    }
    else if (fallbackVerses[0] === '2.66' || fallbackVerses[0] === '2.71') {
      themes = [{ theme: "peace", score: 1 }, { theme: "meditation", score: 1 }];
    }
    else if (fallbackVerses[0] === '6.5' || fallbackVerses[0] === '6.6') {
      themes = [{ theme: "relationships", score: 1 }, { theme: "self_realization", score: 1 }];
    }
    else if (fallbackVerses[0] === '3.35' || fallbackVerses[0] === '18.47') {
      themes = [{ theme: "duty", score: 1 }, { theme: "action", score: 1 }];
    }
    
    console.log(`Using fallback verses ${fallbackVerses.join(', ')} for query: "${query}"`);
    
    return {
      themes: themes,
      verses: fallbackVerses,
      reasoning: `Based on your query, these verses from the Bhagavad Gita offer relevant wisdom that may help with your situation.`
    };
  }
}

/**
 * Generate a fallback analysis based on query content
 * @param {string} query - User's question
 * @param {string} requestId - Request identifier for logging
 * @returns {Object} - Fallback analysis
 */
function getIntelligentFallback(query, requestId) {
  if (DEBUG) {
    console.log(`[${requestId}] Using intelligent fallback for query: "${query}"`);
  }
  
  const queryLower = query.toLowerCase();
  let themes = [];
  let verses = [];
  
  // Approach: Map keywords to themes and verses
  const keywordMap = [
    {
      keywords: ['anger', 'angry', 'upset', 'rage', 'mad', 'furious', 'irritated'],
      theme: 'anger',
      verses: ['2.62', '2.63', '16.21']
    },
    {
      keywords: ['anxiety', 'worry', 'stress', 'fear', 'nervous', 'tension', 'afraid'],
      theme: 'anxiety',
      verses: ['2.14', '2.56', '18.58']
    },
    {
      keywords: ['attachment', 'desire', 'want', 'need', 'crave', 'possess', 'mine'],
      theme: 'attachment',
      verses: ['2.71', '15.3', '15.5']
    },
    {
      keywords: ['duty', 'responsibility', 'obligation', 'work', 'job', 'role', 'task'],
      theme: 'duty',
      verses: ['3.35', '18.47', '18.48']
    },
    {
      keywords: ['peace', 'calm', 'tranquil', 'quiet', 'serene', 'relaxed', 'harmony'],
      theme: 'peace',
      verses: ['2.66', '5.29', '6.7']
    },
    {
      keywords: ['relationship', 'friend', 'family', 'partner', 'spouse', 'colleague', 'love'],
      theme: 'relationships',
      verses: ['6.5', '6.6', '12.13']
    },
    {
      keywords: ['knowledge', 'wisdom', 'understanding', 'learn', 'insight', 'clarity', 'truth'],
      theme: 'knowledge',
      verses: ['4.33', '4.38', '13.8']
    },
    {
      keywords: ['action', 'doing', 'effort', 'activity', 'perform', 'accomplish', 'achieve'],
      theme: 'action',
      verses: ['2.47', '2.48', '3.19']
    },
    {
      keywords: ['devotion', 'faith', 'belief', 'trust', 'surrender', 'dedicated', 'spiritual'],
      theme: 'devotion',
      verses: ['9.26', '9.34', '12.2']
    },
    {
      keywords: ['meditation', 'focus', 'concentrate', 'mindful', 'attention', 'aware', 'present'],
      theme: 'meditation',
      verses: ['6.10', '6.11', '6.25']
    },
    {
      keywords: ['self', 'identity', 'purpose', 'meaning', 'who am i', 'soul', 'true nature'],
      theme: 'self_realization',
      verses: ['2.20', '2.22', '13.12']
    },
    {
      keywords: ['suffering', 'pain', 'sorrow', 'grief', 'distress', 'misery', 'hurt'],
      theme: 'suffering',
      verses: ['2.14', '5.22', '12.13']
    },
    {
      keywords: ['renunciation', 'let go', 'release', 'detach', 'abandon', 'give up', 'surrender'],
      theme: 'renunciation',
      verses: ['5.10', '18.9', '18.10']
    }
  ];
  
  // Score each theme based on keyword matches
  const themeScores = keywordMap.map(mapping => {
    let score = 0;
    for (const keyword of mapping.keywords) {
      if (queryLower.includes(keyword)) {
        score += 1;
      }
    }
    return {
      theme: mapping.theme,
      score,
      verses: mapping.verses
    };
  });
  
  // Sort by score descending and take top themes
  const sortedThemes = themeScores
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);
  
  if (sortedThemes.length > 0) {
    // Use the themes and verses from keyword matching
    themes = sortedThemes.slice(0, 2).map(t => ({ theme: t.theme, score: t.score }));
    
    // Get verses from the top themes
    const verseSet = new Set();
    for (const theme of sortedThemes.slice(0, 2)) {
      for (const verse of theme.verses) {
        verseSet.add(verse);
        if (verseSet.size >= 3) break; // Collect up to 3 verses
      }
      if (verseSet.size >= 3) break;
    }
    verses = Array.from(verseSet);
  } else {
    // If no keywords matched, use general wisdom verses
    themes = [
      { theme: "self_realization", score: 1 },
      { theme: "action", score: 1 }
    ];
    
    // Use a mix of important verses, NOT just 2.47
    verses = ['2.47', '6.5', '13.8'];
  }
  
  // Ensure we don't always default to the same fallback
  // Use simple hash of query to rotate options
  if (TEST_MODE || themes.length === 0) {
    const hashCode = query.split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
    
    const fallbackOptions = [
      { themes: [{ theme: 'action', score: 1 }, { theme: 'duty', score: 1 }], 
        verses: ['3.19', '18.47', '2.47'] },
      { themes: [{ theme: 'anxiety', score: 1 }, { theme: 'peace', score: 1 }], 
        verses: ['2.14', '2.56', '5.29'] },
      { themes: [{ theme: 'attachment', score: 1 }, { theme: 'renunciation', score: 1 }], 
        verses: ['2.71', '15.3', '18.9'] },
      { themes: [{ theme: 'self_realization', score: 1 }, { theme: 'knowledge', score: 1 }], 
        verses: ['13.8', '4.38', '2.22'] },
      { themes: [{ theme: 'relationships', score: 1 }, { theme: 'peace', score: 1 }], 
        verses: ['6.5', '6.6', '12.13'] }
    ];
    
    const fallback = fallbackOptions[hashCode];
    themes = fallback.themes;
    verses = fallback.verses;
  }
  
  return {
    themes,
    verses,
    reasoning: `Based on keyword analysis of your query, these themes and verses may provide helpful wisdom for your situation.`
  };
}
/**
 * Generate a custom prompt for Gemini to explain verse relevance
 * @param {string} query - User's question
 * @param {Array<Object>} themes - Identified themes
 * @param {Object} verse - Verse object with text and meaning
 * @returns {string} - Custom prompt for Gemini
 */
function generateCustomPrompt(query, themes, verse) {
  return `
You are an expert on the Bhagavad Gita who helps people apply its ancient wisdom to modern problems.

USER QUERY: "${query}"

IDENTIFIED THEMES: ${themes.map(t => t.theme).join(', ')}

VERSE ${verse.verseKey}: "${verse.text}"

TRADITIONAL MEANING: ${verse.meaning || "This verse from the Bhagavad Gita conveys wisdom about living with purpose and awareness."}

CONTEXT: ${verse.context || `This verse appears in chapter ${verse.chapter} of the Bhagavad Gita.`}

Explain how this verse relates to the user's query in a helpful and compassionate way. 
Provide practical guidance based on this wisdom that the person can apply to their situation.
Your explanation should be 4-6 sentences long, warm in tone, and accessible to someone not familiar with the Bhagavad Gita.
`;
}

/**
 * Generate a basic explanation if Gemini fails
 * @param {Array<Object>} themes - Identified themes
 * @param {Object} verse - Verse object
 * @param {string} query - User's question
 * @returns {string} - Basic explanation
 */
function generateBasicExplanation(themes, verse, query) {
  const themeNames = themes.map(t => t.theme).join(', ');
  
  return `
This verse addresses the themes of ${themeNames}, which relate to your question. 
The wisdom here suggests that ${verse.meaning || "we should act with awareness and without attachment to results"}.
This teaching from the Bhagavad Gita reminds us that even in challenging situations, we can find peace by focusing on our actions rather than outcomes.
You might apply this wisdom to your situation by approaching it with greater equanimity and focusing on what you can control.
  `.trim();
}

/**
 * Get relevant verses based on identified themes (fallback method)
 * @param {Array<Object>} themes - Array of theme objects
 * @param {number} limit - Maximum number of verses to return
 * @returns {Promise<Array<Object>>} - Array of relevant verses
 */
async function getRelevantVerses(themes, limit = 2) {
  if (!themes || themes.length === 0) {
    // Default to some generally applicable verses
    return fetchVersesByRefs(['2.47', '6.5']);
  }
  
  // Map of theme to relevant verses
  const themeVerseMap = {
    anxiety: ['2.14', '2.56', '5.28', '6.27', '18.58'],
    anger: ['2.62', '2.63', '5.26', '16.18', '16.21'],
    attachment: ['2.47', '2.62', '3.19', '7.11', '15.3', '15.5'],
    duty: ['2.31', '2.33', '3.8', '3.35', '18.47', '18.48'],
    peace: ['2.66', '2.71', '5.29', '6.7', '12.12'],
    relationships: ['6.5', '6.6', '12.13', '12.18', '17.20'],
    knowledge: ['2.16', '4.33', '4.38', '4.39', '13.8', '13.9'],
    action: ['2.47', '2.48', '3.8', '3.19', '4.18', '4.20'],
    devotion: ['7.21', '8.22', '9.26', '9.34', '12.2', '18.55'],
    meditation: ['6.10', '6.11', '6.12', '6.13', '6.25', '8.12'],
    self_realization: ['2.16', '2.20', '2.22', '13.12', '14.19', '15.7'],
    suffering: ['2.14', '2.38', '5.22', '5.23', '12.13', '12.14'],
    renunciation: ['5.10', '5.12', '12.16', '18.2', '18.9', '18.10']
  };
  
  // Collect verses from all identified themes
  const verseRefs = new Set();
  for (const { theme } of themes) {
    if (themeVerseMap[theme]) {
      for (const verse of themeVerseMap[theme]) {
        verseRefs.add(verse);
        if (verseRefs.size >= limit) break;
      }
    }
    if (verseRefs.size >= limit) break;
  }
  
  // If we didn't get enough verses, add some generally applicable ones
  if (verseRefs.size < limit) {
    for (const verse of ['2.47', '6.5', '13.8']) {
      verseRefs.add(verse);
      if (verseRefs.size >= limit) break;
    }
  }
  
  // Fetch the verses
  return fetchVersesByRefs(Array.from(verseRefs));
}
async function handleUserQueryWithGemini(query) {
  console.log(`Processing user query: "${query}"`);
  
  try {
    // Step 1: Analyze the query with Gemini
    const analysis = await analyzeQueryWithGemini(query);
    const { themes, verses, reasoning } = analysis;
    
    console.log(`Analysis results - Themes: ${themes.map(t => t.theme).join(', ')}, Verses: ${verses.join(', ')}`);
    
    // Step 2: Fetch the recommended verses
    let relevantVerses = [];
    if (verses && verses.length > 0) {
      console.log(`Fetching specific verses: ${verses.join(', ')}`);
      relevantVerses = await fetchVersesByRefs(verses);
    } else {
      console.log(`No specific verses provided, using fallback method`);
      // Fallback to our existing method if Gemini doesn't provide verses
      relevantVerses = await getRelevantVerses(themes, 2);
    }
    
    if (!relevantVerses || relevantVerses.length === 0) {
      console.error("No relevant verses found");
      throw new Error("No relevant verses found");
    }
    
    console.log(`Found ${relevantVerses.length} relevant verses, first one is ${relevantVerses[0].verseKey}`);
    
    // Use the first (most relevant) verse
    const verse = relevantVerses[0];
    
    // More comprehensive verse context
    const verseContext = {
      '2.14': 'Krishna teaches Arjuna about the transient nature of pleasure and pain',
      '2.47': 'Krishna teaches Arjuna about performing actions without attachment to results',
      '2.48': 'Krishna explains the importance of equanimity in success and failure',
      '2.56': 'Krishna describes the qualities of one with steady wisdom who is undisturbed by emotions',
      '2.62': 'Krishna explains how attachment leads to desire and anger',
      '2.63': 'Krishna describes how anger leads to delusion and spiritual downfall',
      '2.66': 'Krishna explains that without spiritual consciousness, there can be no peace',
      '2.71': 'Krishna describes the state of one who has abandoned all desires',
      '3.19': 'Krishna encourages performing prescribed duties without attachment',
      '3.35': 'Krishna advises that it is better to perform one\'s own duty imperfectly than someone else\'s duty perfectly',
      '5.22': 'Krishna explains how the wise find joy within themselves rather than in external pleasures',
      '6.5': 'Krishna explains that one must elevate oneself by one\'s own mind, not degrade oneself',
      '6.6': 'Krishna states that the mind can be either friend or enemy depending on whether it is conquered',
      '9.26': 'Krishna promises to accept even the smallest offering when given with devotion',
      '12.13': 'Krishna describes one who is dear to him as free from hatred and friendly to all beings',
      '16.21': 'Krishna identifies three gates of hell—lust, anger, and greed—that destroy the soul',
      '18.47': 'Krishna states it is better to perform one\'s own duty imperfectly than another\'s perfectly',
      '18.58': 'Krishna promises that by becoming conscious of him, one will overcome all obstacles'
    };
    
    if (!verse.context) {
      verse.context = verseContext[verse.verseKey] || 
                     `Verse from Bhagavad Gita chapter ${verse.chapter}`;
    }
    
    // Generate custom prompt for explanation
    const customPrompt = generateCustomPrompt(query, themes, verse);
    
    // Get explanation from Gemini
    let explanation = "";
    try {
      console.log("Generating verse explanation");
      explanation = await generateResponse(customPrompt);
      console.log(`Generated explanation: ${explanation.substring(0, 100)}...`);
    } catch (error) {
      console.log("Gemini explanation generation failed, using basic explanation:", error.message);
      explanation = generateBasicExplanation(themes, verse, query);
    }
    
    // Include secondary verse in response if available
    const secondaryVerse = relevantVerses.length > 1 ? relevantVerses[1] : null;
    const secondaryVerseInfo = secondaryVerse ? {
      verseKey: secondaryVerse.verseKey,
      text: secondaryVerse.text,
      meaning: secondaryVerse.meaning || ""
    } : null;
    
    // Format the final response
    return {
      chapter: verse.chapter,
      verse: verse.verse,
      verseKey: verse.verseKey,
      text: verse.text,
      meaning: verse.meaning || "",
      context: verse.context,
      explanation: explanation,
      themes: themes.map(t => t.theme),
      modelExplanation: reasoning || `This recommendation was based on analyzing your query and identifying themes related to ${themes.map(t => t.theme).join(', ')}.`,
      secondaryVerse: secondaryVerseInfo
    };
  } catch (error) {
    console.error("Error handling user query with Gemini:", error.message);
    
    // Use a variety of fallback verses based on a simple hash of the query
    // This ensures different queries get different fallback verses
    const queryHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
    
    const fallbackVerses = [
      {
        chapter: 2,
        verse: 47,
        verseKey: "2.47",
        text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.",
        meaning: "Focus on doing your duty without attachment to results. This is the essence of karma yoga - selfless action.",
        context: "Krishna teaches Arjuna about performing actions without attachment to results",
        themes: ["action", "duty"],
      },
      {
        chapter: 6,
        verse: 5,
        verseKey: "6.5",
        text: "One must deliver himself with the help of his mind, and not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.",
        meaning: "Your mind can be either your best friend or your worst enemy. It's up to you to use it for your elevation rather than degradation.",
        context: "Krishna explains the importance of controlling one's mind",
        themes: ["self_realization", "meditation"],
      },
      {
        chapter: 2,
        verse: 14,
        verseKey: "2.14",
        text: "O son of Kunti, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. They arise from sense perception, O scion of Bharata, and one must learn to tolerate them without being disturbed.",
        meaning: "The temporary experiences of pleasure and pain are like changing seasons. One should learn to tolerate them with equanimity.",
        context: "Krishna teaches Arjuna about the transient nature of pleasure and pain",
        themes: ["suffering", "peace"],
      },
      {
        chapter: 3,
        verse: 35,
        verseKey: "3.35",
        text: "It is far better to perform one's natural prescribed duty, though tinged with faults, than to perform another's prescribed duty, though perfectly. In fact, it is preferable to die in the discharge of one's duty, than to follow the path of another, which is fraught with danger.",
        meaning: "It's better to perform your own duty imperfectly than someone else's duty perfectly. Following your natural calling, even with difficulties, is safer than imitating others.",
        context: "Krishna advises Arjuna on the importance of following one's own nature",
        themes: ["duty", "action"],
      },
      {
        chapter: 12,
        verse: 13,
        verseKey: "12.13",
        text: "One who is not envious but is a kind friend to all living entities, who does not think himself a proprietor and is free from false ego, who is equal in both happiness and distress, who is tolerant, always satisfied, self-controlled, and engaged in devotional service with determination, his mind and intelligence fixed on Me—such a devotee of Mine is very dear to Me.",
        meaning: "One who is free from envy, friendly to all beings, without a sense of possessiveness, and equal in happiness and distress is dear to Krishna.",
        context: "Krishna describes the qualities of his dear devotees",
        themes: ["devotion", "peace"],
      }
    ];
    
    const fallbackVerse = fallbackVerses[queryHash];
    
    // Generate a simple explanation based on the query
    const fallbackExplanation = `This verse from the Bhagavad Gita offers guidance for your situation. ${fallbackVerse.meaning} This wisdom can help you navigate your current challenge with greater clarity and peace.`;
    
    return {
      ...fallbackVerse,
      explanation: fallbackExplanation,
      modelExplanation: "This verse was selected based on general wisdom from the Bhagavad Gita that can be applied to your situation."
    };
  }
}
/**
 * Format the final response for the API
 * @param {string} query - User's query
 * @param {Array<Object>} themes - Identified themes
 * @param {string} reasoning - Reasoning for recommendations
 * @param {Object} verse - Primary verse object
 * @param {Array<Object>} allVerses - All relevant verses
 * @param {string} explanation - Generated explanation
 * @param {string} requestId - Request identifier for logging
 * @returns {Object} - Formatted response
 */
function formatResponse(query, themes, reasoning, verse, allVerses, explanation, requestId) {
  // Include secondary verse in response if available
  const secondaryVerses = allVerses.length > 1 ? 
    allVerses.slice(1).map(v => ({
      verseKey: v.verseKey,
      text: v.text,
      meaning: v.meaning || ""
    })) : [];
  
  if (DEBUG) {
    console.log(`[${requestId}] Formatting final response with primary verse ${verse.verseKey} and ${secondaryVerses.length} secondary verses`);
  }
  
  return {
    chapter: verse.chapter,
    verse: verse.verse,
    verseKey: verse.verseKey,
    text: verse.text,
    meaning: verse.meaning || "",
    context: verse.context,
    explanation: explanation,
    themes: themes.map(t => t.theme),
    modelExplanation: reasoning || `This recommendation was based on analyzing your query and identifying themes related to ${themes.map(t => t.theme).join(', ')}.`,
    secondaryVerses: secondaryVerses,
    query: query
  };
}

/**
 * Handle fallback response when main process fails
 * @param {string} query - User's query
 * @param {string} requestId - Request identifier for logging
 * @returns {Object} - Fallback response
 */
async function handleFallbackResponse(query, requestId) {
  if (DEBUG) {
    console.log(`[${requestId}] Generating fallback response for query: "${query}"`);
  }
  
  // Generate a hash of the query to select different fallback verses
  const hashCode = query.split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  
  // Array of fallback verses to ensure variety
  const fallbackRefs = [
    ['2.47', '2.48', '3.19'],
    ['6.5', '6.6', '6.7'],
    ['2.14', '2.20', '5.22'],
    ['9.26', '12.13', '18.58'],
    ['3.35', '18.47', '13.8']
  ][hashCode];
  
  try {
    // Fetch the fallback verses
    const verses = await gitaApiService.fetchVersesByRefs(fallbackRefs);
    
    if (!verses || verses.length === 0) {
      throw new Error('No fallback verses found');
    }
    
    // Select primary verse
    const verse = verses[0];
    
    // Generate simple themes based on the verse
    const themeMap = {
      '2.47': ['action', 'duty'],
      '6.5': ['self_realization', 'meditation'],
      '2.14': ['suffering', 'peace'],
      '9.26': ['devotion', 'relationships'],
      '3.35': ['duty', 'action']
    };
    
    const themes = (themeMap[verse.verseKey] || ['self_realization', 'knowledge'])
      .map(theme => ({ theme, score: 1 }));
    
    // Generate a basic explanation
    const explanation = `This verse from the Bhagavad Gita offers wisdom for your situation. ${verse.meaning || "It teaches us to act with awareness and detachment."} You might find that by applying this principle - focusing on your efforts rather than outcomes - you can navigate your current challenges with greater peace and clarity. The ancient wisdom of the Gita reminds us that even in difficult times, we can find purpose and meaning by aligning our actions with higher values.`;
    
    // Format and return the response
    return formatResponse(
      query, 
      themes, 
      "Fallback analysis due to processing limitations. These verses contain general wisdom from the Bhagavad Gita.", 
      verse, 
      verses, 
      explanation, 
      requestId
    );
  } catch (error) {
    console.error(`[${requestId}] Error in fallback response:`, error);
    
    // Ultimate hardcoded fallback if everything else fails
    return {
      chapter: 2,
      verse: 47,
      verseKey: "2.47",
      text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.",
      meaning: "Focus on doing your duty without attachment to results. This is the essence of karma yoga - selfless action.",
      context: "Krishna teaches Arjuna about performing actions without attachment to results.",
      explanation: "This timeless wisdom from the Bhagavad Gita reminds us to focus on what we can control - our efforts and intentions - rather than outcomes which are ultimately beyond our control. By applying this teaching to your situation, you might find greater peace by letting go of attachment to specific results while still giving your best effort. This approach helps reduce anxiety and brings clarity of purpose to our actions.",
      themes: ["action", "duty"],
      modelExplanation: "Final fallback response due to service limitations. This verse contains universal wisdom from the Bhagavad Gita.",
      secondaryVerses: [],
      query: query
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @param {string} query - User's question or concern
 * @returns {Promise<Object>} - Promise resolving to response object
 */
async function handleUserQuery(query) {
  // Simply call the Gemini-powered function
  return handleUserQueryWithGemini(query);
}

// Export functions
module.exports = {
  analyzeQueryWithGemini,
  handleUserQueryWithGemini,
  handleUserQuery,
  getRelevantVerses
};