const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const chatbotController = require("../controllers/chatbotController");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate limiting for chatbot API
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 requests per windowMs
  message: {
    message: "Too many requests, please try again later.",
    text: "You're sending messages too quickly. Please wait a moment before sending another message.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all chatbot routes
router.use(chatbotLimiter);

// Authenticated route - requires login
router.post(
  "/message-auth",
  protect,
  chatbotController.processAuthenticatedMessage
);

// Public route - no authentication needed
router.post("/message", chatbotController.processUnauthenticatedMessage);

// Test API connection - updated to use Gemini
router.get("/test-api", chatbotController.testGeminiAPI);

module.exports = router;
