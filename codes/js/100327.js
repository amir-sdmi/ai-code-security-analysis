//oops

//object - collection of properties and methods
// -tolowercase 

// constructor function
// -prototypes
//-classes
// instances(new , this)

// 4 pillars abstraction , encapsulation , inheritance , polimorphism (use chatgpt)


// const user = {
//     username : "naman",
//     logincount : 9,
//     signedin : true,

//     getuserdetail:  function(){
//         console.log("return details from user");
//         console.log(`user name is ${this.username}`);
//     }
// };

// console.log(user.username);
// user.getuserdetail()


function users(username , logincount , signedin){
    this.username = username 
    this.logincount = logincount
    this.signedinc = signedin

    return this;
}

const user1 = new users("naman" , 7 , false);

console.log(user1)