// Background script for AI Auto Fill
// console.log("AI Auto Fill: Background script loaded");

// Store the API clients
let openaiClient = null;
let claudeClient = null;

// Function to initialize the appropriate AI client based on settings
async function initializeAIClient() {
  // Get the saved settings
  const data = await chrome.storage.sync.get([
    "aiProvider",
    "geminiApiKey",
    "openaiApiKey",
    "claudeApiKey",
    "geminiModel",
    "openaiModel",
    "claudeModel",
  ]);

  const provider = data.aiProvider || "gemini";

  switch (provider) {
    case "gemini":
      // We'll handle Gemini API directly without SDK
      break;

    case "openai":
      // OpenAI doesn't have a native JS SDK, we'll use fetch API
      if (data.openaiApiKey) {
        openaiClient = {
          apiKey: data.openaiApiKey,
          model: data.openaiModel || "gpt-3.5-turbo",
        };
      }
      break;

    case "claude":
      // Claude doesn't have a native JS SDK, we'll use fetch API
      if (data.claudeApiKey) {
        claudeClient = {
          apiKey: data.claudeApiKey,
          model: data.claudeModel || "claude-instant",
        };
      }
      break;
  }

  return provider;
}

// Function to generate content using Gemini
async function generateWithGemini(fieldContext, customPrompt = null) {
  let retries = 2; // Number of retry attempts
  let lastError = null;

  while (retries >= 0) {
    try {
      const data = await chrome.storage.sync.get([
        "geminiApiKey",
        "geminiModel",
      ]);
      const model = data.geminiModel || "gemini-pro";
      const apiKey = data.geminiApiKey;

      if (!apiKey) {
        return { error: "Gemini API key not configured" };
      }

      // Create a prompt based on the field context
      const prompt = createPromptFromFieldContext(fieldContext, customPrompt);
      // console.log("AI Auto Fill: Using model", model);

      // Call Gemini API directly without SDK with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();

      if (
        responseData &&
        responseData.candidates &&
        responseData.candidates.length > 0 &&
        responseData.candidates[0].content &&
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts.length > 0
      ) {
        return {
          generatedText: responseData.candidates[0].content.parts[0].text,
        };
      } else {
        console.error(
          "Unexpected Gemini API response structure:",
          responseData
        );
        return { error: "Failed to generate content with Gemini" };
      }
    } catch (error) {
      console.error(
        `Error generating with Gemini (attempt ${2 - retries}/2):`,
        error
      );
      lastError = error;
      retries--;

      // If we have retries left, wait before trying again
      if (retries >= 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return {
    error:
      lastError?.message ||
      "Error generating with Gemini after multiple attempts",
  };
}

// Function to generate content using OpenAI
async function generateWithOpenAI(fieldContext, customPrompt = null) {
  try {
    const data = await chrome.storage.sync.get(["openaiApiKey", "openaiModel"]);
    const model = data.openaiModel || "gpt-3.5-turbo";

    if (!data.openaiApiKey) {
      return { error: "OpenAI API key not configured" };
    }

    // Create a prompt based on the field context
    const prompt = createPromptFromFieldContext(fieldContext, customPrompt);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates content for form fields.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    const responseData = await response.json();

    if (responseData.choices && responseData.choices.length > 0) {
      return { generatedText: responseData.choices[0].message.content };
    } else {
      return { error: "Failed to generate content with OpenAI" };
    }
  } catch (error) {
    console.error("Error generating with OpenAI:", error);
    return { error: error.message || "Error generating with OpenAI" };
  }
}

// Function to generate content using Claude
async function generateWithClaude(fieldContext, customPrompt = null) {
  try {
    const data = await chrome.storage.sync.get(["claudeApiKey", "claudeModel"]);
    const model = data.claudeModel || "claude-instant";

    if (!data.claudeApiKey) {
      return { error: "Claude API key not configured" };
    }

    // Create a prompt based on the field context
    const prompt = createPromptFromFieldContext(fieldContext, customPrompt);

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": data.claudeApiKey,
      },
      body: JSON.stringify({
        model: model,
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 500,
        stop_sequences: ["\n\nHuman:"],
      }),
    });

    const responseData = await response.json();

    if (responseData.completion) {
      return { generatedText: responseData.completion.trim() };
    } else {
      return { error: "Failed to generate content with Claude" };
    }
  } catch (error) {
    console.error("Error generating with Claude:", error);
    return { error: error.message || "Error generating with Claude" };
  }
}

// Function to enhance existing content
async function enhanceContent(fieldContext, currentContent) {
  // Determine which AI provider to use
  const provider = await initializeAIClient();

  switch (provider) {
    case "gemini":
      return enhanceWithGemini(fieldContext, currentContent);
    case "openai":
      return enhanceWithOpenAI(fieldContext, currentContent);
    case "claude":
      return enhanceWithClaude(fieldContext, currentContent);
    default:
      return { error: "No AI provider configured" };
  }
}

// Function to enhance content using Gemini
async function enhanceWithGemini(fieldContext, currentContent) {
  try {
    const data = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);
    const model = data.geminiModel || "gemini-pro";
    const apiKey = data.geminiApiKey;

    if (!apiKey) {
      return { error: "Gemini API key not configured" };
    }

    // Create a prompt for enhancement
    const prompt = createEnhancementPrompt(fieldContext, currentContent);

    // Call Gemini API directly without SDK with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const responseData = await response.json();

    if (
      responseData &&
      responseData.candidates &&
      responseData.candidates.length > 0 &&
      responseData.candidates[0].content &&
      responseData.candidates[0].content.parts &&
      responseData.candidates[0].content.parts.length > 0
    ) {
      return {
        enhancedText: responseData.candidates[0].content.parts[0].text,
      };
    } else {
      console.error("Unexpected Gemini API response structure:", responseData);
      return { error: "Failed to enhance content with Gemini" };
    }
  } catch (error) {
    console.error("Error enhancing with Gemini:", error);
    return {
      error: error.message || "Error enhancing content with Gemini",
    };
  }
}

// Function to enhance content using OpenAI
async function enhanceWithOpenAI(fieldContext, currentContent) {
  try {
    const data = await chrome.storage.sync.get(["openaiApiKey", "openaiModel"]);
    const model = data.openaiModel || "gpt-3.5-turbo";

    if (!data.openaiApiKey) {
      return { error: "OpenAI API key not configured" };
    }

    // Create a prompt for enhancement
    const prompt = createEnhancementPrompt(fieldContext, currentContent);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that enhances and improves content.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
      }),
    });

    const responseData = await response.json();

    if (responseData.choices && responseData.choices.length > 0) {
      return { enhancedText: responseData.choices[0].message.content };
    } else {
      return { error: "Failed to enhance content with OpenAI" };
    }
  } catch (error) {
    console.error("Error enhancing with OpenAI:", error);
    return { error: error.message || "Error enhancing with OpenAI" };
  }
}

// Function to enhance content using Claude
async function enhanceWithClaude(fieldContext, currentContent) {
  try {
    const data = await chrome.storage.sync.get(["claudeApiKey", "claudeModel"]);
    const model = data.claudeModel || "claude-instant";

    if (!data.claudeApiKey) {
      return { error: "Claude API key not configured" };
    }

    // Create a prompt for enhancement
    const prompt = createEnhancementPrompt(fieldContext, currentContent);

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": data.claudeApiKey,
      },
      body: JSON.stringify({
        model: model,
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 800,
        stop_sequences: ["\n\nHuman:"],
      }),
    });

    const responseData = await response.json();

    if (responseData.completion) {
      return { enhancedText: responseData.completion.trim() };
    } else {
      return { error: "Failed to enhance content with Claude" };
    }
  } catch (error) {
    console.error("Error enhancing with Claude:", error);
    return { error: error.message || "Error enhancing with Claude" };
  }
}

// Function to create a prompt for content enhancement
function createEnhancementPrompt(fieldContext, currentContent) {
  let prompt = `You are a writing assistant that improves and formats user text for better clarity, fluency, tone, and structure while preserving the original meaning.

Enhance the input text to:

Use correct grammar and spelling

Improve sentence flow and readability

Use a consistent and professional or friendly tone (based on original tone)

Optionally break long paragraphs for better structure

Format appropriately with line breaks or bullet points if useful

Do NOT change the core message or intent

Return only the improved version, without explanations or extra comments.\n\n`;

  prompt += `Current content: "${currentContent}"\n\n`;

  // Add context information
  prompt += `Context information:\n`;
  prompt += `Field type: ${fieldContext.fieldType}\n`;

  if (fieldContext.fieldName) {
    prompt += `Field name: ${fieldContext.fieldName}\n`;
  }

  if (fieldContext.nearbyLabels && fieldContext.nearbyLabels.length > 0) {
    prompt += `Associated labels: ${fieldContext.nearbyLabels.join(", ")}\n`;
  }

  if (fieldContext.formPurpose) {
    prompt += `Form purpose: ${fieldContext.formPurpose}\n`;
  }

  // Add specific instructions based on content length and form type
  if (
    fieldContext.fieldType === "longText" ||
    fieldContext.fieldType === "richText"
  ) {
    prompt += `\nThis is a longer text field, so feel free to enhance it thoroughly while keeping the same overall length and main points.\n`;
  } else {
    prompt += `\nThis is a short, single-line field, so keep your enhancement concise and to the point.\n`;
  }

  // Add specific instructions for different form purposes
  if (fieldContext.formPurpose === "comment") {
    prompt += `This is for a comment section, so make it sound natural but thoughtful.\n`;
  } else if (fieldContext.formPurpose === "blogPost") {
    prompt += `This is for a blog post, so make it engaging and well-structured.\n`;
  } else if (
    fieldContext.formPurpose === "registration" ||
    fieldContext.formPurpose === "checkout"
  ) {
    prompt += `This contains personal information for a ${fieldContext.formPurpose} form, so keep it realistic and appropriate.\n`;
  }

  prompt += `\nEnhanced version (maintain the original intent and information, just improve the quality):`;

  return prompt;
}

// Function to create a prompt based on the field context
function createPromptFromFieldContext(fieldContext, customPrompt = null) {
  // If a custom prompt is provided, use that instead of generating one
  if (customPrompt) {
    let prompt = `Generate content for a form field based on the following user prompt: "${customPrompt}"\n\n`;

    // Still provide some context about the field
    prompt += `Field type: ${fieldContext.fieldType}\n`;
    if (fieldContext.fieldName)
      prompt += `Field name: ${fieldContext.fieldName}\n`;
    if (fieldContext.nearbyLabels && fieldContext.nearbyLabels.length > 0) {
      prompt += `Associated labels: ${fieldContext.nearbyLabels.join(", ")}\n`;
    }

    prompt +=
      "\nGenerate ONLY the content to fill in the field based on the user's prompt, without any additional explanation.";

    return prompt;
  }

  // Default prompt generation if no custom prompt is provided
  let prompt =
    "Generate content for a form field with the following details:\n\n";

  // Add field information
  prompt += `Field type: ${fieldContext.fieldType}\n`;
  if (fieldContext.fieldName)
    prompt += `Field name: ${fieldContext.fieldName}\n`;
  if (fieldContext.fieldId) prompt += `Field ID: ${fieldContext.fieldId}\n`;
  if (fieldContext.fieldPlaceholder)
    prompt += `Placeholder: ${fieldContext.fieldPlaceholder}\n`;

  // Add label information if available
  if (fieldContext.nearbyLabels && fieldContext.nearbyLabels.length > 0) {
    prompt += `Associated labels: ${fieldContext.nearbyLabels.join(", ")}\n`;
  }

  // Add form purpose if available
  if (fieldContext.formPurpose) {
    prompt += `Form purpose: ${fieldContext.formPurpose}\n`;
  }

  // Add specific instructions based on field and form type
  prompt +=
    "\nPlease generate appropriate content that would be valid for this field. ";

  if (
    fieldContext.fieldType === "longText" ||
    fieldContext.fieldType === "richText"
  ) {
    prompt +=
      "Since this is a long-form text field, please provide a detailed response. ";
  } else {
    prompt += "Keep it concise as this is a single-line input field. ";
  }

  if (fieldContext.formPurpose === "registration") {
    prompt +=
      "This is for a registration form, so provide realistic but fictional personal information. ";
  } else if (fieldContext.formPurpose === "login") {
    prompt +=
      'This is for a login form. If it looks like a username field, provide a sample username. If it looks like a password field, just write "********". ';
  } else if (fieldContext.formPurpose === "comment") {
    prompt +=
      "This is for a comment form, so provide a thoughtful comment related to what the page might be about. ";
  } else if (fieldContext.formPurpose === "blogPost") {
    prompt +=
      "This is for a blog post, so provide creative and engaging content. ";
  } else if (fieldContext.formPurpose === "checkout") {
    prompt +=
      "This is for a checkout form, so provide realistic but fictional payment or shipping information. ";
  }

  prompt +=
    "\nGenerate ONLY the content to fill in the field, without any additional explanation.";

  return prompt;
}

// Initialize with an error handler
async function safeInitialize() {
  try {
    await initializeAIClient();
    // console.log("AI Auto Fill: Background initialized successfully");
  } catch (error) {
    // console.error("AI Auto Fill: Error during initialization:", error);
  }
}

// Call initialize with error handling
safeInitialize();

// Listen for messages from content script with proper error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Keep track if we've responded yet
  let hasResponded = false;

  // Set a timeout to ensure we always respond even if there's an error
  const timeoutId = setTimeout(() => {
    if (!hasResponded) {
      console.warn("AI Auto Fill: Response timeout triggered");
      hasResponded = true;
      sendResponse({ error: "Operation timed out. Please try again." });
    }
  }, 10000); // 10 seconds timeout

  if (request.action === "generateContent") {
    (async () => {
      try {
        // Get current provider
        const provider = await initializeAIClient();

        let result;

        switch (provider) {
          case "gemini":
            result = await generateWithGemini(
              request.fieldContext,
              request.customPrompt
            );
            break;

          case "openai":
            result = await generateWithOpenAI(
              request.fieldContext,
              request.customPrompt
            );
            break;

          case "claude":
            result = await generateWithClaude(
              request.fieldContext,
              request.customPrompt
            );
            break;

          default:
            result = { error: "No AI provider configured" };
        }
        sendResponse(result);
        hasResponded = true;
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error generating content:", error);
        if (!hasResponded) {
          hasResponded = true;
          clearTimeout(timeoutId);
          sendResponse({ error: error.message || "Error generating content" });
        }
      }
    })();

    return true; // Keep the message channel open for the async response
  } else if (request.action === "enhanceContent") {
    (async () => {
      try {
        // Process the enhancement request
        const result = await enhanceContent(
          request.fieldContext,
          request.currentContent
        );

        sendResponse(result);
        hasResponded = true;
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error enhancing content:", error);
        if (!hasResponded) {
          hasResponded = true;
          clearTimeout(timeoutId);
          sendResponse({ error: error.message || "Error enhancing content" });
        }
      }
    })();

    return true; // Keep the message channel open for the async response
  } else {
    // For other requests, clear the timeout
    clearTimeout(timeoutId);
  }
});
