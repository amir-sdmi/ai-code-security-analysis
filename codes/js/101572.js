import React, { useState, useRef } from "react";

// Import OpenAI API
import OpenAI from "openai";
// Uses chatscope's chat UI to display the chatGPT Assistant API.
// This JS file contains both the front and back end for the assistant.
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

const API_KEY = process.env.REACT_APP_API_URL;

const ChatBox = ({ musicMax, chatMax }) => {
  const chatBoxRef = useRef(null);
  const [userHasEngaged, setUserHasEngaged] = useState(false);
  const [typing, setTyping] = useState(false); // True during chatGPT's think time
  const [messages, setMessages] = useState([
    {
      message:
        "Hello, I'm chatGPT3.5 Assistant! Ask me anything about this website, it's source code, or functionality. I am a beta AI - my answers may not be accurate, and you might have to remind me to do my job.",
      sender: "ChatGPT",
      direction: "incoming",
    },
  ]);
  const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const sendMessageToOpenAI = async (userMessage) => {
    try {
      setTyping(true);
      setUserHasEngaged(true);

      // Retrieve the Assistant with the source files
      // that I uploaded on openAI playground
      const retrievedAssistant = await openai.beta.assistants.retrieve(
        "asst_Rinos6bXk2uBsHVUpdHzXaIk"
      );
      // Create a thread
      const thread = await openai.beta.threads.create();
      // Send the user's message by creating a message in the thread
      const userMessageResponse = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: userMessage,
        }
      );
      // Finally, run the conversation to activate chatGPT
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: retrievedAssistant.id,
      });
      // Get the status of chatGPT's reply into runStatus
      let runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      // Check for runStatus to become "completed" once every second
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
      // Assistants API can only send the entire conversation,
      // not just one message at a time
      const totalMessages = await openai.beta.threads.messages.list(thread.id);
      const lastAssistantMessage = totalMessages.data
        .filter((message) => message.role === "assistant")
        .pop(); // Pop the last message to get only the assistant's reply

      setTyping(false);
      return (
        // Optional chaining (? operator) prevents ugly chain of booleans and &&s
        lastAssistantMessage?.content[0]?.text.value ||
        "Sorry, I couldn't understand your question."
      );
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      setTyping(false);
      return "Sorry, an error occurred.";
    }
  };

  const handleMessageSend = async (userMessage) => {
    // Add the user's message to the message list immediately
    setMessages((prevMessages) => [
      ...prevMessages,
      { message: userMessage, sender: "User", direction: "outgoing" },
    ]);
    // Send user's message to OpenAI API
    const assistantMessage = await sendMessageToOpenAI(userMessage);

    // Update message list with chatGPT's reply
    setMessages((prevMessages) => [
      ...prevMessages,
      { message: assistantMessage, sender: "ChatGPT", direction: "incoming" },
    ]);
  };

  const chatStyle = {
    background: `linear-gradient(to top, #3978ff1f, #f0f5ff1f)`,
    fontSize: "16px",
    fontWeight: "normal",
    fontFamily: "Lato, sans-serif",
  };

  return (
    <div
      className={`chat-box ${musicMax ? "chat-off-bottom" : ""} ${
        chatMax ? "" : "chat-off-side"
      }`}
      ref={chatBoxRef}
    >
      <MainContainer style={chatStyle}>
        <ChatContainer>
          <MessageList
            typingIndicator={
              typing ? (
                <TypingIndicator
                  content="ChatGPT is typing"
                  style={{ background: "transparent" }}
                />
              ) : null
            }
            style={chatStyle}
          >
            {messages.map((message, i) => (
              <Message key={i} model={message} />
            ))}
          </MessageList>
          <MessageInput
            placeholder={`${
              userHasEngaged
                ? "Send a message..."
                : "How are you implemented in the webpage?"
            }`}
            attachDisabled={true}
            attachButton={false}
            onSend={handleMessageSend}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default ChatBox;
