import { Entity } from './Entity.js';
require('dotenv').config();

// Load environment variables from .env file
const apiKey = process.env.OPENAI_API_KEY;

// Rest of the code...

// this is the base class for all NPC entities in the game
// the idea is to connect all entities with chatGPT to interact on a natural way - we should create a service for managing this!
export class NPC extends Entity{
    constructor(sName, sPlace, oGame) {
        super(sName, sPlace, oGame);
        return this;
    }
    setAction(sAction){
        this.action = this[sAction];
        return this;
    }
    async getChat(prompt, role) {
        const apiKey = false; // to-do list... get the OpenAI API key
        const apiUrl = "https://api.openai.com/v1/chat/completions";

        const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: 'user', temperature: 0.9,content: "você é " + role + ". " + prompt + ". Responda de forma que reflita a sua personalidade mas com uma mensagem curta e direta."}],
        }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }
    async interact(agentInput) {
        const prompt = `
        You are ${this.name}, an NPC located in ${this.place}.
        The agent says: "${agentInput}".
        Respond in a way that reflects your character's personality and role.
        `;

        const chatGPTResponse = await this.getChat(prompt);
        return `${this.name} says: "${chatGPTResponse}"`;
    }
    goTo(newPlace) {
        this.game.moveNPC(this, newPlace);
        return `${this.name} foi para ${newPlace}.`;
    }
    recalculate(iDays){
        return iDays;
    }
}