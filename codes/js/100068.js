// Using ChatGPT.
// Import OpenAI package.
const { OpenAI } = require('openai');
// Include API key.
// To access the .env file.
require('dotenv').config();
const sharp = require('sharp');

async function convertImageTo64X64(rawIcon, skillName) {
    let imgBuffer = Buffer.from(rawIcon, 'base64');
    const data = await sharp(imgBuffer).resize({ width: 50, height: 50 }).toBuffer();
    const resultBase64 = `data:image/png;base64,${data.toString('base64')}`

    return resultBase64;
}


module.exports = { convertImageTo64X64 }