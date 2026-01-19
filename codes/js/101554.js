let bird;
let gameState = 'start';
let birdPath = [];
let osc, env; 
let currentPitchY = null; 
let skyImage;

function preload() {
  skyImage = loadImage('../img/sky.png');
}

function setup() {
  createCanvas(1000, 400);
  bird = new Bird();
  textSize(32);
  textAlign(CENTER, CENTER);

  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0); 
  env = new p5.Envelope();
  env.setADSR(0.1, 0.2, 0.5, 1); 
  env.setRange(0.8, 0); 
}

function draw() {
  background(skyImage);

  if (gameState === 'start') {
    displayStartScreen();
  } else if (gameState === 'playing') {
    bird.update();
    bird.show();
  } else if (gameState === 'end') {
    drawTrail();
    displayPitchIndicator();
  }
}

function displayStartScreen() {
  fill(255);
  text("Press Space To Start", width / 2, height / 2);
}

function keyPressed() {
  if (key === ' ' && gameState !== 'playing') {
    getAudioContext().resume().then(() => {
      console.log('Audio context resumed');
      startGame();
    });
  } else if (gameState === 'playing') {
    bird.flap();
  }
}

function startGame() {
  gameState = 'playing';
  bird.reset();
  birdPath = [];
}


class Bird {
  constructor() {
    this.reset();
  }

  reset() {
    this.y = height / 2;
    this.x = 50;
    this.velocity = 0;
    this.gravity = 0.6;
    this.lift = -15;
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;
    this.velocity *= 0.9; 

    if (this.y > height) {
      this.y = height;
      gameState = 'end';
      playSoundBasedOnPath();
    }

    if (this.x < width && gameState === 'playing') {
      this.x += 3; 
      birdPath.push({ x: this.x, y: this.y }); 
    } else if (gameState === 'playing') {
      gameState = 'end';
      playSoundBasedOnPath();
    }
  }

  flap() {
    this.velocity += this.lift;
  }

  show() {
    fill(255);
    ellipse(this.x, this.y, 32, 32);
  }
}

function drawTrail() {
  noFill();
  stroke(255, 100); 
  beginShape();
  birdPath.forEach(p => {
    vertex(p.x, p.y);
  });
  endShape();
}

function playSoundBasedOnPath() {
    birdPath.forEach((pos, index) => {
      setTimeout(() => {
        let freq = map(pos.y, 0, height, 100, 1000);
        osc.freq(freq);
        env.triggerAttack(); 
        
        setTimeout(() => {
          env.triggerRelease(); 
        }, 100);
  
        currentPitchY = pos.y;
      }, index * 300);
    });
  
    setTimeout(() => {
      gameState = 'start';
      birdPath = [];
      currentPitchY = null;
    }, birdPath.length * 300 + 1000);
  }
  


function displayPitchIndicator() {
  if (currentPitchY !== null) {
    stroke(255, 0, 0); 
    line(0, currentPitchY, width, currentPitchY);
  }
}




//Attribution: Code above are partially created by ChatGPT
