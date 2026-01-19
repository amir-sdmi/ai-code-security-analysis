//Import dependencies
import axios from "axios";
import fs from "fs";
import { JSDOM } from "jsdom";
import { Document } from "langchain/document";
import {
  summaryChain,
  combineSummaryChain,
  allArticlesSummaryChain,
  inferringChain,
  splitter,
} from "./llm-requirements.js";

//Change this constant to set how many articles to extract (starting from the latest)
//i.e. setting it to 2 extracts the 2 latest articles from the RSS feed
const MAX_ARTICLES = 3;

//Get individual article URLS from RSS Feed link
async function getArticleLinks(url) {
  const docContainer = [];
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  const elementContainer = document.querySelectorAll("a.title_link.bluelink");
  let i = 0;
  while (docContainer.length != MAX_ARTICLES) {
    const article_url = elementContainer[i].getAttribute("href");
    //Exclude Google News and Reddit articles
    if (!(article_url.includes("google") || article_url.includes("reddit"))) {
      const docOutput = new Document({
        pageContent: "",
        metadata: {
          source: article_url,
          title: "",
          entities: "",
          relevant: "",
        },
      });
      docContainer.push(docOutput);
    }
    i++;
  }
  return docContainer;
}

//Extract the article content from the URLs (article body, title)
async function getArticleContent(doc) {
  let fullArticle = "";
  const response = await axios.get(doc.metadata.source);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  const articleContent = document.querySelectorAll("p");
  const raw_title = document.querySelector("title").textContent;
  articleContent.forEach((para) => {
    fullArticle += para.textContent;
  });
  doc.pageContent = fullArticle.replace(/\n/g, "");
  doc.metadata.title = raw_title.replace(/\n/g, "");
  return doc;
}

//Update CSV database. This replaces all existing content in the current CSV file
function writeToCSV(docContainer, directory, summary) {
  const rows = docContainer.map((item) => [
    item.metadata.title,
    item.metadata.source,
    item.metadata.entities,
    item.metadata.relevant,
    item.pageContent,
  ]);
  let csvContent = "";
  rows.forEach((row) => {
    csvContent += row.join(";;") + "\n";
  });
  csvContent += summary;
  fs.writeFileSync(directory, csvContent, "utf8");
  console.log("CSV file has been written successfully.");
}

//Read summarized content from CSV database
export function readFromCSV(directory) {
  const rows = [];
  const data = fs.readFileSync(directory, "utf8");
  const lines = data.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    const row = lines[i].split(";;");
    rows.push(row);
  }
  const docContainer = [];
  rows.forEach((item) => {
    const doc = new Document({
      pageContent: item[4],
      metadata: {
        source: item[1],
        title: item[0],
        entities: item[2],
        relevant: item[3],
      },
    });
    docContainer.push(doc);
  });
  const summary = lines[lines.length - 1];
  return [docContainer, summary];
}

//Call ChatGPT API (for single article)
async function callChatGPT(doc, category) {
  //Split the document into chunks
  const split_docs = await splitter.splitDocuments([doc]);
  //Concurrently summarise every chunk with ChatGPT
  const res = await Promise.all(
    split_docs.map(async (item) => {
      return summaryChain.call({ input: item.pageContent });
    })
  );
  //Consolidate all summarised chunks into one paragraph
  const summary = await combineSummaryChain.call({
    input: res.map((item) => item.text),
    title: doc.metadata.title,
  });
  doc.pageContent = summary.text.replace(/\n/g, "");
  //Use summarised text to perform inference with ChatGPT
  const data = await inferringChain.call({
    input: doc.pageContent,
    category: category,
  });
  const object = JSON.parse(data.text.replace(/\n/g, ""));
  doc.metadata.entities = object.entities;
  doc.metadata.relevant = object.relevant;
  return doc;
}

//Provide an overall summary of all articles in the feed
async function summariseAllArticles(docContainer) {
  const contents = docContainer.map((item) => item.pageContent);
  const data = await allArticlesSummaryChain.call({ input: contents });
  return data.text.replace(/\n/g, "");
}

//Driver function to extract and save RSS Feed articles to CSV
export async function extractDocuments(url, directories, category) {
  let docContainer = await getArticleLinks(url);
  docContainer = await Promise.all(
    docContainer.map(async (item) => {
      return getArticleContent(item);
    })
  );
  writeToCSV(docContainer, directories[0], "");
  docContainer = await Promise.all(
    docContainer.map(async (item) => {
      return callChatGPT(item, category);
    })
  );
  const summary = await summariseAllArticles(docContainer);
  writeToCSV(docContainer, directories[1], summary);
}

//Driver function to handle individual articles
export async function handleIndivArticle(url) {
  let doc = new Document({
    pageContent: "",
    metadata: {
      source: url,
      title: "",
      entities: "",
    },
  });
  doc = await getArticleContent(doc);
  doc = await callChatGPT(doc);
  return doc;
}
