

import { config } from 'dotenv';
import readlineSync from 'readline-sync';
import { OpenAI } from 'openai';

config(); // Load API key from .env

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askChatGPT(question: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [{ role: 'user', content: question }],
      temperature: 0.7,
    });

    const answer = response.choices[0].message.content;
    return answer;
  } catch (error) {
    console.error('❌ Error communicating with ChatGPT:', error);
    return 'Sorry, something went wrong. Please try again.';
  }
}

async function startChat() {
  console.log('💬 AfCFTA Chatbot Support is now online.');
  console.log("Type 'exit' to end the chat.\n");

  while (true) {
    const userInput = readlineSync.question('You: ');

    if (userInput.toLowerCase() === 'exit') {
      console.log('👋 Goodbye!');
      break;
    }

    const response = await askChatGPT(userInput);
    console.log(`ChatGPT: ${response}\n`);
  }
}

startChat();
