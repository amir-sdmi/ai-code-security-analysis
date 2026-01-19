import React, { useState, useEffect, useRef, useCallback } from "react";
import { connect } from "react-redux";
import { sendMessage, addUserMessage } from "../actions"; // Correct this path

function Chatbot({ messages, sendMessage, addUserMessage, username }) {
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null); // Ref for the messages container
  const [isDragging, setIsDragging] = useState(false);
  const chatbotRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 }); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
 
  useEffect(() => {
    // Set the initial position after the component has mounted
    
    setPosition({ x: window.innerWidth - 350, y: window.innerHeight - 500 });
  }, []);
  
 
  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Calculate the offset from the mouse position to the top-left corner of the chatbot
    // const rect = chatbotRef.current.getBoundingClientRect();
    setDragOffset({
       x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    // chatbotRef.current.style.position = 'fixed';
  };


  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      // Calculate new position
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Get viewport dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Get chatbot dimensions
    const chatbotWidth = chatbotRef.current.offsetWidth;
    const chatbotHeight = chatbotRef.current.offsetHeight;

    // Ensure the chatbot stays within the bounds of the viewport
    newX = Math.max(0, Math.min(newX, screenWidth - chatbotWidth));
    newY = Math.max(0, Math.min(newY, screenHeight - chatbotHeight));

    setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset.x, dragOffset.y]);


   const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  

  useEffect(() => {
    scrollToBottom();  // Scroll to bottom whenever messages update
  }, [messages]); // The dependency array ensures useEffect is called whenever 'messages' changes

  const handleSendMessage = async message => {
    // Dispatch Redux action here.
    addUserMessage(message); // Update Redux state with user's message
    sendMessage(message);
  };

   useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

 

    

  return (
    <div className="chatbot"
    ref={chatbotRef}
    onMouseDown={handleMouseDown}
    style={{left: `${position.x}px`, top: `${position.y}px`, 
           position: 'fixed',
           cursor: isDragging ? 'grabbing' : 'grab'}}>
      {!showChat
        ? <button className="chatbot-trigger" onClick={() => setShowChat(true)}>
            Open Chatbot
          </button>
        : <div className="chat-modal">
          <button
              className="chat-modal-close-btn"
              onClick={() => setShowChat(false)}
            >
              Close (X)
            </button>
          <div className="resize-grip" ></div>
            
            <div className="messages">
              {messages.map((msg, index) =>
                <div
                  key={index}
                  className={
                    msg.type === "user"
                      ? "user-message-container"
                      : "bot-message-container"
                  }
                >
                  <div className="message-header">
                    {msg.type === "user" ? username : "Spotbot"}
                  </div>
                  <p
                    className={
                      msg.type === "user" ? "user-message" : "bot-message"
                    }
                  >
                    {msg.text}
                  </p>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="input-container">
              <input
              type="text"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSendMessage(e.target.value);
                  e.target.value = "";
                }
              }}
              placeholder="Type your message..."
            />            
            </div>
            <span className="powered-by">Powered by ChatGPT</span>   
          </div>}          
    </div>
  );
}

// Mapping the Redux state to props to get bot's response
const mapStateToProps = state => {
  console.log("Entire Redux State:", state);
  // Get the latest message from the chatbot array.

  // You'll need to know where the bot's reply is stored in your Redux state.
  return {
    messages: state.chatbot.messages,
    botReply:
      state.chatbot.length > 0 ? state.chatbot[state.chatbot.length - 1] : null
  }; // Change the key accordingly
};

// Instead of passing the action directly, let's define it in a mapDispatchToProps function
const mapDispatchToProps = dispatch => {
  return {
    addUserMessage: message => dispatch(addUserMessage(message)),
    sendMessage: message => dispatch(sendMessage(message))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Chatbot);
