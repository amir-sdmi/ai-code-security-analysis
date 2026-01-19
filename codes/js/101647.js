// sketch.js - Interactive 3D Solar System
// Author: Brendan Wang
// Date: 2/12/2024


// Some functions were written by ChatGPT
// --------------- Controls ---------------
// Left Mouse Click --------- Rotate
// Right Mouse Click -------- Pan
// Scroll Wheel ------------- Zoom In/Out


// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

let sunRadius = 200;
let planetDistances = [500, 650, 800, 950, 1500, 1800, 1900, 2050];
let planetSizes = [10, 15, 20, 17, 50, 40, 30, 30];
let planetOrbitSpeeds = [0.02, 0.0175, 0.015, 0.025, 0.01, 0.005, 0.002, 0.001];
let planetAngles = [0, 0, 0, 0, 0, 0, 0, 0];
let planetColors = [
  [175, 170, 169],   // Mercury
  [236, 200, 120],   // Venus
  [0, 130, 255],   // Earth
  [247, 112, 43], // Mars
  [255, 175, 116], // Jupiter
  [255, 214, 145], // Saturn
  [167, 247, 255], // Uranus
  [0, 88, 216]  // Neptune
];

// Array to store explosion particles
let explosions = [];

// Array to store planet trails
let planetTrails = [];

function setup() {
  createCanvas(1920, 1080, WEBGL); // Set canvas size to 1920x1080
  // Start with one explosion
  createExplosion();

  // Initialize planet trails
  for (let i = 0; i < planetDistances.length; i++) {
    planetTrails.push([]);
  }
}

function draw() {
  // Create space background
  drawSpaceBackground();

  // Adjust the view angle to avoid stretching
  let fov = PI / 3; // 60 degrees
  let cameraZ = height / 2.0 / tan(fov / 2.0);
  perspective(fov, width / height, cameraZ / 10.0, cameraZ * 10.0);

  orbitControl();

  // Draw sun
  fill(212, 57, 15);
  noStroke();
  sphere(sunRadius);

  // Update and draw explosions
  updateAndDrawExplosions();

  // Draw planets and their trails
  for (let i = 0; i < planetDistances.length; i++) {
    let distance = planetDistances[i];
    let planetSize = planetSizes[i];
    let orbitSpeed = planetOrbitSpeeds[i];
    let angle = planetAngles[i];
    let planetColor = planetColors[i]; // Get color for current planet

    // Update planet angle
    angle += orbitSpeed;
    planetAngles[i] = angle;

    // Calculate planet position
    let x = distance * cos(angle);
    let z = distance * sin(angle);

    // Draw planet
    push();
    translate(x, 0, z);
    fill(planetColor[0], planetColor[1], planetColor[2]); // Use RGB values from planetColor array
    noStroke();
    sphere(planetSize);

    // Add point to the trail
    let trailPoint = createVector(x, 0, z);
    planetTrails[i].push(trailPoint);

    // Draw trail
    beginShape();
    noFill();
    strokeWeight(2);
    stroke(planetColor[0], planetColor[1], planetColor[2], 100); // Use RGB values with transparency
    for (let p of planetTrails[i]) {
      let trailX = p.x - x; // Calculate position relative to the planet
      let trailZ = p.z - z;
      vertex(trailX, 0, trailZ);
    }
    endShape();
    
    // Limit the length of the trail
    if (planetTrails[i].length > 100) {
      planetTrails[i].shift();
    }
    
    pop();
  }
}

function updateAndDrawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let explosion = explosions[i];

    // Draw explosion particles
    push();
    translate(explosion.position.x, explosion.position.y, explosion.position.z);
    fill(255, random(100, 255), 0); // Random color for explosion
    noStroke();
    sphere(5); // Adjust size as needed
    pop();

    // Decrease explosion lifespan
    explosion.lifespan--;

    // Remove explosion if it has expired
    if (explosion.lifespan <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Add new explosions occasionally
  if (random(1) < 0.01) {
    createExplosion();
  }
}

function createExplosion() {
  let explosion = {
    position: createVector(random(-width, width), random(-height, height), random(-width, width)),
    lifespan: random(50, 150)
  };
  explosions.push(explosion);
}

function drawSpaceBackground() {
  // Set background to black
  background(0);

  // Draw stars
  randomSeed(4); // Ensure consistent randomness
  for (let i = 0; i < 200; i++) { // Reduced number of stars
    let x = random(-3 * width, 3 * width); // Increase the range for x-coordinate
    let y = random(-3 * height, 3 * height); // Increase the range for y-coordinate
    let z = random(-3 * width, 3 * width); // Increase the range for z-coordinate
    let size = random(6, 12);
    push(); // Save the current transformation matrix
    translate(x, y, z); // Translate to the star's position
    fill(255);
    noStroke();
    ellipse(0, 0, size, size); // Draw 2D ellipse representing the star
    pop(); // Restore the transformation matrix
  }
}