const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { TextBlob } = require("textblob");
const { Copilot } = require("@copilotkit/core");

const app = express();

// Connect to MongoDB database
mongoose.connect("mongodb://localhost:27017/tweet-suggestion", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  tweets: [
    {
      text: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Get all user tweets
app.get("/api/tweets", async (req, res) => {
  const user = await User.findOne({});
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ tweets: user.tweets });
});

// Suggest tweet based on prompt
app.post("/api/suggest-tweet", async (req, res) => {
  const { prompt } = req.body;
  const user = await User.findOne({});
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Analyze user tweets for style and content
  const userTweets = user.tweets.map((tweet) => tweet.text);
  const textBlob = new TextBlob(userTweets.join(" "));
  const wordCounts = textBlob.word_counts;

  // Generate tweet suggestion using CopilotKit
  try {
    const copilot = new Copilot({
      apiKey: "YOUR_COPILOTKIT_API_KEY", // Replace with your CopilotKit API key
    });
    const suggestion = await copilot.generateText(prompt, {
      numSamples: 1, // Generate 1 suggestion
      maxTokens: 64, // Limit the length of the generated text
    });
    const suggestedTweet = suggestion.samples[0];

    // Save the prompt and suggested tweet for future analysis (optional)
    user.tweets.push({ text: prompt, suggestedTweet });
    await user.save();

    res.json({ suggestion: suggestedTweet });
  } catch (error) {
    console.error("Error generating tweet suggestion:", error);
    res.status(500).json({ message: "Error generating tweet suggestion" });
  }
});

app.listen(3000, () => console.log("Server listening on port 3000"));
