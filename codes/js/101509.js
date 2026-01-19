"use client";
import Image from 'next/image'

import React, { useState } from "react";

import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

import Input from "@material-ui/core/Input";

import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';


const API_KEY = process.env.OPENAI_API_KEY;
// "Explain things like you would to a 10 year old learning how to code."
const systemMessage = { //  Explain things like you're talking to a software professional with 5 years of experience.
  "role": "system", "content": "Explain things in Bengali language like Bengali is your mothertongue."
}

export default function Home() {
  const [text, setText] = useState("");

  const [messages, setMessages] = useState([
    {
      message: "হ্যালো, আমি বাংলা জিপিটি | আমকে যে কোন কিছু জিজ্ঞেস করুন | ",
      sentTime: "just now",
      sender: "ChatGPT"
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

    // Initial system message to determine ChatGPT functionality
    // How it responds, how it talks, etc.
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="flex flex-col items-center justify-between">
          <h1 className="fixed text-slate-950  text-4xl mb-5 left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-emerald-300 from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-emerald-50 lg:p-4 lg:dark:bg-zinc-800/30">
          বাংলা জিপিটি 
          </h1>
          <div className="flex h-{700} w-{600}">
            <MainContainer>
              <ChatContainer>       
                <MessageList 
                  scrollBehavior="smooth" 
                  typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing" /> : null}
                >
                  {messages.map((message, i) => {
                    console.log(message)
                    return <Message key={i} model={message} />
                  })}
                </MessageList>
                <MessageInput placeholder="Type message here" onSend={handleSend} />        
              </ChatContainer>
            </MainContainer>
          </div>
          <p className="flex mt-1 p-2 text-2xl">
          নিচে বাংলায় লিখে উপরে কপি পেস্ট করুন :
          </p>
          <ReactTransliterate
            className = "flex flex-grow bg-red-100 p-2 text-lg mt-4"
            // renderComponent={(props) => <textarea {...props} />}
            // renderComponent={(props) => {
            //   const inputRef = props.ref;
            //   delete props["ref"];
            //   return <Input {...props} inputRef={inputRef} />;
            // }}
            value={text}
            onChangeText={(text) => {
              setText(text);
            }}
            lang="bn"
          />
        </div>
      </div>
    </main>
  )
}
