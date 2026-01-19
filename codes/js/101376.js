import "dotenv/config"
import OpenAI from 'openai';
import webScraper from './webScraper.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define function (basic stuff)
function helloWorld(appendString) {
    let hello = "Hello World! " + appendString
    return hello
}

// Get current time of day (checking actual function calls)
function getTimeOfDay() {
    let date = new Date()
    let hours = date.getHours()
    let minutes = date.getMinutes()
    let seconds = date.getSeconds()
    let timeOfDay = "AM"
    if(hours > 12){
        hours -= 12
        timeOfDay = "PM"
    }
    return hours + ":" + minutes + ":" + seconds + " " + timeOfDay
}

// Define ChatGPT function
async function callChatGPTWithFunction(appendString){
    let messages = [
        { role: "system", content: "Perform function requests for the user." },
        { role: "user", content: "Hello, I am a user, can you suggest me a few cyberpunk mixes?" },
        
    ];
    
    // Step 1: Call ChatGPT with function name
    let chat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0613",
        messages,
        functions: [{
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
        },
        {
            name: "getTimeOfDay",
            description: "Get the time of day",
            parameters: {
                type: "object",
                properties: {
                },
                require: [""],
            }
        },
        {
            name: "webScraper",
            description: "Scraps YouTube for videos with the keyword passed to it",
            parameters: {
                type: "object",
                properties: {
                    keyword: {
                        type: "string",
                        description: "The keyword to search for",
                    },
                },
                require: ["keyword"],
            }
        }],
        function_call: "auto",
        
    });

    let wantsToUseFunction = chat.choices[0].finish_reason == "function_call";
    let content = ""

    // Step 2: Call if ChatGPT wants to use function
    if(wantsToUseFunction){
        // Step 3: Use ChatGPT arguments to call function
        if(chat.choices[0].message.function_call.name == "helloWorld"){
            let argumentObj = JSON.parse(chat.choices[0].message.function_call.arguments)
            content = helloWorld(argumentObj.appendString)
            messages.push(chat.choices[0].message)
            messages.push({role : "function", name : "helloWorld", content,})
        }

        if(chat.choices[0].message.function_call.name == "getTimeOfDay"){
            content = getTimeOfDay()
            messages.push(chat.choices[0].message)
            messages.push({role : "function", name : "getTimeOfDay", content,})
        }

        if(chat.choices[0].message.function_call.name == "webScraper"){
            let argumentObj = JSON.parse(chat.choices[0].message.function_call.arguments)
            content = await webScraper(argumentObj.keyword)
            messages.push(chat.choices[0].message)
            messages.push({role : "function", name : "webScraper", content,})
        }

    }

    // Step 4: Call ChatGPT again with function response
    let step4response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0613",
        messages,
    });
    console.log(step4response.choices[0]);
}

callChatGPTWithFunction()
