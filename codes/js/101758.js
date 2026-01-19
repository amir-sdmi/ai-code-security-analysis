chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background: Received message:', request);
  
  if (request.action === 'summarize') {
    console.log('Background: Processing summarization request');
    
    handleSummarization(request)
      .then(summary => {
        console.log('Background: Summarization successful, sending response');
        console.log('Background: Summary length:', summary ? summary.length : 'null');
        if (!summary || summary.trim().length === 0) {
          console.error('Background: Empty summary generated');
          sendResponse({ success: false, error: 'Empty summary generated' });
        } else {
          sendResponse({ success: true, summary: summary });
        }
      })
      .catch(error => {
        console.error('Background: Summarization error:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  } else {
    console.log('Background: Unknown action:', request.action);
    sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function handleSummarization(request) {
  const { text, context = '', mode = 'summarize', hasImage = false, imageData = null } = request;
  console.log('Received request:', request);
  console.log('Has image:', hasImage, 'Image data:', !!imageData);
  
  try {
    // Get API key from storage
    const apiKey = await getApiKey();
    
    console.log('Using API Key:', apiKey ? 'Configured' : 'Missing');
    if (!apiKey) {
      throw new Error('API key not found. Please set your Gemini API key in the extension popup.');
    }
    
    // Construct the prompt based on mode
    let prompt = '';
    
    if (mode === 'explain-code') {
      prompt = context.trim() 
        ? `Please explain this code clearly with context: "${context}"\n\nCode:\n${text}`
        : `Please explain this code step by step, including what it does, how it works, and any important concepts:\n\n${text}`;
    } else if (mode === 'complete-code') {
      prompt = context.trim()
        ? `Please complete this code with context: "${context}"\n\nIncomplete code:\n${text}`
        : `Please complete this code. Provide the missing parts and make it functional:\n\n${text}`;
    } else if (mode === 'fix-code') {
      prompt = context.trim()
        ? `Please fix any bugs or issues in this code with context: "${context}"\n\nCode to fix:\n${text}`
        : `Please identify and fix any bugs, syntax errors, or issues in this code:\n\n${text}`;
    } else if (mode === 'fix') {
      prompt = context.trim()
        ? `Please fix or improve the following text considering: "${context}"\n\nText to fix:\n${text}`
        : `Please fix grammar, spelling, and improve clarity of the following text:\n\n${text}`;
    } else if (mode === 'quiz-answer') {
      if (hasImage && imageData) {
        prompt = `Please analyze this image and text to provide a direct, accurate answer to this quiz question. Be concise and factual.\n\nQuestion text: ${text}\n\nContext: ${context || 'Quiz question with image'}`;
      } else {
        prompt = context.trim()
          ? `${context}\n\nQuestion: ${text}`
          : `Please provide a direct, accurate answer to this quiz question. Be concise and factual:\n\nQuestion: ${text}`;
      }
    } else {
      if (hasImage && imageData) {
        prompt = `Please analyze this image and text together to provide a comprehensive summary.\n\nText: ${text}\n\nContext: ${context || 'Image and text analysis'}`;
      } else {
        prompt = context.trim()
          ? `Please summarize the following text, keeping in mind this context: "${context}"\n\nText to summarize:\n${text}`
          : `Please provide a concise summary of the following text:\n\n${text}`;
      }
    }
    
    console.log('Constructed prompt:', prompt);
    
    // Prepare the request body
    let requestBody;
    
    if (hasImage && imageData && imageData.base64) {
      console.log('Preparing multimodal request with image');
      // Use Gemini Vision for image + text analysis
      const base64Data = imageData.base64.split(',')[1]; // Remove data:image/...;base64, prefix
      
      requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
    } else {
      // Regular text-only request
      requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
    }
    
    // Choose the appropriate model based on whether we have an image
    const model = hasImage && imageData ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
    console.log('Using model:', model);
    
    // Make API call to Gemini
    console.log('Making API call to Gemini...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('API Response Data:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure:', data);
      throw new Error('No summary generated from the API');
    }
    
    const summary = data.candidates[0].content.parts[0].text;
    console.log('Generated summary:', summary);
    return summary;
    
  } catch (error) {
    console.error('Error in handleSummarization:', error);
    throw error;
  }
}

async function getApiKey() {
  try {
    const result = await chrome.storage.local.get(['geminiApiKey']);
    return result.geminiApiKey;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Summarizer Extension installed');
  
  // Check if user has configured an API key
  try {
    const result = await chrome.storage.local.get(['geminiApiKey']);
    if (!result.geminiApiKey) {
      console.log('No API key found. User needs to configure it in the popup.');
    } else {
      console.log('API key is already configured');
    }
  } catch (error) {
    console.error('Failed to check API key configuration:', error);
  }
});
