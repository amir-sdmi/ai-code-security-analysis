// Twitter Engagement Automator - Content Script

// Global settings
let settings = {
  automationEnabled: false,
  likeEnabled: true,
  commentEnabled: true,
  followEnabled: true,
  debugMode: false,
  apiKey: '',
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
  model: 'gemini-2.0-flash-lite'
};

// Track processed tweets to avoid duplicates
const processedTweets = new Set();
const followedUsers = new Set();
const commentedTweets = new Set(); // Track tweets we've already commented on
const repliedToUsers = new Set(); // NEW: Track users we've already replied to
const apiRequestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
// Dynamic rate limiting based on model (conservative approach)
const getMinRequestInterval = () => {
  const model = settings.model || 'gemini-2.0-flash-lite';
  switch (model) {
    case 'gemini-2.0-flash-lite': return 2500; // 30 RPM → ~2 seconds
    case 'gemini-2.0-flash': return 4500; // 15 RPM → ~4 seconds  
    case 'gemini-2.5-flash': return 6500; // 10 RPM → ~6 seconds
    case 'gemini-2.5-pro': return 13000; // 5 RPM → ~12 seconds
    default: return 5000; // Safe default
  }
};
let isProcessingTweets = false; // Flag to prevent concurrent processing

// List of blocked usernames (don't interact with these accounts)
const BLOCKED_USERNAMES = ['Anubhavhing']; // NEW: Add usernames to block

// Debug logging function
function debugLog(...args) {
  if (settings.debugMode) {
    console.log('[Twitter Automator]', ...args);
  }
}

// Initialize the extension
function initialize() {
  console.log('Twitter Engagement Automator initialized');
  
  // Load settings
  loadSettings().then(items => {
    settings = items;
    debugLog('Settings loaded:', settings);
    
    // Check if API key is provided when automation is enabled
    if (settings.automationEnabled) {
      if (!settings.apiKey) {
        console.error('API key is required for automation. Disabling automation.');
        settings.automationEnabled = false;
        
        // Show notification to user
        showNotification('API Key Required', 'Please enter your Gemini API key in the extension settings to enable automation.');
        
        // Save settings to persist the disabled state
        saveSettings({
          ...settings,
          automationEnabled: false
        }).catch(error => {
          console.error('Error saving settings:', error);
        });
      } else {
        startAutomation();
      }
    }
  }).catch(error => {
    console.error('Error loading settings:', error);
  });
  
  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Content script received message:', message, 'from sender:', sender);
    
    if (message.action === 'updateSettings') {
      settings = message.settings;
      debugLog('Settings updated:', settings);
      
      // Check if API key is provided when automation is enabled
      if (settings.automationEnabled) {
        if (!settings.apiKey) {
          console.error('API key is required for automation. Disabling automation.');
          settings.automationEnabled = false;
          
          // Show notification to user
          showNotification('API Key Required', 'Please enter your Gemini API key in the extension settings to enable automation.');
          
          // Save settings to persist the disabled state
          saveSettings({
            ...settings,
            automationEnabled: false
          }).catch(error => {
            console.error('Error saving settings:', error);
          });
          
          // Acknowledge receipt
          console.log('Sending response to message:', { success: true, apiKeyMissing: true });
          sendResponse({ success: true, apiKeyMissing: true });
        } else {
          startAutomation();
          
          // Acknowledge receipt
          console.log('Sending response to message:', { success: true });
          sendResponse({ success: true });
        }
      } else {
        // Acknowledge receipt
        console.log('Sending response to message:', { success: true });
        sendResponse({ success: true });
      }
    }
    return true;
  });
}

// Start the automation process
function startAutomation() {
  debugLog('Starting automation');
  
  // Process visible tweets immediately
  processVisibleTweets();
  
  // Set up a mutation observer to detect new tweets
  setupTweetObserver();
  
  // Process tweets periodically as user scrolls, but much less frequently
  setInterval(processVisibleTweets, 30000); // Check for new tweets every 60 seconds
}

// Set up mutation observer to detect new tweets
function setupTweetObserver() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  
  const callback = function(mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Wait longer for the DOM to settle
        setTimeout(processVisibleTweets, 10000); // Wait 10 seconds before processing new tweets
        break;
      }
    }
  };
  
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// Process all visible tweets on the page
async function processVisibleTweets() {
  if (!settings.automationEnabled || isProcessingTweets) {
    debugLog('Automation disabled or already processing tweets, skipping');
    return;
  }
  
  isProcessingTweets = true;
  debugLog('Processing visible tweets');
  
  try {
    // Check if we're in a section where we shouldn't process tweets
    const currentUrl = window.location.href;
    if (currentUrl.includes('/replies') || 
        currentUrl.includes('/with_replies') || 
        currentUrl.includes('/status/')) {
      debugLog('In replies or conversation section, skipping automation');
      isProcessingTweets = false;
      return;
    }
    
    // Check if a reply dialog is open - if so, skip processing
    const replyDialog = document.querySelector('[aria-labelledby="modal-header"]');
    if (replyDialog) {
      debugLog('Reply dialog is open, skipping automation');
      isProcessingTweets = false;
      return;
    }
    
    // Find all tweet articles
    // Twitter's DOM structure might change, so we need to adapt the selectors
    const tweetArticles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
    
    // Filter out already processed tweets
    const unprocessedTweets = tweetArticles.filter(article => {
      const tweetId = article.getAttribute('aria-labelledby');
      
      // Skip tweets that are inside a reply dialog
      if (article.closest('[aria-labelledby="modal-header"]')) {
        return false;
      }
      
      return tweetId && !processedTweets.has(tweetId);
    });
    
    debugLog(`Found ${unprocessedTweets.length} unprocessed tweets`);
    
    // Process tweets one by one
    for (const article of unprocessedTweets) {
      try {
        // Get tweet ID or some unique identifier
        const tweetId = article.getAttribute('aria-labelledby');
        
        // Mark as processed to avoid duplicates
        processedTweets.add(tweetId);
        
        debugLog('Processing tweet:', tweetId);
        
        // Extract tweet content for AI comment generation
        const tweetText = extractTweetText(article);
        const username = extractUsername(article);
        
        debugLog('Tweet text:', tweetText ? tweetText.substring(0, 50) + '...' : 'No text');
        debugLog('Username:', username);
        
        // NEW: Skip if username is in the blocked list
        if (username && BLOCKED_USERNAMES.includes(username)) {
          debugLog('Skipping blocked user: ' + username);
          continue;
        }
        
        // NEW: Skip if we've already replied to this user
        if (username && repliedToUsers.has(username)) {
          debugLog('Already replied to user ' + username + ', skipping');
          continue;
        }
        
        // Check if this is our own comment to avoid loops
        const isOwnComment = checkIfOwnComment(article);
        if (isOwnComment) {
          debugLog('Skipping our own comment to avoid loops');
          continue;
        }
        
        // Scroll the tweet into view
        article.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000); // Reduced wait for scroll to complete
        
        // Perform actions based on settings
        if (settings.likeEnabled) {
          await likeTweet(article);
          await sleep(getRandomDelay(1000, 2000)); // Reduced wait between actions
        }
        
        if (settings.followEnabled && username && !BLOCKED_USERNAMES.includes(username)) {
          await followUser(article, username);
          await sleep(getRandomDelay(1000, 2000)); // Reduced wait between actions
        }
        
        if (settings.commentEnabled && tweetText && username && !BLOCKED_USERNAMES.includes(username)) {
          const success = await commentOnTweet(article, tweetText, username);
          if (success && username) {
            repliedToUsers.add(username); // Track that we've replied to this user
          }
          // Reduced delay after commenting
          await sleep(getRandomDelay(3000, 5000));
        }
        
        // Reduced delay between processing tweets
        await sleep(getRandomDelay(3000, 5000));
        
        // Only process one tweet at a time to avoid overwhelming the API
        break;
      } catch (error) {
        console.error('Error processing tweet:', error);
        await sleep(2000); // Wait a bit before continuing to the next tweet
      }
    }
  } catch (error) {
    console.error('Error in processVisibleTweets:', error);
  } finally {
    isProcessingTweets = false;
    debugLog('Finished processing tweets');
  }
}

// Extract the text content of a tweet
function extractTweetText(article) {
  try {
    // Try multiple selectors for tweet text
    const textSelectors = [
      '[data-testid="tweetText"]',
      'div[lang]',
      'div[data-testid="tweetText"] span',
      'article div[dir="auto"]'
    ];
    
    for (const selector of textSelectors) {
      const elements = article.querySelectorAll(selector);
      if (elements.length > 0) {
        // Combine text from all matching elements
        let tweetText = '';
        elements.forEach(element => {
          // Skip elements that are likely not part of the main tweet text
          if (element.closest('[data-testid="card.wrapper"]') || 
              element.closest('[data-testid="User-Name"]') ||
              element.closest('[data-testid="socialContext"]')) {
            return;
          }
          
          const text = element.textContent.trim();
          if (text) {
            tweetText += (tweetText ? ' ' : '') + text;
          }
        });
        
        if (tweetText) {
          console.log(`Found tweet text with selector: ${selector}, text: ${tweetText.substring(0, 50)}...`);
          return tweetText;
        }
      }
    }
    
    console.log('Tweet text not found with any selector');
    return '';
  } catch (error) {
    console.error('Error extracting tweet text:', error);
    return '';
  }
}

// Extract the username from a tweet
function extractUsername(article) {
  try {
    // Try multiple selectors for username
    const usernameSelectors = [
      '[data-testid="User-Name"] a:nth-child(2)',
      '[data-testid="User-Name"] a[href*="/"]',
      'a[role="link"][href*="/"]',
      'div[data-testid="User-Name"] > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)',
      'div[data-testid="User-Name"] a'
    ];
    
    for (const selector of usernameSelectors) {
      const elements = article.querySelectorAll(selector);
      for (const element of elements) {
        // Check if this looks like a username (starts with @)
        const text = element.textContent.trim();
        if (text.startsWith('@')) {
          console.log(`Found username with selector: ${selector}, username: ${text}`);
          return text.substring(1); // Remove the @ symbol
        }
        
        // Check if it's a username without the @ symbol
        const href = element.getAttribute('href');
        if (href && href.includes('/') && !href.includes('search') && !href.includes('explore')) {
          const parts = href.split('/').filter(part => part.length > 0);
          if (parts.length > 0) {
            const username = parts[parts.length - 1];
            console.log(`Extracted username from href with selector: ${selector}, username: ${username}`);
            return username;
          }
        }
      }
    }
    
    console.log('Username not found with any selector');
    return '';
  } catch (error) {
    console.error('Error extracting username:', error);
    return '';
  }
}

// Like a tweet
async function likeTweet(article) {
  try {
    // Try multiple selectors for the like button
    const likeSelectors = [
      '[data-testid="like"]',
      '[aria-label="Like"]',
      '[aria-label="like"]',
      'div[role="button"] svg[viewBox="0 0 24 24"][aria-hidden="true"]'
    ];
    
    let likeButton = null;
    
    // Try each selector
    for (const selector of likeSelectors) {
      const button = article.querySelector(selector);
      if (button) {
        console.log(`Found like button with selector: ${selector}`);
        likeButton = button;
        break;
      }
    }
    
    if (likeButton) {
      debugLog('Liking tweet');
      likeButton.click();
      await sleep(getRandomDelay(500, 1500));
    } else {
      console.log('Like button not found');
    }
  } catch (error) {
    console.error('Error liking tweet:', error);
  }
}

// Follow a user
async function followUser(article, username) {
  try {
    if (followedUsers.has(username) || !username) return;
    
    // Try multiple selectors for the follow button
    const followSelectors = [
      '[data-testid="followButton"]',
      '[aria-label="Follow @' + username + '"]',
      '[aria-label="follow"]',
      '[aria-label="Follow"]',
      'div[role="button"]:not([data-testid="like"]):not([data-testid="reply"])'
    ];
    
    let followButton = null;
    
    // Try each selector
    for (const selector of followSelectors) {
      const buttons = article.querySelectorAll(selector);
      // Look for a button that contains text like "Follow"
      for (const button of buttons) {
        const buttonText = button.textContent.toLowerCase();
        if (buttonText.includes('follow') && !buttonText.includes('following') && !buttonText.includes('unfollow')) {
          followButton = button;
          console.log(`Found follow button with selector: ${selector}, text: ${buttonText}`);
          break;
        }
      }
      if (followButton) break;
    }
    
    if (followButton) {
      debugLog('Following user:', username);
      followButton.click();
      followedUsers.add(username);
      await sleep(getRandomDelay(500, 1500));
    } else {
      console.log('Follow button not found for user:', username);
    }
  } catch (error) {
    console.error('Error following user:', error);
  }
}

// Comment on a tweet
async function commentOnTweet(article, tweetText, username) {
  try {
    // Get tweet ID to track commented tweets
    const tweetId = article.getAttribute('aria-labelledby');
    
    // Skip if we've already commented on this tweet
    if (commentedTweets.has(tweetId)) {
      debugLog('Already commented on tweet:', tweetId);
      return false;
    }
    
    // NEW: Skip if username is in the blocked list
    if (username && BLOCKED_USERNAMES.includes(username)) {
      debugLog('Skipping comment on blocked user: ' + username);
      return false;
    }
    
    // NEW: Skip if we've already replied to this user
    if (username && repliedToUsers.has(username)) {
      debugLog('Already replied to user ' + username + ', skipping comment');
      return false;
    }
    
    // Check if there's an indicator that we've already replied
    const alreadyRepliedIndicator = article.querySelector('[data-testid="socialContext"]');
    if (alreadyRepliedIndicator && alreadyRepliedIndicator.textContent.includes('You replied')) {
      debugLog('Twitter indicates we already replied to this tweet');
      commentedTweets.add(tweetId);
      if (username) repliedToUsers.add(username);
      return false;
    }
    
    debugLog('Commenting on tweet with text:', tweetText);
    
    // Generate a comment BEFORE clicking the reply button
    // This avoids timing issues with the dialog opening
    console.log('Generating comment for tweet');
    const comment = await generateComment(tweetText);
    console.log('Generated comment:', comment);
    
    if (!comment) {
      console.log('No comment generated due to API error, stopping automation');
      return false;
    }
    
    // Find the reply button with multiple selectors for better reliability
    let replyButton = article.querySelector('[data-testid="reply"]');
    
    // If the primary selector fails, try alternative selectors
    if (!replyButton) {
      console.log('Primary reply button selector failed, trying alternatives');
      
      // Try alternative selectors
      const possibleSelectors = [
        '[aria-label="Reply"]',
        '[aria-label="reply"]',
        'div[role="button"][data-testid="reply"]',
        'div[role="button"] svg[viewBox="0 0 24 24"][aria-hidden="true"]'
      ];
      
      for (const selector of possibleSelectors) {
        const button = article.querySelector(selector);
        if (button) {
          console.log(`Found reply button with selector: ${selector}`);
          replyButton = button;
          break;
        }
      }
    }
    
    if (!replyButton) {
      console.log('Reply button not found for tweet:', tweetId);
      return false;
    }
    
    // Now click the reply button to open the comment dialog
    console.log('Clicking reply button');
    replyButton.click();
    await sleep(10000); // Reduced wait for dialog to open
    
    // Try multiple selectors for the tweet input field
    const inputSelectors = [
      // Specific selectors for the Draft.js editor structure
      'div.notranslate.public-DraftEditor-content[contenteditable="true"][data-testid="tweetTextarea_0"]',
      'div.public-DraftEditor-content[contenteditable="true"][data-testid="tweetTextarea_0"]',
      'div.public-DraftEditor-content[contenteditable="true"]',
      'div[aria-activedescendant][aria-autocomplete="list"][aria-label="Post text"][contenteditable="true"][data-testid="tweetTextarea_0"]',
      
      // More general selectors
      '[data-testid="tweetTextarea_0"]',
      'div[aria-label="Post text"][contenteditable="true"]',
      'div[data-testid="tweetTextarea_0"][contenteditable="true"]',
      'div[aria-label="Tweet text"]',
      'div[aria-label="Post text"]',
      'div[data-contents="true"]',
      'div[role="textbox"][contenteditable="true"]',
      'div[data-testid="tweetTextInput"]'
    ];
    
    let tweetInput = null;
    
    // Try each selector
    for (const selector of inputSelectors) {
      const input = document.querySelector(selector);
      if (input) {
        console.log(`Found tweet input with selector: ${selector}`);
        tweetInput = input;
        break;
      }
    }
    
    if (!tweetInput) {
      console.log('Tweet input field not found after multiple attempts');
      
      // Try to find any visible textbox in the reply dialog
      const replyDialog = document.querySelector('[aria-labelledby="modal-header"]');
      if (replyDialog) {
        const possibleInputs = replyDialog.querySelectorAll('div[role="textbox"], textarea, [contenteditable="true"]');
        if (possibleInputs.length > 0) {
          tweetInput = possibleInputs[0];
          console.log('Found potential input field in reply dialog');
        }
      }
      
      // If still not found, close the dialog and return
      if (!tweetInput) {
        console.log('No suitable input field found, closing dialog');
        const closeButton = document.querySelector('[data-testid="app-bar-close"]');
        if (closeButton) closeButton.click();
        await sleep(30000); // Wait 30 seconds before closing
        return false;
      }
    }
    
    // After finding the input field, try to directly find and manipulate the span structure
    if (tweetInput) {
      console.log('Found tweet input, now looking for span structure');
      
      // Try to find the specific span structure
      const dataOffsetSpan = tweetInput.querySelector('span[data-offset-key]');
      if (dataOffsetSpan) {
        console.log('Found span with data-offset-key, attempting direct manipulation');
        
        // Try to set the text directly in this span
        try {
          dataOffsetSpan.textContent = comment;
          dataOffsetSpan.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Also try to find the inner span with data-text="true"
          const dataTextSpan = dataOffsetSpan.querySelector('span[data-text="true"]');
          if (dataTextSpan) {
            console.log('Found inner span with data-text="true"');
            dataTextSpan.textContent = comment;
            dataTextSpan.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          // Dispatch events on the main input
          tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
          tweetInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log('Direct span manipulation completed');
        } catch (spanError) {
          console.error('Error manipulating span directly:', spanError);
        }
      }
    }
    
    console.log('Setting comment text in input field');
    
    // Use multiple approaches to set the text
    try {
      // Focus the input first
      tweetInput.focus();
      await sleep(500);
      
      // For Draft.js editor (Twitter's specific implementation)
      if (tweetInput.classList.contains('public-DraftEditor-content') || 
          tweetInput.getAttribute('data-testid') === 'tweetTextarea_0') {
        
        // Try to find and modify the span tag where text should be inserted
        const spanElement = tweetInput.querySelector('span[data-text="true"]');
        if (spanElement) {
          spanElement.textContent = comment;
          spanElement.dispatchEvent(new Event('input', { bubbles: true }));
          tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // Create the proper structure if not found
          let dataContentsDiv = tweetInput.querySelector('div[data-contents="true"]');
          if (!dataContentsDiv) {
            dataContentsDiv = document.createElement('div');
            dataContentsDiv.setAttribute('data-contents', 'true');
            tweetInput.appendChild(dataContentsDiv);
          }
          const spanHTML = `<div data-block="true"><div class="public-DraftStyleDefault-block public-DraftStyleDefault-ltr"><span data-text="true">${comment}</span></div></div>`;
          dataContentsDiv.innerHTML = spanHTML;
        }
        
        // Dispatch necessary events
        ['input', 'change'].forEach(eventType => {
          tweetInput.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
      // For contenteditable divs
      else if (tweetInput.getAttribute('contenteditable') === 'true') {
        tweetInput.innerHTML = comment;
        tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
      } 
      // For standard inputs/textareas
      else if (tweetInput.tagName === 'TEXTAREA' || tweetInput.tagName === 'INPUT') {
        tweetInput.value = comment;
        tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // For other elements
      else {
        if ('value' in tweetInput) {
          tweetInput.value = comment;
        } else {
          tweetInput.innerHTML = comment;
        }
        tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Focus the input again and verify
      tweetInput.focus();
      await sleep(1000);
      
      const currentText = tweetInput.value || tweetInput.innerHTML || tweetInput.textContent;
      
      // If text setting failed, try simulated typing as last resort
      if (!currentText || !currentText.includes(comment.substring(0, 10))) {
        console.log('Text setting failed, trying simulated typing');
        
        const spanElement = tweetInput.querySelector('span[data-text="true"]');
        if (spanElement) {
          spanElement.textContent = '';
          for (let i = 0; i < comment.length; i++) {
            spanElement.textContent += comment[i];
            spanElement.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(20); // Faster typing
          }
        } else {
          // Clear and type into the input directly
          if (tweetInput.getAttribute('contenteditable') === 'true') {
            tweetInput.innerHTML = '';
          } else if ('value' in tweetInput) {
            tweetInput.value = '';
          }
          
          for (let i = 0; i < comment.length; i++) {
            if (tweetInput.getAttribute('contenteditable') === 'true') {
              tweetInput.innerHTML += comment[i];
            } else if ('value' in tweetInput) {
              tweetInput.value += comment[i];
            }
            tweetInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(20);
          }
        }
      }
      
    } catch (inputError) {
      console.error('Error setting input value:', inputError);
      return false;
    }
    
    // Wait before submitting to ensure text is properly entered
    console.log('Waiting 8 seconds before submitting comment...');
    await sleep(8000);
    
    // Verify the text was entered correctly
    const finalText = tweetInput.value || tweetInput.innerHTML || tweetInput.textContent;
    if (!finalText || finalText.trim() === '') {
      console.log('No text found in input field, cannot submit');
      const closeButton = document.querySelector('[data-testid="app-bar-close"]');
      if (closeButton) closeButton.click();
      await sleep(3000);
      return false;
    }
    
    // Try multiple selectors for the submit button
    const submitSelectors = [
      '[data-testid="tweetButton"]',
      '[data-testid="tweetButtonInline"]', 
      'div[role="button"][data-testid="tweetButton"]',
      'div[role="button"]:not([data-testid="app-bar-close"]):not([aria-label*="Close"])'
    ];
    
    let submitButton = null;
    
    // Try each selector
    for (const selector of submitSelectors) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        const buttonText = button.textContent.toLowerCase().trim();
        
        if ((buttonText.includes('reply') || buttonText.includes('tweet') || buttonText.includes('post')) && 
            buttonText !== 'close' && !buttonText.includes('cancel')) {
          submitButton = button;
          break;
        }
      }
      if (submitButton) break;
    }
    
    // Check if the button is clickable and click it
    if (submitButton) {
      const isDisabled = submitButton.disabled || 
                        submitButton.getAttribute('aria-disabled') === 'true';
      
      if (!isDisabled) {
        console.log('Clicking submit button');
        
        submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        
        try {
          submitButton.focus();
          submitButton.click();
        } catch (clickError) {
          // Try mouse events as fallback
          submitButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          await sleep(100);
          submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        
        commentedTweets.add(tweetId);
        await sleep(5000);
      } else {
        console.log('Submit button is disabled');
        // Try to find any enabled button
        const allButtons = document.querySelectorAll('div[role="button"], button');
        let found = false;
        
        for (const button of allButtons) {
          const buttonText = button.textContent.toLowerCase().trim();
          const isClickable = !button.disabled && button.getAttribute('aria-disabled') !== 'true';
          
          if (isClickable && 
              (buttonText.includes('reply') || buttonText.includes('tweet') || buttonText.includes('post')) && 
              !buttonText.includes('close') && !buttonText.includes('cancel')) {
            button.click();
            commentedTweets.add(tweetId);
            found = true;
            await sleep(5000);
            break;
          }
        }
        
        if (!found) {
          const closeButton = document.querySelector('[data-testid="app-bar-close"]');
          if (closeButton) closeButton.click();
          await sleep(3000);
        }
      }
    } else {
      console.log('Submit button not found');
      
      // Try to find any suitable button
      const allButtons = document.querySelectorAll('div[role="button"], button');
      let found = false;
      
      for (const button of allButtons) {
        const buttonText = button.textContent.toLowerCase().trim();
        const isClickable = !button.disabled && button.getAttribute('aria-disabled') !== 'true';
        
        if (isClickable && 
            (buttonText.includes('reply') || buttonText.includes('tweet') || buttonText.includes('post')) && 
            !buttonText.includes('close') && !buttonText.includes('cancel')) {
          button.click();
          commentedTweets.add(tweetId);
          found = true;
          await sleep(5000);
          break;
        }
      }
      
      if (!found) {
        const closeButton = document.querySelector('[data-testid="app-bar-close"]');
        if (closeButton) closeButton.click();
        await sleep(3000);
      }
    }
    
    // After successful comment submission:
    commentedTweets.add(tweetId); // Mark as commented
    if (username) repliedToUsers.add(username); // Track the user we replied to
    return true;
  } catch (error) {
    console.error('Error commenting on tweet:', error);
    console.error('Error stack:', error.stack);
    // Try to close the reply dialog if there was an error
    const closeButton = document.querySelector('[data-testid="app-bar-close"]');
    if (closeButton) closeButton.click();
    await sleep(3000); // Reduced wait after closing on error
    return false;
  }
}

// Generate a comment using the Gemini API
async function generateComment(tweetText) {
  return new Promise((resolve) => {
    // Add request to queue
    apiRequestQueue.push({
      tweetText,
      callback: resolve
    });
    
    // Process queue if not already processing
    if (!isProcessingQueue) {
      processApiQueue();
    }
  });
}

// Process the API request queue with rate limiting
async function processApiQueue() {
  if (apiRequestQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  
  isProcessingQueue = true;
  
  // Ensure we respect rate limits
  const now = Date.now();
  const timeToWait = Math.max(0, getMinRequestInterval() - (now - lastRequestTime));
  
  if (timeToWait > 0) {
    await sleep(timeToWait);
  }
  
  const request = apiRequestQueue.shift();
  
  try {
    const comment = await callGeminiApi(request.tweetText);
    request.callback(comment);
    
    // If API call failed, disable automation
    if (!comment) {
      console.error('API call failed, disabling automation');
      settings.automationEnabled = false;
      
      // Show notification to user
      showNotification('API Error', 'Failed to connect to Gemini API. Automation has been disabled.');
      
      // Save settings to persist the disabled state
      saveSettings({
        ...settings,
        automationEnabled: false
      }).catch(error => {
        console.error('Error saving settings:', error);
      });
      
      // Clear the queue
      apiRequestQueue.length = 0;
      isProcessingQueue = false;
      return;
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    request.callback(null);
    
    // Disable automation on error
    console.error('API call error, disabling automation');
    settings.automationEnabled = false;
    
    // Show notification to user
    showNotification('API Error', 'Error connecting to Gemini API: ' + error.message + '. Automation has been disabled.');
    
    // Save settings to persist the disabled state
    saveSettings({
      ...settings,
      automationEnabled: false
    }).catch(error => {
      console.error('Error saving settings:', error);
    });
    
    // Clear the queue
    apiRequestQueue.length = 0;
    isProcessingQueue = false;
    return;
  }
  
  lastRequestTime = Date.now();
  
  // Process next item in queue
  processApiQueue();
}

// Helper function to handle Gemini API responses
function handleGeminiApiResponse(response) {
  if (!response) {
    console.error('No response received from Gemini API');
    return null;
  }
  
  if (response.error) {
    console.error('Gemini API error:', response.error);
    return null;
  }
  
  // Handle different response structures
  let candidates = null;
  let responseData = null;
  
  // Check if response has the data wrapper (from background script)
  if (response.data) {
    responseData = response.data;
  } else {
    // Direct API response structure
    responseData = response;
  }
  
  // Extract candidates from response
  if (responseData && responseData.candidates) {
    candidates = responseData.candidates;
  }
  
  // Validate candidates structure
  if (!candidates || !candidates[0]) {
    console.error('Invalid Gemini API response format. No candidates found');
    console.error('Actual response structure:', JSON.stringify(response, null, 2));
    return null;
  }
  
  const candidate = candidates[0];
  
  // Check for truncated response due to token limits
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.error('Gemini API response was truncated due to MAX_TOKENS limit');
    console.error('Consider increasing maxOutputTokens in the request');
    console.error('Response:', JSON.stringify(response, null, 2));
    return null;
  }
  
  // Check for other problematic finish reasons
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    console.error('Gemini API response finished with reason:', candidate.finishReason);
    console.error('Response:', JSON.stringify(response, null, 2));
    return null;
  }
  
  // Validate content structure
  if (!candidate.content || !candidate.content.parts || 
      !candidate.content.parts[0] || !candidate.content.parts[0].text) {
    console.error('Invalid Gemini API response format. Expected: candidates[0].content.parts[0].text');
    console.error('Actual response structure:', JSON.stringify(response, null, 2));
    return null;
  }
  
  // Extract just the content from the response
  let comment = candidate.content.parts[0].text.trim();
  
  // Remove quotes if present (the API sometimes returns the comment in quotes)
  if (comment.startsWith('"') && comment.endsWith('"')) {
    comment = comment.substring(1, comment.length - 1).trim();
  }
  
  if (!comment) {
    console.error('Empty comment received from Gemini API');
    return null;
  }
  
  console.log('Extracted clean comment from Gemini API:', comment);
  return comment;
}

// Helper function to handle API responses (legacy Groq format - kept for backward compatibility)
function handleApiResponse(response) {
  if (!response) {
    console.error('No response received from API');
    return null;
  }
  
  if (response.error) {
    console.error('API error:', response.error);
    return null;
  }
  
  if (!response.data || !response.data.choices || !response.data.choices[0] || 
      !response.data.choices[0].message || !response.data.choices[0].message.content) {
    console.error('Invalid API response format:', response);
    return null;
  }
  
  // Extract just the content from the response
  let comment = response.data.choices[0].message.content.trim();
  
  // Remove quotes if present (the API sometimes returns the comment in quotes)
  if (comment.startsWith('"') && comment.endsWith('"')) {
    comment = comment.substring(1, comment.length - 1).trim();
  }
  
  if (!comment) {
    console.error('Empty comment received from API');
    return null;
  }
  
  console.log('Extracted clean comment from API:', comment);
  return comment;
}

// Call the Gemini API to generate a comment
async function callGeminiApi(tweetText) {
  try {
    console.log('Attempting to generate comment via Gemini API for tweet:', tweetText.substring(0, 50) + '...');
    console.log('Using API endpoint:', settings.apiEndpoint);
    
    // Use a try-catch block specifically for the API operation
    try {
      const prompt = `Write a short, engaging comment for this tweet: "${tweetText}". Keep it under 280 characters, conversational, and natural. No hashtags or emojis. Just the comment text.`;
      
      // Create request body using Gemini's format
      // Set reasonable token limit for comment generation (free tier provides 32K tokens/min)
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 5000, // Generous limit for comment generation
          stopSequences: [],
          responseMimeType: "text/plain"
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      };
      
      console.log('API request payload:', requestBody);
      
      // Send request through the background script to avoid CORS
      console.log('Sending API request through background script to avoid CORS');
      const response = await sendMessageToBackground({
        action: 'makeApiRequest',
        apiEndpoint: `${settings.apiEndpoint}?key=${settings.apiKey}`,
        apiKey: '', // API key is in the URL for Gemini
        requestBody: requestBody
      });
      
      console.log('Received response from background script:', response);
      
      // Process the API response
      const comment = handleGeminiApiResponse(response);
      if (comment) {
        console.log('Successfully generated comment from Gemini API:', comment);
        return comment;
      } else {
        console.log('Failed to get valid comment from API, stopping automation');
        console.log('Full response for debugging:', JSON.stringify(response, null, 2));
        return null;
      }
    } catch (apiError) {
      console.error('Error in API request:', apiError);
      console.error('Error details:', apiError.message);
      return null;
    }
  } catch (error) {
    console.error('Error in callGeminiApi function:', error);
    return null;
  }
}

// Helper function for random delays to make automation look more natural
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to sleep for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Show a notification to the user
function showNotification(title, message) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#f8d7da';
  notification.style.color = '#721c24';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  notification.style.zIndex = '10000';
  notification.style.maxWidth = '300px';
  
  // Add title
  const titleElement = document.createElement('h3');
  titleElement.style.margin = '0 0 10px 0';
  titleElement.textContent = title;
  notification.appendChild(titleElement);
  
  // Add message
  const messageElement = document.createElement('p');
  messageElement.style.margin = '0';
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#721c24';
  closeButton.onclick = function() {
    document.body.removeChild(notification);
  };
  notification.appendChild(closeButton);
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 10000);
}

// Function to check if a tweet is our own comment - improved version
function checkIfOwnComment(article) {
  try {
    // Check for indicators that this is our own comment
    
    // 1. Check if the tweet has a "You replied" indicator
    const socialContext = article.querySelector('[data-testid="socialContext"]');
    if (socialContext && socialContext.textContent.includes('You replied')) {
      return true;
    }
    
    // 2. Check if the tweet has a "You" indicator (showing it's your own tweet)
    const userLabels = article.querySelectorAll('[data-testid="User-Name"] span');
    for (const label of userLabels) {
      if (label.textContent.includes('You')) {
        return true;
      }
    }
    
    // 3. Check for verified checkmark that appears next to your own name
    const verifiedBadges = article.querySelectorAll('svg[aria-label="Verified account"]');
    if (verifiedBadges.length > 0) {
      // Check if this verified badge is next to a "You" label
      for (const badge of verifiedBadges) {
        const parentElement = badge.closest('[data-testid="User-Name"]');
        if (parentElement && parentElement.textContent.includes('You')) {
          return true;
        }
      }
    }
    
    // 4. Check if the tweet was posted very recently (within the last minute)
    const timeElements = article.querySelectorAll('time');
    for (const timeEl of timeElements) {
      const timestamp = timeEl.getAttribute('datetime');
      if (timestamp) {
        const tweetTime = new Date(timestamp);
        const now = new Date();
        const diffSeconds = (now - tweetTime) / 1000;
        if (diffSeconds < 120) { // Less than 2 minutes old
          return true;
        }
      }
    }
    
    // 5. Check if we're in a reply thread where we've already commented
    const replyingToElements = article.querySelectorAll('[data-testid="reply"]');
    if (replyingToElements.length > 0) {
      // Check if this is in a conversation thread
      const conversationThread = article.closest('[aria-label*="Conversation"]');
      if (conversationThread) {
        // If we're in a conversation thread, check if any tweets in the thread are ours
        const threadsOwnTweets = conversationThread.querySelectorAll('[data-testid="User-Name"] span');
        for (const label of threadsOwnTweets) {
          if (label.textContent.includes('You')) {
            return true; // We've already participated in this thread
          }
        }
      }
    }
    
    // 6. Check if we're in the "Your replies" section
    const pageTitle = document.title;
    if (pageTitle.includes('Your replies') || pageTitle.includes('Replies')) {
      // If we're in the replies section, be more cautious
      return true;
    }
    
    // 7. Check if this tweet is a reply to someone we've already replied to
    const username = extractUsername(article);
    if (username && repliedToUsers.has(username)) {
      return true;
    }
    
    // 8. NEW: Check if this tweet is from a blocked username
    if (username && BLOCKED_USERNAMES.includes(username)) {
      return true; // Treat blocked users' tweets as if they were our own (to skip them)
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if own comment:', error);
    return false; // If in doubt, assume it's not our comment
  }
}

// Initialize the extension when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}