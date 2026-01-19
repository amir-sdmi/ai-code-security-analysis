"use strict";

/*****************************************************************************************/
/* FUNCTION MODAl RULES */
/*****************************************************************************************/
let scores,
  activePlayer,
  holeRandom,
  winningScore = 20; // for initGameDuo

let scoreSingle,
  singleWinningScore = 5; // for initSingle

let reset = false,
  playingSingle = false,
  playingDuo = false;

const titles = document.querySelector(".titles"); // for initGameDuo startCountdownSingle
const winnerOverlay = document.querySelector(".winner-overlay"); // for displayWinner
const winnerPlayer = document.querySelector(".winner-player"); // for displayWinner
const winnerBlock = document.querySelector(".winner"); // for displayWinner

const overlay = document.querySelector(".overlay");
const btnRulesOpen = document.querySelector(".btnRules-open");
const modal = document.querySelector(".modal");
const btnRulesClose = document.querySelector(".btnRules-close");

function openModal() {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
}

btnRulesOpen.addEventListener("click", openModal);
btnRulesClose.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

/*****************************************************************************************/
/* FUNCTION MODE */
/*****************************************************************************************/
const btnMode = document.querySelector(".btnModeClick");
const btnModeData = btnMode.textContent; // Saves the original text

const body = document.querySelector("body");
let isEasyMode = false;

function setEasyMode() {
  body.classList.add("easyMode");
  body.classList.remove("hardMode");
  btnMode.textContent = "Easy Mode";
}

function setHardMode() {
  body.classList.add("hardMode");
  body.classList.remove("easyMode");
  btnMode.textContent = "Hard Mode";
}

btnMode.addEventListener("click", function () {
  isEasyMode = !isEasyMode;

  // if the mode is easy
  if (isEasyMode) {
    setEasyMode();
  } // if the mode is not 'easy'
  else {
    setHardMode();
  }
});

/*****************************************************************************************/
/* TIMERS | created using ChatGPT */
/*****************************************************************************************/
// ? CountDown to DuoGame
function startCountdown(elementId, seconds) {
  if (playingDuo) {
    const element = document.getElementById(elementId);
    let count = seconds;
    let innerCount = 3;

    const intervalId = setInterval(() => {
      if (playingDuo) element.textContent = count;
      count--;

      // If time is up
      if (count < 0) {
        clearInterval(intervalId);
        if (playingDuo) element.textContent = "Change Player!";

        const innerIntervalId = setInterval(() => {
          holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes when a new player starts to play
          if (playingDuo) element.textContent = `Starts in ${innerCount}`;
          innerCount--;
          if (innerCount < 0) {
            clearInterval(innerIntervalId);
            // If there is a winner, active player stays
            if (winnerBlock.classList.contains("hidden")) {
              changePlayer();
            }
          }
        }, 600);
      }
      // If there's still time
      else {
        handlePopupClick();
      }
    }, 1000);
  }
}

// ? CountDown to SingleGame
function startCountdownSingle(elementId, seconds) {
  if (playingSingle) {
    const element = document.getElementById(elementId);
    let count = seconds;
    let innerCount = 2;

    const intervalId = setInterval(() => {
      if (playingSingle) element.textContent = count;
      count--;

      // If reaching 0 before countdown ends, displayLoser : displayWinner
      if (count < 0) {
        clearInterval(intervalId);
        if (scoreSingle < singleWinningScore) {
          displaySingleLoser();
        }
        if (playingSingle) element.textContent = "Time's up!";
        holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes when a new

        const innerIntervalId = setInterval(() => {
          innerCount--;
          if (innerCount < 0) {
            clearInterval(innerIntervalId);
            element.textContent = "";
            titles.classList.remove("hidden");
          }
        }, 800);
      } else {
        if (scoreSingle >= singleWinningScore) {
          displaySingleWinner();
        }
        handlePopupSingleClick();
      }
    }, 1000);
  }
}

/*****************************************************************************************/
/* FUNCTION 1 Vs 1 Game */
/*****************************************************************************************/
//Selecting Elements
const holes = document.querySelectorAll(".hole"); // for changePopupLoc

const scoreDisplay0 = document.querySelector(".score-value-0"); // for updateScoreDisplay
const scoreDisplay1 = document.querySelector(".score-value-1"); // for updateScoreDisplay

const secondsDisplay = document.getElementById("seconds"); // for sessionPopup

const timer = document.querySelector(".timer"); // for initGameDuo
const startsPlayingLabel = document.querySelector(".start-playing-label"); // for initGameDuo
const score0 = document.querySelector(".score-0"); // for initSingle initGameDuo
const score1 = document.querySelector(".score-1"); // for initSingle initGameDuo

const btnSingle = document.querySelector(".btnSingle");

const primeHeadline = document.querySelector(".prime-headline"); // for displayMessage
let countMessage;

// ? Init Duo
function initGameDuo() {
  // Change the titles with the timer for extra space
  titles.classList.add("hidden");
  timer.classList.remove("hidden");
  startsPlayingLabel.classList.add("hidden");

  // Add the players scores display
  score0.classList.remove("hidden");
  score1.classList.remove("hidden");

  // Reset scores
  scores = [0, 0];
  scoreDisplay0.textContent = 0;
  scoreDisplay1.textContent = 0;

  // Player 1 is starting
  activePlayer = 0;

  // Hide unnessecry btns
  btnSingle.classList.add("hidden");
  btnDuo.classList.add("hidden");

  // Handle the number of holes and popup
  holeRandom = Math.floor(Math.random() * holes.length);
  holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes
  holes[holeRandom].classList.add("popup"); // Add a popup to random hole
}

// ? Change Popup Location
function changePopupLoc() {
  for (let i = 0; i < holes.length; i++) {
    holes[holeRandom].classList.remove("popup");
    holeRandom = Math.floor(Math.random() * holes.length);
    holes[holeRandom].classList.add("popup");
  }
}

// ? Handle Popup Click
function handlePopupClick(event) {
  if (event && event.target && playingDuo) {
    const clickedHole = event.target.closest(".hole");
    if (clickedHole && clickedHole.classList.contains("popup")) {
      scores[activePlayer]++;
      if (scores[activePlayer] >= winningScore) displayWinner();
      updateScoreDisplay();
      changePopupLoc();
    }
  }
}
holes.forEach((hole) => hole.addEventListener("click", handlePopupClick));

// ? Update Scores
function updateScoreDisplay() {
  scoreDisplay0.textContent = scores[0];
  scoreDisplay1.textContent = scores[1];
  console.log("scoreAdd");
}

// ? Change Player
function changePlayer() {
  holeRandom = Math.floor(Math.random() * holes.length);
  holes[holeRandom].classList.add("popup"); // Add a popup to random hole
  activePlayer = activePlayer === 0 ? 1 : 0;
  sessionPopup();
}

// ? One Session Playing
function sessionPopup() {
  if (scores[0] >= winningScore || scores[1] >= winningScore) {
    displayWinner();
  } else {
    // ! Choose seconds by the Easy/Hard mode
    startCountdown("seconds", isEasyMode === true ? 6 : 4);
  }
}

// ? Display Winner
function displayWinner() {
  if (playingDuo) {
    // Show winner
    winnerOverlay.classList.remove("hidden");
    winnerBlock.classList.remove("hidden");
    const winner = activePlayer + 1;

    //Active player is the winner when reaching winningScore
    winnerPlayer.textContent = winner;

    btnDuo.classList.add("hidden");
    btnSingle.classList.add("hidden");
    playingDuo = false;
  }
}

// ? displayMessage
function displayMessage(message) {
  primeHeadline.textContent = message;
  countMessage = 2;

  const intervalId = setInterval(() => {
    countMessage--;
    if (countMessage < 1) {
      clearInterval(intervalId);
      primeHeadline.textContent = "Whack The Capybara";
    }
  }, 1000);
}

function gameDuo() {
  // Start only if there is a mode
  if (btnMode.textContent != "Mode") {
    playingSingle = false;
    playingDuo = true;
    reset = false;
    initGameDuo();
    sessionPopup();
  }
  // If there isn't, display a meesage
  else {
    displayMessage("Choose a Mode first!");
  }
}

// ? 1 Vs 1
const btnDuo = document.querySelector(".btnDuo");
btnDuo.addEventListener("click", gameDuo);

/*****************************************************************************************/
/* FUNCTION Single Game */
/*****************************************************************************************/
const score2 = document.querySelector(".score-2"); // for initSingle
const scoreDisplay2 = document.querySelector(".score-value-2"); // for initSingle

const loserSingle = document.querySelector(".loser-single"); // for displaySingleLoser
const winnerSingle = document.querySelector(".winner-single"); // for displaySingleWinner
const LoserSingleOverlay = document.querySelector(".loser-single-overlay");

// ? Init Single Game
function initSingle() {
  // 1 and 2 players are hidden, player 3 is active
  score0.classList.add("hidden");
  score1.classList.add("hidden");
  score2.classList.remove("hidden");

  // Hide unnecessry btns
  btnDuo.classList.add("hidden");
  btnSingle.classList.add("hidden");

  // Change the titles with the timer for extra space
  titles.classList.add("hidden");
  timer.classList.remove("hidden");
  startsPlayingLabel.classList.add("hidden");

  // Reset scores
  scoreSingle = 0;
  scoreDisplay2.textContent = 0;

  // Handle the number of holes and popup
  holeRandom = Math.floor(Math.random() * holes.length);
  holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes
  holes[holeRandom].classList.add("popup"); // Add a popup to random hole
}

// ? Change Popup Location
function changePopupLocSingle() {
  for (let i = 0; i < holes.length; i++) {
    holes[holeRandom].classList.remove("popup");
    holeRandom = Math.floor(Math.random() * holes.length);
    holes[holeRandom].classList.add("popup");
  }
}

// ? Handle Popup Click
function handlePopupSingleClick(event) {
  if (playingSingle) {
    const clickedHole = event.target.closest(".hole");
    if (clickedHole && clickedHole.classList.contains("popup")) {
      scoreSingle++;
      updateScoreDisplaySingle();
      if (scoreSingle >= singleWinningScore) {
        holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes when a new
        displaySingleWinner();
      } else {
        changePopupLocSingle();
      }
    }
  }
}
holes.forEach((hole) => hole.addEventListener("click", handlePopupSingleClick));

// ? Update Scores
function updateScoreDisplaySingle() {
  scoreDisplay2.textContent = scoreSingle;
}

// ? Display WinnerAndLoser
function displaySingleWinner() {
  if (playingSingle) {
    holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes when a new
    score2.classList.add("hidden");
    // TODO Display winner if reaching winningSingleScore : Display loser
    winnerSingle.classList.remove("hidden");
    winnerOverlay.classList.remove("hidden");
    btnSingle.classList.add("hidden");
    playingSingle = false;
  }
}

function displaySingleLoser() {
  if (playingSingle) {
    holes.forEach((hole) => hole.classList.remove("popup")); // Remove popups from all holes when a new
    score2.classList.add("hidden");
    // TODO Display winner if reaching winningSingleScore : Display loser
    loserSingle.classList.remove("hidden");
    LoserSingleOverlay.classList.remove("hidden");
    btnSingle.classList.add("hidden");
    playingSingle = false;
  }
}

function gameSingle() {
  // Start only if there is a mode
  if (btnMode.textContent != "Mode") {
    playingDuo = false;
    playingSingle = true;
    initSingle();
    // ! Choose seconds by the Easy/Hard mode
    startCountdownSingle("seconds", isEasyMode === true ? 8 : 6);
  }
  // If there isn't, display a meesage
  else {
    displayMessage("Choose a Mode first!");
  }
}

btnSingle.addEventListener("click", gameSingle);

/*****************************************************************************************/
/* FUNCTION Reset */
/*****************************************************************************************/

function resetGame() {
  /* Work only if 
  1. There is a winner
  2. There is selected Mode
  3. Timer is not 'hidden'
  */
  if (
    btnMode.textContent !== btnModeData ||
    !winnerOverlay.classList.contains("hidden") ||
    !winnerBlock.classList.contains("hidden") ||
    !timer.classList.contains("hidden")
  ) {
    // Set reset is true
    reset = true;

    // Reset all displays content
    // Hide
    timer.classList.add("hidden");
    winnerBlock.classList.add("hidden");
    winnerOverlay.classList.add("hidden");
    winnerSingle.classList.add("hidden");
    LoserSingleOverlay.classList.add("hidden");
    loserSingle.classList.add("hidden");
    overlay.classList.add("hidden");

    // Show
    btnMode.textContent = btnModeData;
    body.classList.remove("easyMode");
    body.classList.remove("hardMode");
    titles.classList.remove("hidden");
    startsPlayingLabel.classList.remove("hidden");
    score0.classList.add("hidden");
    score1.classList.add("hidden");
    btnRulesOpen.classList.remove("hidden");
    btnDuo.classList.remove("hidden");
    btnSingle.classList.remove("hidden");

    // Reset status playing
    playingDuo = false;
    playingSingle = false;

    // Reset scores
    scores = [0, 0];
    scoreSingle = 0;

    // Remove popups from all holes
    holes.forEach((hole) => hole.classList.remove("popup"));
  }
  // Display a message if there's no winner
  else {
    displayMessage("Start Play First!");
  }
}

const btnReset = document.querySelector(".btnReset");
btnReset.addEventListener("click", resetGame);
