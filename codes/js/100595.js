const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies

// Route for handling user messages and communicating with ChatGPT
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Send user message to ChatGPT
    const botResponse = await getChatGPTResponse(userMessage);

    // Send bot's response back to the frontend
    res.json({ response: botResponse });
  } catch (error) {
    console.error('Error sending message to ChatGPT:', error);
    res.status(500).json({ error: 'An error occurred while processing your message' });
  }
});

// Function to communicate with ChatGPT
async function getChatGPTResponse(userMessage) {
  const openaiApiKey = 'sk-proj-uLsQArJHs8hVTQWsZvtgT3BlbkFJ1ka84BmU9YLHUbcDP77G';
  const response = await axios.post('https://api.openai.com/v1/completions', {
    model: 'davinci',
    prompt: userMessage,
    max_tokens: 150,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    }
  });
  
  // Extract bot's response from OpenAI API response
  const botResponse = response.data.choices[0].text.trim();
  return botResponse;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
