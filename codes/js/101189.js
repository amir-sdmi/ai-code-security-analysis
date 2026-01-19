
const {
    sakshGenerateGeminiContent,
    sakshGenerateChatGPTContent,
    sakshGenerateCohereContent,
    sakshGenerateAnthropicContent,
    sakshGenerateMetaContent,
    sakshGenerateMistralContent,
    sakshGenerateHuggingFaceContent
} = require('saksh-ai-prompt');

const configGemini = {

    apiKey: "AIzaSyAv93SwPxpaQv6HR8V0ByOwiQwZpUsUecA",
    modelName: "gemini-1.5-flash"
};

const configChatGPT = {
    apiKey: 'your_openai_api_key',
    modelName: 'text-davinci-003'
};

const configCohere = {
    apiKey: 'your_cohere_api_key',
    modelName: 'large'
};

const configAnthropic = {
    apiKey: 'your_anthropic_api_key',
    modelName: 'claude-v1'
};

const configMeta = {
    apiKey: 'your_meta_api_key',
    modelName: 'opt-175b'
};

const configMistral = {
    apiKey: 'your_mistral_api_key',
    modelName: 'mistral-7b'
};

const configHuggingFace = {
    apiKey: 'your_huggingface_api_key',
    modelName: 'gpt2'
};

const prompt = "Your prompt here...";

// Using Gemini
sakshGenerateGeminiContent(prompt, configGemini).then(response => {
    console.log("Generated Content from Gemini:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using ChatGPT
sakshGenerateChatGPTContent(prompt, configChatGPT).then(response => {
    console.log("Generated Content from ChatGPT:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using Cohere
sakshGenerateCohereContent(prompt, configCohere).then(response => {
    console.log("Generated Content from Cohere:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using Anthropic
sakshGenerateAnthropicContent(prompt, configAnthropic).then(response => {
    console.log("Generated Content from Anthropic:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using Meta
sakshGenerateMetaContent(prompt, configMeta).then(response => {
    console.log("Generated Content from Meta:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using Mistral
sakshGenerateMistralContent(prompt, configMistral).then(response => {
    console.log("Generated Content from Mistral:", response);
}).catch(error => {
    console.error("Error:", error);
});

// Using Hugging Face
sakshGenerateHuggingFaceContent(prompt, configHuggingFace).then(response => {
    console.log("Generated Content from Hugging Face:", response);
}).catch(error => {
    console.error("Error:", error);
});

