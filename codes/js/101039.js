const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const axios = require('axios'); // Import axios for making HTTP requests
const path = require('path');

const app = express();
const port = 3000;

const openai = new OpenAI({ apiKey: "<key>" });

app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/getAnswer', async (req, res) => {
    const emojisInput = req.body.emojisInput;
    const choice = req.body.choice;

    let prompt;

    if (choice == 'scary') {
        prompt = `create a story of about 250 words with these 5 emojis, make it very dark and ominous but also slightly cute. Do not make it sad but make it very scary ${emojisInput}`;
    } else if (choice == 'kitty') {
        prompt = `create a story of about 250 words with these 5 emojis, make it about cats and kitties and include cat puns and make the story very wholesome and cute ${emojisInput}`;
    } else if (choice == 'happy') {
        prompt = `create a story of about 250 words with these 5 emojis, make it very wholesome and cute and fun and a little adventurous${emojisInput}`;
    }

    try {
        // Use ChatGPT to generate a story based on the prompt
        const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            model: "gpt-3.5-turbo",
        }, {
                ers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer <key>',
            },
        });

        console.log('ChatGPT response:', chatGptResponse.data);

        const story = chatGptResponse.data.choices[0].message.content;
        console.log(story);

        // Use DALL-E to generate an image based on the generated story
        const responseImage = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Create a semi-realistic image representing the emotional tone of the story without including any text. Depict the theme in a way that conveys either a sad or happy atmosphere. Use the image to encapsulate the essence of the narrative: ${story}`,
            n: 1,
            size: "1024x1024",
        });

        console.log('DALL-E response:', responseImage.data);

        // Get the image URL
        const imageUrl = responseImage.data[0].url;

        // Respond with both the story and image URL
        res.json({ story, imageUrl });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
