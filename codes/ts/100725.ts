
import type { NextApiRequest, NextApiResponse } from "next";
// import {Configuration, OpenAIApi} from "openai"

const systemMessage = { //  Explain things like you're talking to a software professional with 5 years of experience.
    "role": "system", "content": "Explain things like you're talking to a software professional with 2 years of experience."
  }

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { chatMessages } = req.body;
    console.log("🚀 ~ file: chatbot.ts:14 ~ chatMessages:", chatMessages)

    let apiMessages = chatMessages?.map((messageObject:{sender:string, message:string}) => {
        let role = "";
        if (messageObject.sender === "ChatGPT") {
          role = "assistant";
        } else {
          role = "user";
        }
        return { role: role, content: messageObject.message}
      });

    let apiRequestBody = {
        model: "gpt-3.5-turbo",
        messages: [
            systemMessage,  // The system message DEFINES the logic of our chatGPT
            ...apiMessages // The messages from our chat with ChatGPT
          ]
    }

    // const configuration = new Configuration({
    //     apiKey: process.env.OPENAI_API_KEY
    // })

    const chatresp = await fetch("https://api.openai.com/v1/engines/davinci/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(apiRequestBody)
    })

    const oa_res = await chatresp.json()
    
    // const openai = new OpenAIApi(configuration);
    // const oa_res = await openai.createCompletion(apiRequestBody)

    res.status(200).json({
        message: oa_res.data.choices[0].text,
        chatMessages: chatMessages,
        sender: "ChatGPT"
    });
}