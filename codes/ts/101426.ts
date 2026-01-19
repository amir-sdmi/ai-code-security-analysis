import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI, AzureOpenAI } from "openai";

interface DataType {
  selectPrompt?: string;
  model?: string;
  apiKey?: string;
  url?: string;
  deployment?:string;
}
export const generateResponse = async (selectPrompt?: string) => {
  const getAiConfig = await strapi
    .query("plugin::excerpt-and-seo-generator.excerpt-seo-content-type")
    .findOne();
  const data = {
    selectPrompt,
    model: getAiConfig?.model,
    apiKey: getAiConfig?.apiKey,
    url: getAiConfig?.url,
    deployment:getAiConfig?.deployment
  };
  let result;
  switch (getAiConfig?.product) {
    case "chatgpt":
      result = await GenerateUsingChatGPT(data);
      break;
    case "gemini":
      result = await GenerateUsingGemini(data);
      break;
    case "groq":
      result = await GenerateUsingGroq(data);
      break;
    case "azure-chatgpt":
      result = await GenerateUsingAzureAI(data);
      break;
    default:
      console.error("Invalid product selected.");
  }
  return result;
};
const GenerateUsingChatGPT = async (data?: DataType) => {
  const openai = new OpenAI({
    apiKey: data?.apiKey, // Pass the OpenAI API key
  });
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: data?.model || "gpt-3.5-turbo", // Default to GPT-3.5-Turbo
      messages: [
        {
          role: "user",
          content: data?.selectPrompt || "",
        },
      ],
    });
    const response = chatCompletion?.choices[0]?.message;
    console.log(">>> log ChatGPT data", response);
    return response;
  } catch (error) {
    console.error(
      "Error with ChatGPTs:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate response from ChatGPT.");
  }
};

const GenerateUsingGemini = async (data?: DataType) => {
  try {
    const genAI = new GoogleGenerativeAI(data?.apiKey);
    const model = genAI.getGenerativeModel({ model: data?.model });
    const result = await model.generateContent(data?.selectPrompt);
    const response = result?.response?.text();
    return response;
  } catch (error) {
    console.error("Error with Gemini:", error.response?.data || error.message);
    throw new Error("Failed to generate response from Gemini.");
  }
};

const GenerateUsingGroq = async (data?: DataType) => {
  try {
    const groq = new Groq({
      apiKey: data?.apiKey,
    });
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: data?.selectPrompt || "",
        },
      ],
      model: data?.model || "llama3-8b-8192",
    });
    const response = chatCompletion?.choices[0]?.message?.content;
    return response;
  } catch (error) {
    console.error("Error with Groq:", error.response?.data || error.message);
    throw new Error("Failed to generate response from Groq.");
  }
};

const GenerateUsingAzureAI = async (data?: DataType) => {
  const openai = new AzureOpenAI({
    endpoint: data?.url,
    apiKey: data?.apiKey,
    apiVersion: data?.model,
    deployment: data?.deployment,
  });
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "", // Default to GPT-3.5-Turbo
      messages: [
        {
          role: "user",
          content: data?.selectPrompt || "",
        },
      ],
    });
    const response = chatCompletion?.choices[0]?.message;
    return response?.content;
  } catch (error) {
    console.error("Error with ChatGPT:", error.response?.data || error.message,data);
    throw new Error("Failed to generate response from ChatGPT.");
  }
};
