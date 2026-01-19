const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI('YOUR_API_KEY');

async function run() {
  // Step 1: Download image and convert to base64
  const imageUrl = 'https://media.cnn.com/api/v1/images/stellar/prod/img-6489-1.JPG?c=original';
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');

  // Step 2: Use Gemini API with inline image
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const result = await model.generateContent([
    {
      parts: [
        { text: "What's happening in this image?" },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        }
      ]
    }
  ]);

  const response = await result.response;
  console.log('Gemini Output:', response.text());
}

run();
