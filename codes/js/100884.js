'use strict';
const { Client, GatewayIntentBits } = require('discord.js');
const {
    CHANNELID_DISCORD,
    TOKEN_DISCORD
} = process.env;
class DiscordLogger {
    constructor() {
        this.client = new Client({ 
            intents: [
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ] 
        });

        //add channnel id
        this.channelId = CHANNELID_DISCORD;
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });

        this.client.login(TOKEN_DISCORD);

        this.client.on('messageCreate', (message) => {
            if (message.author.bot) return;
            if (message.content === 'ping') {
                message.reply('pong');
            }
        });
    }


    sendToFormatCode (logData) {
        const { 
            code, 
            message = "This is some additional information about the code.", 
            title = "Code Example",
            stack 
        } = logData;
    
        const codeMessage = {
            content : message,
            embeds: [
                {
                    color: parseInt('00ff00', 16), // Convert hex to decimal
                    title,
                    description: '```json\n' + JSON.stringify(code, null, 2) + '\n```',                
                }
            ],
        }
        this.sendToMessage(codeMessage);
    }

    sendToMessage(message ='message') {
        const channel = this.client.channels.cache.get(this.channelId);
        if (!channel) {
            console.error(`Channel with ID ${this.channelId} not found.`);
            return;
        }

        // message use chatGPT api call
        channel.send(message).catch(e => console.log(e));
    }
}

// const loggerService = new DiscordLogger();
module.exports = new DiscordLogger();