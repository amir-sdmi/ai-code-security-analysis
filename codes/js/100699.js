//var c = 300
let a = 300                        // This is local scope it was outside the scope use chatgpt for better understanding
if (true) {
    let a = 10                       //this is block scope 
    const b = 20
    // console.log("INNER: ", a);

}



// console.log(a);
// console.log(b);
// console.log(c);

function one() {
    const username = "mayank"

    function two() {
        const website = "youtube.com"
        console.log(username);

    }
    //    console.log(website)
    two()

}

// one()

if (true) {
    const username = "narukaji"

if (username === "narukaji") {
    const website = " youtube"
    console.log(username + website);
}
// console.log(website)

}
// console.log(username);

// ------------------------Interesting--------------------------------

console.log(addone(5));

function addone(num) {
    return num + 1
    
}


console.log(addtwo(5));
const addtwo = function(num){
    return num + 2 
}