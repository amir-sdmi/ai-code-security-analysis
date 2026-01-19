//  Import required libraries
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config(); //Load API key from .env file

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure .env contains OPENAI_API_KEY
});

//Define the structure of the message context (conversation history)
type contextType = {
  role: string; // can be "system", "user", or "assistant"
  content: string; // message content
}[];

// Initial system + assistant setup
const context: contextType = [
  {
    role: "system", // instructs the assistant's behavior
    content: "You are a helpful assistant.",
  },
  {
    role: "user", // initial user message
    content: "Hello! How can you assist me today?",
  },
  {
    role: "assistant", // initial assistant reply
    content:
      "I can help you with a variety of tasks, such as answering questions, providing information, and assisting with problem-solving.",
  },
];

//Function to get assistant's response and update context
async function chatCompletion() {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // using ChatGPT model
    messages: context, // send full context
  });

  // Extract assistant's reply from the response
  const responseMessage = response.choices[0].message.content;

  // Add the assistant's reply back to the context
  context.push({
    role: "assistant",
    content: responseMessage,
  });

  // Output the reply
  console.log("Assistant:", response.choices[0].message.role, responseMessage);
}

// Main function to handle user input in a loop (chat interface)
async function run() {
  const input = require("prompt-sync")({ sigint: true }); // Synchronous prompt input

  while (true) {
    const userInput = input("You: ") as string; // Prompt user

    // Allow user to exit the loop
    if (userInput.toLowerCase() === "exit") {
      console.log("Exiting the chat application.");
      break;
    }

    // Add user message to the context
    context.push({
      role: "user",
      content: userInput,
    });

    // Get assistant response and print it
    await chatCompletion();
  }
}

// tart the chat application and handle any errors
run().catch((error: any) => {
  console.error("Error during OpenAI API call:", error);
});
