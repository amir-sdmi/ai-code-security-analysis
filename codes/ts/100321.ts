import axios from 'axios';
import {BackendApplicationContribution} from '@theia/core/lib/node/backend-application';
import {injectable} from 'inversify';
import * as http from "node:http";
import * as https from "node:https";
import {MaybePromise} from "@theia/core";
import {MettlTheiaAiBackendService} from "../common/protocol";

@injectable()
export class MettlTheiaAiExtensionServiceImpl implements BackendApplicationContribution, MettlTheiaAiBackendService {


    onStart(server: http.Server | https.Server): MaybePromise<void> {
        console.log('ChatGPT extension backend started');
    }

    async getChatGPTResponse(prompt: string): Promise<string> {
        console.log("Going to call ChatGPT with prompt:", prompt);
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.key1}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("Got response from ChatGPT:", response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error communicating with ChatGPT:', error);
            throw new Error('Failed to get response from ChatGPT');
        }
    }
}
