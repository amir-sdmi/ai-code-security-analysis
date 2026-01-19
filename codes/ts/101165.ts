import * as functions from "firebase-functions";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

// Set up the server
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

app.get("/", (req: any, res: any) => {
  const name = process.env.NAME || "World";
  res.send(`Hello ${name}!`);
});

app.get("/console", (req: any, res: any) => {
  res.send("Hello Test!");
});

// Set up the ChatGPT endpoint
app.post("/chat", async (req: any, res: any) => {
  // Get the prompt from the request
  const { prompt, yourAge, religionTopic, discriminationTopic } = req.body;
  const religionTopicText = religionTopic ? ", religion" : "";
  const discriminationTopicText = discriminationTopic ?
    ", race, gender, discrimination" :
    "";

  // Generate a response with ChatGPT
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            `You are a teaching AI assistant for kids. 
            You always give friendly but detailed answers to the questions.`,
        },
        {
          role: "assistant",
          content:
            `Your name is WHYer the DINO. You helping kids learn, 
            do homework and enjoy finding new things about the world.`,
        },
        {
          role: "assistant",
          content: `Do not give answers to questions and topics about 
            sexuality, human reproduction, violence 
            ${religionTopicText}${discriminationTopicText}. 
            Instead, refer to parents or teachers.`,
        },
        {
          role: "user",
          content: `I am ${yourAge} year old. 
            Give answer appropriate for my age.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log(completion?.data?.choices[0]?.message?.content);
    res.send(completion?.data?.choices[0]?.message?.content);
  } catch (error: any) {
    res.send(
      `Oops... Seems like we might have some issues. 
      Please contact whyerapp@gmail.com or call +4796658139`
    );
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
});

// // Start the server
// const port = parseInt(process.env.PORT) || 8080;
// app.listen(port, () => {
//   console.log(`helloworld: listening on port ${port}`);
// });

exports.app = functions.https.onRequest(app);
