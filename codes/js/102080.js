import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.XAPIKEY,
  appSecret: process.env.XAPIKEYSECRET,
  accessToken: process.env.ACCESSTOKEN,
  accessSecret: process.env.ACCESSTOKENSECRET,
});

const rwClient = twitterClient.readWrite;

// Generate tweet using Gemini
async function generateTweet(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = await response.text();
  return text.slice(0, 280).trim(); // Keep within tweet length
}

console.log("added thsi")
console.log("added thsi")
console.log("added this")
// Post to Twitter with image
async function createPost(status) {
  try {
    const imageUrl =
      "https://images.pexels.com/photos/31890680/pexels-photo-31890680/free-photo-of-woman-in-white-dress-surrounded-by-monstera-leaves.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load";

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    const mediaId = await rwClient.v1.uploadMedia(imageBuffer, { mimeType: "image/jpeg" });

    console.log("testing")

    const newPost = await rwClient.v2.tweet({
      text: status,
      media: {
        media_ids: [mediaId],
      },
    });

    
    return {
      content: [
        {
          type: "text",
          text: `Tweeted: ${status}`,
        },
      ],
    };

  } catch (error) {
    console.error("Failed to tweet:", error);
    return {
      content: [
        {
          type: "text",
          text: "Failed to post tweet.",
        },
      ],
    };
  }
}
console.log("jai shree ghanesh");

function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) return true;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature || '')
  );
}
console.log("trying new feature") ; 
console.log("thank u god") ; 


// GitHub webhook endpoint
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  // Verify webhook signature
  if (!verifySignature(payload, signature)) {
    console.log('❌ Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }

  const event = req.headers['x-github-event'];
  console.log(`📨 Received ${event} event`);

  // Handle push events (new commits)
  if (event === 'push') {
    await handleNewCommits(req.body);
  }

  res.status(200).send('OK');
});

async function handleNewCommits(payload) {
  const { repository, commits, pusher, ref } = payload;

  console.log(`\n🔔 New commits in ${repository.full_name}`);
  console.log(`👤 Pushed by: ${pusher.name}`);
  console.log(`🌿 Branch: ${ref.replace('refs/heads/', '')}`);
  console.log(`📝 ${commits.length} commit(s)`);
  console.log(`logging details`);
  console.log(`adding new data`);
  console.log(`adding data`);

  

  // Process each commit
  for (const commit of commits) {
    console.log(`\n--- Commit Details ---`);
    console.log(`🆔 ID: ${commit.id.substring(0, 7)}`);
    console.log(`💬 Message: ${commit.message}`);
    console.log(`👨‍💻 Author: ${commit.author.name}`);
    console.log(`⏰ Time: ${new Date(commit.timestamp).toLocaleString()}`);

    // Get detailed commit info including code changes
    const commitDetails = await getCommitDetails(
      repository.owner.login,
      repository.name,
      commit.id
    );

    if (commitDetails) {
      console.log(`📊 Stats: +${commitDetails.stats.additions} -${commitDetails.stats.deletions}`);
      console.log(`📁 Files changed: ${commitDetails.files.length}`);

      // Log changed files
      commitDetails.files.forEach(file => {
        console.log(`  📄 ${file.status}: ${file.filename}`);
      });
    }
    console.log("first")

console.log("trying one more time")
console.log("testing final time")
    

    // Send to your backend/process the commit
    await processCommit({
      repository: repository.full_name,
      commit: {
        id: commit.id,
        message: commit.message,
        author: commit.author,
        timestamp: commit.timestamp,
        url: commit.url
      },
      changes: commitDetails
    });
  }
}

async function getCommitDetails(owner, repo, sha) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Webhook-App'
        }
      }
    );

    return {
      files: response.data.files || [],
      stats: response.data.stats || { additions: 0, deletions: 0, total: 0 }
    };
  } catch (error) {
    console.error(`❌ Error fetching commit details: ${error.message}`);
    console.log("testing docify")
    console.log("once more")


    return null;
  }
}

async function processCommit(data) {
  console.log(`\n🔄 Processing commit: ${data.commit.id.substring(0, 7)}`);

  // This is where you add your custom logic
  // Examples:

  // 1. Log the commit data
  console.log('📋 Commit Data:', JSON.stringify(data, null, 2));

  // 2. Auto-generate and post tweet about the commit (optional)
  if (process.env.AUTO_TWEET_COMMITS === 'true') {
    try {
      const tweetTopic = `New code commit: ${data.commit.message} in ${data.repository}`;
      const prompt = `You are a social media manager for a tech company, tasked with creating engaging tweets based on GitHub commit messages. Your goal is to translate technical updates into relatable content for both developers and general tech enthusiasts, while maintaining authenticity and genuine enthusiasm for the work being done.

To create an effective and authentic tweet, follow these steps:

Carefully read and understand the commit message.
Identify the main point of the update and its significance for developers and users.
Translate the technical information into casual, conversational language that a developer would use when excitedly sharing their work with peers.
Add a touch of humor or personality where appropriate, but maintain the genuine enthusiasm a developer would have for their work.
Keep the tweet concise (maximum 280 characters).
Consider adding 1-2 relevant emojis to enhance the message, if they fit naturally.
If appropriate, include 1-2 hashtags that genuinely add value to the tweet's reach and relevance to the tech community.
Important guidelines:

Write as if you're a developer sharing an exciting update with fellow tech enthusiasts.
Use natural, colloquial expressions that real developers would use in everyday conversation.
Avoid overly casual or forced humor that might undermine the importance of the update.
Ensure that the content is interesting and relevant to your target audience of developers and tech enthusiasts.
Be selective with hashtags, only including them if they truly enhance the tweet's discoverability within the tech community.
Before writing your final tweet, wrap your thought process in <tweet_creation_process> tags. In this section: a. Summarize the main point of the commit message and its significance b. Analyze the potential impact on different audience segments (developers vs. general tech enthusiasts) c. Brainstorm casual, conversational translations of the technical information from a developer's perspective d. List ways to convey genuine enthusiasm for the update e. Brainstorm 2-3 relevant emojis that could enhance the message f. Consider 2-3 potential hashtags that could increase reach and relevance g. Generate 3-4 draft tweets, counting characters for each by prepending each word with a number (e.g., 1. This 2. tweet 3. has 4. four 5. words.) h. Evaluate and choose the best draft, explaining why it best captures the update's importance, maintains authenticity, and appeals to both developers and general tech enthusiasts i. If necessary, adjust the chosen tweet to ensure it's within the 280-character limit j. Assess how well the final tweet balances technical accuracy with general appeal

Then, present your final tweet within tags.

Remember, the goal is to create a tweet that feels like it's coming from a real developer who is genuinely excited about the work they've done. Make it informative yet engaging, and relatable to both fellow developers and general tech enthusiasts. Focus on why this update matters and how it improves the product or user experience. 
       Write a short, engaging tweet about: ${tweetTopic}`;
      const tweet = await generateTweet(prompt);
      await createPost(tweet);
      console.log('🐦 Auto-tweeted about commit!');
    } catch (error) {
      console.error('❌ Failed to auto-tweet commit:', error.message);
    }
  }

  console.log('✅ Commit processed');
}

// Route to trigger tweet generation and posting
app.post("/tweet", async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }
    console.log("testing again"); 

    // database wala theek karna hai, prompt theek karna hai, new a feature of adding tones , vs code extension 

    const prompt = `You are a social media manager for a tech company, tasked with creating engaging tweets based on GitHub commit messages. Your goal is to translate technical updates into relatable content for both developers and general tech enthusiasts, while maintaining authenticity and genuine enthusiasm for the work being done.

    To create an effective and authentic tweet, follow these steps:
    
    Carefully read and understand the commit message.
    Identify the main point of the update and its significance for developers and users.
    Translate the technical information into casual, conversational language that a developer would use when excitedly sharing their work with peers.
    Add a touch of humor or personality where appropriate, but maintain the genuine enthusiasm a developer would have for their work.
    Keep the tweet concise (maximum 280 characters).
    Consider adding 1-2 relevant emojis to enhance the message, if they fit naturally.
    If appropriate, include 1-2 hashtags that genuinely add value to the tweet's reach and relevance to the tech community.
    Important guidelines:
    
    Write as if you're a developer sharing an exciting update with fellow tech enthusiasts.
    Use natural, colloquial expressions that real developers would use in everyday conversation.
    Avoid overly casual or forced humor that might undermine the importance of the update.
    Ensure that the content is interesting and relevant to your target audience of developers and tech enthusiasts.
    Be selective with hashtags, only including them if they truly enhance the tweet's discoverability within the tech community.
    Before writing your final tweet, wrap your thought process in <tweet_creation_process> tags. In this section: a. Summarize the main point of the commit message and its significance b. Analyze the potential impact on different audience segments (developers vs. general tech enthusiasts) c. Brainstorm casual, conversational translations of the technical information from a developer's perspective d. List ways to convey genuine enthusiasm for the update e. Brainstorm 2-3 relevant emojis that could enhance the message f. Consider 2-3 potential hashtags that could increase reach and relevance g. Generate 3-4 draft tweets, counting characters for each by prepending each word with a number (e.g., 1. This 2. tweet 3. has 4. four 5. words.) h. Evaluate and choose the best draft, explaining why it best captures the update's importance, maintains authenticity, and appeals to both developers and general tech enthusiasts i. If necessary, adjust the chosen tweet to ensure it's within the 280-character limit j. Assess how well the final tweet balances technical accuracy with general appeal
    
    Then, present your final tweet within tags.
    
    Remember, the goal is to create a tweet that feels like it's coming from a real developer who is genuinely excited about the work they've done. Make it informative yet engaging, and relatable to both fellow developers and general tech enthusiasts. Focus on why this update matters and how it improves the product or user experience. 
           Write a short, engaging tweet about: ${topic}`;    const tweet = await generateTweet(prompt);
    const result = await createPost(tweet);

    res.status(200).json({
      message: "Tweet posted successfully!",
      tweet,
      result,
    });
  } catch (error) {
    console.error("Error in /tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    features: ['GitHub Webhooks', 'Twitter Bot']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Combined GitHub webhook & Twitter server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🐦 Tweet URL: http://localhost:${PORT}/tweet`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});