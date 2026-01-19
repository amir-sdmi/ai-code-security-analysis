import {METHODS} from "./constants"
// import { i18n } from 'next-i18next';
import { INITIALS } from './initials';

export async function getChatGptAnswer(message,user) {

  // console.log("message,user",message,user)
  // i18n?.init();

  // if(messagesWithSender)

  // const chatGptApiFormattedMessages = messagesWithSender.map(messageObject => {
  //   return {
  //     role: messageObject.sender === 'ChatGPT' ? 'assistant' : 'user',
  //     content: messageObject.message,
  //   };
  // });

  // const systemMessageToSetChatGptBehaviour = {
  //   role: 'system',
  //   content: INITIALS.systemMessage,
  // };

  // const chatGptApiMessages = [
  //   systemMessageToSetChatGptBehaviour, // The system message DEFINES the logic of our chatGPT
  //   ...chatGptApiFormattedMessages, // The messages from our chat with ChatGPT
  // ];

  try {
    const response = await fetch(`http://127.0.0.1:7654/api/question`, {
      method: 'POST',
      // mode: 'no-cors',
      headers: {
        // Authorization: `Bearer ${"openapi key"}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user,
        question : message,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // const { choices } = data;
    // console.log(data)

    return data?.answer;
  } catch (error) {
    console.error('Error:', error);
  }
}
