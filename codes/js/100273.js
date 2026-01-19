//FIZZBUZZ ALGORITHM

// Divisible by 3 = Fizz
// Divisible by 5 = Buzz
// Divisible by both 3 and 5 = FizzBuzz
// Not divisible by 3 and 5 = same number
//If we pass string,, boolean or anything that is not a number = Not a number

function fizzBuzz(input){
    if (isNaN(input))
        return 'Not a number' //using Nan is better here
    
    else if ((input % 5 === 0) && (input % 3 === 0)) 
        return 'FizzBuzz'
    
    else if (input % 3 === 0)
        return 'Fizz'
    
    else if (input % 5 === 0)
        return 'Buzz'
// else if(input % 5 !== 0 && input % 3 !== 0)
//     return input  
    else
        return input;
    
};
console.log(fizzBuzz(7));



// Challenge faced
//Verifying if the user input was a number
// I solved it by using chatgpt after a while
//All i needed was to use the isNan() method
//another way would have to use the typeof input !==number