require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const openai = new OpenAI({
  // apiKey: process.env.XAI_API_KEY,
    apiKey: process.env.OPENAI_API_KEY,
  // baseURL: "https://api.x.ai/v1",
});

// const generateAIResponse = async (userMessage) => {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: "grok-3",  // Use Grok model
//       messages: [
//         {
//           role: "system",
//           content: ``,
//         },
//         {
//           role: "user",
//           content: userMessage,
//         },
//       ],
//       max_tokens: 300,
//       temperature: 0.7,
//     });

//     return completion.choices[0].message.content.trim();
//   } catch (error) {
//     console.error("❌ Error in generateAIResponse:", error);
//     return "Hmm... something broke. Try again later...";
//   }
// };

const generateAIResponse = async (userMessage) => {
  try {
    // 1. Create a thread
    const thread = await openai.beta.threads.create();

    // 2. Add the user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage,
    });

    // 3. Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID, 
    });

    // 4. Poll for completion
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (runStatus.status !== "completed");

    // 5. Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data
      .reverse()
      .find((msg) => msg.role === "assistant");

    return lastMessage?.content[0]?.text?.value ?? "No response from assistant.";
  } catch (error) {
    console.error("❌ Error in generateAIResponse:", error);
    return "Hmm... something broke. Try again later...";
  }
};


// ✅ Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("📩 User Input:", message);

    const botReply = await generateAIResponse(message);

    res.json({ reply: botReply });
  } catch (error) {
    console.error("❌ Error in /chat endpoint:", error);
    res.status(500).json({
      reply: "Oops! Something went wrong. Please contact us at (972) 362-8468.",
    });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
