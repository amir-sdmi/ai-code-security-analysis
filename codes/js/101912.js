// auditserver.js

import axios from "axios";
import { openaiApiKey, etherscanApiKey, slackWebhookUrl } from "./config.js";
import { Configuration, OpenAIApi } from "openai";
import fs from "fs";
import axiosRetry from "axios-retry";
import Web3 from "web3";

// Initialize Web3 with a provider (like Infura or a local node)
const web3 = new Web3(new Web3.providers.HttpProvider("https://1rpc.io/eth"));

// Load ABI from external file
const abiFile = "./abi.json";
const abi = JSON.parse(fs.readFileSync(abiFile));

// Create OpenAI configuration
const configuration = new Configuration({
  apiKey: openaiApiKey,
});

// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

// Enable retries for axios with exponential backoff, handling 502 errors
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkError(error) || error.response?.status === 502;
  },
});

export async function auditSmartContract(address) {
  try {
    // Fetch contract source code from Etherscan
    const etherscanResponse = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "contract",
        action: "getsourcecode",
        address: address,
        apikey: etherscanApiKey,
      },
    });

    // Check if Etherscan response is valid
    if (
      etherscanResponse.data.status !== "1" ||
      !etherscanResponse.data.result ||
      etherscanResponse.data.result.length === 0
    ) {
      throw new Error("Failed to fetch contract source code from Etherscan");
    }

    const sourceCode = etherscanResponse.data.result[0].SourceCode;

    // Instantiate the contract object
    const contract = new web3.eth.Contract(abi, address);

    // Fetch name and symbol asynchronously
    let name = "Unknown";
    let symbol = "Unknown";

    try {
      name = await contract.methods.name().call();
      console.log(`Fetched contract name: ${name}`);
    } catch (error) {
      console.warn(
        `Could not fetch name for contract ${address}:`,
        error.message
      );
      name = "Unknown"; // Assign a default value in case of error
    }

    try {
      symbol = await contract.methods.symbol().call();
      console.log(`Fetched contract symbol: ${symbol}`);
    } catch (error) {
      console.warn(
        `Could not fetch symbol for contract ${address}:`,
        error.message
      );
      symbol = "Unknown"; // Assign a default value in case of error
    }

    // Analyze the contract with ChatGPT for modifiers, rules, etc.
    const chatGPTAnalysis = await analyzeContract(sourceCode, name);

    // Fetch social media URLs related to the contract
    const socialUrls = await fetchSocialUrls(name);

    // Send Slack notification with contract details and social media URLs
    const fields = [
      { title: "Contract Address", value: address },
      { title: "Contract Name", value: name },
      { title: "Contract Symbol", value: symbol },
      { title: "Blockchain", value: "Ethereum" },
    ];

    if (socialUrls.length > 0) {
      const socialMediaField = {
        title: "Social Media URLs",
        value: socialUrls.map((url) => url.original).join("\n"),
      };
      fields.push(socialMediaField);
    }

    await sendSlackMessage(`Contract audit completed for ${name}`, fields);

    return {
      name,
      symbol,
      analysis: chatGPTAnalysis,
      socialUrls,
    };
  } catch (error) {
    console.error(`Error auditing address ${address}:`, error.message);
    return {
      name: "Unknown",
      symbol: "Unknown",
      analysis: `Failed to audit contract: ${error.message}`,
      socialUrls: [],
    };
  }
}

async function analyzeContract(sourceCode, contractName) {
  const prompt = `You are a smart contract auditor. Analyze the following Solidity code and answer the following questions:

  1. Identify any modifiers in the code.
  2. Identify any rules in the code.
  3. Identify any admin in the code.
  4. Identify any write functions that are restricted by these modifiers, admin, rules.
  5. Based on your findings, if you find any modifier or any write data function restricted, include the word 'success', otherwise include the word 'failed'.
  
  Here is the Solidity code:
  \`\`\`
  ${sourceCode}
  \`\`\`
  
  Please provide a structured response as follows:
  
  Modifiers:
  <list of modifiers>
  
  Admin:
  <list of admin>
  
  Rules:
  <list of rules>
  
  Restricted Write Functions:
  <list of write functions and their corresponding modifiers/admin/rules>
  
  Result: <success/failed>

  `;
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-0613",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that helps analyze Solidity smart contracts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("OpenAI response:", response.data.choices[0].message.content);

    const textData = response.data.choices[0].message.content;

    return textData.trim();
  } catch (error) {
    console.error("Error analyzing with ChatGPT:", error);
    throw new Error(
      `Failed to analyze with ChatGPT (analysis): ${error.message}`
    );
  }
}

async function fetchSocialUrls(contractName) {
  const prompt1 = `Please provide social media and community links related to ${contractName} token spcial twitter link + every links you can find.`;
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-0613",
      messages: [
        {
          role: "system",
          content: "You are an assistant that helps fetch social media URLs.",
        },
        {
          role: "user",
          content: prompt1,
        },
      ],
    });

    console.log(
      "OpenAI social URLs response:",
      response.data.choices[0].message.content
    );

    const socialUrls = extractUrls(response.data.choices[0].message.content);

    return socialUrls;
  } catch (error) {
    console.error("Error fetching social URLs with ChatGPT:", error);
    throw new Error(
      `Failed to fetch social URLs with ChatGPT: ${error.message}`
    );
  }
}

const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  return urls.map((url) => ({
    original: url,
    display: url.replace(/[\[\]]/g, ""),
  }));
};

async function sendSlackMessage(message, fields = []) {
  try {
    const attachments = fields.map(({ title, value }) => ({
      title: title,
      text: value,
    }));

    const response = await axios.post(slackWebhookUrl, {
      text: message,
      attachments: attachments,
    });

    console.log("Slack API Response:", response.data);

    console.log("Slack notification sent successfully.");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    throw new Error(`Failed to send Slack notification: ${error.message}`);
  }
}
