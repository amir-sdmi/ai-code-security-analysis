//Arrow functions have shorter syntaz
//They do not have this, argumentsm, super or new.target.
//Arrow functions are always anonymous

const a = ["Hydrogen", "Helium", "Lithium", "Beryllium"];

//lets create an array with the lenght of every string in the `a` arrray above:
const aLen = a.map(function (s){
    return s.length
})
console.log(aLen)

//Yeah, this looks much better/consise
const shortyaLen = a.map((s) => s.length);
console.log(shortyaLen)

//Lets go over some examples with ChatGPT san. No args:
const greet = () => {
    return 'Hello!'
}
console.log(greet())

//Lets square a number!
const square = (x) => {
    return x * x;
}
console.log(square(10))

const add = (...numbers) => {
    let result = 0
    for (let number of numbers) {
        result = result + number;
    }
    return result
}
console.log(add(5,6,7))

//You can also have an arrow function with an implicit return.
// This receives x as argument and returns x*2
const double = (x) => x * 2;

//Arrow function as callback!
const squared = [1,2,3,4].map(x => x * x)
console.log(squared)

//Arrow function with destructuring
const person = {
    name: "joe",
    age: 0
};

// This seems to act upon the `name` and `age` attributes of whatever object is passed into the function
// uh-oh, with some templating to boot!
const greet2 = ({ name, age }) => {
    return `Hello ${name}. You're ${age} years old`
}
console.log(greet2(person))