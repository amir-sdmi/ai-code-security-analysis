import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

class Gemini {
  // Private static instance (auto-instantiated singleton)
  static instance = new Gemini();

  // Private constructor to prevent direct instantiation
  constructor() {
    if (Gemini.instance) {
      throw new Error('Use Gemini.getInstance() to access the instance of this class');
    }
    this.name = 'Gemini';
  }

  // Static method to get the single instance of the class
  static getInstance() {
    return Gemini.instance;
  }

  // Helper method to convert a file to the generative part required by the API
  fileToGenerativePart(path, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType,
      },
    };
  }

  // Method to generate content using a prompt and an optional image
  async getGeminiTextOutput(prompt, imagePath = null, mimeType = null) {
    console.log("imagepath : " , imagePath)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


    // package for any kinda image or video . chatgpt this 
    // npm install mime-types

    let result;
    if (imagePath && mimeType) {
        console.log("imagepath", imagePath);
      const imagePart = this.fileToGenerativePart(imagePath, mimeType);
      result = await model.generateContent([prompt, imagePart]);
      
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Failed to delete file ${imagePath}:`, err);
        } else {
          console.log(`File ${imagePath} deleted successfully.`);
        }
      });
    } else {
      result = await model.generateContent([prompt]);
    }

    return result.response.text();
  }
}

// Export the Gemini class using CommonJS
export default  Gemini;

// Example usage in another file would be:
// const Gemini = require('./path/to/gemini');
// const geminiInstance = Gemini.getInstance();
// geminiInstance.getGeminiTextOutput("Sample input", "/path/to/image.jpg", "image/jpeg").then(console.log);
