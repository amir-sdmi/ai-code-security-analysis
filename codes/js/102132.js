function drawShip(offsetY) {
  let x = 225;
  let y = offsetY - 165;

  push();
  //signal at top
  strokeWeight(5);
  stroke(255, 255, 255);
  line(x + 100, y + 210, x + 100, y + 190);

  strokeWeight(2.5);
  stroke(255, 255, 255);
  fill(250, 250, 250);
  ellipse(x + 100, y + 190, 15);

  //main body
  strokeWeight(0);

  fill(201, 176, 217);
  ellipse(x + 100, y + 360, 150, 200);

  // left body shading
  fill(221, 176, 220);
  ellipse(x + 47, y + 360, 30, 85);

  //top triangle
  fill(154, 114, 196);
  triangle(x + 40, y + 300, x + 160, y + 300, x + 100, y + 210);
  //light shading
  fill(170, 140, 196);
  triangle(x + 40, y + 300, x + 60, y + 300, x + 100, y + 210);
  //dark shading
  fill(140, 100, 186);
  triangle(x + 138, y + 300, x + 160, y + 300, x + 100, y + 210);

  //wings
  fill(180, 150, 196);
  triangle(x + 0, y + 370, x + 25, y + 360, x + 33, y + 315);

  fill(130, 90, 186);
  triangle(x + 200, y + 370, x + 175, y + 360, x + 167, y + 315);

  //windows
  strokeWeight(4);
  stroke(255, 255, 255);
  fill(168, 208, 230);
  ellipse(x + 100, y + 300, 35);

  fill(168, 208, 230);
  ellipse(x + 100, y + 355, 50);

  fill(168, 208, 230);
  ellipse(x + 100, y + 410, 35);

  //bottom
  strokeWeight(0);
  fill(154, 114, 196);
  rect(x + 55, y + 440, 90, 20);
  //light shading
  fill(170, 140, 196);
  rect(x + 55, y + 440, 20, 20);
  //dark shading
  fill(130, 90, 186);
  rect(x + 125, y + 440, 20, 20);

  fill(201, 176, 217);

  //feet
  strokeWeight(5);
  stroke(255, 255, 255);
  line(x + 55, y + 440, x + 25, y + 490);
  line(x + 145, y + 440, x + 175, y + 490);

  fill(250, 250, 250);
  ellipse(x + 25, y + 490, 15);

  fill(250, 250, 250);
  ellipse(x + 175, y + 490, 15);
  pop();
}

// ground
function drawGround() {
  let x = 0;
  let y = -165;

  push();
  strokeWeight(0);
  fill(155, 155, 155);
  rect(x - 225, y + 1085, 875, 35);
  pop();
}

function drawMountains(offsetX) {
  let x = 0;
  let y = -90;
  push();
  //mountains
  strokeWeight(0);
  fill(150, 100, 150);
  triangle(
    x - 100 - offsetX,
    y + 1025,
    x + 30 - offsetX,
    y + 880,
    x + 160 - offsetX,
    y + 1025
  );

  fill(150, 130, 150);
  triangle(
    x + 20 - offsetX,
    y + 1025,
    x + 110 - offsetX,
    y + 930,
    x + 200 - offsetX,
    y + 1025
  );

  fill(150, 100, 150);
  triangle(
    x + 800 + offsetX,
    y + 1025,
    x + 630 + offsetX,
    y + 900,
    x + 500 + offsetX,
    y + 1025
  );

  fill(150, 130, 150);
  triangle(
    x + 690 + offsetX,
    y + 1025,
    x + 570 + offsetX,
    y + 920,
    x + 450 + offsetX,
    y + 1025
  );
  pop();
}

function drawPlanets(offsetY) {
  let x = 0;
  let y = offsetY - 165;
  //moon
  push();
  strokeWeight(0);
  fill(255, 255, 255);
  ellipse(x + 130, y + 400, 100);

  fill(0, 0, 30);
  ellipse(x + 110, y + 390, 95);
  //pink planet
  fill(210, 140, 200);
  ellipse(x + 500, y + 600, 70);
  //blue planet
  fill(100, 100, 200);
  ellipse(x + 200, y + 700, 100);
  pop();
}

function drawFire(offsetY) {
  let x = 0;
  let y = offsetY - 165;
  //fire
  push();
  strokeWeight(0);
  fill(255, 150, 90);
  ellipse(x + 325, y + 500, 90);
  triangle(x + 370, y + 505, x + 330, y + 530, x + 355, y + 570);
  triangle(x + 370, y + 505, x + 295, y + 530, x + 325, y + 590);
  triangle(x + 320, y + 505, x + 280, y + 505, x + 300, y + 570);
  //yellow part
  fill(255, 200, 90);
  ellipse(x + 325, y + 500, 60);
  triangle(x + 355, y + 500, x + 335, y + 510, x + 353, y + 550);
  triangle(x + 295, y + 500, x + 315, y + 510, x + 300, y + 550);
  triangle(x + 350, y + 500, x + 300, y + 510, x + 325, y + 570);

  pop();
}

function drawFuel(offsetX) {
  let x = 20 + offsetX;
  //fuelbar
  push();
  strokeWeight(8);
  stroke(255, 150, 90);
  fill(255, 200, 90);
  rect(515, 55, x - 20, 15);
  pop();
}

const MASS = 6.5;
const GRAVITY = 9.81;
const WEIGHT = MASS * GRAVITY;
const ACCELERATION = 10;
const FORCE = WEIGHT * ACCELERATION;
const THRUST_FORCE = 1000;

const STATUS_TITLE_START = "PLAY";
const STATUS_SUBTITLE_START = "Press SPACE to start\nHold UP to thrust";
const STATUS_TITLE_GAME_OVER = "GAME OVER";
const STATUS_SUBTITLE_GAME_OVER = "Press SPACE to restart";
const STATUS_TITLE_WON = "YOU WON";
const STATUS_SUBTITLE_WON = "Press SPACE to play again";

let planetsY = 0;
let mountainsX = 0;

let shipPosition = 0;
let shipVelocity = 0;
let previousTime = 0;
let isShipFrozen = true;
let isGameOver = false;
let statusTitle = STATUS_TITLE_START;
let statusSubtitle = STATUS_SUBTITLE_START;
let fuel = 100;

function doShipGravity() {
  // (A bit of research with ChatGPT about velocity)

  // Calculate the time since the last update
  let currentTime = millis();
  let deltaTime = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  // Thrust the ship up
  if (keyIsDown(UP_ARROW) && fuel > 0) {
    shipVelocity -= THRUST_FORCE * deltaTime;
    if (fuel > 0) {
      fuel -= 1;
    }
  }

  // Apply the force from the gravity
  shipVelocity += FORCE * deltaTime;
  shipPosition += shipVelocity * deltaTime;
}

function triggerStartGame() {
  // Prepare the ship for a new game
  shipPosition = 0;
  shipVelocity = 0;
  // Reset the timer
  previousTime = millis();
  fuel = 100;

  isGameOver = false;

  if (keyIsDown(32)) {
    isShipFrozen = false;
  }

  // Game start text
  statusTitle = STATUS_TITLE_START;
  statusSubtitle = STATUS_SUBTITLE_START;
}

function triggerGameWon() {
  isGameOver = true;
  isShipFrozen = true;

  if (keyIsDown(32)) {
    setTimeout(() => {
      triggerStartGame();
    }, 100);
  }

  // Game won text
  statusTitle = STATUS_TITLE_WON;
  statusSubtitle = STATUS_SUBTITLE_WON;
}

function triggerGameOver() {
  isGameOver = true;
  isShipFrozen = true;

  if (keyIsDown(32)) {
    setTimeout(() => {
      triggerStartGame();
    }, 100);
  }

  // Game over text
  statusTitle = STATUS_TITLE_GAME_OVER;
  statusSubtitle = STATUS_SUBTITLE_GAME_OVER;
}

function drawText(textContent, x, y, size, color) {
  push();
  fill(...color);
  textSize(size);
  textAlign(CENTER);
  text(textContent, x, y);
  pop();
}

function drawStatusMessage() {
  drawText(statusTitle, 325, 350, 50, [255, 150, 255]);
  drawText(statusSubtitle, 325, 385, 20, [200, 150, 255]);
}

// Canvas and framerate
function setup() {
  let canvas = createCanvas(650, 950);
  window.addEventListener("resize", () => {
    canvas.position((windowWidth - width) / 2, 0);
  });
  canvas.position((windowWidth - width) / 2, 0);
  frameRate(60);
}

// Render the game
function draw() {
  background(0, 0, 30);

  if (!isGameOver && isShipFrozen && keyIsDown(32)) {
    triggerStartGame();
  }

  // Update the ship's position and velocity
  if (!isGameOver && !isShipFrozen) doShipGravity();

  // Update the scenery based on the ship's velocity and trigger game over if the ship has reached the ground
  if (shipPosition <= 585 && !isGameOver) {
    mountainsX = shipPosition / 6;
    planetsY = shipPosition / -3;
    // If the ship is too fast when colliding with the ground, trigger game over
  } else if (shipVelocity > 180) {
    triggerGameOver();
  } else {
    triggerGameWon();
  }

  // draw the scenery and ship
  drawPlanets(planetsY);
  drawGround();
  if (keyIsDown(UP_ARROW) && fuel > 0 && !isGameOver && !isShipFrozen) {
    drawFire(shipPosition);
  }
  drawShip(shipPosition);
  drawMountains(mountainsX);
  drawFuel(fuel);

  // Draw the fuel text
  fill(255, 255, 255);
  textSize(25);
  text("Fuel", 510, 40);

  // Draw the status message
  if (isGameOver || isShipFrozen) drawStatusMessage();
}
