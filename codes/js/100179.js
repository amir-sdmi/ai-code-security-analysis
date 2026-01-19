import express from 'express';
import axios from 'axios';
import { getCache, setCache } from '../cache.js';

const router = express.Router();

// POST /disasters/:id/verify-image
router.post('/:id/verify-image', async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;
  const cacheKey = `verify:${id}:${image_url}`;
  let cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  // Use Gemini API for image verification
  const geminiResp = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    {
      contents: [{ parts: [{ text: `Analyze image at ${image_url} for signs of manipulation or disaster context.` }] }]
    },
    { params: { key: process.env.GEMINI_API_KEY } }
  );
  const result = geminiResp.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No result';
  await setCache(cacheKey, { result });
  res.json({ result });
});

export default router; 