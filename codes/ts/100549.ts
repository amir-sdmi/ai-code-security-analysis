// 1. write a prompt that ask the user if he is male or female. if the answer is "male" return "hello sir" if it is "female" return "hello Miss". If the user write another answer, it should return "hello".

// function userGender(): string {
//   const gender = prompt('Are you male or female?');

//   if (gender === 'male') {
//     return 'Hello sir';
//   } else if (gender === 'female') {
//     return 'Hello Miss';
//   } else {
//     return 'Hello';
//   }
// }

// const greetHello = userGender();
// console.log(greetHello);

// 2. write a function that gets 2 numbers, and return the bigger. (max)
// const num1: number = Number(prompt('Enter a number between  1-100'));
// const num2: number = Number(prompt('Enter another number between 1-100'));
// function findMaxNumber(num1: number, num2: number): number {
//   return Math.max(num1, num2);
// }
// const maxNumber: number = findMaxNumber(num1, num2);
// console.log(`The bigger number is: ${maxNumber}`);

// 3.write a function that gets an array of numbers, and return the number ordered from the smallest to the largest. dont use .sort. dont use chatGPT. you can only search of array in javascript. ([9,4,5,7] ->[4,5,7,9] )

function basicArray(numbers: number[]) {
  const afterSortArray = [];

  while (numbers.length > 0) {
    let minIndex = 0;
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] < numbers[minIndex]) {
        minIndex = i;
      }
    }
    afterSortArray.push(numbers.splice(minIndex, 1)[0]);
  }
  return afterSortArray;
}
const numbers = [9, 44, 17, 2, 1, 0];
const sortedNumbers = basicArray(numbers);
console.log(`Sorted numbers: ${sortedNumbers}`);
