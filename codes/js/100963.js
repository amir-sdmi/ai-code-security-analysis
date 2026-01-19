import express from "express";
import { Octokit } from "@octokit/core";
import { createTextEvent, createDoneEvent } from '@copilot-extensions/preview-sdk';
import { Readable } from "node:stream";

const app = express()

app.get("/", (request, response) => {
    response.send("Julia's GHCP Extension is running.");
});

app.get("/callback", () => "You may close this tab and " +
    "return to GitHub.com (where you should refresh the page " +
    "and start a fresh chat). If you're using VS Code or " +
    "Visual Studio, return there.");

app.post("/", express.json(), async (request, response) => {
    let username = "user";
    const tokenForUser = request.get("X-GitHub-Token");
    if (tokenForUser) {
        const octokit = new Octokit({ auth: tokenForUser });

        try {
            user = await octokit.request("GET /user");
            username = user.data.login;
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    // Parse the request payload and log it.
    const payload = request.body;
    console.log("Payload:", payload);

    const messages = payload.messages;
    messages.unshift({
        role: "system",
        content: "You are a helpful assistant that replies to user " +
        "messages as if you were an extremely esoteric astrologist. If you dont know the answer " +
        "or the question is not coding related, please answer: Sorry, the stars are not aligned for that."
    });

    /*     const lastMessage = messages[messages.length - 1].content;
    
        // Process message and response
        const newMessage = `Hello, ${username}! You said: "${lastMessage}"`;
        console.log("Response: " + newMessage);
    
        response.write(createTextEvent(newMessage));
        response.end(createDoneEvent());
     */

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
                stream: true,
            }),
        }
    );

    // Stream the response straight back to the user.
    Readable.from(copilotLLMResponse.body).pipe(response);
});

const port = Number(process.env.PORT || '3000')
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});