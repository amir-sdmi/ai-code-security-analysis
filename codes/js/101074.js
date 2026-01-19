// chatgpt.js

// Initialize necessary variables for the chat interface
let chatSessionId = null;
let chatHistory = [];

// Function to create the chat interface dynamically
function createChatInterface() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = `
        <div id="chat-history"></div>
        <input type="text" id="chat-input" placeholder="Ask me anything..." />
        <button id="send-chat">Send</button>
    `;
    document.body.appendChild(chatContainer);

    // Ensure only one event listener is added for the send button within this function
    document.getElementById('send-chat').addEventListener('click', sendChat);
}

// Function to send chat input to ChatGPT and display the response
function sendChat() {
    const inputElement = document.getElementById('chat-input');
    const chatInput = inputElement.value;
    inputElement.value = ''; // Clear input after sending

    if (chatInput.trim()) {
        // Display user input in chat history
        addToChatHistory('You', chatInput);

        // Call API and display response
        fetchChatGPTResponse(chatInput).then(response => {
            addToChatHistory('ChatGPT', response);
        }).catch(error => {
            console.error('Error communicating with ChatGPT:', error);
            addToChatHistory('ChatGPT', 'Sorry, I am unable to respond at the moment.');
        });
    }
}

// Function to add messages to the chat history
function addToChatHistory(sender, message) {
    const chatHistoryDiv = document.getElementById('chat-history');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender.toLowerCase()}`;
    messageDiv.textContent = `${sender}: ${message}`;
    chatHistoryDiv.appendChild(messageDiv);
}

function fetchChatGPTResponse(message) {
    const apiKey = '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'; // Replace with your actual API key
    return fetch('https://api.openai.com/v1/chat/engines/gpt-3.5-turbo/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: message,
            max_tokens: 150,
            temperature: 0.7
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(json => { throw new Error(`API request failed with status ${response.status}: ${json.error.message}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(`API response error: ${data.error.message}`);
        }
        return data.choices[0].text.trim();
    })
    .catch(error => {
        console.error('Fetch error:', error.message);
        return `Sorry, I am unable to respond at the moment. Error: ${error.message}`;
    });
}


// Initialize chat interface on page load
window.addEventListener('load', createChatInterface);
