const fs = require('fs');
const path = require('path');
// const { insertProject, insertFolder, insertOrUpdateFile, insertAnalysis, getFilesByProject } = require('./db_management');
const { extractComponentsFromFile } = require('./extract_components');
const { makeAPICall } = require('./call_api');

const supportedExtensions = [".c", ".py", ".js", ".ts"];

// This function was mostly generated using ChatGPT
function getRelevantFiles(directory) {
    let codeFiles = [];
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
        const fullPath = path.join(directory, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            // want to ignore node_modules folder
            // in future, expand to allow user to choose which folders/files to ignore
            if (file === 'node_modules') {
                return;
            }
            // if directory, get the files inside
            codeFiles = codeFiles.concat(getRelevantFiles(fullPath));
        } else {
            // check if it is a code file
            supportedExtensions.forEach((extension) => {
                if (file.endsWith(extension)) {
                    codeFiles.push(fullPath);
                }
            })
        }
    })

    return codeFiles;
}

async function analyzeFiles(files, client, APItoCall, projectId) {
    // key is filepath, value is an array of analyses returned from ChatGPT
    const fileAnalyses = {};
    // const fileIds = await getFilesByProject(projectId);
    for (const file of files) {
        // const fileId = fileIds.filter((fileModel) => fileModel.name === file)[0].id;
        const analysis = await analyzeFile(file, client, APItoCall, null);
        fileAnalyses[file] = analysis;
    }
    return fileAnalyses;
}

async function analyzeFile(file, client, APItoCall, fileId) {
    const analysis = [];
    const components = extractComponentsFromFile(file);
    for (const component of components) {
        let prompt = "You are a code reviewer. Identify whether the following code is inefficient, too long, or overly complex, and suggest changes. If no changes are necessary, respond with 'satisfactory'. ";
        prompt = prompt + `Here is the code: ${component.code}`;
        const result = await makeAPICall(APItoCall, prompt, client);
        if (result.trim().toLowerCase() !== "satisfactory") {
            analysis.push(result);
        }
        // hopefully will help avoid rate limits 
        await delay(1000);
    }
    // await insertAnalysis(fileId, components, JSON.stringify(analysis));
    return analysis;

}

// used to try and prevent hitting API rate limits 
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFilesAndAnalyze(directory, client) {
    const files = getRelevantFiles(directory);
    console.log("got relevant files")
    const report = await analyzeFiles(files, client, "cohere");
    console.log("got analysis")
    return report;
}

module.exports = {
    getFilesAndAnalyze,
    getRelevantFiles,
    analyzeFiles
};
