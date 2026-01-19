import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import fs, { copyFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, pollyClient } from '../config/awsConfig.js';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { dynamoDbClient } from '../config/awsConfig.js';

import mime from 'mime-types';
import dotenv from 'dotenv';
dotenv.config();
// Initialize GoogleGenerativeAI with your API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const DYNAMO_DB_TABLE = process.env.DYNAMO_DB_TABLE;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const processImage = async (req, res) => {
  const file = req.file;

  // Check if the image is properly loaded
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Validate the file is an image based on its MIME type
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type. Please upload a valid image (JPEG, PNG, or GIF).' });
  }

  // Read the file
  let file_bin;
  try {
    file_bin = fs.readFileSync(file.path);
    
    // Log file size and MIME type
    const fileSize = fs.statSync(file.path).size; // Get file size in bytes
    console.log(`Encoded image length: ${fileSize} bytes`);
    console.log(`MIME type: ${file.mimetype}`);
  } catch (error) {
    console.error('Error reading file:', error);
    return res.status(500).json({ message: 'Error reading uploaded file', error });
  }

  // Generate unique file name
  const fileName = `${uuidv4()}-${file.originalname}`;
  const base64Image = Buffer.from(file_bin).toString('base64');

  try {
    // Prepare the payload for Gemini API
    const payload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: file.mimetype,
              data: base64Image,
            }
          },
          {
            text: "Describe the emotions in this image."
          }
        ]
      }]
    };

    // Use Gemini API to analyze the image
    console.log('Prompting Gemini...');
    // const geminiResponse = await model.generateContent(payload);
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(response => response.json());
    console.log('Gemini response:', geminiResponse);
    console.log('Gemini response:', geminiResponse.candidates[0].content.parts[0].text);
    // Check if response is valid
    if (!geminiResponse || !geminiResponse.candidates || !geminiResponse.candidates[0]) {
      throw new Error('Invalid response from Gemini');
    }

    // Extracting the summary from the response
    const summary = geminiResponse.candidates[0].content.parts[0].text; // Corrected to the provided hierarchy
    console.log('Response from Gemini:', summary);

    // Convert the summary to speech using AWS Polly
    const pollyParams = {
      OutputFormat: 'mp3',
      Text: summary,
      VoiceId: 'Aditi',
    };

    console.log('Prompting Polly...');
    const pollyResponse = await pollyClient.send(new SynthesizeSpeechCommand(pollyParams));

    if (!pollyResponse.AudioStream) {
      throw new Error('No audio stream returned from Polly.');
    }

    // Set response headers to handle audio streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline',
      'Transfer-Encoding': 'chunked',
    });

    // Stream Polly's audio response directly to the client
    console.log('Streaming response to client');
    pollyResponse.AudioStream.pipe(res).on('error', (err) => {
      console.error('Error streaming audio:', err);
      res.status(500).send('Error streaming audio');
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image', error });
  }
};




// Function to save the image to S3 and update user information in DynamoDB
const saveImage = async (req, res) => {
  const { userId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  let file_bin;
  try {
    file_bin = fs.readFileSync(file.path);
  } catch (error) {
    console.error('Error reading file:', error);
    return res.status(500).json({ message: 'Error reading uploaded file', error });
  }

  const fileName = `${uuidv4()}-${file.originalname}`;

  // S3 upload parameters
  const s3Params = {
    Bucket: S3_BUCKET_NAME,
    Key: fileName,
    Body: file_bin,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  try {
    console.log('Uploading file to S3...');
    await s3Client.send(new PutObjectCommand(s3Params));
    const fileUrl = `https://${S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${fileName}`;
    console.log(`File uploaded to S3: ${fileUrl}`);

    // Fetch user from DynamoDB
    const getParams = {
      TableName: DYNAMO_DB_TABLE,
      Key: { userId },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(getParams));

    if (!Item) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user memories
    const memories = Item.memories || [];
    memories.push(fileUrl);

    const updateParams = {
      TableName: DYNAMO_DB_TABLE,
      Key: { userId },
      UpdateExpression: 'SET memories = :memories',
      ExpressionAttributeValues: {
        ':memories': memories,
      },
    };

    await dynamoDbClient.send(new UpdateCommand(updateParams));
    console.log(`User ${userId} updated with new memories`);

    res.status(200).json({ message: 'Image saved and user updated successfully', fileUrl });
  } catch (error) {
    console.error('Error saving image or updating user:', error);
    res.status(500).json({ message: 'Error saving image or updating user', error });
  }
};

// Function to retrieve saved images
const getImages = async (req, res) => {
  const { userId } = req.params;

  try {
    const params = {
      TableName: DYNAMO_DB_TABLE,
      Key: { userId },
    };

    const { Item } = await dynamoDbClient.send(new GetCommand(params));

    if (!Item) {
      return res.status(404).json({ message: 'User not found' });
    }

    const memories = Item.memories || [];
    res.status(200).json({ images: memories });
  } catch (error) {
    console.error('Error retrieving images:', error);
    res.status(500).json({ message: 'Error retrieving images', error });
  }
};

export { processImage, saveImage, getImages };