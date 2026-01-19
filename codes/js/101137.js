import React, { useState, useRef, useEffect } from 'react';
import './styles.css';
import ChatMessage from './BasicChatMessage';

const API_KEY = "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" // Set your OpenAI API key in environment variables
const systemMessage = {
  role: 'system',
  content: "Explain things like you're talking to a software professional with 2 years of experience.",
};
function App() {
  const [messages, setMessages] = useState([{ message: "Hello, I'm ChatGPT! Ask me anything!", sentTime: 'just now', sender: 'ChatGPT' }]);
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    if (inputMessage.trim() === '') return;

    const newMessage = { message: inputMessage.trim(), sentTime: new Date().toLocaleTimeString(), sender: 'user' };
    setInputMessage('');
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);

    // setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) { // messages is an array of messages
    // Format messages for chatGPT API
    // API is expecting objects in format of { role: "user" or "assistant", "content": "message here"}
    // So we need to reformat

    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT"){
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message}
    });


    // Get the request body set up with the model we plan to use
    // and the messages which we formatted above. We add a system message in the front to'
    // determine how we want chatGPT to act. 
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,  // The system message DEFINES the logic of our chatGPT
        ...apiMessages // The messages from our chat with ChatGPT
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", 
    {
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
        sender: "ChatGPT"
      }]);
      // setIsTyping(false);
    });
  }

  return (
    <div className="app-container">
      <h1 className="chat-title">AI-Chat Bot 3.5 Turbo</h1>
      <div className="messages-container">
        {messages.map((message, index) => <ChatMessage key={index} message={message} />)}
      </div>
      <div className="input-container">
        <input type="text" placeholder="Type a message" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} ref={inputRef} />
        <button type="button" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default App;