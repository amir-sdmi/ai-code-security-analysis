import express from 'express';
import { WebSocketServer } from 'ws'; // Correct import for WebSocketServer
import OpenAI from 'openai';

// Set up the OpenAI API with your key
const openai = new OpenAI({
  apiKey: // Replace with your OpenAI API key

});

const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// WebSocket setup
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    console.log('Received:', message);

    try {
      // ChatGPT request
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
      });

      // Send ChatGPT response back to the client
      ws.send(response.choices[0].message.content);
    } catch (error) {
      console.error('Error with ChatGPT API:', error.response ? error.response.data : error.message);
      ws.send('Sorry, there was an error processing your request.');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
