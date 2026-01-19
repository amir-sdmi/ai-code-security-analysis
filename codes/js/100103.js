// all code below is written by ChatGPT
// generate-images.js
const fs   = require('fs');
const path = require('path');

const imgDir     = path.join(__dirname, 'Img');
const indexPath  = path.join(__dirname, 'index.html');
const allFiles   = fs.readdirSync(imgDir).filter(f => f.toLowerCase().endsWith('.jpg'));

// build <img> tags (change size/classes as you like)
const imgsHTML = allFiles
  .map(f => `  <img src="Img/${f}" alt="${f.replace(/\.jpg$/i,'')}" class="img"/>`)
  .join('\n');

// read index.html, replace placeholder
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('<!-- IMAGES_GO_HERE -->', imgsHTML);
fs.writeFileSync(indexPath, html, 'utf8');

console.log(`✅ Inserted ${allFiles.length} images into index.html`);
