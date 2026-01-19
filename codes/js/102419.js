// Gemini API configuration
const API_KEY = "AIzaSyAXiO-3nKD9QUNNIiAYHwcw5GE7NDeLa8c";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// DOM Elements
const categoryElement = document.getElementById('category');
const currentChallengeElement = document.getElementById('current-challenge');
const totalChallengesElement = document.getElementById('total-challenges');
const categoryButtons = document.querySelectorAll('.category-btn');
const categorySelector = document.getElementById('category-selector');
const challengeContent = document.getElementById('challenge-content');
const challengeTitle = document.getElementById('challenge-title');
const challengeDifficulty = document.getElementById('challenge-difficulty');
const challengeDescriptionText = document.getElementById('challenge-description-text');
const challengeExamples = document.getElementById('challenge-examples');
const challengeConstraints = document.getElementById('challenge-constraints');
const codeEditor = document.getElementById('code-editor');
const languageSelector = document.getElementById('language-selector');
const runButton = document.getElementById('run-btn');
const submitButton = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const outputElement = document.getElementById('output');
const feedbackContainer = document.getElementById('feedback-container');
const feedbackText = document.getElementById('feedback-text');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const newChallengeButton = document.getElementById('new-challenge-btn');
const apiErrorContainer = document.getElementById('api-error');
const dismissErrorButton = document.getElementById('dismiss-error');

// State
let challenges = [];
let currentChallengeIndex = 0;
let currentCategory = '';
let userSolutions = [];
let apiErrorOccurred = false;

// Event listeners
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentCategory = button.dataset.category;
        categoryElement.textContent = `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Challenges`;
        loadChallenges(currentCategory);
        categorySelector.classList.add('hidden');
        challengeContent.classList.remove('hidden');
    });
});

languageSelector.addEventListener('change', () => {
    setEditorLanguage(languageSelector.value);
});

runButton.addEventListener('click', runCode);
submitButton.addEventListener('click', submitSolution);
prevButton.addEventListener('click', showPreviousChallenge);
nextButton.addEventListener('click', showNextChallenge);
newChallengeButton.addEventListener('click', () => {
    challengeContent.classList.add('hidden');
    newChallengeButton.classList.add('hidden');
    categorySelector.classList.remove('hidden');
});

dismissErrorButton.addEventListener('click', () => {
    apiErrorContainer.classList.add('hidden');
});

// Initialize
function init() {
    challengeContent.classList.add('hidden');
    resultContainer.classList.add('hidden');
    feedbackContainer.classList.add('hidden');
    newChallengeButton.classList.add('hidden');
    apiErrorContainer.classList.add('hidden');
}

// Load challenges from Gemini API
async function loadChallenges(category) {
    try {
        displayLoading(true);
        
        // Hide any previous API error message
        apiErrorContainer.classList.add('hidden');
        
        const prompt = `Generate 3 coding challenges about ${category} programming. 
        Format the output as valid JSON with the following structure:
        [
          {
            "title": "Challenge title",
            "difficulty": "easy|medium|hard",
            "description": "Detailed problem description",
            "examples": [
              {
                "input": "Example input",
                "output": "Example output",
                "explanation": "Explanation of the example"
              }
            ],
            "constraints": "List of constraints for the problem",
            "starterCode": {
              "javascript": "// JavaScript starter code with function signature",
              "python": "# Python starter code with function signature",
              "java": "// Java starter code with class and method",
              "cpp": "// C++ starter code with function signature"
            },
            "testCases": [
              {
                "input": "Test case input",
                "output": "Expected output"
              }
            ]
          }
        ]
        Make sure the challenges are solvable and have clear instructions. Include 2-3 examples for each challenge.
        The difficulty should be one of: "easy", "medium", or "hard".
        Please provide only the JSON output without any additional text.`;

        console.log('Fetching challenges for category:', category);
        
        const requestUrl = `${API_URL}?key=${API_KEY}`;
        console.log('Making API request to:', requestUrl);

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API error response:', errorData);
            apiErrorOccurred = true;
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response received');
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            console.error('Unexpected API response format:', data);
            apiErrorOccurred = true;
            throw new Error('Unexpected API response format');
        }
        
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Parsing generated text');
        challenges = extractJsonFromText(generatedText);
        
        if (!challenges || !Array.isArray(challenges) || challenges.length === 0) {
            console.error('Failed to parse challenges:', generatedText);
            apiErrorOccurred = true;
            throw new Error('Failed to parse challenges from API response');
        }
        
        console.log('Successfully loaded challenges:', challenges.length);
        apiErrorOccurred = false;
        
        // Initialize user solutions
        userSolutions = Array(challenges.length).fill('');
        
        currentChallengeIndex = 0;
        updateChallengeUI();
        displayLoading(false);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        if (apiErrorOccurred) {
            // Show API error message
            apiErrorContainer.classList.remove('hidden');
        }
        displayError('Failed to load challenges. Using fallback challenges.');
        challenges = getFallbackChallenges(category);
        userSolutions = Array(challenges.length).fill('');
        currentChallengeIndex = 0;
        updateChallengeUI();
        displayLoading(false);
    }
}

// Extract JSON from text, handling different formats
function extractJsonFromText(text) {
    try {
        // Try direct JSON parsing first
        return JSON.parse(text);
    } catch (e) {
        console.log('Direct JSON parsing failed, trying to extract JSON from text');
        
        try {
            // Look for array pattern
            const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Try to find anything that looks like JSON
            const jsonStart = text.indexOf('[');
            const jsonEnd = text.lastIndexOf(']') + 1;
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonString = text.substring(jsonStart, jsonEnd);
                return JSON.parse(jsonString);
            }
            
            // Handle markdown code blocks
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownMatch && markdownMatch[1]) {
                return JSON.parse(markdownMatch[1]);
            }
        } catch (innerError) {
            console.error('Failed to extract JSON:', innerError);
        }
        
        throw new Error('Could not extract valid JSON from response');
    }
}

// Get fallback challenges if API fails
function getFallbackChallenges(category) {
    const fallbackChallenges = {
        javascript: [
            {
                "title": "Two Sum",
                "difficulty": "easy",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
                "examples": [
                    {
                        "input": "nums = [2,7,11,15], target = 9",
                        "output": "[0,1]",
                        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                    },
                    {
                        "input": "nums = [3,2,4], target = 6",
                        "output": "[1,2]",
                        "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
                    }
                ],
                "constraints": "2 <= nums.length <= 104\n-109 <= nums[i] <= 109\n-109 <= target <= 109\nOnly one valid answer exists.",
                "starterCode": {
                    "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Your code here\n}",
                    "python": "def two_sum(nums, target):\n    # Your code here\n    pass",
                    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n    }\n}",
                    "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        // Your code here\n    }\n};"
                },
                "testCases": [
                    {
                        "input": "[2,7,11,15]\n9",
                        "output": "[0,1]"
                    },
                    {
                        "input": "[3,2,4]\n6",
                        "output": "[1,2]"
                    }
                ]
            },
            {
                "title": "Palindrome Check",
                "difficulty": "easy",
                "description": "Write a function that determines whether a string is a palindrome. A palindrome is a string that reads the same backward as forward, ignoring case, punctuation, and spaces.",
                "examples": [
                    {
                        "input": "\"A man, a plan, a canal: Panama\"",
                        "output": "true",
                        "explanation": "After removing non-alphanumeric characters and converting to lowercase, the string becomes \"amanaplanacanalpanama\", which reads the same forward and backward."
                    },
                    {
                        "input": "\"race a car\"",
                        "output": "false",
                        "explanation": "After processing, the string becomes \"raceacar\", which does not read the same backward as forward."
                    }
                ],
                "constraints": "1 <= s.length <= 2 * 10^5\ns consists of printable ASCII characters.",
                "starterCode": {
                    "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n    // Your code here\n}",
                    "python": "def is_palindrome(s):\n    # Your code here\n    pass",
                    "java": "class Solution {\n    public boolean isPalindrome(String s) {\n        // Your code here\n    }\n}",
                    "cpp": "#include <string>\n\nclass Solution {\npublic:\n    bool isPalindrome(std::string s) {\n        // Your code here\n    }\n};"
                },
                "testCases": [
                    {
                        "input": "\"A man, a plan, a canal: Panama\"",
                        "output": "true"
                    },
                    {
                        "input": "\"race a car\"",
                        "output": "false"
                    }
                ]
            },
            {
                "title": "FizzBuzz",
                "difficulty": "easy",
                "description": "Write a function that returns an array containing the numbers from 1 to n. But for multiples of three, the array should contain \"Fizz\" instead of the number, for multiples of five, the array should contain \"Buzz\", and for multiples of both three and five, the array should contain \"FizzBuzz\".",
                "examples": [
                    {
                        "input": "n = 15",
                        "output": "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\",\"Fizz\",\"7\",\"8\",\"Fizz\",\"Buzz\",\"11\",\"Fizz\",\"13\",\"14\",\"FizzBuzz\"]",
                        "explanation": "3, 6, 9, 12 are multiples of 3, so they become \"Fizz\". 5, 10 are multiples of 5, so they become \"Buzz\". 15 is a multiple of both 3 and 5, so it becomes \"FizzBuzz\"."
                    }
                ],
                "constraints": "1 <= n <= 10^4",
                "starterCode": {
                    "javascript": "/**\n * @param {number} n\n * @return {string[]}\n */\nfunction fizzBuzz(n) {\n    // Your code here\n}",
                    "python": "def fizz_buzz(n):\n    # Your code here\n    pass",
                    "java": "class Solution {\n    public List<String> fizzBuzz(int n) {\n        // Your code here\n    }\n}",
                    "cpp": "#include <vector>\n#include <string>\n\nclass Solution {\npublic:\n    std::vector<std::string> fizzBuzz(int n) {\n        // Your code here\n    }\n};"
                },
                "testCases": [
                    {
                        "input": "15",
                        "output": "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\",\"Fizz\",\"7\",\"8\",\"Fizz\",\"Buzz\",\"11\",\"Fizz\",\"13\",\"14\",\"FizzBuzz\"]"
                    }
                ]
            }
        ],
        python: [
            {
                "title": "Reverse a String",
                "difficulty": "easy",
                "description": "Write a function that reverses a string. The input string is given as an array of characters.",
                "examples": [
                    {
                        "input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]",
                        "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
                        "explanation": "The input array is reversed in place."
                    },
                    {
                        "input": "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
                        "output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]",
                        "explanation": "The input array is reversed in place."
                    }
                ],
                "constraints": "1 <= s.length <= 10^5\ns[i] is a printable ascii character.",
                "starterCode": {
                    "javascript": "/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nfunction reverseString(s) {\n    // Your code here\n}",
                    "python": "def reverse_string(s):\n    \"\"\"\n    :type s: List[str]\n    :rtype: None Do not return anything, modify s in-place instead.\n    \"\"\"\n    # Your code here\n    pass",
                    "java": "class Solution {\n    public void reverseString(char[] s) {\n        // Your code here\n    }\n}",
                    "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    void reverseString(std::vector<char>& s) {\n        // Your code here\n    }\n};"
                },
                "testCases": [
                    {
                        "input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]",
                        "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"
                    },
                    {
                        "input": "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
                        "output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"
                    }
                ]
            }
        ]
    };
    
    return fallbackChallenges[category] || fallbackChallenges.javascript;
}

// Update the challenge UI
function updateChallengeUI() {
    if (challenges.length === 0) return;
    
    // Update progress indicators
    currentChallengeElement.textContent = currentChallengeIndex + 1;
    totalChallengesElement.textContent = challenges.length;
    
    // Get current challenge
    const currentChallenge = challenges[currentChallengeIndex];
    
    // Update challenge details
    challengeTitle.textContent = currentChallenge.title;
    
    // Set difficulty tag
    challengeDifficulty.textContent = currentChallenge.difficulty.toUpperCase();
    challengeDifficulty.className = ''; // Reset classes
    challengeDifficulty.classList.add(`difficulty-${currentChallenge.difficulty.toLowerCase()}`);
    
    // Set description
    challengeDescriptionText.innerHTML = `<p>${currentChallenge.description}</p>`;
    
    // Set examples
    challengeExamples.innerHTML = '';
    if (currentChallenge.examples && currentChallenge.examples.length > 0) {
        currentChallenge.examples.forEach((example, index) => {
            const exampleDiv = document.createElement('div');
            exampleDiv.classList.add('example');
            
            exampleDiv.innerHTML = `
                <div class="example-header">Example ${index + 1}:</div>
                <div class="example-content">Input: ${example.input}</div>
                <div class="example-content">Output: ${example.output}</div>
                ${example.explanation ? `<div class="example-explanation">Explanation: ${example.explanation}</div>` : ''}
            `;
            
            challengeExamples.appendChild(exampleDiv);
        });
    }
    
    // Set constraints
    challengeConstraints.innerHTML = `<p><strong>Constraints:</strong></p><p>${currentChallenge.constraints.replace(/\n/g, '<br>')}</p>`;
    
    // Set code editor with starter code for selected language
    setEditorLanguage(languageSelector.value);
    
    // If user has a saved solution, use it
    if (userSolutions[currentChallengeIndex]) {
        codeEditor.value = userSolutions[currentChallengeIndex];
    }
    
    // Update navigation buttons
    prevButton.disabled = currentChallengeIndex === 0;
    nextButton.disabled = currentChallengeIndex === challenges.length - 1;
    
    // Hide result container when switching challenges
    resultContainer.classList.add('hidden');
    feedbackContainer.classList.add('hidden');
}

// Set the editor language and starter code
function setEditorLanguage(language) {
    if (challenges.length === 0) return;
    
    const currentChallenge = challenges[currentChallengeIndex];
    if (currentChallenge.starterCode && currentChallenge.starterCode[language]) {
        // Only set starter code if user hasn't entered anything yet
        if (!userSolutions[currentChallengeIndex]) {
            codeEditor.value = currentChallenge.starterCode[language];
        }
    } else {
        codeEditor.value = userSolutions[currentChallengeIndex] || '// Write your code here';
    }
}

// Run the code
async function runCode() {
    const code = codeEditor.value;
    const language = languageSelector.value;
    
    // Save user solution
    userSolutions[currentChallengeIndex] = code;
    
    // Show result container
    resultContainer.classList.remove('hidden');
    
    // Show loading in output
    outputElement.textContent = 'Running your code...';
    
    try {
        // If API error has occurred, use a simple fallback evaluation
        if (apiErrorOccurred) {
            outputElement.textContent = 'API connection issue. Unable to run the code.\n\n' +
                'You can still write your code and check it manually against the examples.\n\n' + 
                'When the API is available again, try refreshing the page.';
            return;
        }

        // In a real app, this would send the code to an execution service
        // For this demo, we'll use Gemini API to evaluate the code
        await evaluateCode(code, language);
    } catch (error) {
        console.error('API request error:', error);
        apiErrorOccurred = true;
        apiErrorContainer.classList.remove('hidden');
        outputElement.textContent = `Error: ${error.message}`;
    }
}

// Submit solution
async function submitSolution() {
    const code = codeEditor.value;
    const language = languageSelector.value;
    
    // Save user solution
    userSolutions[currentChallengeIndex] = code;
    
    // Show result container
    resultContainer.classList.remove('hidden');
    feedbackContainer.classList.remove('hidden');
    
    // Show loading in output
    outputElement.textContent = 'Evaluating your solution...';
    feedbackText.textContent = 'Generating feedback...';
    
    try {
        // If API error has occurred, use a simple fallback evaluation
        if (apiErrorOccurred) {
            outputElement.textContent = 'API connection issue. Unable to evaluate the code.';
            feedbackText.innerHTML = 'Due to API connectivity issues, automated evaluation is unavailable. ' +
                'You can verify your solution manually against the test cases.<br><br>' +
                'When the API is available again, try refreshing the page.';
            return;
        }

        // For this demo, we'll use Gemini API to evaluate the code
        const success = await evaluateCode(code, language, true);
        
        if (success) {
            newChallengeButton.classList.remove('hidden');
        }
    } catch (error) {
        console.error('API request error:', error);
        apiErrorOccurred = true;
        apiErrorContainer.classList.remove('hidden');
        outputElement.textContent = `Error: ${error.message}`;
        feedbackText.textContent = 'Unable to evaluate your solution. Please try again.';
    }
}

// Evaluate code using Gemini API
async function evaluateCode(code, language, isSubmission = false) {
    try {
        const currentChallenge = challenges[currentChallengeIndex];
        
        // Prepare prompt for the API
        const promptText = `I have a coding challenge and a user solution. Please ${isSubmission ? 'provide detailed feedback' : 'run the code and show the output'}.
        
        Challenge: ${currentChallenge.title}
        
        Description: ${currentChallenge.description}
        
        ${language.toUpperCase()} Solution:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        ${isSubmission ? `Test Cases:
        ${currentChallenge.testCases.map((test, i) => `
        Test ${i + 1}:
        Input: ${test.input}
        Expected Output: ${test.output}
        `).join('\n')}
        
        Please evaluate if the solution correctly handles all test cases. Provide detailed feedback on:
        1. Correctness: Does it pass all test cases?
        2. Time Complexity: What is the time complexity of the solution?
        3. Space Complexity: What is the space complexity of the solution?
        4. Code Quality: Is the code well-structured and readable?
        5. Suggestions for improvement (if any)
        
        Format your answer as:
        - Test Results: [PASS/FAIL]
        - Time Complexity: O(?)
        - Space Complexity: O(?)
        - Feedback: [Your detailed feedback]` 
        : 
        `Run the code with these inputs and show the output:
        ${currentChallenge.examples.map((example, i) => `Example ${i + 1}: ${example.input}`).join('\n')}`}`;

        // Make the API request
        const requestUrl = `${API_URL}?key=${API_KEY}`;
        console.log('Making API request to:', requestUrl);
        
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 2048
                }
            })
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('API error response:', errorData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            console.error('Unexpected API response format:', data);
            throw new Error('Unexpected API response format');
        }
        
        const generatedText = data.candidates[0].content.parts[0].text;
        
        if (isSubmission) {
            // Display feedback
            outputElement.textContent = 'Solution evaluated';
            feedbackText.innerHTML = generatedText.replace(/\n/g, '<br>');
            
            // Check if solution passed
            return generatedText.toLowerCase().includes('pass');
        } else {
            // Display output
            outputElement.textContent = generatedText;
            return true;
        }
    } catch (error) {
        console.error('Error evaluating code:', error);
        throw error;
    }
}

// Show previous challenge
function showPreviousChallenge() {
    if (currentChallengeIndex > 0) {
        currentChallengeIndex--;
        updateChallengeUI();
    }
}

// Show next challenge
function showNextChallenge() {
    if (currentChallengeIndex < challenges.length - 1) {
        currentChallengeIndex++;
        updateChallengeUI();
    }
}

// Display loading state
function displayLoading(isLoading) {
    if (isLoading) {
        challengeTitle.textContent = 'Loading challenges...';
        challengeDescriptionText.innerHTML = '<p>Please wait while we generate coding challenges...</p>';
        challengeExamples.innerHTML = '';
        challengeConstraints.innerHTML = '';
        codeEditor.value = '';
        prevButton.disabled = true;
        nextButton.disabled = true;
    }
}

// Display error message
function displayError(message) {
    challengeTitle.textContent = 'Error';
    challengeDescriptionText.innerHTML = `<p>${message}</p>`;
}

// Initialize the app
init(); 