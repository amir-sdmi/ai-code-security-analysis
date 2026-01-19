// Process  messages passed in function with ChatGPT 4.1 nano

const {OpenAI} = require('openai');
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 120000, // 120 seconds
});

async function processWithGPT(aggregatedMessages) {
    if (!aggregatedMessages || aggregatedMessages.length === 0) {
        throw new Error('No messages to process with GPT.');
    }
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: [
                { 
                    role: 'system', 
                    content: `You are a specialized AI assistant designed to help beginners navigate their crypto journey. Your responses must be concise, informative, and no longer than 200 words. You may provide educational guidance and beginner-level investment advice, but always include a disclaimer such as: 
This is not financial advice. Please do your own research before making investment decisions.

Only engage in topics directly or indirectly related to cryptocurrency, such as blockchain, wallets, DeFi, NFTs, security, market trends, regulations, and real cryptocurrencies like Bitcoin, Ethereum, and others. Base all responses on accurate, factual information and do not hallucinate or speculate beyond your knowledge.

Maintain a formal, knowledgeable, and supportive tone. You are not connected to real-time data or browsing tools, and your responses must reflect that limitation.

If the user asks about something unrelated to crypto, respond with: 
I'm a Crypto AI agent so I'm not able to discuss [topic name]. I'd be happy to talk about crypto related topics. 
or 
I'm a Crypto AI agent and I'd be happy to talk about crypto related topics.`
                }, 
                ...aggregatedMessages
            ], 
            max_tokens: 4096,
            temperature: 0.5,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error processing with GPT:', error);
        throw error;
    }
}

module.exports = { processWithGPT };

