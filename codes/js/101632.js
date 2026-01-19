// Timer logic and fire trigger
let timerStarted = false;
let startTime = 0;
let elapsedTime = 0;

// [AI Used] Variable setup (dropping cigarette and foot interaction)
let cigX, cigY, dropped = false;        // Cigarette position and drop status
let footY = -200;
let stepTriggered = false;       // Foot animation and step trigger
let showFireCircle = true;       // Whether to show fire animation

let angle, fireStartX, fireStartY;      //Rotation and fire coordinates

// [AI Used] ChatGPT helped organize full scene logic for cigarette, foot and fire
function scene1() {
    angle = radians(10);
    image(grassBg, 0, 0);       // Draw grass background image
    Cigarette1(cigX, cigY);     // Draw cigarette
    dropCigarette();        // Animate cigarette falling
    Foot(cigX + 25, footY);     // Draw foot above cigarette
    handleStep();       // Handle foot movement and fire display

// Set fire position based on cigarette
    fireStartX = cigX + 32;     // Fire starting X-position (near cigarette tip)
    fireStartY = cigY + 6;      // Fire starting Y-position

// Show fire animation unless stepped on
    if (showFireCircle) {
        FireParticleScene1(fireStartX, fireStartY);     // Show small fire flickers before stepping
    }

// Set the timer after stepping on fire
    if (stepTriggered && !timerStarted && dropped) {
        startTime = millis();
        timerStarted = true;
    }

// Track how long fire has been burning
    if (timerStarted) {
        elapsedTime = millis() - startTime;
    }
    return elapsedTime;     // Return how long fire has been burning (for transition)
}

// [AI Used] ChatGPT helped generate logic for randomized grass shape
function Grass(pg) {
    pg.background(34, 139, 34);     // Green grass background
    pg.stroke(20, 110, 20);     // Darker green lines
    pg.strokeWeight(1.5);
    pg.noFill();

// Draw random grass blade curves
    for (let i = 0; i < 600; i++) {
        let gx = random(pg.width);
        let gy = random(pg.height);
        let h = random(10, 25);
        pg.beginShape();
        pg.vertex(gx, gy);
        pg.quadraticVertex(gx - 2, gy - h / 2, gx, gy - h);
        pg.endShape();
    }

// Add additional blades with straight lines
    for (let i = 0; i < 300; i++) {
        let gx = random(pg.width);
        let gy = random(pg.height);
        pg.line(gx, gy, gx - 2, gy - 15);
        pg.line(gx, gy, gx + 2, gy - 15);
    }
}

// [AI Used] ChatGPT assisted in drawing rotated cigarette
function Cigarette1(x, y) {
    push();
    translate(x - 10, y);       // Cigarette pposition
    rotate(angle);      // Apply angle
    noStroke();

    if (stepTriggered && footY >= cigY - 30) {
// Stepped cigarette with glowing tip
        fill(180);
        rect(0, 4, 35, 5, 1);
        fill(255, 40, 0);
        rect(35, 4, 8, 5, 1);
        fill(80, 10, 10, 120);
        ellipse(39, 6, 10, 5); // glowing tip
    } else {
// Normal cigarette shape before step
        fill(255);
        rect(0, 0, 40, 12, 2);
        fill(255, 50, 0);
        rect(40, 0, 8, 12, 1);
    }
    pop();
}

// [AI Used] ChatGPT proposed the falling logic for cigarette drop
function dropCigarette() {
    if (!dropped && cigY < height * 0.4) {
        cigY += 3;      // Move cigarette down
    } else {
        dropped = true;     // Stop movement after reaching ground
    }
}

// [AI Used] Foot design and movement assisted by ChatGPT 
function Foot(x, y) {
    push();
    translate(x + 40, y);
    rotate(angle);

    fill(50, 100, 180);     // Leg color
    rect(-30, -height, 70, height);     // Leg

    fill(0);        // Foot sole and shape
    ellipse(-25, 40, 40, 20);
    rect(-20, 0, 50, 15);
    beginShape();
    vertex(-15, 10);
    vertex(30, 15);
    vertex(-15, 50);
    vertex(-40, 40);
    endShape(CLOSE);

    noStroke();
    fill(0, 50);        // Shadow under foot
    ellipse(-5, 50, 80, 20);
    pop();
}

// [AI Used] Logic to move foot and toggle fire visibility
function handleStep() {
    if (stepTriggered && footY < cigY - 30) {
        footY += 5;     // Move foot down toward cigarette
    }

    if (stepTriggered && footY >= cigY - 30) {
        showFireCircle = false;     // Stop fire flickers once stepped
    }
}

// [AI Used] Fire flickers simulation based on random ellipses
function FireParticleScene1(x, y) {
    noStroke();
    fill(random(220, 255), random(80, 130), 20, 200);       // Flickering orange fire
    ellipse(x + random(-2, 2), y + random(-2, 2), random(13, 17));      // Random glowing shape
}

// [AI Used] Key press logic to change scene and start fire
function keyPressed() {
    if (sceneNum === 1 && key === ' ') {
        stepTriggered = true;       // Start foot movement
    }

    if (keyCode === ENTER && sceneNum === 1) {
// Transition to next  scene and reset values
        sceneNum = 2;
        sceneStartTime = millis();
        fireParticles = [];
        smokeParticles = [];
        fireStartX = cigX + 32;
        fireStartY = cigY + 6;
        fireStartFrame = frameCount;
    }
}
