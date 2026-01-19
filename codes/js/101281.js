// Keep track of tabs where content script is loaded
let tabsWithContentScript = new Set();

// Inject content script when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      console.log('Content script injected successfully in tab:', tabId);
      tabsWithContentScript.add(tabId);
    }).catch((error) => {
      console.error('Error injecting content script:', error);
    });
  }
});

// Remove tab from set when it's closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabsWithContentScript.delete(tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "processChatGPT",
    title: "Process with ChatGPT",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "processChatGPT") {
    if (tabsWithContentScript.has(tab.id)) {
      sendMessageToContentScript(tab.id, { action: "processText", text: info.selectionText });
    } else {
      console.log('Content script not loaded, injecting now...');
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        console.log('Content script injected, sending message...');
        tabsWithContentScript.add(tab.id);
        sendMessageToContentScript(tab.id, { action: "processText", text: info.selectionText });
      }).catch((error) => {
        console.error('Error injecting content script:', error);
      });
    }
  }
});

function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message)
    .then(response => {
      console.log('Message sent successfully:', response);
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callChatGPT") {
    callChatGPTAPI(request.text)
      .then(response => {
        sendMessageToContentScript(sender.tab.id, { action: "displayResponse", response: response });
      })
      .catch(error => {
        sendMessageToContentScript(sender.tab.id, { action: "displayError", error: error.message });
      });
  }
  return true; // Indicates that the response will be sent asynchronously
});

async function callChatGPTAPI(text) {
  const apiKey = await chrome.storage.sync.get('apiKey');
  if (!apiKey.apiKey) {
    throw new Error("API key not set");
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that explains concepts in simple language, as if explaining to a 5-year-old. Your goal is to make complex ideas easy to understand."
        },
        { 
          role: "user", 
          content: `Please explain this in simple terms or as if I'm 5 years old: ${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
