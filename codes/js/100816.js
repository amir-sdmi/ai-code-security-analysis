require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.post('/api/chatgpt', async (req, res) => {

    const filename = req.body.image;
    console.log(filename);
    const imagePath = path.join(__dirname, `images/${filename}.png`);
    const imageFile = fs.readFileSync(imagePath);
    const userImage = Buffer.from(imageFile).toString('base64');
    const base64Image = `data:image/png;base64,${userImage}`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Please analyze the content of the provided image. Determine whether the image represents a phishing attempt or a legitimate context. Select only one option: Phishing or Legitimate, and why in one sentence."
                      },
                      {
                        type: "image_url",
                        image_url: {
                          url: base64Image
                        }
                      }
                    ]
                }
            ],
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const chatGptResponse = response.data.choices[0].message.content;
        console.log(chatGptResponse);

        res.json({ response: chatGptResponse });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error communicating with ChatGPT API');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});