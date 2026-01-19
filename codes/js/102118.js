// Initialize CodeMirror
let codeEditor = CodeMirror.fromTextArea(document.getElementById('codeInput'), {
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4
});

// DOM Elements
const aiModelSelect = document.getElementById('aiModel');
const languageSelect = document.getElementById('language');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// API Keys - In a real application, these would be stored securely
const API_KEYS = {
    Qwen: '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',
    deepseek: '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'
};

// API Endpoints
const API_ENDPOINTS = {
    Qwen: 'https://openrouter.ai/api/v1/chat/completions',
    deepseek: 'https://openrouter.ai/api/v1/chat/completions'
};

// Event Listeners
analyzeBtn.addEventListener('click', analyzeCode);
resetBtn.addEventListener('click', resetForm);
copyBtn.addEventListener('click', copyResults);
downloadBtn.addEventListener('click', downloadResults);
languageSelect.addEventListener('change', updateEditorMode);
tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

// Update CodeMirror mode based on selected language
function updateEditorMode() {
    const mode = getLanguageMode(languageSelect.value);
    codeEditor.setOption('mode', mode);
    CodeMirror.autoLoadMode(codeEditor, mode);
}

// Get CodeMirror mode based on language
function getLanguageMode(language) {
    const modes = {
        html: 'xml',
        javascript: 'javascript'
    };
    return modes[language] || 'javascript';
}

// Analyze code using selected AI model
async function analyzeCode() {
    try {
        // Show loading state
        analyzeBtn.classList.add('loading');
        
        const code = codeEditor.getValue();
        if (!code.trim()) {
            throw new Error('Please enter some code to analyze');
        }

        // Get analysis based on selected AI model
        let analysis;
        if (aiModelSelect.value === 'Qwen') {
            analysis = await analyzeWithQwen(code);
        } else if (aiModelSelect.value === 'deepseek') {
            analysis = await analyzeWithDeepSeek(code);
        } else {
            throw new Error('Invalid AI model selected');
        }

        // Update results tabs with the analysis
        updateResults(analysis);
        
        // Remove loading state
        analyzeBtn.classList.remove('loading');
    } catch (error) {
        console.error('Error analyzing code:', error);
        showError(error.message || 'Failed to analyze code. Please try again.');
        analyzeBtn.classList.remove('loading');
    }
}

// Analyze code using Qwen API
async function analyzeWithQwen(code) {
    try {
        console.log('Attempting to analyze with Qwen API...');
        
        const requestBody = {
            model: 'qwen/qwen2.5-vl-72b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a code analysis assistant. Analyze the following ${languageSelect.value} code and provide:
                    1. Any errors or potential bugs
                    2. Possible improvements for better performance and maintainability
                    3. Suggestions for best practices and modern coding standards
                    Format the response as a JSON object with three arrays: errors, improvements, and suggestions.
                    Each array item should have a title and description.`
                },
                {
                    role: 'user',
                    content: code
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
        
        const response = await fetch(API_ENDPOINTS.Qwen, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.Qwen}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'UI Code Assistant'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Failed to analyze code with Qwen. Status: ${response.status}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('Qwen API error:', error);
        throw new Error(`Failed to connect to Qwen API: ${error.message}`);
    }
}

// Analyze code using DeepSeek API
async function analyzeWithDeepSeek(code) {
    try {
        console.log('Attempting to analyze with DeepSeek API...');
        
        const requestBody = {
            model: 'deepseek/deepseek-v3-base:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a code analysis assistant. Analyze the following ${languageSelect.value} code and provide:
                    1. Any errors or potential bugs
                    2. Possible improvements for better performance and maintainability
                    3. Suggestions for best practices and modern coding standards
                    Format the response as a JSON object with three arrays: errors, improvements, and suggestions.
                    Each array item should have a title and description.`
                },
                {
                    role: 'user',
                    content: code
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
        
        const response = await fetch(API_ENDPOINTS.deepseek, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.deepseek}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'UI Code Assistant'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Failed to analyze code with DeepSeek. Status: ${response.status}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('DeepSeek API error:', error);
        throw new Error(`Failed to connect to DeepSeek API: ${error.message}`);
    }
}

// Update results in the UI
function updateResults(analysis) {
    // Update Errors tab
    const errorsContainer = document.getElementById('errors');
    errorsContainer.innerHTML = analysis.errors.map(error => `
        <div class="result-item error">
            <div class="result-header">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${error.title}</h3>
            </div>
            <p>${error.description}</p>
        </div>
    `).join('');

    // Update Improvements tab
    const improvementsContainer = document.getElementById('improvements');
    improvementsContainer.innerHTML = analysis.improvements.map(improvement => `
        <div class="result-item improvement">
            <div class="result-header">
                <i class="fas fa-lightbulb"></i>
                <h3>${improvement.title}</h3>
            </div>
            <p>${improvement.description}</p>
        </div>
    `).join('');

    // Update Suggestions tab
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = analysis.suggestions.map(suggestion => `
        <div class="result-item suggestion">
            <div class="result-header">
                <i class="fas fa-comment"></i>
                <h3>${suggestion.title}</h3>
            </div>
            <p>${suggestion.description}</p>
        </div>
    `).join('');
}

// Switch between tabs
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
    });
}

// Reset form
function resetForm() {
    codeEditor.setValue('');
    aiModelSelect.value = 'Qwen';
    languageSelect.value = 'html';
    updateEditorMode();
    
    // Clear results
    document.getElementById('errors').innerHTML = '';
    document.getElementById('improvements').innerHTML = '';
    document.getElementById('suggestions').innerHTML = '';
}

// Copy results to clipboard
async function copyResults() {
    try {
        const activeTab = document.querySelector('.tab-pane.active');
        const results = activeTab.innerText;
        await navigator.clipboard.writeText(results);
        showSuccess('Results copied to clipboard!');
    } catch (error) {
        console.error('Error copying results:', error);
        showError('Failed to copy results to clipboard.');
    }
}

// Download results
function downloadResults() {
    try {
        const activeTab = document.querySelector('.tab-pane.active');
        const results = activeTab.innerText;
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-analysis-${activeTab.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading results:', error);
        showError('Failed to download results.');
    }
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
        <button class="close-btn">&times;</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    const closeBtn = errorDiv.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(errorDiv);
    });
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 5000);
}

// Show success message
function showSuccess(message) {
    console.log('Success:', message);
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
        <button class="close-btn">&times;</button>
    `;
    
    document.body.appendChild(successDiv);
    
    const closeBtn = successDiv.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(successDiv);
    });
    
    setTimeout(() => {
        if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
        }
    }, 3000);
}

// Initialize editor mode
updateEditorMode(); 