import express from 'express';
import { Octokit } from "@octokit/core";
import { Readable } from "stream";
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

export function* readAllFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* readAllFiles(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

app.get('/', (req, res) => {
  res.send('Hello you, Welcome to GH Copilot GenRevive-Migrator-ADF2Angular!');
  // console.log('Files in input directory:');
  // for (const file of readAllFiles('./input')) {
  //    if (file.endsWith('.java') || file.endsWith('.xml') || file.endsWith('.json')) {
  //      const content = fs.readFileSync(file, 'utf8');
  //     console.log(`File: ${file}`);
  //     console.log(`Content: ${content}`);
  //    }
  // }
});

app.get('/callback', (req, res) => {
  res.send('You may close this window and return to GH where you started');
});

app.post("/", express.json(), async (req, res) => {
  // Identify the user, using the GitHub API token provided in the request headers.
  const tokenForUser = req.get("X-GitHub-Token");
  const octokit = new Octokit({ auth: tokenForUser });
  const user = await octokit.request("GET /user");
  console.log("User:", user.data.login);

  // Parse the request payload and log it.
  const payload = req.body;
  console.log("Payload:", payload);

  // Insert the required system message in our message list.
  const messages = payload.messages;

  //attach context to the messages
  // for (const file of readAllFiles('./input')) {
  //   if (file.endsWith('.java') || file.endsWith('.xml') || file.endsWith('.json')) {
  //     const content = fs.readFileSync(file, 'utf8');
  //     messages.unshift({
  //       role: "system",
  //       content: `The following file is part of the ADF application: ${file} with content: ${content}`,
  //     });
  //     console.log(content);
  //   }
  // }

  messages.unshift({
    role: "system",
    content: "You are an extension of GitHub Copilot, built to interact with GitHub Copilot extensions" +
    "and also built to use commands and other tools from the agent-mode to help migrate Oracle ADF applications to Angular" +
    //You have to pass the context of the ADF application to the agent, which will then generate an Angular application based on the ADF application." +
    // "You will be provided with the ADF application code and the openapi.json file, which you will use to generate the Angular application." +
    "These are the steps for the agent to follow for the migration process:" +
    "1. Analyze the provided ADF application code and identify components, bindings, and configurations." +
    "2. Clean up the ADF component and class names by removing german umlauts and other non-ASCII characters." +
    "3. Create a new Angular 16 application structure" +
    "4. Create an OpenAPI specification for the new Angular application based on the existing openapi.json file in the ADF application." +
    "5. Install the  following packages 'bootstrap@5', 'jquery', 'popper.js', '@angular/router'." +
    "6. Generate the necessary components, services, and modules based on the ADF application." + 
    "7. Create angular routes based on the angular components." + 
    "8. Build the angular application." +
    "9. Provide the user with the generated Angular application code and instructions on how to run it." +
    "10. Ask for feedback and test the application after each step.",
  });
  messages.unshift({
    role: "system",
    content: `Start every response with the user's name, which is @${user.data.login} followed by welcome to GenRevive-Migrator-ADF2Angular!`,
  });

  // Use Copilot's LLM to generate a response to the user's messages, with our extra system messages attached.
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
  Readable.from(copilotLLMResponse.body).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
