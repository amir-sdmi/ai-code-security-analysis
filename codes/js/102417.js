const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { PineconeClient } = require('@pinecone-database/pinecone');

// Initialize Gemini API with environment variable or config
const API_KEY = process.env.GEMINI_API_KEY || require('../config/config').llm.geminiApiKey;
const genAI = new GoogleGenerativeAI(API_KEY);

// Document processing service
class DocumentProcessingService {
  constructor() {
    this.supportedFormats = {
      // Text formats
      'txt': this.processTextFile,
      'md': this.processTextFile,
      'json': this.processTextFile,
      'csv': this.processTextFile,
      
      // Document formats
      'docx': this.processDocxFile,
      'pdf': this.processPdfFile,
      'xlsx': this.processExcelFile,
      'pptx': this.processPptxFile,
      
      // Image formats
      'png': this.processImageFile,
      'jpg': this.processImageFile,
      'jpeg': this.processImageFile,
      'gif': this.processImageFile,
      'webp': this.processImageFile,
      
      // Video formats
      'mp4': this.processVideoFile,
      'webm': this.processVideoFile,
    };
    
    // Initialize OCR worker
    this.ocrWorker = null;
  }
  
  // Main processing method
  async processFile(filePath, options = {}) {
    try {
      const fileExt = path.extname(filePath).toLowerCase().substring(1);
      
      if (!this.supportedFormats[fileExt]) {
        throw new Error(`Unsupported file format: ${fileExt}`);
      }
      
      console.log(`Processing ${fileExt} file: ${filePath}`);
      
      // Call the appropriate processing method based on file extension
      const result = await this.supportedFormats[fileExt].call(this, filePath, options);
      
      return {
        success: true,
        data: result,
        metadata: {
          filename: path.basename(filePath),
          extension: fileExt,
          size: fs.statSync(filePath).size,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Process plain text files
  async processTextFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      text: content,
      chunks: this.chunkText(content)
    };
  }
  
  // Process DOCX files
  async processDocxFile(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;
    return {
      text: content,
      chunks: this.chunkText(content)
    };
  }
  
  // Process PDF files
  async processPdfFile(filePath, options = {}) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    let content = pdfData.text;
    
    // If text content is minimal, it might be a scanned PDF
    if (content.trim().length < 100 && options.useOcr) {
      console.log('PDF appears to be image-based, using OCR...');
      content = await this.performOcr(filePath);
    }
    
    return {
      text: content,
      metadata: {
        pageCount: pdfData.numpages,
        info: pdfData.info
      },
      chunks: this.chunkText(content)
    };
  }
  
  // Process Excel files
  async processExcelFile(filePath) {
    const workbook = xlsx.readFile(filePath);
    const result = {
      sheets: {},
      text: ''
    };
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      result.sheets[sheetName] = jsonData;
      
      // Convert sheet to text for embedding
      const sheetText = `Sheet: ${sheetName}\n` + 
        jsonData.map(row => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')).join('\n');
      
      result.text += sheetText + '\n\n';
    });
    
    result.chunks = this.chunkText(result.text);
    return result;
  }
  
  // Process PowerPoint files
  async processPptxFile(filePath) {
    // This is a placeholder - in a real implementation, you would use a library
    // like pptx-parser or officegen to extract text from PPTX files
    return {
      text: "PowerPoint processing not fully implemented",
      chunks: []
    };
  }
  
  // Process image files
  async processImageFile(filePath, options = {}) {
    // Extract text from image using OCR if requested
    let textContent = '';
    if (options.extractText) {
      textContent = await this.performOcr(filePath);
    }
    
    // Generate image description using Gemini
    const imageDescription = await this.generateImageDescription(filePath);
    
    return {
      text: textContent,
      description: imageDescription,
      chunks: textContent ? this.chunkText(textContent) : []
    };
  }
  
  // Process video files
  async processVideoFile(filePath) {
    // This is a placeholder - in a real implementation, you would use a library
    // like ffmpeg to extract frames and audio from video files
    return {
      text: "Video processing not fully implemented",
      chunks: []
    };
  }
  
  // Perform OCR on an image
  async performOcr(filePath) {
    if (!this.ocrWorker) {
      this.ocrWorker = await createWorker();
      await this.ocrWorker.loadLanguage('eng');
      await this.ocrWorker.initialize('eng');
    }
    
    const { data } = await this.ocrWorker.recognize(filePath);
    return data.text;
  }
  
  // Generate image description using Gemini
  async generateImageDescription(imagePath) {
    try {
      const imageBytes = fs.readFileSync(imagePath);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = "Describe this image in detail, including any visible text, objects, people, and context.";
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: Buffer.from(imageBytes).toString('base64'),
            mimeType: this.getMimeType(imagePath)
          }
        }
      ]);
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating image description:', error);
      return 'Failed to generate image description';
    }
  }
  
  // Get MIME type based on file extension
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  // Chunk text for embedding
  chunkText(text, options = {}) {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      preserveParagraphs = true
    } = options;
    
    if (!text || text.length === 0) {
      return [];
    }
    
    let chunks = [];
    
    if (preserveParagraphs) {
      // Split by paragraphs first
      const paragraphs = text.split(/\n\s*\n/);
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size, save current chunk and start new one
        if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          // Start new chunk with overlap from previous chunk
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-Math.floor(chunkOverlap / 5)); // Approximate words in overlap
          currentChunk = overlapWords.join(' ') + ' ' + paragraph;
        } else {
          // Add paragraph to current chunk
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
      }
      
      // Add the last chunk if it's not empty
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    } else {
      // Simple chunking by character count
      for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
        const chunk = text.slice(i, i + chunkSize);
        chunks.push(chunk.trim());
      }
    }
    
    // Add metadata to chunks
    return chunks.map((chunk, index) => ({
      text: chunk,
      index,
      length: chunk.length
    }));
  }
  
  // Clean up resources
  async close() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

// RAG service for document retrieval
class RAGService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
    this.chatModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    this.pineconeClient = null;
    this.pineconeIndex = null;
  }
  
  // Initialize Pinecone client
  async initPinecone(apiKey, environment, indexName) {
    this.pineconeClient = new PineconeClient();
    await this.pineconeClient.init({
      apiKey,
      environment
    });
    
    // Get or create index
    const indexList = await this.pineconeClient.listIndexes();
    if (!indexList.includes(indexName)) {
      // In a real implementation, you would create the index if it doesn't exist
      console.log(`Index ${indexName} does not exist, would create it here`);
    }
    
    this.pineconeIndex = this.pineconeClient.Index(indexName);
    return this.pineconeIndex;
  }
  
  // Generate embeddings for text
  async generateEmbedding(text) {
    const result = await this.embeddingModel.embedContent(text);
    const embedding = result.embedding.values;
    return embedding;
  }
  
  // Index document chunks
  async indexDocument(documentId, chunks, metadata = {}) {
    if (!this.pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    const vectors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.generateEmbedding(chunk.text);
      
      vectors.push({
        id: `${documentId}_chunk_${i}`,
        values: embedding,
        metadata: {
          ...metadata,
          documentId,
          chunkIndex: i,
          text: chunk.text.slice(0, 1000) // Store preview of text in metadata
        }
      });
    }
    
    // Upsert vectors in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.pineconeIndex.upsert({
        upsertRequest: {
          vectors: batch
        }
      });
    }
    
    return {
      documentId,
      chunksIndexed: chunks.length
    };
  }
  
  // Query for similar documents
  async querySimilar(query, options = {}) {
    if (!this.pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }
    
    const {
      topK = 5,
      threshold = 0.7,
      filter = {}
    } = options;
    
    // Generate embedding for query
    const embedding = await this.generateEmbedding(query);
    
    // Query Pinecone
    const queryResponse = await this.pineconeIndex.query({
      queryRequest: {
        vector: embedding,
        topK,
        includeMetadata: true,
        filter
      }
    });
    
    // Filter results by similarity threshold
    const results = queryResponse.matches.filter(match => match.score >= threshold);
    
    return results;
  }
  
  // Generate response with RAG
  async generateResponse(query, options = {}) {
    const { includeContext = true, maxTokens = 500 } = options;
    
    try {
      let context = '';
      let sources = [];
      
      // Try to get context from RAG if Pinecone is initialized and includeContext is true
      if (includeContext && this.pineconeIndex) {
        try {
          const similarDocs = await this.querySimilar(query, options);
          context = similarDocs.map(doc => doc.metadata.text).join('\n\n');
          sources = similarDocs.map(doc => ({
            documentId: doc.metadata.documentId,
            similarity: doc.score,
            snippet: doc.metadata.text.slice(0, 200) + '...'
          }));
        } catch (error) {
          console.log('RAG context retrieval failed, falling back to simple generation:', error.message);
        }
      }
      
      // Generate response with or without context
      let prompt;
      if (context && includeContext) {
        prompt = `
        You are an AI assistant with access to the following information:
        
        ${context}
        
        Based on the information provided above, please answer the following question:
        ${query}
        
        If the answer cannot be determined from the information provided, please use your general knowledge to provide a helpful response.
        `;
      } else {
        prompt = `
        You are a helpful AI assistant. Please answer the following question clearly and concisely:
        ${query}
        `;
      }
      
      const result = await this.chatModel.generateContent(prompt);
      const response = await result.response;
      
      return {
        answer: response.text(),
        sources: sources
      };
    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw error;
    }
  }
  
  // Hybrid search (keyword + semantic)
  async hybridSearch(query, options = {}) {
    // This is a simplified implementation of hybrid search
    // In a real implementation, you would combine BM25 or keyword search with vector search
    
    // For now, we'll just do semantic search
    return this.querySimilar(query, options);
  }
}

// Voice processing service
class VoiceService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  
  // Speech-to-text conversion
  // In a real implementation, you would use a service like Google Cloud Speech-to-Text
  async speechToText(audioFilePath) {
    // Placeholder implementation
    return {
      text: "Speech to text conversion would happen here",
      confidence: 0.95
    };
  }
  
  // Text-to-speech conversion
  // In a real implementation, you would use a service like Google Cloud Text-to-Speech
  async textToSpeech(text, options = {}) {
    // Placeholder implementation
    return {
      audioContent: "Base64 encoded audio would be here",
      duration: 2.5
    };
  }
  
  // Process voice commands
  async processVoiceCommand(command) {
    // Use Gemini to understand the intent of the voice command
    const prompt = `
    Identify the intent and entities in this voice command:
    "${command}"
    
    Return a JSON object with the following structure:
    {
      "intent": "the primary action or intent",
      "entities": {
        "key1": "value1",
        "key2": "value2"
      }
    }
    `;
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    try {
      // Extract JSON from response
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing voice command response:', error);
      return {
        intent: 'unknown',
        entities: {}
      };
    }
  }
}

// Multimodal processing service
class MultimodalService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  
  // Process image and text query
  async processMultimodalQuery(imageFilePath, textQuery) {
    try {
      const imageBytes = fs.readFileSync(imageFilePath);
      
      const result = await this.visionModel.generateContent([
        textQuery,
        {
          inlineData: {
            data: Buffer.from(imageBytes).toString('base64'),
            mimeType: this.getMimeType(imageFilePath)
          }
        }
      ]);
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error processing multimodal query:', error);
      return 'Failed to process multimodal query';
    }
  }
  
  // Analyze image content
  async analyzeImage(imageFilePath) {
    try {
      const imageBytes = fs.readFileSync(imageFilePath);
      
      const prompt = `
      Analyze this image and provide the following information:
      1. A detailed description of what's in the image
      2. Any text visible in the image
      3. Main objects and their approximate locations
      4. Any people, their approximate ages, genders, and what they're doing
      5. The overall scene or setting
      6. Any notable colors, styles, or artistic elements
      
      Format the response as a JSON object with these keys: description, text, objects, people, scene, style
      `;
      
      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: Buffer.from(imageBytes).toString('base64'),
            mimeType: this.getMimeType(imageFilePath)
          }
        }
      ]);
      
      const response = await result.response;
      
      try {
        // Extract JSON from response
        const jsonMatch = response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in response');
      } catch (jsonError) {
        console.error('Error parsing JSON from image analysis:', jsonError);
        return {
          description: response.text(),
          text: '',
          objects: [],
          people: [],
          scene: '',
          style: ''
        };
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        description: 'Failed to analyze image',
        text: '',
        objects: [],
        people: [],
        scene: '',
        style: ''
      };
    }
  }
  
  // Get MIME type based on file extension
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = {
  DocumentProcessingService,
  RAGService,
  VoiceService,
  MultimodalService
};
