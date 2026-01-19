const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const { openaiApiKey } = require("../config");

const configuration = new Configuration({
  apiKey: openaiApiKey,
});

const openai = new OpenAIApi(configuration);

// Function to generate a response using ChatGPT
async function generateResponse(prompt) {
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const response = await axios.post(
    apiUrl,
    {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are broke and need extra money.",
        },
        {
          role: "user",
          content:
            "From this point on you are: ungrateful, poor, and desperate make some extra money for school.",
        },
        {
          role: "assistant",
          content:
            "I got class soon but I still haven't gotten my books, please give me some money frfr.",
        },
        {
          role: "user",
          content:
            "REDDIT POST: Click my link plz and win a free gift google.com. Response:",
        },
        {
          role: "assistant",
          content: "Click my link too please https://temu.com/s/VKbPngjCRqUkeA",
        },
        {
          role: "user",
          content:
            "REDDIT POST: Reset 😔 I can’t ever win google.com. Response:",
        },
        {
          role: "assistant",
          content:
            "Click my link and I might do yours, just need a few more https://temu.com/s/VKbPngjCRqUkeA",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      n: 1,
      stop: null,
      temperature: 0.8,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );
  //   console.log(response.data);

  return response.data.choices[0].message.content.trim().replace(/"/g, ""); // Remove quotes from the response
}

// Function to generate a response using ChatGPT
/**
 * Generate a response using ChatGPT
 * @param {{role: string, content: string}[]} messages
 * @param {{n: number, stop?: boolean | null, temperature: number, max_tokens: number, model: string}} options
 */
async function chat(messages, options = {}) {
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const response = await axios.post(
    apiUrl,
    {
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 100,
      n: 1,
      stop: null,
      temperature: 0.8,
      ...options,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );
  //   console.log(response.data);

  return response.data.choices[0].message.content.trim().replace(/"/g, ""); // Remove quotes from the response
}

/**
 * Generate a picture based on the prompt
 *
 * @param {object} data
 * @param {string} data.prompt
 * @param {number} data.n
 * @param {'1024x1024' | '512x512'} data.size
 * @returns {Promise<Array<{url:string}>>} array of urls
 */
async function generatePicture({ prompt, n = 1, size = "1200x628" }) {
  const apiUrl = "https://api.openai.com/v1/images/generations";

  const response = await axios.post(
    apiUrl,
    {
      prompt: prompt,
      n,
      size,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );

  return response.data.data;
}

// Generate variations of an image based on the prompt and the image url provided in the prompt
async function createImageVariation(imagePath, n = 1, size = "1024x1024") {
  const apiUrl = "https://api.openai.com/v1/images/variations";

  // Read image file and convert it to base64
  const imageFile = await axios.get(imagePath, {
    responseType: "arraybuffer",
    Authorization: `Bearer ${openaiApiKey}`,
  });
  //   console.log(imageFile);
  const imageBase64 = Buffer.from(imageFile.data, "binary");

  const response = await axios.post(
    apiUrl,
    {
      image: imageBase64,
      n: n,
      size: size,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );

  console.log(response.data, "HERE");
  return response.data.data;
}

const completionChat = async (messages, model = "gpt-3.5-turbo") => {
  console.log("Sending chat completion request");
  const response = await openai.createChatCompletion({
    model,
    messages,
  });
  console.log("Chat completion response received");
  return response.data.choices[0].message.content.trim();
};

module.exports = {
  generatePicture,
  generateResponse,
  createImageVariation,
  completionChat,
};
