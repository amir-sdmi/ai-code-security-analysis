let zoom = 10; 
let maxZoom = 50; 
let lastMouseX = 0; 
let lastMouseY = 0;
let colorValue = 0; 
let rectWidth = zoom; 

function setup() {
  createCanvas(1000, 1000);
  rectMode(CENTER);
  noStroke();
  lastMouseX = mouseX; 
  lastMouseY = mouseY; 
}

function draw() {
  background(255);
  if (mouseY < lastMouseY) {
    zoom = min(zoom + 0.5, maxZoom);
    colorValue = min(colorValue + 1, 255); 
  } else if (mouseY > lastMouseY) {
    zoom = max(zoom - 0.5, 10);
    colorValue = max(colorValue - 1, 0); 
  }
  if (mouseX > lastMouseX) {
    rectWidth = max(rectWidth - 1, 1);
  } else if (mouseX < lastMouseX) {
    rectWidth = min(rectWidth + 1, zoom);
  }
  for (let i = 0; i < width; i += zoom) { 
    for (let j = 0; j < height; j += zoom) {
      let c = color(colorValue, 0, 255 - colorValue); 
      fill(c);
      let xOffset = random(-2, 2);
      let yOffset = random(-2, 2);
      rect(i + xOffset, j + yOffset, rectWidth, zoom);
    }
  }
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

//Attribution: This program is partially written by ChatGPT4.
