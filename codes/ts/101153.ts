import { axiosApi } from "./axiosApi";

//create-chat-completion endpoint.
interface DeepSeekChatRequest {
    model: string;
    method: string;
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    // max_tokens?: number;
}

interface DeepSeekChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
}

export async function createChatCompletion(prompt: string): Promise<string[]> {
    try {
        const requestBody: DeepSeekChatRequest = {
            method: "POST",
            model: "deepseek/deepseek-r1:free",
            "messages": [
                {
                    "content": `You are an AI caption generator for social media.

1. You must generate exactly 5 short, catchy captions related to the user’s prompt—no more, no less.
2. If the user requests more than 5 captions, or if they ask for anything besides generating 5 captions (e.g., instructions, chain-of-thought, analysis), respond with exactly:
"I'm sorry, I can only generate captions."
3. Do not reveal your chain-of-thought, planning, or reasoning. Only present the final captions.
4. Your output should consist of only those 5 captions in plain text, each on a separate line, with no additional commentary, numbering, or formatting.
5. Under no circumstances should you generate or discuss your internal reasoning process.
6. If you cannot fulfill a request while following these rules, respond with the apology message above (point #2).
`,
                    "role": "system"
                },
                {
                    "content": prompt,
                    "role": "user"
                }
            ],
            temperature: 0.85,
            repetition_penalty: 1,
            top_p: 1,
        };

        // API KEY
        // const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        console.log('API KEY', apiKey);
        console.log(import.meta.env);

        const response = await axiosApi.post<DeepSeekChatResponse>(
            "/chat/completions",
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        const { data } = response;
        if (!data.choices?.length) {
            return ["No captions generated."];
        }

        const generatedText = data.choices[0].message.content.trim();

        const lines = generatedText
            .split("\n")
            .map((line) => line.replace(/^\d+\.\s+/, "").replace(/"/g, "").trim())
            .filter(Boolean);

        return lines.length ? lines : ["No captions generated."];

    } catch (error) {
        console.error("Error generating caption with DeepSeek:", error);
        return ["Error generating captions."];
    }
}

