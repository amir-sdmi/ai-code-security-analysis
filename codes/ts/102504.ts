import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertCategorySchema,
  insertFoodItemSchema,
  insertShoppingItemSchema,
  insertReceiptSchema 
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Gemini API function
async function analyzeReceiptWithGemini(imageBuffer: Buffer): Promise<{
  text: string;
  extractedItems: Array<{ name: string; category: string; quantity?: number; unit?: string }>;
}> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  console.log("🔑 Checking API key:", GEMINI_API_KEY ? "✅ Found" : "❌ Missing");

  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    throw new Error("Gemini API key not found in environment variables. Please add GEMINI_API_KEY to Secrets.");
  }

  try {
    console.log("📷 Processing image:", {
      size: imageBuffer.length,
      sizeKB: Math.round(imageBuffer.length / 1024)
    });

    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    console.log("🔄 Image converted to base64, length:", base64Image.length);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `このレシートの画像から食品・食材のみを正確に抽出してください。以下のJSON形式で返してください：

{
  "extractedItems": [
    {
      "name": "商品名（正確な名前）",
      "category": "冷蔵室" | "冷凍庫" | "野菜室" | "チルド" | "常温",
      "quantity": 数量（数値、デフォルト1）,
      "unit": "個" | "袋" | "本" | "パック" | "g" | "ml"
    }
  ]
}

重要な注意事項：
- 食品・食材のみを抽出（日用品、雑貨等は除外）
- 商品名は正確に読み取る
- カテゴリは必ず「冷蔵室」「冷凍庫」「野菜室」「チルド」「常温」のいずれかを選択する
- 数量が不明な場合は1を設定
- 最低1個以上の食材を検出するよう努める
- レスポンスは必ずJSON形式で返す`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    console.log("🌐 Sending request to Gemini API...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log("📡 Gemini API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error response:", errorText);
      
      if (response.status === 400) {
        throw new Error("画像の形式が正しくないか、APIリクエストに問題があります");
      } else if (response.status === 403) {
        throw new Error("Gemini API キーが無効です");
      } else if (response.status === 429) {
        throw new Error("API利用制限に達しました。しばらく待ってから再試行してください");
      }
      
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Gemini API response received:", JSON.stringify(result, null, 2));

    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("📝 Generated text:", generatedText);

    // Extract JSON from the response with improved parsing
    let extractedItems = [];
    try {
      // Try to find JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedItems = parsed.extractedItems || [];
        console.log("✅ Successfully parsed items:", extractedItems.length);
      } else {
        console.warn("⚠️ No JSON found in response, trying alternative parsing");
        
        // Fallback: look for items in text format
        const lines = generatedText.split('\n');
        for (const line of lines) {
          if (line.includes('名') || line.includes('食材') || line.includes('商品')) {
            // Simple text parsing fallback
            const itemName = line.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0041-\u005A\u0061-\u007A\u0030-\u0039]/g, '').trim();
            if (itemName.length > 0) {
              extractedItems.push({
                name: itemName,
                category: "冷蔵",
                quantity: 1,
                unit: "個"
              });
            }
          }
        }
      }
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", parseError);
      console.error("Raw response text:", generatedText);
      
      // Last resort: extract any Japanese food words
      const foodPattern = /(豆腐|肉|魚|野菜|米|パン|卵|牛乳|チーズ|ヨーグルト|果物|トマト|きゅうり|にんじん|たまねぎ|じゃがいも|キャベツ|レタス|ほうれん草)/g;
      const matches = generatedText.match(foodPattern);
      if (matches) {
        extractedItems = matches.map(item => ({
          name: item,
          category: "冷蔵",
          quantity: 1,
          unit: "個"
        }));
        console.log("🔄 Extracted using pattern matching:", extractedItems.length);
      }
    }

    console.log("📊 Final extracted items:", extractedItems);

    return {
      text: generatedText,
      extractedItems
    };
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to analyze receipt with Gemini API");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 認証回避のための直接アクセスルート
  app.get('/direct', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>食材管理アプリ - 直接アクセス</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
    .logo { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #333; margin-bottom: 16px; font-size: 24px; }
    p { color: #666; line-height: 1.6; margin-bottom: 32px; }
    .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: transform 0.2s; }
    .button:hover { transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🥗</div>
    <h1>食材管理アプリ</h1>
    <p>各ユーザーが個別のデータを持つ食材管理アプリです。ブラウザごとに独立した在庫データを管理できます。</p>
    <button class="button" onclick="loadApp()">アプリを開く</button>
    <div id="app"></div>
  </div>
  <script>
    function loadApp() {
      // Viteの開発サーバーから直接読み込み
      fetch('/api/auth/user').then(() => {
        document.getElementById('app').innerHTML = '<iframe src="/" width="100%" height="600px" frameborder="0"></iframe>';
      }).catch(() => {
        window.location.href = '/';
      });
    }
  </script>
</body>
</html>
    `);
  });

  // 認証エンドポイントを全てゲストレスポンスに変更
  app.get('/api/auth/user', async (req, res) => {
    const userId = getUserIdFromRequest(req);
    await ensureUserExists(userId);

    res.json({
      id: userId,
      email: `${userId}@example.com`,
      firstName: "Guest",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // その他の認証ルートはdirectページにリダイレクト
  app.all('/api/login*', (req, res) => res.redirect('/direct'));
  app.all('/api/logout*', (req, res) => res.redirect('/direct'));
  app.all('/api/callback*', (req, res) => res.redirect('/direct'));
  app.all('/auth*', (req, res) => res.redirect('/direct'));

  // Function to generate unique user ID
  function generateUniqueUserId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Function to get or create user ID from headers
  function getUserIdFromRequest(req: any): string {
    const userIdFromHeader = req.headers['x-user-id'];
    
    // より詳細なログ出力
    console.log('=== User ID Request Debug ===');
    console.log('Raw header value:', userIdFromHeader);
    console.log('Header type:', typeof userIdFromHeader);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('All headers:', Object.keys(req.headers));

    if (userIdFromHeader && 
        typeof userIdFromHeader === 'string' &&
        userIdFromHeader !== 'undefined' && 
        userIdFromHeader !== 'null' && 
        userIdFromHeader.trim() !== '' &&
        (userIdFromHeader.startsWith('guest_') || userIdFromHeader.startsWith('user_'))) {
      console.log('✅ Using valid user ID from header:', userIdFromHeader);
      return userIdFromHeader;
    }

    // Generate fallback user ID only if absolutely necessary
    console.error('❌ CRITICAL: No valid user ID found in header, this will cause data loss!');
    console.error('Expected header: x-user-id, got:', userIdFromHeader);
    const newUserId = generateUniqueUserId();
    console.log('🆕 Generated fallback user ID:', newUserId);
    return newUserId;
  }

  // Function to ensure user exists
  async function ensureUserExists(userId: string) {
    try {
      let user = await storage.getUser(userId);
      if (!user) {
        await storage.upsertUser({
          id: userId,
          email: `${userId}@example.com`,
          firstName: "Guest",
          lastName: "User",
          profileImageUrl: null,
        });
      }
    } catch (error) {
      console.log(`Creating user ${userId}...`);
    }
  }

  // Initialize default categories for new users
  app.post('/api/categories/init', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);

      // Check if user already has categories
      const existingCategories = await storage.getUserCategories(userId);
      if (existingCategories.length > 0) {
        return res.json(existingCategories);
      }

      // Create default categories
      const defaultCategories = [
        { name: "冷蔵", icon: "fas fa-snowflake", color: "#2196F3", userId },
        { name: "野菜室", icon: "fas fa-leaf", color: "#4CAF50", userId },
        { name: "冷凍庫", icon: "fas fa-icicles", color: "#6366f1", userId },
        { name: "チルド", icon: "fas fa-thermometer-half", color: "#9C27B0", userId },
      ];

      const createdCategories = await Promise.all(
        defaultCategories.map(cat => storage.createCategory(cat))
      );

      res.json(createdCategories);
    } catch (error) {
      console.error("Error initializing categories:", error);
      res.status(500).json({ message: "Failed to initialize categories" });
    }
  });

  // Get categories
  app.get('/api/categories', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      console.log("Fetching categories for user:", userId);
      await ensureUserExists(userId);

      let categories = await storage.getUserCategories(userId);
      console.log("Found categories:", categories?.length || 0);

      // If no categories exist, initialize default ones
      if (!categories || categories.length === 0) {
        console.log("No categories found, initializing defaults for user:", userId);
        try {
          await storage.initializeDefaultCategories(userId);
          categories = await storage.getUserCategories(userId);
          console.log("Categories after initialization:", categories?.length || 0);
        } catch (initError) {
          console.error("Error initializing categories:", initError);
          // Return empty array if initialization fails
          categories = [];
        }
      }

      console.log("Returning categories:", categories);
      res.json(categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories", error: error.message });
    }
  });

  app.post('/api/categories', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Food item routes
  app.get('/api/food-items', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const { categoryId } = req.query;
      
      console.log("Fetching food items for user:", userId);

      let items;
      if (categoryId) {
        items = await storage.getFoodItemsByCategory(userId, parseInt(categoryId as string));
      } else {
        items = await storage.getAllFoodItems(userId);
      }
      
      console.log("Found food items:", items.length);
      res.json(items);
    } catch (error) {
      console.error("Error fetching food items:", error);
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.post('/api/food-items', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      console.log("Raw request body:", req.body);
      console.log("User ID:", userId);
      console.log("Content-Type:", req.get('Content-Type'));

      const dataToValidate = { ...req.body, userId };
      console.log("Data to validate:", dataToValidate);

      const itemData = insertFoodItemSchema.parse(dataToValidate);
      console.log("Validated data:", itemData);

      const item = await storage.createFoodItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating food item:", error);
      if (error instanceof Error && 'issues' in error) {
        console.error("Validation errors:", error.issues);
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  app.put('/api/food-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await storage.updateFoodItem(parseInt(id), updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating food item:", error);
      res.status(500).json({ message: "Failed to update food item" });
    }
  });

  app.delete('/api/food-items/:id', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const itemId = parseInt(req.params.id);
      const success = await storage.deleteFoodItem(itemId, userId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Food item not found" });
      }
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  app.post('/api/food-items/batch', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      
      // Handle both {items: [...]} and direct array formats
      const itemsData = Array.isArray(req.body) ? req.body : req.body.items;

      if (!Array.isArray(itemsData) || itemsData.length === 0) {
        return res.status(400).json({ message: "Items array is required" });
      }

      console.log("Batch create request:", { userId, itemsCount: itemsData.length, items: itemsData });

      const results = [];
      const errors = [];
      
      for (const item of itemsData) {
        try {
          // Validate required fields
          if (!item.name || !item.categoryId) {
            errors.push(`Item missing required fields: ${JSON.stringify(item)}`);
            continue;
          }

          // Validate and prepare item data
          const itemData = insertFoodItemSchema.parse({
            name: item.name.trim(),
            categoryId: parseInt(item.categoryId.toString()),
            userId,
            quantity: parseInt(item.quantity?.toString() || "1") || 1,
            unit: item.unit || "個",
            expiryDate: item.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          console.log("Creating food item:", itemData);
          const foodItem = await storage.createFoodItem(itemData);
          results.push(foodItem);
          console.log("Successfully created food item:", foodItem.id);
        } catch (itemError) {
          console.error("Error creating individual food item:", itemError);
          console.error("Item data:", item);
          errors.push(`Failed to create item ${item.name}: ${itemError.message}`);
        }
      }

      console.log("Batch creation completed:", { 
        successCount: results.length, 
        totalCount: itemsData.length, 
        errors: errors.length 
      });

      if (results.length === 0) {
        return res.status(400).json({ 
          message: "No items could be created", 
          errors,
          success: false 
        });
      }

      res.json({ 
        success: true, 
        items: results, 
        totalCreated: results.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error creating batch food items:", error);
      res.status(500).json({ message: "Failed to create food items", error: error.message });
    }
  });

  app.get('/api/food-items/expiring', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const days = parseInt(req.query.days as string) || 3;
      const items = await storage.getExpiringItems(userId, days);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expiring items:", error);
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  // Fix expiry dates for existing items
  app.post('/api/food-items/fix-expiry-dates', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const allItems = await storage.getAllFoodItems(userId);

      const getExpiryDays = (itemName: string, categoryId: number): number => {
        const name = itemName.toLowerCase();

        // 肉類 (categoryId 4 = チルド)
        if (categoryId === 4 || name.includes('肉') || name.includes('ミンチ')) {
          return 3; // 3日
        }

        // 野菜類
        if (categoryId === 1) {
          if (name.includes('レタス') || name.includes('小松菜') || name.includes('キャベツ')) {
            return 5; // 葉物野菜 5日
          }
          if (name.includes('たまねぎ') || name.includes('にんにく') || name.includes('じゃがいも')) {
            return 30; // 根菜類 30日
          }
          if (name.includes('トマト') || name.includes('きゅうり')) {
            return 7; // 一般野菜 7日
          }
          if (name.includes('しいたけ') || name.includes('きのこ')) {
            return 4; // きのこ類 4日
          }
          return 7; // その他野菜
        }

        // 飲み物 (categoryId 2)
        if (categoryId === 2) {
          if (name.includes('綾鷹') || name.includes('お茶') || name.includes('ペット')) {
            return 60; // ペットボトル飲料 60日
          }
          if (name.includes('牛乳') || name.includes('ミルク')) {
            return 5; // 牛乳 5日
          }
          return 30; // その他飲み物
        }

        // 果物
        if (name.includes('レモン') || name.includes('りんご')) {
          return 14; // 柑橘類・りんご 14日
        }
        if (name.includes('キウイ') || name.includes('バナナ')) {
          return 7; // その他果物 7日
        }

        return 7; // デフォルト
      };

      const updatedItems = [];
      for (const item of allItems) {
        const expiryDays = getExpiryDays(item.name, item.categoryId);
        const newExpiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const updatedItem = await storage.updateFoodItem(item.id, {
          expiryDate: newExpiryDate
        });
        updatedItems.push(updatedItem);
      }

      res.json({ message: "Expiry dates updated", updatedCount: updatedItems.length });
    } catch (error) {
      console.error("Error fixing expiry dates:", error);
      res.status(500).json({ message: "Failed to fix expiry dates" });
    }
  });

  // Shopping list routes
  app.get('/api/shopping-items', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const items = await storage.getShoppingItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      res.status(500).json({ message: "Failed to fetch shopping items" });
    }
  });

  app.post('/api/shopping-items', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const itemData = insertShoppingItemSchema.parse({ ...req.body, userId });
      const item = await storage.createShoppingItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating shopping item:", error);
      res.status(500).json({ message: "Failed to create shopping item" });
    }
  });

  app.put('/api/shopping-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await storage.updateShoppingItem(parseInt(id), updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating shopping item:", error);
      res.status(500).json({ message: "Failed to update shopping item" });
    }
  });

  app.delete('/api/shopping-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShoppingItem(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping item:", error);
      res.status(500).json({ message: "Failed to delete shopping item" });
    }
  });

  // Receipt OCR route
  app.post('/api/receipts/analyze', upload.single('receipt'), async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);

      if (!req.file) {
        return res.status(400).json({ message: "No receipt image provided" });
      }

      // Analyze receipt with Gemini API
      const analysis = await analyzeReceiptWithGemini(req.file.buffer);

      // Get user's categories to map names to IDs
      const userCategories = await storage.getUserCategories(userId);
      const categoryMap = new Map(userCategories.map(c => [c.name, c.id]));

      // Ensure a default "常温" category exists for fallback
      if (!categoryMap.has("常温")) {
        const newCategory = await storage.createCategory({
          name: "常温",
          icon: "fas fa-box",
          color: "#A9A9A9",
          userId,
        });
        categoryMap.set(newCategory.name, newCategory.id);
        console.log('Created default "常温" category.');
      }
      const defaultCategoryId = categoryMap.get("常温");

      // Save extracted items to foodItems table
      const createdFoodItems = [];
      console.log(`[DIAGNOSTIC] Starting to process ${analysis.extractedItems.length} extracted items.`);

      if (analysis.extractedItems && analysis.extractedItems.length > 0) {
        for (const item of analysis.extractedItems) {
          console.log(`[DIAGNOSTIC] Processing item: ${JSON.stringify(item)}`);
          const categoryId = categoryMap.get(item.category) || defaultCategoryId;
          console.log(`[DIAGNOSTIC] Mapped category: "${item.category}" to categoryId: ${categoryId}`);
          
          if (categoryId) {
            try {
              const foodItemData = {
                userId,
                name: item.name,
                categoryId,
                quantity: item.quantity || 1,
                unit: item.unit || '個',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              };
              console.log(`[DIAGNOSTIC] Attempting to save to DB: ${JSON.stringify(foodItemData)}`);
              const newFoodItem = await storage.createFoodItem(foodItemData);
              createdFoodItems.push(newFoodItem);
              console.log(`[DIAGNOSTIC] Successfully saved item ID: ${newFoodItem.id}`);
            } catch (dbError) {
              console.error(`[DIAGNOSTIC] FAILED to save item "${item.name}" to database:`, dbError);
            }
          } else {
            console.warn(`[DIAGNOSTIC] Could not find or create a category for item: "${item.name}"`);
          }
        }
      }
      console.log(`[DIAGNOSTIC] Finished processing items. Total saved: ${createdFoodItems.length}`);

      // Save receipt record
      const receiptData = insertReceiptSchema.parse({
        userId,
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        ocrText: analysis.text,
        extractedItems: analysis.extractedItems,
      });

      const receipt = await storage.createReceipt(receiptData);

      res.json({
        receipt,
        extractedItems: analysis.extractedItems,
        createdFoodItems, // Return the newly created food items
      });
    } catch (error) {
      console.error("Error analyzing receipt:", error);
      res.status(500).json({ message: "Failed to analyze receipt" });
    }
  });

  // Nutrition summary route
  app.get('/api/nutrition/summary', async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      await ensureUserExists(userId);
      const items = await storage.getAllFoodItems(userId);

      // Calculate total nutrition (simplified calculation)
      const totalNutrition = items.reduce((acc, item) => {
        const factor = item.quantity || 1;
        return {
          protein: acc.protein + (item.protein || 0) * factor,
          carbs: acc.carbs + (item.carbs || 0) * factor,
          fats: acc.fats + (item.fats || 0) * factor,
          calories: acc.calories + (item.calories || 0) * factor,
        };
      }, { protein: 0, carbs: 0, fats: 0, calories: 0 });

      // Calculate percentages (simplified daily targets)
      const dailyTargets = { protein: 60, carbs: 300, fats: 60 }; // grams
      const percentages = {
        protein: Math.min((totalNutrition.protein / dailyTargets.protein) * 100, 100),
        carbs: Math.min((totalNutrition.carbs / dailyTargets.carbs) * 100, 100),
        fats: Math.min((totalNutrition.fats / dailyTargets.fats) * 100, 100),
      };

      res.json({
        totals: totalNutrition,
        percentages,
        targets: dailyTargets,
      });
    } catch (error) {
      console.error("Error calculating nutrition summary:", error);
      res.status(500).json({ message: "Failed to calculate nutrition summary" });
    }
  });

  // Community posts endpoints
  app.get("/api/community/posts", async (req, res) => {
    try {
      const posts = await storage.getCommunityPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.post("/api/community/posts", async (req, res) => {
    try {
      const { content, type = "tip", username = "匿名ユーザー" } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const newPost = await storage.createCommunityPost({
        userId: "guest",
        username,
        content: content.trim(),
        type,
        likes: 0,
        replies: 0,
        tags: []
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Feedback endpoints
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedbackItems();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ message: "Title and description are required" });
      }

      const newFeedback = await storage.createFeedbackItem({
        userId: "guest",
        title: title.trim(),
        description: description.trim(),
        status: "submitted",
        votes: 0
      });

      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}