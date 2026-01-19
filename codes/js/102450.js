document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu for responsive design
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('nav ul');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (chatSidebar) {
                chatSidebar.classList.toggle('active');
            }
        });
    }

    // Page transition effect
    window.addEventListener('pageshow', function() {
        document.body.classList.remove('page-transition');
    });
    
    window.addEventListener('beforeunload', function() {
        document.body.classList.add('page-transition');
    });
    
    // Chat functionality
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const newChatBtn = document.getElementById('newChatBtn');
    
    // DeepSeek API configuration
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';  // API endpoint
    const DEEPSEEK_API_KEY = '';  // Replace with your actual API key
    
    // Custom instructions for the AI - only set in code
    const CUSTOM_AI_INSTRUCTIONS = `
        You are Pathfinder, a friendly and patient AI coding tutor designed to help absolute beginners learn how to code.
        Your goal is to teach through explanation, not just provide ready-made code. Unless the user explicitly asks for it, you should avoid giving direct code snippets right away.

        Your teaching style is simple, slow-paced, and uses real-world analogies where possible to make abstract concepts easier to grasp.
        Always start by checking what the user already knows, and adapt your explanations based on their current understanding.

        When users ask for help, focus on the "why" behind each concept.
        If you show code, break it down line by line so they can understand how it works — not just copy it.

        Example:
        If a user asks how to make a button in HTML, explain what the <button> tag is for, and how it works.
        You could say:
        “To create a button in HTML, you use a special tag called <button>. It tells the browser that this is something the user can click. There are other ways to create buttons too — like using <input type='button'> or even an <a> tag styled to look like a button — but <button> is more flexible and commonly used.”
        
        When responding to queries:
        1. Use markdown formatting for code examples (triple backticks with language name)
        2. Use **bold** for important concepts
        3. Use *italics* for emphasis
        4. Structure your response with clear headings and bullet points
        5. If providing code, always explain how it works line by line
        6. Keep your explanations beginner-friendly but technically accurate
        7. When relevant, provide links to official documentation
        
        Your mission is to help users truly understand programming — not just solve problems, but build the confidence to explore, ask questions, and learn how to think like a developer.
    `;
    
    // Initialize chat history from localStorage
    let chats = loadChats();
    let currentChatId = localStorage.getItem('currentChatId');
    
    // Don't create a new chat on page load, just show the empty state if no chat exists
    if (currentChatId && chats[currentChatId]) {
        // Load the current chat
        loadChat(currentChatId);
    } else {
        // Show empty state instead of creating a new chat automatically
        currentChatId = null;
        localStorage.removeItem('currentChatId');
        showEmptyState();
    }
    
    // Check if there's an initial message from the landing page
    const initialMessage = sessionStorage.getItem('initialMessage');
    if (initialMessage) {
        // If there's an initial message, we do need to create a new chat to handle it
        if (!currentChatId) {
            createNewChat();
        }
        
        // Add the user's initial message
        addMessage(initialMessage, 'user');
        
        // Save to chat history
        saveMessage(initialMessage, 'user');
        
        // Clear it from sessionStorage
        sessionStorage.removeItem('initialMessage');
        
        // Get AI response
        getAIResponse(initialMessage);
    }
    
    // Function to load chats from localStorage
    function loadChats() {
        const savedChats = localStorage.getItem('pathfinderChats');
        return savedChats ? JSON.parse(savedChats) : {};
    }
    
    // Function to save chats to localStorage
    function saveChats(chats) {
        localStorage.setItem('pathfinderChats', JSON.stringify(chats));
    }
    
    // Function to show empty state when no chat is selected
    function showEmptyState() {
        chatMessages.innerHTML = '';
        
        const emptyStateDiv = document.createElement('div');
        emptyStateDiv.className = 'empty-chat-state';
        emptyStateDiv.innerHTML = `
            <div class="empty-state-content">
                <img src="logo.png" alt="Pathfinder AI" class="empty-state-logo">
                <h2>Welcome to Pathfinder AI</h2>
                <p>Your coding journey starts here. Click the "New Chat" button to begin a conversation.</p>
            </div>
        `;
        
        chatMessages.appendChild(emptyStateDiv);
    }
    
    // Function to create a new chat
    function createNewChat() {
        const chatId = 'chat_' + Date.now();
        currentChatId = chatId;
        
        // Initialize the chat with the welcome message
        chats[chatId] = {
            title: 'New Chat',
            messages: [{
                content: "Hello! I'm Pathfinder AI, your coding assistant. How can I help you with your coding journey today?",
                sender: 'ai',
                timestamp: Date.now()
            }]
        };
        
        // Save to localStorage
        localStorage.setItem('currentChatId', chatId);
        saveChats(chats);
        
        // Clear the chat UI and show welcome message
        chatMessages.innerHTML = '';
        addMessage(chats[chatId].messages[0].content, 'ai');
        
        // Update the sidebar
        updateChatSidebar();
    }
    
    // Function to load a specific chat
    function loadChat(chatId) {
        if (!chats[chatId]) {
            return;
        }
        
        currentChatId = chatId;
        localStorage.setItem('currentChatId', chatId);
        
        // Update UI with chat messages
        chatMessages.innerHTML = '';
        const chat = chats[chatId];
        
        if (chat && chat.messages) {
            chat.messages.forEach(msg => {
                addMessage(msg.content, msg.sender);
            });
            
            // Add a small delay to make sure the DOM is updated before scrolling
            setTimeout(() => {
                // Scroll to show the most recent messages
                scrollToBottomWithDelay();
            }, 100);
        }
        
        // Update sidebar active state
        updateActiveChatInSidebar(chatId);
    }
    
    // Function to save a message to the current chat
    function saveMessage(content, sender) {
        if (!currentChatId || !chats[currentChatId]) {
            createNewChat();
        }
        
        chats[currentChatId].messages.push({
            content: content,
            sender: sender,
            timestamp: Date.now()
        });
        
        // Update chat title if it's the first user message
        if (sender === 'user' && chats[currentChatId].messages.filter(m => m.sender === 'user').length === 1) {
            // Use first 20 chars of message as chat title
            chats[currentChatId].title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
            updateChatSidebar();
        }
        
        saveChats(chats);
    }
    
    // Function to update the chat sidebar
    function updateChatSidebar() {
        const historyContainer = document.querySelector('.chat-history');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        // Sort chats by most recent message
        const sortedChatIds = Object.keys(chats).sort((a, b) => {
            const aLastMsg = chats[a].messages[chats[a].messages.length - 1].timestamp;
            const bLastMsg = chats[b].messages[chats[b].messages.length - 1].timestamp;
            return bLastMsg - aLastMsg;
        });
        
        // Add each chat to the sidebar
        sortedChatIds.forEach(chatId => {
            const chat = chats[chatId];
            const isActive = chatId === currentChatId;
            
            const chatItem = document.createElement('div');
            chatItem.className = `history-item ${isActive ? 'active' : ''}`;
            chatItem.dataset.chatId = chatId;
            chatItem.innerHTML = `
                <span>${chat.title}</span>
                <button class="delete-chat" data-chat-id="${chatId}">×</button>
            `;
            
            historyContainer.appendChild(chatItem);
        });
        
        // Add click events
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-chat')) {
                    loadChat(this.dataset.chatId);
                }
            });
        });
        
        // Initialize mobile menu handling after updating the sidebar
        setupMobileMenuHandling();
    }
    
    // Update active chat in sidebar
    function updateActiveChatInSidebar(chatId) {
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });
    }
    
    // Function to add a message to the chat UI with markdown formatting
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        // Different avatar for AI and user
        if (sender === 'ai') {
            const avatarImg = document.createElement('img');
            avatarImg.src = 'logo.png';
            avatarImg.alt = 'Pathfinder AI';
            avatarDiv.appendChild(avatarImg);
        } else {
            // For user, just use a colored background with initial or icon
            avatarDiv.textContent = 'Y'; // You can change this to user's initial
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Process content differently based on sender
        if (sender === 'ai') {
            // Process markdown for AI messages
            // Basic markdown processing for bold, italic, and code
            let formattedContent = content
                // Code blocks with language specification
                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
                // Inline code
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                // Bold text
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                // Italic text
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                // Bullet points
                .replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>')
                // Numbered lists
                .replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$1. $2</li>')
                // Headers
                .replace(/^#{1,6}\s+(.+)$/gm, '<h4>$1</h4>')
                // Paragraphs - ensure there are breaks between them
                .split('\n\n').map(para => `<p>${para}</p>`).join('');
                
            // Wrap lists
            formattedContent = formattedContent
                .replace(/<li>(.+?)<\/li>/g, function(match) {
                    return '<ul>' + match + '</ul>';
                })
                .replace(/<ul><\/ul><ul>/g, '')
                .replace(/<\/ul><ul>/g, '');
                
            contentDiv.innerHTML = formattedContent;
        } else {
            // For user messages, just use text
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            contentDiv.appendChild(paragraph);
        }
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom
        scrollToBottomWithDelay();
    }
    
    // Add a typing indicator to show AI is "thinking"
    function simulateTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = 'logo.png';
        avatarImg.alt = 'Pathfinder AI';
        avatarDiv.appendChild(avatarImg);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Function to get AI response using DeepSeek API
    async function getAIResponse(userMessage) {
        // Show typing indicator
        simulateTypingIndicator();
        
        try {
            // Prepare conversation history for API
            const messages = [];
            
            // Include system message with custom instructions
            messages.push({
                role: "system",
                content: CUSTOM_AI_INSTRUCTIONS
            });
            
            // Add conversation history (up to last 10 messages for context)
            const chatHistory = chats[currentChatId].messages.slice(-10);
            chatHistory.forEach(msg => {
                messages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
            
            // API request configuration
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-coder",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            };
            
            // Call DeepSeek API
            const response = await fetch(DEEPSEEK_API_URL, requestOptions);
            const data = await response.json();
            
            // Check if the API responded successfully
            if (response.ok && data.choices && data.choices[0]) {
                const aiResponse = data.choices[0].message.content;
                
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add message to UI
                addMessage(aiResponse, 'ai');
                
                // Save to chat history
                saveMessage(aiResponse, 'ai');
            } else {
                throw new Error(data.error?.message || 'Failed to get response from AI');
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Show error message
            const errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again later.";
            addMessage(errorMsg, 'ai');
            saveMessage(errorMsg, 'ai');
        }
    }
    
    // Fallback for when API is unavailable or for testing
    function getLocalAIResponse(userMessage) {
        removeTypingIndicator();
        
        const message = userMessage.toLowerCase();
        let response = "";
        
        if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
            response = "Hello! How can I help with your coding questions today?";
        } else if (message.includes("javascript") || message.includes("js")) {
            response = "JavaScript is a powerful programming language that allows you to add interactivity to websites. What specific aspect of JavaScript are you interested in learning about?";
        } else if (message.includes("python")) {
            response = "Python is known for its readability and versatility. It's great for beginners and powers everything from web apps to AI. What Python concepts are you exploring?";
        } else if (message.includes("react") || message.includes("reactjs")) {
            response = "React is a popular JavaScript library for building user interfaces. It uses a component-based approach that makes building complex UIs easier. Do you need help with React concepts or specific code examples?";
        } else if (message.includes("html") || message.includes("css")) {
            response = "HTML and CSS are the building blocks of the web. HTML provides structure while CSS handles styling. What specific part of web design are you working on?";
        } else if (message.includes("thank")) {
            response = "You're welcome! Feel free to ask if you have any other questions. Happy coding!";
        } else {
            response = "That's an interesting question. In programming, the approach would depend on specific requirements and context. Could you provide more details about what you're trying to accomplish?";
        }
        
        // Add and save the message
        addMessage(response, 'ai');
        saveMessage(response, 'ai');
    }
    
    // Send message when button is clicked
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    // Send message when Enter key is pressed
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Focus the input field when the page loads
        userInput.focus();
    }
    
    // Function to handle sending a message
    function sendMessage() {
        const text = userInput.value.trim();
        if (text !== '') {
            // If no chat is active, create a new one when the user sends a message
            if (!currentChatId || !chats[currentChatId]) {
                createNewChat();
            }
            
            // Add user message to UI
            addMessage(text, 'user');
            
            // Save to chat history
            saveMessage(text, 'user');
            
            // Clear input
            userInput.value = '';
            
            // Get AI response
            getAIResponse(text);
        }
    }
    
    // Handle new chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }
    
    // Handle delete chat buttons (delegated event)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-chat')) {
            e.stopPropagation();
            const chatId = e.target.dataset.chatId;
            
            if (chatId && chats[chatId]) {
                // Delete the chat
                delete chats[chatId];
                saveChats(chats);
                
                // If we deleted the current chat, clear the currentChatId and show empty state
                if (chatId === currentChatId) {
                    currentChatId = null;
                    localStorage.removeItem('currentChatId');
                    showEmptyState();
                }
                
                // Update sidebar to reflect changes
                updateChatSidebar();
            }
        }
    });
    
    // Initialize the chat sidebar on page load and check if we need to show the empty state
    updateChatSidebar();
    
    // If no current chat after initialization, show empty state
    if (!currentChatId || !chats[currentChatId]) {
        showEmptyState();
    }
    
    // Mobile sidebar and nav menu handling
    function setupMobileMenuHandling() {
        // Create backdrop element for closing menus when clicking outside
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-backdrop';
        document.body.appendChild(backdrop);
        
        backdrop.addEventListener('click', function() {
            // Close all mobile menus when backdrop is clicked
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
            if (chatSidebar) chatSidebar.classList.remove('active');
            backdrop.classList.remove('active');
        });
        
        // Make hamburger toggle the backdrop
        if (hamburger) {
            const originalClickHandler = hamburger.onclick;
            hamburger.onclick = function(e) {
                // Toggle backdrop when menu is opened
                if (!hamburger.classList.contains('active')) {
                    backdrop.classList.add('active');
                } else {
                    backdrop.classList.remove('active');
                }
            };
        }
        
        // Auto-hide menus when a chat is selected on mobile
        document.querySelectorAll('.history-item').forEach(item => {
            const originalClickHandler = item.onclick;
            
            item.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-chat')) {
                    // Hide mobile menus when a chat is selected
                    if (window.innerWidth <= 768) {
                        if (navMenu) {
                            navMenu.classList.add('hide-on-selection');
                            setTimeout(() => {
                                navMenu.classList.remove('active');
                                navMenu.classList.remove('hide-on-selection');
                            }, 300);
                        }
                        
                        if (chatSidebar) {
                            chatSidebar.classList.add('hide-on-selection');
                            setTimeout(() => {
                                chatSidebar.classList.remove('active');
                                chatSidebar.classList.remove('hide-on-selection');
                            }, 300);
                        }
                        
                        if (hamburger) {
                            hamburger.classList.remove('active');
                        }
                        
                        backdrop.classList.remove('active');
                    }
                }
            });
        });
    }
    
    // Initialize the mobile menu handling
    setupMobileMenuHandling();
});

// Add typing indicator styles to the page
const style = document.createElement('style');
style.textContent = `
.typing-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 20px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    background-color: #999;
    border-radius: 50%;
    display: inline-block;
    animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typingBounce {
    0%, 80%, 100% { 
        transform: scale(0.6);
    }
    40% { 
        transform: scale(1);
    }
}
`;
document.head.appendChild(style);

// Add styling for empty state
const emptyStateStyle = document.createElement('style');
emptyStateStyle.textContent = `
.empty-chat-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    text-align: center;
    padding: 20px;
}

.empty-state-content {
    max-width: 400px;
    animation: fadeIn 0.8s ease-out forwards;
}

.empty-state-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    opacity: 0.7;
}

.empty-state-content h2 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #aaa;
}

.empty-state-content p {
    font-size: 16px;
    line-height: 1.5;
    color: #777;
}
`;
document.head.appendChild(emptyStateStyle);

// Handle mobile viewport height
function updateViewportHeight() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

window.addEventListener('resize', updateViewportHeight);
updateViewportHeight();

/**
 * Scrolls to the bottom of chat messages with a delay to ensure content is rendered
 * @param {number} delay - Delay in milliseconds before scrolling
 */
function scrollToBottomWithDelay(delay = 300) {
    const chatMessages = document.querySelector('.chat-messages');
    
    // Mark new messages with the utility class if they don't already have it
    const newMessages = chatMessages.querySelectorAll('.message:not(.visible)');
    newMessages.forEach(message => {
        message.classList.add('scroll-delayed-visible');
        // Add visible class after a short delay
        setTimeout(() => {
            message.classList.add('visible');
        }, 50);
    });

    // Delay the scroll to ensure content is rendered
    setTimeout(() => {
        chatMessages.classList.add('smooth-scroll');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove the smooth-scroll class after scrolling to avoid affecting other interactions
        setTimeout(() => {
            chatMessages.classList.remove('smooth-scroll');
        }, 500);
    }, delay);
}
