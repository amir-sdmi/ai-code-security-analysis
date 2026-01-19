const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const os = require('os');

// Initialize Express app
const app = express();
let port = process.env.PORT || 3000;

// Check if running on Vercel or other serverless environment
// Vercel sets NODE_ENV to 'production' and has a read-only filesystem
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || 
                    (process.env.NODE_ENV === 'production' && !fs.accessSync('/', fs.constants.W_OK, (err) => !!err));

console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  isServerless: isServerless
});

// Use memory storage for serverless environments, disk storage otherwise
let storage;
let uploadsDir = 'uploads/';

try {
  // Try to determine if we're in a read-only environment
  if (isServerless) {
    console.log("Using memory storage for serverless environment");
    storage = multer.memoryStorage();
    // Use temp directory for serverless if needed
    uploadsDir = os.tmpdir();
  } else {
    console.log("Using disk storage for local environment");
    // Only try to create directory if we're not in a read-only environment
    if (!fs.existsSync('uploads')) {
      try {
        fs.mkdirSync('uploads');
        console.log("Created uploads directory");
      } catch (dirError) {
        console.error("Error creating uploads directory:", dirError);
        // Fallback to memory storage if directory creation fails
        storage = multer.memoryStorage();
        isServerless = true; // Treat as serverless if we can't write to disk
      }
    }
    
    if (!isServerless) {
      storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
          cb(null, Date.now() + path.extname(file.originalname));
        }
      });
    }
  }
} catch (fsError) {
  console.error("Filesystem error, using memory storage:", fsError);
  storage = multer.memoryStorage();
  isServerless = true; // Treat as serverless if we can't access the filesystem
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Serve static files
app.use(express.static('public'));
if (!isServerless) {
  app.use('/uploads', express.static('uploads'));
}

// API key for Gemini
const API_KEY = 'AIzaSyCFaxdXkeSugvh1XEfvy5OK-DE7TiYGcHw';
const genAI = new GoogleGenerativeAI(API_KEY);

// Endpoint to process image
app.post('/remove-watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    let imageBuffer;
    let imagePath;
    let mimeType = req.file.mimetype;
    
    if (isServerless || !req.file.path) {
      // On serverless, the file is in memory
      imageBuffer = req.file.buffer;
      imagePath = null;
    } else {
      // On local environment, read from disk
      imagePath = req.file.path;
      imageBuffer = fs.readFileSync(imagePath);
    }
    
    // Get the selected hairstyle from the request
    const hairstyle = req.body.hairstyle || 'long bob';
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Prepare the content parts with the selected hairstyle
    const contents = [
      { text: `Change the hairstyle of the person in the image to a ${hairstyle} hairstyle` },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      }
    ];

    // Set responseModalities to include "Image" so the model can generate an image
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ['Text', 'Image']
      },
    });
    
    console.log("Sending request to Gemini API...");
    
    try {
      const response = await model.generateContent(contents);
      console.log("API Response received");
      
      let processedImageData = null;
      let responseText = "";
      
      // Process each part of the response
      if (response.response.candidates && 
          response.response.candidates[0] && 
          response.response.candidates[0].content && 
          response.response.candidates[0].content.parts) {
        
        for (const part of response.response.candidates[0].content.parts) {
          // Based on the part type, either collect the text or save the image
          if (part.text) {
            responseText += part.text;
            console.log("Text response:", part.text);
          } else if (part.inlineData) {
            processedImageData = part.inlineData;
            console.log("Image found in response");
          }
        }
      }
      
      if (processedImageData) {
        let processedImagePath;
        let processedImageUrl;
        
        if (isServerless) {
          // On serverless, return the base64 data directly
          processedImageUrl = `data:${processedImageData.mimeType};base64,${processedImageData.data}`;
        } else {
          // On local environment, save to disk
          try {
            processedImagePath = `uploads/processed_${path.basename(imagePath || `image_${Date.now()}.jpg`)}`;
            fs.writeFileSync(processedImagePath, Buffer.from(processedImageData.data, 'base64'));
            processedImageUrl = `/${processedImagePath}`;
          } catch (writeError) {
            console.error("Error writing processed image to disk:", writeError);
            // Fallback to base64 if disk write fails
            processedImageUrl = `data:${processedImageData.mimeType};base64,${processedImageData.data}`;
          }
        }
        
        // Return the processed image
        return res.json({
          originalImage: isServerless 
            ? `data:${mimeType};base64,${base64Image}` 
            : `/${imagePath}`,
          processedImage: processedImageUrl,
          source: "Generated by Gemini 2.0 Flash Exp Image Generation",
          text: responseText
        });
      } else {
        console.log("No image found in the response");
        throw new Error("No image in response from model");
      }
    } catch (apiError) {
      console.error("Error with model:", apiError);
      
      // Check if the error is related to quota or rate limits
      const errorMessage = apiError.message || "";
      if (errorMessage.includes("quota") || 
          errorMessage.includes("rate") || 
          errorMessage.includes("limit") ||
          errorMessage.includes("exceeded")) {
        return res.status(429).json({ 
          error: "Requests exceeded. Please try again after a minute." 
        });
      }
      
      // For other errors
      return res.status(500).json({ 
        error: "Unable to process your image. Please try again later." 
      });
    }
    
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Function to start the server and try different ports if needed
function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`Server running at http://localhost:${portToUse}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToUse} is busy, trying port ${portToUse + 1}`);
      startServer(portToUse + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server with the initial port
startServer(port);