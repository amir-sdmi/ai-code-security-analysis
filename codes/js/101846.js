export class ChatGPTBridge {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        // Launch browser and navigate to ChatGPT
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 2000;
            width: 90%;
            max-width: 600px;
        `;
        dialog.innerHTML = `
            <h2>ChatGPT Integration</h2>
            <p>Please open ChatGPT in a new tab and paste the following prompt:</p>
            <textarea id="prompt-text" style="width: 100%; height: 150px; margin: 1rem 0; padding: 0.5rem;"></textarea>
            <button id="copy-prompt" style="background: #4B0082; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                Copy Prompt
            </button>
            <button id="paste-response" style="background: #4B0082; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-left: 1rem;">
                Paste Response
            </button>
            <textarea id="response-text" style="width: 100%; height: 150px; margin: 1rem 0; padding: 0.5rem;" placeholder="Paste ChatGPT's response here..."></textarea>
            <button id="submit-response" style="background: #4B0082; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                Submit Response
            </button>
        `;
        document.body.appendChild(dialog);

        return new Promise((resolve) => {
            const promptText = dialog.querySelector('#prompt-text');
            const copyPrompt = dialog.querySelector('#copy-prompt');
            const pasteResponse = dialog.querySelector('#paste-response');
            const responseText = dialog.querySelector('#response-text');
            const submitResponse = dialog.querySelector('#submit-response');

            copyPrompt.addEventListener('click', () => {
                promptText.select();
                document.execCommand('copy');
                window.open('https://chat.openai.com', '_blank');
            });

            pasteResponse.addEventListener('click', () => {
                responseText.focus();
            });

            submitResponse.addEventListener('click', () => {
                const response = responseText.value;
                document.body.removeChild(dialog);
                resolve(response);
            });
        });
    }

    async generateContent(metaprompt, currentText, newPrompt) {
        const systemPrompt = `You are a content generation assistant. Your task is to modify the given text according to the provided prompt while maintaining the intent specified in the metaprompt.

Metaprompt (Intent and Limitations):
${metaprompt}

Current Text:
${currentText}

New Prompt:
${newPrompt}

Please provide the modified text that incorporates the new prompt while staying true to the original intent. Return only the modified text without any explanations or additional formatting.`;

        const dialog = document.createElement('div');
        dialog.id = 'chatgpt-dialog';
        document.body.appendChild(dialog);
        const promptText = dialog.querySelector('#prompt-text');
        if (promptText) {
            promptText.value = systemPrompt;
        }

        return await this.init();
    }

    formatPromptChain(chain) {
        return chain
            .filter(p => p.votes >= 0)
            .map(p => p.prompt)
            .join('\n\nThen:\n');
    }
}

export class MikiSection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.promptChain = [];
        this.chatGPT = new ChatGPTBridge();
        this.setupStyles();
        this.setupContent();
    }

    setupStyles() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin: 1rem 0;
                    position: relative;
                }

                .content {
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .content:hover {
                    background: rgba(75, 0, 130, 0.05);
                }

                .meta-info {
                    font-size: 0.9rem;
                    color: #666;
                    border-top: 1px solid #eee;
                    padding-top: 0.5rem;
                    margin-top: 0.5rem;
                }

                .edit-indicator {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    color: #4B0082;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                :host(:hover) .edit-indicator {
                    opacity: 0.5;
                }
            </style>
            <div class="content">
                <slot></slot>
            </div>
            <div class="meta-info">
                <strong>Intent:</strong> <span class="metaprompt"></span>
            </div>
            <div class="edit-indicator">✏️ Click to edit</div>
        `;
    }

    setupContent() {
        const metaprompt = this.getAttribute('metaprompt');
        this.shadowRoot.querySelector('.metaprompt').textContent = metaprompt;

        // Initialize prompt chain with genesis prompt
        this.promptChain.push({
            type: 'genesis',
            prompt: metaprompt,
            content: this.textContent,
            votes: 0,
            timestamp: Date.now()
        });

        const content = this.shadowRoot.querySelector('.content');
        content.addEventListener('click', () => {
            const dialog = document.createElement('miki-prompt-dialog');
            dialog.setAttribute('mode', 'edit');
            dialog.section = this;
            document.body.appendChild(dialog);
        });
    }

    addPrompt(prompt) {
        this.promptChain.push({
            type: 'revision',
            prompt,
            content: null,
            votes: 0,
            timestamp: Date.now()
        });
    }

    async regenerateContent() {
        // Filter out prompts with negative votes
        const validPrompts = this.promptChain.filter(p => p.votes >= 0);
        
        // Get the latest prompt
        const latestPrompt = validPrompts[validPrompts.length - 1];
        
        // Generate content using ChatGPT
        const newContent = await this.chatGPT.generateContent(
            this.getAttribute('metaprompt'),
            this.textContent,
            latestPrompt.prompt
        );
        
        this.textContent = newContent;
        return newContent;
    }

    toWikiMarkup() {
        const metaprompt = this.getAttribute('metaprompt');
        return `== ${metaprompt} ==\n${this.textContent}\n` +
            `<!-- MIKI_PROMPT_CHAIN: ${JSON.stringify(this.promptChain)} -->`;
    }
}

// Register the MikiSection component
customElements.define('miki-section', MikiSection);
