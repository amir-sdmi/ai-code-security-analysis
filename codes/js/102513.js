import fs from 'fs/promises'
import { join } from 'path';
import path from 'path';
import os from 'os'
import {exec} from 'child_process'         //use exec to run commands like open browser

//NPM packages
import OpenAI from "openai";               //use openai spec
import dotenv from "dotenv"                //use dotenv to load environment variables

//new way for markdown
import {unified} from 'unified';
import {visit} from 'unist-util-visit';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkHighlight from 'remark-highlight.js';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js';
import remarkStringify from 'remark-stringify';

//Local packages
import {PromptProfile} from './prompt_profiles/PromptProfile.js';
import {TreeModeProfile} from './prompt_profiles/TreeMode.js';
import {CodeReviewPromptProfile} from './prompt_profiles/CodeReview.js';
import {VisionDescribe} from './prompt_profiles/VisionDescribe.js';
import UserPromptRequest from './utils/UserPromptRequest.js';
import terminal from './utils/terminal.js'; 
import {minimizeTokens, sleep } from './utils/utils.js';
import ProfileFileLoader from './utils/ProfileFileLoader.js';
//TODO schema belond in reponse
import schema from './prompt_profiles/ResponseSchema.js';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

//Configuration before main -------------------------------
dotenv.config();

//apiKey: process.env.XAI_API_KEY,
//baseURL: "https://api.x.ai/v1",
//grok-2-vision-1212
//TODO this does not have to be hardcoded to grok
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
});

const xai = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
});


let chosenModel = xai;
let GlobalPromptProfile = PromptProfile;

const tagLength = 16; //8 for grok

//End Configuration before main -------------------------------

// Parse command line arguments and return prompt and flags
export function parseCommandLineArgs(serverArgs) {
    let isServerRequest = false;
    terminal.debugLogger = true;
    let args = process.argv.slice(2);
    if(serverArgs.length > 0){
        terminal.debug(terminal.colors.red, "Server request detected", terminal.colors.reset, serverArgs);
        isServerRequest = true;
        args = serverArgs;
    }

      

    let userPrompt = "Default prompt if none provided";
    let depth = 500;
    let isNew = false;
    let context = "";
    let filePath = "";
    let isShort = false;
    let specialty = "";
    let treeMode = false;
    let terminalMode = false;
    let browserMode = true;
    let codeReviewMode = false;
    let baseContextDirectory ="./grok/context/";
    let visionMode = false; 
    let visionModeDirectory = "";
    let indexLookupMode = false;
    if(args.includes("--mockMode")){
        baseContextDirectory = `${baseContextDirectory}mockContext/`
    }

    if(args.includes("--visionMode")){
        visionMode = true;
        visionModeDirectory = args[args.indexOf("--visionMode") + 1];
    }

    if(args.includes("--openai")){
        chosenModel = openai;
    }
    if (args.includes("--treeMode")) {
        treeMode = true;
    }
    if (args.includes("terminalMode")) {
        terminal.debugLogger = isServerRequest;  //show logs if is server request
        browserMode = false;
    }
    if (args.includes("--codeReviewMode")) {
        codeReviewMode = true;
    }
    //TODO update specialty to be named role here and in shell script
    if (args.includes("--specialty")) {
        const specialtyIndex = args.indexOf("--specialty") + 1;
        if (specialtyIndex < args.length) {
            specialty = args[specialtyIndex]; //TODO: this should be a sentence and then passed to the profile... does a "sentence in quotes" work as one argument?
        }
    }

    if(args.includes("--indexLookupMode")){
        indexLookupMode = true;
    }

    if (args.includes("--depth")) {
      
        const depthIndex = args.indexOf("--depth") + 1;
        if (depthIndex < args.length) {
            depth = args[depthIndex];
        }
    } 
    if (args.includes("--file")) {
        const filePathIndex = args.indexOf("--file") + 1;
        if (filePathIndex < args.length) {
            filePath = args[filePathIndex];
        }
    }

    if (args.includes("--shortMode")) {
        isShort = true;
    }
   
    if (args.includes("--new")) {
        isNew = true;

    }  if (args.includes("--context")) {
        const contextIndex = args.indexOf("--context") + 1;
        if(contextIndex < args.length){
            context = args[contextIndex];
        }
    
    } else if (args.length > 0) {
        userPrompt = args.join(" ");
    }

    let indexOfPrompt = args.indexOf("PROMPT");
    if (indexOfPrompt != -1) {
        userPrompt = args[indexOfPrompt + 1];
    }


    return new UserPromptRequest(userPrompt, isShort, isNew, context, depth, filePath, specialty, treeMode , browserMode, codeReviewMode, baseContextDirectory, visionMode, visionModeDirectory, indexLookupMode);
}

// Read and parse the context file
export async function getConversationContext(userPromptRequest, isNew) {
let context = userPromptRequest.context;
if(isNew){
    return "";
}
    //isNew? return "string for a new context": do other stuff
    try {
  
        //TODO FIX CONTEXT HSITRY for new flag
        if (context == "") {
            const context = await fs.readFile(userPromptRequest.baseContextDirectory + 'currentChat/currentChat.json', "utf8");
            const parsedContext = JSON.parse(context);
           
            const messages = parsedContext.choices[0]
            //console.log(colors.green, "parsedContext", messages.message.content, colors.reset);
            let messageContent = messages.message.content;
 
            messageContent = minimizeTokens(messageContent);

            return messageContent || "Error returning context";
        } else {
      

            const storedContext = await fs.readFile(userPromptRequest.baseContextDirectory + 'history/fullCompletion/' + context + '.json', "utf8");
            const parsedContext = JSON.parse(storedContext);
           
            const messages = parsedContext.choices[0]
            //console.log(colors.green, "parsedContextSET", messages.message.content, colors.reset);
            let messageContent = messages.message.content;
          
            messageContent = minimizeTokens(messageContent);

            return messageContent || "Error returning context for " + context;
        }
    } catch (error) {
        terminal.error("Error reading or processing the context file:", error);
        return "";
    }
}


// Create the request object for the API
export async function createApiRequestForVision(userPromptRequest, priorConverstation, isNew, isShort, contextData, context, filePath, specialty, processingRootNode) {
    //TODO implement abstraction for profiles before this explodes in complexity
    GlobalPromptProfile = VisionDescribe;
    let messages = [];
    messages = VisionDescribe.getJsonProfile(isNew, priorConverstation, contextData, userPromptRequest); // Load the array from the default file
    
    terminal.debug(terminal.colors.green, "Prompt Sent to Grok", terminal.colors.reset, JSON.stringify(messages, null, 4));
  
    //grok-2-latest
    //grok-2-vision-1212

    return {
        model: chosenModel == openai ? "gpt-4o-mini" : "grok-2-vision-1212",
        messages: messages, // Use the loaded variable here
    
    };
}


// Create the request object for the API
export async function createApiRequestForImageGeneration(userPromptRequest, priorConverstation, isNew, isShort, contextData, context, filePath, specialty, processingRootNode) {
    //TODO implement abstraction for profiles before this explodes in complexity
    GlobalPromptProfile = ImageGenerationPromptProfile;
    let messages = [];
    messages = ImageGenerationPromptProfile.getJsonProfile(isNew, priorConverstation, contextData, userPromptRequest); // Load the array from the default file
    
    terminal.debug(terminal.colors.green, "Prompt Sent to Grok", terminal.colors.reset, JSON.stringify(messages, null, 4));
  
    //grok-2-latest
    //grok-2-vision-1212

    return {
        model: chosenModel == openai ? "gpt-4o-mini" : "grok-2-vision-1212",
        messages: messages, // Use the loaded variable here
    
    };
}

// Create the request object for the API
export async function createApiRequest(userPromptRequest, priorConverstation, isNew, isShort, contextData, context, filePath, specialty, processingRootNode) {
    //TODO implement abstraction for profiles before this explodes in complexity
    let messages = [];
    if (isShort) {
        GlobalPromptProfile.short = true;
    }
    if (specialty) {
        GlobalPromptProfile.setSpecialty(specialty);
    }

    if(userPromptRequest.codeReviewMode){
        GlobalPromptProfile = CodeReviewPromptProfile;
    }else if(userPromptRequest.treeMode){
        GlobalPromptProfile = TreeModeProfile;
    }else{
        GlobalPromptProfile = PromptProfile;
    }

  
    PromptProfile.isLogging = false;
    
    //This can be encapulated into getProfile method
    if(userPromptRequest.treeMode){
        if(processingRootNode){
            messages = GlobalPromptProfile.getDefaultProfile(isNew, priorConverstation, contextData, userPromptRequest.dynamicPrompt); // Load the array from the default file
        }else{
            //TYPESCRIPT ERROR HERE but i'm not using ts haha
            messages = GlobalPromptProfile.getBranchProfile(isNew, priorConverstation, contextData, userPromptRequest.dynamicPrompt); // Load the array from the default file
        }
    }else{
   
        //load filepaths from userPromptRequest.filePath
        let fileContent = await ProfileFileLoader.loadFileContent(userPromptRequest.filePath);
        terminal.debug(terminal.colors.green, "fileContent", terminal.colors.reset, fileContent);

        if(fileContent.length > 0){
            GlobalPromptProfile.addFile(fileContent);
        }
  
        messages = GlobalPromptProfile.getDefaultProfile(isNew, priorConverstation, contextData, userPromptRequest.dynamicPrompt); // Load the array from the default file
    }
    

        
    var response_format;
    if(userPromptRequest.indexLookupMode){
        response_format = zodResponseFormat(GlobalPromptProfile.getIndexLookupSchema(), "response");
    }else{
        response_format = zodResponseFormat(GlobalPromptProfile.getSchema(), "response");
    }
//     response_format: zodResponseFormat(responseSchema, "responseSchema")
    //grok-2-latest
    //grok-2-vision-1212
    terminal.debug(terminal.colors.green, "Prompt Sent to Grok", terminal.colors.reset, JSON.stringify(messages, null, 4));
    //TODO: each model should have a different max completion tokens
    let maxCompletionTokens = 125000;
    if(userPromptRequest.isShort){
        maxCompletionTokens = 300;
    }
    //grok-4-0709
    return {
        model: chosenModel == openai ? "gpt-4.5-preview" : "grok-4-0709",
        max_tokens: maxCompletionTokens,
        messages: messages, // Use the loaded variable here
        response_format: response_format
    };
}

//TODO move this into the class which contains the schema
export async function parseCompletionForResponseAndMetaResponse(completion){

    console.log(completion.choices[0].message)
    let jsonResponse = JSON.parse(completion.choices[0].message.content);
    let metaResponse = jsonResponse.keywords;
    let markdownContent = jsonResponse.markdown;
    return {metaResponse, markdownContent};

}

export function htmlReplaceTemplateValues(cssForMarkdown, html_string, sanitizedMarkdownContent, priorContextId, responseId){

    html_string = html_string.replaceAll("@PARENT_ID@", GlobalPromptProfile.ParentId) //NICE THIS IS STATIC AND AVAIALBLE!
    .replaceAll("REPLACEME", sanitizedMarkdownContent)
    .replaceAll("@CSS_GOES_HERE@", cssForMarkdown)
    .replaceAll("@PREVIOUS_ID@", priorContextId.substring(0, tagLength)) //TODO is this substring redundant?
    .replaceAll("@DIRECTORY@", "") // absolute path to the directory not compatible with firefox
    .replaceAll("@CURRENT_ID@", responseId);

    //TODO return can be done without variable assignment if no other processing is needed.
    return html_string;
}

//TODO i should open up threads for CHILD WRITES
export async function  saveHtmlResponse(userPromptRequest, markdownContent, priorContextId) {

    // Save HTML response for parent of treaMode of default prompt
    let indexHtml = await fs.readFile('./grok/html_templates/template.html', "utf8");

    let cssForMarkdown = await fs.readFile('./grok/html_templates/highlightStyle.css', "utf8");
    
    //// Add KaTeX CSS
    //let katexCss = await fs.readFile('./grok/html_templates/katex.css', "utf8");
    //cssForMarkdown = cssForMarkdown + "\n" + katexCss;

    markdownContent =  markdownContent + "\n\nResponseID:" + userPromptRequest.dynamicResponseId ;
    let sanitizedMarkdownContent = await preprocessResponse(markdownContent);

    indexHtml = htmlReplaceTemplateValues(cssForMarkdown, indexHtml, sanitizedMarkdownContent, priorContextId, userPromptRequest.dynamicResponseId);

    //TODO obfucated info here. Branch logic more clearly for each mode
    //If it is treeMode then the children are created here.
    if(userPromptRequest.childDirectory != ""){
        let childHtml = await fs.readFile('./grok/html_templates/child_template.html', "utf8");
        
        childHtml = htmlReplaceTemplateValues(childHtml, sanitizedMarkdownContent, priorContextId, userPromptRequest.dynamicResponseId);
        //TODO ponder the trade offs of using HTML here instead of the markdown.
        GlobalPromptProfile.addChildReadme(sanitizedMarkdownContent);
    
        terminal.log(terminal.colors.red,terminal.logDivider, terminal.colors.reset);
        terminal.log("childDirectory being written to", userPromptRequest.childDirectory);
        terminal.log(terminal.colors.red,terminal.logDivider, terminal. colors.reset );
        await fs.writeFile(
            `${userPromptRequest.baseContextDirectory}history/responses/${userPromptRequest.rootResponseId}/tree/${userPromptRequest.childDirectory}/${userPromptRequest.dynamicResponseId}.html`,
            childHtml,
            "utf8"
        );
    }else{
        //IF this is treemode but no child is written log that the parent summary page was written
        if(userPromptRequest.treeMode){
            terminal.log(terminal.colors.red,terminal.logDivider, terminal.colors.reset);
            terminal.log("this is a parent write:", userPromptRequest.rootResponseId);
            terminal.log(terminal.colors.red,terminal.logDivider, terminal.colors.reset );
        }
    }//if child directory and not a parent do nothing
       
    // Obfucscated logic to create the directory structure before writing the file, do so before methd call.
    // Create the directory structure before writing the file
    //this only has to be called once if called elsewhere
    await fs.mkdir(`${userPromptRequest.baseContextDirectory}history/responses/${userPromptRequest.rootResponseId}/html`, { recursive: true });

    //UPDATE writer class path here
    await fs.writeFile(   
        `${userPromptRequest.baseContextDirectory}history/responses/${userPromptRequest.rootResponseId}/html/${userPromptRequest.dynamicResponseId}.html`,
            indexHtml,
            "utf8"
    );
    
    await fs.writeFile(
        `${userPromptRequest.baseContextDirectory}currentChat/currentChat.html`,
        indexHtml,
        "utf8"
    );

}

export async function saveMarkdownResponse(userPromptRequest, markdownContent) {
    terminal.debug(terminal.logDivider);
    terminal.debug(terminal.colors.green, "markdownContent\n",terminal.colors.reset, markdownContent);
    terminal.debug(terminal.logDivider);
    await fs.mkdir(`${userPromptRequest.baseContextDirectory}history/responses/${userPromptRequest.rootResponseId}/markdown`, { recursive: true });
    // Save markdown response
    await fs.writeFile(
        `${userPromptRequest.baseContextDirectory}history/responses/${userPromptRequest.rootResponseId}/markdown/${userPromptRequest.dynamicResponseId}.md`,
        markdownContent,
        "utf8"
    );

    await fs.writeFile(
        `${userPromptRequest.baseContextDirectory}currentChat/currentChat.md`,
        markdownContent,
        "utf8"
    );
    
}

//Extracts json from AST and writes to file, replace markdown with links to json.
export async function writeJsonToFile(response, fileName){
    fileName = path.basename(fileName, path.extname(fileName));
    terminal.log("writing json to files");
    let jsonList = [];
    response = await unified()
        .use(remarkParse) // Parse markdown
        .use(() => (tree) => {
            // Process code blocks
            visit(tree, 'code', (node, index, parent) => {
                if(node.lang == "json"){
                    jsonList.push(node.value);
                    
                    // Create a link node to replace the code block
                    const linkPath = "./" + fileName + (jsonList.length) + ".json";
                    const linkText = "table " + (jsonList.length);
                    
                    // Create a new paragraph node with a link inside
                    const linkNode = {
                        type: 'paragraph',
                        children: [{
                            type: 'link',
                            url: linkPath,
                            children: [{
                                type: 'text',
                                value: linkText
                            }]
                        }]
                    };
                    
                    // Replace the code block with the link
                    parent.children.splice(index, 1, linkNode);
                }
            });
            
            return tree;
        })
        .use(remarkStringify) // Add this compiler
        .process(response)
        .then(result => String(result));

    //make a dir for the json
    await fs.mkdir("./grok/json_output/"+fileName, { recursive: true });

    //write the json to files
    for(let i = 0; i < jsonList.length; i++){   
        await fs.writeFile("./grok/json_output/"+fileName+"/"+fileName+i+".json", jsonList[i]);
    }

    //write the markdown to a file
    await fs.writeFile("./grok/json_output/"+fileName+"/"+fileName +".md", response);
    // Return the processed response if needed
    return response;
}

export async function preprocessResponse(response) {   
    // Use hljs.listLanguages() instead
    let supportedLanguages = hljs.listLanguages();
 
    // Simplified preprocessing without unified-latex
    response = await unified()
        .use(remarkParse) // Parse markdown
        .use(() => (tree) => { //Filter out unsupported languages
            visit(tree, 'code', (node) => {
                if (node.lang && !supportedLanguages.includes(node.lang)) {
                    node.lang = "text";
                }
            });
            return tree;
        })
        .use(remarkMath) // Parse math expressions
        .use(remarkHighlight) // Apply syntax highlighting to code blocks
        .use(remarkRehype, { allowDangerousHtml: true }) // Convert MDAST to HAST with HTML allowed
        .use(rehypeKatex, { 
            throwOnError: false, // Don't throw on parse errors
            output: 'htmlAndMathml', // Output both HTML and MathML
            strict: false // Be more lenient with LaTeX syntax
        })
        .use(rehypeStringify, { allowDangerousHtml: true }) // Stringify HAST to HTML with HTML allowed
        .process(response)
        .then(result => String(result));
    
    while(response.charAt(0) != "<" && response.length > 0){
        response = response.substring(1);
    }

 
    return response;
}


export async function appendToContext(newContent, userPromptRequest) {

    let MAX_CONTEXT_LENGTH = userPromptRequest.depth;
    let contextData = await fs.readFile(userPromptRequest.baseContextDirectory + "context.data", "utf8");
   
  
    newContent.forEach(element => {
        contextData = contextData.replaceAll(element, "");
    });
    contextData = contextData.replaceAll(" ", "");
    contextData = contextData.replaceAll(",","");
    contextData =  newContent.join(" ") + contextData;
    contextData = contextData.replaceAll("KEYWORDS", "");
 
    //CONTEXT can be improved by having separate lists. one is composed of Headings. another is keywords.
    contextData = contextData.substring(0, MAX_CONTEXT_LENGTH);

    contextData = contextData
    .replaceAll(/\\n/g, '')
    .replaceAll(/\\/g, '')
    .replaceAll(/"/g, '')
    .replaceAll(/'/g, "")
    .replaceAll(/\n/g, '')
    .replaceAll(/` `/g, '')
    .replaceAll("[", "")
    .replaceAll("]", "");

    terminal.debug(terminal.logDivider);
    terminal.debug(terminal.colors.green, "Current Subject:",terminal.colors.reset, newContent);
    terminal.debug(terminal.logDivider);
    terminal.debug(terminal.colors.green + "Current Context[" + MAX_CONTEXT_LENGTH + "]:"+terminal.colors.reset, contextData);
    terminal.debug(terminal.logDivider);
    await fs.writeFile(userPromptRequest.baseContextDirectory + "context.data", contextData);


}

//This can be done with grokruntime for efficiency and be labeled log previos ids.  Might be the place to reduce list size from time to time.
export async function savePreviousId(responseId, userPromptRequest, contextHistoryLength){
    let userPrompt = userPromptRequest.dynamicPrompt;
    let previousIds = await fs.readFile(userPromptRequest.baseContextDirectory + "context.history", "utf8");
    let parsedPreviousIds = JSON.parse(previousIds);
    let mostRecentHistoryId = parsedPreviousIds[parsedPreviousIds.length - 1];
    parsedPreviousIds.push({id: responseId, prompt: userPrompt});
    await fs.writeFile(userPromptRequest.baseContextDirectory + "context.history", JSON.stringify(parsedPreviousIds));

    terminal.log(terminal.colors.green, "\nSwitch context to id to resume conversation", terminal.colors.reset);
    terminal.log(terminal.logDivider);
    
    let EntriesToLog = parsedPreviousIds.slice(contextHistoryLength);
    EntriesToLog.reverse();
    EntriesToLog = EntriesToLog.slice(0, 5);
    EntriesToLog.reverse();
 
    for(let i = 0; i < EntriesToLog.length && i < 5; i++){
        terminal.log(terminal.colors.green, "contextId:", terminal.colors.reset, EntriesToLog[i].id,  terminal.colors.yellow, "\n Prompt:\n",terminal.colors.reset, EntriesToLog[i].prompt);
        terminal.log(terminal.colors.yellow, "             - - - - - - - - - - - - - - - - - - - - -           ", terminal.colors.reset);
    }
    terminal.log(terminal.colors.yellow, terminal.getDividerWithMessage("PRIOR-PROMPTS"));
    return mostRecentHistoryId.id;
}

//A recursive approach should remedy this so parent is written last.
export async function saveCompletion(completion, id, baseDir = './grok/context') {
    const completionDir = join(baseDir, 'history/fullCompletion/');
    await fs.mkdir(completionDir, { recursive: true });
    await fs.writeFile(join(completionDir, `${id}.json`), JSON.stringify(completion));
}

// Main function
export async function main( ...serverArgs) {
    
//USER SET CONTEXT WITH REQUEST, OTHERWISE DEFAULTS TO STANDARD .grok/context/
    const userPromptRequest = parseCommandLineArgs(serverArgs);

    let morePrompts = true;
    let processingRootNode = userPromptRequest.treeMode;

    let imageList = [];
    let imageCount = 0;
    if(userPromptRequest.visionMode){
        //get a list of images with fs from directory releated to the prompt
        //check visionmode directory is dir or image
        try {
            let stats = await fs.stat(userPromptRequest.visionModeDirectory);
            if(stats.isDirectory()){
                imageList = await fs.readdir(userPromptRequest.visionModeDirectory);
            }else{
                imageList = [userPromptRequest.visionModeDirectory];
            }
            //TODO: check if the images are valid
            imageList = imageList.filter(image => image.endsWith(".png") || image.endsWith(".jpg") || image.endsWith(".jpeg"));
            for(let i = 0; i < imageList.length; i++){
                imageList[i] = userPromptRequest.visionModeDirectory + "/" + imageList[i];
            }
            imageCount = imageList.length;
            imageList = imageList.reverse();
        } catch (error) {
            terminal.error("Error accessing vision mode directory or file:", error);
            imageCount = 0;
        }
    }

//TODO subdivide the logic into different loops for each mode.  
    while( morePrompts == true  || imageCount > 0){
        if(imageCount > 0){
            imageCount--;
            userPromptRequest.filePath =  imageList[imageCount];
        }
 
        //If this is branching request and there are branches to process
        if( userPromptRequest.treeMode && userPromptRequest.branchIndex >= 1){
           
            //Start at last child
            userPromptRequest.currentSubject = userPromptRequest.branchList[userPromptRequest.branchIndex-1]
            userPromptRequest.dynamicPrompt =  "Tell me more about item " + userPromptRequest.branchIndex + " of this list.  Go into more detail about info you already included.: "  + userPromptRequest.branchList[userPromptRequest.branchIndex-1];
            await sleep(1000); // Replaced sleep with wait to avoid overwhelming the API.
            terminal.log(terminal.colors.green, "User Prompt", terminal.colors.reset, userPromptRequest.dynamicPrompt);
            terminal.log(terminal.colors.green, "Branch List", terminal.colors.reset, userPromptRequest.branchList);
            terminal.log(terminal.colors.green, "Branch Index", terminal.colors.reset, userPromptRequest.branchIndex);
            //TODO perhaps this should use the getter and setters...
            userPromptRequest.branchIndex--;
        }

         terminal.debug(terminal.colors.green, "User Prompt Request", terminal.colors.reset, userPromptRequest.toString());

    //TODO Load the previous propmt - there is probably a clever way to use previous id and load as much history as requested... add parent to context.history
    const priorConverstation = await getConversationContext(userPromptRequest, userPromptRequest.isNew); // Ensure context is fetched based on context
    const contextData = await fs.readFile(userPromptRequest.baseContextDirectory + "context.data", "utf8");

    let apiRequest;

    //Context is loaded for the api request
    if(userPromptRequest.visionMode){
        apiRequest = await createApiRequestForVision(userPromptRequest, priorConverstation, userPromptRequest.isNew, userPromptRequest.isShort, contextData, userPromptRequest.context, userPromptRequest.filePath, userPromptRequest.specialty, processingRootNode);
    }else{
        apiRequest = await createApiRequest(userPromptRequest, priorConverstation, userPromptRequest.isNew, userPromptRequest.isShort, contextData, userPromptRequest.context, userPromptRequest.filePath, userPromptRequest.specialty, processingRootNode);
   
    }

    //terminal.debug(terminal.colors.green, "Prompt Sent to Grok", terminal.colors.reset, JSON.stringify(apiRequest, null, 4));
  
    let completion;
    if(userPromptRequest.baseContextDirectory == "${userPromptRequest.baseContextDirectory}mockContext/"){
        completion = await fs.readFile(userPromptRequest.baseContextDirectory + "currentChat/currentChat.json")
        completion = JSON.parse(completion)
    }else{
     
        completion = await chosenModel.chat.completions.create(apiRequest);
    }
    
    await fs.writeFile(userPromptRequest.baseContextDirectory + "currentChat/currentChat.json", JSON.stringify(completion));
  

    //TODO rmove this logic into userPromptRequest as a process completion method
    if(userPromptRequest.treeMode){
        if(processingRootNode){
            userPromptRequest.rootResponseId = completion.id.substring(0, tagLength);
            userPromptRequest.dynamicResponseId = completion.id.substring(0, tagLength);
        }else{
            userPromptRequest.dynamicResponseId = completion.id.substring(0, tagLength);
        }
    }else{ //singular prompt
        userPromptRequest.rootResponseId = completion.id.substring(0, tagLength);
        userPromptRequest.dynamicResponseId = completion.id.substring(0, tagLength);
    }


    let metaResponse;
    let markdownContent;

    if(userPromptRequest.indexLookupMode){
        metaResponse = ["index", "index", "index"];
        markdownContent = completion.choices[0].message.content;
    }else if(userPromptRequest.visionMode){
        metaResponse = ["image", "image", "image"];
        markdownContent = completion.choices[0].message.content;
    }else{
        const result = await parseCompletionForResponseAndMetaResponse(completion);
        console.log(result.metaResponse, result.markdownContent);
        metaResponse = result.metaResponse;
        markdownContent = result.markdownContent;
    }
    terminal.debug(terminal.getDividerWithMessage("RESPONSE-AND-META-RESPONSE"));
    terminal.debug(terminal.colors.green, "metaResponse", terminal.colors.reset, metaResponse);
    terminal.debug(terminal.colors.green, "markdownContent", terminal.colors.reset, markdownContent);
    terminal.debug(terminal.logDivider);

    if(userPromptRequest.treeMode  && processingRootNode){
        userPromptRequest.parentReadme = markdownContent;
    }

    terminal.log(terminal.colors.red,  "USERPROMPT", userPromptRequest)
    //STEP 3 now update the context for future prompts
    //let priorContextId = await saveContextFiles(userPromptRequest.dynamicResponseId, metaResponse, completion, markdownContent, userPromptRequest.depth);
    await appendToContext(metaResponse, userPromptRequest);

    //TODO examine the best depth ratio for length. this should round down but be atleast 1
    let contextHistoryLength = userPromptRequest.depth/500;
    //TODO THIS CAN BE ENCAPSULATED BY PASSING THE PROMPT REQUET
    let priorContextId = await savePreviousId(userPromptRequest.dynamicResponseId, userPromptRequest, contextHistoryLength);
    

    await saveCompletion(completion, userPromptRequest.dynamicResponseId);
    await saveHtmlResponse(userPromptRequest, markdownContent, priorContextId);
    await saveMarkdownResponse(userPromptRequest, markdownContent);
    if(userPromptRequest.visionMode){
    await writeJsonToFile(markdownContent, userPromptRequest.filePath);
    }
    //consider whether or not to append response ID
    //ALL makr and html should be saved to the disk now

   //TODO name a bool for this   userPromptRequest.treeMode && !processingRootNode   
    terminal.log( "current contextId",   terminal.colors.blue, userPromptRequest.dynamicResponseId, terminal.colors.reset);
    terminal.log(terminal.colors.purple, "\nfile used:", terminal.colors.reset, userPromptRequest.filePath?userPromptRequest.filePath:"none");
    userPromptRequest.treeMode && !processingRootNode && terminal.log(terminal.colors.green, "Tree-"+ terminal.colors.reset, GlobalPromptProfile.ParentId, terminal.colors.green, "\nbranches"+terminal.colors.green+"["+userPromptRequest.branchList.length+"]-", userPromptRequest.branchList);
    terminal.log(terminal.logDivider);

    //TODO harded code price function should be dynamic for differnt models.
    const INPUT_TOKEN_PRICE = 200/1000000;
    const OUTPUT_TOKEN_PRICE = 1000/1000000;
    const totalPrice = (completion.usage.prompt_tokens * INPUT_TOKEN_PRICE) + (completion.usage.completion_tokens * OUTPUT_TOKEN_PRICE);
    terminal.log(terminal.colors.green, "Tokens used", terminal.colors.yellow, "prompt:", terminal.colors.reset, completion.usage.prompt_tokens, terminal.colors.yellow, "completion:", terminal.colors.reset, completion.usage.completion_tokens, terminal.colors.reset);
    terminal.log(terminal.colors.green, "Aprox price of prompt", terminal.colors.yellow, totalPrice, terminal.colors.reset, "cents ");
    //TODO ^^^in tree mode these values can be stored and added up
    terminal.log(terminal.logDivider);
 
    if(terminal.debugLogger == false){
        terminal.log(terminal.colors.green, "\nResponse", terminal.colors.reset, markdownContent);
    }

    let terminalState = userPromptRequest.browserMode?"":"terminalMode";
    await fs.writeFile("./shell_helpers/.grokRuntime", `depthState=${userPromptRequest.depth}\nnewState=""\ncontextState=${userPromptRequest.dynamicResponseId}\nterminalMode=${terminalState}`);
    
    //This is the first loop of treeMode
    if(processingRootNode){
        processingRootNode = false;
        userPromptRequest.branchList = metaResponse;

        //userPromptRequest.branchList = userPromptRequest.branchList.map(subject => removeWhiteSpaceAndEnsureAlphabet(subject));
        userPromptRequest.branchIndex = userPromptRequest.branchList.length;
        GlobalPromptProfile.setParentId(userPromptRequest.dynamicResponseId);
        GlobalPromptProfile.setParentReadme(markdownContent);
        userPromptRequest.childDirectory = GlobalPromptProfile.ParentId+"_children";
        await fs.mkdir(userPromptRequest.baseContextDirectory + "history/responses/"+userPromptRequest.rootResponseId+"/tree/"+userPromptRequest.childDirectory+"/html", { recursive: true });
        
        terminal.log(terminal.colors.yellow, "\nParent ID", terminal.colors.reset, GlobalPromptProfile.ParentId);
        terminal.log(terminal.colors.blue, "Branches", terminal.colors.reset, userPromptRequest.branchList);
    }
   
    //TODO Optizmize this conditionallater. I might put at the top of the main while loop to flex... this is more readable though.
    //This index change is to fanagle the initial branch prompt to work.
    if(processingRootNode || userPromptRequest.branchIndex > 0){
        terminal.log(terminal.colors.blue, "parentId", terminal.colors.reset, GlobalPromptProfile.ParentId);
        terminal.log(terminal.colors.yellow, "branchId", terminal.colors.reset, userPromptRequest.dynamicResponseId);
        morePrompts = true;
    }else{
        terminal.log(terminal.colors.green, terminal.logDivider, terminal.colors.reset);
        terminal.log(terminal.colors.yellow, terminal.getDividerWithMessage("READ-RESPONSE-ABOVE"));
        terminal.log(terminal.colors.green, terminal.logDivider, terminal.colors.reset);
        terminal.log("\n\n\n\n\n");
        terminal.log(terminal.colors.green,terminal.logDivider, terminal.colors.reset);
     
        morePrompts = false;

        //We are currently handling the bundling of tree mode children.
        if(userPromptRequest.treeMode){
        try{
                //TODO fix the saveHtmlResponse function to handle differnt typeps
                //REMOVE THIS AND RETURN STATIC FULL PAGE
                //await fs.copyFile(userPromptRequest.baseContextDirectory + "currentChat/currentChat.html", userPromptRequest.baseContextDirectory + "history/responses/"+userPromptRequest.rootResponseId+"/"+userPromptRequest.childDirectory+"/"+userPromptRequest.dynamicResponseId+".html");
            
            let processedChildReadmes = [];
            //Is this a reference or a copy? 
            let allChildReadmes = GlobalPromptProfile.childReadme;
            let subjectList = GlobalPromptProfile.subjectList;
            terminal.debug(terminal.logDivider);
            terminal.debug(terminal.colors.green, "allChildReadmes", terminal.colors.reset, allChildReadmes);
            terminal.debug("------------Entering child loop------------");
            for(let i = 0; i < allChildReadmes.length; i++){
                let childReadme = allChildReadmes[i];
                // let childReadmeId = childReadme.contextId;   WOULD THIS BE USEFUL TO HAVE? perhaps in a more robust system.
                let childReadmeSubject =  userPromptRequest.branchList[i];
                
              
                terminal.debug(terminal.colors.green, "childReadme: ", terminal.colors.reset, childReadme);
                terminal.debug(terminal.colors.green, "childReadmeSubject: ", terminal.colors.reset, childReadmeSubject);
                terminal.debug(terminal.colors.green, "index: ", terminal.colors.reset, i);
                let parsedReadme = childReadme;
                //Chance to add attribute is here for hidden or visible                                   //function unneeded but concept is interesting
                let childReadmeHtml = `<div title="${childReadmeSubject}" id="childContent${i+1}" onclick="setVisibileChild('childContent${i+1}')" hidden=true>${parsedReadme}</div>`;
                
                terminal.debug(terminal.colors.green, "childReadmeHtml", terminal.colors.reset, childReadmeHtml);
                //TODO examine ordering
                processedChildReadmes.push(childReadmeHtml);
                //YIKES THIS NEEDS DOM MANIPULATION. No wonder react is so popular.
                //onclick set parent to hidden and child to visible.
                //this will need a fuzzy search in parent headings to properly link the child to the parent.
            }

            terminal.debug(terminal.colors.green, "allChildReadmes", terminal.colors.reset, allChildReadmes);
            terminal.debug("------------Exiting child loop------------");
            terminal.debug(terminal.logDivider);
            //combine all the child divs into a nice incomprehensiible html string
            terminal.debug(terminal.colors.green, "processedChildReadmes", terminal.colors.reset, processedChildReadmes);
            let childDivs = processedChildReadmes.join("");
            terminal.debug(terminal.colors.green, "childDivsCombined", terminal.colors.reset, childDivs);
            
            terminal.debug(terminal.colors.green, "childDivs", terminal.colors.reset, childDivs);
            let parentHtml = await fs.readFile("./grok/html_templates/parent_template.html", "utf8");

            //DO all the replacements
            //this could be a function. css is loaded extra times this way
            let css = await fs.readFile("./grok/html_templates/highlightStyle.css", "utf8");
            parentHtml = parentHtml.replace("@CSS_GOES_HERE@", css);
            let processedParentReadme = await preprocessResponse(GlobalPromptProfile.ParentReadme);
        
            parentHtml = parentHtml.replace("REPLACEME", processedParentReadme);
            parentHtml = parentHtml.replace("@REPLACEWITHCHILDRENDIVS@", childDivs);
            parentHtml = parentHtml.replace("@CURRENT_ID@", GlobalPromptProfile.ParentId);
            //parentHtml = parentHtml.replace("@PREVIOUS_ID@", dynamicResponseId);

            //TODO this gets the id history to work properly for the server, but the userPrompt is not correctly mapped
            savePreviousId(GlobalPromptProfile.ParentId, userPromptRequest, contextHistoryLength);
            //I could name this more intelligently.
            //I want to explorer a recursive approach for deeper trees. How do i template a child that is a parent and a child
            //I am pretty sure a recursive approach seting the context to the child repsonse ID and the recursively prompts from there
            await fs.writeFile(userPromptRequest.baseContextDirectory + "history/responses/"+userPromptRequest.rootResponseId+"/tree/index.html", parentHtml);
            await fs.writeFile(userPromptRequest.baseContextDirectory + "currentChat/currentChat.html", parentHtml);
            //replace @REPLACEWITHCHILDRENDIVS@ with the childDivs string
            


            /* Thinking time
               * Obtain all of the READMEs for the tree and branches.
               * For each child branch create an <div id="childContent1...5"> 
               * Parent html will have one nav "link".  each list item will be a "link" to the div
               * The links will execute a javascript function which toggles hidden attribute for all over divs.
               * The backend server will use marked to add the styled markdown to each conent div
               * 
               * 
            */
            }catch(error){
                terminal.error("Error copying the currentChat.html file:", error);
            }
        }


    if(userPromptRequest.browserMode){
        let htmlDir =   "currentChat/currentChat.html";
        if(!userPromptRequest.treeMode){
            htmlDir = "history/responses/"+userPromptRequest.rootResponseId+"/html/"+userPromptRequest.dynamicResponseId+".html";
        }else{
            //open the last child soon to be MONO_HTML_FILE  this can be wapped for currentchathtml too
            htmlDir = "history/responses/"+userPromptRequest.rootResponseId+"/tree/index.html";
        }
   
    const openCommand = os.platform() === 'win32' ? 'start' : 'open';
    exec(`${openCommand} ${userPromptRequest.baseContextDirectory}${htmlDir}`, (err) => {
        if (err) {
                terminal.error("Error opening the HTML file:", err);
            }
        });
    }
       
    }

    }
    return userPromptRequest.rootResponseId;
}

// Only run main() when this file is directly executed, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(terminal.error);
  }