// // 1) write a prompt that ask the user if he is male or female. if the answer is "male" return "hello sir" if it is "female" return "hello Miss". If the user write another answer, it should return "hello".
// function EVN() {
//     const gender: string | null= prompt("Are you male or female?");

//     if(gender === null) {
//         return document.write("You canceled the prompt");
//     }

    // const lowercaseGender: string = gender.toLowerCase();

//     if (lowercaseGender === "male") {
//         return document.write("Hello sir");
//     } else if (lowercaseGender === "female") {
//         return document.write("Hello Miss");
//     } else {
//         return document.write("Please enter 'male' or 'female'");
//     }
// }

// const greeting: string | void = EVN();
// console.log(greeting);

// // 2) write a function that gets 2 numbers, and return the bigger. (max)
// const num1: number = 5;
// const num2: number = 10;
// function biggerNum(num1: number, num2: number): number {
//     if (num1 > num2) {
//         return num1;
//     } else {
//         return num2;
//     }
// }
// const bigger:number = biggerNum(num1, num2);
// document.write(bigger.toString());

// 3) write a function that gets an array of numbers, and return the number ordered from the smallest to the largest. dont use .sort. dont use chatGPT. you can only search of array in javascript. ([9,4,5,7] ->[4,5,7,9] )
function harry(){
    const harr:number[] = [30,20,10];
    console.log('%c[' + harr.reverse() +'] values in the array asc to dec', 'background: blueviolet; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
}
harry();

function harryTwo(){
const arr:number[] = [5,2,3,4,1];
console.log('%c[' + arr +'] this is the first array', 'background: blue; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
const OOO:number[] = arr.splice(1, 4);
console.log('%c[' + OOO +'] using .splice to remove the first(0) number', 'background: teal; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
OOO.unshift(0, 1);
console.log('%c[' + OOO +'] Using .unshift to add values(0, 1) to the start of the array', 'background: orange; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
const newNewOOO:number[] = OOO.splice(0, 5);
console.log('%c[' + newNewOOO +'] Using .splice again to cut the last number of the array(1)', 'background: red; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
newNewOOO.push(5)
console.log('%c[' + newNewOOO +'] Using .push to add the number (5) to the end of the array', 'background: lime; color: white; display: block; font-family:monospace; font-weight: bold; font-size: 20px; text-shadow: 3px 3px 0 rgb(0,0,0)');
}
harryTwo();