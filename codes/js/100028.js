const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GeminiAPI } = require('../../config.json');

const genAI = new GoogleGenerativeAI(GeminiAPI);

// Use Gemini 1.5 Pro (or 1.0 Pro, if that's what your key supports)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function gemini(prompt) {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { gemini };