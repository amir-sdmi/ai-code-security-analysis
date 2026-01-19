// chatgptController.js

// Import required modules
const express = require("express")
const router = express.Router()

// Function to process user messages and generate responses using ChatGPT API
router.post("/message", async (req, res) => {
  const userMessage = req.body.message // Extract user message from request body
  // Call ChatGPT API to generate response based on user message
  const botResponse = await chatGPT.generateResponse(userMessage)
  res.json({ response: botResponse }) // Send the bot's response back to the client
})

// Export router for use in other files
module.exports = router
