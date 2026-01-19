const Alexa = require('ask-sdk-core');
const request = require('sync-request');
const { OPENAI_API_KEY } = require('./config');
var initialPrompt = 'Talk in a professional and informative way, keeping your replies brief (no more than 2 sentences) and allowing me to change how complex your answers are. NO YAPPING!';
var catchAllList = [];

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'What language model do you want? Microsoft, OpenAI, or Meta. Say exit at any time to leave.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)  // Add reprompt for user response
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        var speakOutput = 'Hello World!';

        // Retrieve the value of the 'catchAll' slot
        const catchAllValue = handlerInput.requestEnvelope.request.intent.slots.catchAll.value;
        console.log('User Input:', catchAllValue);

        function makeSyncPostRequest() {
            try {
                
                // Create an array of message objects to send to OpenAI
                let messages = [
                    { "role": "system", "content": initialPrompt }
                ];
                
                messages.push({ "role": "user", "content": "Here is a text-based file of Microsoft and Cloudforces slides. Slide 1: Accelerating AI Adoption with Copilot & Azure OpenAI -Cloudforce, a Powerful Extension of Microsoft: -Highlights Cloudforces role as a leading Microsoft partner, focused on delivering AI solutions with tools like Microsoft Copilot and Azure OpenAI. -Recognized for helping Fortune 500 companies and other institutions accelerate cloud adoption using Azure and Microsoft 365. -Key Metrics: -Customer Growth: 52.3% average annual growth rate. -Client Satisfaction: 9.64/10 average survey rating. -Certifications: Over 150 individual Azure and M365 certifications. Slide 2: Enhance the Student Experience at George Mason University -Goal: Leverage Microsofts AI tools and services to create a solution that enhances student experience at GMU. -Focus on sustainability, functionality, and security through this solution. Slide 3: Innovate the Future Track -Objective: Design and develop a creative, AI-powered tool using Azure OpenAI and other Microsoft technologies to enhance the functionality, sustainability, educational, and user experiences of George mason university students. -Prizes: -First Place: Xbox Series S for all team members. -Second/Third Place: Various swag items from Microsoft. This summary represents the key points from the three slides." });

                // Add all previous inputs from catchAllList to the messages array
                catchAllList.forEach(value => {
                    messages.push({ "role": "user", "content": value });
                });

                // Add the current catchAllValue to the messages array
                messages.push({ "role": "user", "content": catchAllValue });
                
                const response = request('POST', 'https://api.openai.com/v1/chat/completions', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + OPENAI_API_KEY,
                    },
                    body: JSON.stringify({  
                        "model": "gpt-4o-mini",
                        "messages": messages
                    })
                });

                if (response.statusCode === 200) {
                    catchAllList.push(catchAllValue);
                    const responseData = JSON.parse(response.getBody('utf8'));
                    speakOutput = responseData.choices[0].message.content;
                    console.log('Response:', speakOutput);
                } else {
                    console.error('Failed with status code:', response.statusCode);
                }
            } catch (error) {
                console.error('Error:', error.message);
            }
        }

        makeSyncPostRequest();

        const repromptOutput = 'Would you like to ask anything else?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)  // Add reprompt for user interaction
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';
        const repromptOutput = 'Please ask for help if needed.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)  // Add reprompt for help intent
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)  // End the session
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';
        const repromptOutput = 'Can you repeat that?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)  // Add reprompt for fallback intent
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();  // Empty response
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        const repromptOutput = 'Please provide further details.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)  // Add reprompt for reflecting intent
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        const repromptOutput = 'Could you please repeat your request?';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)  // Reprompt for error handling
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
