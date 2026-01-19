const stopwatchDisplay = document.querySelector('.stopwatch-time');
const stopwatchBorder = document.querySelector('.stopwatch-border');
const timeLogs = document.querySelector('.js-time-logs');
const lapTimes = JSON.parse(localStorage.getItem('laps')) || [];
let lapTime = 0.00;
let formattedLapTime;
let isCounting;
let isCounted;
let intervalId; // Create it at the highest scope so it can be reused without conflicts
let formattedTime;
let stopwatchTime = 0.00; 
let isCleared = '';
// Create on highest scope so it can be accessed in functions and also in if-statements. If created inside the if-statements (like before) it can be only be accessed inside the block and cannot be accessed outside of it.

renderTimeLog();

function timeInterval() {

  if (isCleared) {
    document.querySelector('.stopwatch-border').classList
      .remove('js-border-inactive');

    document.querySelector('.stopwatch-border').classList
      .add('js-border-active');
  } else {
    document.querySelector('.stopwatch-border').classList
      .add('js-border-active');
  }

  intervalId = setInterval(() => {
    stopwatchTime += 10; // Increase increments by 10ms
    formattedTime = (stopwatchTime / 1000).toFixed(2); // Reformat the time to ms and set only 2 decimals to remove any problems using .toFixed()

    lapTime += 10;
    formattedLapTime = (lapTime / 1000).toFixed(2);

    stopwatchDisplay.innerHTML = `${formattedTime}s`;
  }, 10)
}

function clearTimeInterval(intervalId) {
  clearInterval(intervalId) 

  document.querySelector('.stopwatch-border').classList
    .add('js-border-inactive');

  document.querySelector('.stopwatch-border').classList
    .remove('js-border-active');

  isCleared = true;
}

document.querySelector('.js-start-stop')
  .addEventListener('click', () => {

    if (!isCounting) {
      stopwatchTime = formattedTime > 0.00 ? formattedTime : 0.00;

      timeInterval();

      isCounting = true;

      document.querySelector('.js-start-stop')
        .innerText = 'STOP';

    } else if (isCounting && !isCounted) {
      clearTimeInterval(intervalId)

      document.querySelector('.js-start-stop')
        .innerText = 'CONTINUE';

      isCounted = true;
    } else {
      timeInterval();

      document.querySelector('.js-start-stop')
        .innerText = 'STOP';

      isCounted = false;
    }  // FIX THIS PART
  }); // Result suggested by chatGPT

document.querySelector('.js-lap') // IF 0.00 -> DISABLE
  .addEventListener('click', () => {
    if (!isCounting) { // You can just use isCounting
      alert('Start the timer first.');
      return;
    } else {
      timeLogs.innerHTML = ""; // Every click, it clears the HTML however does not deletes it in the website, therefore everytime it is increased it does not stack on each other
      
      addTimeLog();
      
      formattedLapTime = '0.00';
      lapTime = 0.00; // Reset both because resetting one of it won't work

      document.querySelector('.stopwatch-border').classList
        .toggle('js-border-lap');
  
      setTimeout(() => {
        document.querySelector('.stopwatch-border').classList
          .remove('js-border-lap');
      }, 500) // Use setTimeout to make it appear for 1s then disappear
    }
})

function addTimeLog() {
  lapTimes.push({
    overallTime: formattedTime,
    lapTime: formattedLapTime
  });

  localStorage.setItem('laps', JSON.stringify(lapTimes));

  renderTimeLog();
}

function renderTimeLog() {
  let timeLogList = '';

  lapTimes.forEach((lapTime, index) => {
    const lapNumber = index + 1;
    const html = `
      <div class="time-log" data-index="${index}">
        <div>${lapNumber}.</div>
        <div>${lapTime.overallTime}</div>
        <div>${lapTime.lapTime}</div>
        <button class="js-delete-lap delete-lap-button">Delete</button>
      </div>`;
    timeLogList += html;
  });

  document.querySelector('.js-time-logs').innerHTML = timeLogList;
}


document.querySelector('.js-time-logs').addEventListener('click', (event) => {
  if (event.target.classList.contains('js-delete-lap')) {
    const index = event.target.parentElement.dataset.index;
    lapTimes.splice(index, 1);
    localStorage.setItem('laps', JSON.stringify(lapTimes));
    renderTimeLog();
  }
});  // Confusing, copy pasted from chatGPT

document.querySelector('.js-reset')
  .addEventListener('click', () => {
    clearTimeInterval(intervalId)
    stopwatchTime = 0.00;
    formattedTime = (stopwatchTime / 1000).toFixed(2); // This fixes the code, formattedTime is used to display it in a string and stopwatchTime stores it in numbers. .toFixed() converts numbers into strings, which is useful for displaying it in divs as texts.
    lapTime = 0.00;
    formattedLapTime = (lapTime / 1000).toFixed(2);
    stopwatchDisplay.innerHTML = `${formattedTime}s`;

    document.querySelector('.js-start-stop')
      .innerText = 'START';

    document.querySelector('.stopwatch-border').classList
      .toggle('js-border-reset');

    setTimeout(() => {
      document.querySelector('.stopwatch-border').classList
        .remove('js-border-reset');
    }, 500)

    isCounting = false;
    isCounted = false;
})

// Solution #1: formattedTime is used to display it in a string and stopwatchTime stores it in numbers. .toFixed() converts numbers into strings, which is useful for displaying it in divs as texts.