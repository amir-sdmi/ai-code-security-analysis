const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let player = { x: canvas.width / 3, y: canvas.height - 150, width: 30, height: 30, speed: 5 };
let papers = [];
let houses = [];
let score = 0;
let gameOver = false;
let isPaused = false;
let houseCount = 0;
const maxHouses = 30;
const streetSpeed = 2;
let levelComplete = false;
let reachedIntersection = false;
let gamePaused = false;  // Flag to check if the game is paused

// Controls
let keys = {};
window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

// Pause toggle
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyP") {
        isPaused = !isPaused;
    }
});

// Paper throw trigger
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        throwPaper();
    }
});

// Event listener for Escape key to go to credits
window.addEventListener("keydown", (e) => {
    // Handle the 'Escape' key properly for both modern browsers and Chrome.
    if (e.key == "Escape" || e.code == "Escape") {
        showCredits();
    }
});


// Initialize houses
function initializeHouses() {
    houses = [];
    for (let i = 0; i < canvas.height; i += 200) {
        addHouse(canvas.height - i - 200);
    }
}

// Add a new house
function addHouse(yPosition) {
    const hasDeliverable = Math.random() < 0.6; // 60% chance for a red mailbox
    houses.push({
        x: 0,
        y: yPosition,
        width: 100,
        height: 150,
        color: hasDeliverable ? "#FFD700" : "#8B0000", // Gold or dark red
        mailbox: {
            color: hasDeliverable ? "red" : "black",
            x: 50,
            y: yPosition + 50,
            width: 20,
            height: 40,
            delivered: false, // Track delivery status
        }
    });
    houseCount++;
}

// Show modal for level completion
function showModal() {
    const modal = document.createElement("div");
    modal.id = "modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "20px";
    modal.style.background = "white";
    modal.style.border = "2px solid black";
    modal.style.textAlign = "center";
    modal.innerHTML = `
        <h2>Level Complete!</h2>
        <p>Your Score: ${score}</p>
        <button id="continue">Continue</button>
        <button id="quit">Quit</button>
    `;
    document.body.appendChild(modal);

    document.getElementById("continue").addEventListener("click", () => location.reload());
    document.getElementById("quit").addEventListener("click", showCredits);
}

//show credits modal
function showCredits() {
    // Pause the game
    gamePaused = true;

    // Hide the game canvas and display the credits modal
    const modal = document.createElement("div");
    modal.style.position = "absolute";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "20px";
    modal.style.backgroundColor = "white";
    modal.style.border = "2px solid black";
    modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    modal.style.zIndex = "9999";  // Ensure the modal is on top of the canvas
    modal.style.width = "300px";
    modal.style.textAlign = "center";

    // Add title and content
    modal.innerHTML = `
        <h2>Credits</h2>
        <p>Created by ChatGPT</p>
        <p>An homage to the classic Atari game Paperboy (1985)</p>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Paperboy_arcade_game_logo.png/640px-Paperboy_arcade_game_logo.png" alt="Paperboy Logo" style="width: 100%; height: auto; margin-bottom: 10px;">
        <a href="https://en.wikipedia.org/wiki/Paperboy" target="_blank">Learn more about Paperboy</a>
        <br><br>
        <button id="continueBtn">Continue</button>
        <button id="quitBtn">Quit</button>
    `;

    // Append modal to body
    document.body.appendChild(modal);

    // Event listener for the Continue button
    document.getElementById("continueBtn").addEventListener("click", () => {
        location.reload();  // Reload the page to start a new level
    });

    // Event listener for the Quit button
    document.getElementById("quitBtn").addEventListener("click", () => {
        window.location.href = "https://en.wikipedia.org/wiki/Paperboy";  // Redirect to the Wikipedia page
    });
}

// Game loop, only runs when not paused
function gameLoop() {
    if (gameOver || isPaused || gamePaused) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if level is complete
    if (houseCount >= maxHouses && houses.length === 0) {
        renderIntersection();
        setTimeout(showModal, 1000); // Show modal after 1 second
        return;
    }

    // Slide background elements
    houses.forEach(house => {
        house.y += streetSpeed;
        house.mailbox.y += streetSpeed;
    });
    papers.forEach(paper => paper.x -= 10);

    // Remove off-screen houses
    if (houses[0]?.y > canvas.height) {
        houses.shift();
    }

    // Add new houses until maxHouses is reached
    if (houseCount < maxHouses && houses.length < canvas.height / 200) {
        addHouse(houses[houses.length - 1]?.y - 200 || 0);
    }

    // Draw houses and mailboxes
    houses.forEach(house => {
        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, house.y, house.width, house.height);

        const mailbox = house.mailbox;
        ctx.fillStyle = mailbox.delivered ? "gray" : mailbox.color; // Change mailbox color if delivered
        ctx.fillRect(mailbox.x, mailbox.y, mailbox.width, mailbox.height);
    });

    // Draw sidewalk
    ctx.fillStyle = "#bcbcbc";
    ctx.fillRect(canvas.width / 3 - 145, 0, 100, canvas.height); // Reduced lawn distance

    // Draw street
    ctx.fillStyle = "#808080";
    ctx.fillRect(canvas.width / 3 - 45, 0, canvas.width / 3 * 2, canvas.height);

    // Player movement
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys["ArrowLeft"] && player.x > canvas.width / 3 - 145) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width / 3 - 45) player.x += player.speed;

    // Draw player (Paperboy as a bike)
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2); // Circular body
    ctx.fill();
    ctx.fillStyle = "black";

    // Draw tires
    ctx.fillRect(player.x - 10, player.y + player.height / 1.5, 5, 10); // Back tire
    ctx.fillRect(player.x + player.width / 2, player.y + player.height, 5, 10); // Front tire
    ctx.fillRect(player.x + player.width / 2 + 5, player.y + player.height / 1.2, 10, 1); // Front tire connecting line
    ctx.fillRect(player.x - 10, player.y + player.height / 1.2, 10, 1); // Back tire connecting line

    // Handle papers
    papers.forEach((paper, index) => {
        paper.x -= 10;
        paper.y -= 2; // Slight upward angle
        ctx.fillStyle = "white";
        ctx.fillRect(paper.x, paper.y, 30, 12); // Rectangular paper

        // Check collision with mailboxes
        houses.forEach(house => {
            const mailbox = house.mailbox;
            if (paper.x > mailbox.x && paper.x < mailbox.x + mailbox.width &&
                paper.y > mailbox.y && paper.y < mailbox.y + mailbox.height &&
                !mailbox.delivered) {
                if (house.mailbox.color === "red") {
                    score++;
                    displaySuccessAnimation(mailbox.x + mailbox.width / 2, mailbox.y - 10);
                }
                mailbox.delivered = true; // Mark mailbox as delivered
                papers.splice(index, 1); // Remove paper after delivery
            }
        });
    });

    requestAnimationFrame(gameLoop);
}

// Throw paper
function throwPaper() {
    if (gameOver) return;
    const paper = { x: player.x + player.width, y: player.y + player.height / 2 };
    papers.push(paper);
}

// Success animation for paper delivery
function displaySuccessAnimation(x, y) {
    ctx.fillStyle = "green";
    ctx.font = "20px Arial";
    ctx.fillText("✔", x, y); // Check mark as success animation
}

// Render intersection at the end of the level
function renderIntersection() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(canvas.width / 3 - 145, canvas.height - 80, 100, 20); // End of the sidewalk
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width / 3 - 90, canvas.height - 60, 20, 0, Math.PI * 2); // Stop sign
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("STOP", canvas.width / 3 - 90, canvas.height - 50);
}

// Start the game
initializeHouses();
gameLoop();
