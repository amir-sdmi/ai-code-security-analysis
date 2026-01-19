const asyncHandler = require("express-async-handler");
const OpenAI = require('openai');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');
const bodyParser = require('body-parser');
const getImageColors = require('get-image-colors');
const userAgent = require('user-agents');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define your ChatGPT Function
async function callChatGPTWithFunctions(userMessage) {
  let messages = [{
    role: "system",
    content: "Perform function requests for the user",
  }, {
    role: "user",
    content: userMessage,
  }];

  function helloWorld(appendString){
    let hello = "Hello World! " + appendString
    return hello
  }

  // Step 1: Call ChatGPT with the function name
  let chat = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    messages,
    language: "zh", // Set the language to Chinese
    function_definitions: [{
      name: "helloWorld",
      description: "Prints hello world with the string passed to it",
      parameters: {
        type: "object",
        properties: {
          appendString: {
            type: "string",
            description: "The string to append to the hello world message",
          },
        },
        require: ["appendString"],
      }
    }],
    function_calls: "auto",
  });

  let wantsToUseFunction = chat.data.choices[0].reason == "function_call";

  // Step 2: Check if ChatGPT wants to use a function
  if (wantsToUseFunction) {
    // Step 3: Use ChatGPT arguments to call your function
    let functionCall = chat.data.choices[0].delta.function_call;
    let argumentObj = JSON.parse(functionCall.arguments);

    // Handle user messages dynamically based on the function call
    messages.push({
      role: "user",
      content: `Calling function ${functionCall.name} with arguments: ${JSON.stringify(argumentObj)}`,
    });

    let content = "";
    if (functionCall.name === "helloWorld") {
      content = helloWorld(argumentObj.appendString);
    } else if (functionCall.name === "scraper") {
      content = await scraper(argumentObj.keyword);
    } else if (functionCall.name === "getTimeOfDay") {
      content = getTimeOfDay();
    }

    messages.push(chat.data.choices[0].delta);
    messages.push({
      role: "function",
      name: functionCall.name,
      content,
    });
  }

  // Step 4: Call ChatGPT again with the function response
  let step4response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    messages,
    language: "zh", // Set the language to Chinese
  });
  console.log(step4response.data.choices[0]);
}

const processAiMessages = asyncHandler(async (req, res) => {
  const userMessage = req.body.message;

  console.log(userMessage);

  if (!userMessage) {
    return res.status(400).json({ error: 'Missing message in the request body' });
  }

  try {
    await callChatGPTWithFunctions(userMessage);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

let browser;
let page;

puppeteerExtra.use(Stealth());

// Start the Express server
// app.use(bodyParser.json());

const colorMapping = {
  'BLACK': '#000000',
  'GRAY': '#808080',
  'RED': '#FF0000',
  'GREEN': '#008000',
  'BLUE': '#0000FF',
  'YELLOW': '#FFFF00',
  // Add other color mappings as needed
};

// Function to convert color names to hex values
function getColorHex(colorName) {
  return colorMapping[colorName.toUpperCase()] || null;
}

const startScraper = asyncHandler(async (req, res) => {
  try {
    browser = await puppeteerExtra.launch({
      headless: 'new',
    });

    page = await browser.newPage();
    await page.goto("https://chatgptfree.ai/", { waitUntil: 'load' });
    await page.setUserAgent(userAgent.random().toString());

    
    let initialMessage = await page.evaluate(() => {
      const messages = document.querySelectorAll('li.wpaicg-ai-message p span');
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? lastMessage.textContent : '';
    });

    res.status(200).json({ message: 'Script started successfully.', reply: initialMessage });

  } catch (error) {
    console.error('Error starting script:', error);
    res.status(500).send('Error starting script.');
  }
});

// Function to convert hex color to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

const communicateWithChatbot = asyncHandler(async (req, res) => {
  try {
    const userMessage = req.body.message;
    const textareaSelector = '#post-6 > div > div.elementor.elementor-6 > section.elementor-section.elementor-top-section.elementor-element.elementor-element-d42cf1a.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-6d40bf7.elementor-widget.elementor-widget-shortcode > div > div > div > div.wpaicg-chat-shortcode-type > textarea';
    await page.waitForSelector(textareaSelector);


    // Type into the textarea
    await page.type(textareaSelector, userMessage);

    // Press Enter
    await page.keyboard.press('Enter');

    const selector = 'div.chat__message.bot-message';
    
    await delay(3500);
    let initialMessage = await page.evaluate(() => {
      const messages = document.querySelectorAll('li.wpaicg-ai-message p span');
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? lastMessage.textContent : '';
    });

    console.log(initialMessage);

    let currentMessage;

    // Set a maximum number of iterations to prevent infinite loop
    const maxIterations = 10;
    let iterations = 0;

    while(true) {
      await delay(2500); // Wait for 2500 milliseconds before checking again
      currentMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('li.wpaicg-ai-message p span');
        const lastMessage = messages[messages.length - 1];
        return lastMessage ? lastMessage.textContent : '';
      });


      // Add additional logging for debugging
      console.log(`Initial message ${initialMessage.length}: Current message - ${currentMessage.length}`);

      if(initialMessage.length === currentMessage.length) {
        break;
      }
      initialMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('li.wpaicg-ai-message p span');
        const lastMessage = messages[messages.length - 1];
        return lastMessage ? lastMessage.textContent.replace(/chatgptcopy/i, "") : '';
      });
    }

    console.log('Final message:', currentMessage);

    const allMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('li.wpaicg-ai-message p span');
      return Array.from(messages).map(message => message.textContent);
    });

    console.log(allMessages);

    res.status(200).json({ message: 'Message sent successfully!', reply: allMessages[allMessages.length - 1] });

  } catch(error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the chatbot.' });
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const endScraper = asyncHandler(async (req, res) => {
  try {
    await browser.close();
    res.status(200).send('Script exited successfully.');
    // process.exit();
  } catch (error) {
    console.error('Error exiting script:', error);
    res.status(500).send('Error exiting script.');
  }
});

async function sendDivsToClient(divs) {
  // Your logic to send divs to the client using a GET request
  // Example using Axios:
  // axios.get('YOUR_SERVER_ENDPOINT', { params: { divs } });
  console.log('Divs sent to the client:', divs);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


module.exports = { startScraper, endScraper, communicateWithChatbot, processAiMessages }
