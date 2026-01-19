import React, { useState } from 'react'

import '@chatscope/chat-ui-kit-styles/dist/default/styles.css';

import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

const API_KEY = "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";
// "Explain things as a code helping assistant."
const systemMessage = { 
  "role": "system", "content": "Explain things as a code helping assistant."
}

// Define an array of software engineering-related terms
const softwareTerms = [
  "software development",
  "hello",
  "hi",
  "hey",
  "coding",
  "programming",
  "testing",
  "code",
  "scrum",
  "node",
  "software engineering",
  "software architecture",
  "software design",
  "software testing",
  "software maintenance",
  "software deployment",
  "software documentation",
  "software version control",
  "source code management",
  "agile methodology",
  "waterfall methodology",
  "object-oriented programming",
  "functional programming",
  "procedural programming",
  "declarative programming",
  "imperative programming",
  "concurrency",
  "multithreading",
  "parallelism",
  "distributed systems",
  "networking",
  "security",
  "encryption",
  "authentication",
  "authorization",
  "penetration testing",
  "vulnerability scanning",
  "web development",
  "frontend development",
  "backend development",
  "full-stack development",
  "database management",
  "relational databases",
  "non-relational databases",
  "SQL",
  "NoSQL",
  "cloud computing",
  "Amazon Web Services",
  "Microsoft Azure",
  "Google Cloud Platform",
  "serverless computing",
  "containerization",
  "virtualization",
  "machine learning",
  "artificial intelligence",
  "natural language processing",
  "data science",
  "big data",
  "Internet of Things",
  "blockchain",
  "cybersecurity",
  "ethical hacking",
  "algorithm",
  "application",
  "API",
  "bug",
  "cache",
  "class",
  "compiler",
  "database",
  "debugging",
  "deployment",
  "dependency",
  "encapsulation",
  "exception",
  "framework",
  "garbage collection",
  "GUI",
  "HTML",
  "HTTP",
  "IDE",
  "inheritance",
  "interface",
  "iteration",
  "JSON",
  "library",
  "linker",
  "load balancer",
  "logging",
  "loop",
  "microservice",
  "middleware",
  "module",
  "MVC",
  "namespace",
  "object",
  "OO",
  "operator",
  "ORM",
  "package",
  "parsing",
  "polymorphism",
  "query",
  "regex",
  "REST",
  "router",
  "routing",
  "runtime",
  "serialization",
  "serverless",
  "stack trace",
  "state",
  "syntax",
  "thread",
  "UI",
  "unit testing",
  "validation",
  "variable",
  "java",
  "Spring",
  "Javascript",
  "python",
  "C++",
  "React"
  
  
  // Add more terms here...
];

// Function to check if a string contains any of the softwareTerms
function isSoftwareRelated(input) {
  for (let term of softwareTerms) {
    if (input.toLowerCase().includes(term)) {
      return true;
    }
  }
  return false;
}

function ChatBot() {
  const [messages, setMessages] = useState([
    {
      message: "This tool analyses your input for any programming related terms and will provide responses if any such terms are detected. You can discuss topics like programming concepts, technical specifications, software architectures etc. Avoid generic sentences, or it will not reply. You can also experiment by entering different content to see the responses and you will get better at framing your inputs. PullBot aims to assist you in programming, debugging and provide helpful responses.",
      sentTime: "just now",
      sender: "PullBot"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
 // Handles sending a message
  const handleSend = async (message) => {
    // Create a new message object with the user's message
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    // Set the state with the updated messages array
    setMessages(newMessages);
// If the user's message is software-related, show the typing indicator 
    if (isSoftwareRelated(message)) {
      setIsTyping(true);
      await processMessageToChatGPT(newMessages);
    } else {
      setMessages([
        ...newMessages,
        {
          message: "Sorry, I can't answer that.",
          sender: "PullBot"
        }
      ]);
    }
  };
// Processes the user's message with ChatGPT
  async function processMessageToChatGPT(chatMessages) { 
    // Format messages for chatGPT API
    // API is expecting objects in format of { role: "user" or "assistant", "content": "message here"}
    // So we need to reformat

    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
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
    //Make a POST request to the ChatGPT API and add the response to the messages array
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
//Now using chatscope for the containers, message list and input.
  return (
    <div className="App">
      <div style={{ position:"relative", height: "590px", width: "590px",  }}>
        <MainContainer> 
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="PullBot is typing" /> : null}
            >
              {messages.map((message, i) => {
                console.log(message)
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" attachButton={false} onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default ChatBot;