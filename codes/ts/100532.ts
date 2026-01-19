
// 1. write a prompt that ask the user if he is male or female. if the answer is "male" return "hello sir" if it is "female" return "hello Miss". If the user write another answer, it should return "hello".

// 2. write a function that gets 2 numbers, and return the bigger one. (max)

// 3. write a function that gets an array of numbers, and return the number ordered from the smallest to the largest. don't use .sort. don't use chatGPT. you can only search of array in javascript. ([9,4,5,7] ->[4,5,7,9] )




// 1
// const gender = prompt("what your gender?")
// function whatgender(){
//    if(gender==="female"){
//       console.log("hello miss")
//    }
//    if(gender==="man"){
//       console.log("hello sir")
//    }
// }
// const result = (whatgender())
// console.log(result)

// 2
// const numberone= prompt("give me a number")
// const newone = parseInt(numberone)
// const numbertwo:string|null= prompt("give me a number")
// const newtwo = parseInt(numbertwo)
// function big(x:number,y:number):undefined{
//    if(newone<newtwo){
//    console.log(newtwo)
//    }else{
//       console.log(newone)
//    }
// }
// console.log(big(newone,newtwo))
// 3
const tom=[5,3,7,2,8,1]
function srabak(tom:any){
   tom.sort()
}
console.log(srabak(tom))


