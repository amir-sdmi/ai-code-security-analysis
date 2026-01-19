// sketch.js - Text Video Feed with Animations
// Author: Brendan Wang
// Date: 2/19/2024


// Some functions were written by ChatGPT
// --------------- Controls ---------------
// Left Mouse Click --------- Change Color

let video;
let captureSize = 10; // Size of each capture point
let threshold = 150; // Threshold for converting video to black and white
let letters = "EXPERIMENT6GRAMMARSANDTEXT"; // Letters to display
let prevBrightness = 0; // Variable to store previous frame's brightness
let isColorMode = false; // Variable to store the current mode (black and white or color)

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width / captureSize, height / captureSize);
  video.hide(); // Hide the video feed
  textSize(12);
  textStyle(BOLD);
}

function draw() {
  background(0);
  video.loadPixels();
  let index = 0; // Initialize index counter for letters
  let totalBrightness = 0; // Variable to store total brightness of the frame
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let indexInString = index % letters.length; // Wrap around index to fit the length of the letters string
      let currentLetter = letters.charAt(indexInString); // Get current letter based on index
      let indexColor = (video.width * y + x) * 4; // Index to retrieve color from video pixels
      let r = video.pixels[indexColor];
      let g = video.pixels[indexColor + 1];
      let b = video.pixels[indexColor + 2];
      let brightnessValue = (r + g + b) / 3; // Calculate brightness
      
      if (isColorMode) {
        let textColor = color(r, g, b); // Create color object based on RGB values
        fill(textColor);
      } else {
        let textColor = map(brightnessValue, 0, 255, 0, 255); // Adjusting color range for black and white mode
        fill(textColor);
      }

      let xPos = x * captureSize;
      let yPos = y * captureSize;
      text(currentLetter, xPos, yPos);
      
      totalBrightness += brightnessValue; // Accumulate brightness value for the frame
      index++; // Move to the next letter
    }
  }
  
  // No need to calculate average brightness as we're using color
  // We'll still trigger the animation based on brightness change, but you can adjust this logic according to your needs
  let avgBrightness = totalBrightness / (video.width * video.height);
  if (abs(avgBrightness - prevBrightness) > 10) {
    animateLetters();
  }
  prevBrightness = avgBrightness;
}

// Function to animate the letters
function animateLetters() {
  let amplitude = 10000;
  let frequency = 1;
  
  for (let i = 0; i < letters.length; i++) {
    let displacementX = amplitude * sin(frequency * frameCount + i * 0.1);
    let displacementY = amplitude * cos(frequency * frameCount + i * 0.1);
    
    let xPos = (i % (width / captureSize)) * captureSize;
    let yPos = floor(i / (width / captureSize)) * captureSize;
    
    let newXPos = xPos + displacementX;
    let newYPos = yPos + displacementY;
    
    fill(255);
    text(letters.charAt(i), newXPos, newYPos);
  }
}

function mouseClicked() {
  isColorMode = !isColorMode; // Toggle between black and white and color modes
}
