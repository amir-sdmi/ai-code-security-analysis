/**
 * YouTube Chat Extension - Simplified Content Script
 * This version doesn't use ES6 modules for easier testing
 */

// Inline the essential functions from utils.js
function extractVideoIdFromPage() {
  // Try URL first
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  if (videoId) return videoId;
  
  // Try to find embedded video
  const iframe = document.querySelector('iframe[src*="youtube.com/embed/"]');
  if (iframe) {
    const match = iframe.src.match(/embed\/([0-9A-Za-z_-]{11})/);
    if (match) return match[1];
  }
  
  return null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Main extension class
class YouTubeChatExtension {
  constructor() {
    this.currentVideoId = null;
    this.chatUI = null;
    this.transcript = null;
    this.isInitialized = false;
    this.transcriptFetcher = new TranscriptFetcher();
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 messages
    
    // Fullscreen state tracking
    this.wasVisibleBeforeFullscreen = false;
    this.wasMinimizedBeforeFullscreen = false;
    this.isInFullscreen = false;
    
    this.init();
  }

  async init() {
    console.log('YouTube Chat Extension initializing...');
    console.log('Version: 1.0.0 with comprehensive fixes');
    
    // Create chat UI
    this.createChatUI();
    
    // Set up video detection
    this.detectVideo();
    this.observeVideoChanges();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleChat') {
        this.toggleChat();
      } else if (request.action === 'openChat') {
        this.showChat();
        // If chat was previously closed, reinitialize if needed
        if (!this.currentVideoId) {
          this.detectVideo();
        }
      }
    });
    
    // Set up fullscreen detection
    this.setupFullscreenDetection();
    
    this.isInitialized = true;
  }

  createChatUI() {
    // Create main container
    const container = document.createElement('div');
    container.className = 'youtube-chat-extension';
    container.innerHTML = `
      <div class="chat-header">
        <span class="chat-title">AI Chat Assistant</span>
        <div class="chat-controls">
          <button class="chat-btn history" title="Chat History">📚</button>
          <button class="chat-btn export-chat" title="Export Chat">📥</button>
          <button class="chat-btn new-chat" title="New Chat">🔄</button>
          <button class="chat-btn minimize" title="Minimize">▬</button>
          <button class="chat-btn close" title="Close">×</button>
        </div>
      </div>
      <div class="chat-messages">
        <div class="welcome-message">
          <h3>Welcome to YouTube Chat Assistant!</h3>
          <p>Powered by Gemini 2.5 Flash Preview</p>
          <p class="loading-message">Loading video transcript...</p>
        </div>
      </div>
      <div class="chat-input-container">
        <button class="chat-clear-btn" title="Clear chat">🗑️</button>
        <input type="text" class="chat-input" placeholder="Ask about the video..." disabled />
        <button class="chat-send" disabled>Send</button>
      </div>
      <div class="chat-history-panel" style="left: -320px;">
        <div class="history-header">
          <h3>Chat History</h3>
          <button class="history-close" type="button">×</button>
        </div>
        <div class="history-search">
          <input type="text" placeholder="Search conversations..." class="history-search-input" />
        </div>
        <div class="history-list">
          <div class="history-empty">
            <p>No saved conversations yet</p>
            <p class="history-hint">Your chat history will appear here</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.chatUI = container;
    
    // Double-ensure history panel is hidden on initialization
    const historyPanel = container.querySelector('.chat-history-panel');
    if (historyPanel) {
      historyPanel.classList.remove('visible');
      // Force the initial hidden state with important
      historyPanel.style.setProperty('left', '-320px', 'important');
    }
    
    // Set up basic event listeners with null checks
    const closeBtn = container.querySelector('.close');
    const minimizeBtn = container.querySelector('.minimize');
    const newChatBtn = container.querySelector('.new-chat');
    const historyBtn = container.querySelector('.history');
    const exportBtn = container.querySelector('.export-chat');
    const historyCloseBtn = container.querySelector('.history-close');
    const historySearchInput = container.querySelector('.history-search-input');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.hideChat());
    if (minimizeBtn) minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    if (newChatBtn) newChatBtn.addEventListener('click', () => this.startNewChat());
    if (historyBtn) historyBtn.addEventListener('click', () => this.toggleHistory());
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportChat());
    if (historyCloseBtn) historyCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideHistory();
    });
    if (historySearchInput) historySearchInput.addEventListener('input', (e) => this.filterHistory(e.target.value));
    
    const input = container.querySelector('.chat-input');
    const sendBtn = container.querySelector('.chat-send');
    const clearBtn = container.querySelector('.chat-clear-btn');
    
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
    clearBtn.addEventListener('click', () => this.clearCurrentChat());
  }

  detectVideo() {
    const videoId = extractVideoIdFromPage();
    
    if (videoId && videoId !== this.currentVideoId) {
      console.log('New video detected:', videoId);
      this.currentVideoId = videoId;
      // Add a small delay to ensure YouTube has started loading
      setTimeout(() => {
        this.loadVideoChat(videoId);
      }, 500);
    } else if (!videoId && this.currentVideoId) {
      console.log('No video detected, hiding chat');
      this.hideChat();
      this.currentVideoId = null;
    }
  }

  observeVideoChanges() {
    // YouTube is a SPA, so we need to watch for URL changes
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed, checking for video');
        debounce(() => this.detectVideo(), 500)();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  async loadVideoChat(videoId) {
    this.showChat();
    
    try {
      const messagesContainer = this.chatUI.querySelector('.chat-messages');
      
      // Check if API key is configured
      const response = await chrome.runtime.sendMessage({
        action: 'checkApiKey'
      });
      
      if (response && response.hasApiKey) {
        // Show loading message
        messagesContainer.innerHTML = `
          <div class="welcome-message">
            <h3>Loading video transcript...</h3>
            <p>This may take a few seconds.</p>
          </div>
        `;
        
        // Wait for page to be visible and YouTube player to be ready
        await this.waitForPageReady();
        
        // Show loading message with progress
        messagesContainer.innerHTML = `
          <div class="welcome-message">
            <h3>Loading video transcript...</h3>
            <p>Checking transcript availability...</p>
          </div>
        `;
        
        // Try to fetch transcript with retry for background tabs
        let transcriptAttempts = 0;
        const maxTranscriptAttempts = 3;
        let transcriptLoaded = false;
        
        while (transcriptAttempts < maxTranscriptAttempts && !transcriptLoaded) {
          try {
            // Update loading message
            if (transcriptAttempts > 0) {
              messagesContainer.innerHTML = `
                <div class="welcome-message">
                  <h3>Loading video transcript...</h3>
                  <p>Attempt ${transcriptAttempts + 1} of ${maxTranscriptAttempts}...</p>
                </div>
              `;
            }
            
            this.transcript = await this.transcriptFetcher.fetchTranscript(videoId);
            
            if (this.transcript && this.transcript.fullText) {
              transcriptLoaded = true;
              break; // Success, exit loop
            }
          } catch (error) {
            console.log(`Transcript fetch attempt ${transcriptAttempts + 1} failed:`, error);
          }
          
          transcriptAttempts++;
          if (transcriptAttempts < maxTranscriptAttempts && !transcriptLoaded) {
            console.log('Retrying transcript fetch in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        if (this.transcript && this.transcript.fullText) {
          // Success! Show ready message
          this.enableChat();
          messagesContainer.innerHTML = `
            <div class="welcome-message">
              <h3>Ready to chat!</h3>
              <p>✅ Transcript loaded (${this.transcript.segments.length} segments)</p>
              <p>Ask me anything about this video.</p>
            </div>
          `;
          console.log('Transcript loaded successfully:', this.transcript.segments.length, 'segments');
          
          // Load previous conversation if exists
          await this.loadConversation();
        } else {
          // No transcript available
          this.enableChat();
          messagesContainer.innerHTML = `
            <div class="welcome-message">
              <h3>Ready to chat!</h3>
              <p>⚠️ Couldn't load transcript, but I can still help!</p>
              <button class="retry-transcript-btn" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: var(--accent-blue);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              ">Retry Loading Transcript</button>
            </div>
          `;
          
          // Add retry button listener
          const retryBtn = messagesContainer.querySelector('.retry-transcript-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
              messagesContainer.innerHTML = `
                <div class="welcome-message">
                  <h3>Retrying transcript load...</h3>
                  <p>Please wait a moment.</p>
                </div>
              `;
              
              // Force a longer wait for YouTube to fully load
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              try {
                this.transcript = await this.transcriptFetcher.fetchTranscript(videoId);
                
                if (this.transcript && this.transcript.fullText) {
                  messagesContainer.innerHTML = `
                    <div class="welcome-message">
                      <h3>Success!</h3>
                      <p>✅ Transcript loaded (${this.transcript.segments.length} segments)</p>
                      <p>Ask me anything about this video.</p>
                    </div>
                  `;
                  console.log('Transcript loaded on retry:', this.transcript.segments.length, 'segments');
                } else {
                  messagesContainer.innerHTML = `
                    <div class="welcome-message">
                      <h3>Ready to chat!</h3>
                      <p>⚠️ Still couldn't load transcript, but I can help based on the video context!</p>
                    </div>
                  `;
                }
              } catch (error) {
                console.error('Retry failed:', error);
                messagesContainer.innerHTML = `
                  <div class="welcome-message">
                    <h3>Ready to chat!</h3>
                    <p>⚠️ Transcript unavailable, but I can still help!</p>
                  </div>
                `;
              }
            });
          }
          
          // Load previous conversation if exists
          await this.loadConversation();
        }
      } else {
        // No API key
        messagesContainer.innerHTML = `
          <div class="welcome-message">
            <h3>Video Detected!</h3>
            <p>Video ID: ${videoId}</p>
            <p>To start chatting:</p>
            <ol>
              <li>Click the extension icon in your toolbar</li>
              <li>Add your Gemini API key</li>
              <li>Reload this page</li>
            </ol>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Error loading video chat:', error);
    }
  }

  enableChat() {
    const input = this.chatUI.querySelector('.chat-input');
    const sendBtn = this.chatUI.querySelector('.chat-send');
    input.disabled = false;
    sendBtn.disabled = false;
  }

  async sendMessage() {
    const input = this.chatUI.querySelector('.chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: message });
    
    // Show typing indicator
    this.addMessage('assistant', '...thinking...', true);
    
    try {
      // Get video title and description for context
      const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || 
                       document.querySelector('#title h1')?.textContent || 
                       'Unknown video';
      
      // Build conversation context
      const recentHistory = this.conversationHistory.slice(-6); // Last 3 exchanges
      let conversationContext = recentHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Create enhanced prompt with conversation history
      let enhancedPrompt;
      
      if (this.transcript && this.transcript.fullText) {
        // We have the transcript!
        // Use transcript with timestamps if available, otherwise use regular transcript
        const transcriptToUse = this.transcript.fullTextWithTimestamps || this.transcript.fullText;
        const transcriptPreview = transcriptToUse.substring(0, 400000); // Use up to 400k chars
        
        // If we have segments with timestamps, create a reference
        let timestampInfo = '';
        if (this.transcript.fullTextWithTimestamps) {
          timestampInfo = '\nNote: The transcript includes timestamps in [MM:SS] format. When referencing specific parts of the video, preserve these timestamps so users can click to jump to that point.';
        }
        
        enhancedPrompt = `You are a helpful AI assistant for YouTube videos. Your responses should be dynamic and match the user's needs.

Video Title: "${videoTitle}"

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}

Current question: ${message}

Video Transcript (with timestamps):
${transcriptPreview}

CRITICAL OUTPUT LIMIT:
You have a MAXIMUM of 3000 tokens to complete your response. You MUST complete your answer within this limit. If your response is getting long:
- Prioritize the most important information
- Use bullet points instead of paragraphs
- Summarize rather than elaborate
- Complete your thoughts before the limit

RESPONSE LENGTH GUIDELINES:
- Simple factual questions (what, when, who): 1-3 sentences
- Explanation requests: 1-2 paragraphs  
- Summary/overview requests: 2-3 paragraphs with structure
- Detailed analysis or lists: Use structured format with headings
- "Everything" or comprehensive requests: Provide organized overview, not exhaustive details

DYNAMIC FORMATTING:
- For SHORT answers (1-3 sentences): Just answer directly, no formatting needed
- For MEDIUM answers (1-2 paragraphs): Use **bold** for key terms, include relevant timestamps
- For LONG answers (lists, analysis): 
  • Use ## headings for main topics
  • Bullet points for details
  • Include timestamps naturally
  • Add structure only when it improves clarity

QUALITY PRINCIPLES:
1. Match response length to question complexity
2. Be concise - don't pad responses
3. For simple questions, give simple answers
4. For complex questions, organize information clearly
5. Use formatting to enhance readability, not to fill space
6. End with follow-up only when genuinely helpful
7. ALWAYS complete your response within 3000 tokens

Remember: A great response answers the question perfectly, whether that takes one sentence or several paragraphs. But it MUST be complete within the token limit.${timestampInfo}`;
      } else {
        // No transcript available
        enhancedPrompt = `You are a helpful AI assistant for YouTube videos. Be conversational and concise.

Video Title: "${videoTitle}"
Video URL: ${window.location.href}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}

Current question: ${message}

Note: I don't have access to the transcript, but I'll help based on the title and context.`;
      }
      
      // Send to background for processing
      const response = await chrome.runtime.sendMessage({
        action: 'generateResponse',
        prompt: enhancedPrompt,
        context: {
          videoId: this.currentVideoId,
          title: videoTitle,
          url: window.location.href,
          hasTranscript: !!this.transcript
        }
      });
      
      // Remove typing indicator
      const messages = this.chatUI.querySelectorAll('.chat-message');
      messages[messages.length - 1].remove();
      
      if (response.success) {
        // Log the full response for debugging
        console.log('Full AI response length:', response.response?.length || 0);
        
        // Ensure we have the full response
        let fullResponse = response.response || 'Sorry, I received an empty response.';
        
        // Check if response appears to be cut off
        const isCutOff = this.checkIfResponseCutOff(fullResponse);
        if (isCutOff) {
          fullResponse += '\n\n*[Response was truncated. Try asking for specific sections or a more focused question.]*';
        }
        
        this.addMessage('assistant', fullResponse);
        // Add to conversation history
        this.conversationHistory.push({ role: 'assistant', content: fullResponse });
        
        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
          this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        // Save conversation for this video
        this.saveConversation();
      } else {
        this.addMessage('assistant', `Error: ${response.error || 'Unknown error occurred'}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      this.addMessage('assistant', 'Sorry, an error occurred. Please try again.');
    }
  }

  addMessage(role, content, isTyping = false) {
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    
    // Remove welcome message if present
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    
    // Ensure content is a string and not truncated
    let formattedContent = String(content || '');
    
    if (role === 'assistant' && !isTyping) {
      // IMPORTANT: Process timestamps FIRST before any markdown formatting
      // This ensures timestamps in lists are properly converted to links
      formattedContent = this.processTimestamps(formattedContent);
      
      // Enhanced markdown support with better formatting
      // First, handle headings
      formattedContent = formattedContent
        // Handle h2 headings
        .replace(/^## (.+)$/gm, '<h2 class="chat-heading">$1</h2>')
        // Handle h3 headings
        .replace(/^### (.+)$/gm, '<h3 class="chat-subheading">$1</h3>')
        // Handle bold text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Handle italic text  
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Handle inline code
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        // Handle bullet points with better formatting
        .replace(/^[\*\-•]\s+(.+)$/gm, '<li>$1</li>')
        // Handle indented bullet points (sub-items)
        .replace(/^  [\*\-•]\s+(.+)$/gm, '<li class="sub-item">$1</li>')
        // Handle numbered lists
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');
      
      // Process lists - wrap consecutive li elements
      formattedContent = formattedContent.replace(/(<li(?:\s+class="[^"]+")?>.*<\/li>\s*)+/g, (match) => {
        // Check if it contains numbered items
        if (match.includes('class="numbered"')) {
          return '<ol class="chat-list">' + match + '</ol>';
        }
        return '<ul class="chat-list">' + match + '</ul>';
      });
      
      // Handle paragraphs - but preserve headings and lists
      const lines = formattedContent.split('\n');
      const processedLines = [];
      let inList = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Check if line is already formatted (heading, list, etc.)
        if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('</')) {
          processedLines.push(line);
          inList = line.startsWith('<ul') || line.startsWith('<ol');
        } else if (line.startsWith('<li')) {
          processedLines.push(line);
        } else if (!inList) {
          // Regular text becomes a paragraph
          processedLines.push(`<p>${line}</p>`);
        }
      }
      
      formattedContent = processedLines.join('\n');
    }
    
    // Create message content div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formattedContent;
    
    // Add click handlers for timestamp links
    if (role === 'assistant') {
      contentDiv.querySelectorAll('.timestamp-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const seconds = parseInt(link.dataset.seconds);
          this.seekToTimestamp(seconds);
        });
      });
    }
    
    messageEl.appendChild(contentDiv);
    
    // Add copy button for assistant messages
    if (role === 'assistant' && !isTyping) {
      const copyButton = document.createElement('button');
      copyButton.className = 'message-copy-btn';
      copyButton.innerHTML = '📋';
      copyButton.title = 'Copy to clipboard';
      
      copyButton.addEventListener('click', () => {
        // Get plain text content without HTML
        const textContent = contentDiv.innerText || contentDiv.textContent;
        this.copyToClipboard(textContent);
        
        // Visual feedback
        copyButton.innerHTML = '✅';
        copyButton.title = 'Copied!';
        setTimeout(() => {
          copyButton.innerHTML = '📋';
          copyButton.title = 'Copy to clipboard';
        }, 2000);
      });
      
      messageEl.appendChild(copyButton);
    }
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async saveConversation() {
    if (!this.currentVideoId || this.conversationHistory.length === 0) {
      console.log('No conversation to save');
      return;
    }
    
    try {
      const chatData = {
        videoId: this.currentVideoId,
        title: this.getVideoTitle(),
        messages: this.conversationHistory,
        transcriptAvailable: !!this.transcript,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving conversation:', chatData.title, 'with', chatData.messages.length, 'messages');
      
      const response = await chrome.runtime.sendMessage({
        action: 'saveChat',
        videoId: this.currentVideoId,
        chatData: chatData
      });
      
      if (response && response.success) {
        console.log('Conversation saved successfully');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  async loadConversation() {
    if (!this.currentVideoId) return;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'loadChat',
        videoId: this.currentVideoId
      });
      
      if (response.success && response.chatData) {
        this.conversationHistory = response.chatData.messages || [];
        
        // Display previous messages
        const messagesContainer = this.chatUI.querySelector('.chat-messages');
        messagesContainer.innerHTML = ''; // Clear current messages
        
        // Add a separator for previous session
        if (this.conversationHistory.length > 0) {
          const separator = document.createElement('div');
          separator.className = 'session-separator';
          separator.innerHTML = '<span>Previous conversation</span>';
          messagesContainer.appendChild(separator);
          
          // Re-add all messages
          this.conversationHistory.forEach(msg => {
            this.addMessage(msg.role, msg.content);
          });
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  showChat() {
    this.chatUI.classList.add('visible');
  }

  hideChat() {
    this.chatUI.classList.remove('visible');
  }

  toggleChat() {
    this.chatUI.classList.toggle('visible');
  }

  toggleMinimize() {
    this.chatUI.classList.toggle('minimized');
    const minimizeBtn = this.chatUI.querySelector('.minimize');
    const isMinimized = this.chatUI.classList.contains('minimized');
    
    // Update button appearance
    minimizeBtn.innerHTML = isMinimized ? '□' : '▬';
    minimizeBtn.title = isMinimized ? 'Maximize' : 'Minimize';
  }

  clearCurrentChat() {
    // Simple clear without saving
    if (this.conversationHistory.length === 0) return;
    
    const confirmClear = confirm('Clear the current chat? This cannot be undone.');
    if (!confirmClear) return;
    
    // Clear conversation history
    this.conversationHistory = [];
    
    // Clear the chat UI but keep welcome message
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h3>Chat cleared!</h3>
        <p>${this.transcript ? `✅ Transcript loaded (${this.transcript.segments.length} segments)` : '⚠️ No transcript available'}</p>
        <p>Ask me anything about this video.</p>
      </div>
    `;
  }

  async toggleHistory() {
    const historyPanel = this.chatUI.querySelector('.chat-history-panel');
    const isVisible = historyPanel.classList.contains('visible');
    
    if (!isVisible) {
      // Load history before showing
      await this.loadChatHistory();
      historyPanel.classList.add('visible');
      // Also set inline styles to override any !important rules
      historyPanel.style.setProperty('left', '0', 'important');
      historyPanel.style.setProperty('visibility', 'visible', 'important');
    } else {
      historyPanel.classList.remove('visible');
      historyPanel.style.setProperty('left', '-320px', 'important');
      historyPanel.style.setProperty('visibility', 'hidden', 'important');
    }
  }

  hideHistory() {
    const historyPanel = this.chatUI.querySelector('.chat-history-panel');
    if (historyPanel) {
      historyPanel.classList.remove('visible');
      historyPanel.style.setProperty('left', '-320px', 'important');
      historyPanel.style.setProperty('visibility', 'hidden', 'important');
    }
  }

  async loadChatHistory() {
    try {
      // Get all stored chats
      const allData = await chrome.storage.local.get(null);
      const chats = [];
      
      // Filter and format chat data
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('chat_') && value.messages && value.messages.length > 0) {
          chats.push({
            videoId: value.videoId,
            title: value.title || 'Unknown Video',
            lastUpdated: value.lastUpdated,
            messageCount: value.messages.length,
            preview: value.messages[0].content, // First user message as preview
            data: value
          });
        }
      }
      
      // Sort by last updated
      chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      
      // Display in UI
      this.displayChatHistory(chats);
      
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  displayChatHistory(chats) {
    const historyList = this.chatUI.querySelector('.history-list');
    
    if (chats.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <p>No saved conversations yet</p>
          <p class="history-hint">Your chat history will appear here</p>
        </div>
      `;
      return;
    }
    
    // Create history items
    historyList.innerHTML = chats.map(chat => {
      const date = new Date(chat.lastUpdated);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Extract channel name from title if possible
      const titleParts = chat.title.split(' - ');
      const videoTitle = titleParts[0] || chat.title;
      const channelName = titleParts[1] || '';
      
      // Check if this is the current video
      const isCurrent = chat.videoId === this.currentVideoId;
      
      return `
        <div class="history-item ${isCurrent ? 'current' : ''}" data-video-id="${chat.videoId}">
          <div class="history-item-header">
            <div class="history-item-title">${this.escapeHtml(videoTitle)}</div>
            ${channelName ? `<div class="history-item-channel">${this.escapeHtml(channelName)}</div>` : ''}
          </div>
          <div class="history-item-meta">
            <span class="history-item-date">${dateStr} ${timeStr}</span>
            <span class="history-item-count">${chat.messageCount} messages</span>
          </div>
          <div class="history-item-preview">${this.escapeHtml(chat.preview)}</div>
          <div class="history-item-actions">
            ${isCurrent ? 
              '<span class="history-current-badge">Current</span>' : 
              '<button class="history-load-btn">Load Chat</button>'
            }
            <button class="history-delete-btn" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners to buttons
    historyList.querySelectorAll('.history-load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const videoId = e.target.closest('.history-item').dataset.videoId;
        this.loadHistoricalChat(videoId);
      });
    });
    
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const videoId = e.target.closest('.history-item').dataset.videoId;
        this.deleteHistoricalChat(videoId);
      });
    });
  }

  async loadHistoricalChat(videoId) {
    try {
      // Get the chat data
      const key = `chat_${videoId}`;
      const result = await chrome.storage.local.get(key);
      const chatData = result[key];
      
      if (!chatData) {
        alert('Chat not found');
        return;
      }
      
      // Save current conversation if it has messages
      if (this.conversationHistory.length > 0) {
        await this.saveConversation();
      }
      
      // Load the historical chat
      this.conversationHistory = chatData.messages || [];
      
      // Clear and display messages
      const messagesContainer = this.chatUI.querySelector('.chat-messages');
      messagesContainer.innerHTML = '';
      
      // Add header showing this is from a different video
      if (videoId !== this.currentVideoId) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-info';
        infoDiv.innerHTML = `
          <p>Loaded conversation from: <strong>${this.escapeHtml(chatData.title)}</strong></p>
          <p class="history-warning">Note: This is from a different video. Responses may not match the current video's content.</p>
        `;
        messagesContainer.appendChild(infoDiv);
      }
      
      // Display all messages
      this.conversationHistory.forEach(msg => {
        this.addMessage(msg.role, msg.content);
      });
      
      // Close history panel
      this.hideHistory();
      
    } catch (error) {
      console.error('Error loading historical chat:', error);
      alert('Failed to load chat history');
    }
  }

  async deleteHistoricalChat(videoId) {
    const confirmDelete = confirm('Delete this conversation? This cannot be undone.');
    if (!confirmDelete) return;
    
    try {
      const key = `chat_${videoId}`;
      await chrome.storage.local.remove(key);
      
      // If deleting current video's chat, clear the conversation
      if (videoId === this.currentVideoId) {
        this.conversationHistory = [];
      }
      
      // Reload history display
      await this.loadChatHistory();
      
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  filterHistory(searchTerm) {
    const historyItems = this.chatUI.querySelectorAll('.history-item');
    const term = searchTerm.toLowerCase();
    
    historyItems.forEach(item => {
      const title = item.querySelector('.history-item-title').textContent.toLowerCase();
      const channel = item.querySelector('.history-item-channel')?.textContent.toLowerCase() || '';
      const preview = item.querySelector('.history-item-preview').textContent.toLowerCase();
      
      if (title.includes(term) || channel.includes(term) || preview.includes(term)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getVideoTitle() {
    // Get video title
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') || 
                        document.querySelector('#title h1') ||
                        document.querySelector('h1.title');
    const title = titleElement?.textContent?.trim() || 'Unknown Video';
    
    // Get channel name
    const channelElement = document.querySelector('#channel-name a') ||
                          document.querySelector('#owner-name a') ||
                          document.querySelector('.ytd-channel-name a');
    const channel = channelElement?.textContent?.trim() || '';
    
    // Combine with separator if channel exists
    return channel ? `${title} - ${channel}` : title;
  }

  async startNewChat() {
    // Confirm with user
    if (this.conversationHistory.length > 0) {
      const confirmClear = confirm('Start a new chat? This will save the current conversation to history.');
      if (!confirmClear) return;
      
      // IMPORTANT: Save current conversation BEFORE clearing
      await this.saveConversation();
    }
    
    // Clear current conversation
    this.conversationHistory = [];
    
    // Clear the chat UI
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    messagesContainer.innerHTML = '';
    
    // Show welcome message with transcript status
    if (this.transcript && this.transcript.fullText) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <h3>New chat started!</h3>
          <p>✅ Transcript loaded (${this.transcript.segments.length} segments)</p>
          <p>Ask me anything about this video.</p>
          <p class="history-hint">Previous chat saved to history 📚</p>
        </div>
      `;
    } else {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <h3>New chat started!</h3>
          <p>⚠️ No transcript available, but I can still help based on the video title and context.</p>
          <p class="history-hint">Previous chat saved to history 📚</p>
        </div>
      `;
    }
    
    // Enable input
    this.enableChat();
    
    // If history panel is open, refresh it
    const historyPanel = this.chatUI.querySelector('.chat-history-panel');
    if (historyPanel.classList.contains('visible')) {
      await this.loadChatHistory();
    }
  }

  processTimestamps(content) {
    // Process all timestamp formats and convert to clickable links
    let processedContent = content;
    
    // Pattern for [HH:MM:SS] or [MM:SS] in square brackets
    processedContent = processedContent.replace(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g, (match, h, m, s) => {
      const hours = s ? parseInt(h) : 0;
      const minutes = s ? parseInt(m) : parseInt(h);
      const seconds = s ? parseInt(s) : parseInt(m);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const displayText = s ? `${h}:${m}:${s}` : `${h}:${m}`;
      return `<a href="#" class="timestamp-link" data-seconds="${totalSeconds}" title="Click to jump to ${displayText}">[${displayText}]</a>`;
    });
    
    // Pattern for (HH:MM:SS) or (MM:SS) in parentheses
    processedContent = processedContent.replace(/\((\d{1,2}):(\d{2})(?::(\d{2}))?\)/g, (match, h, m, s) => {
      const hours = s ? parseInt(h) : 0;
      const minutes = s ? parseInt(m) : parseInt(h);
      const seconds = s ? parseInt(s) : parseInt(m);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const displayText = s ? `${h}:${m}:${s}` : `${h}:${m}`;
      return `<a href="#" class="timestamp-link" data-seconds="${totalSeconds}" title="Click to jump to ${displayText}">(${displayText})</a>`;
    });
    
    // Pattern for standalone HH:MM:SS or MM:SS with word boundaries
    // This catches timestamps at the beginning of lines or surrounded by spaces
    processedContent = processedContent.replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match, h, m, s, offset, string) => {
      // Check if this timestamp is already inside a link tag
      const beforeText = string.substring(Math.max(0, offset - 20), offset);
      const afterText = string.substring(offset + match.length, Math.min(string.length, offset + match.length + 20));
      
      // Skip if already in a link or if it's part of a URL
      if (beforeText.includes('data-seconds=') || beforeText.includes('href=') || afterText.includes('</a>')) {
        return match;
      }
      
      const hours = s ? parseInt(h) : 0;
      const minutes = s ? parseInt(m) : parseInt(h);
      const seconds = s ? parseInt(s) : parseInt(m);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const displayText = s ? `${h}:${m}:${s}` : `${h}:${m}`;
      return `<a href="#" class="timestamp-link" data-seconds="${totalSeconds}" title="Click to jump to ${displayText}">[${displayText}]</a>`;
    });
    
    // Pattern for "at HH:MM:SS" or "at MM:SS"
    processedContent = processedContent.replace(/\bat\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match, h, m, s) => {
      const hours = s ? parseInt(h) : 0;
      const minutes = s ? parseInt(m) : parseInt(h);
      const seconds = s ? parseInt(s) : parseInt(m);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const displayText = s ? `${h}:${m}:${s}` : `${h}:${m}`;
      return `at <a href="#" class="timestamp-link" data-seconds="${totalSeconds}" title="Click to jump to ${displayText}">[${displayText}]</a>`;
    });
    
    return processedContent;
  }

  seekToTimestamp(seconds) {
    // Find the YouTube video player
    const player = document.querySelector('video.html5-main-video') || 
                  document.querySelector('video');
    
    if (player) {
      player.currentTime = seconds;
      
      // If video is paused, optionally play it
      if (player.paused) {
        player.play().catch(err => {
          console.log('Auto-play prevented:', err);
          // Just seek without playing if autoplay is blocked
        });
      }
      
      // Show visual feedback
      this.showTimestampFeedback(seconds);
    } else {
      console.error('YouTube player not found');
      alert('Could not find video player. Please make sure the video is loaded.');
    }
  }

  showTimestampFeedback(seconds) {
    // Convert seconds to readable format
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'timestamp-feedback';
    feedback.textContent = `Jumped to ${timeStr}`;
    
    // Add to chat UI
    this.chatUI.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  checkIfResponseCutOff(response) {
    // Check for common indicators of cut-off responses
    const trimmedResponse = response.trim();
    
    // Check if ends mid-sentence (no proper punctuation)
    const lastChar = trimmedResponse[trimmedResponse.length - 1];
    const endsWithPunctuation = ['.', '!', '?', ')', ']', '"'].includes(lastChar);
    
    // Check if ends mid-word (last word contains only letters, no punctuation)
    const lastWord = trimmedResponse.split(/\s+/).pop();
    const lastWordIncomplete = /^[a-zA-Z]+$/.test(lastWord) && lastWord.length > 2;
    
    // Check for incomplete markdown structures
    const openBullets = (trimmedResponse.match(/^[\*\-•]\s+/gm) || []).length;
    const hasIncompleteBullet = trimmedResponse.endsWith('•') || trimmedResponse.endsWith('-') || trimmedResponse.endsWith('*');
    
    // Check for incomplete headings
    const hasIncompleteHeading = trimmedResponse.endsWith('##') || trimmedResponse.endsWith('###');
    
    // Check if last line appears to be starting a new section
    const lines = trimmedResponse.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    const isStartingNewSection = lastLine.match(/^(##|###|\*|-|•|\d+\.)\s*\w{0,10}$/);
    
    return !endsWithPunctuation || lastWordIncomplete || hasIncompleteBullet || hasIncompleteHeading || isStartingNewSection;
  }

  async copyToClipboard(text) {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  async exportChat() {
    // Check if there's a conversation to export
    if (this.conversationHistory.length === 0) {
      alert('No conversation to export. Start chatting first!');
      return;
    }

    // Create export dialog
    const exportDialog = document.createElement('div');
    exportDialog.className = 'export-dialog-overlay';
    exportDialog.innerHTML = `
      <div class="export-dialog">
        <div class="export-dialog-header">
          <h3>Export Chat</h3>
          <button class="export-dialog-close">×</button>
        </div>
        <div class="export-dialog-content">
          <p>Choose export format:</p>
          <div class="export-options">
            <button class="export-option" data-format="markdown">
              <span class="export-icon">📝</span>
              <span class="export-label">Markdown</span>
              <span class="export-desc">Best for documentation</span>
            </button>
            <button class="export-option" data-format="json">
              <span class="export-icon">📊</span>
              <span class="export-label">JSON</span>
              <span class="export-desc">For developers & data analysis</span>
            </button>
            <button class="export-option" data-format="text">
              <span class="export-icon">📄</span>
              <span class="export-label">Plain Text</span>
              <span class="export-desc">Simple, readable format</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(exportDialog);

    // Add event listeners
    exportDialog.querySelector('.export-dialog-close').addEventListener('click', () => {
      exportDialog.remove();
    });

    exportDialog.addEventListener('click', (e) => {
      if (e.target === exportDialog) {
        exportDialog.remove();
      }
    });

    // Handle export format selection
    exportDialog.querySelectorAll('.export-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        this.performExport(format);
        exportDialog.remove();
      });
    });
  }

  async performExport(format) {
    const videoTitle = this.getVideoTitle();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'markdown':
        content = this.generateMarkdownExport();
        filename = `youtube-chat_${timestamp}.md`;
        mimeType = 'text/markdown';
        break;
      
      case 'json':
        content = this.generateJSONExport();
        filename = `youtube-chat_${timestamp}.json`;
        mimeType = 'application/json';
        break;
      
      case 'text':
        content = this.generateTextExport();
        filename = `youtube-chat_${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    this.showExportSuccess(format);
  }

  generateMarkdownExport() {
    const videoTitle = this.getVideoTitle();
    const videoUrl = window.location.href;
    const date = new Date().toLocaleString();
    
    let markdown = `# YouTube Chat Export\n\n`;
    markdown += `**Video:** ${videoTitle}\n`;
    markdown += `**URL:** ${videoUrl}\n`;
    markdown += `**Exported:** ${date}\n`;
    markdown += `**Powered by:** YouTube Chat Extension (Gemini 2.5 Flash Preview)\n\n`;
    markdown += `---\n\n`;
    markdown += `## Conversation\n\n`;

    this.conversationHistory.forEach((msg, index) => {
      if (msg.role === 'user') {
        markdown += `### 👤 User:\n${msg.content}\n\n`;
      } else {
        markdown += `### 🤖 Assistant:\n${msg.content}\n\n`;
      }
    });

    return markdown;
  }

  generateJSONExport() {
    const videoTitle = this.getVideoTitle();
    const videoUrl = window.location.href;
    const videoId = this.currentVideoId;
    
    const exportData = {
      metadata: {
        video: {
          id: videoId,
          title: videoTitle,
          url: videoUrl
        },
        exportDate: new Date().toISOString(),
        conversationLength: this.conversationHistory.length,
        extension: {
          name: 'YouTube Chat Extension',
          model: 'Gemini 2.5 Flash Preview'
        }
      },
      conversation: this.conversationHistory.map((msg, index) => ({
        index: index,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || null
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  generateTextExport() {
    const videoTitle = this.getVideoTitle();
    const videoUrl = window.location.href;
    const date = new Date().toLocaleString();
    
    let text = `YOUTUBE CHAT EXPORT\n`;
    text += `==================\n\n`;
    text += `Video: ${videoTitle}\n`;
    text += `URL: ${videoUrl}\n`;
    text += `Date: ${date}\n\n`;
    text += `CONVERSATION\n`;
    text += `------------\n\n`;

    this.conversationHistory.forEach((msg, index) => {
      if (msg.role === 'user') {
        text += `USER:\n${msg.content}\n\n`;
      } else {
        text += `ASSISTANT:\n${msg.content}\n\n`;
      }
      text += `---\n\n`;
    });

    return text;
  }

  showExportSuccess(format) {
    const formatLabels = {
      markdown: 'Markdown',
      json: 'JSON',
      text: 'Plain Text'
    };

    const successMsg = document.createElement('div');
    successMsg.className = 'export-success';
    successMsg.innerHTML = `
      <span class="export-success-icon">✅</span>
      <span class="export-success-text">Chat exported as ${formatLabels[format]}</span>
    `;
    
    this.chatUI.appendChild(successMsg);
    
    setTimeout(() => {
      successMsg.classList.add('fade-out');
      setTimeout(() => successMsg.remove(), 300);
    }, 2000);
  }

  // Fullscreen detection methods
  async waitForPageReady() {
    // Check if page is visible
    if (document.hidden) {
      console.log('Page is hidden, waiting for visibility...');
      
      // Wait for page to become visible
      await new Promise(resolve => {
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            resolve();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also resolve if page becomes visible within 10 seconds
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          resolve();
        }, 10000);
      });
    }
    
    console.log('Waiting for YouTube page to be ready...');
    
    // Wait for YouTube player and critical elements to be ready
    let attempts = 0;
    const maxAttempts = 30; // Increased attempts
    
    while (attempts < maxAttempts) {
      const player = document.querySelector('.html5-video-player');
      const videoElement = document.querySelector('video');
      const primaryInfo = document.querySelector('#primary-inner');
      const videoTitle = document.querySelector('h1.ytd-watch-metadata');
      
      // Check if critical elements are ready
      if (player && videoElement && primaryInfo && videoTitle) {
        // Also check if video has loaded some data
        if (videoElement.readyState >= 2 || videoElement.duration > 0) {
          console.log('YouTube page is ready');
          break;
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Wait a bit more to ensure transcript button is available
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if we need to wait for transcript panel to be available
    const transcriptButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Show transcript') || btn.textContent.includes('Transcript')
    );
    
    if (!transcriptButton) {
      console.log('Transcript button not found yet, waiting more...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  setupFullscreenDetection() {
    console.log('Setting up fullscreen detection...');
    
    // Standard fullscreen API
    document.addEventListener('fullscreenchange', () => {
      console.log('Standard fullscreen change detected');
      this.handleFullscreenChange();
    });
    document.addEventListener('webkitfullscreenchange', () => {
      console.log('Webkit fullscreen change detected');
      this.handleFullscreenChange();
    });
    
    // YouTube-specific fullscreen detection
    // YouTube uses different methods for fullscreen, we need to catch them all
    const checkYouTubeFullscreen = () => {
      const player = document.querySelector('.html5-video-player');
      const ytdApp = document.querySelector('ytd-app');
      
      // Check multiple indicators of fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        (player && player.classList.contains('ytp-fullscreen')) ||
        (ytdApp && ytdApp.hasAttribute('fullscreen')) ||
        document.querySelector('.ytp-fullscreen-button[aria-label*="Exit full screen"]')
      );
      
      // Track state to detect changes
      if (this.lastFullscreenState !== isFullscreen) {
        console.log('YouTube fullscreen state changed:', isFullscreen);
        this.lastFullscreenState = isFullscreen;
        this.handleYouTubeFullscreen(isFullscreen);
      }
    };
    
    // Set up mutation observer for YouTube player
    const setupPlayerObserver = () => {
      const player = document.querySelector('.html5-video-player');
      if (player) {
        console.log('Found YouTube player, setting up observer');
        const observer = new MutationObserver(() => {
          checkYouTubeFullscreen();
        });
        
        observer.observe(player, {
          attributes: true,
          attributeFilter: ['class']
        });
        
        // Also observe the fullscreen button
        const fullscreenBtn = player.querySelector('.ytp-fullscreen-button');
        if (fullscreenBtn) {
          fullscreenBtn.addEventListener('click', () => {
            console.log('Fullscreen button clicked');
            setTimeout(checkYouTubeFullscreen, 100);
          });
        }
      } else {
        // Retry if player not found yet
        setTimeout(setupPlayerObserver, 1000);
      }
    };
    
    setupPlayerObserver();
    
    // Also observe ytd-app for fullscreen attribute
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
      const observer = new MutationObserver(() => {
        checkYouTubeFullscreen();
      });
      
      observer.observe(ytdApp, {
        attributes: true,
        attributeFilter: ['fullscreen']
      });
    }
    
    // Keyboard shortcut detection (F key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        console.log('F key pressed, checking fullscreen in 100ms');
        setTimeout(checkYouTubeFullscreen, 100);
      }
    });
    
    // Initial state
    this.lastFullscreenState = false;
  }

  handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || 
                          document.webkitFullscreenElement ||
                          document.mozFullScreenElement ||
                          document.msFullscreenElement);
    
    if (isFullscreen) {
      this.hideForFullscreen();
    } else {
      this.restoreFromFullscreen();
    }
  }

  handleYouTubeFullscreen(isFullscreen) {
    if (isFullscreen) {
      this.hideForFullscreen();
    } else {
      this.restoreFromFullscreen();
    }
  }

  hideForFullscreen() {
    // Only save state if we haven't already saved it (prevent overwriting on duplicate events)
    if (!this.isInFullscreen) {
      this.wasVisibleBeforeFullscreen = this.chatUI.classList.contains('visible');
      this.wasMinimizedBeforeFullscreen = this.chatUI.classList.contains('minimized');
      console.log('Saving state before fullscreen. Was visible:', this.wasVisibleBeforeFullscreen);
    }
    
    this.isInFullscreen = true;
    console.log('Hiding for fullscreen. Was visible:', this.wasVisibleBeforeFullscreen);
    
    if (this.chatUI.classList.contains('visible')) {
      this.hideChat();
    }
  }

  restoreFromFullscreen() {
    this.isInFullscreen = false;
    console.log('Restoring from fullscreen. Was visible before:', this.wasVisibleBeforeFullscreen);
    
    // Only restore if it was visible before fullscreen
    if (this.wasVisibleBeforeFullscreen) {
      console.log('Restoring chat visibility');
      this.showChat();
      
      // Restore minimized state if applicable
      if (this.wasMinimizedBeforeFullscreen) {
        console.log('Restoring minimized state');
        this.chatUI.classList.add('minimized');
        // Update button state
        const minimizeBtn = this.chatUI.querySelector('.minimize');
        if (minimizeBtn) {
          minimizeBtn.innerHTML = '□';
          minimizeBtn.title = 'Maximize';
        }
      }
    }
  }
}

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ytChatExtension = new YouTubeChatExtension();
  });
} else {
  window.ytChatExtension = new YouTubeChatExtension();
}