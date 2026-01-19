import { 
  PlaywrightSession, 
  SessionConfig, 
  PlatformConfig,
  ChatMessage 
} from '@chatpipes/headless-bridges';
import { ChatGPTPlatform } from '@chatpipes/headless-bridges/platforms/ChatGPTPlatform';
import { ClaudePlatform } from '@chatpipes/headless-bridges/platforms/ClaudePlatform';
import { BingChatPlatform } from '@chatpipes/headless-bridges/platforms/BingChatPlatform';

/**
 * Example 1: Basic ChatGPT Session
 */
async function basicChatGPTSessionExample() {
  console.log('🤖 Example 1: Basic ChatGPT Session\n');

  const chatGPTPlatform = new ChatGPTPlatform();
  const platformConfig = chatGPTPlatform.getConfig();

  const sessionConfig: SessionConfig = {
    platform: 'ChatGPT',
    headless: false, // Set to false for manual login
    slowMo: 100,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    stealthMode: true,
    deviceEmulation: {
      device: 'Desktop Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    }
  };

  const session = new PlaywrightSession(sessionConfig, platformConfig);

  try {
    // Initialize session
    await session.initialize();

    // Listen for events
    session.on('session_initialized', (data) => {
      console.log(`✅ Session initialized: ${data.sessionId}`);
    });

    session.on('authentication_successful', (data) => {
      console.log(`🔐 Authentication successful for ${data.platform}`);
    });

    session.on('authentication_failed', (data) => {
      console.log(`❌ Authentication failed for ${data.platform}`);
    });

    session.on('message_sent', (data) => {
      console.log(`💬 Message sent: ${data.message.content.substring(0, 50)}...`);
    });

    session.on('response_received', (data) => {
      console.log(`🤖 Response received: ${data.response.content.substring(0, 50)}...`);
    });

    session.on('captcha_detected', (data) => {
      console.log(`⚠️ Captcha detected on ${data.platform}`);
    });

    // Authenticate (manual login required)
    const isAuthenticated = await session.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Successfully authenticated with ChatGPT');

      // Send a test message
      const response = await session.sendMessage('Hello! Can you tell me a short joke?');
      
      console.log('\n📝 Response:');
      console.log(response.content);

      // Get session info
      const sessionInfo = session.getSessionInfo();
      console.log('\n📊 Session Info:');
      console.log(sessionInfo);

      // Get message history
      const history = session.getMessageHistory();
      console.log(`\n📚 Message History: ${history.length} messages`);

      // Take screenshot
      const screenshot = await session.takeScreenshot('chatgpt-session.png');
      console.log(`📸 Screenshot saved: ${screenshot.length} bytes`);
    } else {
      console.log('❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Session error:', error);
  } finally {
    // Close session
    await session.close();
  }
}

/**
 * Example 2: Claude Session with Authentication
 */
async function claudeSessionExample() {
  console.log('\n🤖 Example 2: Claude Session with Authentication\n');

  const claudePlatform = new ClaudePlatform();
  const platformConfig = claudePlatform.getConfig();

  const sessionConfig: SessionConfig = {
    platform: 'Claude',
    headless: false,
    slowMo: 150,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    stealthMode: true,
    deviceEmulation: {
      device: 'Desktop Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    }
  };

  const session = new PlaywrightSession(sessionConfig, platformConfig);

  try {
    await session.initialize();

    // Listen for events
    session.on('session_initialized', (data) => {
      console.log(`✅ Claude session initialized: ${data.sessionId}`);
    });

    session.on('authentication_successful', (data) => {
      console.log(`🔐 Claude authentication successful`);
    });

    session.on('message_sent', (data) => {
      console.log(`💬 Claude message sent`);
    });

    session.on('response_received', (data) => {
      console.log(`🤖 Claude response received`);
    });

    // Authenticate
    const isAuthenticated = await session.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Successfully authenticated with Claude');

      // Send a test message
      const response = await session.sendMessage('What are the benefits of using Claude over other AI models?');
      
      console.log('\n📝 Claude Response:');
      console.log(response.content);

      // Get message history
      const history = session.getMessageHistory();
      console.log(`\n📚 Claude Message History: ${history.length} messages`);

    } else {
      console.log('❌ Claude authentication failed');
    }

  } catch (error) {
    console.error('❌ Claude session error:', error);
  } finally {
    await session.close();
  }
}

/**
 * Example 3: Bing Chat Session with Edge
 */
async function bingChatSessionExample() {
  console.log('\n🤖 Example 3: Bing Chat Session with Edge\n');

  const bingChatPlatform = new BingChatPlatform();
  const platformConfig = bingChatPlatform.getConfig();

  const sessionConfig: SessionConfig = {
    platform: 'BingChat',
    headless: false,
    slowMo: 200,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    stealthMode: true,
    deviceEmulation: {
      device: 'Desktop Edge',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0',
      viewport: { width: 1280, height: 720 }
    }
  };

  const session = new PlaywrightSession(sessionConfig, platformConfig);

  try {
    await session.initialize();

    // Listen for events
    session.on('session_initialized', (data) => {
      console.log(`✅ Bing Chat session initialized: ${data.sessionId}`);
    });

    session.on('authentication_successful', (data) => {
      console.log(`🔐 Bing Chat authentication successful`);
    });

    session.on('message_sent', (data) => {
      console.log(`💬 Bing Chat message sent`);
    });

    session.on('response_received', (data) => {
      console.log(`🤖 Bing Chat response received`);
    });

    // Authenticate
    const isAuthenticated = await session.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Successfully authenticated with Bing Chat');

      // Send a test message
      const response = await session.sendMessage('What are the latest news about AI?');
      
      console.log('\n📝 Bing Chat Response:');
      console.log(response.content);

      // Get message history
      const history = session.getMessageHistory();
      console.log(`\n📚 Bing Chat Message History: ${history.length} messages`);

    } else {
      console.log('❌ Bing Chat authentication failed');
    }

  } catch (error) {
    console.error('❌ Bing Chat session error:', error);
  } finally {
    await session.close();
  }
}

/**
 * Example 4: Multi-Platform Session Management
 */
async function multiPlatformSessionExample() {
  console.log('\n🤖 Example 4: Multi-Platform Session Management\n');

  const platforms = [
    { name: 'ChatGPT', platform: new ChatGPTPlatform() },
    { name: 'Claude', platform: new ClaudePlatform() },
    { name: 'BingChat', platform: new BingChatPlatform() }
  ];

  const sessions: PlaywrightSession[] = [];

  try {
    for (const { name, platform } of platforms) {
      console.log(`\n🚀 Initializing ${name} session...`);

      const sessionConfig: SessionConfig = {
        platform: name,
        headless: true, // Run in headless mode for automation
        slowMo: 100,
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 1000,
        stealthMode: true
      };

      const session = new PlaywrightSession(sessionConfig, platform.getConfig());
      sessions.push(session);

      // Set up event listeners
      session.on('session_initialized', (data) => {
        console.log(`✅ ${name} session initialized: ${data.sessionId}`);
      });

      session.on('authentication_successful', (data) => {
        console.log(`🔐 ${name} authentication successful`);
      });

      session.on('message_sent', (data) => {
        console.log(`💬 ${name} message sent`);
      });

      session.on('response_received', (data) => {
        console.log(`🤖 ${name} response received`);
      });

      // Initialize session
      await session.initialize();

      // Try to authenticate (will use saved auth state if available)
      const isAuthenticated = await session.authenticate();
      
      if (isAuthenticated) {
        console.log(`✅ ${name} session ready`);
      } else {
        console.log(`⚠️ ${name} requires manual authentication`);
      }
    }

    // Send messages to all platforms
    const testMessage = 'What is the capital of France?';
    const responses: { platform: string; response: ChatMessage }[] = [];

    for (const session of sessions) {
      try {
        const sessionInfo = session.getSessionInfo();
        if (sessionInfo.isAuthenticated) {
          console.log(`\n💬 Sending message to ${sessionInfo.platform}...`);
          const response = await session.sendMessage(testMessage);
          responses.push({
            platform: sessionInfo.platform,
            response
          });
        }
      } catch (error) {
        console.error(`❌ Error sending message to ${session.getSessionInfo().platform}:`, error);
      }
    }

    // Display responses
    console.log('\n📝 Responses from all platforms:');
    responses.forEach(({ platform, response }) => {
      console.log(`\n${platform}:`);
      console.log(response.content.substring(0, 200) + '...');
    });

  } catch (error) {
    console.error('❌ Multi-platform session error:', error);
  } finally {
    // Close all sessions
    console.log('\n🔒 Closing all sessions...');
    await Promise.all(sessions.map(session => session.close()));
  }
}

/**
 * Example 5: Authentication State Management
 */
async function authenticationStateExample() {
  console.log('\n🔐 Example 5: Authentication State Management\n');

  const chatGPTPlatform = new ChatGPTPlatform();
  const platformConfig = chatGPTPlatform.getConfig();

  const sessionConfig: SessionConfig = {
    platform: 'ChatGPT',
    headless: false,
    slowMo: 100,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    stealthMode: true
  };

  const session = new PlaywrightSession(sessionConfig, platformConfig);

  try {
    await session.initialize();

    // Listen for authentication events
    session.on('authentication_successful', (data) => {
      console.log(`🔐 Authentication successful - state will be saved automatically`);
    });

    session.on('authentication_failed', (data) => {
      console.log(`❌ Authentication failed - check credentials`);
    });

    // Try to authenticate
    const isAuthenticated = await session.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Authentication successful');
      console.log('💾 Authentication state has been saved to auth/chatgpt.json');
      console.log('🔄 Next time you run this, it will use the saved authentication state');
      
      // Send a test message
      const response = await session.sendMessage('Hello! This is a test of the authentication state management.');
      console.log('\n📝 Response:', response.content);
      
    } else {
      console.log('❌ Authentication failed');
      console.log('💡 Try running this example again after manually logging in');
    }

  } catch (error) {
    console.error('❌ Authentication state example error:', error);
  } finally {
    await session.close();
  }
}

/**
 * Example 6: Bot Detection Avoidance
 */
async function botDetectionAvoidanceExample() {
  console.log('\n🕵️ Example 6: Bot Detection Avoidance\n');

  const chatGPTPlatform = new ChatGPTPlatform();
  const platformConfig = chatGPTPlatform.getConfig();

  const sessionConfig: SessionConfig = {
    platform: 'ChatGPT',
    headless: false,
    slowMo: 200, // Slower typing for human-like behavior
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000, // Longer delays between retries
    stealthMode: true, // Enable stealth mode
    deviceEmulation: {
      device: 'Desktop Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    }
  };

  const session = new PlaywrightSession(sessionConfig, platformConfig);

  try {
    await session.initialize();

    // Listen for bot detection events
    session.on('console_message', (data) => {
      if (data.text.includes('bot') || data.text.includes('captcha')) {
        console.log(`⚠️ Potential bot detection: ${data.text}`);
      }
    });

    session.on('page_error', (data) => {
      console.log(`❌ Page error: ${data.error}`);
    });

    // Try to authenticate
    const isAuthenticated = await session.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Successfully authenticated with bot detection avoidance');
      
      // Send messages with human-like delays
      const messages = [
        'Hello!',
        'How are you today?',
        'Can you help me with a question?'
      ];

      for (const message of messages) {
        console.log(`\n💬 Sending: ${message}`);
        const response = await session.sendMessage(message);
        console.log(`🤖 Response: ${response.content.substring(0, 100)}...`);
        
        // Wait between messages like a human
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      }
      
    } else {
      console.log('❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Bot detection avoidance example error:', error);
  } finally {
    await session.close();
  }
}

/**
 * Run all headless browser examples
 */
async function runAllHeadlessBrowserExamples() {
  try {
    console.log('🤖 Headless Browser Framework Examples\n');

    // Example 1: Basic ChatGPT session
    await basicChatGPTSessionExample();

    // Example 2: Claude session
    await claudeSessionExample();

    // Example 3: Bing Chat session
    await bingChatSessionExample();

    // Example 4: Multi-platform session management
    await multiPlatformSessionExample();

    // Example 5: Authentication state management
    await authenticationStateExample();

    // Example 6: Bot detection avoidance
    await botDetectionAvoidanceExample();

    console.log('\n✅ All headless browser examples completed successfully!');
  } catch (error) {
    console.error('❌ Headless browser example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllHeadlessBrowserExamples();
}

export {
  basicChatGPTSessionExample,
  claudeSessionExample,
  bingChatSessionExample,
  multiPlatformSessionExample,
  authenticationStateExample,
  botDetectionAvoidanceExample,
  runAllHeadlessBrowserExamples
}; 