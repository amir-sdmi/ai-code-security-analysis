//ES6 features

//1.Destructuring

const employeeDetails = {
  firstName : "Rachin",
  lastName : "Ravindra",
  country : "Newzeland",
  profssion : "cricketr",
  jersyNumber : 53,
}

// console.log(`${employeeDetails.firstName},
//   ${employeeDetails.lastName},
//   ${employeeDetails.jersyNumber}`);// this is a hard way to write

  const {
    firstName,
    lastName,
    jersyNumber: shirtNumber,// if u want u can change the name of the variable.
    country,
    profssion

  } = employeeDetails;

  console.log(firstName,lastName, shirtNumber, country,profssion);

 //use chatgpt for better understanding, destructring in array, obj, fun etc... 

//function destructuring

function printDetails({name, age}){
  console.log(`userName:${name}, userAge:${age}`);
}

const user = {name:'vikas', age:24};
printDetails(user);