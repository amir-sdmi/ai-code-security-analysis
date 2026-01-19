// Script to translate the remaining untranslated text to Thai using ChatGPT API
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// API key will be set from environment variable or command line argument
const apiKey = process.env.OPENAI_API_KEY || process.argv[2];

if (!apiKey) {
  console.error('Error: OpenAI API key is required. Please provide it as an environment variable or as the first argument.');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey
});

// File paths
const textsToTranslatePath = path.join(__dirname, 'texts_to_translate.json');
const translationsPath = path.join(__dirname, 'translations.json');
const completeTranslationsPath = path.join(__dirname, 'complete_translations.json');

// Read the files
const textsToTranslate = JSON.parse(fs.readFileSync(textsToTranslatePath, 'utf8'));
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Ensure slides object exists in translations
if (!translations.slides) {
  translations.slides = {};
}

// Process each slide
async function translateAllSlides() {
  for (const slideId in textsToTranslate) {
    // Ensure slide object exists
    if (!translations.slides[slideId]) {
      translations.slides[slideId] = {};
    }
    
    const slideContent = textsToTranslate[slideId];
    const textEntries = Object.entries(slideContent);
    
    // Skip if no texts to translate
    if (textEntries.length === 0) continue;
    
    console.log(`Processing slide ${slideId}...`);
    
    // Build context for better translation
    const context = `
You are translating text for a cryptocurrency and financial platform called MobiCryp.
The text is from a presentation slide (Slide ${slideId}).
Please translate the following English text to Thai. Maintain the formal tone and technical accuracy.
For cryptocurrency terms, use transliteration when appropriate.
`;
    
    // Process in batches to avoid exceeding token limits
    const batchSize = 5;
    for (let i = 0; i < textEntries.length; i += batchSize) {
      const batch = textEntries.slice(i, i + batchSize);
      
      // Create prompt for this batch
      const prompt = batch.map(([text, _]) => text).join('\n\n');
      
      try {
        // Call ChatGPT API
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: context },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
        });
        
        // Get the response
        const response = completion.choices[0].message.content;
        
        // Split the response into separate translations
        const translationLines = response.split('\n\n');
        
        // Update translations for each item in the batch
        for (let j = 0; j < Math.min(batch.length, translationLines.length); j++) {
          const [text, _] = batch[j];
          let translation = translationLines[j];
          
          // Clean up the translation (remove any "Thai: " prefixes etc.)
          translation = translation.replace(/^(Thai|Translation): /, '');
          
          // Update the translations object
          translations.slides[slideId][text] = translation;
          
          // Also update the original object for tracking
          textsToTranslate[slideId][text] = translation;
        }
        
        console.log(`Translated ${batch.length} items from slide ${slideId}`);
        
        // Save after each batch for safety
        fs.writeFileSync(completeTranslationsPath, JSON.stringify(translations, null, 2), 'utf8');
        fs.writeFileSync(textsToTranslatePath, JSON.stringify(textsToTranslate, null, 2), 'utf8');
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error translating batch for slide ${slideId}:`, error);
      }
    }
  }
  
  console.log('Translation complete! Results saved to complete_translations.json');
}

// Run the translation process
translateAllSlides().catch(error => {
  console.error('Error in translation process:', error);
  process.exit(1);
});