// 1.----------------------------------
// Write a function that takes in a string and returns a new string with every word capitalized. Write your own examples to call the function with.

function capitalizeWords(str) {
  //   const words = str.split(" ");
  //   //   const capitalizedWords = [];

  //   for (let i = 0; i < words.length; i++) {
  //     const word = words[i];
  //     words[i] = word[0].toUpperCase() + word.slice(1).toLowerCase();
  //     // capitalizedWords.push(capitalWord);
  //   }

  //   return words.join(" ");
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

console.log(capitalizeWords("hello world what a beautiful day!"));

// 2.----------------------------------
// Write a function that takes in an object and returns a formatted greeting.
// This is the format of the object -

function formatGreeting({ firstName, lastName, occupation }) {
  // "Hello Rebecca Cohen, have a great day at your job as a Teacher"
  return `Hello ${firstName} ${lastName}, have a great day at your job as a ${occupation}`;
  // return `Hello ${obj.firstName} ${obj.lastName}, have a great day at your job as a ${obj.occupation}`;
  //   return (
  //     "Hello " +
  //     obj.firstName +
  //     " " +
  //     obj.lastName +
  //     ", have a great day at your job as a " +
  //     obj.occupation
  //   );
}

const john = {
  firstName: "John",
  lastName: "Klaus",
  occupation: "Carpenter",
};

const rebecca = {
  firstName: "Rebecca",
  lastName: "Cohen",
  occupation: "Teacher",
};

console.log(formatGreeting(john));

console.log(
  formatGreeting(rebecca) ===
    "Hello Rebecca Cohen, have a great day at your job as a Teacher"
);

// 3.----------------------------------
// Write a function that takes an array of objects and a targetId and returns a formatted string. Each object in the array will have the same structure as the objects from the previous question plus an id. Use chatGPT to create an array of 10 such objects.

/* Example Object
  {
    id: "Tfjso_4M"
    firstName: "John",
    lastName: "Klaus",
    occupation: "Carpenter"
  }
  */
