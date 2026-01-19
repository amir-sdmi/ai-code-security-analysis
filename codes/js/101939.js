const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/chat.model');
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Update to use gemini-1.5-flash for faster responses
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Supported indigenous languages and their codes
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese',
  'sa': 'Sanskrit',
  'sd': 'Sindhi',
  'ne': 'Nepali'
};

// Language-specific greetings and responses
const LANGUAGE_RESPONSES = {
  'en': {
    greeting: 'Hello! I am your health assistant.',
    disclaimer: 'I am an AI assistant, not a substitute for a doctor.',
    serious: 'Please contact a doctor immediately.'
  },
  'hi': {
    greeting: 'नमस्ते! मैं आपकी स्वास्थ्य सहायक हूं।',
    disclaimer: 'मैं एक AI सहायक हूं, डॉक्टर का विकल्प नहीं।',
    serious: 'कृपया तुरंत डॉक्टर से संपर्क करें।'
  },
  'bn': {
    greeting: 'নমস্কার! আমি আপনার স্বাস্থ্য সহায়ক।',
    disclaimer: 'আমি একজন AI সহায়ক, ডাক্তারের বিকল্প নই।',
    serious: 'অনুগ্রহ করে অবিলম্বে ডাক্তারের সাথে যোগাযোগ করুন।'
  },
  'ta': {
    greeting: 'வணக்கம்! நான் உங்கள் சுகாதார உதவியாளர்.',
    disclaimer: 'நான் ஒரு AI உதவியாளர், மருத்துவருக்கு மாற்று அல்ல.',
    serious: 'உடனடியாக மருத்துவரை அணுகவும்.'
  },
  'te': {
    greeting: 'నమస్కారం! నేను మీ ఆరోగ్య సహాయకుడిని.',
    disclaimer: 'నేను AI సహాయకుడిని, వైద్యునికి ప్రత్యామ్నాయం కాదు.',
    serious: 'దయచేసి వెంటనే వైద్యుడిని సంప్రదించండి.'
  },
  'mr': {
    greeting: 'नमस्कार! मी तुमचा आरोग्य सहाय्यक आहे.',
    disclaimer: 'मी एक AI सहाय्यक आहे, डॉक्टरांचा पर्याय नाही.',
    serious: 'कृपया लगेच डॉक्टरांशी संपर्क साधा.'
  },
  'gu': {
    greeting: 'નમસ્તે! હું તમારો આરોગ્ય સહાયક છું.',
    disclaimer: 'હું એક AI સહાયક છું, ડૉક્ટરનો વિકલ્પ નથી.',
    serious: 'કૃપા કરી તરત જ ડૉક્ટરનો સંપર્ક કરો.'
  },
  'kn': {
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ.',
    disclaimer: 'ನಾನು AI ಸಹಾಯಕ, ವೈದ್ಯರಿಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
    serious: 'ದಯವಿಟ್ಟು ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
  },
  'ml': {
    greeting: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ആരോഗ്യ സഹായിയാണ്.',
    disclaimer: 'ഞാൻ ഒരു AI സഹായിയാണ്, ഡോക്ടറുടെ പകരമല്ല.',
    serious: 'ദയവായി ഉടനെ ഡോക്ടറെ സമീപിക്കുക.'
  },
  'pa': {
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਸਿਹਤ ਸਹਾਇਕ ਹਾਂ।',
    disclaimer: 'ਮੈਂ ਇੱਕ AI ਸਹਾਇਕ ਹਾਂ, ਡਾਕਟਰ ਦਾ ਵਿਕਲਪ ਨਹੀਂ।',
    serious: 'ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਡਾਕਟਰ ਨੂੰ ਸੰਪਰਕ ਕਰੋ।'
  },
  'or': {
    greeting: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ।',
    disclaimer: 'ମୁଁ ଜଣେ AI ସହାୟକ, ଡାକ୍ତର ନୁହେଁ।',
    serious: 'ଦୟାକରି ତୁରନ୍ତ ଡାକ୍ତରଙ୍କୁ ସମ୍ପର୍କ କରନ୍ତୁ।'
  },
  'as': {
    greeting: 'নমস্কাৰ! মই আপোনাৰ স্বাস্থ্য সহায়ক।',
    disclaimer: 'মই এজন AI সহায়ক, ডাক্তৰৰ বিকল্প নহয়।',
    serious: 'অনুগ্ৰহ কৰি তৎক্ষণাত ডাক্তৰৰ ওচৰলৈ যাওক।'
  },
  'sa': {
    greeting: 'नमस्ते! अहं भवतः स्वास्थ्यसहायकः अस्मि।',
    disclaimer: 'अहं AI सहायकः अस्मि, वैद्यस्य विकल्पः न।',
    serious: 'कृपया तत्कालं वैद्यं सम्पर्कयतु।'
  },
  'sd': {
    greeting: 'سلام! مان توهان جو صحت سهايڪ آهيان.',
    disclaimer: 'مان هڪ AI سهايڪ آهيان، ڊاڪٽر جو متبادل نه آهيان.',
    serious: 'مهرباني ڪري فوري طور تي ڊاڪٽر سان رابطو ڪريو.'
  },
  'ne': {
    greeting: 'नमस्ते! म तपाईंको स्वास्थ्य सहायक हुँ।',
    disclaimer: 'म एउटा AI सहायक हुँ, डाक्टरको विकल्प होइन।',
    serious: 'कृपया तुरुन्तै डाक्टरलाई सम्पर्क गर्नुहोस्।'
  }
};

const RATE_LIMIT = {
  requestsPerMinute: 30,
  retryDelay: 10000,
  maxRetries: 3
};

const rateLimiter = {
  requests: [],
  addRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < 60000);
    this.requests.push(now);
    return this.requests.length <= RATE_LIMIT.requestsPerMinute;
  }
};


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getSystemPrompt = (language = 'en') => {
  const langResponses = LANGUAGE_RESPONSES[language] || LANGUAGE_RESPONSES['en'];
  return `You are a healthcare assistant chatbot supporting multiple indigenous languages. 
Current language: ${SUPPORTED_LANGUAGES[language] || 'English'}

${langResponses.disclaimer}

Provide concise, accurate health information and guidance. Always:
1. Recommend consulting doctors for proper diagnosis
2. Give clear first-aid guidance
3. Suggest simple home remedies
4. Maintain professional, empathetic tone
5. For serious symptoms, always recommend professional help
6. Never make definitive diagnoses
7. Keep responses brief and clear
8. Respond in ${SUPPORTED_LANGUAGES[language] || 'English'} language

For serious conditions, use this phrase: "${langResponses.serious}"`;
};

class ChatbotService {
  async createSession(preferredLanguage = 'en') {
    const sessionId = uuidv4();
    const chat = new Chat({ 
      sessionId,
      preferredLanguage: SUPPORTED_LANGUAGES[preferredLanguage] ? preferredLanguage : 'en'
    });
    await chat.save();
    return { sessionId, language: chat.preferredLanguage };
  }

  async getChatHistory(sessionId) {
    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      throw new Error('Chat session not found');
    }
    return {
      messages: chat.messages,
      language: chat.preferredLanguage
    };
  }

  async processMessageWithRetry(sessionId, userMessage, retryCount = 0) {
    if (!rateLimiter.addRequest()) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
      throw new Error('Chat session not found');
    }

    const language = chat.preferredLanguage || 'en';
    const langResponses = LANGUAGE_RESPONSES[language] || LANGUAGE_RESPONSES['en'];

    // Add user message to chat history
    chat.messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      const chatSession = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: getSystemPrompt(language) }],
          },
          {
            role: "model",
            parts: [{ text: langResponses.greeting }],
          },
          ...chat.messages.slice(-4).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }))
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 20
        },
      });

      // Get response from Gemini
      const result = await chatSession.sendMessage(userMessage);
      const assistantMessage = result.response.text();

      // Add assistant's response to chat history
      chat.messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      if (chat.messages.length > 10) {
        chat.messages = chat.messages.slice(-10);
      }

      await chat.save();

      return {
        message: assistantMessage,
        sessionId: chat.sessionId,
        language: chat.preferredLanguage
      };
    } catch (error) {
      console.error('Gemini API Error:', error);

      if (error.message.includes('429') && retryCount < RATE_LIMIT.maxRetries) {
        console.log(`Rate limit hit, retrying in ${RATE_LIMIT.retryDelay/1000} seconds... (Attempt ${retryCount + 1}/${RATE_LIMIT.maxRetries})`);
        await delay(RATE_LIMIT.retryDelay);
        return this.processMessageWithRetry(sessionId, userMessage, retryCount + 1);
      }

      if (retryCount >= RATE_LIMIT.maxRetries) {
        throw new Error('Maximum retry attempts reached. Please try again later.');
      }

      throw new Error(`Error processing message: ${error.message}`);
    }
  }

  async processMessage(sessionId, userMessage) {
    return this.processMessageWithRetry(sessionId, userMessage);
  }

  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }
}

module.exports = new ChatbotService(); 