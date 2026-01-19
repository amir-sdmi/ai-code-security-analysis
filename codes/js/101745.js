import express from "express";
import connectDB from "./db.js";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from 'multer';
import fs from 'fs';
import PDF from './models/PDF.js';
import pdfParse from 'pdf-parse';
// import OpenAI from "openai"; // Use DeepSeek

dotenv.config();
connectDB();

const app = express();
const upload = multer({ dest: 'uploads/' });
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created uploads/ folder');
}
// const openai = new OpenAI({ apiKey: process.env.OpenAI_API_KEY });

app.use(express.json());
app.use(cors({ origin: ["http://localhost:5174", "https://yourfrontenddomain.com"],
                credentials: true }));
app.use(cookieParser());

const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

app.post("/api/users", async (req, res) => {
    const { email } = req.body;
    try {
        const user = new User({ email });
        await user.save();
        res.status(201).json({ message: "User saved" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save user" });
    }
});

// Register (create hashed password)
app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcryptjs.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: "User registered" });
    } catch (err) {
      res.status(400).json({ error: "Registration failed" });
    }
  });
  
  // Login
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });
  
      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
  
      const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: true, sameSite: "Strict" });
      res.json({ message: "Logged in successfully", user });
    } catch {
      res.status(500).json({ error: "Login error" });
    }
  });

app.post('/upload', upload.single('pdf'), async (req, res) => {
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
  
    try {
      const data = await pdfParse(dataBuffer);
      const newPdf = new PDF({
        content: data.text,
        pageCount: data.numpages,
      });
  
      await newPdf.save();

      try { // delete temp file
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Failed to delete temp file', e);
      }
  
      res.json({ 
        text: data.text.slice(1000, 4000), // amount of words to be displayed
        numpages: data.numpages,
        pdfId: newPdf._id
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse PDF' });
    }
  });
  
app.post('/generate-questions/:id', async (req, res) => {
  try {
    const meta = await PDF.findById(req.params.id);
    if (!meta) return res.status(404).json({ error: "PDF not found" });
  } catch (err) {
    console.error(err);
  }
    const dau = "https://api.deepseek.com/v1/chat/completions"; // Check latest API URL
    const dak = process.env.DEEPSEEK_API_KEY;
    
    if (!dak) {
        throw new Error("DeepSeek API key not configured");
    }

    // Construct the prompt
    const prompt = `
	You are a question generation expert.
      
      Based on the academic content below, create 5 well-formed questions:
      - Include at least one multiple-choice question (with 4 options and a correct answer)
      - Include a short answer question
      - Use different formats: true/false, open-ended, fill-in-the-blank
      - Ensure the questions are varied and meaningful
      

	Return the output in JSON format like this:
      		[
        		{
         			"type": "multiple choice",
         			"question": "...",
         			"options": ["A", "B", "C", "D"],
         			"answer": "B"
         },
        {
         "type": "short answer",
         "question": "...",
         "answer": "..."
        }
      // and so on...
      ]
    `;
    
    try {
        // Call DeepSeek API directly via HTTP
        const response = await axios.post(
            dau,
            {
                model: "deepseek-chat", // Verify the correct model name
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: "json_object" } // If supported
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${dak}`
                }
            }
        );

        // Extract and parse the response
        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("DeepSeek API Error:", error.response?.data || error.message);
        throw new Error("Failed to generate questions with DeepSeek AI");
    }
});

app.get('/pdf/:id/questions', async (req, res) => {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'Not found' });
  
    res.json({ questions: pdf.questions });
  });
  
  

app.listen(5000, () => 
  {
    console.log("Server running on port 5000")
});