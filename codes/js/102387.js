// This is the Node.js Visionairy Server that is used to communicate with the Visionairy Interface.

require('dotenv').config();
const chalk = require('chalk');

// Get libraries for file system, express, and UUID
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'})); //To allow dataURL images to be sent
const uuid = require('uuid');

// Allow all orgins to access API (CORS, for development purposes)
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Setup Google Vision API
const googleCloud = require('@google-cloud/vision');
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./visionairy-vision-service-key.json"
const vision = new googleCloud.ImageAnnotatorClient();

// Setup Unsplash API
const createAPI = require('unsplash-js').createApi;
const unsplash = createAPI({
    accessKey: process.env.UNSPLASH
});

// Setup Replicate API
const Replicate = require('replicate');
process.env.REPLICATE_API_TOKEN = process.env.REPLICATE;
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Setup OpenAI API
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI
});
const openai = new OpenAIApi(configuration);




// DATA STORAGE ========================================================================================================
// =====================================================================================================================
// =====================================================================================================================




// Prompt suffix and negative prompt for replicate SD generations
const suffix = ", octane render, professional photo, 4k, studio lighting, trending on artstation, sharp focus, bokeh, stunningly beautiful, centered"
const negative = "ugly, low quality, low resolution, disfigured, duplicates, compression, cropping, cropped subject, blurry, amateur, grainy, oversaturated, weird colors, weird shapes"

// Library for keeping track of images added to the board (activeLib) and the ChatGPT keyword summary (activeKeywords)
let activeKeywords;
let activeLib = {
  "images": []
}

// Library for keeping track of images displayed on the feed (feedLib) and the ChatGPT generated queries (feedQueries)
let feedQueries;
let feedLib = {
  "images": []
}

// Placeholder query, random search is enabled by default
let currentQuery = "Rubber Duck";
let random = true;

// Counters and limits (can be adjusted to optimize API usage and rate limits)
const decay = 0.9; // Decay rate calculating ratio between board and feed actions
let activeCount = []; // Array of decaying counters for images added to the board
let feedCount = []; // Array of decaying counters for image chunks requested from Unsplash

let batch = 0; // Counter for images added to the board
const batchlimit = 3; // Number of images required to be add to the board before generating new keywords
let actionCount = 0; // Counter for all actions performed (feed / board)
const actionLimit = 3; // Number of actions required to be performed before checking ratio between board and feed actions
let chunkCount = 0; // Counter for chunks of images requested




// SERVER API ENDPOINTS ================================================================================================
// =====================================================================================================================
// =====================================================================================================================




// Reset libraries and counters on page load/refresh (for demo purposes only)
app.post('/api/reset', (req, res) => {
  console.log("Reset requested with POST on '/api/reset'");
  activeKeywords = undefined;
  feedCount = [];
  activeCount = [];
  activeLib = {
    "images": []
  }
  feedQueries = undefined;
  feedLib = {
    "images": []
  }
  currentQuery = "Rubber Duck";
  random = true;
  batch = 0;
  chunkCount = 0;
  actionCount = 0;
  res.status(200)
  console.log("Server reset successful!")
});


// Manual search by user, resets actionCount to make sure the search direction cannot change right away
app.get('/api/search/:query', (req, res) => {
  query = req.params.query;
  actionCount = 0;
  console.log("Image search requested with GET on '/api/search'");
  currentQuery = query;
  random = false;

  // Get new chunk of images from Unsplash
  feed(query, 15, 1)
    .then(feedChunk => {
      if (feedChunk != undefined) {
        res.status(200).json(feedChunk);
        console.log("Images sent to client");
      } else {
        res.status(500).send("An error occurred while searching Unsplash");
        console.error("An error occurred:", error.message);
      }
  });
  
  queryBalance(feedCount); //Update and decay counters
});


// Get new chunk of images from Unsplash when the user scrolls to the bottom of the feed
app.get('/api/feed', (req, res) => {
  chunkCount++;
  console.log("Image chunk requested with GET on '/api/feed'");

  // Get new chunk of images from Unsplash
  feed(query, 15, 1)
    .then(feedChunk => {
      if (feedChunk != undefined) {
        res.status(200).json(feedChunk);
        console.log("Images sent to client");
      } else {
        res.status(500).send("An error occurred while searching Unsplash");
        console.error("An error occurred:", error.message);
      }
  });

  // Update and decay counters
  actionCount++;
  queryBalance(feedCount);
});


// Process an image added to the board, generates keywords and image caption
app.post('/api/board/:id', (req, res) => {
  console.log("Add image to board requested with POST on '/api/board'");

  // Existing image data is retrieved from the feedLib
  const id = req.params.id;
  const url = feedLib.images.find(image => image.id === id).url;
  const author = feedLib.images.find(image => image.id === id).author;
  const username = feedLib.images.find(image => image.id === id).username;
  const download = feedLib.images.find(image => image.id === id).download;

  // New JSON object is created for image on the board with empty caption and labels
  const json = {
    "id": id,
    "url": url,
    "author": author,
    "username": username,
    "labels": undefined,
    "caption": undefined,
    "x": undefined,
    "y": undefined // x and y are supported serverside (for storage), but not yet implemented in the client
  }

  // Add image to active library with empty caption and labels, update and decay counters
  activeLib.images.push(json);
  batch++;
  actionCount++;
  queryBalance(activeCount);

  // Trigger download endpoint for Unsplash image (required for production level Unsplash API)
  if (download != undefined) {
    unsplash.photos.trackDownload({
      downloadLocation: download
    });
  }

  // Use BLIP-2 and Google Vision to generate caption and labels for new image
  console.log("Generating caption and labels for '" + id + "'");
  const blipPromise = blip(url, "question", "context", true);
  const labelPromise = label(url);

  // Wait for both promises to resolve before updating image data
  Promise.all([blipPromise, labelPromise]).then(([caption, labels]) => {
    
    // Add caption and labels to image data
    const image = activeLib.images.find(image => image.id === id);
    if (image) {
      image.caption = caption;
      image.labels = labels;
      console.log("Caption and labels generated for '" + id + "'\n");
    }

    // Check if a new keyword libaray needs to be generated by ChatGPT
    // This is why we use the promise above, to make sure that the ChatGPT analysis is not performed on empty image objects
    if (batch >= batchlimit) {
      batch = 0;
      console.log(chalk.bold("Generating new keywords..."));
      const analysis = keywordAnalysis().then(keywords => {
        if (keywords != undefined) {
          res.status(200).json(keywords);
          console.log("Updated keyword library sent to client");
        } else { res.status(500).send("Image was added to board, but new keywords could not be generated"); }
      });
    
    // If no new keyword library is generated, we take the top 3 labels from the last 5 images as 'relevant' keywords
    // This is much faster than the ChatGPT analysis, spares ChatGPT data rates, but still provides the user with feedback
    } else {
      const lastItems = activeLib.images.slice(-5);
      const imageLabels = lastItems.map(img => img.labels);
      const relevantLabels = [];
      imageLabels.forEach(labels => {
        if (labels && labels.length > 0) {
          const slice = labels.slice(0, 3);
          relevantLabels.push(...slice); // Dots are to make sure the elements are added individually
        }
      });
      const cleanLabels = relevantLabels.map(label => label ? label.replace(/\s*\(\d+\.\d+\)$/, '') : '');

      // Create a new keyword library object
      let keywords = {
        "relevant": cleanLabels,
        "new": [],
        "nudge": []
      }

      // Use the 'new' and 'nudge' keywords from the previous keyword library
      if (activeKeywords != undefined) {
        keywords.new = activeKeywords.new;
        keywords.nudge = activeKeywords.nudge;
      }

      res.status(200).json(keywords);
    }
  });
});


// Delete image from board and active library (not implemented in client yet)
app.delete('/api/board/:id', (req, res) => {
  const id = req.params.id;
  const image = activeLib.images.find(image => image.id === id);
  console.log("Remove image to board requested with DELETE on '/api/board'")
  
  // Check if requested image exists in active library, delete if so
  if (image) {
    activeLib.images.splice(activeLib.images.indexOf(image), 1);
    res.status(200).send("Image deleted");
    console.log("Image '" + id + "' deleted from board");
  } else {
    res.status(404).send("Image not found");
    console.log("Image '" + id + "' could not be found for deletion");
  }
});


// Edit image with SD, based on specified method
app.post('/api/edit', (req, res) => {
  const method = req.body.method;
  const prompt = req.body.prompt;
  const url = req.body.url; // Data URL from HTML canvas
  console.log("Image edit requested with POST on '/api/edit'");

  // Use Replicate to edit image and handle potential errors
  console.log("Editing image using '" + method + "' method and prompt \"" + prompt + "\"...");
  edit(prompt, url, method).then(output => {
    if (output != undefined) {
      res.status(200).json(output);
      console.log("New Replicate image sent to client");
    } else {
      res.status(500).send("Image could not be edited");
    }
  });
});


// Ask questions about images using BLIP-2
app.post('/api/ask/:id', (req, res) => {
  const id = req.params.id;
  const question = req.body.question;
  const context = req.body.context;
  const url = activeLib.images.find(image => image.id === id).url; // Get URL based on ID
  console.log("Image question asked with GET on '/api/ask'");

  console.log("Asking question \"" + question + "\" about image '" + id + "'...");
  blip(url, question, context, false).then(answer => {
    if (answer != undefined) {
      res.status(200).json(answer);
      console.log("BLIP Answer sent to client");
    } else {
      res.status(500).send("Question could not be answered");
    }
  });
});


app.listen(3000);
console.log("Server is running on port 3000.");




// EXTERNAL API FUNCTIONS ==============================================================================================
// =====================================================================================================================
// =====================================================================================================================




// Search unsplash using search query, or at random when random = true
async function feed(query, numOut, page) {
  let images = [];

  try {
    if (random == true) {
      console.log("Searching Unsplash at random...");
      const reply = await unsplash.photos.getRandom({count: numOut, query: "minimal product design"});
      images = reply.response;
    } else if (random == false) {
      console.log("Searching Unsplash using: \"" + query + "\"...");
      const reply = await unsplash.search.getPhotos({query: query, page: page, perPage: numOut});
      const total = reply.response.total;
      const pages = reply.response.total_pages;
      images = reply.response.results;
    }
  } catch (error) {
    console.log("An error occurred while searching Unsplash:", error);
    return undefined;
  }

  // Chunk used as reply for client
  let feedChunk = [];

  // Add each image to the chunk as JSON object
  for (const image of images) {
    const id = uuid.v1(); // Provide custom ID
    const url = image.urls.raw + "&width=512&height=512&fit=crop&crop=edge"; // Crop to 512x512 using edge detection
    const author = image.user.name;
    const username = image.user.username;
    const download = image.links.download_location;

    // JSON for each new image
    const json = {
      "id": id,
      "url": url,
      "author": author,
      "username": username,
      "download": download
    }

    // Add image to chunk for client and to active library
    feedChunk.push(json);
    feedLib.images.push(json);
  }

  return feedChunk;
}


// Generate image caption based on URL using BLIP-2
async function blip(url, question, context, captioning) {
  let answer = "";

  // For images added to the board, captioning is used. For the ask feature, a specific question and context (previous Q&As) is used.
  try {
    if (captioning == true) {
      answer = await replicate.run(
        "andreasjansson/blip-2:4b32258c42e9efd4288bb9910bc532a69727f9acd26aa08e175713a0a857a608",
        {input: {image: url, use_nucleus_sampling: true, caption: true}}
      );
    } else {
      answer = await replicate.run(
        "andreasjansson/blip-2:4b32258c42e9efd4288bb9910bc532a69727f9acd26aa08e175713a0a857a608",
        {input: {image: url, question: question, context: context, use_nucleus_sampling: true, caption: false}}
      );
    }
  } catch (error) {
    console.log(chalk.red("An error occurred while accessing Replicate:", error.message) + "\n");
    return undefined;
  }
  return answer;
}


// Generate image labels based on image URL using Google Vision API
async function label(url) {
  const [responseL] = await vision.labelDetection(url);
  const labeldata = responseL.labelAnnotations;
  const labels = [];

  // Adjust formatting of labels to contain both description and score with two decimals
  for (const data of labeldata) {
    const label = data.description + " (" + data.score.toFixed(2) + ")";
    labels.push(label);
  }

  return labels;
}


// Edit image using Replicate, based on provided method, prompt, and image URL
async function edit(prompt, url, method) {
  //Replicate simply returns a list of URLs as strings
  output = "";
  try {
    if (method == "instruct") {
      output = await replicate.run(
        "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
        {input: {prompt: prompt, num_outputs: 1, image: url}}
      );
    
    } else if (method == "sketch") {
      output = await replicate.run(
        "mbentley124/openjourney-img2img:c49a9422a0d4303e6b8a8d2cf35d4d1b1fd49d32b946f6d5c74b78886b7e5dc3",
        // "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        {input: {image: url, prompt: prompt + suffix, negative_prompt: negative, strength: 0.5}}
      );

    // Model that contains all controlnet methods (instruct and sketch use separate model above)
    } else {
      output = await replicate.run(
        "rossjillian/controlnet:d55b9f2dcfb156089686b8f767776d5b61b007187a4e1e611881818098100fbb",
        {input: {prompt: prompt + suffix, image: url, structure: method, n_prompt: negative, a_prompt: ""}}
      );
    }
  } catch (error) {
    console.log(chalk.red("An error occurred while accessing Replicate:", error.message) + "\n");
    return undefined;
  }

  // New JSON object for replicate image is created so it can be stored in libraries
  const id = uuid.v1();
  const json = {
    "id": id,
    "url": output[0],
    "author": undefined,
    "username": undefined,
    "download": undefined
  }

  console.log("New Replicate image generated with ID: " + id);

  // Image is saved in the feed library so that when 'save' is pressed under the canvas, the same API endpoint can be used to store it to the board
  // The Replicate images are not actually displayed in the feed
  feedLib.images.push(json);
  return json;
}




// KEYWORD ANALYSIS ====================================================================================================
// =====================================================================================================================
// =====================================================================================================================




async function keywordAnalysis() {
  // Get ChatGPT prompt from text file
  const analysisPrompt = fs.readFileSync('./KeywordAnalysisPrompt.txt', 'utf8');

  // From the active library, we extract only the image captions and keywords, and store them in a JSON object
  const descriptions = {
    images: activeLib.images.map(img => ({
      caption: img.caption,
      labels: img.labels
    }))
  };

  // We combine the ChatGPT prompt with the image data, but only use the last 10 images (for data rates and performance)
  txtIn = analysisPrompt + JSON.stringify(descriptions.images.slice(-5));
  console.log(txtIn);


  try {
    const analysis = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": txtIn}],
        temperature: 0
    });

    // ChatGPT returns the keywords as a string, but it is formatted as JSON, therefore we can parse it as JSON data
    newKeywords = analysis.data.choices[0].message.content;
    activeKeywords = JSON.parse(newKeywords);
    if (activeKeywords.relevant && activeKeywords.new && activeKeywords.nudge) { //Check if ChatGPT used correct JSON syntax
      console.log(activeKeywords);
      return activeKeywords;
    } else {
      return undefined;
    }
  } catch (error) {
    console.log(chalk.red("An error occurred while generating keywords:", error.message) + "\n");
    return undefined;
  }
}


async function queryGeneration() {
  // Get ChatGPT prompt from text file
  const queryPrompt = fs.readFileSync('./QueryGenerationPrompt.txt', 'utf8');

  // We combine the ChatGPT prompt with the current keyword library
  txtIn = queryPrompt + JSON.stringify(activeKeywords);

  try {
    const queries = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": txtIn}],
        temperature: 0
    });

    // ChatGPT returns the keywords as a string, but it is formatted as JSON, therefore we can parse it as JSON data
    newQueries = queries.data.choices[0].message.content;
    feedQueries = JSON.parse(newQueries);
    if (feedQueries.queries && feedQueries.queries[0]) { //Check if ChatGPT used correct JSON syntax
      return feedQueries;
    } else {
      return undefined;
    }
  } catch (error) {
    console.log(chalk.red("An error occurred while generating queries:", error.message) + "\n");
    return undefined;
  }
}

async function queryBalance (countArray) {
  // Decay all values of selected counter array by preset amount
  for (let i = 0; i < countArray.length; i++) {
    countArray[i] *= decay;
  }

  // Add  '1' (new action) to the start of selected array
  countArray.unshift(1);

  // Add up all values in feed and board counter arrays to get total weight and calculate ratio
  let feedWeight = feedCount.reduce((a, b) => a + b, 0);
  let activeWeight = activeCount.reduce((a, b) => a + b, 0);
  let ratio = activeWeight / feedWeight;

  // Check the whether the ratio goes over the thresholds
  if (activeLib.images.length > 0 && actionCount >= actionLimit) { // Queries cannot be generated if there are no images in the active library
    actionCount = 0;
    if ((ratio < 1 || ratio > 4) && activeKeywords != undefined) { // Thresholds are not tested, but based on an estimation
      console.log(chalk.bold("Generating new queries..."));
      
      //Generate queries
      const query = queryGeneration().then(queries => {
        if (queries != undefined && queries.queries[0].query) {
          currentQuery = queries.queries[0].query;
          random = false;
          console.log("Search query set to \"" + currentQuery + "\"");
        } else { console.log("New query could not be generated"); }
      });
    }
  }

  // Log data about libraries to monitor server behavior
  console.log("activeWeight (" + chalk.bold(activeWeight) + ") / feedWeight (" + chalk.bold(feedWeight) + ") = ratio (" + ratio + ")");
  console.log("Total feed chunks: " + chalk.bold(feedCount.length) + ", total active images: " + chalk.bold(activeCount.length) + ", actionCount: " + chalk.bold(actionCount) + "\n");
}