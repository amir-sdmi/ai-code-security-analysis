const express = require('express');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Your Render URL: https://your-app-name.onrender.com
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_DIR = path.join(__dirname, 'data');

// Import Google Generative AI
let genai;
try {
  genai = require('@google/generative-ai').GoogleGenerativeAI;
} catch (error) {
  console.error('Failed to import Google Generative AI. Install it with: npm install @google/generative-ai');
  process.exit(1);
}

// Initialize Gemini AI
let model = null;
const chatHistories = {};

async function initializeGeminiModel() {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API Key not found. AI features will be disabled.');
    return false;
  }

  try {
    const googleAI = new genai(GEMINI_API_KEY);
    
    // Set safety settings
    const safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }
    ];

    // Try the recommended model first
    try {
      model = googleAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40
        },
        safetySettings
      });
      
      // Test the model
      const test = await model.generateContent('Test');
      console.log('Successfully connected to Gemini model: gemini-1.5-flash');
      return true;
    } catch (error) {
      console.warn('Failed to use gemini-1.5-flash, trying alternatives...');
    }

    // Try alternative models
    const possibleModels = ['gemini-1.5-pro', 'gemini-pro'];
    for (const modelName of possibleModels) {
      try {
        model = googleAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40
          },
          safetySettings
        });
        
        const test = await model.generateContent('Test');
        console.log(`Successfully connected to Gemini model: ${modelName}`);
        return true;
      } catch (error) {
        console.warn(`Failed to use ${modelName}: ${error.message}`);
      }
    }

    console.error('No working Gemini model found');
    return false;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return false;
  }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AI_SETTINGS_FILE = path.join(DATA_DIR, 'ai_settings.json');

// Initialize data files if they don't exist
if (!fs.existsSync(ADMINS_FILE)) {
  // Initialize with one admin (replace ADMIN_ID with your Telegram ID)
  const primaryAdminId = process.env.ADMIN_ID || '123456789';
  fs.writeFileSync(ADMINS_FILE, JSON.stringify([primaryAdminId]), 'utf8');
  console.log(`Bot initialized with primary admin ID: ${primaryAdminId}`);
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf8');
}

if (!fs.existsSync(AI_SETTINGS_FILE)) {
  fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify({
    aiMode: false // AI mode is off by default
  }), 'utf8');
}

// Helper functions
function getAdmins() {
  try {
    return JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading admins file:', error);
    return [];
  }
}

function saveAdmins(admins) {
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins), 'utf8');
}

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading users file:', error);
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users), 'utf8');
}

function getAISettings() {
  try {
    return JSON.parse(fs.readFileSync(AI_SETTINGS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading AI settings file:', error);
    return { aiMode: false };
  }
}

function saveAISettings(settings) {
  fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(settings), 'utf8');
}

function isAdmin(userId) {
  const admins = getAdmins();
  return admins.includes(userId.toString());
}

async function generateAIResponse(userId, messageText) {
  if (!model) {
    return null;
  }

  try {
    // Initialize chat history for this user if it doesn't exist
    if (!chatHistories[userId]) {
      chatHistories[userId] = [];
    }

    // Add user message to history
    chatHistories[userId].push({
      role: 'user',
      parts: [{ text: messageText }]
    });

    // Generate response using chat session
    const chat = model.startChat({
      history: chatHistories[userId].slice(0, -1) // Don't include the current message
    });

    const result = await chat.sendMessage(messageText);
    const response = result.response;
    const responseText = response.text();

    // Add AI response to history
    chatHistories[userId].push({
      role: 'model',
      parts: [{ text: responseText }]
    });

    // Keep only last 20 messages to prevent memory issues
    if (chatHistories[userId].length > 40) {
      chatHistories[userId] = chatHistories[userId].slice(-40);
    }

    return responseText;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I encountered an error while generating a response. Please try again later.';
  }
}

// Create bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware to check for admin commands
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  
  // Skip middleware for commands that don't require auth
  if (!ctx.message || !ctx.message.text) {
    return next();
  }
  
  // If it's an admin command, check if user is admin
  if (ctx.message.text.startsWith('/addadmin') || 
      ctx.message.text.startsWith('/removeadmin') || 
      ctx.message.text.startsWith('/aimode')) {
    if (isAdmin(userId)) {
      return next();
    } else {
      return ctx.reply('You are not authorized to use this command.');
    }
  }
  
  return next();
});

// Handle start command
bot.start((ctx) => {
  const userId = ctx.from.id.toString();
  const admins = getAdmins();
  const primaryAdminId = process.env.ADMIN_ID || admins[0];
  
  if (isAdmin(userId)) {
    // Different welcome message for primary admin vs regular admin
    if (userId === primaryAdminId) {
      return ctx.reply(`Welcome, Primary Admin (Bot Owner)! Available commands:
/addadmin [user_id] - Add a new admin
/removeadmin [user_id] - Remove an admin
/listadmins - List all admin IDs
/aimode - Toggle AI mode on/off
/clearai - Clear AI chat history
Reply to any forwarded message to respond to the user

As the primary admin, only you can add or remove other admins.`);
    } else {
      return ctx.reply(`Welcome, Admin! Available commands:
/listadmins - List all admin IDs
/aimode - Toggle AI mode on/off
/clearai - Clear AI chat history
Reply to any forwarded message to respond to the user

Note: Only the primary admin can add or remove other admins.`);
    }
  } else {
    // Store user in the users file
    const users = getUsers();
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        username: ctx.from.username || 'unknown',
        first_name: ctx.from.first_name || 'unknown',
        joined: new Date().toISOString()
      };
      saveUsers(users);
    }
    
    return ctx.reply('Welcome! Send any message and our team will get back to you shortly.');
  }
});

// Handle AI mode toggle command
bot.command('aimode', (ctx) => {
  const aiSettings = getAISettings();
  aiSettings.aiMode = !aiSettings.aiMode;
  saveAISettings(aiSettings);
  
  const status = aiSettings.aiMode ? 'ON' : 'OFF';
  return ctx.reply(`AI mode is now ${status}. ${aiSettings.aiMode ? 'The bot will respond automatically to user messages.' : 'The bot will only forward messages to admins.'}`);
});

// Handle clear AI history command
bot.command('clearai', (ctx) => {
  const userId = ctx.from.id.toString();
  
  if (isAdmin(userId)) {
    // Clear all chat histories
    Object.keys(chatHistories).forEach(key => {
      delete chatHistories[key];
    });
    return ctx.reply('All AI chat histories have been cleared.');
  } else {
    // Clear only user's history
    if (chatHistories[userId]) {
      delete chatHistories[userId];
      return ctx.reply('Your AI chat history has been cleared.');
    } else {
      return ctx.reply('You don\'t have any AI chat history yet.');
    }
  }
});

// Handle list admins command
bot.command('listadmins', (ctx) => {
  const userId = ctx.from.id.toString();
  const admins = getAdmins();
  const primaryAdminId = process.env.ADMIN_ID || admins[0];
  
  if (!isAdmin(userId)) {
    return ctx.reply('You are not authorized to use this command.');
  }
  
  let adminList = '👑 Admin List:\n\n';
  
  admins.forEach((adminId, index) => {
    if (adminId === primaryAdminId) {
      adminList += `${index + 1}. ${adminId} (Primary Admin/Bot Owner) 👑\n`;
    } else {
      adminList += `${index + 1}. ${adminId}\n`;
    }
  });
  
  adminList += '\nOnly the primary admin can add or remove other admins.';
  
  return ctx.reply(adminList);
});

// Handle add admin command
bot.command('addadmin', (ctx) => {
  const args = ctx.message.text.split(' ');
  
  if (args.length !== 2) {
    return ctx.reply('Usage: /addadmin [user_id]');
  }
  
  const userId = ctx.from.id.toString();
  const newAdminId = args[1].trim();
  const admins = getAdmins();
  
  // Only the primary admin can add other admins for extra security
  const primaryAdminId = process.env.ADMIN_ID || admins[0];
  if (userId !== primaryAdminId) {
    return ctx.reply('Only the primary admin (bot owner) can add new admins.');
  }
  
  if (admins.includes(newAdminId)) {
    return ctx.reply('This user is already an admin.');
  }
  
  admins.push(newAdminId);
  saveAdmins(admins);
  
  return ctx.reply(`User ${newAdminId} has been added as an admin.`);
});

// Handle remove admin command
bot.command('removeadmin', (ctx) => {
  const args = ctx.message.text.split(' ');
  
  if (args.length !== 2) {
    return ctx.reply('Usage: /removeadmin [user_id]');
  }
  
  const userId = ctx.from.id.toString();
  const adminIdToRemove = args[1].trim();
  const admins = getAdmins();
  
  // Prevent removing the primary admin (the first one in the list)
  const primaryAdminId = process.env.ADMIN_ID || admins[0];
  if (adminIdToRemove === primaryAdminId) {
    return ctx.reply('Cannot remove the primary admin (bot owner).');
  }
  
  // Only the primary admin can remove other admins
  if (userId !== primaryAdminId) {
    return ctx.reply('Only the primary admin (bot owner) can remove admins.');
  }
  
  // Prevent removing the last admin
  if (admins.length === 1 && admins[0] === adminIdToRemove) {
    return ctx.reply('Cannot remove the last admin.');
  }
  
  const updatedAdmins = admins.filter(id => id !== adminIdToRemove);
  
  if (updatedAdmins.length === admins.length) {
    return ctx.reply('Admin not found.');
  }
  
  saveAdmins(updatedAdmins);
  
  return ctx.reply(`User ${adminIdToRemove} has been removed from admins.`);
});

// Handle media broadcast (reply to messages with media)
bot.on(['photo', 'video', 'document', 'audio', 'sticker'], async (ctx) => {
  const userId = ctx.from.id.toString();
  
  if (!isAdmin(userId)) {
    // For non-admin users, just forward the media
    return handleForwardToAdmins(ctx);
  }
  
  if (ctx.message.reply_to_message) {
    // This is a reply to a user message, handle as admin response
    return handleAdminReply(ctx);
  }
});

// Handle admin replies with media
async function handleAdminReply(ctx) {
  const userId = ctx.from.id.toString();
  
  if (!isAdmin(userId) || !ctx.message.reply_to_message) {
    return;
  }
  
  const originalMessage = ctx.message.reply_to_message;
  
  // Check if the replied message contains a user ID in the footer
  if (originalMessage.text && originalMessage.text.includes('User ID:')) {
    const match = originalMessage.text.match(/User ID: (\d+)/);
    if (match && match[1]) {
      const targetUserId = match[1];
      
      try {
        // Determine media type and send accordingly
        if (ctx.message.photo) {
          await bot.telegram.sendPhoto(
            targetUserId,
            ctx.message.photo[ctx.message.photo.length - 1].file_id,
            { caption: ctx.message.caption }
          );
        } else if (ctx.message.video) {
          await bot.telegram.sendVideo(
            targetUserId,
            ctx.message.video.file_id,
            { caption: ctx.message.caption }
          );
        } else if (ctx.message.document) {
          await bot.telegram.sendDocument(
            targetUserId,
            ctx.message.document.file_id,
            { caption: ctx.message.caption }
          );
        } else if (ctx.message.audio) {
          await bot.telegram.sendAudio(
            targetUserId,
            ctx.message.audio.file_id,
            { caption: ctx.message.caption }
          );
        } else if (ctx.message.voice) {
          await bot.telegram.sendVoice(
            targetUserId,
            ctx.message.voice.file_id,
            { caption: ctx.message.caption }
          );
        } else if (ctx.message.sticker) {
          await bot.telegram.sendSticker(
            targetUserId,
            ctx.message.sticker.file_id
          );
        }
        
        return ctx.reply('Media sent to user.');
      } catch (error) {
        return ctx.reply(`Failed to send media: ${error.message}`);
      }
    }
  }
  
  return ctx.reply('Cannot determine the target user. Please reply to a forwarded user message.');
}

// Handle forwarding messages from users to admins
async function handleForwardToAdmins(ctx) {
  const userId = ctx.from.id.toString();
  const admins = getAdmins();
  
  if (isAdmin(userId)) {
    return; // Don't forward if sender is an admin
  }
  
  // Store user if not already stored
  const users = getUsers();
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      username: ctx.from.username || 'unknown',
      first_name: ctx.from.first_name || 'unknown',
      joined: new Date().toISOString()
    };
    saveUsers(users);
  }
  
  // Forward to all admins based on message type
  for (const adminId of admins) {
    try {
      if (ctx.message.photo) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const caption = ctx.message.caption || 'No caption';
        await bot.telegram.sendPhoto(
          adminId,
          photo.file_id,
          { 
            caption: `Photo from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${caption}\n\nUser ID: ${userId}`
          }
        );
      } else if (ctx.message.video) {
        const video = ctx.message.video;
        const caption = ctx.message.caption || 'No caption';
        await bot.telegram.sendVideo(
          adminId,
          video.file_id,
          { 
            caption: `Video from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${caption}\n\nUser ID: ${userId}`
          }
        );
      } else if (ctx.message.document) {
        const document = ctx.message.document;
        const caption = ctx.message.caption || 'No caption';
        await bot.telegram.sendDocument(
          adminId,
          document.file_id,
          { 
            caption: `Document from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${caption}\n\nUser ID: ${userId}`
          }
        );
      } else if (ctx.message.audio) {
        const audio = ctx.message.audio;
        const caption = ctx.message.caption || 'No caption';
        await bot.telegram.sendAudio(
          adminId,
          audio.file_id,
          { 
            caption: `Audio from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${caption}\n\nUser ID: ${userId}`
          }
        );
      } else if (ctx.message.voice) {
        const voice = ctx.message.voice;
        await bot.telegram.sendVoice(
          adminId,
          voice.file_id,
          { 
            caption: `Voice message from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'})\n\nUser ID: ${userId}`
          }
        );
      } else if (ctx.message.sticker) {
        // First send the sticker
        await bot.telegram.sendSticker(
          adminId,
          ctx.message.sticker.file_id
        );
        // Then send a text message with user info since stickers don't support captions
        await bot.telegram.sendMessage(
          adminId,
          `Sticker from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'})\n\nUser ID: ${userId}`
        );
      }
    } catch (error) {
      console.error(`Failed to forward media to admin ${adminId}:`, error);
    }
  }
  
  return ctx.reply('Your message has been forwarded to our team.');
}

// Handle text messages from users
bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const messageId = ctx.message.message_id;
  const admins = getAdmins();
  const aiSettings = getAISettings();
  
  // Check if this is a reply from an admin
  if (isAdmin(userId) && ctx.message.reply_to_message) {
    const originalMessage = ctx.message.reply_to_message;
    
    // Check if the replied message contains a user ID in the footer
    if (originalMessage.text && originalMessage.text.includes('User ID:')) {
      const match = originalMessage.text.match(/User ID: (\d+)/);
      if (match && match[1]) {
        const targetUserId = match[1];
        const replyText = ctx.message.text;
        
        try {
          await bot.telegram.sendMessage(targetUserId, replyText);
          return ctx.reply('Message sent to user.');
        } catch (error) {
          return ctx.reply(`Failed to send message: ${error.message}`);
        }
      }
    }
    return ctx.reply('Cannot determine the target user. Please reply to a forwarded user message.');
  }
  
  // Handle non-admin user messages
  if (!isAdmin(userId)) {
    // Store user if not already stored
    const users = getUsers();
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        username: ctx.from.username || 'unknown',
        first_name: ctx.from.first_name || 'unknown',
        joined: new Date().toISOString()
      };
      saveUsers(users);
    }
    
    // Check if AI mode is enabled
    if (aiSettings.aiMode && model) {
      try {
        // Show typing indicator
        await ctx.sendChatAction('typing');
        
        // Generate AI response
        const aiResponse = await generateAIResponse(userId, ctx.message.text);
        
        if (aiResponse) {
          // Split response if too long (Telegram's limit is 4096 characters)
          if (aiResponse.length > 4096) {
            for (let i = 0; i < aiResponse.length; i += 4096) {
              const chunk = aiResponse.slice(i, i + 4096);
              await ctx.reply(chunk);
            }
          } else {
            await ctx.reply(aiResponse);
          }
          
          // Still forward to admins for monitoring
          for (const adminId of admins) {
            try {
              await bot.telegram.sendMessage(
                adminId,
                `[AI RESPONDED] Message from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${ctx.message.text}\n\nAI Response: ${aiResponse.length > 100 ? aiResponse.substring(0, 100) + '...' : aiResponse}\n\nUser ID: ${userId}`
              );
            } catch (error) {
              console.error(`Failed to forward AI interaction to admin ${adminId}:`, error);
            }
          }
          
          return;
        }
      } catch (error) {
        console.error('AI response error:', error);
        // Fall back to forwarding to admins
      }
    }
    
    // Forward message to all admins (when AI mode is off or AI failed)
    for (const adminId of admins) {
      try {
        await bot.telegram.sendMessage(
          adminId,
          `Message from ${ctx.from.first_name || 'Unknown'} (@${ctx.from.username || 'no_username'}):\n\n${ctx.message.text}\n\nUser ID: ${userId}`
        );
      } catch (error) {
        console.error(`Failed to forward message to admin ${adminId}:`, error);
      }
    }
    
    return ctx.reply('Your message has been received. Our team will get back to you shortly.');
  }
});

// Handle photos
bot.on('photo', (ctx) => handleForwardToAdmins(ctx));

// Handle videos
bot.on('video', (ctx) => handleForwardToAdmins(ctx));

// Handle documents/files
bot.on('document', (ctx) => handleForwardToAdmins(ctx));

// Handle audio
bot.on('audio', (ctx) => handleForwardToAdmins(ctx));

// Handle voice messages
bot.on('voice', (ctx) => handleForwardToAdmins(ctx));

// Handle stickers
bot.on('sticker', (ctx) => handleForwardToAdmins(ctx));

// Set up the express app for webhook
const app = express();
app.use(express.json());

// Set webhook route
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.status(200).send('OK');
});

// Health check route
app.get('/', (req, res) => {
  const aiSettings = getAISettings();
  res.status(200).send(`Bot is running! AI Mode: ${aiSettings.aiMode ? 'ON' : 'OFF'}`);
});

// Start the express server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize Gemini AI
  const aiInitialized = await initializeGeminiModel();
  if (aiInitialized) {
    console.log('Gemini AI initialized successfully');
  } else {
    console.log('Gemini AI initialization failed - AI features disabled');
  }
  
  // Set webhook
  if (WEBHOOK_URL) {
    bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook/${BOT_TOKEN}`)
      .then(() => {
        console.log('Webhook set successfully!');
      })
      .catch(error => {
        console.error('Failed to set webhook:', error);
      });
  } else {
    console.warn('WEBHOOK_URL environment variable not set. Bot will not receive updates.');
  }
});

// Handle process termination
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
