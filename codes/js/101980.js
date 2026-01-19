//Comments added using chatgpt, link to chat: https://chatgpt.com/share/682f6766-7bf8-8013-bf72-4d47c4811043 

// Global variables
let canva;                     // Canvas element
let player;                    // Player object
let obstacles = [];            // Array of obstacle objects
let lilys = [];                // Array of lily pad objects
let gameState = "play";        // Current game state: play, win, or lose

let riverY = 300;              // Y position of the river
let lives = 3;                 // Number of lives player has
let score = 0;                 // Player's score

// Called once to set up the game
function setup() {
  canva = createCanvas(1000, 1000); // Create the canvas
  centerCanvas();                  // Center the canvas on the window
  startGame();                     // Initialize the game
}

// Main game loop: draws everything depending on the game state
function draw() {
  background(30); // Set background color

  if (gameState === "play") {
    drawGame();     // Run game logic and draw gameplay
  } else if (gameState === "lose") {
    loseScreen();   // Display losing screen
  } else if (gameState === "win") {
    winScreen();    // Display winning screen
  }
}

// Initializes game entities and resets state
function startGame() {
  player = new Player(500, 950); // Set player at starting position
  obstacles = [];                // Clear existing obstacles
  lilys = [];                    // Clear existing lily pads

  // Create rows of moving obstacles (e.g. cars)
  for (let i = 0; i < 3; i++) {
    let y = 700 - i * 60; // Row Y position
    for (let j = 0; j < 4; j++) {
      let x = j * 300;
      let speed = (i % 2 === 0) ? 2 : -2; // Alternate direction per row
      obstacles.push(new Obstacle(x, y, speed));
    }
  }

  // Create rows of moving lily pads
  for (let i = 0; i < 3; i++) {
    let y = riverY + 120 - i * 60;
    for (let j = 0; j < 3; j++) {
      let x = j * 350;
      let speed = (i % 2 === 0) ? 2 : -2;
      lilys.push(new Lilys(x, y, speed));
    }
  }

  gameState = "play"; // Set game state to play
}

// Core gameplay rendering and logic
function drawGame() {
  // Draw grass areas
  fill(0, 100, 0);
  rect(0, 0, width, 100);
  rect(0, 900, width, 100);

  // Draw river area
  fill(0, 0, 150);
  rect(0, riverY, width, 180);
  
  let onLily = false;

  // Update and show all lily pads
  for (let lily of lilys) {
    lily.update();
    lily.show();
    if (lily.carries(player)) {
      onLily = true;
      player.x += lily.speed; // Move player with lily pad
    }
  }

  // Update and show all obstacles, check for collisions
  for (let obs of obstacles) {
    obs.update();
    obs.show();
    if (obs.hits(player)) {
      loseLife(); // Player hit by obstacle
    }
  }

  // Check if player fell into river without a lily pad
  if (
    player.y < riverY + 180 &&
    player.y + player.size > riverY &&
    !onLily
  ) {
    loseLife();
  }

  // Check if player reached the goal zone (top grass)
  if (player.y < 100) {
    score++;
    if (score >= 5) {
      gameState = "win"; // Player wins after 5 points
    } else {
      player = new Player(500, 950); // Reset player position
    }
  }

  player.update();  // Update player (no-op currently)
  player.show();    // Draw player

  // Display UI (lives and score)
  fill(255);
  textSize(24);
  text(`Lives: ${lives}`, 500, 60);
  text(`Score: ${score}`, 400, 60);
}

// Handle losing a life or ending the game
function loseLife() {
  lives--;
  if (lives <= 0) {
    gameState = "lose"; // Game over
  } else {
    player = new Player(500, 950); // Reset player position
  }
}

// Handle player input
function keyPressed() {
  if (gameState === "play") {
    if (keyCode === LEFT_ARROW) player.move(-50, 0);
    if (keyCode === RIGHT_ARROW) player.move(50, 0);
    if (keyCode === UP_ARROW) player.move(0, -50);
    if (keyCode === DOWN_ARROW) player.move(0, 50);
  } else if (gameState === "lose" || gameState === "win") {
    if (key === 'r' || key === 'R') {
      lives = 2;       // Reset lives
      score = 0;       // Reset score
      startGame();     // Restart the game
    }
  }
}

// Display losing screen
function loseScreen() {
  background(0);
  fill(255, 0, 0);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("HAHA! YOU LOSE", width / 2, height / 2 - 40);
  textSize(32);
  text("Press 'R' to Restart", width / 2, height / 2 + 40);
}

// Display winning screen
function winScreen() {
  background(0);
  fill(0, 150, 0);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("Well Well Well, YOU WIN!", width / 2, height / 2 - 40);
  textSize(32);
  text("Press 'R' to Play Again", width / 2, height / 2 + 40);
}

// Center the canvas in the browser window
function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canva.position(x, y);
}

// Re-center canvas when window is resized
function windowResized() {
  centerCanvas();
}

// Player class representing the frog/player
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
  }

  // Move player with boundary constraints
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.x = constrain(this.x, 0, width - this.size);
    this.y = constrain(this.y, 0, height - this.size);
  }

  update() {}

  // Draw the player
  show() {
    fill(255);
    rect(this.x, this.y, this.size, this.size);
  }
}

// Obstacle class representing cars or hazards
class Obstacle {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.w = 80;
    this.h = 40;
    this.speed = speed;
  }

  // Update obstacle position and wrap around screen
  update() {
    this.x += this.speed;
    if (this.x > width) this.x = -this.w;
    if (this.x < -this.w) this.x = width;
  }

  // Draw the obstacle
  show() {
    fill(200, 70, 70);
    rect(this.x, this.y, this.w, this.h);
  }

  // Check if it collides with the player
  hits(player) {
    return (
      player.x < this.x + this.w &&
      player.x + player.size > this.x &&
      player.y < this.y + this.h &&
      player.y + player.size > this.y
    );
  }
}

// Lilys class representing moving lily pads on the river
class Lilys {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.w = 150;
    this.h = 40;
    this.speed = speed;
  }

  // Update lily pad position and wrap around screen
  update() {
    this.x += this.speed;
    if (this.x > width) this.x = -this.w;
    if (this.x < -this.w) this.x = width;
  }

  // Draw the lily pad
  show() {
    fill(134, 164, 116);
    ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w, this.h);
  }

  // Check if lily pad is carrying the player
  carries(player) {
    return (
      player.x < this.x + this.w &&
      player.x + player.size > this.x &&
      player.y < this.y + this.h &&
      player.y + player.size > this.y
    );
  }
}
