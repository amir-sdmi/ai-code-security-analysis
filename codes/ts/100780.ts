// Node.js Example (Simplified)

// Fetching files from GitHub
const fetch = require("node-fetch");
const fs = require("fs");

async function fetchRepoFiles(repoUrl: string) {
  // Use GitHub API to get repository files
  const response = await fetch(repoUrl);
  const data = await response.json();
  return data;
}

// Analyzing code using ChatGPT API
async function analyzeCodeWithChatGPT(code: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a code analysis expert." },
        { role: "user", content: `Analyze this code for issues:\n\n${code}` },
      ],
    }),
  });

  const result = await response.json();
  console.log(result);
  return result.choices[0].message.content;
}

// Putting it all together
async function analyzeRepo(repoUrl: string) {
  const files = await fetchRepoFiles(repoUrl);
  for (const file of files) {
    if (file.download_url) {
      const code = await fetch(file.download_url).then((res: any) =>
        res.text()
      );
      // write all files inside a folder
     // fs.writeFileSync(`./files/${file.name}`, code);

     if(file.name === "index.js"){
       
       const analysis = await analyzeCodeWithChatGPT(code);
       console.log(`Analysis for ${file.name}:\n${analysis}\n`);
     }
    }

  }
}

// Example usage
analyzeRepo(
  "https://api.github.com/repos/logesh-kumar/function-calling/contents/"
);
