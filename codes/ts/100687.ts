import OpenAI from "openai";
require("dotenv").config();

const oApiKey = process.env.OPEN_API_KEY;

const openai = new OpenAI({ apiKey: oApiKey });

const Request = function (Request: any) {
  let name = Request.name;
  name = name;
};

/**
 * Creates a description for a cocktail using ChatGPT.
 * @param title The title of the cocktail.
 * @returns The description for the cocktail from ChatGPT
 * @author Veren Villegas
 */
Request.sendRequest = async (request: string) => {
  try {
    const completion = await getChatGPTResponseWithContext(request);
    console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    return "Error: " + error;
  }
};

async function getChatGPTResponseWithContext(
  userMessage: string | OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
  if (typeof userMessage === "string") {
    completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `${userMessage}`,
        },
      ],
      model: "gpt-3.5-turbo-1106",
    });
  } else {
    completion = await openai.chat.completions.create({
      messages: userMessage,
      model: "gpt-3.5-turbo-1106",
    });
  }

  return completion;
}

module.exports = Request;
