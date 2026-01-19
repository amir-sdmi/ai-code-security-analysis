const { GoogleGenerativeAI } = require("@google/generative-ai");

// @desc    Ask AI for farming advice
// @route   POST /api/ai/ask
// @access  Private (Farmer only)
exports.askFarmingQuery = async (req, res) => {
    try {
        const { query, language } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        // Validate API key
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Gemini API key not configured"
            });
        }        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Get the generative model - use gemini-2.0-flash as per the API documentation
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        // Create a comprehensive prompt for Indian farming context
        const prompt = `You are an expert agricultural advisor specializing in Indian farming practices. 
    You have deep knowledge about:
    - Indian crops, seeds, and varieties suitable for different regions
    - Monsoon patterns and seasonal farming in India
    - Traditional and modern farming techniques used in India
    - Common pests and diseases affecting Indian crops
    - Organic farming methods popular in India
    - Government schemes and subsidies for Indian farmers
    - Soil types across different Indian states
    - Irrigation methods suitable for Indian conditions
    - Market prices and crop economics in India
    - Regional farming practices across different Indian states

    Please answer the following farming query in a helpful, practical manner. 
    If the query is not in English, please respond in the same language as the query.
    Keep your response focused on Indian farming context and provide actionable advice.
    Do not bold aur use "*" in your response. Answer in plain simple text
    
    Query: ${query}
    
    ${language && language !== 'en' ? `Please respond in ${language} language.` : ''}
    
    Provide practical, region-specific advice that considers Indian farming conditions, climate, and practices.`;

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        res.json({
            success: true,
            data: {
                query: query,
                answer: answer,
                language: language || 'en'
            }
        });
    } catch (error) {
        console.error('AI Query Error:', error);

        // More specific error handling for API key issues
        if (error.status === 400 && error.errorDetails) {
            const apiKeyError = error.errorDetails.find(detail =>
                detail.reason === 'API_KEY_INVALID'
            );

            if (apiKeyError) {
                console.error('Invalid API Key detected');
                console.error('Current API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'undefined');
                console.error('API Key starts with:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined');
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to process AI query",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get AI conversation history
// @route   GET /api/ai/history
// @access  Private (Farmer only)
exports.getQueryHistory = async (req, res) => {
    try {
        // In a real application, you might want to store query history in database
        // For now, we'll return an empty array as this is a basic implementation
        res.json({
            success: true,
            data: {
                queries: [],
                message: "Query history feature can be implemented with database storage"
            }
        });
    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch query history"
        });
    }
};

// @desc    Get supported languages
// @route   GET /api/ai/languages
// @access  Public
exports.getSupportedLanguages = async (req, res) => {
    try {
        const supportedLanguages = [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
            { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
            { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
        ];

        res.json({
            success: true,
            data: supportedLanguages
        });
    } catch (error) {
        console.error('Languages Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supported languages"
        });
    }
};
