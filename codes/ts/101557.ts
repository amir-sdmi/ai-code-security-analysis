// app/api/generate-sop/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabaseClient'; // Server-side client for auth checks if needed

// This tells Vercel to make this a dynamic route
export const dynamic = 'force-dynamic';

// Define the structure of the expected AI output for better parsing
interface SOPOutput {
  title: string;
  purpose: string;
  steps: string[]; // Array of strings, each being a step
  tools_required: string[]; // Array of strings
  responsible_party: string;
}

// Helper function to parse the AI's text output into a structured object
// This is CRITICAL and might need a lot of refinement based on AI's actual output
function parseSOPOutput(text: string): SOPOutput {
  // Basic parsing - this is a placeholder and needs to be robust
  // You might need to use regex or more structured parsing if the AI output varies
  // Or, ideally, instruct the AI to output JSON directly.
  // Example of instructing AI for JSON: "...Output the SOP in JSON format with keys: title, purpose, steps (array of strings), tools_required (array of strings), responsible_party."

  const output: SOPOutput = {
    title: "Untitled SOP",
    purpose: "",
    steps: [],
    tools_required: [],
    responsible_party: "Not Specified"
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let currentSection: keyof SOPOutput | null = null;

  for (const line of lines) {
    if (line.toLowerCase().startsWith("title:")) {
      output.title = line.substring("title:".length).trim();
      currentSection = null;
    } else if (line.toLowerCase().startsWith("purpose:")) {
      output.purpose = line.substring("purpose:".length).trim();
      currentSection = null;
    } else if (line.toLowerCase().startsWith("steps:")) {
      currentSection = "steps";
    } else if (line.toLowerCase().startsWith("tools required:") || line.toLowerCase().startsWith("tools needed:")) {
      output.tools_required = line.substring(line.indexOf(":") + 1).split(',').map(tool => tool.trim()).filter(t => t);
      currentSection = null; // Assuming tools are a single line comma separated
    } else if (line.toLowerCase().startsWith("responsible party:")) {
      output.responsible_party = line.substring("responsible party:".length).trim();
      currentSection = null;
    } else if (currentSection === "steps") {
      // Assuming steps are numbered or bulleted
      const stepMatch = line.match(/^\d+\.\s*(.*)/) || line.match(/^-\s*(.*)/) || line.match(/^\*\s*(.*)/);
      if (stepMatch && stepMatch[1]) {
        output.steps.push(stepMatch[1].trim());
      } else if (line) { // if it doesn't match a numbered/bulleted list but is under "Steps:"
        output.steps.push(line.trim());
      }
    }
  }
  // Fallback if parsing specific sections fails but we have content
  if (!output.title && lines.length > 0) output.title = lines[0]; // Take first line as title
  if (!output.purpose && lines.length > 1) output.purpose = lines[1]; // Take second as purpose

  return output;
}


export async function POST(req: NextRequest) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  // Optional: Check if user is authenticated (if you want to rate limit or tie generations to users server-side)
  // const supabase = createClient(cookies()); // createServerClient from @supabase/ssr for Route Handlers
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const { userInput } = await req.json();
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    const prompt = `You are an expert business operations analyst. Given this description, create a clean, step-by-step SOP.
    The output should be structured with clear headings for:
    Title: [SOP Title]
    Purpose: [Purpose of the SOP]
    Steps:
    [Detailed Step 1]
    [Detailed Step 2]
    ...
    Tools Required: [Tool 1, Tool 2, ...]
    Responsible Party: [Role or Person]
    Strictly follow this format. Do not add any conversational fluff before or after the SOP content.
    Input: ${userInput}
    Output:`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3-0324:free", // Or "deepseek/deepseek-coder" if it's better for structured output. Test which deepseek model works best. The prompt said "deepseek/deepseek-r1-zero:free" which might be a typo, often it's `deepseek/deepseek-chat` or `deepseek/deepseek-coder`. Let's use deepseek-chat.
        // For a specific free model, you'd check OpenRouter's model list. If `deepseek/deepseek-r1-zero:free` is a valid alias, use that.
        // Let's assume it's "deepseek/deepseek-chat" or "openai/gpt-3.5-turbo-1106" if deepseek isn't available or free.
        // "model": "openai/gpt-3.5-turbo", // Example fallback, check OpenRouter for free models
        "messages": [
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenRouter API Error:", response.status, errorBody);
      return NextResponse.json({ error: `Failed to generate SOP. API Error: ${response.statusText} - ${errorBody}` }, { status: response.status });
    }

    const data = await response.json();
    const rawGeneratedText = data.choices[0]?.message?.content;

    if (!rawGeneratedText) {
      return NextResponse.json({ error: 'No content in AI response' }, { status: 500 });
    }

    const parsedSop = parseSOPOutput(rawGeneratedText);

    // Return both raw and parsed for flexibility on the client
    return NextResponse.json({ parsedSop, rawGeneratedText });

  } catch (error: unknown) {
    console.error("Error in generate-sop API:", error);
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// ```
// **IMPORTANT AI Prompting Note:**
// To make `parseSOPOutput` more reliable, you can try to make the AI output JSON directly.
// Modify the prompt:
// `...Output: A cleanly formatted SOP. The output MUST be a JSON object with the following keys: "title" (string), "purpose" (string), "steps" (array of strings), "tools_required" (array of strings), "responsible_party" (string). Do not include any other text or markdown formatting outside of this JSON object.`
// If you do this, then in the API route:
// `const parsedSop = JSON.parse(rawGeneratedText);` (add try-catch for JSON.parse)