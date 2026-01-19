import "./ChatStyles.css";
import { useState } from 'react'
import theavatar from "../assets/gamer.png";
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator , ConversationHeader,Avatar,avatarIco,VoiceCallButton,InfoButton
 } from '@chatscope/chat-ui-kit-react';

 //reference : https://www.youtube.com/watch?v=Lag9Pj_33hM
// my key to connect with chatgpt
const API_KEY = "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";


// role: user --> message from user
// assistant -> a response from chatgpt
// system - > 1 initial message defining how we talk to chatgpt
const systemMessage = { 
  "role": "system", "content": "Explain things like you're a doctor and pharmacist."
}


function Chat() {
     //  This initalizes our first messages.
    const [messages, setMessages] = useState([
        {
          message: "Hello, I am Joe from Support! Ask me anything!",
          sentTime: "just now",
          sender: "ChatGPT"
        }
      ]);

      //  This line uses the useState hook to declare a state variable named isTyping and a corresponding setter function named setIsTyping. 
      //  The useState function is called with an initial value of false, which means that isTyping will be initialized with false when the component is first rendered.
      const [isTyping, setIsTyping] = useState(false);
    

      // this function handles whenever the user presses send to show the message, wait for chatgpt respond and how it will be presented
      const handleSend = async (message) => {
        const newMessage = {
          message: message,
          direction: 'outgoing',
          sender: "user"
        };
    
        const newMessages = [...messages, newMessage];
        
        setMessages(newMessages);
    
        setIsTyping(true);
        await processMessageToChatGPT(newMessages);
      };
    

      // this function formats the messages into objects for chatgpt understand
      async function processMessageToChatGPT(chatMessages) { 
        let apiMessages = chatMessages.map((messageObject) => {
          let role = "";
          if (messageObject.sender === "ChatGPT") {
            role = "assistant";
          } else {
            role = "user";
          }
          return { role: role, content: messageObject.message}
        });
    
    
        //is an object that contains the information needed to interact with the OpenAI GPT-3.5 
        //Turbo language model for a chat-based conversation. 
        const apiRequestBody = {
          "model": "gpt-3.5-turbo",
          "messages": [
            systemMessage,  // The system message DEFINES the logic of our chatGPT
            ...apiMessages // The messages from our chat with ChatGPT
          ]
        }
    
        // this code performs a POST request to the OpenAI GPT-3 API, processes the response, 
        //and updates the component's state with the received chat message and sender information. The chat message is then displayed 
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
          setIsTyping(false);
        });
      }
    

  

      // the UI
      return (
    <div className="chat-with-text-container">
      <div className="text-column">
        <h2>Contact </h2>
        <p>123-456-7890</p>
        <h2>Chat Support </h2>
        <p>As you can see on your right, you can chat with our chat support representative Joe with any questions you have regarding CAS Polymedic.
          It is actually a CHATGPT Bot but it cannot be used publicly 
         
        </p>
        
        
      </div>
      <div className="map-column">
      <div style={{height: "500px" }}>
            <ChatContainer>
                <ConversationHeader>
                    <Avatar src={theavatar} name={"Joe"} />
                    <ConversationHeader.Content userName="Joe"  />
                <ConversationHeader.Actions>
                    <VoiceCallButton />
                </ConversationHeader.Actions>   
                </ConversationHeader>

                <MessageList 
                  scrollBehavior="smooth" 
                  typingIndicator={isTyping ? <TypingIndicator content="Joe is typing" /> : null}
                >
                  {messages.map((message, i) => {
                    console.log(message)
                    return <Message key={i} model={message} />
                  })}
                </MessageList>
           

                <MessageInput placeholder="Type message here" onSend={handleSend} />      

            </ChatContainer>
          </div>
      </div>
      
    </div>
      )
}

export default Chat;
