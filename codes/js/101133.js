const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');  // add axios for API calls

// Endpoint to generate AI response
router.post('/generate-response', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        
        // generate the prompt from the user answers
        const prompt = generatePromptFromAnswers(answers);
        
        // Increment API calls for the user
        req.user.apiCalls += 1;
        await req.user.save();

        // Check API call limit
        if (req.user.apiCalls > 20) {
            return res.status(403).json({ 
                message: "You have exceeded the free API call limit"
            });
        }
        
        // using ChatGPT API
        const response = await callChatGPT(prompt);
        
        res.json({ reply: response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Function to generate a prompt from user's answers
const generatePromptFromAnswers = (answers) => {
    // Create the specific prompt
    let prompt = `I completed a mental health self-assessment with the following answers: \n\n`;
    
    // map questions to the answers
    const questionTexts = [
        'Overall mood: ',
        'Sleep: ',
        'Stress level: ',
        'Energy level: ',
        'Appetite: ',
        'Concentration: ',
        'Social interaction: ',
        'Daily satisfaction: '
    ];
    
    // Add each answer to the prompt
    answers.forEach((answer, index) => {
        if (questionTexts[index]) {
            prompt += `${questionTexts[index]}${answer}\n`;
        }
    });
    
    // Complete the prompt with a request for advice
    prompt += `\nBased on this assessment, please provide personalized advice for improving my mental wellbeing. Include specific, actionable suggestions that address my current state. Also mention when it might be appropriate to seek professional help if my answers indicate potential concerns.`;
    
    return prompt;
};

// Function to call ChatGPT API
const callChatGPT = async (prompt) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a supportive mental health assistant. Provide kind, helpful advice based on the user\'s assessment. Be empathetic but make it clear you are not a replacement for professional mental health care.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        return "I'm sorry, I couldn't generate a response at this time. Please try again later.";
    }
};

module.exports = router;