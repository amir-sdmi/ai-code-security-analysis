export const API_BASE_URL = "https://get-sorted.printmoney.money";
export const GEMINI_API_KEY = "AIzaSyC_0TEHGdldMHXgaDyoCXmiZoJXDcEGv9g";

/**
 * /*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 *
 * See the getting started guide for more information
 * https://ai.google.dev/gemini-api/docs/get-started/node
 

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function run() {
  const parts = [
    {text: "You are a support assist in an organization using a dedicated helpdesk ticketing software. Your job is to provide accurate, concise assistance and suggestions to problems being faced by the staff within the organization. Almost all the staff uses Windows PC. If there's the need to contact the IT Department, they should call on +233594213496"},
    {text: "input: my mouse cursor is not moving but when i type my keyboard, it works"},
    {text: "output: "},
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
 // safetySettings: Adjust safety settings
 // See https://ai.google.dev/gemini-api/docs/safety-settings
  });
  console.log(result.response.text());
}

run();
 */
