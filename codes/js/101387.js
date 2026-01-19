// [AI Used] Suggested by ChatGPT for organizing fire and smoke particles
let fireParticles = [];
let smokeParticles = [];
let fireStartFrame = 0;

function scene2(startTime) {
// [AI Used] Scene structure and timing logic planned by ChatGPT
    let elapsedTime = millis() - startTime;
    image(grassBg, 0, 0);       // Draw grass background
    Cigarette1(cigX, cigY);     // Draw cigarette 

// Calculate how many frames passed since fire started
    let timeSinceStart = frameCount - fireStartFrame;

// [AI Used] Gradual smoke then fire effect design suggested by ChatGPT
    if (timeSinceStart < 90) {
        if (frameCount % 4 === 0) {
// Create smoke particles around fire start point with slight randomness
            smokeParticles.push(new Scene2SmokeParticle(fireStartX + random(-6, 6), fireStartY + random(-2, 2)));
        }
    } else {
        if (frameCount % 4 === 0) {
// Add multiple fire particles (simulate burst effect)
            for (let i = 0; i < 3; i++) {
                fireParticles.push(new Scene2FireParticle(fireStartX + random(-5, 5), fireStartY + random(-5, 5)));
            }
// Continue adding smoke for realism
            for (let i = 0; i < 3; i++) {
                smokeParticles.push(new Scene2SmokeParticle(fireStartX + random(-6, 6), fireStartY + random(-2, 2)));
            }
        }
    }

// Update and show smoke particles, remove it faded
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        smokeParticles[i].update();
        smokeParticles[i].show();
        if (smokeParticles[i].finished()) {
            smokeParticles.splice(i, 1);
        }
    }

// After initial delay, show and update fire particles
    if (timeSinceStart >= 90) {
        for (let i = fireParticles.length - 1; i >= 0; i--) {
            fireParticles[i].update();
            fireParticles[i].show();
            if (fireParticles[i].finished()) {
                fireParticles.splice(i, 1);
            }
        }
    }

    return elapsedTime;
}


// [AI Used] Full class structure and logic adapted from ChatGPT
class Scene2FireParticle {
    constructor(x, y) {
// Store position, alpha transparency, size and velocity
        this.baseX = x;
        this.baseY = y;
        this.alpha = 255;
        this.d = random(8, 15);     // Diameter of particle
        this.vx = random(-0.8, -0.3);       // Horizontal speed
        this.vy = random(-2, -1);       // Vertical speed
    }

    update() {
// Move particle and gradually fade out
        this.baseX += this.vx;
        this.baseY += this.vy;
        this.alpha -= 1.2;
        this.d += 0.01;     // Slightly increase size to simulate spreading fire
    }

    show() {
// Add flickering effect by offsetting position a little
        let flickerX = this.baseX + random(-0.5, 0.5);
        let flickerY = this.baseY + random(-0.5, 0.5);
        noStroke();
        fill(random(220, 255), random(80, 130), 20, this.alpha);        // Orange-yellowish fire
        ellipse(flickerX, flickerY, this.d);
    }

    finished() {
// Check if the particle is invisible
        return this.alpha < 0;
    }
}


class Scene2SmokeParticle {
    constructor(x, y) {
// Set initial position, transparency, size and movement
        this.x = x;
        this.y = y;
        this.alpha = 150;
        this.d = random(10, 20);
        this.vx = random(-0.4, -0.1);       // Move slowly to left
        this.vy = random(-1.5, -0.5);       // Move upward
    }

    update() {
// Move particle and reduce transparency
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.5;
    }

    show() {
        noStroke();
        fill(160, 160, 160, this.alpha);        // Light gray smoke
        ellipse(this.x, this.y, this.d);
    }

    finished() {
        return this.alpha < 0;
    }
}