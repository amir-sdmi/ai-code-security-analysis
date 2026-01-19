import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatBubble } from '@mui/icons-material';
import Sidebar from './scenes/Sidebar';
import MainDash from './scenes/MainDash';
import PlantDetails from './scenes/PlantDetails/PlantDetails';
import Calendar from './scenes/Calendar/Calendar';
import InventoryManagement from './scenes/InventoryManagement/InventoryManagement';
import HistoricalData from './scenes/HistoricalData/HistoricalData';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react'; // Import necessary components from chat-ui-kit-react
import './App.css';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY; 

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      message: "Hello, I am your Personal Assistant!",
      sender: "ChatGPT",
    },
    {
      message: "How can I assist you with farm management today?",
      sender: "ChatGPT",
    },
  ]);
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(prevState => !prevState);
  };

  const handleUserMessage = async (userMessage) => {
    // Create a new user message object
    const newUserMessage = {
      message: userMessage,
      sender: "user",
      direction: "outgoing",
    };

    // Update chat messages state with the new user message
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);

    // Set typing indicator
    setIsChatbotTyping(true);

    // Process user message with ChatGPT API
    await processUserMessageToChatGPT([...chatMessages, newUserMessage]);
  };

  // Function to process user message with ChatGPT API
  const processUserMessageToChatGPT = async (messages) => {
    let apiMessages = messages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message };
    });

    // System message for ChatGPT
    const systemMessage = {
      role: "system",
      content: "You are a farmer. I am your personal assistant for farm management.",
    };

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        systemMessage, // System message should be in front of user messages
        ...apiMessages,
      ],
    };

    try {
      // Send request to ChatGPT API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequestBody),
      });
    
      if (!response.ok) {
        throw new Error("Failed to fetch response from ChatGPT API");
      }
    
      // Parse response
      const data = await response.json();
    
      // Update chat messages state with the response from ChatGPT
      setChatMessages(prevMessages => [...prevMessages, { message: data.choices[0].message.content, sender: "ChatGPT" }]);
    } catch (error) {
      console.error("Error processing user message with ChatGPT API:", error);
    } finally {
      // Clear typing indicator
      setIsChatbotTyping(false);
    }
  };

  // Function to handle user queries about inventory items
  const handleInventoryItemQuery = async (itemName) => {
    try {
      // Send GET request to inventory management API endpoint
      const response = await fetch("https://eefypintegration.azurewebsites.net/inventory/retrieveAllInventoryData");
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory data");
      }
      
      // Parse response
      const data = await response.json();
      
      // Find the requested item in inventory data
      const item = data.result.find(item => item.item.toLowerCase() === itemName.toLowerCase());
      
      if (!item) {
        return `${itemName} not found in inventory.`;
      }
      
      // Compose response message with item information
      return `You have ${item.quantity} ${item.units || "items"} of ${itemName} stored in ${item.location}.`;
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      return "An error occurred while fetching inventory data.";
    }
  };

  return (
    <BrowserRouter>
      <div className="App">
        <div className="AppGlass">
          <Sidebar />
          <Routes>
            <Route path="/" element={<MainDash />} />
            <Route path="/PlantDetails" element={<PlantDetails />} />
            <Route path="/Calendar" element={<Calendar />} />
            <Route path="/InventoryManagement" element={<InventoryManagement />} />
            <Route path="/HistoricalData" element={<HistoricalData />} />
            
          </Routes>
        </div>

        <div className="chat-button-container">
          <button className="chat-button" onClick={toggleChatbot}>
            <ChatBubble />
          </button>
        </div>

        <div className={isChatbotOpen ? "chatbot-popup" : "chatbot-popup hidden"}>
          {/* A container for the chat window */}
          <div style={{ bottom: 20, right: 20 }}>
            <MainContainer>
              <ChatContainer>
                <MessageList
                  typingIndicator={
                    isChatbotTyping ? <TypingIndicator content="ChatGPT is thinking" /> : null
                  }
                >
                  {chatMessages.map((message, i) => (
                    <Message
                      key={i}
                      model={message}
                      style={message.sender === "ChatGPT" ? { textAlign: "left" } : {}}
                    />
                  ))}
                </MessageList>
                <MessageInput placeholder="Type a message..." onSend={handleUserMessage} />
              </ChatContainer>
            </MainContainer>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

