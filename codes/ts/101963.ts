// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//const vscode = require('vscode');
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import {config} from './config';
import readline from 'readline';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const homeDir = os.homedir();
	let crntYear: number = new Date().getFullYear();
	let crntMonth: number = new Date().getMonth() + 1;
	const location = config.location
	
	const filePath1 = path.join(homeDir, `${location}/${crntYear}/2024-${crntMonth}`);
	const filePathFind = path.join(homeDir, `${location}/${crntYear}`);
	if (!fs.existsSync(filePath1)) {
		// If it doesn't exist, create it
		fs.mkdirSync(filePath1, {recursive: true});
	}
	function generateTimestampedFileName(): string { //generates the filename based on timestamp
		const timestamp = new Date().toISOString();
		return `cligpt-${timestamp}.md`;
	}

	function createAndWriteToFile(directory: string): string {//creates file using generated timestamp, and writes our info into file
		const fileName = generateTimestampedFileName();
		const filePath = path.join(directory, fileName);
		const message = `role: ${config.role}\nmodel: ${config.model}\n## Question:\n---------\n`;
	
		try {
			fs.writeFileSync(filePath, message, { flag: 'a' });
			vscode.window.showInformationMessage(`File created and content written: ${fileName}`);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to create and write to the file');
		}
	
		return filePath;
	}
	function createAndWriteToFile2(directory: string): string {//creates file using generated timestamp, and writes our info into file
		const fileName = generateTimestampedFileName();
		const filePath = path.join(directory, fileName);
		const message = `Key-words: `;
	
		try {
			fs.writeFileSync(filePath, message, { flag: 'a' });
			vscode.window.showInformationMessage(`File created and content written: ${fileName}`);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to create and write to the file');
		}
	
		return filePath;
	}
	async function openFileInVSCode(filePath: string) {
		try {
			const document = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(document);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to open the file in VSCode');
		}
	}
	let createAndOpenFile = vscode.commands.registerCommand('cligpt.create', async () =>{
		if (!fs.existsSync(filePath1)) {
			// If it doesn't exist, create it
			fs.mkdirSync(filePath1, {recursive: true});
		}
		const gptfile = createAndWriteToFile(filePath1);
		openFileInVSCode(gptfile);
	});
	

	let sendToChatGPTCommand = vscode.commands.registerCommand('cligpt.push', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            let content:string = document.getText();

            // Send content to ChatGPT
            const response = await sendToChatGPT(content);

            // Write the response back to the file
            if (response) {
                editor.edit(editBuilder => {
                    editBuilder.insert(new vscode.Position(document.lineCount, 0), `\n\n## ChatGPT Response:\n---------\n${response}\n\n## My question:\n---------\n`);
                });
				vscode.workspace.saveAll();
            }
			else{
				vscode.window.showErrorMessage('No response.');
			}
        }
		else {
            vscode.window.showErrorMessage('No active editor found. Please open a file first.');
        }
    });
	let GPTfinish = vscode.commands.registerCommand('cligpt.commit', async () => {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			const document = editor.document;
			let content:string = document.getText();
			const summary = await sendToChatGPT(content + "In one line give me 2 to 6 key words seperated by a comma with a space on both sides ie. 'word1 , word2' that summarize this conversation. Don't include me asking you to summarize this conversation as part of your summary of this conversation or the role or model first listed in this conversation or any of the headers themselves");//"give me a 1 sentence summary of this conversation, I want you to make it as short a sentence as possible while still encapsolating the conversation. No more than 25 words but ideally less, and it doesnt have to be a pretty, complete sentence as long as I can understand the gist. Don't include me asking you to summarize this conversation as part of your summary of this conversation"
			if (summary){
				editor.edit(editBuilder => {
					var totalLines = editor.document.lineCount;
					var start = new vscode.Position(totalLines - 3, 0); 
					var end = new vscode.Position(totalLines, 0); 
    				var rangeToDelete = new vscode.Range(start, end);
					editBuilder.delete(rangeToDelete);
                    editBuilder.insert(new vscode.Position(document.lineCount, 0), `## Summary:\n${summary}`);
                });
				vscode.workspace.saveAll();
			}
		}
	});
	let GPTresume = vscode.commands.registerCommand('cligpt.resume', async () => {
		const editor = vscode.window.activeTextEditor;
		if(editor){
			const document = editor.document;
			editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(document.lineCount, 0), `\n\n## My question:\n---------\n`);
			});
			vscode.workspace.saveAll();
			vscode.window.showErrorMessage('No response.');	
		}
	});
	let GPTfind = vscode.commands.registerCommand('cligpt.find', async () =>{
		if (!fs.existsSync(filePath1)) {
			// If it doesn't exist, create it
			fs.mkdirSync(filePath1, {recursive: true});
		}
		const gptfile = createAndWriteToFile2(filePathFind);
		openFileInVSCode(gptfile);
	});
	let GPTsend = vscode.commands.registerCommand('cligpt.send', async () => {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            let content:string = document.getText();
			iterateFolder(filePath1, content, 0, "");
		}
	});
	function iterateFolder(dirPath: string, content: string, best_score: number, best_file: string): void {
		//let best_score: number = -1;
		//let best_file: string = "";
		let num = 0;
		fs.readdirSync(dirPath).forEach((file) => {
			num += 1;
			const fullPath = path.join(dirPath, file);
			const stats = fs.statSync(fullPath);
			
			if (stats.isFile()) {
				let crnt_score: number = fileScore(extractLastLine(fullPath), content);
				if(crnt_score > best_score){
					best_score = crnt_score
					best_file = fullPath;
				}
			}
			// else if(stats.isDirectory()){
			// 	iterateFolder(fullPath, content, best_score, best_file);//recursive through directories
			// }
		});
		console.log(num);
		const editor = vscode.window.activeTextEditor;
        if (editor) {
			// const failPath = path.join(dirPath, "FailFile.md"); 
			// openFileInVSCode(failPath);
			const filePath = editor.document.uri.fsPath;
			fs.unlink(filePath, (err) => {
				if (err) {
					// Couldn't delete the file for some reason
					vscode.window.showErrorMessage(`Failed to delete ${path.basename(filePath)}`);
					console.error(err);
				}
			});
		}
		openFileInVSCode(best_file);
	}
	function fileScore(summary: string, content: string){
		let score: number = 0;
		let words: string[] = summary.split(" ");
		let words2: string[] = content.split(" ");
		for (let word of words) {
			for (let word2 of words2){
				let word3 = word2 + ',';
				if (word.toLowerCase() == word2.toLowerCase()){
					score += 1;
				}
				else if(word.toLowerCase() == word3.toLowerCase()){
					score += 1;
				}
			}
		}
		return score;
	}
	function extractLastLine(filePath: string){
		const lines = fs.readFileSync(filePath).toString().split('\n');
   		return lines.length > 0 ? lines[lines.length - 1] : '';
	}
         
	async function sendToChatGPT(content: string): Promise<string | null> {
		const apiKey: string = config.apiKey;
		const model: string = config.model;
		//const apiKey = 'APIKEY';//process.env.OPENAI_API_KEY; 
		let auth: string = 'Bearer ' + apiKey;
		// const api_key = process.env.OPENAI_APIKEY;
		// vscode.window.showInformationMessage(api_key);
		try {
			const response = await axios.post('https://api.openai.com/v1/chat/completions', {
				model: model, // Specify the correct model
				messages: [{"role": "user", "content": content}],
				max_tokens: 3000
			}, 
			{
				headers: {
					'Authorization': auth,
					'Content-Type': 'application/json'
				}
			});
			if (response.data && response.data.choices && response.data.choices.length > 0) {
				//return response.request.choices[0].message.content;
				return response.data.choices[0].message.content;//.data.choices[0].text;//.data.choices[0].text.trim();
			}
			//return "1";
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error response:', error.response?.data);
			}
			else {
				console.error('Unexpected error:', error);
			}
			throw error;
		}
		// catch (error) {
		// 	console.error("there was an error", error);
		// 	throw error;
		// 	//vscode.window.showErrorMessage('Error communicating with ChatGPT: ', error);
		// }
	
		return null;
	}
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cligpt.create', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from cligpt!');
	});

	context.subscriptions.push(createAndOpenFile, sendToChatGPTCommand, GPTfinish, GPTresume, GPTfind, GPTsend);
}

// This method is called when your extension is deactivated
export function deactivate() {}
// Take code from listdir to open a new file with name based on time and date. 
// Store name of file being used that well have to give to cligpt, so when we then input text into the file and ask the question it
// will take that question and run in on gpt.


