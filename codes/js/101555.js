// my code but they were not starting for some reason so I added it to chatgpt and it created cards and did the cached elements within the fucntions instead

/*-------------------------------- Constants --------------------------------*/

const cardBacks = [
    'scream1', 'scream2', 'scream3', 'scream4',
    'scream5', 'scream6'
];

const totalMatches = 6;

/*---------------------------- Variables (state) ----------------------------*/

let flippedCards = [];
let timeElapsed = 0;
let matches = 0;
let timerInterval;

/*------------------------ Cached Element References ------------------------*/

const cards = document.querySelectorAll('.card-inner');
const messageContainer = document.getElementById('message-container');
const messageElement = document.getElementById('message');
const timerElement = document.getElementById('timer');
const matchesElement = document.getElementById('matches');
const startButton = document.getElementById('start-button');

/*-------------------------------- Functions --------------------------------*/

// Start game

function startGame() {
    console.log('Game started!');
    resetGameState();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeElapsed++;
        updateTimer();
    }, 1000);

    shuffleCards();
    cards.forEach(card => {
        card.classList.remove('flipped');
        card.addEventListener('click', flipCards);
    });

    updateMessage("Match all pairs to survive Ghostface!");
}

// Reset game state
function resetGameState() {
    timeElapsed = 0;
    matches = 0;
    flippedCards = [];
    updateTimer();
    updateMatches();
}

// Shuffle game // fixed it with chatgpt
function shuffleCards() {
    const shuffledArray = [...cardBacks, ...cardBacks].sort(() => Math.random() - 0.5);
    cards.forEach((card, index) => {
        const cardBack = card.querySelector('.card-back');
        cardBack.id = shuffledArray[index];
    });
    console.log('Cards shuffled:', shuffledArray);
}


// Flip a cards
function flipCards(event) {
    const clickedCard = event.target.closest('.card-inner');
    if (!clickedCard || clickedCard.classList.contains('flipped') || flippedCards.length >= 2) return;

    clickedCard.classList.add('flipped');
    flippedCards.push(clickedCard);

    if (flippedCards.length === 2) {
        setTimeout(checkForMatch, 1000);
    }
}

// Check for a match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const cardBack1 = card1.querySelector('.card-back');
    const cardBack2 = card2.querySelector('.card-back');

    if (cardBack1.id === cardBack2.id) {
        console.log('Match found!');
        matches++;
        updateMatches();

        if (matches === totalMatches) {
            clearInterval(timerInterval);
            updateMessage("Yey! You survived Ghostface!");
        }
    } else {
        console.log('No match!');
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }

    flippedCards = [];
}

// Update timer on the screen
function updateTimer() {
    if (timerElement) {
        timerElement.textContent = `Time: ${timeElapsed}s`;
    }
    console.log(`Timer updated: ${timeElapsed}s`);

    if (timeElapsed >= 120) {
        clearInterval(timerInterval);
        updateMessage("Time's up! Ghostface killed you!");
        disableCards();
    }
}


// Update matches on the screen // i googled this one completely
function updateMatches() {
    if (matchesElement) {
        matchesElement.textContent = `Matches: ${matches}/${totalMatches}`;
    }
    console.log(`Matches updated: ${matches}/${totalMatches}`);
}

// Update game message
function updateMessage(message) {
    if (messageElement) {
        messageElement.textContent = message;
    }
    console.log(message);
}


/*----------------------------- Event Listeners -----------------------------*/


document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM content loaded');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    } else {
        console.error('Start button not found!');
    }
});
