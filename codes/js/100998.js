const readline = require('readline');
const fs = require('fs');
const axios = require('axios');

// Function to interact with ChatGPT API
async function generateChatGptResponse(apiKey, messages) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    const response = await axios.post(apiUrl, {
      model: "gpt-3.5-turbo",
      messages,
    }, {
      headers,
    });

    const responseData = response.data;
    const assistantResponse = responseData.choices[0].message.content.trim();
    console.log('Assistant:', assistantResponse);
    return assistantResponse;
  } catch (error) {
    console.error('Error occurred during ChatGPT API request:', error);
    return null;
  }
}

// Function to save prompt to the input file
function savePromptToInputFile(inputFilePath, prompt) {
  fs.writeFileSync(inputFilePath, prompt, 'utf8');
}

// Function to read the input file
function readInputFromFile(inputFilePath) {
  return fs.readFileSync(inputFilePath, 'utf8');
}

// Function to save the response to the output file
function saveResponseToOutputFile(outputFilePath, response) {
  fs.writeFileSync(outputFilePath, response, 'utf8');
  console.log('Response saved to', outputFilePath);
}

// Usage
const inputFilePath = 'input.txt';
const outputFilePath = 'output.txt';

// Create an interface to read input from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Get user prompt from the terminal
rl.question('Enter your prompt: ', async (prompt) => {
  // Step 1: Save the prompt to the input file
  savePromptToInputFile(inputFilePath, prompt);

  // Step 2: Read the prompt from the input file
  const inputContent = readInputFromFile(inputFilePath);

  // Step 3: Perform computation on the input and interact with ChatGPT API
  const apiKey = "xyz";
  const messages = [
    { role: 'system', content: prompt },
  ];
  const response = await generateChatGptResponse(apiKey, messages);

  // Step 4: Save the response to the output file
  if (response !== null) {
    saveResponseToOutputFile(outputFilePath, response);
  }

  // Close the readline interface
  rl.close();
});
