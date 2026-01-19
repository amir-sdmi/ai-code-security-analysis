var z=10;
function tryit(){
    console.log(z);
}


function exp(){
    
    let x=10;
    let y=20;
    y=y+10
    console.log(x+y);
}
let y=200;
tryit();
exp();
console.log('value of y outside function is '+y);


// this code demonstrates the scope of variables in javascript
// and how let and var are different in nature , while var is function global scoped
// let is block scoped
// so if we declare a variable using let inside a function , it will not be accessible outside the function 
// or lets say we cant acess it in globally

// NOTE: we should always avoid usingv'var' after ES6 , as it is not a good practice to use var

// :> while let varibles using let variables can be updated , cant be redeclared [ref:function exp()]
// :> while var variables can be updated and redeclared
// while const variables cant be updated or redeclared


// https://chat.openai.com/share/574a867a-a814-4b52-a385-9b20eb1e6208 [learn with other examples with chatgpt]







