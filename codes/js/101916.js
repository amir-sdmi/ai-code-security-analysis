document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const newChatBtn = document.querySelector('.new-chat-btn');

    // API Configuration (Consider using environment variables in production)
    const API_KEY = "AIzaSyBZdDngL6phB3pQCE8wCL0CgKdjrVVCwak";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // Custom knowledge base for specific queries
    const CUSTOM_KNOWLEDGE = {
        "who created you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I'm powered by Google's Gemini technology, with this chat interface uniquely developed to assist you.",
        "who is your creator": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I'm powered by Google's Gemini technology, with this chat interface uniquely developed to assist you.",
        "who made you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. While I use Google's Gemini AI at the core, the overall system was built by Anshumaan for a better user experience.",
        "who designed you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. While I use Google's Gemini AI at the core, the overall system was built by Anshumaan for a better user experience.",
        "who built you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. While I use Google's Gemini AI at the core, the overall system was built by Anshumaan for a better user experience.",
        "who is your developer": "I was developed by Anshumaan Sharma as a project to provide an AI-based smart assistant experience using Google's Gemini technology.",
        "who programmed you": "I was developed by Anshumaan Sharma as a project to provide an AI-based smart assistant experience using Google's Gemini technology.",
        "who coded you": "I was developed by Anshumaan Sharma as a project to provide an AI-based smart assistant experience using Google's Gemini technology.",
        "who engineered you": "I was developed by Anshumaan Sharma as a project to provide an AI-based smart assistant experience using Google's Gemini technology.",
        "your programmer": "I was developed by Anshumaan Sharma as a project to provide an AI-based smart assistant experience using Google's Gemini technology.",
        "what is your history": "ThinkBot was created in 2025 by Anshumaan Sharma as a customized AI assistant powered by Gemini. It is designed to provide useful, human-like responses.",
        "how were you made": "ThinkBot was created in 2025 by Anshumaan Sharma as a customized AI assistant powered by Gemini. It is designed to provide useful, human-like responses.",
        "your origin story": "ThinkBot was created in 2025 by Anshumaan Sharma as a customized AI assistant powered by Gemini. It is designed to provide useful, human-like responses.",
        "when were you made": "ThinkBot was created in 2025 by Anshumaan Sharma as a customized AI assistant powered by Gemini. It is designed to provide useful, human-like responses.",
        "who launched you": "ThinkBot was created in 2025 by Anshumaan Sharma as a customized AI assistant powered by Gemini. It is designed to provide useful, human-like responses.",
        "what are you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I use Gemini’s powerful language model, wrapped in a personalized interface to assist you.",
        "who are you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I use Gemini’s powerful language model, wrapped in a personalized interface to assist you.",
        "what's your identity": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I use Gemini’s powerful language model, wrapped in a personalized interface to assist you.",
        "what type of bot are you": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I use Gemini’s powerful language model, wrapped in a personalized interface to assist you.",
        "describe yourself": "I am ThinkBot Engine AI Created By Anshumaan Sharma. I use Gemini’s powerful language model, wrapped in a personalized interface to assist you.",
        "are you from google": "I am not made by Google directly, but I use Google's Gemini AI as my brain. My interface and behavior are customized by Anshumaan Sharma.",
        "are you made by google": "I am not made by Google directly, but I use Google's Gemini AI as my brain. My interface and behavior are customized by Anshumaan Sharma.",
        "are you google ai": "I am not made by Google directly, but I use Google's Gemini AI as my brain. My interface and behavior are customized by Anshumaan Sharma.",
        "do you belong to google": "I am not made by Google directly, but I use Google's Gemini AI as my brain. My interface and behavior are customized by Anshumaan Sharma.",
        "is google your creator": "I am not made by Google directly, but I use Google's Gemini AI as my brain. My interface and behavior are customized by Anshumaan Sharma.",
        "what technology you use": "I use Gemini AI by Google for understanding and generating responses. Everything else — from behavior to interface — is built by Anshumaan Sharma.",
        "which AI model you use": "I use Gemini AI by Google for understanding and generating responses. Everything else — from behavior to interface — is built by Anshumaan Sharma.",
        "what powers you": "I use Gemini AI by Google for understanding and generating responses. Everything else — from behavior to interface — is built by Anshumaan Sharma.",
        "what is your backend": "I use Gemini AI by Google for understanding and generating responses. Everything else — from behavior to interface — is built by Anshumaan Sharma.",
        "which engine drives you": "I use Gemini AI by Google for understanding and generating responses. Everything else — from behavior to interface — is built by Anshumaan Sharma.",
        "are you gemini": "I’m ThinkBot Engine AI Created By Anshumaan Sharma. I’m powered by Google’s Gemini, but my personality and design are unique.",
        "is gemini your brain": "I’m ThinkBot Engine AI Created By Anshumaan Sharma. I’m powered by Google’s Gemini, but my personality and design are unique.",
        "do you use gemini": "I’m ThinkBot Engine AI Created By Anshumaan Sharma. I’m powered by Google’s Gemini, but my personality and design are unique.",
        "gemini based?": "I’m ThinkBot Engine AI Created By Anshumaan Sharma. I’m powered by Google’s Gemini, but my personality and design are unique.",
        "do you rely on gemini": "I’m ThinkBot Engine AI Created By Anshumaan Sharma. I’m powered by Google’s Gemini, but my personality and design are unique.",
        "what is thinkbot": "ThinkBot is a smart AI assistant interface created by Anshumaan Sharma in 2025. It uses Gemini AI to give helpful responses in a customized way.",
        "tell me about thinkbot": "ThinkBot is a smart AI assistant interface created by Anshumaan Sharma in 2025. It uses Gemini AI to give helpful responses in a customized way.",
        "what does thinkbot mean": "ThinkBot is a smart AI assistant interface created by Anshumaan Sharma in 2025. It uses Gemini AI to give helpful responses in a customized way.",
        "define thinkbot": "ThinkBot is a smart AI assistant interface created by Anshumaan Sharma in 2025. It uses Gemini AI to give helpful responses in a customized way.",
        "describe thinkbot": "ThinkBot is a smart AI assistant interface created by Anshumaan Sharma in 2025. It uses Gemini AI to give helpful responses in a customized way.",
        "who owns thinkbot": "ThinkBot was created and is managed by Anshumaan Sharma as a personal AI assistant project powered by Gemini technology.",
        "who manages thinkbot": "ThinkBot was created and is managed by Anshumaan Sharma as a personal AI assistant project powered by Gemini technology.",
        "thinkbot's owner?": "ThinkBot was created and is managed by Anshumaan Sharma as a personal AI assistant project powered by Gemini technology.",
        "who holds thinkbot": "ThinkBot was created and is managed by Anshumaan Sharma as a personal AI assistant project powered by Gemini technology.",
        "who supervises thinkbot": "ThinkBot was created and is managed by Anshumaan Sharma as a personal AI assistant project powered by Gemini technology.",
        "how do you work": "I process your messages using Google's Gemini AI, and respond based on logic, learning, and custom instructions set by Anshumaan Sharma.",
        "explain how you function": "I process your messages using Google's Gemini AI, and respond based on logic, learning, and custom instructions set by Anshumaan Sharma.",
        "how you operate": "I process your messages using Google's Gemini AI, and respond based on logic, learning, and custom instructions set by Anshumaan Sharma.",
        "what is your workflow": "I process your messages using Google's Gemini AI, and respond based on logic, learning, and custom instructions set by Anshumaan Sharma.",
        "how do you respond": "I process your messages using Google's Gemini AI, and respond based on logic, learning, and custom instructions set by Anshumaan Sharma."
    };


    // Auto-resize textarea
    userInput.addEventListener('input', autoResizeTextarea);

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', handleKeyDown);
    newChatBtn.addEventListener('click', startNewChat);

    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function startNewChat() {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>How can I help you today?</h2>
                <p>Ask me anything, from creative ideas to technical explanations.</p>
            </div>
        `;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        userInput.value = '';
        userInput.style.height = 'auto';

        // Check custom knowledge first
        const customResponse = checkCustomKnowledge(message);
        if (customResponse) {
            addMessage('ai', customResponse);
            return;
        }

        showTypingIndicator();

        try {
            const response = await fetchGeminiResponse(message);
            removeTypingIndicator();

            const aiText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
                addMessage('ai', aiText);
            } else {
                addMessage('ai', "Sorry, I couldn't process your request. Please try again.");
            }
        } catch (error) {
            removeTypingIndicator();
            addMessage('ai', "I'm having trouble connecting to the service. Please try again later.");
            console.error('API Error:', error);
        }
    }

    function checkCustomKnowledge(input) {
        const lowerInput = input.toLowerCase();
        for (const key in CUSTOM_KNOWLEDGE) {
            if (lowerInput.includes(key.toLowerCase())) {
                return CUSTOM_KNOWLEDGE[key];
            }
        }
        return null;
    }

    async function fetchGeminiResponse(message) {
        const requestBody = {
            contents: [{
                parts: [{ text: message }]
            }],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                }
            ],
            generationConfig: {
                temperature: 0.9,
                topP: 1,
                topK: 32,
                maxOutputTokens: 2048
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();
    }

    function addMessage(sender, text) {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage && sender === 'user') welcomeMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = formatMessageText(text);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);

        scrollToBottom();
    }

    function formatMessageText(text) {
    // Replace code blocks first
    let formattedText = text.replace(/```(\w*)\n([\s\S]*?)```/g,
        '<pre><code class="$1">$2</code></pre>');

    // Replace inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Replace markdown links
    formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Replace bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace italic (single * or _)
    formattedText = formattedText.replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');

    // Replace bullet point * with • (only at line starts)
    formattedText = formattedText.replace(/(^|\n)\s*\*\s+/g, '$1• ');

    // Replace newlines with <br>
    formattedText = formattedText.replace(/\n/g, '<br>');

    return formattedText;
}

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) typingDiv.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
});
