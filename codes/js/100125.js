const { GoogleGenerativeAI } = require("@google/generative-ai");

// Debug log to check if API key is loaded
console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testGemini() {
  try {
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say hello and introduce yourself as an AI assistant!");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("Error testing Gemini:", error);
    if (error.status === 403) {
      console.log("Please check if your API key is valid and has access to Gemini API");
    }
  }
}

testGemini(); 