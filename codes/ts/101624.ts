#!/usr/bin/env node
'use strict';

import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as assert from 'assert';
import * as EE from 'events';
import * as strm from "stream";
import axios from 'axios';
import * as readlineSync from 'readline-sync';
import * as dotenv from 'dotenv';
import ignore from 'ignore'; // npm package to parse .gitignore patterns

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TOKENS = 200; // Limit for response tokens
const MAX_CONTEXT_TOKENS = 15000; // Set a limit below model's max context length

if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in the environment variables.");
  process.exit(1);
}

interface FileContentMap {
  [filePath: string]: string;
}

let projectFilesContent: FileContentMap = {};

// Function to load .gitignore patterns
function loadGitignorePatterns(): any {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return ignore(); // Return an empty ignore instance if .gitignore does not exist
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  return ignore().add(gitignoreContent);
}

const ig = loadGitignorePatterns(); // Load ignore patterns once

// Function to recursively read all files in a directory, excluding node_modules and .gitignore patterns
function readFilesRecursively(directory: string): FileContentMap {
  const files = fs.readdirSync(directory);
  let fileContents: FileContentMap = {};

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const relativePath = path.relative(process.cwd(), filePath); // Get relative path for ignore checking

    // Skip files matching .gitignore patterns or if they are in node_modules
    if (ig.ignores(relativePath) || file.includes('node_modules')) {
      console.log(`Skipping ignored file or directory: ${relativePath}`);
      return;
    }

    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        console.log(`Entering directory: ${filePath}`);
        Object.assign(fileContents, readFilesRecursively(filePath));
      } else if (stats.isFile()) {
        console.log(`Reading file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        fileContents[filePath] = content.substring(0, 100); // Limit content length further to avoid large input
      }
    } catch (err) {
      console.error(`Error reading file or directory: ${filePath}`, err);
    }
  });

  return fileContents;
}

// Function to read all files and store them in a variable
function rereadFiles(): void {
  console.log('Reading all project files...');
  projectFilesContent = readFilesRecursively(process.cwd());
  console.log('Finished reading files.');
}

// Function to calculate the number of tokens (rough estimate)
function estimateTokens(text: string): number {
  // Simple approximation: 1 token is approximately 4 characters in English
  return Math.ceil(text.length / 4);
}

// Function to interact with ChatGPT
async function askChatGPT(prompt: string): Promise<string | null> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'gpt-4o-mini' || 'gpt-3.5-turbo',  // Change to the model you're using
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_TOKENS,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {

    if (error.response) {
      console.error('Error interacting with ChatGPT:', error.response.data);
    } else if (error.request) {
      console.error('No response received from ChatGPT:', error.request);
    } else {
      console.error('Error setting up the request:', error.message);
    }

    return null;
  }
}

// Main loop to interact with the user
async function main(): Promise<void> {
  rereadFiles(); // Initial read of all files

  while (true) {
    const input = readlineSync.question('Ask a question or type "reread" to read all files again: ');

    if (input.toLowerCase() === 'reread') {
      rereadFiles();
      continue;
    }

    if (input.toLowerCase() === 'list all file names') {
      // If user wants to list file names, only return the file names without content
      const fileNames = Object.keys(projectFilesContent);
      console.log('File Names:', fileNames.join('\n'));
      continue;
    }

    // Create the prompt with truncated content
    let combinedContent = Object.entries(projectFilesContent)
      .map(([fileName, content]) => `File: ${fileName}\nContent:\n${content}...\n`)
      .join('\n');

    // Ensure combined content does not exceed maximum context tokens
    let tokenCount = estimateTokens(combinedContent);
    if (tokenCount > MAX_CONTEXT_TOKENS) {
      combinedContent = combinedContent.substring(0, MAX_CONTEXT_TOKENS * 4); // Truncate to fit within the token limit
    }

    const prompt = `You have the following files and their contents: \n\n${combinedContent} \n\nNow, answer the following question based on the project files: ${input}`;

    const answer = await askChatGPT(prompt);
    console.log('ChatGPT:', answer);
  }
}

main().catch((error) => console.error('An error occurred:', error));
