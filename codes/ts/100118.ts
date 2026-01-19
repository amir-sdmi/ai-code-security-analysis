
//3) write a function that gets an array of numbers, and return the number ordered from the smallest to the largest. dont use .sort. dont use chatGPT. you can only search of array in javascript. ([9,4,5,7] ->[4,5,7,9] )

function numberSort(array) {
  let done = false;
  while (!done) {
    done = true;
    for (let i = 1; i < array.length; i ++) {
      if (array[i - 1] > array[i]) {
        done = false;
        const tmp = array[i - 1];
        array[i - 1] = array[i];
        array[i] = tmp;
      }
    }
  }

  return array;
}

const numbers = [12, 10, 15, 11, 14, 13, 16];
numberSort(numbers);
console.log(numbers);