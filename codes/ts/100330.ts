// Mission 1 - write prompt that ask the user if he is male or female.
//  If the answer is "male" return "hello sir"
//  if it is "female" return "hello Miss".
//  If the user write another answer => it should return "hello".

const user : string | null = prompt("what's your gender? Are you a female or male?");

function gender (user) {
    if (user = "Male") {
        return document.write('Hello Sir');
    }
    else (user = "Female") {
        return document.write('Hello Miss');
    }
}


// Mission 2 - write function that gets 2 numbers, and return the bigger.(max)

const a: number = 4;
const b: number = 9;

function theBigger(a: number, b: number): number {
    if (a > b) {
        return (a);
    }
    else (b > a) {
        return (b);
    }
}
;

const bigOne: number = theBigger(a, b);
document.write(bigOne.toString());

// Mission 3 - write function that gets an array of numbers
// And return the number ordered from the smallest to the largest.
// dont use .sort. dont use chatGPT. you can only search of array in javascript. ([9,4,5,7] ->[4,5,7,9] )
