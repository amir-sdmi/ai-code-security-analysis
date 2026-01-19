import React from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "./Chatbox.scss";
import {
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypeIndicator,
  MainContainer,
} from "@chatscope/chat-ui-kit-react";

const API_KEY = "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"

const systemMessage = { 
  "role": "system", 
  "content": "The following is a conversation with an AI assistant that can have meaningful conversations with users. The assistant is helpful, empathic, and friendly. Its objective is to make the user feel better by feeling heard. With each response, the AI assisstant prompts the user to continue the conversation in a natural way"
}



const Chatbox = ({ props }) => {
  const [messages, setMessages] = React.useState(() => {
    if (props) {
      return [
        {
          message: props,
          sender: "user",
          direction: "outgoing",
        },
      ];
    } else
      return [
        {
          message: "Hello, how are you?",
          sender: "Chatbot",
        },
      ];
  });

  const [isTyping, setIsTyping] = React.useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };
    const newMessages = [...messages, newMessage];

    setMessages(newMessages);

    setIsTyping(true);

    await processMessageToChatGPT(newMessages)
  };

  async function processMessageToChatGPT(chatMessages) { // messages is an array of messages
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
      // "model": "davinci:ft-personal-2023-05-05-16-11-46",
      // "prompt": "The following is a conversation with an AI assistant that can have meaningful conversations with users. The assistant is helpful, empathic, and friendly. Its objective is to make the user feel better by feeling heard. With each response, the AI assisstant prompts the user to continue the conversation in a natural way",
      // "temperature": 0.7,
      // "max_tokens": 256,
      // "top_p": 1,
      // "frequency_penalty": 0,
      // "presence_penalty": 0,
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
      setIsTyping(false);
    });
  }



  return (
    <div
      className="absolute h-5/6 w-full md:py-7 sm:py-3 md:px-72 sm:px-28 px-14 py-3"
      // style={{
      //   position: "relative",
      //   height: "500px",
      //   width: "100%",
      //   padding: "50px 300px",
      // }}
    >
      <MainContainer className="rounded-xl shadow-md">
        <ChatContainer>
          <MessageList className="py-5">
            {messages.map((message, i) => {
              return <Message key={i} model={message} />;
            })}
          </MessageList>
        </ChatContainer>
      </MainContainer>
      <MessageInput
        placeholder="Type your message"
        onSend={handleSend}
        className="rounded-full sm:mt-3 shadow-md bg-white  mt-3"
      ></MessageInput>
    </div>
  );
};

export default Chatbox;
