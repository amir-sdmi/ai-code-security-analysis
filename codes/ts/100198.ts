const { Configuration, OpenAIApi } = require("openai");


const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

class AIRequests {

    async suggestCarDescription (brand: string, model: string, year: number, color: string) {
        const prompt = "Write a description for a " +
         color + " " + year + " " + brand + " " + model;

        // Generate a response with ChatGPT
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0.9,
            max_tokens: 90,
            n: 1,
            // stop: '.'
        });

        return completion.data.choices[0].text.trim();
    }
}

// eslint-disable-next-line
export default new AIRequests();