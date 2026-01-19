import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

const API_KEY = "xai-NZFshboSYDWkJ7m1v0PrGEf52K8PrYVQcH2LUPVgjSO4tUa47D980JffECISr4w5OweJEGFszAXxFXEz"; 
// The system message defines how Grok should respond, similar to what you had with grok
const systemMessage = { 
  "role": "system", "content": "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy."
}
//extra
function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm Grok! Ask me anything!",
      sentTime: "just now",
      sender: "Grok"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);

    setIsTyping(true);
    await processMessageToGrok(newMessages);
  };

  async function processMessageToGrok(chatMessages) {
    // Format messages to the correct API structure
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "Grok") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message }
    });

    // Create the request body to send to Grok
    const apiRequestBody = {
      "model": "grok-beta", 
      "messages": [
        systemMessage,  
        ...apiMessages 
      ],
      "stream": false, 
      "temperature": 0 
    }

    // Make the API call to Grok's endpoint
    await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "Grok"
      }]);
      setIsTyping(false);
    });
  }

  return (
    <div className="App">
      <div className="AppHeader">CitiEasy</div>
      <MainContainer>
        <ChatContainer>
          <MessageList
            scrollBehavior="smooth"
            typingIndicator={isTyping ? <TypingIndicator content="Grok is typing..." /> : null}
          >
            {messages.map((msg, idx) => (
              <Message key={idx} model={msg} />
            ))}
          </MessageList>
          <MessageInput placeholder="Type a message..." onSend={handleSend} />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default App;
