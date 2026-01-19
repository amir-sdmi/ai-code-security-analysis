"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitMessage = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log(process.env.GROK_API_KEY);
const submitMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(message);
        const response = yield fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: message,
                    },
                ],
                model: "grok-beta",
                stream: false,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
        }
        const data = yield response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content || "No response generated";
        }
        else {
            return "No response generated";
        }
    }
    catch (error) {
        console.error("Error generating content with Grok:", error);
        throw new Error("Failed to generate response from Grok API");
    }
});
exports.submitMessage = submitMessage;
