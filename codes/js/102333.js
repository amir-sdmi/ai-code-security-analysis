// Dad Boss Club - Adventure Mode with Grok AI Integration
// Members Only Feature with Voice Activation and Interactive Chat

class AdventureModeManager {
    constructor() {
        this.config = window.DadBossConfig || require('./config.js');
        this.isActive = false;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = null;
        this.conversationHistory = [];
        this.memberData = null;
        this.initializeVoiceServices();
    }

    // Initialize voice recognition and synthesis
    initializeVoiceServices() {
        // Speech Recognition Setup
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showMessage('Voice recognition error. Please try again.', 'error');
            };
        }

        // Speech Synthesis Setup
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    // Check if user is a paid member
    async checkMembershipStatus() {
        try {
            const memberId = localStorage.getItem('dadBossMemberId');
            if (!memberId) {
                throw new Error('No member ID found');
            }

            // Check membership status via API
            const response = await fetch(`${this.config.apiBaseUrl}/members/${memberId}/subscription`, {
                headers: this.config.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to verify membership');
            }

            const memberData = await response.json();
            this.memberData = memberData;
            
            return memberData.subscription && memberData.subscription.status === 'active';
        } catch (error) {
            console.error('Membership verification error:', error);
            return false;
        }
    }

    // Initialize Adventure Mode
    async initializeAdventureMode() {
        const isValidMember = await this.checkMembershipStatus();
        
        if (!isValidMember) {
            this.showUpgradePrompt();
            return false;
        }

        this.createAdventureModeUI();
        this.initializeIntercom();
        this.isActive = true;
        
        // Welcome message
        await this.sendGrokMessage("Welcome to Adventure Mode! I'm your Dad Boss AI companion. How can I help you on your journey to Dad Boss consciousness today?", true);
        
        return true;
    }

    // Create Adventure Mode UI
    createAdventureModeUI() {
        // Remove existing adventure mode if present
        const existing = document.getElementById('adventure-mode-container');
        if (existing) {
            existing.remove();
        }

        const container = document.createElement('div');
        container.id = 'adventure-mode-container';
        container.innerHTML = `
            <div class="adventure-mode-overlay">
                <div class="adventure-mode-panel">
                    <div class="adventure-header">
                        <h2>🎯 Adventure Mode</h2>
                        <p>AI-Powered Dad Boss Guidance</p>
                        <button class="close-adventure" onclick="adventureMode.closeAdventureMode()">×</button>
                    </div>
                    
                    <div class="adventure-content">
                        <div class="chat-container" id="adventure-chat">
                            <div class="welcome-message">
                                <div class="ai-avatar">🤖</div>
                                <div class="message-content">
                                    <p>Welcome to Adventure Mode! I'm your AI Dad Boss companion powered by Grok AI.</p>
                                    <p>You can speak to me or type your questions about fatherhood, leadership, and Dad Boss consciousness.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="adventure-controls">
                            <div class="voice-controls">
                                <button class="voice-btn" id="voice-toggle" onclick="adventureMode.toggleVoiceListening()">
                                    🎤 Start Voice Chat
                                </button>
                                <div class="voice-status" id="voice-status">Ready to listen</div>
                            </div>
                            
                            <div class="text-input-container">
                                <input type="text" id="adventure-text-input" placeholder="Type your message or use voice..." />
                                <button onclick="adventureMode.sendTextMessage()">Send</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="adventure-footer">
                        <p>🔒 Members Only Feature • Powered by Grok AI</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Add event listeners
        document.getElementById('adventure-text-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendTextMessage();
            }
        });
    }

    // Initialize Intercom for members
    initializeIntercom() {
        if (!this.memberData) return;

        window.intercomSettings = {
            api_base: "https://api-iam.intercom.io",
            app_id: this.config.intercomAppId,
            user_id: this.memberData.id,
            name: this.memberData.name || 'Dad Boss Member',
            email: this.memberData.email,
            created_at: this.memberData.signup_date,
            custom_attributes: {
                membership_status: 'active',
                adventure_mode: true,
                dad_boss_level: this.memberData.level || 'Ascending'
            }
        };

        // Load Intercom widget
        if (!window.Intercom) {
            (function(){
                var w=window;
                var ic=w.Intercom;
                if(typeof ic==="function"){
                    ic('reattach_activator');
                    ic('update',w.intercomSettings);
                } else {
                    var d=document;
                    var i=function(){i.c(arguments);};
                    i.q=[];
                    i.c=function(args){i.q.push(args);};
                    w.Intercom=i;
                    var l=function(){
                        var s=d.createElement('script');
                        s.type='text/javascript';
                        s.async=true;
                        s.src='https://widget.intercom.io/widget/' + this.config.intercomAppId;
                        var x=d.getElementsByTagName('script')[0];
                        x.parentNode.insertBefore(s,x);
                    }.bind(this);
                    if(document.readyState==='complete'){
                        l();
                    } else if(w.attachEvent){
                        w.attachEvent('onload',l);
                    } else {
                        w.addEventListener('load',l,false);
                    }
                }
            }.bind(this))();
        }
    }

    // Toggle voice listening
    toggleVoiceListening() {
        if (!this.recognition) {
            this.showMessage('Voice recognition not supported in this browser', 'error');
            return;
        }

        const voiceBtn = document.getElementById('voice-toggle');
        const voiceStatus = document.getElementById('voice-status');

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            voiceBtn.textContent = '🎤 Start Voice Chat';
            voiceBtn.classList.remove('listening');
            voiceStatus.textContent = 'Ready to listen';
        } else {
            this.recognition.start();
            this.isListening = true;
            voiceBtn.textContent = '🛑 Stop Listening';
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening... Speak now';
        }
    }

    // Handle voice input
    async handleVoiceInput(transcript) {
        this.isListening = false;
        const voiceBtn = document.getElementById('voice-toggle');
        const voiceStatus = document.getElementById('voice-status');
        
        voiceBtn.textContent = '🎤 Start Voice Chat';
        voiceBtn.classList.remove('listening');
        voiceStatus.textContent = 'Processing...';

        this.addMessageToChat(transcript, 'user');
        await this.sendGrokMessage(transcript, true);
        
        voiceStatus.textContent = 'Ready to listen';
    }

    // Send text message
    async sendTextMessage() {
        const input = document.getElementById('adventure-text-input');
        const message = input.value.trim();
        
        if (!message) return;

        input.value = '';
        this.addMessageToChat(message, 'user');
        await this.sendGrokMessage(message, false);
    }

    // Send message to Grok AI
    async sendGrokMessage(userMessage, useVoice = false) {
        try {
            this.showTypingIndicator();

            // Prepare conversation context
            const messages = [
                {
                    role: "system",
                    content: `You are the Dad Boss AI Companion, an expert guide for fathers seeking to achieve Dad Boss consciousness. You help with:

1. Fatherhood challenges and parenting wisdom
2. Leadership development and personal growth
3. Work-life balance and family priorities
4. Building strong family relationships
5. Dad Boss philosophy and principles
6. Community building and male friendship
7. Personal development and self-improvement

Your responses should be:
- Practical and actionable
- Supportive but challenging
- Rooted in Dad Boss philosophy
- Encouraging masculine leadership
- Focused on family and community
- Conversational and engaging

Keep responses concise but meaningful. You're speaking to a Dad Boss member who has paid for this premium experience.`
                },
                ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
                {
                    role: "user",
                    content: userMessage
                }
            ];

            // Make API call to Grok via your backend proxy
            const response = await fetch(`${this.config.apiBaseUrl}/grok/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.getHeaders(true) // Use private key
                },
                body: JSON.stringify({
                    messages: messages,
                    model: "grok-3-latest",
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`Grok API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Add to conversation history
            this.conversationHistory.push(
                { role: "user", content: userMessage },
                { role: "assistant", content: aiResponse }
            );

            this.hideTypingIndicator();
            this.addMessageToChat(aiResponse, 'ai');

            // Use voice synthesis if requested
            if (useVoice && this.synthesis) {
                this.speakMessage(aiResponse);
            }

            // Track engagement
            this.trackAdventureEngagement('grok_interaction', {
                user_message: userMessage,
                ai_response_length: aiResponse.length,
                voice_used: useVoice
            });

        } catch (error) {
            console.error('Grok AI error:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('I apologize, but I\'m having trouble connecting right now. Please try again in a moment.', 'ai');
        }
    }

    // Speak message using text-to-speech
    speakMessage(text) {
        if (!this.synthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        // Try to use a male voice if available
        const voices = this.synthesis.getVoices();
        const maleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('alex')
        );
        
        if (maleVoice) {
            utterance.voice = maleVoice;
        }

        this.synthesis.speak(utterance);
    }

    // Add message to chat UI
    addMessageToChat(message, sender) {
        const chatContainer = document.getElementById('adventure-chat');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const avatar = sender === 'ai' ? '🤖' : '👨‍💼';
        const senderName = sender === 'ai' ? 'Dad Boss AI' : 'You';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-sender">${senderName}</div>
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Show typing indicator
    showTypingIndicator() {
        const chatContainer = document.getElementById('adventure-chat');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message ai-message typing';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatContainer.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Show upgrade prompt for non-members
    showUpgradePrompt() {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-content">
                <h2>🎯 Adventure Mode - Members Only</h2>
                <p>Adventure Mode with AI-powered Dad Boss guidance is available exclusively to Dad Boss Club members.</p>
                <div class="upgrade-benefits">
                    <h3>What you get with membership:</h3>
                    <ul>
                        <li>🤖 AI-powered Dad Boss companion (Grok AI)</li>
                        <li>🎤 Voice-activated conversations</li>
                        <li>💬 Priority support via Intercom</li>
                        <li>📚 Exclusive Dad Boss resources</li>
                        <li>🏆 Community access and networking</li>
                    </ul>
                </div>
                <div class="upgrade-actions">
                    <a href="#membership" class="btn btn-primary">Join for $2.99/month</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary">Maybe Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Close Adventure Mode
    closeAdventureMode() {
        const container = document.getElementById('adventure-mode-container');
        if (container) {
            container.remove();
        }
        
        if (this.isListening && this.recognition) {
            this.recognition.stop();
        }
        
        this.isActive = false;
        this.isListening = false;
        this.conversationHistory = [];
    }

    // Track adventure mode engagement
    trackAdventureEngagement(eventType, eventData) {
        if (window.apiClient) {
            const memberId = localStorage.getItem('dadBossMemberId');
            if (memberId) {
                window.apiClient.trackEngagement(memberId, `adventure_${eventType}`, eventData).catch(console.error);
            }
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `adventure-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            background: ${type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize Adventure Mode Manager
const adventureMode = new AdventureModeManager();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdventureModeManager;
}

if (typeof window !== 'undefined') {
    window.AdventureModeManager = AdventureModeManager;
    window.adventureMode = adventureMode;
}