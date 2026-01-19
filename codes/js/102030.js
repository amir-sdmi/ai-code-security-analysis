import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { defineWord } from "./dictionary.tool.js";
import { shortenURL } from "./shorturl.tool.js";
import { createNote } from "./file.tool.js";
import { calculateExpression, calculateStats } from "./math.tool.js";
import { askGemini, createContent, analyzeText } from "./gemini.tool.js";
import { convertCurrency } from "./currency.tool.js";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
    name: "gemini-powered-mcp-server",
    version: "1.0.0"
});

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Support for traditional MCP client
const transports = {};

// MCP Tools setup
server.tool(
    "addTwoNumbers",
    "Add two numbers",
    {
        a: z.number(),
        b: z.number()
    },
    async (arg) => {
        const { a, b } = arg;
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }
    }
)

// Register dictionary tool
server.tool(
    "defineWord",
    "Get definition of a word", 
    {
        word: z.string().min(1)
    }, 
    async (arg) => {
        const { word } = arg;
        return defineWord(word);
    }
)

// Register URL shortener tool
server.tool(
    "shortenURL",
    "Shorten a long URL", 
    {
        url: z.string().url()
    }, 
    async (arg) => {
        const { url } = arg;
        return shortenURL(url);
    }
)

// Register note creation tool
server.tool(
    "createNote",
    "Create a markdown note on the server", 
    {
        title: z.string().min(1),
        content: z.string().min(1)
    }, 
    async (arg) => {
        return createNote(arg);
    }
)

// Register statistics calculator
server.tool(
    "calculateStats",
    "Calculate statistical values for a set of numbers", 
    {
        numbers: z.array(z.number())
    }, 
    async (arg) => {
        return calculateStats(arg);
    }
)

// Register Gemini's Ask tool
server.tool(
    "askGemini",
    "Ask Google's Gemini AI a question", 
    {
        prompt: z.string().min(1),
        maxTokens: z.number().optional(),
        temperature: z.number().optional()
    }, 
    async (arg) => {
        return askGemini(arg);
    }
)

// Register Gemini's Creative Content tool
server.tool(
    "createContent",
    "Use Gemini to create creative content like stories, poems, or essays", 
    {
        topic: z.string().min(1),
        type: z.string().min(1),
        style: z.string().optional()
    }, 
    async (arg) => {
        return createContent(arg);
    }
)

// Register Gemini's Text Analysis tool
server.tool(
    "analyzeText",
    "Use Gemini to analyze text for sentiment, summarization, or keywords", 
    {
        text: z.string().min(1),
        analysisType: z.string().min(1)
    }, 
    async (arg) => {
        return analyzeText(arg);
    }
)

// Register Currency tool
server.tool(
    "convertCurrency",
    "Convert currency from one to another",
    {
        from: z.string().length(3),
        to: z.string().length(3),
        amount: z.number().positive()
    },
    async (arg) => {
        const { from, to, amount } = arg;
        return convertCurrency(from, to, amount);
    }
);

// API Routes for the Web UI
app.post('/api/define', async (req, res) => {
    try {
        const result = await defineWord(req.body.word);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/shorten', async (req, res) => {
    try {
        const result = await shortenURL(req.body.url);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/createNote', async (req, res) => {
    try {
        const result = await createNote(req.body);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stats', async (req, res) => {
    try {
        const result = await calculateStats(req.body);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gemini API routes
app.post('/api/ask', async (req, res) => {
    try {
        const result = await askGemini(req.body);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/creative', async (req, res) => {
    try {
        const result = await createContent(req.body);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const result = await analyzeText(req.body);
        res.json({
            text: result.content[0].text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add currency endpoint
app.post('/api/currency', async (req, res) => {
    try {
        const result = await convertCurrency(req.body.from, req.body.to, req.body.amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simplified SSE endpoints
app.get("/sse", async (req, res) => {
    try {
        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
            delete transports[transport.sessionId];
        });
        await server.connect(transport);
    } catch (error) {
        console.error('SSE connection error:', error);
        res.status(500).send('SSE connection error');
    }
});

app.post("/messages", (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        const transport = transports[sessionId];
        if (transport) {
            transport.handlePostMessage(req, res);
        } else {
            res.status(400).send('No transport found for sessionId');
        }
    } catch (error) {
        console.error('Message handling error:', error);
        res.status(500).send('Message handling error');
    }
});

// Root route for serving the web interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n----- GEMINI-POWERED MCP SERVER -----`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`\nAvailable tools via web interface:`);
    console.log(`- Dictionary: Look up word definitions`);
    console.log(`- URL Shortener: Shorten long URLs`);
    console.log(`- Notes: Create markdown notes on the server`);
    console.log(`- Statistics: Calculate statistical values for number sets`);
    console.log(`- Currency: Convert between different currencies`);
    console.log(`- AI Assistant: Powered by Google's Gemini API`);
    console.log(`\nOpen your browser to http://localhost:${PORT} to use the web interface\n`);
});