import express, { Router, Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import {
  insertUserSchema,
  insertPlatformSchema,
  insertSocialAccountSchema,
  insertPostSchema,
  insertPostPlatformSchema,
  insertAiSuggestionSchema
} from "@shared/schema";
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import {
  TranslationRequest,
  TranslationResponse,
  BatchTranslationRequest,
  BatchTranslationResponse
} from "@shared/types";
import { queryHuggingFace } from "./huggingface"; // ✅ Hugging Face API helper import

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY_ENV_VAR || ""
});

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const gemini = new GoogleGenerativeAI(geminiApiKey);

if (!process.env.GEMINI_API_KEY) {
  console.warn("[Warning] GEMINI_API_KEY not found in environment. Please set it.");
} else {
  const maskedKey = geminiApiKey.slice(0, 6) + "...";
  console.log(`[Gemini] API Key Loaded: ${maskedKey}`);
}

// ✅ Hugging Face endpoint
export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();

  apiRouter.post("/huggingface", async (req: Request, res: Response) => {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: "Model and prompt are required" });
    }

    try {
      const output = await queryHuggingFace(model, prompt);
      res.json({ output });
    } catch (error) {
      console.error("Hugging Face request failed:", error);
      res.status(500).json({ error: "Failed to generate response from Hugging Face" });
    }
  });

  // (Your existing endpoints and logic continue below)

  // Example: Check OpenAI key
  async function checkOpenAIApiKeyStatus(): Promise<{ valid: boolean; message?: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { valid: false, message: "OpenAI API key is not configured" };
      }

      await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      });

      return { valid: true };
    } catch (error: any) {
      console.error("OpenAI API key validation error:", error);

      if (error?.code === 'insufficient_quota' || error?.status === 429) {
        return {
          valid: false,
          message: "OpenAI API quota exceeded. Please check your API key billing details or try again later."
        };
      }

      if (error?.status === 401) {
        return {
          valid: false,
          message: "Invalid OpenAI API key. Please check your API key and try again."
        };
      }

      return {
        valid: false,
        message: `Error validating OpenAI API key: ${error?.message || "Unknown error"}`
      };
    }
  }

  // Register API routes
  app.use("/api", apiRouter);
  return createServer(app);
}



// Helper to check if the Gemini API key is valid
async function checkGeminiApiKeyStatus(): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!geminiApiKey) {
      return { valid: false, message: "Gemini API key is not configured" };
    }

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("test");
    const response = await result.response;

    if (!response) {
      return { valid: false, message: "Failed to get response from Gemini API" };
    }

    return { valid: true };
  } catch (error: any) {
    console.error("Gemini API key validation error:", error);

    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return {
        valid: false,
        message: "Gemini API quota exceeded or rate limited. Please try again later."
      };
    }

    if (error?.message?.includes('API key')) {
      return {
        valid: false,
        message: "Invalid Gemini API key. Please check your API key and try again."
      };
    }

    return {
      valid: false,
      message: `Error validating Gemini API key: ${error?.message || "Unknown error"}`
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router for all endpoints
  const apiRouter = Router();
  
  // Get all platforms
  apiRouter.get("/platforms", async (req: Request, res: Response) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });
  
  // Get all social accounts for a user
  apiRouter.get("/accounts", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use user ID 1
      const userId = 1;
      const accounts = await storage.getSocialAccountsByUserId(userId);
      
      // Get platform details for each account
      const accountsWithPlatforms = await Promise.all(
        accounts.map(async (account) => {
          const platform = await storage.getPlatform(account.platformId);
          return { ...account, platform };
        })
      );
      
      res.json(accountsWithPlatforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });
  
  // Connect a new social account
  apiRouter.post("/accounts", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSocialAccountSchema.parse(req.body);
      
      // Create a mock social account
      const stats = {
        followers: Math.floor(Math.random() * 100000),
        engagement: (Math.random() * 10).toFixed(1) + "%",
        growth: (Math.random() * 5).toFixed(1) + "%",
        posts: Math.floor(Math.random() * 1000)
      };
      
      const account = await storage.createSocialAccount({
        ...validatedData,
        stats
      });
      
      const platform = await storage.getPlatform(account.platformId);
      
      res.status(201).json({ ...account, platform });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid account data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to connect account" });
      }
    }
  });
  
  // Delete/disconnect a social account
  apiRouter.delete("/accounts/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const success = await storage.disconnectSocialAccount(accountId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });
  
  // Refresh account stats
  apiRouter.put("/accounts/:id/refresh", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      // Get the existing account
      const account = await storage.getSocialAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Generate new, slightly different stats from the existing ones
      const currentFollowers = account.stats?.followers || Math.floor(Math.random() * 100000);
      const currentPosts = account.stats?.posts || Math.floor(Math.random() * 1000);
      
      // Simulate growth by adding a small percentage
      const followerIncrease = Math.floor(currentFollowers * (Math.random() * 0.05)); // 0-5% growth
      const postIncrease = Math.floor(Math.random() * 5); // 0-5 new posts
      
      const updatedStats = {
        followers: currentFollowers + followerIncrease,
        engagement: (Math.random() * 10).toFixed(1) + "%",
        growth: (Math.random() * 5).toFixed(1) + "%",
        posts: currentPosts + postIncrease
      };
      
      // Update the account stats
      const updatedAccount = await storage.updateSocialAccount(accountId, updatedStats);
      
      if (updatedAccount) {
        res.json(updatedAccount);
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh account stats" });
    }
  });
  
  // Get all posts for a user
  apiRouter.get("/posts", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use user ID 1
      const userId = 1;
      const posts = await storage.getAllPosts(userId);
      
      // Get platforms for each post
      const postsWithPlatforms = await Promise.all(
        posts.map(async (post) => {
          const postPlatforms = await storage.getPostPlatformsByPostId(post.id);
          
          const platforms = await Promise.all(
            postPlatforms.map(async (pp) => {
              const account = await storage.getSocialAccount(pp.socialAccountId);
              if (!account) return null;
              
              const platform = await storage.getPlatform(account.platformId);
              return {
                ...pp,
                platform,
                accountName: account.accountName
              };
            })
          );
          
          return {
            ...post,
            platforms: platforms.filter(Boolean)
          };
        })
      );
      
      res.json(postsWithPlatforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  
  // Create a new post
  apiRouter.post("/posts", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      
      // If platforms are specified, create post platforms
      if (req.body.platforms && Array.isArray(req.body.platforms)) {
        // Check if platform-specific content is provided
        const platformContents = req.body.platformContents || [];
        
        await Promise.all(
          req.body.platforms.map(async (platformSlug: string) => {
            // Get platform by slug
            const platform = await storage.getPlatformBySlug(platformSlug);
            if (!platform) return;
            
            // Get a social account for this platform
            const accounts = await storage.getSocialAccountsByUserId(post.userId);
            const account = accounts.find(a => a.platformId === platform.id);
            
            if (account) {
              // Find platform-specific content if available
              const platformContent = platformContents.find((pc: any) => 
                pc.platformId === platformSlug
              );
              
              await storage.createPostPlatform({
                postId: post.id,
                socialAccountId: account.id,
                platformContent: platformContent?.content || post.content,
                publishStatus: post.status === 'scheduled' ? 'pending' : 'published',
                publishedUrl: post.status === 'published' ? `https://example.com/post/${post.id}` : undefined,
                engagementStats: post.status === 'published' ? { likes: 0, comments: 0, shares: 0 } : undefined
              });
            }
          })
        );
      }
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid post data", errors: error.errors });
      } else {
        console.error("Post creation error:", error);
        res.status(500).json({ message: "Failed to create post" });
      }
    }
  });
  
  // Get scheduled posts for a user
  apiRouter.get("/scheduled-posts", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use user ID 1
      const userId = 1;
      const scheduledPosts = await storage.getScheduledPosts(userId);
      
      const postsWithPlatforms = await Promise.all(
        scheduledPosts.map(async (post) => {
          const postPlatforms = await storage.getPostPlatformsByPostId(post.id);
          
          const platforms = await Promise.all(
            postPlatforms.map(async (pp) => {
              const account = await storage.getSocialAccount(pp.socialAccountId);
              if (!account) return null;
              
              const platform = await storage.getPlatform(account.platformId);
              return {
                ...pp,
                platform,
                accountName: account.accountName
              };
            })
          );
          
          return {
            ...post,
            platforms: platforms.filter(Boolean)
          };
        })
      );
      
      res.json(postsWithPlatforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scheduled posts" });
    }
  });
  
  // Get AI suggestions for a user
  apiRouter.get("/ai-suggestions", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use user ID 1
      const userId = 1;
      const suggestions = await storage.getAiSuggestionsByUserId(userId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI suggestions" });
    }
  });
  
  // Create new AI content
  apiRouter.post("/ai-content", async (req: Request, res: Response) => {
    try {
      const { prompt, type, useGemini } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Determine which API to use
      const useGeminiApi = useGemini === true;
      
      if (useGeminiApi) {
        // Check Gemini API key status
        const apiStatus = await checkGeminiApiKeyStatus();
        if (!apiStatus.valid) {
          return res.status(429).json({
            message: apiStatus.message || "Gemini API key is invalid or has exceeded its quota",
            error: "API_KEY_ERROR",
            provider: "gemini"
          });
        }
      } else {
        // Check OpenAI API key status
        const apiStatus = await checkOpenAIApiKeyStatus();
        if (!apiStatus.valid) {
          return res.status(429).json({
            message: apiStatus.message || "OpenAI API key is invalid or has exceeded its quota",
            error: "API_KEY_ERROR",
            provider: "openai"
          });
        }
      }
      
      // Configure system message based on content type
      let systemMessage = "";
      
      switch (type) {
        case "trend":
          systemMessage = "You are a trend analysis expert for social media. Identify current trends related to the user's prompt and suggest viral content ideas that capitalize on these trends. Provide an engaging title and detailed content that would perform well on social platforms. Respond in JSON format with title and content fields.";
          break;
        case "timing":
          systemMessage = "You are a social media scheduling expert. Analyze the optimal posting times and frequency for content related to the user's prompt. Consider platform-specific timing strategies and audience engagement patterns. Provide recommendations in JSON format with title and content fields.";
          break;
        default:
          systemMessage = "You are a professional social media content creator specializing in viral, engaging posts. Create content that's optimized for high engagement, shares, and conversions. Make it concise yet impactful, with compelling hooks and calls to action. Tailor your suggestions to perform well across multiple platforms. Respond in JSON format with title and content fields.";
      }
      
      // Enhance the prompt based on the content type
      let enhancedPrompt = prompt;
      if (type === "trend") {
        enhancedPrompt = `${prompt}\n\nCreate content that capitalizes on current trends and is likely to go viral. Include relevant hashtags and hooks that will drive engagement.`;
      } else if (type === "timing") {
        enhancedPrompt = `${prompt}\n\nProvide strategic advice on when to post this content for maximum reach and engagement. Include platform-specific recommendations.`;
      }
      
      let content;
      
      try {
        if (useGeminiApi) {
          // Use Google's Gemini API
          const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
          
          // Build the prompt with system message first
          const fullPrompt = `${systemMessage}\n\n${enhancedPrompt}\n\nPlease format your response as a JSON object with "title" and "content" fields.`;
          
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const text = response.text();
          
          // Extract JSON from the response
          // First try to parse the entire text as JSON
          try {
            content = JSON.parse(text);
          } catch (e) {
            // If that fails, try to extract JSON from the response using regex
            const jsonMatch = text.match(/({[\s\S]*})/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                content = JSON.parse(jsonMatch[1]);
              } catch (e2) {
                // If all parsing attempts fail, create a structured response
                content = {
                  title: "Generated Content",
                  content: text
                };
              }
            } else {
              // Create a fallback structure if JSON not found
              content = {
                title: "Generated Content",
                content: text
              };
            }
          }
          
        } else {
          // Use OpenAI API
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemMessage
              },
              {
                role: "user",
                content: enhancedPrompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7 // Add some creativity but keep it focused
          });
          
          // Parse the JSON response
          content = JSON.parse(response.choices[0].message.content || '{"title": "", "content": ""}');
        }
      } catch (error: any) {
        console.error(`${useGeminiApi ? 'Gemini' : 'OpenAI'} API error:`, error);
        
        // Check if it's a rate limit or quota error
        if (error?.code === 'insufficient_quota' || error?.status === 429 || 
            error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
          return res.status(429).json({
            message: `${useGeminiApi ? 'Gemini' : 'OpenAI'} API quota exceeded. Please check your API key billing details or try again later.`,
            error: "QUOTA_EXCEEDED",
            provider: useGeminiApi ? "gemini" : "openai",
            suggestion: "Your API key has reached its usage limit. Consider upgrading your plan or waiting until your quota resets."
          });
        }
        
        // For other errors
        throw error;
      }
      
      // For demo purposes, use user ID 1
      const userId = 1;
      
      // Generate a better title if none provided
      const title = content.title || (type === "trend" ? 
        "Trending Content Opportunity" : 
        type === "timing" ? 
        "Optimal Posting Strategy" : 
        "AI-Optimized Content");
      
      // Save to storage
      const suggestion = await storage.createAiSuggestion({
        userId,
        title: title,
        content: content.content || "",
        type: type || "content",
        used: false
      });
      
      res.json(suggestion);
    } catch (error: any) {
      console.error("AI content generation error:", error);
      
      // If it's an API-related error, provide a clearer message
      if (error?.response?.status === 429 || error?.message?.includes('quota')) {
        return res.status(429).json({
          message: `AI API quota exceeded. Please check your API key billing details or try again later.`,
          error: "QUOTA_EXCEEDED"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to generate AI content",
        error: error?.message || "Unknown error"
      });
    }
  });
  
  // Use AI suggestion (mark as used)
  apiRouter.put("/ai-suggestions/:id/use", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid suggestion ID" });
      }
      
      const updatedSuggestion = await storage.markAiSuggestionAsUsed(id);
      if (!updatedSuggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.json(updatedSuggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to use suggestion" });
    }
  });
  
  // Get analytics data
  apiRouter.get("/analytics", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use user ID 1
      const userId = 1;
      const accounts = await storage.getSocialAccountsByUserId(userId);
      
      const analytics = {
        totalFollowers: 0,
        engagementRate: 0,
        publishedPosts: 0,
        scheduledPosts: 0,
        platforms: []
      };
      
      // Calculate totals
      let totalEngagement = 0;
      
      for (const account of accounts) {
        const platform = await storage.getPlatform(account.platformId);
        
        if (account.stats) {
          const followers = account.stats.followers || 0;
          const engagement = parseFloat((account.stats.engagement || "0%").replace("%", ""));
          const growth = parseFloat((account.stats.growth || "0%").replace("%", ""));
          const posts = account.stats.posts || 0;
          
          analytics.totalFollowers += followers;
          totalEngagement += engagement;
          analytics.publishedPosts += posts;
          
          analytics.platforms.push({
            id: platform?.id,
            name: platform?.name,
            slug: platform?.slug,
            iconUrl: platform?.iconUrl,
            color: platform?.color,
            followers,
            engagement: engagement + "%",
            growth: growth + "%",
            posts
          });
        }
      }
      
      // Calculate average engagement
      analytics.engagementRate = (totalEngagement / (accounts.length || 1)).toFixed(1) + "%";
      
      // Get count of scheduled posts
      const scheduledPosts = await storage.getScheduledPosts(userId);
      analytics.scheduledPosts = scheduledPosts.length;
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // API endpoint to check OpenAI API key status
  apiRouter.get("/ai-api-status", async (req: Request, res: Response) => {
    try {
      // Check if we should use Gemini based on query parameter
      const useGemini = req.query.provider === "gemini" || req.query.useGemini === "true";
      
      if (useGemini) {
        const status = await checkGeminiApiKeyStatus();
        if (status.valid) {
          res.json({ 
            status: "success", 
            message: "Google Gemini API key is valid and operational",
            provider: "gemini"
          });
        } else {
          res.status(400).json({
            status: "error",
            message: status.message,
            provider: "gemini"
          });
        }
      } else {
        const status = await checkOpenAIApiKeyStatus();
        if (status.valid) {
          res.json({ 
            status: "success", 
            message: "OpenAI API key is valid and has sufficient quota",
            provider: "openai"
          });
        } else {
          res.status(400).json({
            status: "error",
            message: status.message,
            provider: "openai"
          });
        }
      }
    } catch (error: any) {
      const isGeminiRequest = req.query.provider === "gemini" || req.query.useGemini === "true";
      res.status(500).json({ 
        status: "error", 
        message: error?.message || `Failed to check ${isGeminiRequest ? 'Gemini' : 'OpenAI'} API status`,
        provider: isGeminiRequest ? "gemini" : "openai"
      });
    }
  });
  
  // Virtual world endpoints
  apiRouter.get("/virtual-worlds", async (req: Request, res: Response) => {
    try {
      // Get platforms that are virtual worlds (based on their slugs)
      const allPlatforms = await storage.getAllPlatforms();
      const virtualWorlds = allPlatforms.filter(platform => [
        'decentraland', 
        'sandbox', 
        'roblox', 
        'meta', 
        'voxels', 
        'somnium'
      ].includes(platform.slug));
      
      res.json(virtualWorlds);
    } catch (error) {
      console.error("Error getting virtual worlds:", error);
      res.status(500).json({ error: "Failed to get virtual worlds" });
    }
  });
  
  apiRouter.get("/virtual-world-accounts", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get all social accounts for the user
      const accounts = await storage.getSocialAccountsByUserId(Number(userId));
      
      // Get all platforms
      const platforms = await storage.getAllPlatforms();
      
      // Filter accounts that belong to virtual world platforms
      const virtualWorldPlatformIds = platforms
        .filter(platform => [
          'decentraland', 
          'sandbox', 
          'roblox', 
          'meta', 
          'voxels', 
          'somnium'
        ].includes(platform.slug))
        .map(platform => platform.id);
      
      const virtualWorldAccounts = accounts.filter(account => 
        virtualWorldPlatformIds.includes(account.platformId)
      );
      
      res.json(virtualWorldAccounts);
    } catch (error) {
      console.error("Error getting virtual world accounts:", error);
      res.status(500).json({ error: "Failed to get virtual world accounts" });
    }
  });
  
  apiRouter.post("/virtual-world-message", async (req: Request, res: Response) => {
    try {
      const { userId, platformId, recipient, message, hasAttachment } = req.body;
      
      if (!userId || !platformId || !recipient || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Mock success response
      setTimeout(() => {
        res.json({ 
          success: true, 
          messageId: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        });
      }, 800);
      
    } catch (error) {
      console.error("Error sending virtual world message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  apiRouter.post("/virtual-world-post", async (req: Request, res: Response) => {
    try {
      const { userId, platformId, content, hasAttachment } = req.body;
      
      if (!userId || !platformId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Create a new post in our database
      const newPost = await storage.createPost({
        userId: Number(userId),
        title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        content,
        status: 'published',
        type: 'virtual-world'
      });
      
      // Create post platform association
      await storage.createPostPlatform({
        postId: newPost.id,
        platformId: Number(platformId),
        publishStatus: 'published',
        publishedAt: new Date().toISOString(),
        customContent: null,
        engagementStats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      });
      
      // Mock success response
      res.json({ 
        success: true, 
        postId: newPost.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error creating virtual world post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });
  
  // Translation service endpoints
  apiRouter.post("/translate", async (req: Request, res: Response) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Use Google's Gemini API
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `You are a professional translator. Translate the text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}. Maintain the original meaning, tone, and formatting as much as possible. Respond with only the translated text, no explanations or additional text.

Text to translate:
"""
${text}
"""`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();
      
      res.json({
        translatedText,
        originalText: text,
        detectedSourceLanguage: sourceLanguage || "auto"
      });
    } catch (error: any) {
      console.error("Translation error:", error);
      
      // Check for Gemini API quota/rate limit errors
      if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        return res.status(402).json({ 
          error: "Translation service quota exceeded. Please try again later."
        });
      }
      
      res.status(500).json({ error: "Failed to translate text" });
    }
  });
  
  apiRouter.post("/detect-language", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Missing text" });
      }
      
      // Use Gemini to detect language
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `You are a language detection system. Analyze the provided text and determine what language it is written in. Return ONLY the ISO 639-1 two-letter language code (e.g., 'en' for English, 'es' for Spanish, etc.).

Text to analyze:
"""
${text}
"""`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const detectedLanguage = response.text().trim().toLowerCase();
      
      res.json({
        languageCode: detectedLanguage,
        text: text
      });
    } catch (error) {
      console.error("Language detection error:", error);
      res.status(500).json({ error: "Failed to detect language" });
    }
  });
  
  apiRouter.post("/batch-translate", async (req: Request, res: Response) => {
    try {
      const { items, sourceLanguage, targetLanguage } = req.body as BatchTranslationRequest;
      
      if (!items || !Array.isArray(items) || !targetLanguage) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Use Gemini for batch translation
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Process translations one at a time
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage || 'the detected language'} to ${targetLanguage}. Maintain the original meaning, tone, and formatting as much as possible. Respond with only the translated text, no explanations or additional text.

Text to translate:
"""
${item.text}
"""`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translatedText = response.text().trim();
            
            return {
              id: item.id,
              translatedText,
              originalText: item.text
            };
          } catch (error) {
            console.error(`Error translating item ${item.id}:`, error);
            return {
              id: item.id,
              translatedText: `[Translation failed]`,
              originalText: item.text
            };
          }
        })
      );
      
      res.json({
        items: results,
        sourceLanguage: sourceLanguage || 'auto-detected',
        targetLanguage
      });
    } catch (error) {
      console.error("Batch translation error:", error);
      res.status(500).json({ error: "Failed to translate texts" });
    }
  });

  // Website fetching endpoint
  apiRouter.post("/fetch-website", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      try {
        // Basic URL validation
        new URL(url);
      } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
      }
      
      try {
        // Fetch website content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
        });
        
        if (!response.ok) {
          return res.status(response.status).json({ 
            error: `Failed to fetch website: ${response.statusText}`, 
            status: response.status 
          });
        }
        
        const content = await response.text();
        
        res.json({
          content,
          url,
          fetchedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Website fetch error:", error);
        res.status(500).json({ error: "Failed to fetch website content" });
      }
    } catch (error) {
      console.error("Website fetch route error:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  });
  
  // Register API router with prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
