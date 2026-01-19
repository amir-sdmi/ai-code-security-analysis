require("dotenv").config();
const openAI = require('./configs/openAI');
const dbCon = require("./configs/dbCon");

//*Establishing connection with the backend.
console.log("Connecting to MongoDB...");
dbCon.connect();

//*Establishing connection with OpenAI.
console.log("Connecting to OpenAI.")
openAI.setup();


//*Environment Variables
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

//*Twilio Setup
const client = require("twilio")(accountSid, authToken);
// const { Server } = require('ws');

//*Using Express
const express = require("express");
let socketIDs = {};
let socketStatus = {};
let PORT;
let server;

const setup = () => {
	server = express() // make the server
		.use((req, res) => res.send("Hi there"))
		.listen(PORT, () => console.log(`Listening on ${PORT}`));

	server.on("error", (err) => {
		console.log(`${err.message}`);
	});

    PORT = process.env.PORT || 4000; //port for https
    
    socketIDs = {};
    socketStatus = {};
};

setup();

//*Using Socket.io
const IO = require(`socket.io`)(server);

//*Using Middleware
const middleWare = require(`./middleware`);
middleWare.setup();
middleWare.beginCommunication(socketIDs, socketStatus, 	IO);

//*Using ChatGPT Communication.
let chatHistory =[
	{"role": "system", "content": "You are a helpful assistant."},
	{"role": "user", "content": "Who won the world series in 2020?"},
	{"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
	{"role": "user", "content": "Where was it played?"}
] 
openAI.getBotResponse(chatHistory);

// const app = express();

async function sendOTP(phoneNumber, userID) {
	try {
		const random = Math.floor(Math.random() * 9000 + 1000);
		var receiverNumber = phoneNumber;
		const twilioServiceNumber = "+15076292632";
		console.log(random);
		// console.log("UserID : ", userID);
		const response = await UserControls.setUserPassword(
			{ id: userID },
			random
		);

		if (response == 1) {
			return -1;
		}

		client.messages
			.create({
				body: `Your LangLink OTP is ${random}`,
				from: twilioServiceNumber,
				to: receiverNumber,
			})
			.then((message) => {
				console.log(message.sid);
			});
	} catch (err) {
		console.log(`Twilio Error : ${err.message}`);
		return;
	}
}

async function verifyOTP(userID, otp) {
	try {
		let message = {};

		const responseObj = await UserControls.verifyPassword({
			id: userID,
			otp: otp,
		});

		if (responseObj === 0) {
			message = {
				verified: "yes",
			};
		} else {
			message = {
				verified: "no",
			};
		}

		return message;
	} catch (err) {
		console.log(`OTP Verification Error : ${err.message}`);
		return {};
	}
}

async function textToText(message, sent_language, send_language) {
	try {
		let translatedText = message;
		const url =
			"https://11fc0468-644c-4cc6-be7d-46b5bffcd914-prod.e1-us-east-azure.choreoapis.dev/aqqz/iiitilmt/1.0.0/onemt";
		const languages = {
			English: "eng",
			Hindi: "hin",
			Telugu: "tel",
		};

		if (sent_language === send_language) {
			return translatedText;
		}

		console.log(
			`Translating From ${sent_language}(${languages[sent_language]}) to ${send_language} (${languages[send_language]})`
		);

		const options = {
			method: "POST",
			headers: {
				accept: "/",
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.TRANSLATION_TOKEN}`,
			},
			body: JSON.stringify({
				text: message,
				source_language: languages[sent_language],
				target_language: languages[send_language],
			}),
		};

		await fetch(url, options)
			.then((response) => response.json())
			.then((data) => {
				console.log("TranslatedText", data.data);
				translatedText = data.data;
			})
			.catch((error) => console.error(error));

		return translatedText;
	} catch (err) {
		console.log(`Translation Pipeline Error : ${er.message}`);
	}
}
