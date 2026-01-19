// This code was assisted by ChatGPT, OpenAI.

const cb = require("./chatbot/geminiAI");
const fyTTS = require("./tts_service/fakeYouTTS");

class ChatService {
    #sessions = new Map(); // separate chat sessions per user

    constructor(database) {
        this.db = database;
    }

    getSession = (email) => {
        if (!this.#sessions.has(email)) {
            this.#sessions.set(email, new cb()); // set session with user email and chatbot instance

            setTimeout(() => {
                this.#sessions.delete(email);
            }, 60 * 60 * 1000); // auto-delete after 1 hour
        }
        return this.#sessions.get(email); // gets session with user email
    }

    clearSession = (email) => this.#sessions.delete(email); // clears session with user email

    handleChat = async (req, res, next) => {
        try {
            const userEmail = req.user.email;
            const user = await this.db.getUser(userEmail);
            if (!user) throw new Error("User not found");

            const isAtLimit = user.api_calls_left === 0; // triggers alert status when api calls 0
            const userMessage = req.body.message;
            if (!userMessage) throw new Error("No message provided in the request body.");

            const chatbot = this.getSession(userEmail); // get chat session from user email
            const result = await chatbot.sendMessage(userMessage);
            const chatbotText = result.response.text();

            // match[0] is whole string, match[1] is emotion, and match[2] is string after colon
            const match = chatbotText.match(/^(happy|sad|angry|disgust|scared|shocked|mock|neutral):\s*(.*)/i);
            const emotion = match ? match[1].toLowerCase() : "neutral";
            const finalText = match ? match[2] : chatbotText;

            const audioUrl = await fyTTS.generateAudioFromText(finalText);

            // decrement api calls every chatbot request
            if (user.api_calls_left !== -1) {
                await this.db.updateApiCallsLeft(userEmail, user.api_calls_left - 1);
            }

            res.json({
                text: finalText,
                emotion: emotion,
                alert: isAtLimit,
                audioUrl: audioUrl
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatService;
