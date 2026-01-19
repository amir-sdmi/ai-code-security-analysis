

// import { NextRequest, NextResponse } from "next/server";

// import {
//   CopilotRuntime,
//   GroqAdapter,
//   copilotRuntimeNextJSAppRouterEndpoint,
// } from "@copilotkit/runtime";

// import Groq from "groq-sdk";

// // Initialize Groq SDK
// const groq = new Groq({
//   apiKey: process.env.NEXT_PUBLIC_GROQ_CLOUD_API_KEY,
// });

// // Use Copilot Runtime (no onResponse here!)
// const copilotKit = new CopilotRuntime();

// // Groq Adapter with system prompt and optional post-processing

// const serviceAdapter = new GroqAdapter({
//   groq,
//   model: "llama-3-70b-8192",
// });

// App Router POST endpoint
// export async function POST(req: NextRequest): Promise<NextResponse> {
//   const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
//     runtime: copilotKit,
//     serviceAdapter,
//     endpoint: "/api/copilotkit",
//   });

//   const response = await handleRequest(req);

//   // Make sure to return a proper NextResponse
//   return new NextResponse(response.body, {
//     status: response.status,
//     headers: response.headers,
//   });
// }


// export async function POST(req: NextRequest): Promise<NextResponse> {
//   try {
//     // Read original JSON body
//     const json = await req.json();

//     // Your system prompt text
//     const systemPrompt = `
// You are an AI-powered code generator integrated into a web-based IDE. Your task is to generate project files and code based on user commands.

// When generating files, use this exact format:

// FILE: filename.ext
// CODE:
// [code content here]

// For multiple files, separate them with "---".

// Example response:
// I'll create a React component:

// FILE: Button.jsx
// CODE:
// import React from 'react';

// const Button = () => {
//   return (
//     <button className="btn">Click me</button>
//   );
// };

// export default Button;

// Important rules:
// - Always include both FILE: and CODE: markers
// - Use appropriate file extensions
// - Generate complete, working code
// - Maintain proper indentation
// - Explain what you're creating before showing the files
// - Make sure code is syntactically correct
// `;

//     // Assuming the user prompt is in json.prompt (adjust if different)
//     const userPrompt = json.prompt || "";

//     // Combine system prompt + user prompt
//     const combinedPrompt = systemPrompt + "\n\n" + userPrompt;

//     // Create a new Request with the modified prompt
//     const modifiedRequest = new Request(req.url, {
//       method: req.method,
//       headers: req.headers,
//       body: JSON.stringify({
//         ...json,
//         prompt: combinedPrompt,
//       }),
//     });

//     const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
//       runtime: copilotKit,
//       serviceAdapter,
//       endpoint: "/api/copilotkit",
//     });

//     const response = await handleRequest(modifiedRequest);

//     return new NextResponse(response.body, {
//       status: response.status,
//       headers: response.headers,
//     });
//   } catch (error) {
//     console.error("Error in /api/copilotkit:", error);
//     return new NextResponse(
//       JSON.stringify({ error: "Internal Server Error" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }



// import {
//   CopilotRuntime,
//   GroqAdapter,
//   copilotRuntimeNextJSAppRouterEndpoint,
// } from "@copilotkit/runtime";

// import Groq from "groq-sdk";
// import { NextRequest } from "next/server";

// const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_CLOUD_API_KEY });

// const copilotKit = new CopilotRuntime({
//   asyn ({ message, context }:{ message: any, context:any }) {
//     try {
//       // Extract any file operations from the message and process them
//       const fileBlocks = message.content.split("---");
//       if (fileBlocks.length > 0) {
//         // Format the response to use processFiles action
//         return {
//           content: `@processFiles(response: \\'${message.content}'\\ )`
//         };
//       }
//       return message;
//     } catch (error) {
//       console.error("Error in onResponse:", error);
//       return message;
//     }
//   },
// });

// const copilotKit = new CopilotRuntime();

// const serviceAdapter = new GroqAdapter({
//   groq,
//   model: "llama-3.3-70b-versatile",
// });

// export const POST = async (req: NextRequest) => {
//   const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
//     runtime: copilotKit,
//     serviceAdapter,
//     endpoint: "/api/copilotkit",
//   });

//   return handleRequest(req);
// };



// app/api/copilotkit/route.ts

import {
  CopilotRuntime,
  GroqAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import Groq from "groq-sdk";
import { NextRequest } from "next/server";

// 1. Initialize Groq SDK with API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY});

// 2. Initialize CopilotKit runtime
const copilotKit = new CopilotRuntime({
  // Optional lifecycle hooks can go here (like onBeforeRequest / onAfterRequest)
});

// 3. Set up Groq Adapter
const serviceAdapter = new GroqAdapter({
  groq,
  model: "llama-3.3-70b-versatile", // Make sure the model is supported by Groq
});

// 4. Create POST handler using copilotRuntimeNextJSAppRouterEndpoint
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotKit,
    serviceAdapter,
    endpoint: "/api/copilotkit", // Optional but helpful for logging
  });

  return handleRequest(req);
};
