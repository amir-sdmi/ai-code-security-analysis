/**
 * AI Chatbot for Resume Portfolio
 * This chatbot can answer questions about Alapan's resume, skills, experience, and portfolio.
 * Enhanced with conversational AI capabilities to provide a more natural interaction.
 * Integrated with Gemini AI API for more intelligent responses.
 */

class ResumeBot {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatToggle = document.getElementById('chat-toggle');
        this.closeChat = document.getElementById('close-chat');
        this.sendMessage = document.getElementById('send-message');
        this.chatNotification = document.querySelector('.chat-notification');
        
        // Gemini API configuration
        this.apiEndpoint = "/api/gemini"; // Use server-side proxy endpoint
        this.useGeminiAPI = true; // Set to false to use local response generation instead of API
        
        this.isOpen = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        this.conversationHistory = [];
        this.typingSpeed = 20; // ms per character for typing effect
        this.isTyping = false;
        
        // Enhanced resume data with more details for AI responses
        this.resumeData = {
            name: "Alapan Das",  // Replace with your actual name
            location: "Kolkata, West Bengal",  // e.g., "San Francisco, CA"
            email: "alapandas123@gmail.com",  // Your contact email
            phone: "+91 9088969456",  // Your phone number
            education: {
                university: "Calcutta University",  // e.g., "Stanford University"
                degree: "B.Tech in Information Technology",  // e.g., "Master of Computer Science"
                graduationYear: "2026(Expected)",  // e.g., "2023" or "Expected 2025"
                achievements: "Finalist in Smart Bengal Hackathon 2025"  // e.g., "Graduated with honors, 3.9 GPA"
            },
            about: "YOUR PROFESSIONAL SUMMARY",  // A paragraph about yourself
            roles: ["ROLE 1", "ROLE 2", "ROLE 3"],  // e.g., ["Software Engineer", "Full-Stack Developer"]
            experience: [
                {
                    title: "JOB TITLE 1",  // e.g., "Senior Software Engineer"
                    company: "COMPANY 1",  // e.g., "Google"
                    period: "EMPLOYMENT PERIOD",  // e.g., "2020-2023"
                    responsibilities: [
                        "RESPONSIBILITY 1",  // Describe key responsibilities and achievements
                        "RESPONSIBILITY 2", 
                        "RESPONSIBILITY 3"
                    ]
                },
                {
                    title: "JOB TITLE 2",
                    company: "COMPANY 2",
                    period: "EMPLOYMENT PERIOD",
                    responsibilities: [
                        "RESPONSIBILITY 1",
                        "RESPONSIBILITY 2",
                        "RESPONSIBILITY 3"
                    ]
                }
                // Add more job experiences as needed
            ],
            skills: {
                "SKILL 1": {  // e.g., "JavaScript"
                    level: 90,  // Proficiency level from 0-100
                    description: "DETAILED DESCRIPTION OF YOUR SKILL LEVEL"  // Explain your expertise
                },
                "SKILL 2": {
                    level: 85,
                    description: "DETAILED DESCRIPTION OF YOUR SKILL LEVEL"
                },
                // Add more skills as needed
            },
            projects: [
                {
                    name: "PROJECT 1",  // e.g., "E-Commerce Platform"
                    description: "SHORT DESCRIPTION",  // Brief one-liner
                    detailedDescription: "DETAILED PROJECT DESCRIPTION",  // More comprehensive explanation
                    technologies: ["TECH 1", "TECH 2", "TECH 3"],  // e.g., ["React", "Node.js", "MongoDB"]
                    url: "PROJECT URL",  // Live demo or deployed version
                    github: "GITHUB REPO URL"  // Source code
                },
                // Add more projects as needed
            ],
            interests: [
                "INTEREST 1",  // e.g., "Machine Learning"
                "INTEREST 2",
                "INTEREST 3"
                // Add more interests
            ],
            certifications: [
                "CERTIFICATION 1",  // e.g., "AWS Certified Solutions Architect"
                "CERTIFICATION 2"
                // Add more certifications
            ],
            languages: [
                "LANGUAGE 1 (PROFICIENCY)",  // e.g., "English (Native)"
                "LANGUAGE 2 (PROFICIENCY)"
                // Add more languages
            ],
            socials: {
                linkedin: "YOUR LINKEDIN URL",
                github: "YOUR GITHUB URL",
                twitter: "YOUR TWITTER URL",
                // Add other social media profiles
            }
        };
        
        this.init();
    }
    
    init() {
        // Initialize chatbot
        this.loadApiKey();
        this.updateApiStatus();
        this.addEventListeners();
        this.addInitialMessage();
        
        // Apply dark mode if needed
        this.applyTheme();
        
        // Listen for theme changes
        this.listenForThemeChanges();
        
        // Remove notification after a delay
        setTimeout(() => {
            this.hideNotification();
        }, 15000);
    }
    
    // Update the API status indicator
    updateApiStatus() {
        const apiStatus = document.getElementById('api-status');
        const apiHelpText = document.getElementById('api-help-text');
        
        if (!apiStatus) return;
        
        if (this.useGeminiAPI) {
            apiStatus.classList.add('enabled');
            apiStatus.classList.remove('disabled');
            apiStatus.querySelector('.api-status-text').textContent = 'Gemini';
            
            if (apiHelpText) {
                apiHelpText.style.display = 'none';
            }
        } else {
            apiStatus.classList.add('disabled');
            apiStatus.classList.remove('enabled');
            apiStatus.querySelector('.api-status-text').textContent = 'Basic';
            
            if (apiHelpText) {
                apiHelpText.style.display = 'block';
            }
        }
    }
    
    // Load saved API key from localStorage
    loadApiKey() {
        // No need to load or store API key on frontend when using proxy
        this.useGeminiAPI = true;
    }
    
    addEventListeners() {
        // Toggle chatbot visibility
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        this.closeChat.addEventListener('click', () => this.toggleChat());
        
        // Send message on button click
        this.sendMessage.addEventListener('click', () => this.handleUserMessage());
        
        // Send message on Enter key
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });
        
        // Add event listener for the API key setup command
        this.chatInput.addEventListener('input', (e) => {
            const inputText = e.target.value.trim();
            
            // Special command to set the API key: /setapikey YOUR_API_KEY
            if (inputText.startsWith('/setapikey ')) {
                const apiKey = inputText.replace('/setapikey ', '').trim();
                if (apiKey) {
                    this.saveApiKey(apiKey);
                    this.chatInput.value = '';
                    this.addSystemMessage("✅ Gemini API key saved! The chatbot will now use Gemini AI for responses.");
                }
            }
            
            // Command to show API key instructions
            else if (inputText === '/apihelp') {
                this.chatInput.value = '';
                this.showApiKeyInstructions();
            }
        });
    }
    
    toggleChat() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.chatContainer.classList.add('open');
            this.chatInput.focus();
        } else {
            this.chatContainer.classList.remove('open');
        }
        
        // Hide notification when chat is opened
        if (this.isOpen) {
            this.hideNotification();
        }
    }
    
    hideNotification() {
        if (this.chatNotification) {
            this.chatNotification.style.display = 'none';
        }
    }
    
    applyTheme() {
        // Apply appropriate theme class to chatbot
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
    
    listenForThemeChanges() {
        // Listen for theme changes from the theme toggle
        const themeToggle = document.getElementById('theme-toggle-checkbox');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                this.isDarkMode = themeToggle.checked;
                this.applyTheme();
            });
        }
    }
    
    addInitialMessage() {
        setTimeout(() => {
            let welcomeMessage = "👋 Hi there! I'm an AI assistant that can tell you all about Alapan Das. Ask me anything about his skills, projects, education, experience, or interests!";
            
            if (this.useGeminiAPI) {
                welcomeMessage += "\n\n✨ I'm powered by Google's Gemini AI for more intelligent and dynamic responses!";
            }
            
            this.addBotMessage(welcomeMessage);
            
            // If API is not configured, show a hint after a delay
            if (!this.useGeminiAPI) {
                setTimeout(() => {
                    this.addSystemMessage("💡 Tip: To enable advanced AI capabilities, set your Gemini API key using the command: /setapikey YOUR_API_KEY");
                }, 2000);
            }
        }, 500);
    }
    
    handleUserMessage() {
        const message = this.chatInput.value.trim();
        
        if (message === '' || this.isTyping) return;
        
        // Add user message to chat
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });
        
        // Generate typing indicator
        this.showTypingIndicator();
        
        // Process the message and generate a response
        if (this.useGeminiAPI) {
            this.getGeminiResponse(message);
        } else {
            setTimeout(() => {
                const response = this.generateResponse(message);
                this.hideTypingIndicator();
                this.addBotMessageWithTypingEffect(response);
                
                // Add to conversation history
                this.conversationHistory.push({ role: 'assistant', content: response });
            }, 800);
        }
    }
    
    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'bot-message', 'typing-indicator');
        typingIndicator.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingIndicator);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    addUserMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('chat-message', 'user-message');
        messageElem.innerHTML = `<p>${this.escapeHTML(message)}</p>`;
        this.chatMessages.appendChild(messageElem);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    addBotMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('chat-message', 'bot-message');
        messageElem.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${message}
            </div>
        `;
        this.chatMessages.appendChild(messageElem);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    addBotMessageWithTypingEffect(message) {
        this.isTyping = true;
        const messageElem = document.createElement('div');
        messageElem.classList.add('chat-message', 'bot-message');
        messageElem.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-text"></div>
            </div>
        `;
        this.chatMessages.appendChild(messageElem);
        
        const typingTextElem = messageElem.querySelector('.typing-text');
        let i = 0;
        
        // Determine typing speed based on message length
        const dynamicSpeed = Math.max(5, Math.min(20, this.typingSpeed - message.length / 100));
        
        const typeNextChar = () => {
            if (i < message.length) {
                // Handle HTML tags properly
                if (message.substring(i).startsWith('<')) {
                    // Find the end of the tag
                    const tagEnd = message.indexOf('>', i);
                    if (tagEnd !== -1) {
                        const fullTag = message.substring(i, tagEnd + 1);
                        typingTextElem.innerHTML += fullTag;
                        i = tagEnd + 1;
                    } else {
                        // Fallback if no closing bracket
                        typingTextElem.innerHTML += message[i];
                        i++;
                    }
                } else {
                    typingTextElem.innerHTML += message[i];
                    i++;
                }
                
                // Auto-scroll to bottom
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                
                setTimeout(typeNextChar, dynamicSpeed);
            } else {
                this.isTyping = false;
            }
        };
        
        typeNextChar();
    }
    
    generateResponse(message) {
        const lowercaseMsg = message.toLowerCase();
        
        // Use conversation history for context
        const recentMessages = this.conversationHistory.slice(-4);
        const context = this.getConversationContext(recentMessages);
        
        // Check for greetings
        if (this.containsAny(lowercaseMsg, ['hello', 'hi', 'hey', 'greetings', 'howdy'])) {
            return `Hello! I'm ${this.resumeData.name}'s AI assistant. How can I help you today? You can ask me about his skills, education, projects, experience, or anything else you'd like to know.`;
        }
        
        // First try complex question handler
        const complexQuestionResponse = this.handleComplexQuestion(lowercaseMsg);
        if (complexQuestionResponse) {
            return complexQuestionResponse;
        }
        
        // Try domain knowledge next
        const domainKnowledge = this.getDomainKnowledge(lowercaseMsg);
        if (domainKnowledge) {
            return domainKnowledge;
        }
        
        // CUSTOM HANDLERS FOR SPECIFIC QUESTIONS
        // Add your own custom handlers for specific questions you anticipate
        
        // Example: Questions about specific achievements
        if (this.matchesIntent(lowercaseMsg, ['biggest achievement', 'proudest moment', 'major accomplishment', 'achievement'])) {
            return `One of ${this.resumeData.name}'s most significant achievements was [DESCRIBE YOUR MAJOR ACHIEVEMENT]. This project/work demonstrated strong skills in [SKILLS USED] and resulted in [POSITIVE OUTCOMES].`;
        }
        
        // Example: Questions about future goals
        if (this.matchesIntent(lowercaseMsg, ['future goals', 'career plans', 'ambitions', 'next steps', 'aspiration'])) {
            return `${this.resumeData.name} is passionate about [YOUR CAREER GOALS] and is working toward [SPECIFIC FUTURE PLANS]. With strong experience in [YOUR KEY SKILLS], the goal is to [DESCRIBE CAREER TRAJECTORY].`;
        }
        
        // Example: Questions about strengths and weaknesses
        if (this.matchesIntent(lowercaseMsg, ['strength', 'weakness', 'good at', 'improve', 'challenge'])) {
            return `${this.resumeData.name}'s key strengths include [LIST KEY STRENGTHS WITH EXAMPLES]. Areas being actively improved include [HONEST AREAS OF GROWTH FRAMED POSITIVELY].`;
        }
        
        // Example: Questions about work style
        if (this.matchesIntent(lowercaseMsg, ['work style', 'work environment', 'team player', 'independent', 'collaborate'])) {
            return `${this.resumeData.name} thrives in [DESCRIBE IDEAL WORK ENVIRONMENT] and has a work style that emphasizes [KEY WORK STYLE TRAITS]. With experience in both collaborative team environments and independent projects, [HE/SHE] [DESCRIBE COLLABORATION APPROACH].`;
        }
        
        // Check for chatbot identity
        if (this.containsAny(lowercaseMsg, ['your name', 'who are you', 'chatbot name', 'are you human', 'are you ai'])) {
            return `I'm Akyon, AI assistant representing ${this.resumeData.name}. While I'm not human, I've been programmed with detailed information about ${this.resumeData.name.split(' ')[0]}'s resume, skills, projects, and professional experience. Feel free to ask me anything about him!`;
        }
        
        // Personal information
        if (this.matchesIntent(lowercaseMsg, ['who is alapan', 'tell me about alapan', 'who is this person'])) {
            return `${this.resumeData.name} is an IT student at the University of Calcutta and a passionate web developer and software engineer. He specializes in creating responsive, user-friendly web applications and has experience with various programming languages and technologies. Outside of coding, he enjoys learning about AI, contributing to open-source projects, and staying updated with the latest tech trends.`;
        }
        
        if (this.matchesIntent(lowercaseMsg, ['location', 'where', 'city', 'country', 'live', 'based'])) {
            return `${this.resumeData.name} is based in ${this.resumeData.location}. He's currently pursuing his studies there while also working on freelance projects and building his portfolio.`;
        }
        
        if (this.matchesIntent(lowercaseMsg, ['contact', 'email', 'phone', 'reach', 'get in touch', 'connect'])) {
            return `You can contact ${this.resumeData.name} via:
                <ul>
                    <li>📧 Email: <a href="mailto:${this.resumeData.email}">${this.resumeData.email}</a></li>
                    <li>📱 Phone: ${this.resumeData.phone}</li>
                    <li>💼 LinkedIn: <a href="${this.resumeData.socials.linkedin}" target="_blank">Alapan Das</a></li>
                </ul>
                He's always open to discussing new opportunities, collaborations, or just connecting with fellow tech enthusiasts!`;
        }
        
        // Education and background
        if (this.matchesIntent(lowercaseMsg, ['education', 'study', 'university', 'college', 'school', 'degree', 'academic'])) {
            return `${this.resumeData.name} is currently pursuing a ${this.resumeData.education.degree} at ${this.resumeData.education.university}, expected to graduate in ${this.resumeData.education.graduationYear}. ${this.resumeData.education.achievements && `During his studies, he has ${this.resumeData.education.achievements.toLowerCase()}.`} His academic focus is on software development, web technologies, and information systems.`;
        }
        
        if (this.matchesIntent(lowercaseMsg, ['about', 'background', 'tell me about', 'who is', 'introduce'])) {
            return this.resumeData.about;
        }
        
        // Work experience
        if (this.matchesIntent(lowercaseMsg, ['experience', 'work history', 'job', 'professional', 'career', 'worked'])) {
            let response = `${this.resumeData.name} has the following work experience:<ul>`;
            
            this.resumeData.experience.forEach(exp => {
                response += `<li><strong>${exp.title}</strong> at ${exp.company} (${exp.period})<ul>`;
                exp.responsibilities.forEach(resp => {
                    response += `<li>${resp}</li>`;
                });
                response += `</ul></li>`;
            });
            
            response += `</ul>`;
            return response;
        }
        
        // Skills
        if (this.matchesIntent(lowercaseMsg, ['skills', 'expertise', 'good at', 'capable', 'technologies', 'tech stack'])) {
            let response = `${this.resumeData.name}'s top skills include:<ul>`;
            
            Object.entries(this.resumeData.skills)
                .sort((a, b) => b[1].level - a[1].level)
                .forEach(([skill, info]) => {
                    response += `<li><strong>${skill}</strong> (${info.level}%): ${info.description}</li>`;
                });
            
            response += `</ul>`;
            return response;
        }
        
        // Specific skill inquiries
        const skillMatches = this.matchSkill(lowercaseMsg);
        if (skillMatches) {
            const { skill, skillInfo } = skillMatches;
            return `<strong>${skill}:</strong> ${this.resumeData.name} has a proficiency level of ${skillInfo.level}% in ${skill}. ${skillInfo.description}`;
        }
        
        // Programming languages
        if (this.matchesIntent(lowercaseMsg, ['programming', 'coding', 'languages', 'code', 'development languages'])) {
            return `${this.resumeData.name} is proficient in multiple programming languages including C++, Java, JavaScript, HTML/CSS, and SQL/MySQL. He follows best practices for clean, maintainable code and is always learning new technologies to add to his toolkit.`;
        }
        
        // Projects
        if (this.matchesIntent(lowercaseMsg, ['projects', 'portfolio', 'work', 'created', 'built', 'developed', 'showcase'])) {
            let response = `${this.resumeData.name} has worked on several noteworthy projects:<ul>`;
            
            this.resumeData.projects.forEach(project => {
                response += `<li><strong>${project.name}</strong>: ${project.detailedDescription || project.description}<br>
                <em>Technologies used:</em> ${project.technologies.join(', ')}</li>`;
            });
            
            response += `</ul>`;
            return response;
        }
        
        // Specific project inquiries
        const projectMatch = this.matchProject(lowercaseMsg);
        if (projectMatch) {
            const project = projectMatch;
            let response = `<strong>${project.name}</strong>:<p>${project.detailedDescription || project.description}</p>
            <p><em>Technologies used:</em> ${project.technologies.join(', ')}</p>`;
            
            if (project.url || project.github) {
                response += `<p>`;
                if (project.url) response += `<a href="${project.url}" target="_blank">View Live Project</a> `;
                if (project.github) response += `<a href="${project.github}" target="_blank">View Source Code</a>`;
                response += `</p>`;
            }
            
            return response;
        }
        
        // Interests
        if (this.matchesIntent(lowercaseMsg, ['interests', 'hobbies', 'passion', 'enjoy', 'like to do'])) {
            let response = `${this.resumeData.name}'s professional interests include:<ul>`;
            
            this.resumeData.interests.forEach(interest => {
                response += `<li>${interest}</li>`;
            });
            
            response += `</ul>He's particularly passionate about staying up-to-date with the latest trends in technology and applying them to solve real-world problems.`;
            return response;
        }
        
        // Certifications
        if (this.matchesIntent(lowercaseMsg, ['certifications', 'certificates', 'courses', 'training', 'qualified'])) {
            let response = `${this.resumeData.name} has earned the following certifications:<ul>`;
            
            this.resumeData.certifications.forEach(cert => {
                response += `<li>${cert}</li>`;
            });
            
            response += `</ul>He believes in continuous learning and is always working to expand his knowledge.`;
            return response;
        }
        
        // Languages spoken
        if (this.matchesIntent(lowercaseMsg, ['languages spoken', 'speak', 'language', 'multilingual', 'fluent in'])) {
            let response = `${this.resumeData.name} speaks the following languages:<ul>`;
            
            this.resumeData.languages.forEach(lang => {
                response += `<li>${lang}</li>`;
            });
            
            response += `</ul>`;
            return response;
        }
        
        // Social media
        if (this.matchesIntent(lowercaseMsg, ['social', 'linkedin', 'github', 'facebook', 'instagram', 'links', 'profiles', 'social media'])) {
            return `You can connect with ${this.resumeData.name} on various social platforms: 
                <ul>
                    <li><a href="${this.resumeData.socials.linkedin}" target="_blank"><i class="fab fa-linkedin"></i> LinkedIn</a></li>
                    <li><a href="${this.resumeData.socials.github}" target="_blank"><i class="fab fa-github"></i> GitHub</a></li>
                    <li><a href="${this.resumeData.socials.twitter}" target="_blank"><i class="fab fa-twitter"></i> Twitter</a></li>
                </ul>
                Feel free to follow or connect with him on any of these platforms!`;
        }
        
        // Handle thank you and appreciation
        if (this.matchesIntent(lowercaseMsg, ['thank', 'thanks', 'appreciate', 'helpful', 'great'])) {
            return `You're welcome! I'm happy to help. If you have any other questions about ${this.resumeData.name}'s background, skills, or projects, feel free to ask!`;
        }
        
        // Handle goodbye
        if (this.matchesIntent(lowercaseMsg, ['bye', 'goodbye', 'see you', 'farewell', 'later'])) {
            return `Thanks for chatting! Feel free to reach out if you have more questions about ${this.resumeData.name}. Have a great day!`;
        }
        
        // Fallback for unknown queries
        return `I'm not sure I understand your question about ${this.resumeData.name}. You can ask me about his skills, education, work experience, projects, or contact information. How can I help you learn more about him?`;
    }
    
    // Get conversation context from recent messages
    getConversationContext(messages) {
        if (messages.length <= 1) return null;
        
        // Look for question patterns in previous exchanges
        const topics = [];
        messages.forEach(msg => {
            if (msg.role === 'user') {
                const text = msg.content.toLowerCase();
                
                if (text.includes('skill')) topics.push('skills');
                if (text.includes('project')) topics.push('projects');
                if (text.includes('education') || text.includes('study')) topics.push('education');
                if (text.includes('experience') || text.includes('work')) topics.push('experience');
                if (text.includes('contact') || text.includes('email')) topics.push('contact');
            }
        });
        
        // Return the most frequent topic
        if (topics.length === 0) return null;
        
        const topicCounts = topics.reduce((acc, topic) => {
            acc[topic] = (acc[topic] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    // Check if the message contains any of the keywords
    containsAny(str, keywords) {
        return keywords.some(keyword => str.includes(keyword));
    }
    
    // Better intent matching with contextual understanding
    matchesIntent(message, keywords) {
        // Direct matches
        if (this.containsAny(message, keywords)) {
            return true;
        }
        
        // Context from conversation
        const context = this.getConversationContext(this.conversationHistory.slice(-4));
        if (context) {
            // If we're already talking about this topic, be more lenient with matches
            if (keywords.some(k => k.includes(context) || context.includes(k))) {
                // Check for follow-up question patterns
                return message.includes('what') || 
                       message.includes('how') || 
                       message.includes('tell') || 
                       message.includes('more') ||
                       message.length < 20; // Short follow-up
            }
        }
        
        return false;
    }
    
    // Match specific skill inquiries
    matchSkill(message) {
        for (const [skill, info] of Object.entries(this.resumeData.skills)) {
            if (message.includes(skill.toLowerCase())) {
                return { skill, skillInfo: info };
            }
        }
        return null;
    }
    
    // Match specific project inquiries
    matchProject(message) {
        for (const project of this.resumeData.projects) {
            if (message.includes(project.name.toLowerCase())) {
                return project;
            }
            
            // Check technologies
            for (const tech of project.technologies) {
                if (message.includes(tech.toLowerCase()) && 
                    (message.includes('project') || message.includes('work') || message.includes('portfolio'))) {
                    return project;
                }
            }
        }
        return null;
    }
    
    // Domain knowledge for questions in your industry
    getDomainKnowledge(query) {
        // Add domain-specific knowledge here related to your field
        // This allows your chatbot to answer questions relevant to your industry
        
        const domainKeywords = {
            // SOFTWARE/TECH EXAMPLE (replace with your field's keywords)
            "agile": "Agile is a development methodology that emphasizes iterative development, collaboration, and customer feedback. [YOUR_NAME] has experience with Agile methodologies including Scrum and Kanban, having worked in sprint cycles and participated in daily stand-ups, sprint planning, and retrospectives.",
            
            "react": "React is a JavaScript library for building user interfaces, particularly for single-page applications. [YOUR_NAME] has built several projects with React, including [PROJECT EXAMPLES].",
            
            "cloud computing": "Cloud computing delivers computing services over the internet, including servers, storage, databases, and software. [YOUR_NAME] has experience with [SPECIFIC CLOUD PLATFORMS] for [SPECIFIC USES].",
            
            // Add more domain keywords relevant to your field
            // "keyword": "detailed explanation incorporating your experience",
        };
        
        // Check if the query contains domain-specific keywords
        for (const [keyword, explanation] of Object.entries(domainKeywords)) {
            if (query.includes(keyword.toLowerCase())) {
                return explanation.replace(/\[YOUR_NAME\]/g, this.resumeData.name);
            }
        }
        
        return null;
    }
    
    // Handle complex or multi-part questions
    handleComplexQuestion(message) {
        const lowercaseMsg = message.toLowerCase();
        
        // Check if this is a complex question (contains multiple question aspects)
        const questionParts = [];
        
        // Skills + Experience combination
        if ((lowercaseMsg.includes('skill') || lowercaseMsg.includes('know')) && 
            (lowercaseMsg.includes('experience') || lowercaseMsg.includes('work'))) {
            questionParts.push('skills');
            questionParts.push('experience');
        }
        
        // Education + Projects combination
        if ((lowercaseMsg.includes('education') || lowercaseMsg.includes('study') || lowercaseMsg.includes('degree')) && 
            (lowercaseMsg.includes('project') || lowercaseMsg.includes('portfolio'))) {
            questionParts.push('education');
            questionParts.push('projects');
        }
        
        // Skills + Projects combination
        if ((lowercaseMsg.includes('skill') || lowercaseMsg.includes('know')) && 
            (lowercaseMsg.includes('project') || lowercaseMsg.includes('build') || lowercaseMsg.includes('create'))) {
            questionParts.push('skills');
            questionParts.push('projects');
        }
        
        // If not a complex question, return null
        if (questionParts.length <= 1) {
            return null;
        }
        
        // Handle the complex question by addressing each part
        let response = `I'd be happy to tell you about multiple aspects of ${this.resumeData.name}'s background:\n\n`;
        
        if (questionParts.includes('skills')) {
            response += `<strong>Key Skills:</strong> `;
            const topSkills = Object.entries(this.resumeData.skills)
                .sort((a, b) => b[1].level - a[1].level)
                .slice(0, 3)
                .map(([skill, info]) => `${skill} (${info.level}%)`);
            response += `${this.resumeData.name} is most proficient in ${topSkills.join(', ')}`;
            response += `<br><br>`;
        }
        
        if (questionParts.includes('experience')) {
            response += `<strong>Work Experience:</strong> `;
            if (this.resumeData.experience && this.resumeData.experience.length > 0) {
                const latestJob = this.resumeData.experience[0];
                response += `Most recently worked as ${latestJob.title} at ${latestJob.company} (${latestJob.period}).`;
                if (this.resumeData.experience.length > 1) {
                    response += ` Also has experience at ${this.resumeData.experience[1].company}.`;
                }
            } else {
                response += `Currently focusing on ${this.resumeData.roles.join(' and ')}.`;
            }
            response += `<br><br>`;
        }
        
        if (questionParts.includes('education')) {
            response += `<strong>Education:</strong> `;
            response += `${this.resumeData.name} studied ${this.resumeData.education.degree} at ${this.resumeData.education.university}.`;
            response += `<br><br>`;
        }
        
        if (questionParts.includes('projects')) {
            response += `<strong>Notable Projects:</strong> `;
            if (this.resumeData.projects && this.resumeData.projects.length > 0) {
                const projectNames = this.resumeData.projects.map(p => p.name).slice(0, 2);
                response += `${this.resumeData.name} has worked on ${projectNames.join(' and ')}, among others.`;
            } else {
                response += `Information about specific projects is available upon request.`;
            }
            response += `<br><br>`;
        }
        
        response += `Would you like more details about any of these aspects?`;
        
        return response;
    }
    
    // Safe HTML escaping
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // New method to call Gemini AI API
    async getGeminiResponse(message) {
        // Prepare resume context for the AI
        const resumeContext = this.prepareResumeContext();
        // Prepare conversation history for context
        const recentMessages = this.conversationHistory.slice(-6); // Last 6 messages
        let conversationContext = "";
        recentMessages.forEach(msg => {
            if (msg.role === 'user') {
                conversationContext += `User: ${msg.content}\n`;
            } else {
                conversationContext += `Assistant: ${msg.content}\n`;
            }
        });
        // Construct prompt for Gemini
        const prompt = `\nYou are an AI assistant for ${this.resumeData.name}'s resume portfolio website. \nYour task is to answer questions about ${this.resumeData.name}'s skills, experience, education, projects, and other professional information.\n\nHere's the resume data:\n${resumeContext}\n\nRecent conversation:\n${conversationContext}\n\nUser's current question: ${message}\n\nProvide a helpful, accurate, and engaging response based on the resume information. If you don't know the answer, don't make things up - just say you don't have that specific information. Keep responses clear, concise, and professional.\n`;
        try {
            // Call Gemini API via proxy
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API error:', errorData);
                throw new Error(`API request failed with status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response generated from Gemini API.');
            }
            const aiResponse = data.candidates[0].content.parts[0].text;
            const formattedResponse = this.formatGeminiResponse(aiResponse);
            this.hideTypingIndicator();
            this.addBotMessageWithTypingEffect(formattedResponse);
            this.conversationHistory.push({ role: 'assistant', content: formattedResponse });
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            this.hideTypingIndicator();
            this.addSystemMessage(`⚠️ ${error.message}`);
            const fallbackResponse = this.generateResponse(message);
            this.hideTypingIndicator();
            this.addBotMessageWithTypingEffect(fallbackResponse);
            this.conversationHistory.push({ role: 'assistant', content: fallbackResponse });
        }
    }
    
    // Format and clean up Gemini API response
    formatGeminiResponse(response) {
        // Remove any unwanted prefixes that might come from the API
        let cleanResponse = response.replace(/^(Assistant:|AI:|Chatbot:)/i, '').trim();
        
        // Add HTML formatting if needed
        if (!cleanResponse.includes('<')) {
            // Add paragraph tags for plain text
            cleanResponse = `<p>${cleanResponse.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
        }
        
        return cleanResponse;
    }
    
    // Prepare resume context for the AI
    prepareResumeContext() {
        // Convert resumeData to a string representation for the AI
        return JSON.stringify(this.resumeData, null, 2);
    }
    
    // Add a system message (not from the bot or user)
    addSystemMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('chat-message', 'system-message');
        messageElem.innerHTML = `<div class="message-content">${message}</div>`;
        this.chatMessages.appendChild(messageElem);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    // Test Gemini API connection
    async testApiConnection() {
        if (!this.apiKey) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Hello, this is a test message. Please respond with 'Connection successful'."
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('API test connection failed:', error);
            return false;
        }
    }
    
    // Show instructions for obtaining and setting up a Gemini API key
    showApiKeyInstructions() {
        const instructions = `
        <div class="api-instructions">
            <h4>How to Get a Gemini API Key</h4>
            <ol>
                <li>Go to <a href="https://ai.google.dev/" target="_blank">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click on "Get API key" in the menu</li>
                <li>Create a new API key or use an existing one</li>
                <li>Copy your API key</li>
            </ol>
            <h4>How to Use Your API Key</h4>
            <p>Type the following command in the chat input:</p>
            <code>/setapikey YOUR_API_KEY</code>
            <p>Replace YOUR_API_KEY with the actual key you copied.</p>
            <p class="note">Note: Your API key is stored locally in your browser and is not sent to any server except Google's Gemini API.</p>
        </div>
        `;
        
        this.addSystemMessage(instructions);
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeBot();
});

// Add typing animation CSS to the document
document.addEventListener('DOMContentLoaded', () => {
    // Create a style element
    const style = document.createElement('style');
    
    // Add CSS for typing animation
    style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
            padding: 8px 0;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--chat-primary);
            animation: typingAnimation 1.5s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(1) {
            animation-delay: 0s;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typingAnimation {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.6;
            }
            30% {
                transform: translateY(-5px);
                opacity: 1;
            }
        }
    `;
    
    // Append the style element to the document head
    document.head.appendChild(style);
}); 