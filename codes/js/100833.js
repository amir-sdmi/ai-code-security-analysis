// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Correct import // Correct import for google-generativeai
const cors = require('cors');
const schema = require('./schema1.json'); // Assuming schema1.json is in your backend directory

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

const corsOptions = {
    origin: 'https://nl-to-sql-git-main-growasguards-projects.vercel.app/', // **Replace with your Vercel URL**
    methods: 'POST', //  Allow only POST requests (adjust if needed)
    allowedHeaders: ['Content-Type'], //  Allow Content-Type header
};
app.use(cors(corsOptions));

const API_KEY = process.env.GEMINI_API_KEY; // API key from environment variables
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use gemini-1.5-flash model // CORRECT INITIALIZATION (ADD THIS)// Initialize Gemini API with GoogleGenerativeAI

function extractRelevantTablesWithLLM(nl_query, schema) {
    const table_names = schema.tables.map(table => table.table_name);
    const column_names = schema.tables.flatMap(table => table.columns.map(col => col.column_name));
    const schema_info = `Table Names: ${table_names.join(', ')}\nColumn Names: ${column_names.join(', ')}`;
    const llm_prompt = `Analyze the following user query: '${nl_query}' considering the database schema information below: ---\nDatabase Schema Information ---\n${schema_info}\n--- End Database Schema Information ---\nIdentify the database tables from the schema that are most relevant to the user query. Return ONLY a list of table names that are relevant, comma-separated. If no tables are relevant, return an empty list.`;

    return new Promise(async (resolve, reject) => { // Added Promise wrapper for async/await
        try {

            const response = await model.generateContent({ // Use 'model' instance
                contents: [{ parts: [{ text: llm_prompt }] }],
            });

            const llm_table_names_text = response.response.candidates[0].content.parts[0].text;
            console.log(`LLM Raw Response: ${llm_table_names_text}`);
            resolve(llm_table_names_text.split(',').map(table => table.trim().toLowerCase()).filter(table => table));

        } catch (error) {
            console.error("Error during Gemini API call:", error);
            reject([]); // Reject promise in case of error
        }
    });
}

app.post('/api/relevant-tables', async (req, res) => {
    const nl_query = req.body.nl_query;
    if (!nl_query) {
        return res.status(400).send({ message: 'Natural language query is required' });
    }

    try {
        const relevantTables = await extractRelevantTablesWithLLM(nl_query, schema);
        res.json({ relevantTables });
    } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).send({ message: 'Error processing your query' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});