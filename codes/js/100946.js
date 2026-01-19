// sketch.js - purpose and description here
// Author: Brendan Wang
// Date: 2/5/2024

// Some functions were written by ChatGPT
// ------------ Controls ------------
// Mouse Click --------- Cycle Filter

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

let video;
let gridSize = 10;
let letters = "BRENDAN";
let letterSizes = [];
let currentFilterIndex = 0;
let filters = [
  { name: "Original", apply: (r, g, b, brightnessValue) => color(r, g, b) },
  { name: "Grayscale", apply: (r, g, b, brightnessValue) => color(brightnessValue) },
  { name: "Inverted", apply: (r, g, b, brightnessValue) => color(255 - r, 255 - g, 255 - b) },
  { name: "Red Tint", apply: (r, g, b, brightnessValue) => color(r * 2, g, b) },
  { name: "Blue Tint", apply: (r, g, b, brightnessValue) => color(r, g, b * 2) },
  { name: "Green Tint", apply: (r, g, b, brightnessValue) => color(r, g * 2, b) },
  { name: "Rainbow", apply: (r, g, b, brightnessValue) => color(random(255), random(255), random(255)) },
  { name: "Random Color", apply: (r, g, b, brightnessValue) => color(random(255), random(255), random(255)) },
  { name: "Neon", apply: (r, g, b, brightnessValue) => color(map(brightnessValue, 0, 255, 0, 255), 255, map(brightnessValue, 0, 255, 255, 0)) }
];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  textSize(gridSize);

  // Generate random sizes for each letter
  for (let i = 0; i < letters.length; i++) {
    letterSizes[i] = random(8, 16); // Random size between 8 and 16
  }
}

function draw() {
  background(30); // Darker background
  video.loadPixels();

  textStyle(BOLD); // Set text style to bold

  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      let loc = (x + y * width) * 4;
      let r = video.pixels[loc];
      let g = video.pixels[loc + 1];
      let b = video.pixels[loc + 2];
      let brightnessValue = brightness(r, g, b);
      let index = int(map(brightnessValue, 0, 255, 0, letters.length));

      let textColor = filters[currentFilterIndex].apply(r, g, b, brightnessValue);

      // Add animation: subtle movement
      let posX = x + random(-1, 1);
      let posY = y + random(-1, 1);
      let size = letterSizes[index];
      textSize(size);
      fill(textColor);
      textAlign(CENTER, CENTER);
      text(letters[index], posX, posY);
    }
  }
}

function mouseClicked() {
  // Cycle through filters on mouse click
  currentFilterIndex = (currentFilterIndex + 1) % filters.length;
}
