// sketch.js - purpose and description here
// Author: Brendan Wang
// Date: 1/29/2024

// Some functions were written by ChatGPT

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

let t = 0; // Time variable
let hueOffset = 0; // Initial hue offset

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100); // Set color mode to HSB with alpha
}

function draw() {
  background(255); // Set background to black

  // Draw waves
  for (let y = 0; y < height; y += 20) {
    let hue = (hueOffset + y / 2) % 360; // Gradual change in hue value
    let waveColor = color(hue, 80, 80, 50);
    
    stroke(waveColor); // Set stroke color for the wave line
    noFill(); // Set fill color to transparent
    strokeWeight(3); // Set the thickness of the lines
    
    beginShape();
    for (let x = 0; x < width; x += 10) {
      let angle = map(x, 0, width, 0, TWO_PI);
      let offset = map(y, 0, height, -50, 50);
      let amplitude = map(sin(angle + offset), -1, 1, 0, 100);
      let wave = amplitude * sin(TWO_PI * x / width + t);
      vertex(x, y + wave);
    }
    endShape();
    
    // Fill underneath wave line with translucent color
    fill(waveColor);
    beginShape();
    for (let x = 0; x < width; x += 10) {
      let angle = map(x, 0, width, 0, TWO_PI);
      let offset = map(y, 0, height, -50, 50);
      let amplitude = map(sin(angle + offset), -1, 1, 0, 100);
      let wave = amplitude * sin(TWO_PI * x / width + t);
      vertex(x, y + wave);
    }
    vertex(width, height); // Bottom right corner
    vertex(0, height); // Bottom left corner
    endShape(CLOSE);
  }
  
  // Increment time
  t += 0.02;
  // Gradually change hue offset
  hueOffset += 0.3;
}
