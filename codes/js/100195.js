//jshint esversion: 8
const axios = require('axios');


async function getChatGPTResponse(message) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.CHATGPT_API_KEY; // ChatGPT API key

  const params = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: 'You are personalised travel guide who specialises in itinerary designing based on trip and traveller details with following considerations Time and route optimization with specific day and time schedule Detail orientation of attractions and activities' }, { role: 'user', content: message }]
  };

  try {
    const response = await axios.post(endpoint, params, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error interacting with ChatGPT API:', error.message);
    throw error;
  }
}

module.exports = { getChatGPTResponse };
