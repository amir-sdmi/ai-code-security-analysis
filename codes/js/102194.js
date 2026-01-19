import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";

export const dynamic = 'force-dynamic'; // Disable caching for this route

//INITIALIZE AI CLIENT
// Support OpenRouter, DeepSeek, and OpenAI
const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
let baseURL, model;

if (process.env.DEEPSEEK_API_KEY) {
    // Check if it's an OpenRouter key (starts with sk-or-)
    if (process.env.DEEPSEEK_API_KEY.startsWith('sk-or-')) {
        baseURL = 'https://openrouter.ai/api/v1';
        // Use faster model for better response times
        model = 'deepseek/deepseek-chat'; // Faster than v3
    } else {
        baseURL = 'https://api.deepseek.com/v1';
        model = 'deepseek-chat';
    }
} else if (process.env.OPENROUTER_API_KEY) {
    baseURL = 'https://openrouter.ai/api/v1';
    model = 'deepseek/deepseek-chat'; // Faster model
} else if (process.env.OPENAI_API_KEY) {
    baseURL = 'https://api.openai.com/v1';
    model = 'gpt-3.5-turbo'; // Already fast
}

if (!apiKey) {
    throw new Error('Either DEEPSEEK_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY environment variable must be set');
}

const openai = new OpenAI({
    baseURL: baseURL,
    apiKey: apiKey
});

export async function POST(request) {
  try {
    const {userId} = getAuth(request);
    if (!userId) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const { chatId, prompt, isRegenerate } = await request.json();
    if (!chatId || !prompt) {
        return NextResponse.json(
            { success: false, message: "Missing required fields" },
            { status: 400 }
        );
    }

    await connectDB();
    const chat = await Chat.findOne({ _id: chatId, userId });
    
    if (!chat) {
        return NextResponse.json(
            { success: false, message: "Chat not found" },
            { status: 404 }
        );
    }

    // Only add user message if this is not a regeneration
    if (!isRegenerate) {
        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now()
        };
        chat.messages.push(userPrompt);
    }

    try {
        // Check if we have a valid API key (not a placeholder)
        const isValidApiKey = apiKey &&
                             apiKey.startsWith('sk-') &&
                             !apiKey.includes('your') &&
                             !apiKey.includes('placeholder') &&
                             !apiKey.includes('here');

        let message;

        if (isValidApiKey) {
            // Try to use real DeepSeek API with streaming
            try {
                // Build conversation context from chat history
                const conversationMessages = [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant. Provide accurate, detailed, and well-formatted responses. When providing code, use proper syntax highlighting and explain the code clearly. Be concise but comprehensive."
                    }
                ];

                // Add recent conversation history (last 10 messages for context)
                const recentMessages = chat.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                conversationMessages.push(...recentMessages);

                // Add the current user prompt only if not regenerating
                if (!isRegenerate) {
                    conversationMessages.push({ role: "user", content: prompt });
                }

                const completion = await openai.chat.completions.create({
                    model: model,
                    messages: conversationMessages,
                    temperature: 0.7,
                    max_tokens: 1500, // Increased for better responses
                    stream: true
                });

                // Create a streaming response
                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    async start(controller) {
                        let fullContent = '';

                        try {
                            for await (const chunk of completion) {
                                const content = chunk.choices[0]?.delta?.content || '';
                                if (content) {
                                    fullContent += content;
                                    // Send chunk to frontend
                                    const data = JSON.stringify({
                                        type: 'chunk',
                                        content: content,
                                        fullContent: fullContent
                                    });
                                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                                }
                            }

                            // Save complete message to database
                            const finalMessage = {
                                role: "assistant",
                                content: fullContent,
                                timestamp: Date.now()
                            };

                            chat.messages.push(finalMessage);
                            await chat.save();

                            // Send completion signal
                            const completeData = JSON.stringify({
                                type: 'complete',
                                message: finalMessage
                            });
                            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
                            controller.close();

                        } catch (error) {
                            console.error('Streaming error:', error);
                            const errorData = JSON.stringify({
                                type: 'error',
                                message: 'Streaming failed'
                            });
                            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                            controller.close();
                        }
                    }
                });

                return new Response(stream, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });

            } catch (apiError) {
                console.error('DeepSeek API Error:', apiError);
                console.error('API Error Details:', {
                    message: apiError.message,
                    status: apiError.status,
                    prompt: prompt.substring(0, 100) + '...'
                });

                // Fall back to non-streaming response with better error info
                message = {
                    role: "assistant",
                    content: `I encountered an issue with the AI service. Error: ${apiError.message}. Your question was: "${prompt}". Please check your API configuration or try again later.`,
                    timestamp: Date.now()
                };
            }
        } else {
            // Use intelligent mock responses based on the user's question
            const mockResponses = {
                "react": `React is a popular JavaScript library for building user interfaces. Here's a simple example:

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;
\`\`\`

React uses components, state management, and a virtual DOM for efficient updates.`,

                "javascript": `JavaScript is a versatile programming language. Here's an example of modern JavaScript:

\`\`\`javascript
// Modern JavaScript with async/await
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Using the function
fetchUserData(123).then(user => {
  console.log('User:', user);
});
\`\`\`

JavaScript supports modern features like arrow functions, destructuring, and promises.`,

                "python": `Python is known for its clean syntax and readability. Here's an example:

\`\`\`python
# Python class example
class Calculator:
    def __init__(self):
        self.history = []

    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

    def get_history(self):
        return self.history

# Usage
calc = Calculator()
result = calc.add(5, 3)
print(f"Result: {result}")
print("History:", calc.get_history())
\`\`\`

Python is great for web development, data science, AI, and automation.`,

                "html": `HTML structures web content. Here's a modern HTML5 example:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Web Page</title>
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home">
            <h1>Welcome to My Site</h1>
            <p>This is a semantic HTML5 structure.</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 My Website</p>
    </footer>
</body>
</html>
\`\`\`

HTML5 provides semantic elements for better structure and accessibility.`,

                "css": `CSS styles web pages. Here's modern CSS with Flexbox:

\`\`\`css
/* Modern CSS with custom properties and Flexbox */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --font-size: 16px;
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-size: var(--font-size);
}

.header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 1rem;
  color: white;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
\`\`\`

Modern CSS includes Flexbox, Grid, custom properties, and responsive design.`,

                "default": "I'm currently in demo mode with intelligent responses! Your question about '{prompt}' is interesting. To get real AI responses powered by DeepSeek or OpenAI, please configure your API key in the .env file. The demo responses include code examples and explanations for common programming topics."
            };

            // Find the best response based on keywords in the prompt
            const lowerPrompt = prompt.toLowerCase();
            let responseKey = "default";

            for (const [key] of Object.entries(mockResponses)) {
                if (key !== "default" && lowerPrompt.includes(key)) {
                    responseKey = key;
                    break;
                }
            }

            let responseText = mockResponses[responseKey];
            if (responseKey === "default") {
                responseText = responseText.replace('{prompt}', prompt);
            }

            message = {
                role: "assistant",
                content: responseText,
                timestamp: Date.now()
            };
        }

        chat.messages.push(message);
        await chat.save();

        return NextResponse.json(
            { success: true, data: message },
            { status: 200 }
        );
    } catch (error) {
        console.error('Chat Error:', error);
        return NextResponse.json(
            { success: false, message: "Chat service error" },
            { status: 500 }
        );
    }
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
    );
  }
}