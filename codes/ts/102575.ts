import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { groqService } from "./services/groq-service";
import { locationService } from "./services/location-service";
import { serpService } from "./services/serp-service";
import { tavilyService } from "./services/tavily-service";
import { commerceService } from "./services/commerce-service";
import { amazonService } from "./services/amazon-service";
import { zomatoService } from "./services/zomato-service";
import { makeMyTripService } from "./services/makemytrip-service";
import { personalizationService } from "./services/personalization-service";
import { registerMediGroqRoutes } from "./routes/medigroq-routes";
import { emailService } from "./services/email-service";
import { aiProductAnalysisService } from "./services/ai-product-analysis-service";
import { knowledgeGraphService } from "./services/knowledge-graph-service";
import { interactionTrackingService } from "./services/interaction-tracking-service";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Setup MediGroq medical routes
  registerMediGroqRoutes(app);

  // Authentication middleware for protected routes
  function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  }

  // Get conversations for user
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  // Get messages for conversation
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      // Verify user owns this conversation
      if (!conversation || conversation.userId !== req.user.id) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.createConversation({
        userId: req.user.id,
        title: "New Conversation"
      });
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, type = "text" } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Handle image processing if this is an image message
      let processedContent = content;
      let imageAnalysis = null;
      
      if (type === "image" && content.includes("|||IMAGE:")) {
        const [textPart, base64Image] = content.split("|||IMAGE:");
        
        try {
          // Use Gemini to analyze the image
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ 
            apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY 
          });

          const imageAnalysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: [{
              role: "user",
              parts: [
                {
                  text: `${textPart || "Please analyze this image in detail and describe what you see. Focus on products, food items, travel destinations, or any items that could be purchased or relevant to commerce."}`
                },
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                  }
                }
              ]
            }],
            config: {
              temperature: 0.3,
              maxOutputTokens: 1000
            }
          });

          imageAnalysis = imageAnalysisResponse.text || "I can see the image but couldn't analyze it fully.";
          processedContent = `${textPart}\n\n**Image Analysis:**\n${imageAnalysis}`;
        } catch (imageError) {
          console.error("Image analysis error:", imageError);
          imageAnalysis = "I can see you've uploaded an image, but I'm having trouble analyzing it right now. Please try again or describe what you'd like to know about the image.";
          processedContent = `${textPart}\n\n${imageAnalysis}`;
        }
      }

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content: processedContent,
        metadata: { 
          type,
          hasImage: type === "image",
          imageAnalysis: imageAnalysis
        }
      });

      // Get conversation history for context
      const messages = await storage.getMessagesByConversation(conversationId);
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get user for context with preferences
      const user = await storage.getUser(req.user.id);
      
      // Parse user preferences for AI context
      const userPreferences = {
        location: user?.location || null,
        foodPreferences: user?.foodPreferences || null,
        shoppingPreferences: user?.shoppingPreferences || null,
        travelPreferences: user?.travelPreferences || null,
        personalInfo: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email
        }
      };

      // Detect if this is a restaurant/food query or image analysis
      const isRestaurantQuery = /restaurant|food|eat|meal|dinner|lunch|delivery|cuisine|healthy|dining/i.test(processedContent);
      const isImageQuery = type === "image" || imageAnalysis;
      
      let aiResponse;
      if (isImageQuery) {
        // For image analysis, use Gemini to provide commerce-focused insights
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ 
            apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY 
          });

          const commercePrompt = `
You are an AI commerce assistant analyzing an image. Based on the image analysis: "${imageAnalysis || processedContent}"

Provide helpful commerce insights such as:
- If it's food: Suggest similar restaurants, recipes, or food delivery options
- If it's products: Suggest where to buy similar items, price comparisons, or alternatives
- If it's travel-related: Suggest booking options, similar destinations, or travel tips
- If it's fashion/items: Suggest styling tips, where to buy, or similar products

Keep your response conversational, helpful, and focused on actionable commerce suggestions.

User preferences: ${JSON.stringify(userPreferences)}
`;

          const commerceResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: commercePrompt }] }],
            config: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          });

          aiResponse = {
            content: commerceResponse.text || "I've analyzed your image and can help you find related products or services.",
            domain: "marketplace",
            suggestions: [],
            thinking: "Analyzed uploaded image for commerce opportunities"
          };
        } catch (error) {
          console.error("Commerce image analysis error:", error);
          aiResponse = {
            content: "I can see your image, but I'm having trouble providing detailed commerce suggestions right now. Could you tell me what specifically you're looking for?",
            domain: "general",
            suggestions: [],
            thinking: "Image analysis failed, requesting clarification"
          };
        }
      } else if (isRestaurantQuery) {
        // Get user's location from IP
        const clientIP = req.ip || req.connection.remoteAddress || '8.8.8.8';
        let userLocation;
        try {
          userLocation = await locationService.getUserLocationFromIP(clientIP);
        } catch (error) {
          console.error('Location detection failed:', error);
        }

        // Use enhanced restaurant search with Tavily + SERP fusion
        aiResponse = await groqService.generateEnhancedRestaurantResponse(content, {
          userId: req.user.id,
          userPreferences: userPreferences,
          conversationHistory,
          domain: "food"
        }, userLocation);
      } else {
        // Check for recent booking context from the frontend
        const recentBooking = req.body.recentBooking || null;
        
        // Use regular AI response for non-restaurant queries
        aiResponse = await groqService.generateResponse(content, {
          userId: req.user.id,
          userPreferences: userPreferences,
          conversationHistory,
          domain: req.body.domain
        }, recentBooking);
      }

      // Create assistant message
      const assistantMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse.content,
        metadata: {
          type: "text",
          domain: aiResponse.domain,
          suggestions: aiResponse.suggestions,
          thinking: aiResponse.thinking
        }
      });

      res.json({
        userMessage,
        assistantMessage,
        suggestions: aiResponse.suggestions,
        thinking: aiResponse.thinking
      });
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Search hotels
  app.get("/api/search/hotels", async (req, res) => {
    try {
      const { location, petFriendly, maxPrice } = req.query;
      const filters: any = {};
      
      if (petFriendly === 'true') filters.petFriendly = true;
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);

      const hotels = await commerceService.searchHotels(location as string, filters);
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  // Enhanced restaurant search with Tavily + SERP
  app.get("/api/search/restaurants/enhanced", async (req, res) => {
    try {
      const { query, location } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      // Get user location if not provided
      let searchLocation = location as string;
      if (!searchLocation) {
        const clientIP = req.ip || req.connection.remoteAddress || '8.8.8.8';
        try {
          const userLocation = await locationService.getUserLocationFromIP(clientIP);
          searchLocation = userLocation?.city || 'Current Location';
        } catch (error) {
          searchLocation = 'Current Location';
        }
      }

      // Search restaurants using Tavily
      const tavilyResults = await tavilyService.searchRestaurants(query as string, searchLocation);
      
      // Get images for restaurants using SERP
      const restaurantsWithImages = [];
      for (const restaurant of tavilyResults.restaurants.slice(0, 5)) {
        try {
          const images = await serpService.getRestaurantImages(restaurant.name, searchLocation);
          restaurantsWithImages.push({
            ...restaurant,
            images: images.images.slice(0, 3)
          });
        } catch (error) {
          console.error(`Failed to get images for ${restaurant.name}:`, error);
          restaurantsWithImages.push({
            ...restaurant,
            images: []
          });
        }
      }

      res.json({
        query: query as string,
        location: searchLocation,
        summary: tavilyResults.summary,
        restaurants: restaurantsWithImages,
        followUpQuestions: tavilyResults.followUpQuestions
      });
    } catch (error) {
      console.error('Enhanced restaurant search error:', error);
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  // Search restaurants (legacy)
  app.get("/api/search/restaurants", async (req, res) => {
    try {
      const { cuisine, dietary, delivery } = req.query;
      const filters: any = {};
      
      if (dietary) filters.dietary = (dietary as string).split(',');
      if (delivery !== undefined) filters.delivery = delivery === 'true';

      const restaurants = await commerceService.searchRestaurants(cuisine as string, filters);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  // Voice marketplace search with enhanced Amazon integration
  app.get("/api/search/products/voice", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      const results = await amazonService.voiceSearchProducts(query as string);
      res.json(results);
    } catch (error) {
      console.error('Voice marketplace search error:', error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // AI Product Analysis and Multi-Platform Comparison
  app.get("/api/products/:productId/analysis", async (req, res) => {
    try {
      const { productId } = req.params;
      const { productName } = req.query;
      
      if (!productName) {
        return res.status(400).json({ message: "Product name is required for analysis" });
      }

      const analysis = await aiProductAnalysisService.analyzeProductWithComparison(
        productId, 
        productName as string
      );
      
      res.json(analysis);
    } catch (error) {
      console.error('Product analysis error:', error);
      res.status(500).json({ message: "Failed to analyze product" });
    }
  });

  // Multi-Platform Product Search
  app.get("/api/search/multiplatform", async (req: any, res) => {
    try {
      const { query } = req.query;
      const userId = req.user?.id;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Track search behavior
      if (userId) {
        await knowledgeGraphService.trackUserBehavior(
          userId, 
          'search', 
          'product', 
          `search_${Date.now()}`, 
          query as string,
          { searchType: 'multi-platform', query }
        );
      }

      const results = await aiProductAnalysisService.searchMultiPlatform(query as string);
      res.json(results);
    } catch (error) {
      console.error('Multi-platform search error:', error);
      res.status(500).json({ message: "Failed to search across platforms" });
    }
  });

  // AI Product Analysis routes
  app.post("/api/products/analyze", requireAuth, async (req: any, res) => {
    try {
      const { productId, productName } = req.body;
      const userId = req.user?.id;
      
      // Track user behavior
      if (userId) {
        await knowledgeGraphService.trackUserBehavior(
          userId, 
          'analyze', 
          'product', 
          productId, 
          productName,
          { source: 'marketplace' }
        );
      }
      
      const analysis = await aiProductAnalysisService.analyzeProductWithComparison(productId, productName);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing product:", error);
      res.status(500).json({ error: "Failed to analyze product" });
    }
  });

  // Knowledge Graph routes
  app.get("/api/knowledge-graph/profile/:userId", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const profile = await knowledgeGraphService.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Knowledge Graph Insights API endpoint
  app.get("/api/knowledge-graph/insights", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const timeFilter = req.query.timeFilter as string;
      
      // Track that user is viewing their knowledge graph
      await interactionTrackingService.trackInteraction(userId, {
        action: 'view',
        entityType: 'knowledge_graph',
        entityId: 'insights_dashboard',
        entityName: 'Knowledge Graph Dashboard',
        metadata: { timeFilter },
      });
      
      const insights = await interactionTrackingService.getUserInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error getting knowledge graph insights:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  app.get("/api/knowledge-graph/visualization/:userId", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const visualization = await knowledgeGraphService.getKnowledgeGraphVisualization(userId);
      res.json(visualization);
    } catch (error) {
      console.error("Error getting knowledge graph visualization:", error);
      res.status(500).json({ error: "Failed to get visualization data" });
    }
  });

  app.post("/api/knowledge-graph/track", requireAuth, async (req: any, res) => {
    try {
      const { action, entityType, entityId, entityName, metadata = {} } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      await interactionTrackingService.trackInteraction(userId, {
        action, 
        entityType, 
        entityId, 
        entityName, 
        metadata
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking user behavior:", error);
      res.status(500).json({ error: "Failed to track behavior" });
    }
  });

  // Travel Agents endpoints
  app.post("/api/travel-agents/process", requireAuth, async (req: any, res) => {
    try {
      const { message, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const { travelAgentsService } = await import("./services/travel-agents-service");
      const result = await travelAgentsService.processUserRequest(message, userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error processing travel request:", error);
      res.status(500).json({ error: "Failed to process travel request" });
    }
  });

  app.post("/api/travel-agents/debate", requireAuth, async (req: any, res) => {
    try {
      const { request, round, previousMessages, userId } = req.body;
      
      const { travelAgentsService } = await import("./services/travel-agents-service");
      const result = await travelAgentsService.generateDebateRound({
        request,
        round,
        previousMessages
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating debate round:", error);
      res.status(500).json({ error: "Failed to generate debate" });
    }
  });

  app.post("/api/travel-agents/generate-plan", requireAuth, async (req: any, res) => {
    try {
      const { request, userId } = req.body;
      
      const { travelAgentsService } = await import("./services/travel-agents-service");
      const result = await travelAgentsService.generateFinalTripPlan(request, userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating final trip plan:", error);
      res.status(500).json({ error: "Failed to generate trip plan" });
    }
  });

  // Chat negotiation endpoint
  app.post("/api/chat/negotiate", async (req, res) => {
    console.log("=== CHAT NEGOTIATE ENDPOINT HIT ===");
    console.log("Request body:", req.body);
    
    try {
      const { userMessage, sellerName, itemTitle, itemPrice, conversationHistory } = req.body;
      
      console.log("Extracted data:", { userMessage, sellerName, itemTitle, itemPrice });
      
      // Simple AI response without complex service for now
      if (!process.env.GOOGLE_AI_API_KEY) {
        console.log("No API key, using fallback");
        const fallbackResponses = [
          `Hi! Thanks for your interest in the ${itemTitle}. What would you like to know about it?`,
          `Hey there! The ${itemTitle} is in great condition. Are you looking to negotiate on the $${itemPrice} price?`,
          `Hello! I'd be happy to answer any questions about the ${itemTitle}. What can I tell you?`,
          `Hi! Thanks for reaching out about the ${itemTitle}. It's priced at $${itemPrice} - what were you thinking?`
        ];
        const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        console.log("Fallback response:", response);
        return res.json({ response });
      }

      // Try using Google AI directly
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are ${sellerName}, a seller on a marketplace platform. You're selling "${itemTitle}" for $${itemPrice}. 
      A potential buyer just sent you: "${userMessage}"
      
      Chat history: ${conversationHistory.map((msg: any) => `${msg.sender}: ${msg.content}`).join('\n')}
      
      Respond as the seller would - be natural, friendly, and open to reasonable negotiation. 
      Keep responses conversational and realistic. Don't be too eager to drop prices immediately.
      If asked about the item, provide helpful details. If they make an offer, respond thoughtfully.
      
      Keep your response under 200 characters and conversational.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log("AI response:", response);
      
      res.json({ response });
    } catch (error) {
      console.error("Error in chat negotiation:", error);
      
      // Fallback response
      const fallbackResponses = [
        `Hi! Thanks for your interest in the ${req.body.itemTitle}. What would you like to know about it?`,
        `Hey there! The ${req.body.itemTitle} is in great condition. Are you looking to negotiate on the $${req.body.itemPrice} price?`,
        `Hello! I'd be happy to answer any questions about the ${req.body.itemTitle}. What can I tell you?`
      ];
      const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      res.json({ response });
    }
  });

  // AI Recommendations endpoint
  app.post('/api/ai/analyze-recommendations', async (req, res) => {
    try {
      console.log("=== AI RECOMMENDATIONS ENDPOINT HIT ===");
      const { prompt, userData, marketplaceContext } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Use Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        console.log("No GEMINI_API_KEY found, using fallback response");
        const fallbackResponse = {
          marketplaceRecommendations: [
            {"item": "iPhone 14 Pro", "reason": "Matches your technology interest and photography needs", "confidence": 92},
            {"item": "Gaming Setup", "reason": "Perfect for your gaming hobby and within budget", "confidence": 88}
          ],
          restaurantRecommendations: [
            {"restaurant": "Noma SF", "reason": "High-rated Nordic cuisine matching your taste for quality", "confidence": 85}
          ],
          travelRecommendations: [
            {"destination": "Tokyo Photography Tour", "reason": "Combines travel and photography interests", "confidence": 95}
          ],
          groupSuggestions: [
            {"group": "SF Photography Collective", "activity": "Photography meetups", "reason": "Connect with local photographers and share techniques", "confidence": 94}
          ],
          insights: {
            behaviorPattern: "You show strong interest in high-quality technology and creative pursuits",
            trendingInterests: ["Professional Photography", "Gaming Technology", "Local Experiences"],
            budgetOptimization: "Focus on professional-grade equipment that retains value",
            socialRecommendations: "Join photography groups to combine hobby with networking"
          }
        };
        return res.json(fallbackResponse);
      }

      // Try using Gemini directly
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      console.log("Using Gemini AI for recommendations analysis");

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const response = result.response;
      const recommendationsText = response.text();
      
      console.log("Gemini AI response:", recommendationsText);

      try {
        const recommendations = JSON.parse(recommendationsText);
        res.json(recommendations);
      } catch (parseError) {
        console.log("JSON parse error, using fallback:", parseError);
        const fallbackResponse = {
          marketplaceRecommendations: [
            {"item": "iPhone 14 Pro", "reason": "Matches your technology interest and photography needs", "confidence": 92},
            {"item": "Gaming Setup", "reason": "Perfect for your gaming hobby and within budget", "confidence": 88}
          ],
          restaurantRecommendations: [
            {"restaurant": "Noma SF", "reason": "High-rated Nordic cuisine matching your taste for quality", "confidence": 85}
          ],
          travelRecommendations: [
            {"destination": "Tokyo Photography Tour", "reason": "Combines travel and photography interests", "confidence": 95}
          ],
          groupSuggestions: [
            {"group": "SF Photography Collective", "activity": "Photography meetups", "reason": "Connect with local photographers and share techniques", "confidence": 94}
          ],
          insights: {
            behaviorPattern: "You show strong interest in high-quality technology and creative pursuits",
            trendingInterests: ["Professional Photography", "Gaming Technology", "Local Experiences"],
            budgetOptimization: "Focus on professional-grade equipment that retains value",
            socialRecommendations: "Join photography groups to combine hobby with networking"
          }
        };
        res.json(fallbackResponse);
      }

    } catch (error) {
      console.error('Error in AI recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to generate recommendations',
        details: error.message 
      });
    }
  });

  // Search products - now using Amazon integration
  app.get("/api/search/products", async (req, res) => {
    try {
      const { query, category, sustainable, maxPrice, brand } = req.query;
      const filters: any = {};
      
      if (sustainable === 'true') filters.sustainable = true;
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
      if (brand) filters.brand = brand as string;
      if (category) filters.category = category as string;

      const products = await amazonService.searchProducts(query as string || '', filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Get personalized recommendations
  app.get("/api/recommendations", requireAuth, async (req, res) => {
    try {
      const { domain } = req.query;
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user interaction history for personalization
      const conversations = await storage.getConversationsByUser(req.user.id);
      const allMessages = await Promise.all(
        conversations.map(conv => storage.getMessagesByConversation(conv.id))
      );
      const interactionHistory = allMessages.flat();

      // Generate behavior profile
      const behaviorProfile = await personalizationService.generateUserBehaviorProfile(user, interactionHistory);
      
      // Get hyper-personalized recommendations
      const recommendations = await personalizationService.getHyperPersonalizedRecommendations(
        user,
        behaviorProfile,
        { domain: domain as string }
      );

      res.json({
        recommendations,
        behaviorProfile: {
          foodPreferences: behaviorProfile.foodPreferences,
          travelPreferences: behaviorProfile.travelPreferences,
          shoppingPreferences: behaviorProfile.shoppingPreferences
        }
      });
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Search Amazon products
  app.get("/api/amazon/search", async (req, res) => {
    try {
      const { query, category, sustainable, maxPrice, brand } = req.query;
      const filters: any = {};
      
      if (sustainable === 'true') filters.sustainable = true;
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
      if (brand) filters.brand = brand as string;
      if (category) filters.category = category as string;

      const products = await amazonService.searchProducts(query as string, filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to search Amazon products" });
    }
  });

  // Search Zomato restaurants
  app.get("/api/zomato/search", async (req, res) => {
    try {
      const { location, cuisine, dietary, delivery, rating } = req.query;
      const filters: any = {};
      
      if (dietary) filters.dietary = (dietary as string).split(',');
      if (delivery !== undefined) filters.delivery = delivery === 'true';
      if (rating) filters.rating = parseFloat(rating as string);
      if (cuisine) filters.cuisine = cuisine as string;

      const restaurants = await zomatoService.searchRestaurants(location as string, filters);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  // Search MakeMyTrip hotels
  app.get("/api/makemytrip/hotels", async (req, res) => {
    try {
      const { location, checkIn, checkOut, guests, petFriendly, maxPrice, minRating } = req.query;
      const filters: any = {};
      
      if (checkIn) filters.checkIn = checkIn as string;
      if (checkOut) filters.checkOut = checkOut as string;
      if (guests) filters.guests = parseInt(guests as string);
      if (petFriendly === 'true') filters.petFriendly = true;
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
      if (minRating) filters.minRating = parseFloat(minRating as string);

      const hotels = await makeMyTripService.searchHotels(location as string, filters);
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  // Location endpoints for real-time location services
  app.post("/api/location/from-ip", async (req, res) => {
    try {
      const { ip } = req.body;
      const clientIp = ip || req.ip || req.connection.remoteAddress || '8.8.8.8';
      console.log("Location API called with IP:", clientIp);
      
      const { locationService } = await import("./services/location-service");
      const location = await locationService.getUserLocationFromIP(clientIp);
      console.log("Location result:", location);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json(location);
    } catch (error) {
      console.error("Error getting location from IP:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: "Failed to get location" });
    }
  });

  app.post("/api/location/reverse-geocode", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }
      const { locationService } = await import("./services/location-service");
      const location = await locationService.reverseGeocode(latitude, longitude);
      res.json(location);
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      res.status(500).json({ error: "Failed to reverse geocode" });
    }
  });

  // Real-time search endpoints using SERP API
  app.post("/api/search/hotels", async (req, res) => {
    try {
      const { location, checkIn, checkOut, guests } = req.body;
      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }
      const { serpService } = await import("./services/serp-service");
      const hotels = await serpService.searchHotels(location, checkIn, checkOut, guests);
      res.json(hotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      res.status(500).json({ error: "Failed to search hotels" });
    }
  });

  app.post("/api/search/flights", async (req, res) => {
    try {
      const { origin, destination, departureDate, returnDate } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }
      const { serpService } = await import("./services/serp-service");
      const flights = await serpService.searchFlights(origin, destination, departureDate, returnDate);
      res.json(flights);
    } catch (error) {
      console.error("Error searching flights:", error);
      res.status(500).json({ error: "Failed to search flights" });
    }
  });

  app.post("/api/search/restaurants", async (req, res) => {
    try {
      const { location, cuisine, latitude, longitude } = req.body;
      if (!location && (!latitude || !longitude)) {
        return res.status(400).json({ error: "Location or coordinates are required" });
      }
      
      let restaurants;
      if (latitude && longitude) {
        // Use coordinates for more accurate results
        const { zomatoService } = await import("./services/zomato-service");
        restaurants = await zomatoService.searchRestaurants(latitude, longitude, { cuisine });
      } else {
        // Use location string for SERP API
        const { serpService } = await import("./services/serp-service");
        restaurants = await serpService.searchRestaurants(location, cuisine);
      }
      
      res.json(restaurants);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  // Booking messages endpoint
  app.post("/api/booking/messages", async (req, res) => {
    try {
      const { hotelName, hotelLocation } = req.body;
      
      if (!hotelName || !hotelLocation) {
        return res.status(400).json({ error: "Hotel name and location are required" });
      }

      const { bookingService } = await import("./services/booking-service");
      const messages = await bookingService.generateBookingMessages(hotelName, hotelLocation);
      
      res.json({ messages });
    } catch (error) {
      console.error("Error generating booking messages:", error);
      res.status(500).json({ error: "Failed to generate booking messages" });
    }
  });

  // REAL Hotel booking endpoint with email delivery
  app.post("/api/book-hotel", requireAuth, async (req, res) => {
    try {
      const { hotelName, location, checkIn, checkOut, guests, price } = req.body;
      
      if (!hotelName || !location || !checkIn || !checkOut) {
        return res.status(400).json({ error: "Hotel name, location, check-in, and check-out dates are required" });
      }

      if (!req.user?.email) {
        return res.status(400).json({ error: "User email is required for booking confirmation" });
      }

      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = (price || 250) * nights;
      const bookingId = `HTL-${Date.now()}`;
      const confirmationNumber = `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const booking = {
        id: bookingId,
        hotelName,
        location,
        checkIn,
        checkOut,
        guests: guests || 1,
        nights,
        totalAmount,
        confirmationNumber,
        status: "confirmed",
        customerName: req.user?.username || "Guest",
        bookedAt: new Date().toISOString()
      };

      // Send REAL email confirmation using Resend API
      const emailSent = await emailService.sendHotelBookingConfirmation({
        customerName: req.user?.username || "Guest",
        customerEmail: req.user.email,
        hotelName,
        location,
        checkIn: new Date(checkIn).toLocaleDateString(),
        checkOut: new Date(checkOut).toLocaleDateString(),
        nights,
        roomType: "Standard Room",
        totalAmount,
        bookingId,
        confirmationNumber
      });

      res.json({ 
        success: true, 
        booking,
        emailSent,
        message: emailSent ? 
          "Hotel booked successfully! Confirmation email sent to your inbox." : 
          "Hotel booked successfully! (Email delivery failed)"
      });
    } catch (error) {
      console.error("Hotel booking error:", error);
      res.status(500).json({ error: "Failed to book hotel" });
    }
  });

  // REAL Restaurant order endpoint with email delivery
  app.post("/api/order-restaurant", requireAuth, async (req, res) => {
    try {
      const { restaurantName, orderItems, deliveryAddress } = req.body;
      
      if (!restaurantName || !orderItems || !deliveryAddress) {
        return res.status(400).json({ error: "Restaurant name, order items, and delivery address are required" });
      }

      if (!req.user?.email) {
        return res.status(400).json({ error: "User email is required for order confirmation" });
      }

      const totalAmount = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const orderId = `ORD-${Date.now()}`;
      const estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString(); // 45 minutes from now

      const order = {
        id: orderId,
        restaurantName,
        orderItems,
        totalAmount,
        deliveryAddress,
        estimatedDelivery,
        status: "confirmed",
        customerName: req.user?.username || "Guest",
        orderedAt: new Date().toISOString()
      };

      // Send REAL email confirmation
      const emailSent = await emailService.sendRestaurantOrderConfirmation({
        customerName: req.user?.username || "Guest",
        customerEmail: req.user.email,
        restaurantName,
        orderItems,
        totalAmount,
        deliveryAddress,
        estimatedDelivery,
        orderId
      });

      res.json({ 
        success: true, 
        order,
        emailSent,
        message: emailSent ? 
          "Order placed successfully! Confirmation email sent to your inbox." : 
          "Order placed successfully! (Email delivery failed)"
      });
    } catch (error) {
      console.error("Restaurant order error:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // Test email delivery endpoint
  app.post("/api/test-email", requireAuth, async (req, res) => {
    try {
      const { type, userEmail } = req.body;
      
      if (!userEmail || !userEmail.includes('@')) {
        return res.status(400).json({ error: "Valid email address is required" });
      }

      let result = false;
      
      if (type === 'hotel' || !type) {
        result = await emailService.sendHotelBookingConfirmation({
          customerName: req.user?.username || "Test User",
          customerEmail: userEmail,
          hotelName: "The Grand Plaza Hotel",
          location: "San Francisco, CA",
          checkIn: "July 15, 2025",
          checkOut: "July 17, 2025",
          nights: 2,
          roomType: "Deluxe Suite",
          totalAmount: 599.99,
          bookingId: `HTL-TEST-${Date.now()}`,
          confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        });
      } else if (type === 'restaurant') {
        result = await emailService.sendRestaurantOrderConfirmation({
          customerName: req.user?.username || "Test User",
          customerEmail: userEmail,
          restaurantName: "Italian Bistro",
          orderItems: [
            { name: "Margherita Pizza", quantity: 1, price: 18.99 },
            { name: "Caesar Salad", quantity: 1, price: 12.99 }
          ],
          totalAmount: 31.98,
          deliveryAddress: "123 Main St, San Francisco, CA",
          estimatedDelivery: "7:30 PM",
          orderId: `ORD-TEST-${Date.now()}`
        });
      }

      res.json({
        success: result,
        message: result ? 
          `Test ${type || 'hotel'} email sent successfully to ${userEmail}!` : 
          "Email delivery failed. Check API key and email address."
      });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
