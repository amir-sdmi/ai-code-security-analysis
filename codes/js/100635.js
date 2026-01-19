const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');

app.get('/generate-website', async (req, res) => {
    const { prompt } = req.query;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    try {
        // Use Gemini to generate content
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const result = await model.generateContentStream(`Generate an HTML website based on the following description: ${prompt}. Include inline CSS for styling and any necessary JavaScript. The response should be a complete, valid HTML document.`);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        res.write('event: done\ndata: null\n\n');
        res.end();
    } catch (error) {
        console.error('Error generating website:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred while generating the website' })}\n\n`);
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});