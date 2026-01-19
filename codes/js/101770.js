// with annotations from ChatGpt

// Selecting buttons and Counter Element
/**
 * Selects all elements with the class 'btn' and stores them in the 'btns' array.
 */
const btns = document.querySelectorAll(".btn");
/**
 * Selects the element with the id 'value' and stores it in the 'counter' variable.
 */
const counter = document.querySelector("#value");

// Utitiy Functions to get Buttons and Counter Element
/**
 *
 * @returns the first button in the 'btns' array, assumed to be the decrease button.
 */
function getDecreaseBtn() {
  return btns[0];
}
/**
 *
 * @returns the second button in the 'btns' array, assumed to be the reset button.
 */
function getResetBtn() {
  return btns[1];
}
/**
 *
 * @returns the third button in the 'btns' array, assumed to be the increase button.
 */
function getIncreaseBtn() {
  return btns[2];
}
/**
 *
 * @returns the counter element.
 */
function getValue() {
  return counter;
}
/**
 *
 * @returns the initial value of the counter, which is 0.
 */
function getInitialValue() {
  return 0;
}
/**
 *
 * @param {*} value
 * @returns counter color based on the value of the counter
 */
function getCounterColor(value) {
  let countNumber = parseInt(value);

  if (countNumber === 0) {
    return "black";
  } else if (countNumber < 0) {
    return "red";
  } else if (countNumber > 0) {
    return "green";
  }

  return "something went wrong";
}

// Functions to change the counter value

/**
 * @returns the current counter value minus 1.
 */
function decreaseValue() {
  return parseInt(getValue().textContent) - 1;
}
/**
 * @returns the current counter value plus 1.
 */
function increaseValue() {
  return parseInt(getValue().textContent) + 1;
}
/**
 *
 * @returns the initial value of the counter, which is 0.
 */
function resetValue() {
  return getInitialValue();
}

// Event Listeners for Buttons
/**
 * When the button is clicked, the counter's text content is updated to the decreased value.
 */
getDecreaseBtn().addEventListener("click", function () {
  counter.textContent = decreaseValue();
  counter.style.color = getCounterColor(counter.textContent);
});

/**
 * when the button is clicked, the counter's text content is updated to the increased value.
 */
getIncreaseBtn().addEventListener("click", function () {
  counter.textContent = increaseValue();
  counter.style.color = getCounterColor(counter.textContent);
});

/**
 * when the button is clicked, the counter's text content is updated to the initial value.
 */
getResetBtn().addEventListener("click", function () {
  counter.textContent = resetValue();
  counter.style.color = getCounterColor(counter.textContent);
});

// // select buttons
// const btns = document.querySelectorAll(".btn");
// // select counter value
// const counter = document.querySelector("#value");

// function getDecreaseBtn() {
//   return btns[0];
// }

// function getResetBtn() {
//   return btns[1];
// }

// function getIncreaseBtn() {
//   return btns[2];
// }

// function getValue() {
//   return counter;
// }

// function getInitialValue() {
//   return 0;
// }

// function decreaseValue() {
//   return parseInt(getValue().textContent) - 1;
// }

// /**
//  * gets the current value of the counter and increments it by 1
//  * @returns {number} - the incremented value
//  */
// function increaseValue() {
//   return parseInt(getValue().textContent) + 1;
// }

// function resetValue() {
//   return getInitialValue();
// }

// getDecreaseBtn().addEventListener("click", function () {
//   counter.textContent = decreaseValue();
// });

// getIncreaseBtn().addEventListener("click", function () {
//   counter.textContent = increaseValue();
// });

// getResetBtn().addEventListener("click", function () {
//   counter.textContent = resetValue();
// });

// this is a shorter way to do it - suggested by ChatGpt

// Select buttons
// const btns = document.querySelectorAll(".btn");
// // Select counter value
// const counter = document.querySelector("#value");

// function decreaseValue() {
//   return parseInt(counter.textContent) - 1;
// }

// function increaseValue() {
//   return parseInt(counter.textContent) + 1;
// }

// function resetValue() {
//   return 0;
// }

// // Add event listeners directly to the buttons
// btns[0].addEventListener("click", function () {
//   counter.textContent = decreaseValue();
// });

// btns[1].addEventListener("click", function () {
//   counter.textContent = resetValue();
// });

// btns[2].addEventListener("click", function () {
//   counter.textContent = increaseValue();
// });
