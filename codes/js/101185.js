import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = "AIzaSyBD74WICdmvxs4IbzOlWMR9Mfb4Mx6F22I";
const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini Pro Vision for multimodal support
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Function to parse file content based on type
const parseFileContent = (fileContent, fileType) => {
  // For image types, return as-is (base64)
  if (fileType.startsWith('image/')) {
    return { inlineData: { mimeType: fileType, data: fileContent.split(',')[1] } };
  }

  // For text-based files, return as text
  if (fileType === 'text/plain' || 
      fileType == 'text/csv' ||
      fileType.includes('word') || 
      fileType === 'application/pdf') {
    return fileContent;
  }


  return null;
};

// Modified runChat to support chat history and abort controller
async function runChat(prompt, fileContent = null, fileType = null, chatHistory = [], abortSignal = null) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
    });

    let parts = [{ text: prompt }];

    if (fileContent) {
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        parts.push({
          inlineData: {
            mimeType: fileType,
            data: fileContent.split(',')[1]
          }
        });
      }
    }

    // Use streaming for real-time response
    const result = await chatSession.sendMessageStream(parts);
    
    let fullResponse = '';
    
    // Process the stream
    for await (const chunk of result.stream) {
      // Check if generation should be stopped
      if (abortSignal?.aborted) {
        throw new Error('Generation aborted');
      }
      
      const chunkText = chunk.text();
      fullResponse += chunkText;
      
      // Emit each chunk for real-time display
      if (typeof chunk.emit === 'function') {
        chunk.emit('chunk', chunkText);
      }
    }
    
    return fullResponse;
  } catch (error) {
    if (error.message === 'Generation aborted') {
      console.log('Generation was stopped by user');
      return '[Generation stopped]';
    }
    console.error('Error in Gemini API call:', error);
    throw error;
  }
}

export default runChat;