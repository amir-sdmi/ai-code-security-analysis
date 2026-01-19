const axios = require("axios");
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getChatGPTResponse(prompt) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: `Parse the following trading command: "${prompt}"`,
        max_tokens: 100,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error with ChatGPT API:", error.response ? error.response.data : error.message);
    throw new Error("Failed to process ChatGPT request");
  }
}

module.exports = { getChatGPTResponse };
