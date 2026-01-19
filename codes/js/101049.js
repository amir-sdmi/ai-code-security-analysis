const axios = require('axios');
const fs = require('fs');

// Load the config file if it exists
let config = {};
if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

const animationFrames = [
    "<:notfunny:904136529780285480> ",
    "<:SuprisedSpeed:860771872676642826>  ",
    "<:speed_sad:983148974489874493> ",
    "<:speed_crying:983148807019692032> ",
    "<:notfunny:904136529780285480> ",
    "<:SuprisedSpeed:860771872676642826>  ",
    "<:speed_sad:983148974489874493> ",
    "<:speed_crying:983148807019692032> "
];

module.exports = {
    description: 'https://appembed.netlify.app/e?description=love%20show%20to%20someone&provider=iN%24aNE&author=VARJoke&image=&color=%23FF0000',
    run: async (client, message, handler, prefix) => {
        try {
            const args = message.content.split(' ').slice(1);
            let user;
             // Check if there is a mention
        if (message.mentions.users.size > 0) {
            user = message.mentions.users.first();
        } else if (args.length > 0) {
            // Try to find the user by username if not mentioned
            const username = args.join(' ').trim();
            user = message.guild.members.cache.find(member => member.user.username === username)?.user;
        }

        // If no user found, default to the message author
        user = user || message.author;
            // Dynamically import the ES module
            const input = message.content.trim().slice(prefix.length + 7).trim();
            message.edit(`jarvis, ${input} \n\n**Jarvis:** writing...`);
            let repliedMessageContent = "";
            if (message.reference) {
                
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                const userMention = `${message.mentions.users.first() ? message.mentions.users.first() : message.author}`;
                repliedMessageContent = `${user.tag} said: "${repliedMessage.content}"`;
                console.log(repliedMessageContent)
            }
            
            // Log the content of the replied message
            console.log('Replied message content:', repliedMessageContent);
            const instruction = "Please respond in English and keep the response within 150 characters: ";
            const prompt = `${instruction}${repliedMessageContent}${input}`;
            const { chatGPT } = await import("free-chatgpt-3.5-turbo-api");
            // Use chatGPT function
            const resultado = await chatGPT({ prompt: prompt, max_tokens: 35});
            if (resultado.length > 400) {
                resultado = "Sorry boss, my response is too long for the question.";
            }
            //console.log(resultado);
            message.edit(`.jarvis, ${input} \n\n**Jarvis:** ${resultado}`);

            // Message animation logic
            // let frame = 0;
            // let editCount = 0; // Counter to keep track of the number of edits

            // const interval = setInterval(() => {
            //     message.edit(animationFrames[frame]);
            //     frame = (frame + 1) % animationFrames.length;
            //     editCount++; // Increment the counter each time the message is edited

            //     if (editCount >= 10) { // Check if the message has been edited 10 times
            //         clearInterval(interval); // Stop the interval
            //         message.edit(`<:SuprisedSpeed:860771872676642826> Not Funny Bruh!! ${message.mentions.users.first() ? message.mentions.users.first() : message.author}`);
            //     }
            // }, 500); // Adjust the speed by changing the interval time (500ms here)

        } catch (error) {
            console.error(error);
            message.reply('An error happened when fetching a msg, sorry Boss!');
        }
    }
};
