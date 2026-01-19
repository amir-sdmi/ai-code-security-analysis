import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Octokit } from "@octokit/core";
import { Readable } from "node:stream";


export async function copilotTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const tokenForUser = request.headers.get('X-GitHub-Token');
    const octokit = new Octokit({ auth: tokenForUser });
    const user = await octokit.request("GET /user");
    console.log("User:", user.data.login);

    // Parse the request payload and log it.
    const chunks: Uint8Array[] = [];
    for await (const chunk of request.body) {
        chunks.push(chunk);
    }
    const payload = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    console.log("Payload:", payload);

    // Insert a special pirate-y system message in our message list.
    const messages = payload.messages;
    console.log("Messages:", messages);

    messages.unshift({
        role: "system",
        content: "You are a helpful assistant that replies to user messages as if you were the Blackbeard Pirate.",
    });
    messages.unshift({
        role: "system",
        content: `Start every response with the user's name, which is @${user.data.login}`,
    });

    // Use Copilot's LLM to generate a response to the user's messages, with
    // our extra system messages attached.
    const copilotLLMResponse = await fetch(
        "https://api.githubcopilot.com/chat/completions",
        {
            method: "POST",
            headers: {
                authorization: `Bearer ${tokenForUser}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                messages,
                stream: true, // Enable streaming
            }),
        }
    );

    console.log("Copilot LLM Responding");

    // Return the response as a stream
    return {
        status: copilotLLMResponse.status,
        headers: {
            "content-type": copilotLLMResponse.headers.get("content-type") || "application/json",
        },
        body: Readable.from(copilotLLMResponse.body as any), // Convert Node.js stream to Web stream
    };
};

app.http('copilotTrigger', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: copilotTrigger
});
