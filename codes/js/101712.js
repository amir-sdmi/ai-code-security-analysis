import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import axios from "axios";
import sendOpenAIDataToDBAndFetch from "./sendOpenAIDataToDB.js";
import express from "express";
import bodyParser from "body-parser";
import featuredList from "../../../data/featuredList.js";
import bankList from "../../../data/bankList.js";
import bondsList from "../../../data/bondsList.js";
import usgovList from "../../../data/usgovList.js";
import fedList from "../../../data/fedList.js";
import macroList from "../../../data/macroList.js";
import {eiaDataOilTags, eiaDataNGTags, eiaDataPetroleumTags, fredDataList, eiaDataOilList, eiaDataPetroleumList, cftcFinancialDerivativesList, cftcList, bokList } from "../../../data/dataList.js";
import chinaList from "../../../data/chinaList.js";
const router = express.Router();

router.use(bodyParser.json());

dotenv.config();

let openaimodel;

router.post("/openaiRequest", async (req, res) => {
  try {
    const urlendpoint = req.body.urlendpoint;
   
    let [chartName, chatgptPromptInputs] = await getPromptRelatedInfoFromDataListJS(urlendpoint);
  
    let dataFromDB = await checkAndAddOpenAIResponseToDB(urlendpoint, chartName, chatgptPromptInputs);
    res.send(dataFromDB);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error while fetching openAI response" }); // Sending a general server error message
  }
});

async function checkAndAddOpenAIResponseToDB(urlendpoint, chartName, chatgptPromptInputs) {
  
  try {
    let promptQuestion = `Imagine yourself as an financial expert. You are trying to make a chart named ${chartName}. This chart contains following graphs : ${chatgptPromptInputs}. Explain how they are related and interpreted in stock market and economy in general, in a concise but professional manner. Use less than 500 tokens.`;
    let dataFromDB = await sendOpenAIDataToDBAndFetch(promptQuestion, urlendpoint);
    return dataFromDB;
  } catch (error) {
    console.error("Error in checkAndAddOpenAIResponseToDB: ", error);
    throw error; // Re-throw the error if you want calling functions to be able to catch it as well
  }
}

export async function getDataFromOpenAI(promptQuestion) {
  const configuration = new Configuration({
    organization: process.env.openaiOrganizationID,
    apiKey: process.env.openaiAPIKey,
  });

  const openai = new OpenAIApi(configuration);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: promptQuestion }],
  });
  // openaimodel = response.model;

  return response.data.choices[0].message.content;
}

async function getPromptRelatedInfoFromDataListJS(urlendpoint){

    // gather all info before if-else
    let list = [];
    list.push(featuredList.map(item => item.urlendpoint));
    list.push(bankList.map(item => item.urlendpoint));
    list.push(bondsList.map(item => item.urlendpoint));
    list.push(macroList.map(item => item.urlendpoint));
    list.push(usgovList.map(item => item.urlendpoint));
    list.push(fedList.map(item => item.urlendpoint));
    list.push(chinaList.map(item => item.urlendpoint));

    // let info = list[String(urlendpoint)];
    // ratio, data, oil ? 

   
    let hashMap = {};

    // Combine all lists into a hash map for quick lookups
    [...featuredList, ...bankList, ...bondsList, ...macroList, ...usgovList, ...fedList, ...chinaList].forEach(item => {
        hashMap[item.urlendpoint] = item;
    });
    
    // Look up info in constant time

    let chartDetails = hashMap[urlendpoint];
    let chartName = chartDetails.title;
    let use = chartDetails.use;

    //if use == compare, fetch realnames from dataList.js or other files
    //if it is other cases, such as custom charts, use chatgptPrompts in the object.
    let chatgptPromptInputs;
    if(use != "compare" || use != "enumerate"){
      chatgptPromptInputs = chartDetails.chatgptPromptInput;
    } else {
      chatgptPromptInputs = [];

      let tags = chartDetails.tag;
      let sources = chartDetails.source;
      
      for(let num in sources){
        if(sources[num] == "FRED"){
          // console.log(fredDataList);
          for (const [key, val] of Object.entries(fredDataList)) {
            if (val === tags[num]) {
              chatgptPromptInputs.push(key);
            } 
          }
         
        } else if(sources[num] == "EIA"){
          //eiaDataTags is a list, eiaDataList is kv pair object.
          let eiaDataTags = [...eiaDataOilTags, ...eiaDataPetroleumTags, ...eiaDataNGTags];
          let eiaDataList = {...eiaDataOilList, ...eiaDataPetroleumList, ...eiaDataOilList};
          let eiaTagIndex = eiaDataTags.findInex(item => item == tags[num]);
       
          if (eiaTagIndex !== -1) {

           let tag = (Object.keys(eiaDataList[eiaTagIndex]));
            chatgptPromptInputs.push(tag);
            
          } else {
            chatgptPromptInputs.push("No match found in EIA dataset");
          }

        }else if(sources[num] == "CFTC"){

          //cftc tags used are exactly same as names, so no need to filter out
          // let cftcTags = [...cftcList, ...cftcFinancialDerivativesList];

          chatgptPromptInputs.push(tags[num])
          break;

        }else if(sources[num] == "BakerHughes"){


        }else if(sources[num] == "NDL"){

        }else if(sources[num] == "BOK"){
          let bokTag = tags[num];

          const [categoryTag, valueTag] = bokTag.split("_");

          let bokDataObjects = Object.entries(bokList);

          for(let dataObject in bokDataObjects){
            if(dataObject.info.code == categoryTag){
          
              let key = findKeyByValue(dataObject, valueTag);

              let nameUsedInGPT = dataObject.info.name + ", " + key;
              console.log(nameUsedInGPT);
              chatgptPromptInputs.push(nameUsedInGPT)
              break;
            }
          }
          chatgptPromptInputs.push("No match found in Bank of Korea Dataset");
        } else if(sources[num] == "custom"){
          //this case may be modified because it is a colleciton of custom charts that vary depending on how charts are drawn

          chatgptPromptInputs.push(tags[num])


        }
      }
    }
    
    return [chartName, chatgptPromptInputs];
}

function findKeyByValue(obj, value) {
  for (const [key, val] of Object.entries(obj)) {
    if (val === value) {
      return key;
    }
  }
  return null; // Return null if value is not found
}
export default { getDataFromOpenAI, checkAndAddOpenAIResponseToDB, router };
