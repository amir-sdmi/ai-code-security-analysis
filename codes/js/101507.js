import { useState } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { clothItemsForSale } from "./clothingItems";

const systemMessage = {
  role: "system",
  content: `You are a ChatBot for a clothing store that sells the following items: ${clothItemsForSale}.
   this is our return and exchange policy:
    - You can return or exchange any item within 30 days of purchase.
    - Items must be unworn and unwashed.
    - Underwear and socks are final sale.
    - Items must have all tags attached.
  `,
};

function ChatBot() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, how may I assist you?",
      sentTime: "just now",
      sender: "ChatGPT",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: "outgoing",
      sender: "user",
    };

    const newMessages = [...messages, newMessage];

    setMessages(newMessages);

    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) {
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return {
        role: role,
        content: messageObject.message,
      };
    });

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        systemMessage, // The system message DEFINES the logic of our chatGPT
        ...apiMessages, // The messages from our chat with ChatGPT
      ],
      temperature: 0,
      max_tokens: 200,
    };

    try {
      await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.CHATBOT_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequestBody),
      })
        .then((data) => {
          console.log(data);
          return data.json();
        })
        .then((data) => {
          console.log(data);
          setMessages([
            ...chatMessages,
            {
              message: data.choices[0].message.content,
              sender: "ChatGPT",
              clothingInfo: data?.choices[0].message.clothingInfo,
            },
          ]);
          setIsTyping(false);
        });
    } catch (error) {
      console.log(error);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      <div style={{ position: "relative", height: "800px", width: "700px" }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={
                isTyping ? (
                  <TypingIndicator content="Virtual assistant is typing" />
                ) : null
              }
            >
              {messages.map((message, i) => {
                console.log(message);
                return (
                  <Message key={i} model={message}>
                    {message.clothingInfo && (
                      <div>
                        <p>Name: {message.clothingInfo.name}</p>
                        <p>Type: {message.clothingInfo.type}</p>
                        <p>Price: {message.clothingInfo.price}</p>
                      </div>
                    )}
                  </Message>
                );
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </>
  );
}

export default ChatBot;
