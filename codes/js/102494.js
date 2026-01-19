// ai-layout-project/backend/server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fetch from 'node-fetch';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import settingRoutes from './routes/settings.js'
import User from './models/User.js'; // Make sure to import your User model here
import razorpayRoutes from './routes/razorpayRoutes.js'

// <--- REQUIRED IMPORTS FOR FILE SYSTEM AND PDF OPERATIONS (for Node.js PDFKit) --->
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit'; // For generating PDFs directly in Node.js
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // For unique PDF filenames
// <--- END REQUIRED IMPORTS --->

// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// --- Connect Database ---
connectDB();

const allowedOrigins = [
    'http://localhost:5173',
    'https://nexus-aichat.netlify.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ extended: false, limit: '50mb' }));

// <--- ADDED: Directory for generated PDFs and static serving (Crucial for PDF display) --->
const GENERATED_PDF_DIR = path.join(__dirname, 'generated_pdfs');

// Ensure the directory exists
if (!fs.existsSync(GENERATED_PDF_DIR)) {
    fs.mkdirSync(GENERATED_PDF_DIR);
    console.log(`Created directory for generated PDFs: ${GENERATED_PDF_DIR}`);
}

// Serve static files from the 'generated_pdfs' directory
// This makes PDFs accessible at e.g., http://localhost:5000/generated_pdfs/your-file.pdf
app.use('/generated_pdfs', express.static(GENERATED_PDF_DIR));
// <--- END ADDED --->

// --- Configure Gemini API ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error("GEMINI_API_KEY not found in .env file. Please set it.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);

// --- NEW: Mapping for your custom model names to Gemini API models ---
const modelMapping = {
    'Soul Lite (Fast)': 'gemini-1.5-flash',
    'Soul Pro (Advanced)': 'gemini-pro', // Or 'gemini-1.5-pro' if you enable it and have access
    'Soul Custom (Beta)': 'gemini-1.5-flash', // Assign a default if 'custom' means dynamic selection later
};

// Safety settings for Gemini API
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// --- Configure Google Custom Search API ---
const googleSearchAPIKey = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

if (!googleSearchAPIKey || !GOOGLE_CSE_ID) {
    console.warn("Google Custom Search API keys not fully configured. Google search results will be skipped.");
}

// --- Configure OneCompiler API ---
const oneCompilerApiKey = process.env.ONECOMPILER_API_KEY;
if (!oneCompilerApiKey) {
    console.warn("ONECOMPILER_API_KEY not found in .env file. Code compilation will not work.");
}

function isPureCodeResponse(text) {
    return text?.trim().startsWith("```") && text?.trim().endsWith("```");
}


// Helper function to check if query contains code-related terms
const isCodeRelatedQuery = (query) => {
    if (!query || typeof query !== 'string') return false;
    const codeKeywords = [
        'code', 'html', 'css', 'javascript', 'python', 'java', 'react', 'vue',
        'angular', 'node', 'php', 'sql', 'function', 'class', 'component',
        'script', 'program', 'algorithm', 'coding', 'programming',
        'website', 'app', 'application', 'api', 'database', 'frontend',
        'backend', 'fullstack', 'web development', 'software', 'jdbc', 'driver'
    ];
    const lowerQuery = query.toLowerCase();
    return codeKeywords.some(keyword => lowerQuery.includes(keyword));
};

// NEW Helper function: Checks if the query explicitly asks for code generation
function isExplicitCodeGenerationRequest(query = '') {
    const codeGenerationTriggers = [
        'write code for', 'generate code for', 'create code for', 'show me the code for',
        'give me a script for', 'implement a function for', 'code example for',
        'write a program for', 'generate a program for', 'create a script for',
        'how to code', 'how to write code', 'code to', 'script to', 'program to'
    ];
    const lowerQuery = query.toLowerCase();
    return codeGenerationTriggers.some(phrase => lowerQuery.includes(phrase));
}


function isPdfRequested(query = '') {
    const pdfTriggers = [
        'make a pdf',
        'generate pdf',
        'create pdf',
        'pdf file',
        'download as pdf',
        'save as pdf',
        'make notes as pdf',
        'pdf of this',
        'export as pdf',
        'generate a pdf for',
        'give me a pdf',
    ];

    const lowerQuery = query.toLowerCase();
    return pdfTriggers.some(phrase => lowerQuery.includes(phrase));
}


// Helper function to fetch results from Google Custom Search
async function getGoogleSearchResults(query) {
    if (!googleSearchAPIKey || !GOOGLE_CSE_ID) {
        console.log("Skipping Google Search as API keys are not configured.");
        return { images: [], links: [] };
    }
    if (!query || typeof query !== 'string' || query.trim() === '') {
        console.warn("Google Custom Search API call skipped: Query is empty or invalid.");
        return { images: [], links: [] };
    }

    const encodedQuery = encodeURIComponent(query);
    const imageSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchAPIKey}&cx=${GOOGLE_CSE_ID}&q=${encodedQuery}&searchType=image&num=4`;
    const webSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchAPIKey}&cx=${GOOGLE_CSE_ID}&q=${encodedQuery}&num=3`;

    let googleImages = [];
    let googleLinks = [];

    try {
        const imageRes = await fetch(imageSearchUrl);
        if (!imageRes.ok) {
            const errorText = await imageRes.text();
            throw new Error(`Google Image Search API error: ${imageRes.status} ${imageRes.statusText} - ${errorText}`);
        }
        const imageData = await imageRes.json();
        if (imageData.items) {
            googleImages = imageData.items.map(item => ({
                src: item.link,
                alt: item.title || "Google Search Image"
            }));
        }
    } catch (error) {
        console.error("Error fetching images from Google Custom Search API:", error.message);
    }

    try {
        const webRes = await fetch(webSearchUrl);
        if (!webRes.ok) {
            const errorText = await webRes.text();
            throw new Error(`Google Web Search API error: ${webRes.status} ${webRes.statusText} - ${errorText}`);
        }
        const webData = await webRes.json();
        if (webData.items) {
            googleLinks = webData.items.map(item => ({
                title: item.title,
                url: item.link,
                snippet: item.snippet
            }));
        }
    } catch (error) {
        console.error("Error fetching web links from Google Custom Search API:", error.message);
    }
    return { images: googleImages, links: googleLinks };
}

// Helper function to convert image URL to base64 for Gemini API
async function urlToGenerativePart(url) {
    try {
        // Handle data URLs (base64 already)
        if (url.startsWith('data:')) {
            const [mimeTypePart, base64Data] = url.split(',');
            const mimeType = mimeTypePart.split(':')[1].split(';')[0];
            return {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            };
        }

        // Handle external URLs
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Use Buffer for Node.js
        const mimeType = response.headers.get('content-type');

        if (!mimeType || !mimeType.startsWith('image/')) {
            throw new Error(`Invalid content type for image URL: ${mimeType}`);
        }

        return {
            inlineData: {
                mimeType: mimeType,
                data: buffer.toString('base64')
            }
        };
    } catch (error) {
        console.error("Error converting image URL to generative part:", error);
        return null; // Return null if conversion fails
    }
}

// NEW: Image Proxy Endpoint (keeps external images secure and prevents CORS issues)
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;

    if (!imageUrl) {
        console.error("Image Proxy Error: No imageUrl provided in query.");
        return res.status(400).send('Image URL is required.');
    }

    try {
        // Log the URL being fetched by the proxy
        console.log(`Image Proxy: Attempting to fetch external image: ${imageUrl}`);

        // Add a User-Agent header to mimic a browser, which can help bypass some anti-hotlinking measures
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            // Log detailed error if external fetch fails
            console.error(`Image Proxy Error: Failed to fetch image from external URL: ${imageUrl}`);
            console.error(`Image Proxy Error: Status: ${response.status}, StatusText: ${response.statusText}`);
            // Attempt to read and log response body if it's not too large and might contain error details
            try {
                const errorBody = await response.text();
                console.error(`Image Proxy Error: External response body: ${errorBody.substring(0, 500)}... (truncated)`);
            } catch (bodyError) {
                console.error(`Image Proxy Error: Could not read external response body: ${bodyError.message}`);
            }
            return res.status(response.status).send('Failed to fetch image from external source.');
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
            res.setHeader('Content-Type', contentType);
        } else {
            // Fallback content type if original is missing or not image, but log a warning
            console.warn(`Image Proxy Warning: No image content-type for ${imageUrl}. Falling back to image/jpeg.`);
            res.setHeader('Content-Type', 'image/jpeg');
        }

        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        response.body.pipe(res); // Pipe the stream directly

    } catch (error) {
        // Log general network or other errors during proxying
        console.error(`Image Proxy Critical Error for ${imageUrl}:`, error.message);
        // Log the full error object for more details
        console.error(error);
        res.status(500).send('Error serving image through proxy.');
    }
});


// MAIN API endpoint for AI search and data retrieval
app.post('/api/search', async (req, res) => {
    // Make sure you have authentication middleware here to populate req.user
    // For example, if you're using JWT:
    // app.post('/api/search', authMiddleware, async (req, res) => { ... });
    // This example assumes req.user is populated by your authRoutes/middleware.
    // If not, you'd need to send userId from frontend and fetch user here.

    const { query, imageUrl } = req.body;
    let userId; // Placeholder for userId, assuming it comes from auth middleware
    // If using JWT, it might look like: userId = req.user.id;
    // For demonstration, let's assume `userId` is somehow available if auth is implemented.

    if (!query && !imageUrl) {
        console.error("API Search Endpoint Error: Query or imageUrl is required.");
        return res.status(400).json({ error: "Query or image is required." });
    }

    try {
        let geminiPrompt;
        const modelParts = [];
        const isPdfIntent = isPdfRequested(query); // Determine PDF intent early
        const isCodeRelated = isCodeRelatedQuery(query); // Determine if query is code-related
        const isExplicitCodeGen = isExplicitCodeGenerationRequest(query); // Determine if it's an explicit code generation request

        // --- NEW: Determine the AI model to use based on user settings ---
        let selectedAiModelId = 'gemini-1.5-flash'; // Fallback to a default Gemini model
        let user;
        if (req.user && req.user.id) { // Assuming your auth middleware puts user info on req.user
            user = await User.findById(req.user.id); // Fetch full user document
            if (user && user.settings && user.settings.aiModel) {
                selectedAiModelId = modelMapping[user.settings.aiModel] || selectedAiModelId;
            }
        } else {
            // If no user is authenticated, use the default from modelMapping or a hardcoded fallback
            selectedAiModelId = modelMapping['Soul Lite (Fast)'] || 'gemini-1.5-flash';
        }

        const geminiModel = genAI.getGenerativeModel({ model: selectedAiModelId });
        console.log(`Using AI model: ${selectedAiModelId}`);
        // --- END NEW ---

        if (imageUrl) {
            const imagePart = await urlToGenerativePart(imageUrl);
            if (imagePart) {
                modelParts.push(imagePart);
                geminiPrompt = `Analyze the provided image and generate a comprehensive and professional response in Markdown format. Structure your response with clear headings, subheadings, bolding, italics, and bulleted or numbered lists where appropriate. Aim for a detailed and well-organized explanation of the image's content. If the user also provided text, consider it as a guiding context: "${query || 'No additional text query provided.'}"`;
            } else {
                console.warn("Failed to process image URL, proceeding with text-only query.");
                geminiPrompt = `Answer the query "${query}" comprehensively and professionally in Markdown format. Structure your response with clear headings, subheadings, bolding, italics, and bulleted or numbered lists where appropriate. Aim for a detailed and well-organized explanation. If providing facts, cite them as [1], [2] etc. where appropriate.`;
            }
        } else {
            // Logic for text-only queries
            if (isPdfIntent) {
                // If PDF is requested, prioritize PDF and guide content for document
                const contentQuery = query.replace(/(make a pdf|generate pdf|create pdf|pdf file|download as pdf|save as pdf|make notes as pdf|pdf of this|export as pdf|generate a pdf for|give me a pdf)/gi, '').trim();
                geminiPrompt = `Generate comprehensive and professional content in Markdown format based on the following request: "${contentQuery || query}". Structure your response with clear headings, subheadings, bolding, italics, and bulleted or numbered lists where appropriate. Aim for a detailed and well-organized explanation. This content will be used to generate a PDF, so ensure it is suitable for a document and primarily consists of explanatory text. If code examples are relevant, include them within fenced code blocks as part of the explanation, but do not make the entire response a code block.`;
            } else if (isExplicitCodeGen) {
                // If explicitly asking for code, generate pure code
                geminiPrompt = `Generate ONLY the code for "${query}". Provide the code strictly within a Markdown fenced code block, including the language identifier (e.g., \`\`\`html, \`\`\`javascript, \`\`\`python). Do NOT include any conversational text, explanations, or additional markdown outside of the code block.`;
            } else if (isCodeRelated) {
                // If it's code-related but NOT an explicit code generation request, provide an explanation
                geminiPrompt = `Explain "${query}" comprehensively and professionally in Markdown format. Structure your response with clear headings, subheadings, bolding, italics, and bulleted or numbered lists where appropriate. Aim for a detailed and well-organized explanation. If providing facts, cite them as [1], [2] etc. where appropriate. Include code examples only if they serve to illustrate a point within the explanation, not as the sole content.`;
            } else {
                // Default text query (not PDF, not explicit code, not code-related)
                geminiPrompt = `Answer the query "${query}" comprehensively and professionally in Markdown format. Structure your response with clear headings, subheadings, bolding, italics, and bulleted or numbered lists where appropriate. Aim for a detailed and well-organized explanation. If providing facts, cite them as [1], [2] etc. where appropriate.`;
            }
        }

        modelParts.push({ text: geminiPrompt });

        const geminiResult = await geminiModel.generateContent({
            contents: [{ parts: modelParts }],
            safetySettings: safetySettings
        });
        const geminiResponse = await geminiResult.response;
        const geminiText = geminiResponse.text();

        let googleImages = [];
        let googleLinks = [];
        if (!imageUrl || (query && query.trim() !== '')) {
            const searchResults = await getGoogleSearchResults(query);
            googleImages = searchResults.images.map(img => ({
                ...img,
                src: img.src
            }));
            googleLinks = searchResults.links;
        }

        let videoThumbnail = null;
        if (query && query.toLowerCase().includes("onlyfans")) {
            videoThumbnail = {
                src: "https://via.placeholder.com/400x225?text=OnlyFans+Video+Placeholder",
                alt: "OnlyFans Video Thumbnail"
            };
        }

        const responseData = {
            answer: {
                text: geminiText,
                videoThumbnail: videoThumbnail,
            },
            images: googleImages,
            googleLinks: googleLinks
        };

        // If PDF was requested, always attempt to generate it with the Gemini text.
        if (isPdfIntent) {
            console.log("PDF intent detected. Attempting to generate PDF...");
            try {
                // Call the internal /api/generate-pdf endpoint
                const pdfResponse = await fetch(`http://localhost:${port}/api/generate-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        textContent: geminiText, // Use the content generated by Gemini
                        originalQuery: query,
                        googleLinks: googleLinks
                    })
                });

                if (pdfResponse.ok) {
                    const pdfData = await pdfResponse.json();
                    responseData.pdfUrl = pdfData.pdfUrl;
                    console.log(`Successfully generated PDF: ${pdfData.pdfUrl}`);
                } else {
                    const errorText = await pdfResponse.text();
                    console.warn(`PDF generation failed via internal call: ${pdfResponse.status} ${pdfResponse.statusText} - ${errorText}`);
                    responseData.pdfUrl = null; // Ensure pdfUrl is null on failure
                }
            } catch (err) {
                console.error("Error generating PDF automatically:", err.message);
                responseData.pdfUrl = null; // Ensure pdfUrl is null on error
            }
        } else {
            console.log("No explicit PDF intent detected in query. Skipping automatic PDF generation.");
        }

        res.json(responseData);

    } catch (error) {
        console.error("Error in API search endpoint:", error);
        if (error.message.includes("safety settings")) {
            res.status(400).json({ error: "Response blocked due to safety concerns. Please try a different query or image." });
        } else {
            res.status(500).json({ error: "Failed to get response from AI model or Google Search. Please try again." });
        }
    }
});

app.post('/api/compile', async (req, res) => {
    const { language, sourceCode, stdin } = req.body;

    if (!oneCompilerApiKey) {
        console.error("DEBUG: ONECOMPILER_API_KEY is not set. Returning 500.");
        return res.status(500).json({
            error: "OneCompiler API key is not configured on the backend.",
            solution: "Please set ONECOMPILER_API_KEY in your .env file"
        });
    }

    // Validate required fields
    if (!language || !sourceCode) {
        console.error("DEBUG: Missing language or sourceCode. Returning 400.");
        return res.status(400).json({
            error: "Missing required fields",
            required: ["language", "sourceCode"],
            received: Object.keys(req.body)
        });
    }

    // Validate language
    const supportedLanguages = [
        'python', 'javascript', 'java', 'c', 'cpp', 'go',
        'php', 'ruby', 'csharp', 'typescript', 'kotlin',
        'swift', 'rust', 'html', 'css'
    ];
    if (!supportedLanguages.includes(language.toLowerCase())) {
        console.error(`DEBUG: Unsupported language received: ${language}. Returning 400.`);
        return res.status(400).json({
            error: "Unsupported language",
            supportedLanguages,
            received: language
        });
    }

    try {
        console.log(`DEBUG (Backend): OneCompiler API Key being used: [${oneCompilerApiKey}]`); // Use [] to see if there are leading/trailing spaces

        console.log(`DEBUG: Attempting to call OneCompiler API for language: ${language}`);
        const response = await fetch('https://onecompiler-apis.p.rapidapi.com/api/v1/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': oneCompilerApiKey,
                'x-rapidapi-host': 'onecompiler-apis.p.rapidapi.com',
            },
            body: JSON.stringify({
                language: language.toLowerCase(),
                stdin: stdin || '',
                files: [{
                    name: `main.${language.toLowerCase()}`,
                    content: sourceCode
                }]
            })
        });

        console.log(`DEBUG: OneCompiler API Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorBody = await response.text();
            let parsedError = {};
            try {
                parsedError = JSON.parse(errorBody);
            } catch (e) {
                parsedError.raw = errorBody;
            }
            console.error('DEBUG: OneCompiler API returned non-OK status:', {
                status: response.status,
                statusText: response.statusText,
                apiError: parsedError
            });

            return res.status(response.status).json({
                error: parsedError.message || "Compilation failed from OneCompiler API",
                apiResponse: parsedError
            });
        }

        const data = await response.json();
        console.log('DEBUG: OneCompiler API Response Data:', data); // Log the actual response

        // FIXED: Handle the response properly based on OneCompiler's status
        if (data.status === 'success') {
            // Code executed successfully
            return res.json({
                success: true,
                status: 'success',
                stdout: data.stdout || '',
                stderr: data.stderr || '',
                executionTime: data.executionTime,
                memoryUsage: data.memory
            });
        } else {
            // Code execution failed (compilation error, runtime error, etc.)
            return res.json({
                success: false,
                status: 'failed',
                error: data.error || 'Code execution failed',
                stdout: data.stdout || '',
                stderr: data.stderr || '',
                executionTime: data.executionTime,
                memoryUsage: data.memory
            });
        }

    } catch (error) {
        console.error("DEBUG: Compilation Service Error caught in backend:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Check if the error is a network error
        if (error.name === 'FetchError' || error.message.includes('network')) {
            return res.status(504).json({
                error: "Network error when connecting to compilation service. Please check internet connection.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        return res.status(503).json({
            error: "Compilation service unavailable",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            solution: "Please try again later or check your API key"
        });
    }
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { textContent, originalQuery = '', googleLinks = [] } = req.body;

        if (!textContent || textContent.trim() === '') {
            return res.status(400).json({ error: 'Text content is required to generate a PDF.' });
        }

        /** ------------------------------------------------------------------
         * ▶  BASIC DOC SET‑UP
         * ------------------------------------------------------------------ */
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            bufferPages: true              // so we can add footers afterwards
        });

        const { left: M_LEFT, right: M_RIGHT, bottom: M_BOTTOM } = doc.page.margins;
        const pageWidth  = doc.page.width  - M_LEFT - M_RIGHT;
        const bottomEdge = doc.page.height - M_BOTTOM;

        const DEFAULT_FONT      = 'Helvetica';
        const DEFAULT_FONT_SIZE = 11;

        const resetFont = () => doc.font(DEFAULT_FONT).fontSize(DEFAULT_FONT_SIZE).fillColor('#000');

        /** Simple helper: add a new page only when needed */
        const ensureSpace = (extraH = 0) => {
            if (doc.y + extraH > bottomEdge) doc.addPage();
        };

        /** ------------------------------------------------------------------
         * ▶  INLINE MARKDOWN ( **bold** / *italic* / `code` / [link](url) )
         * ------------------------------------------------------------------ */
        const renderInlineMarkdown = (str, opts = {}) => {
            const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

            parts.forEach((segment, idx) => {
                if (!segment) return;   // skip empties

                let fontToUse = DEFAULT_FONT;
                let color     = '#000';
                let text      = segment;

                if (/^\*\*[^*]+\*\*$/.test(segment)) {
                    fontToUse = 'Helvetica-Bold';
                    text      = segment.slice(2, -2);
                } else if (/^\*[^*]+\*$/.test(segment)) {
                    fontToUse = 'Helvetica-Oblique';
                    text      = segment.slice(1, -1);
                } else if (/^`[^`]+`$/.test(segment)) {
                    fontToUse = 'Courier';
                    color     = '#d32f2f';
                    text      = segment.slice(1, -1);
                } else if (/^\[[^\]]+\]\([^)]+\)$/.test(segment)) {
                    const [, label, url] = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    doc.font('Helvetica').fillColor('#0645AD').text(label, { link: url, underline: true, continued: idx !== parts.length - 1, ...opts });
                    resetFont();
                    return;
                }

                doc.font(fontToUse).fillColor(color).text(text, { continued: idx !== parts.length - 1, ...opts });
                resetFont();
            });
        };

        /** ------------------------------------------------------------------
         * ▶  BEGIN WRITING
         * ------------------------------------------------------------------ */
        // 1. Header (very plain)
        doc.font('Helvetica-Bold').fontSize(18).text(`Query: ${originalQuery || 'AI Response'}`, { align: 'center' });
        doc.moveDown(0.8);

        resetFont();

        // 2. Loop through each line of the markdown‑ish input
        const lines = textContent.split('\n');
        let inCodeBlock = false;
        let codeBuffer  = [];

        lines.forEach(raw => {
            const line = raw.replace(/\r$/, '');     // strip CR for Windows files

            // blank line → paragraph gap
            if (!line.trim()) {
                doc.moveDown(0.5);
                return;
            }

            /* ---------- fenced code blocks ---------- */
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    // Close block: dump the buffer
                    const code = codeBuffer.join('\n');
                    const codeHeight = doc.heightOfString(code, { width: pageWidth, font: 'Courier', fontSize: 10 }) + 12;
                    ensureSpace(codeHeight);

                    doc.save()
                        .rect(M_LEFT - 2, doc.y - 2, pageWidth + 4, codeHeight + 4)
                        .fill('#f4f4f4')
                        .restore();

                    doc.font('Courier').fontSize(10).text(code, { width: pageWidth });
                    doc.moveDown(0.5);
                    resetFont();
                    inCodeBlock = false;
                    codeBuffer  = [];
                } else {
                    inCodeBlock = true;
                }
                return;
            }
            if (inCodeBlock) { codeBuffer.push(raw); return; }

            /* ---------- headings (# / ## / ###) ---------- */
            if (/^#{1,3}\s/.test(line)) {
                const level = line.match(/^#+/)[0].length;
                const text  = line.replace(/^#{1,3}\s/, '');
                const sizes = { 1: 16, 2: 14, 3: 12 };
                ensureSpace(20);
                doc.font('Helvetica-Bold').fontSize(sizes[level]).text(text);
                doc.moveDown(0.3);
                resetFont();
                return;
            }

            /* ---------- unordered list ---------- */
            if (/^[-*]\s+/.test(line)) {
                const item = line.replace(/^[-*]\s+/, '');
                const height = doc.heightOfString(item, { width: pageWidth - 12 });
                ensureSpace(height + 6);
                doc.circle(M_LEFT - 2, doc.y + 4, 2).fill('#000');
                doc.x = M_LEFT + 10;
                renderInlineMarkdown(item, { width: pageWidth - 12 });
                doc.x = M_LEFT;
                doc.moveDown(0.1);
                return;
            }

            /* ---------- ordered list ---------- */
            const olMatch = line.match(/^(\d+)\.\s+(.*)/);
            if (olMatch) {
                const [, num, item] = olMatch;
                const height = doc.heightOfString(item, { width: pageWidth - 18 });
                ensureSpace(height + 6);
                doc.font('Helvetica-Bold').text(`${num}.`, M_LEFT, doc.y, { width: 16 });
                doc.x = M_LEFT + 18;
                resetFont();
                renderInlineMarkdown(item, { width: pageWidth - 18 });
                doc.x = M_LEFT;
                doc.moveDown(0.1);
                return;
            }

            /* ---------- blockquote ---------- */
            if (/^>\s/.test(line)) {
                const quote = line.replace(/^>\s/, '');
                const height = doc.heightOfString(quote, { width: pageWidth - 10 });
                ensureSpace(height + 6);
                doc.rect(M_LEFT, doc.y, 3, height + 3).fill('#777');
                doc.x = M_LEFT + 8;
                doc.font('Helvetica-Oblique').fillColor('#555');
                renderInlineMarkdown(quote, { width: pageWidth - 10 });
                doc.x = M_LEFT;
                resetFont();
                doc.moveDown(0.1);
                return;
            }

            /* ---------- horizontal rule ---------- */
            if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
                ensureSpace(10);
                doc.moveDown(0.2);
                doc.moveTo(M_LEFT, doc.y).lineTo(M_LEFT + pageWidth, doc.y).strokeColor('#888').stroke();
                doc.moveDown(0.3);
                return;
            }

            /* ---------- plain paragraph ---------- */
            renderInlineMarkdown(line, { width: pageWidth });
            doc.moveDown(0.2);
        });

        /* ---------- Optional “Relevant Links” section ---------- */
        if (googleLinks.length) {
            ensureSpace(30);
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold').fontSize(13).text('Relevant Links:');
            resetFont();
            doc.moveDown(0.4);

            googleLinks.forEach((l, i) => {
                doc.font('Helvetica-Bold').text(`${i + 1}. ${l.title || 'Link'}`, { width: pageWidth });
                if (l.url) {
                    doc.fillColor('#0645AD').text(l.url, { link: l.url, underline: true, width: pageWidth, indent: 14 });
                }
                if (l.snippet) {
                    resetFont();
                    doc.text(l.snippet, { width: pageWidth, indent: 14 });
                }
                resetFont();
                doc.moveDown(0.4);
            });
        }

        /** ------------------------------------------------------------------
         * ▶  FOOTERS (page x of y)
         * ------------------------------------------------------------------ */
        const range = doc.bufferedPageRange();              // { start, count }
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(range.start + i);
            const footerY = doc.page.height - 40;

            doc.font('Helvetica').fontSize(9).fillColor('#777')
                .text(`Page ${i + 1} of ${range.count}`, M_LEFT, footerY, {
                    width: pageWidth,
                    align: 'center'
                });
        }

        /** ------------------------------------------------------------------
         * ▶  SAVE + RESPOND
         * ------------------------------------------------------------------ */
        if (!fs.existsSync(GENERATED_PDF_DIR)) fs.mkdirSync(GENERATED_PDF_DIR, { recursive: true });
        const pdfFileName = `response_${uuidv4()}.pdf`;
        const pdfFilePath = path.join(GENERATED_PDF_DIR, pdfFileName);
        doc.pipe(fs.createWriteStream(pdfFilePath));
        doc.end();

        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        res.json({ pdfUrl: `${appBaseUrl}/generated_pdfs/${pdfFileName}` });
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({ error: 'Internal server error during PDF generation.' });
    }
});
// --- Use Authentication Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/settings' , settingRoutes);
app.use('/api/razorpay', razorpayRoutes)
// Start the server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});