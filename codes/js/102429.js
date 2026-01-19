console.log('AI MCQ Helper background script loaded');

// Import functions directly in the service worker
function generateMCQPrompt(content, cb) {
  const cleanContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  getActivePromptPair((activePair) => {
    if (!activePair) {
      // Fallback: just use the cleanContent as prompt if no prefix/suffix is set
      cb(cleanContent);
      return;
    }
    const prefix = activePair.promptPrefix || "";
    const suffix = activePair.promptSuffix || "";
    const prompt = `${prefix ? prefix + "\n" : ""}${cleanContent}${suffix ? "\n" + suffix : ""}`;
    cb(prompt);
  });
}

function PromptContentGenerator(Source,content) {
  if(!Source) return null;
  else if(Source === "Commands") return Contentqueue.join('\n\n');
  else if (!content||Source === "Context") return content;
}
// Specialized function to handle ChatGPT specifically
function openChatGPT(prompt) {
  const url = "https://chat.openai.com/";
  console.log("Opening ChatGPT with URL:", url);
  
  chrome.tabs.create({ url }, (newTab) => {
    // Wait for the page to load before injecting script
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === newTab.id) {
        chrome.tabs.onUpdated.removeListener(listener);
        
        console.log(`ChatGPT tab ${tabId} loaded, injecting script immediately`);
        
        // Inject the ChatGPT-specific script immediately
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: insertPromptToChatGPT,
          args: [prompt]
        }).then(() => {
          console.log("ChatGPT script injected successfully");
        }).catch(err => {
          console.error("Error injecting ChatGPT script:", err);
        });
      }
    });
  });
}

// ChatGPT-specific prompt insertion function
function insertPromptToChatGPT(prompt) {
  console.log("ChatGPT automation starting, prompt:", prompt);
  
  let attempts = 0;
  const maxAttempts = 20;
  
  function checkAndInsert() {
    attempts++;
    console.log(`Attempt ${attempts} to find ChatGPT input`);
    
    // Specifically look for the p tag with placeholder
    const placeholder = document.querySelector('p[data-placeholder="Ask anything"]');
    const parentDiv = placeholder ? placeholder.closest('[contenteditable="true"]') : null;
    
    // Alternative: look directly for the prompt textarea
    const textarea = document.getElementById('prompt-textarea');
    
    if (parentDiv || textarea) {
      console.log("Found ChatGPT input field");
      
      // Use the found element
      const inputElement = parentDiv || textarea;
      
      // Focus the element
      inputElement.focus();
      console.log("Input element focused");
      
      // Clear any existing content
      if (parentDiv) {
        // For contenteditable div
        parentDiv.innerHTML = '';
        
        // Create and insert a p tag
        const paragraphElement = document.createElement('p');
        paragraphElement.textContent = prompt;
        parentDiv.appendChild(paragraphElement);
        console.log("Inserted prompt as paragraph in contenteditable div");
      } else {
        // For textarea
        textarea.value = prompt;
        console.log("Set textarea value");
      }
      
      // Dispatch input event to trigger UI update
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("Dispatched input event");
      
      // Wait for submit button to become active
      setTimeout(() => {
        // Look for the send button
        const sendButton = document.querySelector('button[data-testid="send-button"]');
        
        if (sendButton && !sendButton.disabled) {
          console.log("Found enabled send button, clicking");
          sendButton.click();
          clearInterval(checkInterval); // Clear the interval when successful
        } else {
          console.log("Send button not found or disabled");
          
          // Try one more time after a delay
          setTimeout(() => {
            const retryButton = document.querySelector('button[data-testid="send-button"]');
            if (retryButton && !retryButton.disabled) {
              console.log("Found send button on retry, clicking");
              retryButton.click();
              clearInterval(checkInterval); // Clear the interval when successful
            }
          }, 1000);
        }
      }, 500);
    }
  }
  
  // Start checking immediately and repeat frequently
  checkAndInsert();
  const checkInterval = setInterval(() => {
    if (attempts < maxAttempts) {
      checkAndInsert();
    } else {
      clearInterval(checkInterval);
      console.log("Failed to find ChatGPT input after multiple attempts");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(prompt)
          .then(() => alert("Prompt copied to clipboard. Please paste it manually into ChatGPT and press Send."));
      }
    }
  }, 800); // Check every 800ms
}

// Specialized function for Gemini
function openGemini(prompt) {
  const url = "https://gemini.google.com/";
  console.log("Opening Gemini with URL:", url);
  
  chrome.tabs.create({ url }, (newTab) => {
    // Wait for the page to load before injecting script
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === newTab.id) {
        chrome.tabs.onUpdated.removeListener(listener);
        
        console.log(`Gemini tab ${tabId} loaded, injecting script immediately`);
        
        // Inject immediately to ensure fastest possible execution
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: insertPromptToGemini,
          args: [prompt]
        }).then(() => {
          console.log("Gemini script injected successfully");
        }).catch(err => {
          console.error("Error injecting Gemini script:", err);
        });
      }
    });
  });
}

// Gemini-specific prompt insertion function
function insertPromptToGemini(prompt) {
  console.log("Gemini automation starting, prompt:", prompt);
  
  let attempts = 0;
  const maxAttempts = 15;
  
  function attemptInsert() {
    attempts++;
    console.log(`Attempt ${attempts} to find Gemini input field`);
    
    // Try to find Gemini's textarea or contenteditable div
    const textareas = document.querySelectorAll('textarea');
    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    
    console.log(`Found ${textareas.length} textareas and ${contentEditables.length} contenteditable elements`);
    
    // First try textarea (Gemini often uses this)
    if (textareas.length > 0) {
      const textarea = textareas[0];
      textarea.focus();
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("Inserted prompt into Gemini textarea");
      
      // Look for send button
      findAndClickButton();
      return true;
    }
    // Then try contenteditable
    else if (contentEditables.length > 0) {
      const contentEditable = contentEditables[0];
      contentEditable.focus();
      contentEditable.innerHTML = prompt;
      contentEditable.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("Inserted prompt into Gemini contenteditable");
      
      // Look for send button
      findAndClickButton();
      return true;
    }
    
    return false;
  }
  
  function findAndClickButton() {
    // Very aggressive approach to find and click Gemini's send button
    setTimeout(() => {
      // Method 1: Look for send/submit button by aria-label
      const ariaButtons = Array.from(document.querySelectorAll('button[aria-label*="send" i], button[aria-label*="submit" i]'));
      
      // Method 2: Look for buttons with send/submit text
      const textButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.match(/send|submit|ask|generate/i)
      );
      
      // Method 3: Look for buttons with send/submit icons (common in Gemini)
      const iconButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.querySelector('svg') && !btn.disabled
      );
      
      const allPossibleButtons = [...ariaButtons, ...textButtons, ...iconButtons];
      console.log(`Found ${allPossibleButtons.length} possible send buttons`);
      
      // Try to click the first enabled button
      for (const button of allPossibleButtons) {
        if (!button.disabled) {
          console.log("Clicking Gemini send button");
          button.click();
          clearInterval(checkInterval);
          return true;
        }
      }
      
      // If no button was clicked, try pressing Enter key
      const activeElement = document.activeElement;
      if (activeElement) {
        console.log("Pressing Enter key on active element");
        activeElement.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          which: 13,
          keyCode: 13,
          bubbles: true
        }));
      }
      
      return false;
    }, 300); // Very short delay for the button search
  }
  
  // Start process immediately
  if (attemptInsert()) {
    console.log("First attempt successful");
  } else {
    // Set up interval for repeated attempts
    const checkInterval = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log("Failed to insert prompt after maximum attempts");
        // Fallback to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(prompt)
            .then(() => alert("Prompt copied to clipboard. Please paste it manually into Gemini and press Send."));
        }
        return;
      }
      
      if (attemptInsert()) {
        console.log(`Successful on attempt ${attempts}`);
        clearInterval(checkInterval);
      }
    }, 500); // Check every 500ms
  }
}

// Specialized function for Deepseek
function openDeepseek(prompt) {
  const url = "https://chat.deepseek.com/";
  console.log("Opening Deepseek with URL:", url);
  
  chrome.tabs.create({ url }, (newTab) => {
    // Wait for the page to load before injecting script
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === newTab.id) {
        chrome.tabs.onUpdated.removeListener(listener);
        
        console.log(`Deepseek tab ${tabId} loaded, injecting script immediately`);
        
        // Inject immediately to ensure fastest possible execution
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: insertPromptToDeepseek,
          args: [prompt]
        }).then(() => {
          console.log("Deepseek script injected successfully");
        }).catch(err => {
          console.error("Error injecting Deepseek script:", err);
        });
      }
    });
  });
}

// Deepseek-specific prompt insertion function
function insertPromptToDeepseek(prompt) {
  console.log("Deepseek automation starting, prompt:", prompt);
  
  let attempts = 0;
  const maxAttempts = 15;
  
  function attemptInsert() {
    attempts++;
    console.log(`Attempt ${attempts} to find Deepseek input field`);
    
    // Try multiple selector strategies for Deepseek
    const textareas = document.querySelectorAll('textarea');
    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    const chatInputs = document.querySelectorAll('.chat-input, .message-input, [role="textbox"]');
    
    let inputElement = null;
    
    if (textareas.length > 0) {
      inputElement = textareas[0];
      console.log("Found Deepseek textarea");
    } else if (contentEditables.length > 0) {
      inputElement = contentEditables[0];
      console.log("Found Deepseek contenteditable");
    } else if (chatInputs.length > 0) {
      inputElement = chatInputs[0];
      console.log("Found Deepseek chat input");
    }
    
    if (inputElement) {
      // Focus and insert text
      inputElement.focus();
      
      if (typeof inputElement.value !== 'undefined') {
        inputElement.value = prompt;
      } else {
        inputElement.innerHTML = prompt;
      }
      
      // Trigger input events
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log("Inserted prompt into Deepseek input");
      
      // Aggressively look for and click buttons
      setTimeout(() => {
        const sendButtons = Array.from(document.querySelectorAll('button'))
          .filter(btn => {
            const text = btn.textContent.toLowerCase();
            return (
              text.includes('send') || 
              text.includes('submit') || 
              text.includes('ask') || 
              text.includes('chat') ||
              btn.classList.contains('send-button') ||
              btn.querySelector('svg') // Often send buttons have SVG icons
            );
          });
        
        console.log(`Found ${sendButtons.length} possible Deepseek send buttons`);
        
        let buttonClicked = false;
        for (const button of sendButtons) {
          if (!button.disabled) {
            console.log("Clicking Deepseek send button");
            button.click();
            buttonClicked = true;
            clearInterval(checkInterval);
            break;
          }
        }
        
        if (!buttonClicked) {
          // Try pressing Enter as fallback
          console.log("Trying Enter key as fallback");
          inputElement.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            which: 13,
            keyCode: 13,
            bubbles: true
          }));
        }
      }, 500);
      
      return true;
    }
    
    return false;
  }
  
  // Start process immediately
  if (attemptInsert()) {
    console.log("First attempt successful");
  } else {
    // Set up interval for repeated attempts
    const checkInterval = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log("Failed to insert prompt after maximum attempts");
        // Fallback to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(prompt)
            .then(() => alert("Prompt copied to clipboard. Please paste it manually into Deepseek and press Send."));
        }
        return;
      }
      
      if (attemptInsert()) {
        console.log(`Successful on attempt ${attempts}`);
        clearInterval(checkInterval);
      }
    }, 500); // Check every 500ms
  }
}

// Helper to get active prompt pair from storage
function getActivePromptPair(callback) {
  chrome.storage.local.get(['cstore_pairs_v1', 'cstore_active_pair_id_v1'], (result) => {
    const pairs = result['cstore_pairs_v1'] || [];
    const activeId = result['cstore_active_pair_id_v1'];
    const activePair = pairs.find(p => p.id === activeId && p.active);
    callback(activePair);
  });
}

// Create context menu items when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated, creating context menu items");
  
  try {
    // Remove existing items first to avoid duplicates
    chrome.contextMenus.removeAll(() => {
      // Create parent menu
      chrome.contextMenus.create({
        id: "mcqHelper",
        title: "AI MCQ Helper",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating parent menu:", chrome.runtime.lastError);
        }
      });
      
      // Create child items for each LLM
      chrome.contextMenus.create({
        id: "openChatGPT",
        parentId: "mcqHelper",
        title: "Analyze with ChatGPT",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating ChatGPT menu:", chrome.runtime.lastError);
        }
      });
      
      chrome.contextMenus.create({
        id: "openGemini",
        parentId: "mcqHelper",
        title: "Analyze with Gemini",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating Gemini menu:", chrome.runtime.lastError);
        }
      });
      
      chrome.contextMenus.create({
        id: "openDeepseek",
        parentId: "mcqHelper",
        title: "Analyze with Deepseek",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating Deepseek menu:", chrome.runtime.lastError);
        }
      });
      
      chrome.contextMenus.create({
        id: "openAllEnabled",
        parentId: "mcqHelper",
        title: "Open All Enabled LLMs",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating 'Open All' menu:", chrome.runtime.lastError);
        }
      });
    });
  } catch (error) {
    console.error("Critical error during context menu creation:", error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);

  if (!info.selectionText) {
    console.warn("No text selected");
    return;
  }

  const selectedText = info.selectionText;
  generateMCQPrompt(selectedText, (prompt) => {
    if (!prompt) return; // No active prompt, already notified

    // Handle different menu items
    switch (info.menuItemId) {
      case "openChatGPT":
        openChatGPT(prompt);
        break;
      case "openGemini":
        openGemini(prompt);
        break;
      case "openDeepseek":
        openDeepseek(prompt);
        break;
      case "openAllEnabled":
        openChatGPT(prompt);
        openDeepseek(prompt);
        openGemini(prompt);
        break;
      case "analyzeMCQ":
        chrome.tabs.sendMessage(tab.id, { action: "handleSelection" });
        break;
    }
  });
});

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background script:", request);

  if (request.action === "openAiTab") {
    // Support for all three AIs
    if (request.ai === "deepseek") {
      openDeepseek(request.prompt);
    } else if (request.ai === "gemini") {
      openGemini(request.prompt);
    } else {
      openChatGPT(request.prompt);
    }
    sendResponse?.({ success: true });
    return true;
  }

  if (request.action === "openEnabledLLMs") {
    sendResponse({ success: true, message: "Request received" });
    return true;
  }

  return false;
});

// Add a startup check to verify context menus are created
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension starting up, checking context menus");
  // Re-create context menus on startup
  chrome.contextMenus.removeAll(() => {
    // Same creation code as in onInstalled (simplified here)
    chrome.contextMenus.create({
      id: "mcqHelper",
      title: "AI MCQ Helper",
      contexts: ["selection"]
    });
    // ... other menu items would be created here
  });
});

let Contentqueue = [];
chrome.commands.onCommand.addListener((command)=>{
  if(command==="Add to queue"){
    // get the selected text from the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: () => {
          const selection = window.getSelection();
          return selection ? selection.toString() : "";
        }
      }, (results) => {
        if (results && results[0]) {
          const selectedText = results[0].result;
          if (selectedText && selectedText.trim().length > 0) {
            showContentNotification("Selected text added to queue.", 2500);
            Contentqueue.push(selectedText);
            console.log("Selected text:", selectedText);
          } else {
            showContentNotification("No text selected to add to queue.", 2500);
            console.log("No text selected to add to queue.");
          }
        }
      });
    });
  } else if(command ==="Send to AI"){
    if(!Contentqueue|| Contentqueue.length === 0){ 
      console.log("Queue is empty, please add to queue first");
      showContentNotification("Queue is empty, please add to queue first", 2500);
    }else{
      let content = PromptContentGenerator("Commands");
      // Use the currently chosen AI from the Choose AI command
      const aiList = ["ChatGPT", "Gemini", "Deepseek"];
      const idx = globalThis._aiCycleIndex || 0;
      const currentAI = aiList[idx];
      if (currentAI === "Gemini") {
        generateMCQPrompt(content, (prompt) => {
          if (!prompt) return;
          openGemini(prompt);
        });
      } else if (currentAI === "Deepseek") {
        generateMCQPrompt(content, (prompt) => {
          if (!prompt) return;
          openDeepseek(prompt);
        });
      } else {
        generateMCQPrompt(content, (prompt) => {
          if (!prompt) return;
          openChatGPT(prompt);
        });
      }
    }
  }else if(command ==="Clear queue"){
    Contentqueue = [];
    showContentNotification("Queue cleared", 2500);
  } else if (command === "Choose AI") {
    // Cycle through ChatGPT, Gemini, Deepseek and log the current one
    if (!globalThis._aiCycleIndex) globalThis._aiCycleIndex = 0;
    const aiList = ["ChatGPT", "Gemini", "Deepseek"];
    globalThis._aiCycleIndex = (globalThis._aiCycleIndex + 1) % aiList.length;
    const currentAI = aiList[globalThis._aiCycleIndex];
    console.log("Current AI:", currentAI);
    showContentNotification("Selected AI: " + currentAI, 2500);
  }
})

console.log('AI MCQ Helper background script fully loaded');

// Utility to show notification in the active tab via content.js
function showContentNotification(message, duration = 2500) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "showNotification",
        message,
        duration
      });
    }
  });
}
