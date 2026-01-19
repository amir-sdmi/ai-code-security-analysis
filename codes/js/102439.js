import { GoogleGenerativeAI } from "@google/generative-ai";
// import orderModel from "../models/orderModel.js";
import foodModel from "../models/foodModel.js";
// import restaurantModel from "../models/restaurantModel.js";
import dotenv from "dotenv";

dotenv.config();

// Static food data as fallback (from assets.js structure)
const STATIC_FOOD_LIST = [
    { _id: "1", name: "Greek salad", price: 150, description: "Fresh vegetables with olive oil", category: "Salad" },
    { _id: "2", name: "Veg salad", price: 120, description: "Mixed vegetable salad", category: "Salad" },
    { _id: "3", name: "Chicken Salad", price: 200, description: "Grilled chicken with fresh greens", category: "Salad" },
    { _id: "4", name: "Lasagna Rolls", price: 180, description: "Delicious pasta rolls", category: "Rolls" },
    { _id: "5", name: "Peri Peri Rolls", price: 160, description: "Spicy peri peri chicken rolls", category: "Rolls" },
    { _id: "6", name: "Chicken Rolls", price: 190, description: "Tender chicken wrapped in soft bread", category: "Rolls" },
    { _id: "7", name: "Veg Rolls", price: 140, description: "Fresh vegetable rolls", category: "Rolls" },
    { _id: "8", name: "Vanilla Ice Cream", price: 80, description: "Creamy vanilla ice cream", category: "Dessert" },
    { _id: "9", name: "Chocolate Cake", price: 250, description: "Rich chocolate cake", category: "Cake" },
    { _id: "10", name: "Chicken Sandwich", price: 170, description: "Grilled chicken sandwich", category: "Sandwich" },
    { _id: "11", name: "Vegan Sandwich", price: 150, description: "Plant-based sandwich", category: "Sandwich" },
    { _id: "12", name: "Cheese Pasta", price: 220, description: "Creamy cheese pasta", category: "Pasta" },
    { _id: "13", name: "Chicken Pasta", price: 280, description: "Pasta with grilled chicken", category: "Pasta" },
    { _id: "14", name: "Veg Noodles", price: 160, description: "Stir-fried vegetable noodles", category: "Noodles" },
    { _id: "15", name: "Chicken Pizza", price: 350, description: "Wood-fired chicken pizza", category: "Pizza" }
];

// Menu categories (from assets.js structure)
const MENU_CATEGORIES = [
    "Rolls", "Salad", "Dessert", "Sandwich", "Cake", "Veg", "MainC", "Appetizer", 
    "Pizza", "Sushi", "Sashimi", "Soup", "Tacos", "Burritos", "Pasta", "Noodles"
];

// Input sanitizer
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 500)
    .trim();
};

// API key validation
const isApiKeyValid = process.env.GEMINI_API_KEY;
let genAI = isApiKeyValid ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const EATZONE_KNOWLEDGE = {
  quickResponses: {
    greeting: "Hi! Welcome to Eatzone! 🍽️ How can I help you today?",
    thanks: "You're welcome! Enjoy your delicious meal! 😊",
    goodbye: "Thanks for choosing Eatzone! Order again soon! 🚀",
  },
  commonIssues: {
    refund: "For refunds, email contact@eatzone.com with your order screenshot. Refunds take 3-5 business days.",
    orderDelay: "Call +91 9876554321 for order status. Normal delivery time is 30-45 minutes.",
    payment: "We accept all major cards, UPI, and digital wallets. Contact support if payment fails.",
    login: "Sign in with your Google account for easy access and order tracking.",
    cart: "Your cart items are saved when you're logged in. Add items and checkout easily!"
  },
  appInfo: {
    deliveryTime: "We deliver fresh food in 30-45 minutes",
    deliveryFee: "Free delivery on orders above ₹299",
    minimumOrder: "Minimum order value is ₹99",
    workingHours: "We're open 24/7 for your convenience",
    paymentMethods: "Cards, UPI, Net Banking, Digital Wallets accepted",
    customerSupport: "24/7 support at +91 9876554321"
  },
  orderingProcess: [
    "1. Browse our menu and select items",
    "2. Add items to cart with + button", 
    "3. Go to cart and review your order",
    "4. Proceed to checkout",
    "5. Enter delivery address",
    "6. Choose payment method",
    "7. Place order and track delivery"
  ]
};

// Keyword-based recommendation function (kept for potential future use)
// const getKeywordRecommendations = async (text) => { ... }

// Enhanced intent detector with better context understanding
const detectChatMode = (message) => {
  const lower = message.toLowerCase();

  // Support keywords - check these FIRST to avoid conflicts
  const supportKeywords = ['refund', 'track order', 'order status', 'cancel order', 'payment failed', 'payment problem', 'login problem', 'account issue', 'help', 'support', 'complaint', 'error', 'contact', 'phone number'];

  // Check for support issues FIRST (highest priority)
  if (supportKeywords.some(k => lower.includes(k))) {
    return 'support';
  }

  // Specific support phrases
  if (lower.includes('track') && lower.includes('order')) return 'support';
  if (lower.includes('cancel') && lower.includes('order')) return 'support';
  if (lower.includes('refund')) return 'support';
  if (lower.includes('payment') && (lower.includes('failed') || lower.includes('problem') || lower.includes('issue'))) return 'support';

  // Feedback keywords
  const feedbackKeywords = ['feedback', 'review', 'rating', 'experience', 'service was', 'food was', 'delivery was', 'app is', 'website is'];

  // Check for feedback
  if (feedbackKeywords.some(k => lower.includes(k))) {
    return 'feedback';
  }

  // Specific feedback phrases
  if (lower.includes('good') || lower.includes('bad') || lower.includes('great') || lower.includes('terrible')) {
    // Only if it's about experience/service/food
    if (lower.includes('food') || lower.includes('service') || lower.includes('delivery') || lower.includes('experience') || lower.includes('app')) {
      return 'feedback';
    }
  }

  // Food recommendation keywords - more specific
  const foodKeywords = ['chicken', 'pizza', 'pasta', 'salad', 'sandwich', 'dessert', 'ice cream', 'vegetarian', 'veg items', 'rolls', 'noodles', 'biryani', 'curry'];
  const recommendKeywords = ['recommend', 'suggest', 'what should i eat', 'what food', 'show me food', 'hungry', 'craving', 'menu'];

  // Check for affirmative responses (likely continuing a food conversation)
  if (lower === 'yes' || lower === 'yeah' || lower === 'yep' || lower === 'ok' || lower === 'okay' || lower === 'sure') {
    return 'recommendation';
  }

  // Check for specific food items
  if (foodKeywords.some(k => lower.includes(k))) {
    return 'recommendation';
  }

  // Check for recommendation keywords
  if (recommendKeywords.some(k => lower.includes(k))) {
    return 'recommendation';
  }

  // Ordering process keywords
  const orderingKeywords = ['how to order', 'place order', 'checkout', 'how do i order', 'steps to order'];

  // Check for ordering process
  if (orderingKeywords.some(k => lower.includes(k))) {
    return 'ordering';
  }

  return 'general';
};

// Add item to cart from chatbot
export const addToCartFromChat = async (req, res) => {
  try {
    const { itemId, userId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    // Find the food item
    const foodItem = await foodModel.findById(itemId);
    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // If user is logged in, add to their cart in database
    if (userId && userId !== "guest") {
      // Import userModel here to avoid circular dependency
      const { default: userModel } = await import("../models/userModel.js");

      const user = await userModel.findById(userId);
      if (user) {
        if (!user.cartData) user.cartData = {};
        user.cartData[itemId] = (user.cartData[itemId] || 0) + 1;
        await user.save();

        return res.json({
          success: true,
          message: `${foodItem.name} added to your cart!`,
          cartCount: Object.values(user.cartData).reduce((sum, count) => sum + count, 0)
        });
      }
    }

    // For guest users, return success message (frontend will handle localStorage)
    res.json({
      success: true,
      message: `${foodItem.name} added to cart!`,
      item: {
        id: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        image: foodItem.image
      }
    });
  } catch (error) {
    console.error("Add to cart from chat error:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

export const chatWithBot = async (req, res) => {
  if (!isApiKeyValid) {
    return res.json({ reply: "🤖 Chatbot unavailable. Contact +91 9876554321." });
  }

  const rawMessage = req.body.message || '';
  // const userId = req.body.userId || req.userId || "guest";
  const message = sanitizeInput(rawMessage);

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const detectedMode = detectChatMode(message);
  let chatMode = req.body.chatMode || detectedMode;

  // Only override if the detected mode is more specific than the provided mode
  if (req.body.chatMode && detectedMode !== 'general') {
    // If user explicitly set a mode but we detect a more specific intent, use detected
    if (detectedMode === 'support' || detectedMode === 'feedback') {
      chatMode = detectedMode;
    }
  }

  // Order history for potential future personalization
  // let recentOrders = [];
  // try {
  //   if (userId !== "guest") {
  //     recentOrders = await orderModel.find({ userId }).sort({ date: -1 }).limit(3);
  //   }
  // } catch (err) {
  //   console.error("Order fetch failed:", err);
  // }
  // const pastFood = recentOrders.flatMap(o => o.items.map(i => i.name)).slice(0, 3).join(', ') || "No past orders";

  // Fetch comprehensive food data
  let allFoodItems = [];
  
  try {
    // Get food items from database
    const dbFoodItems = await foodModel.find({}).limit(50);
    allFoodItems = dbFoodItems.length > 0 ? dbFoodItems : STATIC_FOOD_LIST;
  } catch (error) {
    console.error('Error fetching data:', error);
    allFoodItems = STATIC_FOOD_LIST;
  }

  // Create comprehensive food menu for Gemini
  const formattedMenu = allFoodItems.map(item =>
    `${item.name} - ₹${item.price} (${item.category})`
  ).join('\n');

  // Create intelligent prompts for Gemini based on chat mode
  let prompt = '';
  let maxTokens = 100;

  if (chatMode === 'support') {
    // Handle support queries directly for better accuracy
    const msg = message.toLowerCase();
    let supportResponse = '';

    if (msg.includes('order') && (msg.includes('status') || msg.includes('track') || msg.includes('where'))) {
      supportResponse = "📦 To track your order: Go to 'My Orders' in your profile or call +91 9876554321 with your order ID. Orders typically arrive in 30-45 minutes.";
    } else if (msg.includes('cancel') && msg.includes('order')) {
      supportResponse = "❌ To cancel your order: Call +91 9876554321 immediately. Orders can only be cancelled within 5 minutes of placing. After that, contact support for assistance.";
    } else if (msg.includes('refund') || msg.includes('money back')) {
      supportResponse = "💰 For refunds: Email contact@eatzone.com with your order screenshot and reason. Refunds are processed within 3-5 business days to your original payment method.";
    } else if (msg.includes('delivery') && (msg.includes('time') || msg.includes('how long') || msg.includes('when'))) {
      supportResponse = "🚚 Delivery time: 30-45 minutes for most orders. Free delivery on orders above ₹299. For delays, call +91 9876554321.";
    } else if (msg.includes('payment') && (msg.includes('failed') || msg.includes('problem') || msg.includes('issue'))) {
      supportResponse = "💳 Payment issues: We accept cards, UPI, net banking, and digital wallets. If payment fails, try a different method or contact +91 9876554321.";
    } else if (msg.includes('login') || msg.includes('account') || msg.includes('sign in')) {
      supportResponse = "🔐 Login help: Use your Google account for easy access. If you're having trouble, clear browser cache or try incognito mode. Contact support: +91 9876554321.";
    } else if (msg.includes('cart') && (msg.includes('empty') || msg.includes('lost') || msg.includes('missing'))) {
      supportResponse = "🛒 Cart issues: Items are saved when you're logged in. If cart is empty, please log in again. For persistent issues, call +91 9876554321.";
    } else if (msg.includes('contact') || msg.includes('phone') || msg.includes('email') || msg.includes('support')) {
      supportResponse = "📞 Contact Eatzone Support:\n• Phone: +91 9876554321 (24/7)\n• Email: contact@eatzone.com\n• Response time: Within 2 hours";
    } else if (msg.includes('minimum') && msg.includes('order')) {
      supportResponse = "💵 Minimum order: ₹99. Free delivery on orders above ₹299. Delivery charges: ₹40 for orders below ₹299.";
    } else if (msg.includes('working hours') || msg.includes('open') || msg.includes('timing')) {
      supportResponse = "🕐 Eatzone is available 24/7! Order anytime, anywhere. Customer support is also available round the clock.";
    } else {
      // Use AI for complex support queries
      prompt = `You are Eatzone's customer support assistant. Be helpful and provide specific solutions.

EATZONE SUPPORT INFORMATION:
- Refunds: Email contact@eatzone.com with order screenshot. Takes 3-5 business days.
- Order tracking: Go to 'My Orders' or call +91 9876554321. Delivery: 30-45 minutes.
- Payment issues: We accept cards, UPI, digital wallets. Contact support if payment fails.
- Login help: Use Google account for easy access and order tracking.
- Cart issues: Items are saved when logged in.
- Delivery: Free delivery on orders above ₹299. Minimum order ₹99.
- Working hours: 24/7 service
- Support: +91 9876554321 or contact@eatzone.com

USER QUERY: "${message}"

Provide a helpful, specific response in 1-2 sentences. Be friendly and professional.`;
      maxTokens = 100;
    }

    if (supportResponse) {
      return res.json({ reply: supportResponse });
    }
  } else if (chatMode === 'ordering') {
    prompt = `You are Eatzone's ordering assistant. Help users understand how to place orders.

ORDERING PROCESS:
1. Browse menu and select items
2. Add items to cart with + button
3. Go to cart and review order
4. Proceed to checkout
5. Enter delivery address
6. Choose payment method
7. Place order and track delivery

DELIVERY INFO:
- Delivery time: 30-45 minutes
- Free delivery on orders above ₹299
- Minimum order: ₹99
- Payment: Cards, UPI, Net Banking, Digital Wallets

USER QUERY: "${message}"

Provide step-by-step guidance in a friendly, clear manner. Keep it concise.`;
    maxTokens = 80;
  } else if (chatMode === 'feedback') {
    // Handle feedback queries directly
    const msg = message.toLowerCase();
    let feedbackResponse = '';

    if (msg.includes('good') || msg.includes('great') || msg.includes('excellent') || msg.includes('amazing') || msg.includes('love') || msg.includes('awesome')) {
      feedbackResponse = "🌟 Thank you for the positive feedback! We're thrilled you enjoyed your Eatzone experience. Your satisfaction motivates us to keep delivering great food and service!";
    } else if (msg.includes('bad') || msg.includes('terrible') || msg.includes('worst') || msg.includes('hate') || msg.includes('awful') || msg.includes('poor')) {
      feedbackResponse = "😔 We're sorry to hear about your disappointing experience. Please share more details so we can improve. Contact our support team at +91 9876554321 or contact@eatzone.com for immediate assistance.";
    } else if (msg.includes('delivery') && (msg.includes('late') || msg.includes('slow') || msg.includes('delay'))) {
      feedbackResponse = "🚚 We apologize for the delivery delay. We're working to improve our delivery times. Please call +91 9876554321 with your order details for compensation or future discounts.";
    } else if (msg.includes('food') && (msg.includes('cold') || msg.includes('quality') || msg.includes('taste'))) {
      feedbackResponse = "🍽️ We're sorry the food quality wasn't up to your expectations. Please contact +91 9876554321 immediately for a replacement or refund. Your feedback helps us maintain quality standards.";
    } else if (msg.includes('app') || msg.includes('website') || msg.includes('interface') || msg.includes('ui')) {
      feedbackResponse = "📱 Thank you for your app feedback! We're constantly improving our user experience. Please share specific suggestions at contact@eatzone.com - your input shapes our updates!";
    } else if (msg.includes('price') || msg.includes('expensive') || msg.includes('cost') || msg.includes('cheap')) {
      feedbackResponse = "💰 We appreciate your feedback on pricing. We strive to offer value for money with quality food. Check our daily deals and combo offers for better savings!";
    } else if (msg.includes('staff') || msg.includes('service') || msg.includes('customer care')) {
      feedbackResponse = "👥 Thank you for your service feedback. Our team works hard to provide excellent customer care. Please share specific details at contact@eatzone.com so we can recognize good service or address concerns.";
    } else {
      // Use AI for complex feedback
      prompt = `You are Eatzone's feedback assistant. Acknowledge feedback warmly and guide users appropriately.

FEEDBACK GUIDELINES:
- Thank users for positive feedback
- Apologize and offer solutions for negative feedback
- Ask for specific details when needed
- Provide contact information for serious issues
- Encourage detailed feedback for improvements

USER FEEDBACK: "${message}"

Respond empathetically and professionally. Offer next steps if needed.`;
      maxTokens = 100;
    }

    if (feedbackResponse) {
      return res.json({ reply: feedbackResponse });
    }
  } else if (chatMode === 'recommendations' || chatMode === 'recommendation') {
    // Analyze the user's request for specific preferences
    const msg = message.toLowerCase();
    let contextualPrompt = '';

    if (msg.includes('light') || msg.includes('healthy')) {
      contextualPrompt = `The user wants LIGHT/HEALTHY food options. Focus on salads, light snacks, and healthy items.`;
    } else if (msg.includes('heavy') || msg.includes('filling') || msg.includes('meal')) {
      contextualPrompt = `The user wants HEAVY/FILLING meal options. Focus on main courses, pasta, pizza, and substantial items.`;
    } else if (msg.includes('chicken')) {
      contextualPrompt = `The user specifically wants CHICKEN items. Show ONLY chicken dishes from the menu with exact names and prices. Be direct and list specific chicken items immediately.`;
    } else if (msg.includes('veg') || msg.includes('vegetarian')) {
      contextualPrompt = `The user wants VEGETARIAN options. Show ONLY veg items from the menu with exact names and prices. Be direct and list specific veg items immediately.`;
    } else if (msg.includes('dessert') || msg.includes('sweet') || msg.includes('cake')) {
      contextualPrompt = `The user wants DESSERTS/SWEETS. Show ONLY dessert items from the menu with exact names and prices. Be direct and list specific dessert items immediately.`;
    } else if (msg.includes('spicy') || msg.includes('hot')) {
      contextualPrompt = `The user wants SPICY/HOT food. Show ONLY spicy items from the menu with exact names and prices. Be direct and list specific spicy items immediately.`;
    } else if (msg.includes('meal') || msg.includes('main course')) {
      contextualPrompt = `The user wants MEAL/MAIN COURSE options. Show ONLY main course items from the menu with exact names and prices. Be direct and list specific meal items immediately.`;
    } else if (msg === 'yes' || msg === 'yeah' || msg === 'ok' || msg === 'sure') {
      contextualPrompt = `The user said YES/OK/SURE. They are likely agreeing to food suggestions. Since they might have asked for light food earlier, recommend LIGHT OPTIONS like salads, light sandwiches, and appetizers with specific items and prices.`;
    } else {
      contextualPrompt = `The user wants general food recommendations. Show specific popular items from the menu with exact names and prices.`;
    }

    prompt = `Show specific food items from Eatzone menu. Be DIRECT.

USER WANTS: ${contextualPrompt}

MENU: ${formattedMenu}

USER SAID: "${message}"

RESPOND EXACTLY LIKE THIS:
🍗 Here are our chicken items:
• Chicken Rolls - ₹20
• Chicken Salad - ₹24
• Chicken Pizza - ₹350

RULES:
- List 3-4 items with exact names and prices
- Use bullet points
- No extra text
- Match their request (chicken/veg/dessert/meal)`;
    maxTokens = 80;
  } else {
    // General conversation - handle common queries directly for better accuracy
    const msg = message.toLowerCase();
    let generalResponse = '';

    // Handle greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg === 'hi' || msg === 'hello') {
      generalResponse = "👋 Hello! Welcome to Eatzone! I'm here to help you find delicious food. What are you craving today? We have chicken, veg options, desserts, pizzas, and much more!";
    }
    // Handle thanks
    else if (msg.includes('thank') || msg.includes('thanks')) {
      generalResponse = "😊 You're welcome! Is there anything else I can help you with? Maybe recommend some tasty food or assist with your order?";
    }
    // Handle yes/ok responses
    else if (msg === 'yes' || msg === 'yeah' || msg === 'ok' || msg === 'sure' || msg === 'right') {
      generalResponse = "Great! What type of food are you in the mood for? 🍽️\n\n• 🍗 Chicken items\n• 🥗 Vegetarian options\n• 🍕 Pizzas\n• 🍰 Desserts\n• 🥪 Sandwiches\n• 🌯 Rolls\n\nJust tell me what you'd like!";
    }
    // Handle food-related queries that might not be in recommendation mode
    else if (msg.includes('food') || msg.includes('eat') || msg.includes('hungry') || msg.includes('order')) {
      generalResponse = "🍽️ Perfect! I can help you find great food. What are you craving?\n\n• Chicken dishes\n• Vegetarian options\n• Desserts & sweets\n• Pizza & Italian\n• Salads & light meals\n• Main course meals\n\nWhat sounds good to you?";
    }
    // Handle menu/price queries
    else if (msg.includes('menu') || msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
      generalResponse = "📋 Our menu has great variety with affordable prices! Popular items:\n\n• Chicken Rolls - ₹20\n• Greek Salad - ₹12\n• Butter Chicken - ₹320\n• Pizza - ₹250-350\n• Ice Cream - ₹12-30\n\nWhat type of food interests you?";
    }
    // Handle delivery queries
    else if (msg.includes('delivery') || msg.includes('time') || msg.includes('how long')) {
      generalResponse = "🚚 Delivery Info:\n• Time: 30-45 minutes\n• Free delivery on orders ₹299+\n• Minimum order: ₹99\n• Available 24/7\n\nReady to order? What food would you like?";
    }
    // Handle location/area queries
    else if (msg.includes('area') || msg.includes('location') || msg.includes('deliver') || msg.includes('where')) {
      generalResponse = "📍 We deliver across the city! Enter your address during checkout to confirm delivery availability. Most areas are covered with 30-45 minute delivery. What would you like to order?";
    }
    // Handle app/website queries
    else if (msg.includes('app') || msg.includes('website') || msg.includes('how to') || msg.includes('use')) {
      generalResponse = "📱 Using Eatzone is easy:\n1. Browse menu & select items\n2. Add to cart\n3. Enter delivery address\n4. Choose payment method\n5. Track your order\n\nWhat food would you like to start with?";
    }
    // Handle payment queries
    else if (msg.includes('payment') || msg.includes('pay') || msg.includes('card') || msg.includes('upi')) {
      generalResponse = "💳 Payment Options:\n• Credit/Debit Cards\n• UPI (GPay, PhonePe, etc.)\n• Net Banking\n• Digital Wallets\n\nAll payments are secure! What would you like to order?";
    }
    else {
      // Use AI for complex general queries
      prompt = `You are Eatzone's friendly chatbot assistant. You help with food delivery orders and menu questions.

ABOUT EATZONE:
- Food delivery app with diverse menu
- Categories: ${MENU_CATEGORIES.slice(0, 8).join(', ')} and more
- Delivery in 30-45 minutes, 24/7 service
- Free delivery on orders ₹299+, minimum order ₹99
- Payment: Cards, UPI, Net Banking, Wallets

USER MESSAGE: "${message}"

INSTRUCTIONS:
- Be friendly and conversational
- Always try to guide them toward food ordering
- If they ask about the app/service, explain briefly then ask about food
- If they ask general questions, answer helpfully then suggest food
- Keep responses short and engaging
- End with a food-related question to keep conversation flowing

Respond helpfully and guide them toward ordering!`;
      maxTokens = 100;
    }

    if (generalResponse) {
      return res.json({ reply: generalResponse });
    }
  }

  try {
    // For food recommendations, use direct fallback responses for better accuracy
    if (chatMode === 'recommendations' || chatMode === 'recommendation') {
      const msg = message.toLowerCase();
      let directResponse = '';

      if (msg.includes("chicken")) {
        const chickenItems = allFoodItems.filter(item =>
          item.name.toLowerCase().includes('chicken')
        );
        directResponse = chickenItems.length > 0 ?
          `🍗 Here are our chicken items:\n\n${chickenItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍗 Here are our chicken items:\n\n• Chicken Rolls - ₹20\n  [Add to Cart - chicken-rolls]\n\n• Chicken Salad - ₹24\n  [Add to Cart - chicken-salad]\n\n• Chicken Pizza - ₹350\n  [Add to Cart - chicken-pizza]";
      } else if (msg.includes("veg") || msg.includes("vegetarian")) {
        const vegItems = allFoodItems.filter(item =>
          item.name.toLowerCase().includes('veg') ||
          item.category.toLowerCase().includes('salad')
        );
        directResponse = vegItems.length > 0 ?
          `🥗 Here are our veg options:\n\n${vegItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🥗 Here are our veg options:\n\n• Veg Salad - ₹12\n  [Add to Cart - veg-salad]\n\n• Greek Salad - ₹12\n  [Add to Cart - greek-salad]\n\n• Veg Rolls - ₹14\n  [Add to Cart - veg-rolls]";
      } else if (msg.includes("dessert") || msg.includes("cake") || msg.includes("sweet")) {
        const dessertItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('dessert') ||
          item.name.toLowerCase().includes('ice cream') ||
          item.name.toLowerCase().includes('cake')
        );
        directResponse = dessertItems.length > 0 ?
          `🍰 Here are our desserts:\n\n${dessertItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍰 Here are our desserts:\n\n• Ripple Ice Cream - ₹14\n  [Add to Cart - ripple-ice-cream]\n\n• Fruit Ice Cream - ₹22\n  [Add to Cart - fruit-ice-cream]\n\n• Chocolate Cake - ₹250\n  [Add to Cart - chocolate-cake]";
      } else if (msg.includes("meal") || msg.includes("main course")) {
        const mealItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('main') ||
          item.name.toLowerCase().includes('biryani') ||
          item.name.toLowerCase().includes('curry')
        );
        directResponse = mealItems.length > 0 ?
          `🍽️ Here are our main course meals:\n\n${mealItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍽️ Here are our main course meals:\n\n• Butter Chicken - ₹280\n  [Add to Cart - butter-chicken]\n\n• Biryani - ₹220\n  [Add to Cart - biryani]\n\n• Fish Curry - ₹250\n  [Add to Cart - fish-curry]";
      } else if (msg.includes("pizza")) {
        const pizzaItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('pizza') ||
          item.name.toLowerCase().includes('pizza')
        );
        directResponse = pizzaItems.length > 0 ?
          `🍕 Here are our pizzas:\n\n${pizzaItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍕 Here are our pizzas:\n\n• Margherita Pizza - ₹250\n  [Add to Cart - margherita-pizza]\n\n• Chicken Pizza - ₹350\n  [Add to Cart - chicken-pizza]";
      } else if (msg.includes("roll") || msg.includes("rolls")) {
        const rollItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('roll') ||
          item.name.toLowerCase().includes('roll')
        );
        directResponse = rollItems.length > 0 ?
          `🌯 Here are our rolls:\n\n${rollItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🌯 Here are our rolls:\n\n• Chicken Rolls - ₹20\n  [Add to Cart - chicken-rolls]\n\n• Veg Rolls - ₹14\n  [Add to Cart - veg-rolls]";
      } else if (msg.includes("salad")) {
        const saladItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('salad') ||
          item.name.toLowerCase().includes('salad')
        );
        directResponse = saladItems.length > 0 ?
          `🥗 Here are our salads:\n\n${saladItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🥗 Here are our salads:\n\n• Greek Salad - ₹12\n  [Add to Cart - greek-salad]\n\n• Chicken Salad - ₹24\n  [Add to Cart - chicken-salad]";
      } else if (msg.includes("sandwich")) {
        const sandwichItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('sandwich') ||
          item.name.toLowerCase().includes('sandwich')
        );
        directResponse = sandwichItems.length > 0 ?
          `🥪 Here are our sandwiches:\n\n${sandwichItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🥪 Here are our sandwiches:\n\n• Chicken Sandwich - ₹349\n  [Add to Cart - chicken-sandwich]\n\n• Veg Sandwich - ₹150\n  [Add to Cart - veg-sandwich]";
      } else if (msg.includes("pasta") || msg.includes("noodles")) {
        const pastaItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('pasta') ||
          item.category.toLowerCase().includes('noodles') ||
          item.name.toLowerCase().includes('pasta') ||
          item.name.toLowerCase().includes('noodles')
        );
        directResponse = pastaItems.length > 0 ?
          `🍝 Here are our pasta & noodles:\n\n${pastaItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍝 Here are our pasta & noodles:\n\n• Cheese Pasta - ₹220\n  [Add to Cart - cheese-pasta]\n\n• Veg Noodles - ₹160\n  [Add to Cart - veg-noodles]";
      }

      if (directResponse) {
        return res.json({ reply: directResponse });
      }
    }

    // Use Gemini AI for other cases
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();

    // Clean up response
    response = response.replace(/\*\*/g, '').replace(/\*/g, '');

    // Ensure response is not too long
    if (response.length > 200) {
      response = response.substring(0, 197) + '...';
    }

    // Final fallback if response is empty or too short
    if (!response || response.length < 10) {
      response = chatMode === 'support' ? `For help, call ${EATZONE_KNOWLEDGE.appInfo.customerSupport}` :
        (chatMode === 'recommendations' || chatMode === 'recommendation') ? "Try our popular Chicken Rolls ₹190 or Greek Salad ₹150!" :
        chatMode === 'ordering' ? "Browse menu → Add to cart → Checkout → Enter address → Pay!" :
        "I help with Eatzone orders and menu. How can I assist you?";
    }

    res.json({ reply: response });
  } catch (err) {
    console.error("Gemini AI error:", err);

    // Improved fallback responses with better context
    let fallbackResponse = '';
    const msg = message.toLowerCase();

    if (chatMode === 'recommendations' || chatMode === 'recommendation') {
      if (msg.includes("light") || msg.includes("healthy")) {
        const lightItems = allFoodItems.filter(item =>
          item.name.toLowerCase().includes('salad') ||
          item.category.toLowerCase().includes('salad')
        ).slice(0, 3);
        fallbackResponse = lightItems.length > 0 ?
          `🥗 For light options, try: ${lightItems.map(item => `${item.name} - ₹${item.price}`).join(', ')}` :
          "🥗 For light options, try our Greek Salad ₹150, Veg Salad ₹120, or Chicken Salad ₹200!";
      } else if (msg.includes("chicken")) {
        const chickenItems = allFoodItems.filter(item =>
          item.name.toLowerCase().includes('chicken')
        );
        fallbackResponse = chickenItems.length > 0 ?
          `🍗 Here are our chicken items:\n\n${chickenItems.map(item => `• ${item.name} - ₹${item.price}\n  [Add to Cart - ${item._id}]`).join('\n\n')}` :
          "🍗 Here are our chicken items:\n\n• Chicken Rolls - ₹20\n  [Add to Cart - chicken-rolls]\n\n• Chicken Salad - ₹24\n  [Add to Cart - chicken-salad]\n\n• Chicken Pizza - ₹350\n  [Add to Cart - chicken-pizza]";
      } else if (msg.includes("veg") || msg.includes("vegetarian")) {
        const vegItems = allFoodItems.filter(item =>
          item.name.toLowerCase().includes('veg') ||
          item.category.toLowerCase().includes('salad')
        ).slice(0, 4);
        fallbackResponse = vegItems.length > 0 ?
          `🥗 Here are our veg options:\n\n${vegItems.map(item => `• ${item.name} - ₹${item.price}`).join('\n')}` :
          "🥗 Here are our veg options:\n\n• Veg Salad - ₹12\n• Greek Salad - ₹12\n• Veg Rolls - ₹14\n• Paneer Tikka - ₹180";
      } else if (msg.includes("dessert") || msg.includes("cake") || msg.includes("sweet")) {
        const dessertItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('dessert') ||
          item.name.toLowerCase().includes('ice cream') ||
          item.name.toLowerCase().includes('cake')
        ).slice(0, 4);
        fallbackResponse = dessertItems.length > 0 ?
          `🍰 Here are our desserts:\n\n${dessertItems.map(item => `• ${item.name} - ₹${item.price}`).join('\n')}` :
          "🍰 Here are our desserts:\n\n• Ripple Ice Cream - ₹14\n• Fruit Ice Cream - ₹22\n• Chocolate Cake - ₹250\n• Apple Pie - ₹180";
      } else if (msg.includes("meal") || msg.includes("main course")) {
        const mealItems = allFoodItems.filter(item =>
          item.category.toLowerCase().includes('main') ||
          item.name.toLowerCase().includes('biryani') ||
          item.name.toLowerCase().includes('curry')
        ).slice(0, 4);
        fallbackResponse = mealItems.length > 0 ?
          `🍽️ Here are our main course meals:\n\n${mealItems.map(item => `• ${item.name} - ₹${item.price}`).join('\n')}` :
          "🍽️ Here are our main course meals:\n\n• Butter Chicken - ₹280\n• Biryani - ₹220\n• Fish Curry - ₹250\n• Grilled Chicken - ₹280";
      } else if (msg === 'yes' || msg === 'yeah' || msg === 'ok' || msg === 'sure') {
        fallbackResponse = "Great! What type of food are you in the mood for? We have chicken, veg options, salads, desserts, and more!";
      } else {
        fallbackResponse = "What type of food are you craving? We have chicken, veg, salads, desserts, rolls, sandwiches, and more!";
      }
    } else if (chatMode === 'support') {
      const msg = message.toLowerCase();
      if (msg.includes('order') && msg.includes('status')) {
        fallbackResponse = "📦 To check order status: Go to 'My Orders' or call +91 9876554321. Orders typically arrive in 30-45 minutes.";
      } else if (msg.includes('cancel')) {
        fallbackResponse = "❌ To cancel order: Call +91 9876554321 immediately. Cancellation possible within 5 minutes of placing order.";
      } else if (msg.includes('refund')) {
        fallbackResponse = "💰 For refunds: Email contact@eatzone.com with order details. Processed within 3-5 business days.";
      } else {
        fallbackResponse = `📞 Eatzone Support: +91 9876554321 (24/7) or contact@eatzone.com. How can I help you today?`;
      }
    } else if (chatMode === 'feedback') {
      const msg = message.toLowerCase();
      if (msg.includes('good') || msg.includes('great') || msg.includes('excellent')) {
        fallbackResponse = "🌟 Thank you for the positive feedback! We're delighted you enjoyed your Eatzone experience!";
      } else if (msg.includes('bad') || msg.includes('poor') || msg.includes('terrible')) {
        fallbackResponse = "😔 We're sorry about your experience. Please contact +91 9876554321 so we can make it right!";
      } else {
        fallbackResponse = "💬 We value your feedback! Please share your experience - it helps us improve. Contact: contact@eatzone.com";
      }
    } else if (chatMode === 'ordering') {
      fallbackResponse = "Browse menu → Add to cart → Checkout → Enter address → Pay → Track order!";
    } else {
      if (msg.includes("hello") || msg.includes("hi")) {
        fallbackResponse = EATZONE_KNOWLEDGE.quickResponses.greeting;
      } else if (msg === 'yes' || msg === 'yeah' || msg === 'ok' || msg === 'sure') {
        fallbackResponse = "Perfect! What type of food would you like? We have chicken, veg, salads, desserts, and more!";
      } else {
        fallbackResponse = "I help with Eatzone orders and menu. What type of food are you looking for today?";
      }
    }

    res.json({ reply: fallbackResponse });
  }
};
