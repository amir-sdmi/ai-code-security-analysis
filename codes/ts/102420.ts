
import { toast } from "sonner";

// Configuration for the Gemini API
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.5-flash-preview-04-17"; // Using updated model for text and image generation
const IMAGE_EDITING_MODEL = "gemini-2.0-flash-exp-image-generation"; // Keep separate model for image editing

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  isEditingImage?: boolean;
  }

// Safety settings interface
interface SafetySetting {
  category: string;
  threshold: string;
}

// Default safety settings to use with all requests
const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
];

interface GeminiRequest {
  contents: {
    role: string;
    parts: {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    responseModalities?: string[]; // Critical for image generation
  };
  safetySettings: SafetySetting[];
}

interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Generate an image with Imagen 3 (high-powered photo generation)
  async generateImageWithImagen3(
    prompt: string,
    config: {
      numberOfImages?: number;
      aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
      personGeneration?: "DONT_ALLOW" | "ALLOW_ADULT";
    } = {}
  ): Promise<ChatMessage | null> {
    try {
      // Default config
      const {
        numberOfImages = 1,
        aspectRatio = "1:1",
        personGeneration = "ALLOW_ADULT"
      } = config;

      // Imagen 3 endpoint and model
      const IMAGEN3_MODEL = "imagen-3.0-generate-002";
      const IMAGEN3_URL = "https://generativelanguage.googleapis.com/v1beta/models";

      const payload = {
        prompt,
        config: {
          numberOfImages,
          aspectRatio,
          personGeneration
        }
      };

      const response = await fetch(
        `${IMAGEN3_URL}/${IMAGEN3_MODEL}:generateImages?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Imagen 3 API error:", errorData);
        toast.error("Failed to generate image with Imagen 3");
        return null;
      }

      const data = await response.json();

      if (!data || !data.generatedImages || !data.generatedImages.length) {
        toast.error("Imagen 3 did not return any images");
        return null;
      }

      // Only use the first image for now
      const generatedImage = data.generatedImages[0];
      const imgBytes = generatedImage.image.imageBytes;
      const imageUrl = `data:image/png;base64,${imgBytes}`;

      return {
        role: "assistant",
        content: "Here's your high-powered Imagen 3 image:",
        imageUrl,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error in generateImageWithImagen3:", error);
      toast.error("Failed to generate image with Imagen 3");
      return null;
    }
  }

  private async makeApiRequest(url: string, payload: any): Promise<any> {
    try {
      console.log(`Sending request to: ${url}`);
      console.log("Request payload includes responseModalities:", 
        payload.generationConfig.responseModalities ? "Yes" : "No");
      
      const response = await fetch(
        `${url}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as GeminiErrorResponse;
        console.error("Gemini API error:", errorData);
        
        if (errorData.error.code === 400) {
          toast.error("Invalid request to Gemini API");
        } else if (errorData.error.code === 401) {
          toast.error("Invalid API key. Please check your settings.");
        } else {
          toast.error(`Error: ${errorData.error.message}`);
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast.error("Failed to communicate with Gemini API");
      return null;
    }
  }

  // Enhanced detection for image generation requests
  private isImageGenerationRequest(message: string): boolean {
    // Normalize the message for case-insensitive matching
    const normalizedMessage = message.toLowerCase().trim();
    
    // 1. Creation Keywords - expanded with more action verbs
    const creationKeywords = [
      "generate an image", "create an image", "make an image",
      "generate a picture", "create a picture", "make a picture",
      "generate a photo", "create a photo", "make a photo",
      "draw", "sketch", "paint", "illustrate", "render", "visualize",
      "show me an image", "show me a picture", "visualize",
      "imagine", "picture of", "photo of", "image of", "illustration of",
      "design a", "craft a", "produce a", "compose a", "depict a"
    ];
    
    // 2. Subject-Specific Keywords - expanded for character content
    const subjectKeywords = [
      "landscape", "portrait", "scene", "character", "fantasy",
      "sci-fi", "futuristic", "vintage", "abstract", "realistic",
      "anime", "cartoon", "3d", "digital art", "painting", "world",
      "environment", "background", "setting", "artwork", "poster",
      "warrior", "hero", "figure", "person", "creature", "being",
      "animal", "monster", "entity", "protagonist", "character"
    ];
    
    // 3. Style Descriptors - expanded
    const styleKeywords = [
      "style", "aesthetic", "vibrant", "colorful", "dark", "bright",
      "moody", "atmospheric", "dramatic", "minimalist", "detailed",
      "photorealistic", "artistic", "surreal", "dystopian", "utopian",
      "fantasy", "sci-fi", "cyberpunk", "steampunk", "medieval",
      "futuristic", "ancient", "modern", "post-apocalyptic", "magical"
    ];
    
    // 4. Visual Elements Keywords
    const visualElementsKeywords = [
      "color", "lighting", "shadow", "texture", "pattern",
      "composition", "perspective", "angle", "view", "shot",
      "filter", "effect", "tone", "mood", "vibrance", "contrast",
      "attire", "clothing", "armor", "weapon", "accessory", "pose", 
      "stance", "outfit", "gear", "equipment", "tool", "artifact"
    ];
    
    // 5. Directional Words - expanded
    const directionalPhrases = [
      "create a", "generate a", "make a", "design a", "produce a",
      "show me a", "visualize a", "illustrate a", "picture a",
      "craft a", "render a", "compose a", "depict a", "draw a"
    ];
    
    // 6. Art Direction Combinations - highly specific patterns
    const artDirectionCombinations = [
      "fantasy warrior", "heroic character", "stylized portrait", 
      "photorealistic image", "digital artwork", "character design",
      "character concept", "battle pose", "action scene", "dynamic pose",
      "ornate armor", "magical weapon", "epic scene", "fantasy landscape"
    ];
    
    // Check for explicit creation keywords (strongest signal)
    for (const keyword of creationKeywords) {
      if (normalizedMessage.includes(keyword)) {
        console.log(`Image generation detected via creation keyword: ${keyword}`);
        return true;
      }
    }
    
    // Check for art direction combinations (very strong signal)
    for (const combo of artDirectionCombinations) {
      if (normalizedMessage.includes(combo)) {
        console.log(`Image generation detected via art direction combo: ${combo}`);
        return true;
      }
    }
    
    // Advanced pattern matching using a scoring system
    let score = 0;
    
    // Check for directional phrase + subject combinations
    for (const phrase of directionalPhrases) {
      for (const subject of subjectKeywords) {
        if (normalizedMessage.includes(`${phrase} ${subject}`)) {
          console.log(`Image generation detected via phrase+subject: ${phrase} ${subject}`);
          return true;
        }
      }
    }
    
    // Add score for subject keywords
    for (const keyword of subjectKeywords) {
      if (normalizedMessage.includes(keyword)) {
        score += 2;
      }
    }
    
    // Add score for style keywords
    for (const keyword of styleKeywords) {
      if (normalizedMessage.includes(keyword)) {
        score += 1.5;
      }
    }
    
    // Add score for visual elements
    for (const keyword of visualElementsKeywords) {
      if (normalizedMessage.includes(keyword)) {
        score += 1;
      }
    }
    
    // Special patterns detection for character descriptions
    if (/with.*(armor|weapon|outfit|gear|equipment)/i.test(normalizedMessage)) {
      score += 3;
      console.log("Character description pattern detected (equipment)");
    }
    
    if (/in a.*(pose|stance|position)/i.test(normalizedMessage)) {
      score += 3;
      console.log("Character description pattern detected (pose)");
    }
    
    // Additional patterns that strongly suggest image generation
    if (/create a .*(scene|landscape|portrait|picture|image)/i.test(normalizedMessage)) {
      score += 5;
    }
    
    if (/design a .*(character|creature|warrior|hero|villain)/i.test(normalizedMessage)) {
      score += 5;
      console.log("Character design pattern detected");
    }
    
    // Check for detailed visual descriptions
    const hasDetailedDescription = normalizedMessage.length > 20 && 
      (normalizedMessage.includes(" with ") || normalizedMessage.includes(" and ")) &&
      (score >= 2);
    
    if (hasDetailedDescription) {
      score += 3;
    }
    
    // Check for art direction words combined with subjects
    if (/in (the style of|a|an) .*(style|aesthetic|art)/i.test(normalizedMessage)) {
      score += 3;
    }
    
    // Log the final detection score for debugging
    console.log(`Image generation detection score: ${score} for message: "${normalizedMessage.substring(0, 50)}..."`);
    
    // Return true if score is above threshold (fine-tuned threshold)
    return score >= 4;
  }

  // Improved detection for image editing requests
  private isImageEditingRequest(message: string, messages: ChatMessage[]): boolean {
    // Check if there's a recent image in the conversation (within last 5 messages)
    const hasRecentImage = messages.slice(-5).some(msg => msg.imageUrl);
    
    // If no recent images, it can't be an editing request
    if (!hasRecentImage) return false;
    
    // Expanded list of editing keywords for better detection
    const editingKeywords = [
      "edit", "modify", "change", "update", "transform", "alter", "adjust",
      "make it", "turn it", "convert", "fix", "enhance", "improve", "refine",
      "add", "remove", "put", "take", "replace", "recolor", "colorize"
    ];

    return editingKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async sendMessage(messages: ChatMessage[]): Promise<ChatMessage | null> {
    // Get the latest user message
    const latestUserMessage = [...messages].reverse().find(msg => msg.role === "user");
    
    if (!latestUserMessage) {
      return null;
    }

    console.log("Processing message:", latestUserMessage.content);
    console.log("Has image URL:", !!latestUserMessage.imageUrl);

    // CASE 1: Handle case where an image is directly attached to the latest message
    if (latestUserMessage.imageUrl) {
      // If there's text with the image, assume it's an edit/caption request
      if (latestUserMessage.content && latestUserMessage.content.trim().length > 0) {
        console.log("Image attached with text, treating as edit request");
        return this.editImage(latestUserMessage.content, latestUserMessage.imageUrl);
      } else {
        // If no text, just acknowledge the image
        return {
          role: "assistant",
          content: "I've received your image. What would you like me to do with it?",
          timestamp: new Date()
        };
      }
    }

    // CASE 2: Determine request type for text-only messages
    const isImageGeneration = this.isImageGenerationRequest(latestUserMessage.content);
    const isImageEditing = this.isImageEditingRequest(latestUserMessage.content, messages);
    
    console.log(`Request type: ${isImageGeneration ? 'Image Generation' : isImageEditing ? 'Image Editing' : 'Text Chat'}`);
    
    // Choose the appropriate action based on the request type
    if (isImageGeneration) {
      return this.generateImage(latestUserMessage.content);
    } else if (isImageEditing) {
      // Find the most recent image to edit
      const imageToEdit = [...messages]
        .reverse()
        .find(msg => msg.imageUrl)?.imageUrl;
      
      if (imageToEdit) {
        return this.editImage(latestUserMessage.content, imageToEdit);
      } else {
        // This shouldn't happen with proper detection, but handle it gracefully
        return {
          role: "assistant",
          content: "I couldn't find a recent image to edit. Could you upload the image again?",
          timestamp: new Date()
        };
      }
    }
    
    // Default to regular text chat for all other cases
    return this.sendTextMessage(messages);
  }

  // Regular text chat with gemini-2.0-flash-exp (now with responseModalities)
  private async sendTextMessage(messages: ChatMessage[]): Promise<ChatMessage | null> {
    try {
      // Format messages for Gemini API
      const formattedMessages = messages.map(msg => ({
        role: msg.role === "system" ? "user" : msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      // Create request payload - now include responseModalities for text chat too
      const payload: GeminiRequest = {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseModalities: ["Text"] // Just text for normal chat
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS
      };

      // Call Gemini API with the unified model
      const data = await this.makeApiRequest(
        `${API_URL}/${MODEL}:generateContent`,
        payload
      );
      
      if (!data || !data.candidates || !data.candidates[0]?.content) {
        toast.error("Received invalid response from Gemini API");
        return null;
      }

      // Extract the response text
      const responseText = data.candidates[0].content.parts[0].text;
      
      return {
        role: "assistant",
        content: responseText,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error in sendTextMessage:", error);
      return null;
    }
  }

  // Generate an image with gemini-2.0-flash-exp
  private async generateImage(prompt: string): Promise<ChatMessage | null> {
    try {
      console.log("Generating image with prompt:", prompt);
      
      // Create a request for image generation
      const payload: GeminiRequest = {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseModalities: ["Text", "Image"]  // Critical for image generation
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS
      };

      // Call Gemini API for image generation with the same model as text
      const data = await this.makeApiRequest(
        `${API_URL}/${MODEL}:generateContent`,
        payload
      );

      if (!data || !data.candidates || !data.candidates[0]?.content) {
        toast.error("Failed to generate image");
        return null;
      }

      // Process the response
      const parts = data.candidates[0].content.parts;
      console.log("Response parts:", parts.length);
      
      const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
      const textPart = parts.find((part: any) => part.text);
      
      if (!imagePart) {
        // If no image, return text response
        console.log("No image in response, returning text");
        return {
          role: "assistant",
          content: textPart?.text || "I tried to generate an image, but couldn't create one.",
          timestamp: new Date()
        };
      }

      // Create image URL from base64 data
      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      console.log("Image generated successfully");
      
      return {
        role: "assistant",
        content: textPart?.text || "Here's the image I generated for you:",
        imageUrl: imageUrl,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error in generateImage:", error);
      return null;
    }
  }

  // Edit an image
  private async editImage(instructions: string, imageUrl: string): Promise<ChatMessage | null> {
    try {
      console.log("Editing image with instructions:", instructions);
      
      // Extract the base64 data from the image URL
      let imageData = "";
      let mimeType = "image/jpeg";
      
      if (imageUrl.startsWith('data:')) {
        // It's already a data URL
        const parts = imageUrl.split(',');
        if (parts.length < 2) {
          throw new Error("Invalid image data URL format");
        }
        
        // Get the MIME type from the data URL
        const mimeMatch = imageUrl.match(/data:([^;]+);base64,/);
        mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        
        // Get the base64 data
        imageData = parts[1];
      } else {
        // Try to fetch the image from a URL
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          // Convert to base64
          const base64 = await this.blobToBase64(blob);
          const parts = base64.split(',');
          if (parts.length < 2) {
            throw new Error("Failed to convert image to base64");
          }
          
          imageData = parts[1];
          mimeType = blob.type || "image/jpeg";
        } catch (error) {
          console.error("Error fetching or converting image:", error);
          toast.error("Failed to process the image");
          return null;
        }
      }

      console.log("Prepared image data for editing, mime type:", mimeType);
      
      // Create request payload with image + text instructions
      const payload: GeminiRequest = {
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageData
              }
            },
            {
              text: instructions
            }
          ]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseModalities: ["Text", "Image"]  // Critical for image generation
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS
      };

      // Call Gemini API - keep using IMAGE_EDITING_MODEL for editing
      const data = await this.makeApiRequest(
        `${API_URL}/${IMAGE_EDITING_MODEL}:generateContent`,
        payload
      );

      if (!data || !data.candidates || !data.candidates[0]?.content) {
        toast.error("Failed to edit image");
        return null;
      }

      // Process the response
      const parts = data.candidates[0].content.parts;
      console.log("Response has", parts.length, "parts");
      
      // Extract image and text from response
      const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
      const textPart = parts.find((part: any) => part.text);
      
      if (!imagePart) {
        // If no image was returned, return just the text explanation
        console.log("No image in edit response, returning text only");
        return {
          role: "assistant",
          content: textPart?.text || "I tried to edit the image, but couldn't complete the task.",
          timestamp: new Date()
        };
      }

      // Create a data URL from the image data
      const editedImageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      console.log("Image edited successfully");
      
      return {
        role: "assistant",
        content: textPart?.text || "Here's the edited image:",
        imageUrl: editedImageUrl,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error in editImage:", error);
      return null;
    }
  }

  // Helper to convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
