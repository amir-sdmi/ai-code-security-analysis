// SeeWrite AI - Premium Competition Version
// AWS Breaking Barriers Challenge Winner

const API_CONFIG = {
    IMAGE_PROCESSOR_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/process-image',
    CHAT_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/chat',
    AUDIO_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/generate-audio',
    AMAZON_Q_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/amazon-q'
};

// Global state
let currentDescription = '';
let currentAudio = null;
let analysisStartTime = null;
let chatCount = 0;

// DOM Elements
const elements = {
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    processBtn: document.getElementById('processBtn'),
    clearBtn: document.getElementById('clearBtn'),
    processingStatus: document.getElementById('processingStatus'),
    resultsSection: document.getElementById('resultsSection'),
    errorDisplay: document.getElementById('errorDisplay'),
    errorMessage: document.getElementById('errorMessage'),
    descriptionText: document.getElementById('descriptionText'),
    audioPlayer: document.getElementById('audioPlayer'),
    playAudioBtn: document.getElementById('playAudioBtn'),
    questionInput: document.getElementById('questionInput'),
    askBtn: document.getElementById('askBtn'),
    chatHistory: document.getElementById('chatHistory'),
    analysisTime: document.getElementById('analysisTime'),
    wordCount: document.getElementById('wordCount'),
    audioLength: document.getElementById('audioLength')
};

// Premium animations and effects
function triggerSuccessAnimation() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb']
    });
}

function typewriterEffect(text, element, speed = 30) {
    element.innerHTML = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
            element.classList.add('success-bounce');
        }
    }, speed);
}

function streamTextWithHighlights(text, element) {
    element.innerHTML = '';
    
    // Parse and format the text into structured sections
    const formattedContent = formatEducationalContent(text);
    
    let delay = 0;
    formattedContent.forEach((section, index) => {
        setTimeout(() => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'text-stream mb-4';
            sectionDiv.style.animationDelay = `${index * 0.1}s`;
            sectionDiv.innerHTML = section;
            element.appendChild(sectionDiv);
        }, delay);
        delay += 300;
    });
}

function formatEducationalContent(text) {
    const sections = [];
    
    // Split by sentences and format with better styling
    const sentences = text.split(/(?<=\.)\s+/);
    let currentSection = '';
    
    sentences.forEach((sentence, index) => {
        sentence = sentence.trim();
        if (!sentence) return;
        
        // Check for section headers
        if (/^\d+\.|^[A-Z][^.]*:/.test(sentence)) {
            if (currentSection) {
                sections.push(`<div class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                    <p class="text-gray-800 leading-relaxed">${currentSection}</p>
                </div>`);
                currentSection = '';
            }
            sections.push(`<div class="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-400">
                <h4 class="font-semibold text-purple-800">${sentence}</h4>
            </div>`);
        }
        // Key educational terms
        else if (/\b(Key|Main|Important|Educational|Learning|Concept|Objective)\b/i.test(sentence)) {
            sections.push(`<div class="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-400">
                <p class="text-yellow-800 font-medium">${sentence}</p>
            </div>`);
        }
        // Regular sentences
        else {
            currentSection += (currentSection ? ' ' : '') + sentence;
        }
    });
    
    // Add remaining content
    if (currentSection) {
        sections.push(`<div class="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
            <p class="text-gray-700 leading-relaxed">${currentSection}</p>
        </div>`);
    }
    
    return sections.length > 0 ? sections : [`<div class="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
        <p class="text-gray-700 leading-relaxed">${text}</p>
    </div>`];
}

// Enhanced event listeners with accessibility
function initializeEventListeners() {
    elements.imageInput.addEventListener('change', handleImageSelect);
    elements.processBtn.addEventListener('click', processImage);
    elements.clearBtn.addEventListener('click', clearImage);
    elements.playAudioBtn.addEventListener('click', playMainAudio);
    elements.askBtn.addEventListener('click', askQuestion);
    
    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Accessibility controls
    addAccessibilityControls();
    
    elements.questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askQuestion();
            e.preventDefault();
        }
    });
    
    // Enhanced drag and drop
    const uploadZone = document.querySelector('.upload-zone');
    
    // Upload zone keyboard support
    uploadZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            elements.imageInput.click();
        }
    });
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('glow-effect', 'scale-105');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('glow-effect', 'scale-105');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('glow-effect', 'scale-105');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            elements.imageInput.files = files;
            handleImageSelect({ target: { files } });
        }
    });

    // Quick question buttons with keyboard support
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-question')) {
            elements.questionInput.value = e.target.textContent;
            elements.questionInput.focus();
            askQuestion();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('quick-question')) {
            e.preventDefault();
            elements.questionInput.value = e.target.textContent;
            elements.questionInput.focus();
            askQuestion();
        }
    });
}

// Enhanced image handling
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImg.src = e.target.result;
        elements.imagePreview.classList.remove('hidden');
        elements.imagePreview.classList.add('success-bounce');
        hideError();
        hideResults();
        
        // Trigger success sound/animation
        setTimeout(() => {
            elements.processBtn.classList.add('glow-effect');
        }, 500);
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    elements.imageInput.value = '';
    elements.imagePreview.classList.add('hidden');
    elements.processBtn.classList.remove('glow-effect');
    hideResults();
    hideError();
    hideProcessing();
    currentDescription = '';
    chatCount = 0;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

// Enhanced image processing
async function processImage() {
    const file = elements.imageInput.files[0];
    if (!file) {
        showError('Please select an image first');
        return;
    }

    analysisStartTime = Date.now();
    showProcessing();
    hideError();
    hideResults();

    try {
        const base64Image = await fileToBase64(file);
        
        const response = await fetch(API_CONFIG.IMAGE_PROCESSOR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
            triggerSuccessAnimation();
        } else {
            throw new Error(result.error || 'Processing failed');
        }

    } catch (error) {
        console.error('Error processing image:', error);
        showError('Failed to process image. Please try again.');
    } finally {
        hideProcessing();
    }
}

function displayResults(result) {
    currentDescription = result.description;
    const analysisTime = ((Date.now() - analysisStartTime) / 1000).toFixed(1);
    
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.classList.add('success-bounce');
    
    // Update stats
    elements.analysisTime.textContent = `${analysisTime}s`;
    elements.wordCount.textContent = result.description.split(' ').length;
    
    // Enhanced text display with streaming effect
    streamTextWithHighlights(result.description, elements.descriptionText);
    
    elements.chatHistory.innerHTML = '';
    
    // Setup audio if available
    if (result.audio_base64) {
        setupMainAudio(result.audio_base64);
        // Calculate approximate audio length
        const audioLength = Math.ceil(result.description.split(' ').length / 3); // ~3 words per second
        elements.audioLength.textContent = `${audioLength}s`;
    }
    
    // Scroll to results
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function setupMainAudio(audioBase64) {
    const audioBlob = base64ToBlob(audioBase64, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    elements.audioPlayer.src = audioUrl;
    elements.audioPlayer.style.display = 'block';
    
    elements.playAudioBtn.onclick = () => {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        currentAudio = elements.audioPlayer;
        elements.audioPlayer.play();
        elements.playAudioBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>🎧 Playing...';
    };
    
    elements.audioPlayer.onended = () => {
        elements.playAudioBtn.innerHTML = '<i class="fas fa-play mr-2"></i>🎧 Premium Audio';
    };
}

function playMainAudio() {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }
    currentAudio = elements.audioPlayer;
    elements.audioPlayer.play();
    elements.playAudioBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>🎧 Playing...';
}

// Enhanced Q&A functionality with fallback responses
async function askQuestion() {
    const question = elements.questionInput.value.trim();
    if (!question) return;

    if (!currentDescription) {
        showError('Please process an image first');
        return;
    }

    chatCount++;
    addChatMessage(question, 'user');
    elements.questionInput.value = '';
    
    const loadingId = addChatMessage('🤔 AI is thinking...', 'ai', true);

    try {
        // Try the API with a shorter timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(API_CONFIG.CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                original_description: currentDescription
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        document.getElementById(loadingId).remove();
        
        if (result.success) {
            const messageId = addChatMessageStreaming(result.answer, 'ai');
            // Generate audio for Q&A response
            generateAudioForMessage(messageId, result.answer);
            
        } else {
            throw new Error(result.error || 'Failed to get answer');
        }

    } catch (error) {
        console.error('Error asking question:', error);
        document.getElementById(loadingId).remove();
        
        // Use Amazon Q for all responses
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const qResponse = await fetch(API_CONFIG.AMAZON_Q_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, context: currentDescription }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (qResponse.ok) {
            const qResult = await qResponse.json();
            if (qResult.success) {
                const messageId = addChatMessageStreaming(qResult.answer, 'ai');
                generateAudioForMessage(messageId, qResult.answer);
                return;
            }
        }
        
        throw new Error('Amazon Q service unavailable');
    }
}

// Generate intelligent fallback answers based on the question and image description
function generateFallbackAnswer(question, description) {
    const lowerQuestion = question.toLowerCase();
    
    // Handle social responses
    if (lowerQuestion.includes('thank') || lowerQuestion.includes('thanks')) {
        return `You're welcome! I'm glad I could help analyze the image for you. Is there anything else you'd like to know about what we discovered?`;
    }
    
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
        return `Hello! I've analyzed your image and found: ${description}. What would you like to explore about it?`;
    }
    
    if (lowerQuestion.includes('good') || lowerQuestion.includes('great') || lowerQuestion.includes('awesome') || lowerQuestion.includes('nice')) {
        return `I'm so glad you found it helpful! The image analysis revealed quite a bit. Feel free to ask about any specific details you're curious about.`;
    }
    
    if (lowerQuestion.includes('ok') || lowerQuestion.includes('okay') || question.length < 3) {
        return `Got it! If you have any questions about the image content or need clarification on anything, just let me know. I'm here to help!`;
    }
    
    // Handle social responses
    if (lowerQuestion.includes('thank') || lowerQuestion.includes('thanks')) {
        return `You're welcome! I'm glad I could help analyze the image for you. Is there anything else you'd like to know?`;
    }
    
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
        return `Hello! I've analyzed your image. What would you like to explore about it?`;
    }
    
    if (lowerQuestion.includes('good') || lowerQuestion.includes('great') || lowerQuestion.includes('awesome') || lowerQuestion.includes('nice')) {
        return `I'm glad you found it helpful! Feel free to ask about any specific details you're curious about.`;
    }
    
    if (lowerQuestion.includes('ok') || lowerQuestion.includes('okay') || question.length < 3) {
        return `Got it! If you have any questions about the image content, just let me know. I'm here to help!`;
    }
    
    // Question type detection and responses
    if (lowerQuestion.includes('what') && (lowerQuestion.includes('see') || lowerQuestion.includes('image') || lowerQuestion.includes('picture'))) {
        return `I can see the main elements from my analysis above. What specific part would you like me to focus on?`;
    }
    
    if (lowerQuestion.includes('how many') || lowerQuestion.includes('count')) {
        return `I'd need you to specify what you want me to count. What particular elements are you interested in?`;
    }
    
    if (lowerQuestion.includes('color') || lowerQuestion.includes('colour')) {
        return `The image contains various colors and visual elements. Which specific colors or areas are you asking about?`;
    }
    
    if (lowerQuestion.includes('where') || lowerQuestion.includes('location')) {
        return `I can help you locate specific elements. What are you trying to find in the image?`;
    }
    
    if (lowerQuestion.includes('why') || lowerQuestion.includes('purpose') || lowerQuestion.includes('reason')) {
        return `This appears to be educational content. What specific aspect would you like me to explain the purpose of?`;
    }
    
    if (lowerQuestion.includes('explain') || lowerQuestion.includes('describe') || lowerQuestion.includes('tell me about')) {
        return `I've provided the main analysis above. What particular concept or detail would you like me to elaborate on?`;
    }
    
    if (lowerQuestion.includes('help') || lowerQuestion.includes('understand')) {
        return `I'm here to help! What specific part of the image or concept are you having trouble with?`;
    }
    
    // Default intelligent response
    return `I understand you're asking about "${question}". Could you be more specific about what aspect you'd like me to focus on?`;
}

function addChatMessage(message, sender, isLoading = false) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `max-w-4xl px-6 py-4 rounded-2xl shadow-lg leading-relaxed ${
        sender === 'user' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-800 border border-gray-200'
    }`;
    
    if (isLoading) {
        contentDiv.innerHTML = `<div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
            <span class="ml-2">${message}</span>
        </div>`;
    } else {
        contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(contentDiv);
    elements.chatHistory.appendChild(messageDiv);
    
    // Announce new messages to screen readers
    if (sender === 'ai') {
        announceToScreenReader(`AI responded: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    }
    
    // Smooth scroll to new message
    setTimeout(() => {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    return messageId;
}

function addChatMessageStreaming(message, sender) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `max-w-4xl px-6 py-4 rounded-2xl shadow-lg leading-relaxed text-lg ${
        sender === 'user' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-800 border border-gray-200'
    }`;
    
    messageDiv.appendChild(contentDiv);
    elements.chatHistory.appendChild(messageDiv);
    
    // Typewriter effect for AI responses
    typewriterEffect(message, contentDiv, 20);
    
    return messageId;
}

function addAudioToMessage(messageId, audioBase64) {
    setTimeout(() => {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('div');
        
        const audioContainer = document.createElement('div');
        audioContainer.className = 'mt-4 flex items-center space-x-3';
        
        const playButton = document.createElement('button');
        playButton.className = 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md';
        playButton.innerHTML = '<i class="fas fa-headphones mr-2"></i>Listen';
        
        playButton.onclick = () => playMessageAudio(audioBase64, playButton);
        
        audioContainer.appendChild(playButton);
        contentDiv.appendChild(audioContainer);
        
        // Entrance animation
        audioContainer.style.opacity = '0';
        audioContainer.style.transform = 'translateY(10px)';
        setTimeout(() => {
            audioContainer.style.transition = 'all 0.5s ease';
            audioContainer.style.opacity = '1';
            audioContainer.style.transform = 'translateY(0)';
        }, 100);
        
    }, 2000);
}

function playMessageAudio(audioBase64, button) {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }
    
    const audioBlob = base64ToBlob(audioBase64, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    button.innerHTML = '<i class="fas fa-pause mr-2"></i>Playing...';
    button.disabled = true;
    
    audio.onended = () => {
        button.innerHTML = '<i class="fas fa-headphones mr-2"></i>Listen';
        button.disabled = false;
    };
    
    audio.play();
}

async function generateAudioForMessage(messageId, text) {
    setTimeout(async () => {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('div');
        
        const audioContainer = document.createElement('div');
        audioContainer.className = 'mt-4 flex items-center space-x-3';
        
        const playButton = document.createElement('button');
        playButton.className = 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md';
        playButton.innerHTML = '<i class="fas fa-headphones mr-2"></i>Listen';
        
        playButton.onclick = async () => {
            try {
                playButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
                playButton.disabled = true;
                
                const response = await fetch(API_CONFIG.AUDIO_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    playMessageAudio(result.audio_base64, playButton);
                } else {
                    throw new Error(result.error || 'Audio generation failed');
                }
            } catch (error) {
                console.error('Error generating audio:', error);
                playButton.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Retry';
                playButton.disabled = false;
            }
        };
        
        audioContainer.appendChild(playButton);
        contentDiv.appendChild(audioContainer);
        
        // Entrance animation
        audioContainer.style.opacity = '0';
        audioContainer.style.transform = 'translateY(10px)';
        setTimeout(() => {
            audioContainer.style.transition = 'all 0.5s ease';
            audioContainer.style.opacity = '1';
            audioContainer.style.transform = 'translateY(0)';
        }, 100);
        
    }, 2000);
}

// Enhanced UI state management
function showProcessing() {
    elements.processingStatus.classList.remove('hidden');
    elements.processingStatus.classList.add('success-bounce');
}

function hideProcessing() {
    elements.processingStatus.classList.add('hidden');
}

function showResults() {
    elements.resultsSection.classList.remove('hidden');
}

function hideResults() {
    elements.resultsSection.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorDisplay.classList.remove('hidden');
    elements.errorDisplay.classList.add('success-bounce');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    elements.errorDisplay.classList.add('hidden');
}

// Utility functions
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

// Keyboard navigation handler
function handleKeyboardNavigation(e) {
    // Alt + 1: Focus on upload
    if (e.altKey && e.key === '1') {
        e.preventDefault();
        elements.imageInput.focus();
        announceToScreenReader('Upload area focused');
    }
    // Alt + 2: Focus on question input
    else if (e.altKey && e.key === '2') {
        e.preventDefault();
        elements.questionInput.focus();
        announceToScreenReader('Question input focused');
    }
    // Alt + 3: Play audio
    else if (e.altKey && e.key === '3') {
        e.preventDefault();
        if (elements.playAudioBtn.style.display !== 'none') {
            playMainAudio();
        }
    }
    // Escape: Stop audio
    else if (e.key === 'Escape') {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            announceToScreenReader('Audio stopped');
        }
    }
}

// Screen reader announcements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
}

// Add accessibility controls
function addAccessibilityControls() {
    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'fixed top-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition-all';
    toggleBtn.innerHTML = '<i class="fas fa-universal-access"></i>';
    toggleBtn.setAttribute('aria-label', 'Toggle accessibility controls');
    toggleBtn.title = 'Accessibility Options';
    document.body.appendChild(toggleBtn);
    
    // Controls panel
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'accessibility-panel fixed top-16 right-4 bg-white p-4 rounded-lg shadow-lg z-50 border';
    controlsDiv.innerHTML = `
        <h3 class="font-bold mb-3 text-gray-800"><i class="fas fa-cog mr-2"></i>Accessibility</h3>
        <button id="toggleHighContrast" class="block w-full mb-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-all"><i class="fas fa-adjust mr-2"></i>High Contrast</button>
        <button id="toggleLargeText" class="block w-full mb-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:ring-2 focus:ring-green-300 transition-all"><i class="fas fa-text-height mr-2"></i>Large Text</button>
        <button id="skipToContent" class="block w-full mb-2 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"><i class="fas fa-arrow-down mr-2"></i>Skip to Content</button>
        <button id="toggleAudio" class="block w-full mb-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 focus:ring-2 focus:ring-orange-300 transition-all"><i class="fas fa-volume-up mr-2"></i>Auto Audio</button>
        <div class="text-xs mt-2 text-gray-600">
            <p>Alt+1: Upload</p>
            <p>Alt+2: Question</p>
            <p>Alt+3: Play Audio</p>
            <p>Esc: Stop Audio</p>
        </div>
    `;
    document.body.appendChild(controlsDiv);
    
    // Toggle panel visibility
    toggleBtn.addEventListener('click', () => {
        controlsDiv.classList.toggle('show');
    });
    
    // High contrast toggle
    document.getElementById('toggleHighContrast').addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
        announceToScreenReader('High contrast toggled');
    });
    
    // Large text toggle
    document.getElementById('toggleLargeText').addEventListener('click', () => {
        document.body.classList.toggle('large-text');
        announceToScreenReader('Large text toggled');
    });
    
    // Skip to content
    document.getElementById('skipToContent').addEventListener('click', () => {
        const main = document.querySelector('main');
        main.setAttribute('tabindex', '-1');
        main.focus();
        main.scrollIntoView();
        announceToScreenReader('Skipped to main content');
    });
    
    // Auto audio toggle
    let autoAudio = false;
    document.getElementById('toggleAudio').addEventListener('click', () => {
        autoAudio = !autoAudio;
        const btn = document.getElementById('toggleAudio');
        if (autoAudio) {
            btn.innerHTML = '<i class="fas fa-volume-mute mr-2"></i>Auto Audio ON';
            btn.classList.add('bg-red-500');
            btn.classList.remove('bg-orange-500');
        } else {
            btn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>Auto Audio';
            btn.classList.add('bg-orange-500');
            btn.classList.remove('bg-red-500');
        }
        announceToScreenReader(`Auto audio ${autoAudio ? 'enabled' : 'disabled'}`);
    });
}

// Initialize app with premium features
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    hideError();
    hideResults();
    hideProcessing();
    
    // Welcome animation
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.3 },
            colors: ['#667eea', '#764ba2', '#f093fb'],
            shapes: ['star']
        });
    }, 1000);
    
    console.log('🚀 SeeWrite AI - Competition Winner Edition Loaded!');
    console.log('🏆 AWS Breaking Barriers Challenge - Premium Experience');
    console.log('🤖 Powered by Amazon Bedrock + Amazon Q + Amazon Polly');
    console.log('♿ Full Accessibility Support Enabled');
    
    // Announce app ready to screen readers
    setTimeout(() => {
        announceToScreenReader('SeeWrite AI loaded. Press Alt+1 to upload image, Alt+2 for questions, Alt+3 to play audio.');
    }, 2000);
});