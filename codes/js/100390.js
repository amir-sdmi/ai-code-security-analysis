// server/routes/lyrics.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// Initialize OpenAI client with API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY // set in your Render environment
});

// POST /lyrics
router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No lyrics provided.' });
  }

  try {
    // Use ChatGPT to rewrite lyrics
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or "gpt-4"
      messages: [
        {
          role: 'user',
          content: `Rewrite the following lyrics into a poetic, lyrical, modern style:\n\n${text}`
        }
      ],
      temperature: 0.8 // optional: controls creativity
    });

    const rewritten = gptResponse.choices[0].message.content;

    res.status(200).json({ rewritten });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'GPT lyric rewriting failed.' });
  }
});

module.exports = router;
