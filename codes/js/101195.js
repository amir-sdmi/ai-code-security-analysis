const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config();

const app = express();
const port = 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Allow CORS from frontend

// Set up Google Generative AI with API Key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Route to handle prompt requests
app.post('/api/get-itinerary', async (req, res) => {
  console.log('Received request:', req.body); // Log request body to see incoming request data
  try {
    const userPrompt = req.body.prompt;
    const permanentPrompt = `You are an intelligent travel assistant. Generate a customized detailed travel itinerary for the given destination in a JSON format. The itinerary should include:
- detailed timings
- place ratings
- weather suggestions
- key highlights for each day
- spending budget for each activity
- extra comments and suggestions for each activity
- commute time between activities
- specific location details (e.g., city, country)
- place types (e.g., museum, park, restaurant)
- address or nearby landmarks.
- the structure of the JSON response should be strictlyas follows:

Structure the JSON response with:
{
  "title": "Itinerary title",
  "sections": [
    {
      "time": "Morning (8:00 AM - 12:00 PM)",
      "activities": [
        {
          "activity": "Visit Red Fort", 
          "rating": "4.5/5", 
          "weather": "Sunny, 20°C", 
          "duration": "2 hours", 
          "budget": "₹500", 
          "comments": "Red Fort is a significant historical landmark. Make sure to hire a guide to understand its history better.",
          "commute_time": "15 mins from previous location",
          "location_details": {
            "city": "Delhi",
            "country": "India",
            "place_type": "historical landmark",
            "address": "Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi, Delhi 110006"
          }
        }
      ]
    }
  ]
}
`;
    const completePrompt = `${permanentPrompt} ${userPrompt}`;

    // Use Gemini API to generate content
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(completePrompt);

    // Clean response
    let responseText = result.response.text(); 
    responseText = responseText.replace(/```json|```/g, '').trim(); // Remove any code fences

    // Try extracting JSON only if it is accompanied by extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    console.log('Cleaned LLM Response:', responseText);

    try {
      // Verify and parse JSON format
      const jsonResponse = JSON.parse(responseText);
      res.status(200).json({ response: jsonResponse });
    } catch (error) {
      console.error('Error parsing JSON from LLM response:', error);
      res.status(500).json({ error: 'Failed to parse valid JSON from LLM response.' });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Something went wrong with the LLM request.' });
  }
});

// Listen on the given port
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
