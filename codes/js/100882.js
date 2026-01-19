chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'getTermsOfService') {
    const url = message.url;
    try {
      const icons = await generateIcons(url);
      const summary = await generateSummary(url);
      const video = await generateVideo(url);
      sendResponse({ icons, summary, video });
    } catch (error) {
      console.error('Error:', error);
      sendResponse({ error: 'An error occurred.' });
    }
  }
});

async function generateIcons(url) {
  // Use ChatGPT API to generate icons
  // Example:
  const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: 'Generate icons for the Terms of Service page at ' + url,
      max_tokens: 50
    })
  });
  const data = await response.json();
  return data.choices.map(choice => choice.text.trim());
}

async function generateSummary(url) {
  // Use ChatGPT API to generate summary
  // Example:
  const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: 'Generate summary for the Terms of Service page at ' + url,
      max_tokens: 100
    })
  });
  const data = await response.json();
  return data.choices[0].text.trim();
}

async function generateVideo(url) {
  // Use ChatGPT API to generate explainer video
  // Example:
  const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: 'Generate explainer video for the Terms of Service page at ' + url,
      max_tokens: 200
    })
  });
  const data = await response.json();
  return data.choices[0].text.trim();
}
