import axios from 'axios';

// Queue to hold messages
const messageQueue = [];
let processing = false;

// Function to process the queue
async function processQueue() {
    if (processing || messageQueue.length === 0) return;
    processing = true;

    const { threadId, userMessage, apiKey, assistantId, callback } = messageQueue.shift();
    const messageUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;
    const runUrl = `https://api.openai.com/v1/threads/${threadId}/runs`;

    try {
        // Send message
        console.log(`Sending message to ChatGPT for thread ${threadId}: ${userMessage}`);
        await axios.post(messageUrl, {
            role: "user",
            content: userMessage
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        // Initiate response generation
        console.log("Initiating a run for response generation.");
        await axios.post(runUrl, {
            assistant_id: assistantId
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        // Wait to allow time for the assistant to generate a response
        await new Promise(resolve => setTimeout(resolve, 25000));

        // Fetch the latest assistant's response
        const response = await axios.get(`${messageUrl}?role=assistant&order=desc&limit=1`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        const messages = response.data.data;
        let responseMessage = 'No response received.';
        if (messages.length > 0) {
            const lastMessage = messages[0];
            const textEntry = lastMessage.content.find(entry => entry.type === 'text' && entry.text && entry.text.value);
            if (textEntry && textEntry.text) {
                responseMessage = textEntry.text.value.trim();
                console.log(`Received response from thread ${threadId}: ${responseMessage}`);
            }
        }

        // Call the callback function if provided
        if (callback && typeof callback === 'function') {
            callback(responseMessage);
        }

    } catch (error) {
        console.error(`Error processing response for thread ${threadId}:`, JSON.stringify(error.response ? error.response.data : error));
        if (!error.response || error.response.status >= 500) { // Retry logic for server errors
            console.log("Retrying due to server error...");
            messageQueue.unshift({ threadId, userMessage, apiKey, assistantId, callback }); // Push the message back to the front of the queue
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
        }
    } finally {
        processing = false;
        processQueue();
    }
}

// Function to add messages to the queue
export function addMessageToQueue(threadId, userMessage, apiKey, assistantId, callback) {
    messageQueue.push({ threadId, userMessage, apiKey, assistantId, callback });
    if (!processing) {
        processQueue();
    }
}

// Function to create a new thread if it doesn't already exist
export async function createThreadIfNotExist(clientId, apiKey, threadsCollection) {
    if (!clientId || !apiKey) {
        console.error("Invalid client ID or API key");
        return null;
    }

    console.log(`Looking for existing thread for client ID: ${clientId}`);
    let threadDoc = await threadsCollection.findOne({ clientId });

    if (!threadDoc) {
        console.log("No existing thread found, creating new thread...");
        try {
            const response = await axios.post('https://api.openai.com/v1/threads', {}, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            });
            const threadId = response.data.id;
            console.log(`New thread created with ID: ${threadId}`);
            await threadsCollection.insertOne({ clientId, threadId });
            return threadId;
        } catch (error) {
            console.error("Failed to create thread:", error.response ? JSON.stringify(error.response.data) : error.message);
            return null;
        }
    } else {
        console.log(`Existing thread found: ${threadDoc.threadId}`);
        return threadDoc.threadId;
    }
}

// Function to fetch the entire conversation for a given threadId
export async function fetchConversation(threadId, apiKey) {
    const url = `https://api.openai.com/v1/threads/${threadId}/messages`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        return response.data.data;
    } catch (error) {
        console.error(`Error fetching conversation for thread ${threadId}:`, error.response ? error.response.data : error);
        return null;
    }
}

// Function to analyze conversation for interest using ChatGPT
export async function analyzeConversation(conversation, apiKey) {
    if (!conversation || conversation.length === 0) {
        return { interestLevel: 'undefined', summary: 'No conversation data available.' };
    }

    // Prepare the conversation as input for ChatGPT
    const messages = conversation.map(message => ({
        role: message.role,
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
    }));

    // Compose the prompt
    const prompt = {
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'You are an assistant that determines if a user is interested in a product or service based on the conversation. Provide a detailed summary of the conversation as well.' },
            ...messages,
            { role: 'system', content: 'Based on the conversation, classify the user\'s interest in the product or service as "yes," "maybe," "no," or "dnd" (for do not disturb if the customer is very negative or aggressive), or "undefined". Provide the classification and a brief but detailed summary of the conversation.' }
        ],
        max_tokens: 300, // Adjust as needed to get a proper summary
        n: 1,
        stop: null // Adjust as needed
    };

    try {
        // Send the prompt to the ChatGPT API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', prompt, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Log the full response for debugging
        console.log('ChatGPT API response:', JSON.stringify(response.data, null, 2));

        // Extract the response from ChatGPT
        const result = response.data.choices[0]?.message?.content?.trim();

        if (!result) {
            throw new Error('Invalid response format from ChatGPT API');
        }

        // Expecting a structured response
        // e.g., "Interest: yes\nSummary: The user showed interest in financing a car, starting with a blue car but later preferring a red car. An appointment was suggested."
        const [interestLine, ...summaryLines] = result.split('\n');
        const interestLevel = interestLine.split(':')[1]?.trim().toLowerCase() || 'undefined';
        const summary = summaryLines.join(' ').replace('Summary:', '').trim();

        return { interestLevel, summary };
    } catch (error) {
        console.error('Error analyzing conversation with ChatGPT:', error.response ? error.response.data : error.message);
        return { interestLevel: 'undefined', summary: 'Error analyzing conversation.' };
    }
}


// Main function to handle a user message using the queue
export function handleUserMessage(threadId, userMessage, apiKey, assistantId, callback) {
    addMessageToQueue(threadId, userMessage, apiKey, assistantId, callback);
}
