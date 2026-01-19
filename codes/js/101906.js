import OpenAI from 'openai';
import inquirer from 'inquirer';
import {CODE_ACTION, COMMAND, MODEL} from '../constant.js';
import * as fs from 'node:fs';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);
/**
 * Using Deepseek AI
 */
export class CodeAgent {
  async initialize(configuration) {
    this.openai = new OpenAI({
      apiKey: configuration.apiKey,
      baseURL: configuration.baseURL,
    });
    this.agentRole = {
      role: 'system',
      content: 'You are a Code AI expert who analyzes project requirements, suggests solutions, and provides code changes for implementation.',
    }
    this.conversationHistory = [];
    await this.loadConversation();
  }

  async start() {
    console.log('CodeAgent started');
    this.userInput();
  }

  async userInput() {
    const {option} = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Choose an option:',
        choices: Object.values(COMMAND),
      },
    ]);

    switch (option) {
      case COMMAND.PROVIDE_INFO:
        const {info} = await inquirer.prompt([
          {
            type: 'editor',
            name: 'info',
            message: 'Provide information:',
          },
        ]);
        const response = await this.provideInstructions(info);
        break;
      case COMMAND.ASK:
        const {question} = await inquirer.prompt([
          {
            type: 'input',
            name: 'question',
            message: 'Ask a question:',
          },
        ]);
        const answer = await this.simpleAsk(question);
        break;
      case COMMAND.GEN_CODE:
        const {requirements} = await inquirer.prompt([
          {
            type: 'input',
            name: 'requirements',
            message: 'Provide additional requirements (optional):',
          },
        ]);
        const codeInfo = await this.askCodeChange(requirements);
        await this.genCode(codeInfo);
        break;
    }

    await this.checkSummary();
    await this.saveConversation();
    this.userInput();
  }

  getConversationTokenLength() {
    return JSON.stringify(this.conversationHistory).length;
  }

  async checkSummary() {
    if (this.getConversationTokenLength() > 4096) {
      console.log("Summary required");
      const summary = await this.summaryHistory();
      console.log("Summary: ", summary);
      this.conversationHistory = [{
        role: 'system',
        content: summary,
      }];
    }
  }

  async summaryHistory() {
    const summaryPrompt = "Summarize this conversation in a concise manner:\n\n" +
      this.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");

    const response = await this.openai.createChatCompletion({
      model: MODEL.DEEPSEEK_CHAT,
      messages: [
        {
          role: 'system',
          content: 'You are a Code AI expert',
        },
        {
          role: "user", content: summaryPrompt
        }
      ]
    });

    return response.data.choices[0].message.content;
  }

  async simpleAsk(question) {
    this.conversationHistory.push({
      role: 'user',
      content: `I want to ask: ${question}`
    });

    return this.askWithHistory(this.conversationHistory);
  }

  async provideInstructions(instruction) {
    this.conversationHistory.push({
      role: 'user',
      content: `FYI, reply OK if you understand, ask me if you want to clarify: ${instruction}`,
    });
    return this.askWithHistory(this.conversationHistory);
  }

  async askWithHistory(conversationHistory) {
    const completion = await this.openai.chat.completions.create({
      model: MODEL.DEEPSEEK_CHAT,
      messages: [
        this.agentRole,
        ...conversationHistory
      ],
      stream: true,
    });
    let fullResponse = '';
    for await (const part of completion) {
      process.stdout.write(part.choices[0].delta.content);
      fullResponse += part.choices[0].delta.content;
    }
    process.stdout.write('\n');
    return fullResponse;
  }

  async askCodeChange(requirement) {
    let ext = '';
    if (requirement) {
      ext = `Here is additional requirements: ${requirement} \n`
    }

    const conversationHistory = [].concat(this.conversationHistory);
    conversationHistory.push({
      role: 'user',
      content: `I want to generate code. ${ext}`,
    });
    conversationHistory.push({
      role: 'assistant',
      content: `Generate code and run command-line based on the provided requirements as a JSON-formatted list of actions that can be parsed using JSON.parse. For example: 
      [
      {
        "action": "addFile",
        "fileName": "src/service/example.service.js",
        "content": "export const example = () => {}",
      },
      {
        "action": "editFile",
        "fileName": "src/main.js",
        "removeLines": [1, 2, 3, 4],
        "insertLine": 3,
        "content": "const a = 5;",
      },
      {
        "action": "runCommand",
        "command": "npm install axios",
      }
      ]
      `,
    });
    return this.askWithHistory(conversationHistory);
  }

  async genCode(codeInfo) {
    const startIndex = codeInfo.indexOf('```json');
    const lastIndex = codeInfo.lastIndexOf('```');
    const actionInfo = codeInfo.slice(startIndex, lastIndex).replace('```json', '');
    const instructions = JSON.parse(actionInfo);
    for (const instruction of instructions) {
      switch (instruction.action) {
        case CODE_ACTION.ADD_FILE: {
          // create directory and file if not exist
          if (fs.existsSync(instruction.fileName)) {
            // Remove file if exists
            fs.unlinkSync(instruction.fileName);
          } else {
            fs.mkdirSync(instruction.fileName.split('/').slice(0, -1).join('/'), {
              recursive: true
            });
          }
          fs.writeFileSync(instruction.fileName, instruction.content);
          break;
        }
        case CODE_ACTION.EDIT_FILE: {
          const fileContent = fs.readFileSync(instruction.fileName, 'utf8');
          const lines = fileContent.split('\n');
          const newLines = [];
          for (let i = 0; i < lines.length; i++) {
            if (!instruction.removeLines.includes(i - 1)) {
              newLines.push(lines[i]);
            }
          }
          newLines.splice(instruction.insertLine - 1, 0, instruction.content);
          fs.writeFileSync(instruction.fileName, newLines.join('\n'));
          break;
        }
        case CODE_ACTION.RUN_COMMAND: {
          const {stdout, stderr} = await exec(instruction.command);
          console.log('stdout:', stdout);
          console.log('stderr:', stderr);
          break;
        }

        default:
          console.log('Unknown action');
      }
    }
  }

  async saveConversation() {
    const conversation = JSON.stringify(this.conversationHistory);
    fs.writeFileSync('conversation.json', conversation);
  }

  async loadConversation() {
    const conversationExists = fs.existsSync('conversation.json');
    if (!conversationExists) {
      return;
    }
    const conversation = fs.readFileSync('conversation.json', 'utf8');
    this.conversationHistory = JSON.parse(conversation);
  }
}
