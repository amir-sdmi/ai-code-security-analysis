require('dotenv').config();
const fs = require('fs');
const prefix = fs.readFileSync(__dirname + '/prefix.txt').toString(); // gpt prefix file to establish foods, recipes and our dataformat command 
const { Configuration, OpenAIApi } = require('openai');

// openai setup for and helper functions for ChatGPT
const config = new Configuration({ apiKey: process.env.OPEN_AI_API_KEY })
const OpenAPI = new OpenAIApi(config);

OpenAPI.command = async (content) => { // custom helper command to easily command gpt with our dataformat and json structure
    let cmd = { role: "user", content:  prefix + ' ' + content };
    console.log(cmd.content);
    const res = await OpenAPI.createChatCompletion({ model: 'gpt-3.5-turbo', messages: [cmd], temperature: 0.8 }); // temperature determines the variation in gpt's predictions

    return res.data;
}

module.exports.OpenAPI = OpenAPI; // what we use to interface with chatgpt
module.exports.parseGPT = require('./parseGPT'); // what we use to parse our dataformat from chatgpt
