// Configuration
const OPENAI_API_KEY = "";
const GITHUB_TOKEN = "";

// Function to generate sarcastic review using ChatGPT
async function generateSarcasticReview(prData) {
  const prompt = `As a senior engineer, provide a sarcastic code review for this pull request. 
    Be witty and humorous while still pointing out potential issues. 
    Format the response in markdown.
    Keep it short and concise, no more than 100 words.
    Try to add suggestions for improvements and make it funny.

    PR Title: ${prData.title}
    PR Description: ${prData.description}
    
    Changed Files:
    ${prData.files
      .map((file) => `\n${file.name}:\n${file.content}`)
      .join("\n")}`;
  console.log("Prompt:", prompt);
  try {
    console.log("Generating review...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior engineer who provides sarcastic but insightful code reviews. Your reviews are witty, humorous, and sometimes brutally honest, but always constructive.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    console.log("Review generated:", data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    throw error;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateReview") {
    generateSarcasticReview(request.data)
      .then((review) => {
        sendResponse({ review });
      })
      .catch((error) => {
        console.error("Error generating review:", error);
        sendResponse({ error: "Failed to generate review" });
      });
    return true; // Will respond asynchronously
  }
});
