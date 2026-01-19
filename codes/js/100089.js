const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini Pro (you can also use 'gemini-1.5-flash' or 'gemini-1.5-pro')
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateGeminiText = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    return null;
  }
};

module.exports = { generateGeminiText };
