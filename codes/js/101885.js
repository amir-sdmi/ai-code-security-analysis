// // // Please install OpenAI SDK first: `npm install openai`


// // export const maxDuration=60;



// // import connectDB from "@/config/db";
// // import Chat from "@/models/Chat";
// // // import { getAuth } from "@clerk/nextjs/dist/types/server";
// // import { NextResponse } from "next/server";
// // import OpenAI from "openai";
// // import { getAuth } from "@clerk/nextjs/server";

// // // Initialize OpenAI client with DeepSeek API key and base URL

// // const openai = new OpenAI({
// //     baseURL: 'https://api.deepseek.com',
// //     apiKey: process.env.DEEPSEEK_API_KEY
// // });

// // export async function POST(req) {
// //     try {
// //         const { userId } = getAuth(req);

// //         // Extract chatId and prompt from the request body
// //         const { chatId, prompt } = await req.json();

// //         if (!userId) {
// //             return NextResponse.json({
// //                 success: false,
// //                 message: "User not authenticated",
// //             })
// //         }

// //         // Find the chat document in the database on userId and chatId
// //         await connectDB();
// //         const data = await Chat.findOne({ userId, _id: chatId })

// //         // Create a user message object
// //         const userPrompt = {
// //             role: "user",
// //             content: prompt,
// //             timestamp: Date.now()
// //         }

// //         data.messages.push(userPrompt);

// //         // call the Deepseek API to get a chat completion

// //         const completion = await openai.chat.completions.create({
// //             messages: [{ role: "user", content: prompt}],
// //             model: "deepseek-chat",
// //             store:true,

// //         });

// //         const message = completion.choices[0].message;
// //         message.timestamp = Date.now()
// //         data.messages.push(message);
// //         data.save();


// //         return NextResponse.json({success:true, data: message})

// //     }
// //     catch (error) {
// //         return NextResponse.json({success:false, error:error.message})
// //     }
// // }




// // /app/api/chat/ai/route.js (or /pages/api/chat/ai.js in pages-based routing)

// import connectDB from "@/config/db";
// import Chat from "@/models/Chat";
// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import { getAuth } from "@clerk/nextjs/server";



// const token ="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";
// const endpoint = "https://models.github.ai/inference";
// const modelName = "gpt-4o";

// const client = createOpenAI({baseURL: endpoint, apiKey:token});



// // DeepSeek (OpenAI-compatible) client
// const openai = new OpenAI({
//   baseURL: "https://api.deepseek.com",
//   apiKey: process.env.DEEPSEEK_API_KEY,
// });

// // Maximum runtime in Vercel Edge
// export const maxDuration = 60;

// // Route handler
// export async function POST(req) {
//   try {
//     // Authenticate Clerk user
//     const { userId } = getAuth(req);
//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         message: "User not authenticated",
//       });
//     }

//     // Parse prompt and chatId from body
//     const { chatId, prompt } = await req.json();
//     if (!chatId || !prompt) {
//       return NextResponse.json({
//         success: false,
//         message: "chatId and prompt are required",
//       });
//     }

//     // Connect to DB and fetch chat
//     await connectDB();
//     const chat = await Chat.findOne({ userId, _id: chatId });
//     if (!chat) {
//       return NextResponse.json({
//         success: false,
//         message: "Chat not found",
//       });
//     }

//     // Create user message
//     const userMessage = {
//       role: "user",
//       content: prompt,
//       timestamp: Date.now(),
//     };
//     chat.messages.push(userMessage);

//     // Call DeepSeek AI
//     const completion = await client.chat.completions.create({
//       model: "deepseek-chat",
//       messages: chat.messages, // use full conversation
//       store: true,
//     });

//     const assistantMessage = {
//       ...completion.choices[0].message,
//       timestamp: Date.now(),
//     };
//     chat.messages.push(assistantMessage);

//     await chat.save();

//     return NextResponse.json({
//       success: true,
//       data: assistantMessage,
//     });
//   } catch (error) {
//     console.error("AI Chat Error:", error);
//     return NextResponse.json({
//       success: false,
//       message: error?.response?.data?.error?.message || error.message,
//     });
//   }
// }




import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";

// Setup GitHub-hosted OpenAI-compatible model
const openai = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN, // set this in .env.local
});

export const maxDuration = 60; // Optional

export async function POST(req) {
  try {
    // ✅ Fix: await getAuth
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    const { chatId, prompt } = await req.json();
    if (!chatId || !prompt) {
      return NextResponse.json({ success: false, message: "chatId and prompt are required" });
    }

    await connectDB();
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    // ✅ Add user's message to DB
    const userMessage = { role: "user", content: prompt, timestamp: Date.now() };
    chat.messages.push(userMessage);

    // ✅ Strip timestamp before sending to OpenAI
    const cleanMessages = chat.messages.map(({ role, content }) => ({ role, content }));

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "system", content: "" }, ...cleanMessages],
      temperature: 1,
      max_tokens: 4096,
      top_p: 1,
    });

    const assistantMessage = {
      ...completion.choices[0].message,
      timestamp: Date.now(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    return NextResponse.json({ success: true, data: assistantMessage });
  } catch (error) {
    console.error("AI Chat Error:", error.response?.data || error.message || error);
    return NextResponse.json({
      success: false,
      message: error?.response?.data?.error?.message || error.message || "Internal Server Error",
    });
  }
}
