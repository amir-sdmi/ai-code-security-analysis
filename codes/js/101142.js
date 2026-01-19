const { Client, LocalAuth } = require('whatsapp-web.js');

const qrcode = require('qrcode-terminal');
const axios = require('axios');

// creating local backup for web WhatsApp credentials 
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'wtauth'
    })
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

client.on('message_create', message => {
	console.log(message.body);
});


client.on('message', message => {
    let messages = [];
    messages.push(message.body);
    const firstWord = messages[0].split(' ')[0];
    const body = messages[0].split(' ').slice(1).join(' ');
	// catching messages beginning with /gpt and returning results from gemini
    if (firstWord === '/gpt') {
        if(body.length < 1) {
            return message.reply("Please enter a prompt to generate a response.\n eg: '/gpt Give me an two number addition code in C'");
        }
        else{
        gpt(body).then(response => {
            res = response;
            if(response.length > 4)
            client.sendMessage(message.from, response);
            else
            client.sendMessage(message.from, "I am sorry, I didn't get that. Please try again.");
        }).catch(error => {
            message.reply(error);
        });
    }
    }
    

    else if (firstWord === 'Hi' ) {
        message.reply('use /gpt + <prompt> to use gemini');
    }
    else if (firstWord === 'Hello') {
        message.reply('use /gpt + <prompt> to use gemini');
    }

//catching media files sent and replying the same to sender
    else if(message.hasMedia) {
        message.downloadMedia().then(media => {
            try{ 
                message.reply('Processing your request, please wait...');
                setTimeout(() => }, 3000);
                message.reply(media);

            }
            catch (error) {
                message.reply('Error: ' + error);
            }
           
        });
    }
});



async function gpt(prompt) {
	const apiKey = 'AIzaSyCo26oDUMWLSgdFaHeYn9e0krhG7D6YQEc';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    try {
        const response = await axios.post(url, {contents: [{parts: [{text: prompt}]}]});
        let finalText = "";
        for (let part of response.data.candidates) {
            for (let t of part.content.parts) {
                finalText += t.text;
            }
        }
        return finalText;
    } catch (error) {
        var e = JSON.stringify(error.response.data);
        return `Error: ${e}`;
    }
}
