const express = require('express');
const router = express.Router();

// Anime-themed AI assistant route with Gemini integration
const { askGemini } = require('./gemini');
router.post('/ai-assist', async (req, res) => {
  const { prompt } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // If Gemini API key is set, use Gemini
  if (GEMINI_API_KEY) {
    try {
      const aiResponse = await askGemini(prompt);
      return res.json({ response: aiResponse });
    } catch (err) {
      // Fall through to rule-based if Gemini fails
    }
  }

  // Fallback: Anime-themed rule-based logic
  const animeQuotes = [
    { keyword: 'goku', quote: '"I am the hope of the universe!" – Goku (Dragon Ball Z)' },
    { keyword: 'luffy', quote: '"I’m gonna be King of the Pirates!" – Monkey D. Luffy (One Piece)' },
    { keyword: 'ichigo', quote: '"If I don’t wield the sword, I can’t protect you." – Ichigo Kurosaki (Bleach)' },
    { keyword: 'gintoki', quote: '"The country? The sky? None of that matters. As long as I can protect what’s important to me." – Gintoki Sakata (Gintama)' },
    { keyword: 'alucard', quote: '"Only a human can defeat a monster." – Alucard (Castlevania)' },
    { keyword: 'bleach', quote: 'Bankai! Release your power.' },
    { keyword: 'pirate', quote: 'Treasure is not what’s important. It’s the adventure!' },
    { keyword: 'dragon ball', quote: 'Over 9000! Power levels are off the charts!' },
    { keyword: 'samurai', quote: 'A true samurai never lets go of their soul.' }
  ];
  const lowerPrompt = (prompt || '').toLowerCase();
  const found = animeQuotes.find(q => lowerPrompt.includes(q.keyword));
  if (found) {
    return res.json({ response: found.quote });
  }

  // Random fallback responses
  const fallback = [
    'The future is shrouded in mystery. Ask again, traveler.',
    'Your destiny is written among the stars and code.',
    'Anime wisdom: Believe in yourself, even when the world doubts you.',
    'I sense great power within you. Proceed with courage.',
    'The multiverse is vast. Which anime world do you seek?'
  ];
  const response = fallback[Math.floor(Math.random() * fallback.length)];
  res.json({ response });
});

const ChatMessage = require('./models/ChatMessage');

// Get chat messages
router.get('/chat/messages', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Post a new chat message
router.post('/chat/messages', async (req, res) => {
  try {
    const { message, anime } = req.body;
    const chatMsg = new ChatMessage({ message, anime });
    await chatMsg.save();
    res.json(chatMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post message' });
  }
});

module.exports = router;
