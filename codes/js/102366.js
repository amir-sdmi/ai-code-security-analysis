/**
 * Background Service Worker for Playwright Test Generator
 * Handles API communication with Grok AI and manages extension state
 */

// Grok AI API configuration
const GROK_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROK_MODEL = 'llama-3.3-70b-versatile';

class PlaywrightTestGeneratorService {
    constructor() {
        this.setupMessageListener();
        this.setupContextMenus();
        this.vsCodeSocket = null;
        this.connectToVSCode();
    }

    /**
     * Connect to VSCode WebSocket bridge
     */
    connectToVSCode() {
        try {
            // Try to connect to local VSCode extension
            this.vsCodeSocket = new WebSocket('ws://localhost:3001');
            
            this.vsCodeSocket.onopen = () => {
                console.log('Connected to VSCode Bridge');
            };
            
            this.vsCodeSocket.onclose = () => {
                console.log('Disconnected from VSCode Bridge');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectToVSCode(), 5000);
            };
            
            this.vsCodeSocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleVSCodeMessage(message);
            };
            
        } catch (error) {
            console.error('Failed to connect to VSCode Bridge:', error);
            // Retry connection after 10 seconds
            setTimeout(() => this.connectToVSCode(), 10000);
        }
    }

    /**
     * Handle messages from VSCode extension
     */
    handleVSCodeMessage(message) {
        switch (message.type) {
            case 'insertion_result':
                // Forward result to sidebar
                chrome.runtime.sendMessage({
                    type: 'VSCODE_INSERTION_RESULT',
                    data: message.data
                }).catch(error => {
                    console.error('Failed to send message to sidebar:', error);
                });
                break;
                
            case 'workspace_info':
                // Store workspace info
                chrome.storage.local.set({ 
                    workspaceInfo: message.data 
                });
                break;
        }
    }

    /**
     * Setup message listener for communication with sidebar and content scripts
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'GENERATE_TEST') {
                // FIX: Use message.data
                const actions = message.data && message.data.actions ? message.data.actions : [];
                const url = message.data && message.data.url ? message.data.url : '';

                this.generatePlaywrightTest({ actions, url })
                    .then(response => sendResponse(response))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true; // Indicates we will send a response asynchronously

            } else if (message.type === 'INSERT_TO_VSCODE') {
                this.insertCodeToVSCode(message.data)
                    .then(response => sendResponse(response))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            } else if (message.type === 'ACTION_RECORDED') {
                // Forward action to sidebar if needed
                this.forwardToSidebar(message);
            } else if (message.type === 'SET_API_KEY') {
                this.setApiKey(message.apiKey)
                    .then(success => sendResponse({ success }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            } else if (message.type === 'CHECK_API_KEY') {
                this.getApiKey()
                    .then(apiKey => sendResponse({ hasApiKey: !!apiKey }))
                    .catch(error => sendResponse({ hasApiKey: false }));
                return true;
            } else if (message.type === 'START_RECORDING') {
                chrome.storage.local.set({ isRecording: true }, () => {
                    sendResponse({ success: true });
                });
                return true;
            } else if (message.type === 'STOP_RECORDING') {
                chrome.storage.local.set({ isRecording: false }, () => {
                    sendResponse({ success: true });
                });
                return true;
            } else if (message.type === 'CHECK_RECORDING_STATUS') {
                chrome.storage.local.get(['isRecording'], (result) => {
                    sendResponse({ isRecording: !!result.isRecording });
                });
                return true; // Required for async sendResponse
            }
        });
    }

    /**
     * Insert generated code to VSCode via WebSocket
     */
    async insertCodeToVSCode(data) {
        return new Promise((resolve, reject) => {
            if (!this.vsCodeSocket || this.vsCodeSocket.readyState !== WebSocket.OPEN) {
                // Try to connect to the bridge server instead
                this.connectToBridgeServer(data, resolve, reject);
                return;
            }

            const message = {
                type: 'insert_code',
                data: {
                    targetFile: data.targetFile,
                    code: data.code,
                    insertionMethod: data.insertionMethod || 'append',
                    validateSyntax: data.validateSyntax !== false,
                    createBackup: data.createBackup !== false
                }
            };

            // Set up a one-time listener for the response
            const responseHandler = (event) => {
                const response = JSON.parse(event.data);
                if (response.type === 'insertion_result' && response.data.targetFile === data.targetFile) {
                    this.vsCodeSocket.removeEventListener('message', responseHandler);
                    if (response.data.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.data.message));
                    }
                }
            };

            this.vsCodeSocket.addEventListener('message', responseHandler);
            this.vsCodeSocket.send(JSON.stringify(message));

            // Timeout after 30 seconds
            setTimeout(() => {
                this.vsCodeSocket.removeEventListener('message', responseHandler);
                reject(new Error('Timeout waiting for VSCode response'));
            }, 30000);
        });
    }

    /**
     * Connect to bridge server and send code insertion request
     */
    connectToBridgeServer(data, resolve, reject) {
        try {
            // Try to connect to the bridge server
            const bridgeSocket = new WebSocket('ws://localhost:5000/ws');
            
            bridgeSocket.onopen = () => {
                console.log('Connected to Bridge Server');
                
                const message = {
                    type: 'insert_code',
                    data: {
                        targetFile: data.targetFile,
                        code: data.code,
                        insertionMethod: data.insertionMethod || 'append',
                        validateSyntax: data.validateSyntax !== false,
                        createBackup: data.createBackup !== false
                    }
                };

                bridgeSocket.send(JSON.stringify(message));
            };
            
            bridgeSocket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.type === 'insertion_result') {
                    bridgeSocket.close();
                    if (response.data.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.data.message));
                    }
                }
            };
            
            bridgeSocket.onerror = () => {
                reject(new Error('Failed to connect to bridge server. Please ensure the bridge application is running.'));
            };
            
            // Timeout after 10 seconds
            setTimeout(() => {
                bridgeSocket.close();
                reject(new Error('Timeout connecting to bridge server'));
            }, 10000);
            
        } catch (error) {
            reject(new Error('Failed to connect to bridge server: ' + error.message));
        }
    }

    /**
     * Setup context menus for quick access
     */
    setupContextMenus() {
        chrome.runtime.onInstalled.addListener(() => {
            try {
                chrome.contextMenus.create({
                    id: 'open-playwright-generator',
                    title: 'Open Playwright Test Generator',
                    contexts: ['page']
                });
            } catch (error) {
                console.error('Failed to create context menu:', error);
            }
        });

        if (chrome.contextMenus && chrome.contextMenus.onClicked) {
            chrome.contextMenus.onClicked.addListener((info, tab) => {
                if (info.menuItemId === 'open-playwright-generator') {
                    try {
                        chrome.sidePanel.open({ tabId: tab.id });
                    } catch (error) {
                        console.error('Failed to open side panel from context menu:', error);
                    }
                }
            });
        }
    }

/**
 * Advanced filter: keep only meaningful actions, collapse multiple inputs to last value
 */
filterActions(actions) {
    const filtered = [];
    const lastInputBySelector = {};
    const seenClicks = new Set();

    for (const action of actions) {
        // Only keep meaningful actions
        if (!['navigation', 'click', 'input', 'select', 'submit'].includes(action.type)) continue;

        // For input/select, keep only the last value per selector
        if (action.type === 'input' || action.type === 'select') {
            lastInputBySelector[action.selector] = action;
        } else if (action.type === 'click') {
            // Remove duplicate clicks on the same element in a row
            const clickKey = `${action.selector}|${action.url}`;
            if (!seenClicks.has(clickKey)) {
                filtered.push(action);
                seenClicks.add(clickKey);
            }
        } else {
            filtered.push(action);
        }
    }

    // Add the last input/select actions (in original order)
    const inputActions = Object.values(lastInputBySelector);
    inputActions.sort((a, b) => actions.indexOf(a) - actions.indexOf(b));
    return [...filtered, ...inputActions];
}

 

async generatePlaywrightTest(data) {
    try {
        let { actions, url } = data;

        // Use advanced filter
        actions = this.filterActions(actions);

        if (!actions || actions.length === 0) {
            throw new Error('No actions provided for test generation');
        }

        const prompt = this.buildPrompt(actions, url);
        const grokResponse = await this.callGrokAPI(prompt);
        
        const cleanedCode = this.cleanGeneratedCode(grokResponse);
        
        return {
            success: true,
            code: cleanedCode
        };

    } catch (error) {
        console.error('Test generation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Build prompt for Grok AI based on recorded actions
 */
    buildPrompt(actions, baseUrl) {
        const actionDescriptions = actions.map((action, index) => {
            switch (action.type) {
                case 'navigation':
                    return `${index + 1}. Navigate to: ${action.url}`;
                case 'click':
                    return `${index + 1}. Click on: ${action.selector} (${action.element})`;
                case 'input':
                    return `${index + 1}. Type "${action.value}" into: ${action.selector} (${action.element})`;
                case 'select':
                    return `${index + 1}. Select "${action.value}" from: ${action.selector} (${action.element})`;
                case 'submit':
                    return `${index + 1}. Submit form: ${action.selector}`;
                default:
                    return `${index + 1}. ${action.type}: ${action.selector}`;
            }
        }).join('\n');
    // --- STRICT CUSTOM FRAMEWORK PROMPT START ---
    const frameworkPrompt = `
You're an expert AI coding assistant working on a Playwright-based TypeScript automation framework. Follow these rules and conventions strictly and intelligently, as if you've spent years building and maintaining high-quality test suites.

🔧 Project Structure
Page objects live in the pages folder — one class per file, named XxxPage.ts.

Tests live in the tests folder — grouped by feature.

All utilities like date/time helpers or data generation (faker) go in utils.

Custom fixtures are stored in customFixtures.

🧭 Selector Strategy
Selectors must be defined in a selectors object inside each page class. Use clear, camelCase property names.

Selector priority (in this order):

data-testid or data-test

aria-label or role

Visible, unique text (e.g. for buttons)

Unique name or placeholder (for inputs)

Stable and meaningful CSS IDs

Tag/class/attribute combinations (as a last resort)

XPath (only if absolutely necessary — and make them robust)

For dynamic selectors, use arrow functions like this:

statusOption: (data: string, index: number) => \`(//span[text()="\${data}"])[\${index}]\`
⚠️ If you don't use data-testid or aria-label, add a short inline comment explaining why.

✅ Always validate selectors to ensure exactly one element is matched. Refine using nth-child, parent context, or attributes as needed.

⚙️ Page Actions
All interactions should be written as async methods inside the page class.

Use await this.page.locator(this.selectors.selectorName).action() for every interaction.

Call await this.validateElementVisibility(...) before interacting, when required.

Method names and parameters should be self-explanatory, as if written for other testers to reuse with confidence.

🧪 Test Structure
Use Playwright's test.describe and test blocks properly.

Enable serial mode if needed using: test.describe.configure({ mode: "serial" })

Every test must include annotations:

ts
Copy
Edit
test.info().annotations.push(
    { type: 'Author', description: 'YourName' },
    { type: 'TestCase', description: 'TC-123: Feature Description' },
    { type: 'Test Description', description: 'What exactly is being verified' }
);
Tests must use custom fixtures and faker utilities wherever appropriate.

🛠️ Utility & Helpers
Follow the existing utility function styles in utils.

Utility function names should be descriptive and consistent (getCurrentDateFormatted, etc.)

✅ Best Practices
Never modify the folder structure.

Never use hardcoded waits. Use Playwright's built-in waits and assertions.

Match the indentation, comments, and spacing used throughout the existing codebase.

Don't invent new styles or patterns — follow the existing framework strictly.

Avoid duplicated actions and remove empty or irrelevant input steps.

Logical flows matter — group related actions (e.g., fill form → validate → submit).

Every step should be clear, minimal, and reusable.

🧠 Before You Code
When you receive manual flow/recording:

Think like a senior tester. Understand the user's intent, context, and edge cases.

Break down the steps into logical, layered blocks.

Verify the expected behavior first — don't blindly convert actions to code.

Make sure the final test reflects real usage, not just clicks.

🔄 Output Expectations
When generating code:

Include only the necessary file blocks (.ts) — no markdown, no extra comments.

Include imports, setup, POM methods, tests, and assertions that follow the framework exactly.

If any Page class or selectors are missing, generate them correctly before test code.

The final code should feel like it was written by a mature, detail-focused engineer — readable, reusable, and robust.
// --- STRICT CUSTOM FRAMEWORK PROMPT END ---
`
    return `${frameworkPrompt}
Base URL: ${baseUrl}

Recorded Actions:
${actionDescriptions}

Return **only** the TypeScript code.`
}
    /**
     * Call Grok AI API
     */
    async callGrokAPI(prompt) {
        // Get API key from environment
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error('XAI API key not configured. Please provide your API key.');
        }

        const response = await fetch(`${GROK_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert Playwright test automation engineer. Generate clean, production-ready TypeScript code following best practices.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Grok API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from Grok AI');
        }

        return data.choices[0].message.content;
    }

    /**
     * Clean generated code by removing markdown formatting and ensuring proper structure
     */
    cleanGeneratedCode(code) {
        // Remove markdown code blocks
        let cleaned = code.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');
        
        // Remove extra leading/trailing whitespace
        cleaned = cleaned.trim();
        
        // Ensure proper imports if missing
        if (!cleaned.includes('import') && !cleaned.includes('require')) {
            const imports = `import { test, expect, Page } from '@playwright/test';

`;
            cleaned = imports + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Store API key
     */
    async setApiKey(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ apiKey }, () => {
                resolve(true);
            });
        });
    }

    /**
     * Get stored API key
     */
    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiKey'], (result) => {
                resolve(result.apiKey);
            });
        });
    }

    /**
     * Forward message to sidebar
     */
    forwardToSidebar(message) {
        // This would be implemented if sidebar needs real-time updates
        console.log('Forwarding to sidebar:', message);
    }
}

// Initialize the service when background script loads
const playwrightService = new PlaywrightTestGeneratorService();
