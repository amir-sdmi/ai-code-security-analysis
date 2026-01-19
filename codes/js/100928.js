// sketch.js - purpose and description here
// Author: Brendan Wang
// Date: 1/22/2024

// Some functions were written by ChatGPT

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

let pregnantWomanEmojis = ['🤰', '🤰🏼', '🤰🏽', '🤰🏾', '🤰🏿'];
let rotationAngle = 0;

function setup() {
  createCanvas(300, 300);
  noStroke(); // Remove stroke for a cleaner look
}

function draw() {
  // Dynamic background color based on mouse movement
  let dynamicColor = color(map(mouseX, 0, width, 0, 255), map(mouseY, 0, height, 0, 255), 200);
  background(dynamicColor);

  // Draw fixed set of pregnant woman emojis on top of the dynamic background
  drawPregnantWomanEmojis();
}

function drawPregnantWomanEmojis() {
  let emojiSize = 70;
  let spacingX = 60; // Adjust horizontal spacing
  let spacingY = 70; // Adjust vertical spacing

  // Calculate the starting point to center the array
  let startX = width / 12;
  let startY = height / 6;

  // Draw the fixed set of pregnant woman emojis
  // Written by ChatGPT
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      let emojiIndex = (i * 3 + j) % pregnantWomanEmojis.length;
      drawRotatingEmojis(startX + i * spacingX, startY + j * spacingY, emojiSize, pregnantWomanEmojis[emojiIndex]);
    }
  }
}

function drawRotatingEmojis(x, y, size, emoji) {
  fill(0);
  textSize(36);
  textAlign(CENTER, CENTER);
  push();
  translate(x + size / 2, y + size / 2);
  rotate(rotationAngle);
  scale(1.5, 1.5);
  text(emoji, 0, 0);
  pop();
}

function keyPressed() {
  if (key === ' ') {
    // Pregnant woman emojis change when spacebar is pressed
    // Basically just refreshes the draw function
    drawPregnantWomanEmojis();
  } else if (key === 's') {
    // Save canvas as PNG when 's' is pressed
    saveCanvas('CLBArtwork', 'png');
  }
}

function mousePressed() {
  // Rotate the emojis when mouse is pressed
  rotationAngle += radians(45);
  drawPregnantWomanEmojis();
}