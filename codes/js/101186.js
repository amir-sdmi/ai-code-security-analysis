const tiles = document.querySelectorAll(".tile"); // Selects all tiles
const redDisplay = document.getElementById("r"); // The following three constants select the RGB values
const greenDisplay = document.getElementById("g");
const blueDisplay = document.getElementById("b");
const livesDisplay = document.querySelector(".hearts"); // Selects all hearts container
const resultDisplay = document.getElementById("result"); // Constant for result display
const retryButton = document.querySelector(".retry button"); // Selects the retry button

let correctColor; // Store the correct color
let lives = 3; // Start the game with 3 lives
let score = 0; // Tracks the correct guesses

// Function to generate random RGB color
function getRandomColor() {
    let red = Math.floor(Math.random() * 256); // Generates random number from 0 to 255 for Red Color Value
    let green = Math.floor(Math.random() * 256); // Generates random number from 0 to 255 for Green Color Value
    let blue = Math.floor(Math.random() * 256); // Generates random number from 0 to 255 for Blue Color Value
    return {red, green, blue, rgbString: `rgb(${red}, ${green}, ${blue})`}; // Returns RGB values and a readable string format for the color
}

// Function to start the game
function startGame() {
    let colors = []; // List/array to hold 6 colors
    updateLives();  // Initiates the update lives function declared later in the script
    resultDisplay.textContent = ""; // Clear result text when starting a new game
    retryButton.style.display = "none"; // Hides the retry button when starting a new game
    tiles.forEach(tile => tile.style.opacity = "1"); // Reset opacity and enable tiles again on new game

    // Remove previous event listeners from tiles (suggested by ChatGPT due to a bug when starting a new game stacking the event listeners)
    tiles.forEach(tile => {
        tile.removeEventListener('click', handleTileClick);
    });

    // Enable all tiles for new game
    tiles.forEach(tile => tile.disabled = false);

    for (let i = 0; i < tiles.length; i++) { // Loops through all 6 tiles using a for loop
        let newColor = getRandomColor(); // Assigns each tile a random color using the getRandomColor function
        colors.push(newColor.rgbString); // Pushes the readable string format of the color to the colors array/list
        tiles[i].style.backgroundColor = newColor.rgbString; // Assigns each of the 6 tile a random background color from the random color generated in each loop

        // Attach the click event handler aka the "click the play function" to each 6 tiles
        tiles[i].addEventListener('click', handleTileClick);
    }

    // Choose a correct color from the 6 random colors
    correctColor = colors[Math.floor(Math.random() * colors.length)];

    // Display RGB values separately (I still don't understand it but this is what ChatGPT suggested and worked for my problem)
    let [r, g, b] = correctColor.match(/\d+/g);
    redDisplay.textContent = r;
    greenDisplay.textContent = g;
    blueDisplay.textContent = b;
}

// Function to handle tile clicks
function handleTileClick() {
    if (lives <= 0) return;  // Prevent interaction when lives are 0 (found from a bug where clicking on tiles after game over glitched the game out)

    let tileColor = this.style.backgroundColor; // Gets the color of the clicked tile

    if (tileColor === correctColor) { // Checks if the color of the tile is the correct color
        score++; // Increase score for correct guess
        startGame(); // Reload new colors while keeping lives & score
    } else {
        this.style.opacity = "0"; // Hide incorrect tile
        lives--; // Reduce life count
        updateLives(); // Update lives display after losing a life
        if (lives === 0) { // Checks if lives are 0
            resultDisplay.textContent = `Game Over! You scored ${score} points.`; // Displays the game over message with your score
            resultDisplay.style.color = "red"; // Styles the text red
            retryButton.style.display = "inline"; // Shows the retry button
            retryButton.style.align = "center"; // Shows the retry button and aligns it to the center
            // Disables all 6 tiles once game is over
            tiles.forEach(tile => tile.disabled = true);
        }
    }
}

// Function to update the lives visually
function updateLives() {
    let hearts = ""; // Declare an empty string to store the hearts
    for (let i = 0; i < lives; i++) { // Loop through the number of lives left
        hearts += "❤️ "; // Emoji for hearts
    }
    livesDisplay.innerHTML = hearts.trim(); // Updates hearts display with the correct number of lives
}

// Restart game when retry button is clicked
retryButton.addEventListener("click", function() {
    score = 0; // Resets score only when restarting after game over
    lives = 3; // Resets the lives
    startGame();  // Start the game again and reset everything
});

// Starts the game on page load
startGame();
