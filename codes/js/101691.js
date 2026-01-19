//**Cristian Martin Fucile
//This Programm shows real world catastrophies around the world and has an AI that analyzes those
//Date of birth 26.6.2024
//Date of death 10.9.2024 */

import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { LanguageServiceClient } from '@google-cloud/language';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = 3000;
app.set('view engine', 'ejs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

const PROJECT_ID = 'wide-origin-426109-h4';
const location = 'europe-west6';
const modelId = 'gemini-1.5-pro-001';

// Initialize PredictionServiceClient with the full endpoint
const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${location}/publishers/google/models/${modelId}:streamGenerateContent`;
const predictionClient = new PredictionServiceClient({
    apiEndpoint: `${location}-aiplatform.googleapis.com`
  });

const apiKey = "AIzaSyBkFRJ69YdzSvC-jtXlhCoqvSxbuWsqa5A"; // Replace with your actual API key

fetch('https://example.googleapis.com/v1/resource', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`, // This is a common way to pass API keys, adjust based on the service's documentation
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

app.post('/api/analyze-disaster', async (req, res) => {
    try {
        const userChosenDisaster = req.body.text;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
        const prompt = `
        Analyze the following Natural Disaster: ${userChosenDisaster}.
        - Provide a short HTML description of how severe this disaster is for the world.
        - Suggest actions that individuals and society can take to prevent such disasters in the future.
        - Do not use Markdown syntax like * or **.
        - Output the text directly in HTML.
        - Do not include '''Html at the beginning or end.
        - Use the style {margin-left: 8px;} in your HTML.
        - Do not create new CSS classes.
        `;

        const result = await model.generateContent(prompt);
        const output = result.response.text();
        console.log(output)
        res.json({ result: output });
    } catch (error) {
        console.error('Error analyzing disaster:', error);
        res.status(500).json({ error: 'Error analyzing disaster' });
    }
});

// Endpoint for text generation
app.post('/api/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Use Gemini for text generation
        const generatedText = await gemini.generateText(prompt);

        // Return the generated text
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ error: 'Error generating text' });
    }
});

// Disaster API Authentication
const authUrl = 'https://keycloak01.kontur.io/auth/realms/kontur/protocol/openid-connect/token';
const clientId = 'kontur_platform';
const username = 'cristian.martin@bluewin.ch';
const password = 'denista1';

const getToken = async () => {
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'password',
            username: username,
            password: password,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
};

const getUserFeeds = async (token) => {
    const response = await fetch('https://apps.kontur.io/events/v1/user_feeds', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting user feeds: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

const getGeoJSONEvents = async (token, offset, limit) => {
    const response = await fetch(`https://disaster.ninja/active/api/events?limit=${limit}&offset=${offset}&feed=kontur-public`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting GeoJSON events: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

// Endpoint for user feeds
app.get('/api/feeds', async (req, res) => {
    try {
        const token = await getToken();
        const userFeeds = await getUserFeeds(token);
        res.json(userFeeds);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint for GeoJSON events
app.get('/api/geojson-events', async (req, res) => {
    try {
        const { offset = 0, limit = 5 } = req.query;
        const token = await getToken();
        const geoJSONEvents = await getGeoJSONEvents(token, offset, limit);
        res.json(geoJSONEvents);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});