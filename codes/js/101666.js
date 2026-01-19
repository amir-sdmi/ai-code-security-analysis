//Nested Objects :-


//An object within an object :-

let phoneDetails =
{
name:"Apple",
model:`14Pro`,
price:`1lakh`,

//Nested object
brandDetails : {
    yearOfLaunch : 2023,
    brand : `i14`,
    brandCode : 1010

}


};

//console.log(phoneDetails);
//{ name:"Apple",
// model:`14Pro`,
// price:`1lakh`,
// brandDetails : {
//     yearOfLaunch : 2023,
//     brand : `i14`,
//     brandCode : 1010
// }
// };





//console.log(phoneDetails["brandDetails"]);
// {
//     yearOfLaunch : 2023,
//     brand : `i14`,
//     brandCode : 1010

// }


//Logging using dot notation.
//console.log(phoneDetails.brandDetails.brandCode);
//1010;


//Logging using square notation.
c//onsole.log(phoneDetails.brandDetails["yearOfLaunch"]);
//2023



///.CodingNinja Problem solving 
//1.
// Create and Modify Objects
// Write a JavaScript program to:
// 1. Create a student object with three properties: name, age, and roll no.
// 2. Create an object address with two properties, City and state and add this object property to the student object.
// 3. Now delete the roll no property.





//IMP:-Tip:=
// Can a function be declared without a name?
// Yes. They are called anonymous functions in Javascript. 
// Usually these functions are supplied as callbacks to another function.








//Code created by chatGpt:-
//Code created with function :-
let main = function () 
{
    // Use it to set the student and address objects
    let student, address;

    function setStudent() {
      // Step 1: Create a student object with three properties: name, age, and roll no.
      student = {
        name: "John Doe",
        age: 20,
        rollNo: "12345"
      };
    }
  
    function setAddressAndUpdateStudent() {
      // Step 2: Create an object address with two properties, City and state.
      address = {
        city: "New York",
        state: "NY"
      };

      // Step 3 : Add this object property to the student object.
      student.address = address;
    }
  
    function deleteRollNumber() {
      // Step 3: Now delete the roll no property.
      delete student.rollNo;
    }
  
    function getStudent() {
      return student;
    }
  
    function getAddress() {
      return address;
    }
  
    return {
      setStudent,
      setAddressAndUpdateStudent,
      deleteRollNumber,
      getStudent,
      getAddress
    };
  };

  // Usage
const instance = main();
instance.setStudent();
console.log("Student Object:");
console.log(instance.getStudent());

instance.setAddressAndUpdateStudent();
console.log("\nStudent Object after adding address:");
console.log(instance.getStudent());

instance.deleteRollNumber();
console.log("\nStudent Object after deleting 'roll no':");
console.log(instance.getStudent());




  

  






















