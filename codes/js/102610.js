// Beginner Friendly Questions

// 1. **Print "Hello, World!"**  
//    - Task: Write a function that prints "Hello, World!" to the console.

console.log("Hello, World!");
   
// 2. **Add Two Numbers**  
//    - Task: Write a function that takes two numbers and returns their sum.  
//    - Test: `sum(3, 5)`  
//    - Expected Output: `8`

function sum(a,b){
  return a+b;
  
}
console.log(sum(3,5))

// 3. **Find the Largest Number**  
//    - Task: Write a function that takes three numbers and returns the largest.  
//    - Test: `findLargest(2, 8, 5)`  
//    - Expected Output: `8`

function sum(a,b,c){
    return Math.max(a,b,c)
  }
  console.log(` Number ${sum(4,5,8)} Is Max `)


// 4. **Check if a Number is Even or Odd**  
//    - Task: Write a function that checks if a number is even or odd.  
//    - Test: `isEven(4)`  
//    - Expected Output: `true`

function OddorEven(Number){
    if(Number%2===0){
      return "Even";
    }else{
      return "Odd";
    }
    
  }
  var result=OddorEven(5)
  console.log(`This Number Is ${result}`)


// 5. **Calculate the Factorial of a Number**  
//    - Task: Write a function that returns the factorial of a number.  
//    - Test: `factorial(5)`  
//    - Expected Output: `120`

var Number=5;
var factorial=1;
for(i=1;i<=Number;i++){
  
  factorial=factorial*i
}

if(Number===0){
  
    console.log(`factorial of ${Number} is one:`)
  }
  else
  {
    console.log(`factorial of this Numberis:`)
  }
console.log(factorial)

// 6. **Reverse a String**  
//    - Task: Write a function that takes a string and returns it reversed.  
//    - Test: `reverseString('hello')`  
//    - Expected Output: `'olleh'`

function reverse_num(str){
    return str.split("").reverse("").join("")
  }
  var output= reverse_num("Hello")
  console.log(output)

// 7. **Check for Palindrome**  
//    - Task: Write a function that checks if a given string is a palindrome.  
//    - Test: `isPalindrome('madam')`  
//    - Expected Output: `true`

var string = "madam"; 
var reverse = "";


for (i = string.length - 1; i >= 0; i--) {
    reverse+= string[i]; 
}
if(reverse===string){
  console.log("True")
}else{
  console.log("False")
}

// 8. **Find the Minimum Number in an Array**  
//    - Task: Write a function that takes an array and returns the smallest number.  
//    - Test: `findMin([3, 1, 4, 1, 5])`  
//    - Expected Output: `1`

function smolest_number(arr){
  return Math.min(...arr);
  }
  const number=[1,2,3,4,5,6];
  const resultofnumber=smolest_number(number);
  console.log(resultofnumber);

// 9. **Sort an Array**  
//    - Task: Write a function that sorts an array of numbers in ascending order.  
//    - Test: `sortArray([3, 1, 4, 1, 5])`  
//    - Expected Output: `[1, 1, 3, 4, 5]`


const numbers = [3, 1, 4, 1, 5];

numbers.sort((a, b) => a - b);

console.log(numbers); 


// 5 min
// use chatgpt


// 10. **Check if a String Contains a Substring**  
//     - Task: Write a function that checks if a string contains another substring.  
//     - Test: `containsSubstring('hello world', 'world')`  
//     - Expected Output: `true`

function findworld(first,second){
  return first.includes(second);
}
var world = ("hello World")
const output=findworld(world,"World")
console.log(output)

//6 min
// small help of chatgpt for sytex 

// 11. **Sum All Elements in an Array**  
//     - Task: Write a function that returns the sum of all numbers in an array.  
//     - Test: `sumArray([1, 2, 3, 4, 5])`  
//     - Expected Output: `15`

const arry=[1,2,3,4,5]
count=0;
  for(i=0;i<arry.length;i++){
    count+=arry[i]
  }
  
console.log(count)


// 12. **Generate Fibonacci Sequence**  
//     - Task: Write a function that generates the first `n` Fibonacci numbers.  
//     - Test: `fibonacci(5)`  
//     - Expected Output: `[0, 1, 1, 2, 3]`

let n = 5; 
let fibonaci = [0, 1]; 
let i = 2;
while (i < n) {
    fibonaci.push(fibonaci[i - 1] + fibonaci[i - 2]); 
    i++;
}

console.log(fibonaci); 



// 13. **Check if a Number is Prime**  
//     - Task: Write a function that checks if a number is prime.  
//     - Test: `isPrime(7)`  
//     - Expected Output: `true`

var number=7;
var count=0;
for(i=2;i<number;i++){
  if(number%2===0){

  
  count=count+1
    
  }
  
}
if(count>1){
    console.log(`False`)
    
  }else{
    console.log(`True`)
  }

// 14. **Count the Number of Vowels in a String**  
//     - Task: Write a function that counts the number of vowels in a given string.  
//     - Test: `countVowels('hello')`  
//     - Expected Output: `2`

var str="hello";

var count=0;

for(i=0;i<str.length;i++){
  if (str[i]==="a"||str[i]==="e"||str[i]==="i"||str[i]==="o"||str[i]==="u"||
  str[i]==="A"||str[i]==="E"||str[i]==="I"||str[i]==="O"||str[i]==="U"){
    count+=1
  }
}
console.log(count)


// 15. **Find the Index of an Element in an Array**  
//     - Task: Write a function that returns the index of a given element in an array. If the element is not found, return -1.  
//     - Test: `findIndex([1, 2, 3, 4, 5], 3)`  
//     - Expected Output: `2`

var ary=[1,2,3,4,5];
var findindex=3;
index_number=-1
for(i=0;i<ary.length;i++){
  if(ary[i]===findindex){
    index_number=i;
    break;
  }
}
console.log(index_number)

// 16. **Remove Duplicates from an Array**  
//     - Task: Write a function that removes duplicate elements from an array.  
//     - Test: `removeDuplicates([1, 2, 2, 3, 4, 4, 5])`  
//     - Expected Output: `[1, 2, 3, 4, 5]`

function remove(arr){
  return [...new Set(arr)];//help for this line
}

var number=[1,1,2,3,4,4,5,6,3]
var fineloutput=remove(number)
console.log(fineloutput)

//4 min
// return [...new Set(arr)]; help for this line


// 17. **Find the Intersection of Two Arrays**  
//     - Task: Write a function that returns an array of the common elements in two arrays.  
//     - Test: `findIntersection([1, 2, 3], [2, 3, 4])`  
//     - Expected Output: `[2, 3]`

function same_number(array1, array2) {
  return array1.filter(element => array2.includes(element));
}

const array1 = [1, 2, 3];
const array2 = [2,3, 4];

const result = same_number(array1, array2);
console.log(result); 

// 18. **Check if Two Strings are Anagrams**  
//     - Task: Write a function that checks if two strings are anagrams of each other.  
//    - Test: `areAnagrams('listen', 'silent')`  
//     - Expected Output: `true`
function compar(A,B){
  return A.toLowerCase().split('').sort().join('')===
  B.toLowerCase().split('').sort().join('')
}
console.log(compar("listen","silent"))


// 19. **Capitalize the First Letter of Each Word**  
//     - Task: Write a function that capitalizes the first letter of each word in a string.  
//     - Test: `capitalizeWords('hello world')`  
//     - Expected Output: `'Hello World'`

var line="hello world"
var world=line.split(" ")
for(i=0;i<world.length;i++){
  world[i]=world[i][0].toUpperCase()+world[i].slice(1)
}
var finel=world.join(" ")
console.log(finel)
// 1 min
// copy past que .8

// 20. **Flatten a Nested Array**  
//     - Task: Write a function that flattens a nested array (an array of arrays) into a single array.  
//     - Test: `flattenArray([1, [2, 3], [4, [5, 6]]])`  
//     - Expected Output: `[1, 2, 3, 4, 5, 6]`

var aray=[1, [2, 3], [4, [5, 6]]]
var op=aray.flat(aray.length)
console.log(op)

// 4 mim
// w3schools

// 21. **Generate a Random Number within a Range**  
//     - Task: Write a function that generates a random number between a given range.  
//     - Test: `randomNumber(1, 10)`  
//     - Expected Output: `A random number between 1 and 10`



// 22. **Check if a String is a Valid Email**  
//     - Task: Write a function that checks if a given string is a valid email address.  
//     - Test: `isValidEmail('test@example.com')`  
//     - Expected Output: `true`



// 23. **Convert Celsius to Fahrenheit**  
//     - Task: Write a function that converts a temperature from Celsius to Fahrenheit.  
//     - Test: `celsiusToFahrenheit(0)`  
//     - Expected Output: `32`

var celsius = 0; 

var fahrenheit = (celsius * 9/5) + 32;

console.log(`${celsius}°C is equal to ${fahrenheit}°F`);

// 24. **Remove a Specific Element from an Array**  
//     - Task: Write a function that removes a specific element from an array.  
//     - Test: `removeElement([1, 2, 3, 4, 5], 3)`  
//     - Expected Output: `[1, 2, 4, 5]`

var ary=[1,2,3,4,5];
var findindex=3;

for(i=0;i<ary.length;i++){
  if(ary[i]===findindex){
    ary.splice(i,1)
    
   
    
  }
}

console.log(ary)


// 6 min
// littele help of chatgpt


// 25. **Find the Second Largest Number in an Array**  
//     - Task: Write a function that returns the second largest number in an array.  
//     - Test: `secondLargest([1, 2, 3, 4, 5])`  
//     - Expected Output: `4`

const numbers = [1, 2, 3, 4, 5];

var B=numbers.sort((a, b) => b - a);

console.log(B[1]); 


// 1 min

// 26. **Find the Longest Word in a String**  
//     - Task: Write a function that returns the longest word in a string.  
//     - Test: `longestWord('The quick brown fox jumped over the lazy dog')`  
//     - Expected Output: `'jumped'`

var str = "The quick brown fox jumped over the lazy dog";


var words = str.split(' ');

var longest = '';


for (let i = 0; i < words.length; i++) {
  if (words[i].length > longest.length) {
    longest = words[i];
  }
}

console.log(longest); 

// 27. **Find the Missing Number in an Array**  
//     - Task: Write a function that finds the missing number in a sequence from 1 to n.  
//     - Test: `findMissingNumber([1, 2, 4, 5, 6])`  
//     - Expected Output: `3`

var array=[1,2,4,5,6]
var  n=6
var sum_number=(n*(n+1))/2

var Array_sum=0
for(i=0;i<array.length;i++){
  Array_sum+=array[i]
}

var mising=sum_number-Array_sum
console.log(mising)

// 28. **Calculate the GCD of Two Numbers**  
//     - Task: Write a function that calculates the greatest common divisor (GCD) of two numbers.  
//     - Test: `gcd(12, 18)`  
//     - Expected Output: `6`



// 29. **Calculate the LCM of Two Numbers**  
//     - Task: Write a function that calculates the least common multiple (LCM) of two numbers.  
//     - Test: `lcm(4, 6)`  
//     - Expected Output: `12`




// 30. **Check for Balanced Parentheses**  
//     - Task: Write a function that checks if a string has balanced parentheses.  
//     - Test: `isBalanced('()')`  
//     - Expected Output: `true`


// 31. **Rotate an Array**  
//     - Task: Write a function that rotates an array by k steps.  
//     - Test: `rotateArray([1, 2, 3, 4, 5], 2)`  
//     - Expected Output: `[4, 5, 1, 2, 3]`



//                                         String Questions

// 1. **Reverse a String**
//    - Task: Write a function that reverses a given string.
//    - Test:
//      ```javascript
//      console.log(reverseString("hello"));
//      ```
//    - Expected Output: `"olleh"`

function reverse_num(str){
  return str.split("").reverse("").join("")
}
var output= reverse_num("Hello")
console.log(output)
                                                    //2 methode

var string = "Hello"; 
var reverse = "";


for (i = string.length - 1; i >= 0; i--) {
    reverse+= string[i]; 
}

console.log(reverse); 


// 2. **Check if a String is a Palindrome**
//    - Task: Write a function that checks if a given string is a palindrome (reads the same forward and backward).
//    - Test:
//      ```javascript
//      console.log(isPalindrome("racecar"));
//      console.log(isPalindrome("hello"));
//      ```
//    - Expected Output:
//      ```javascript
//      true
//      false
//      ```

var string = "natan"; 
var reverse = "";


for (i = string.length - 1; i >= 0; i--) {
    reverse+= string[i]; 
}
if(reverse===string){
  console.log("True")
}else{
  console.log("False")
}

// 3. **Count the Number of Vowels in a String**
//    - Task: Write a function that counts the number of vowels (`a, e, i, o, u`) in a given string.
//    - Test:
//      ```javascript
//      console.log(countVowels("hello world"));
//      ```
//    - Expected Output: `3`

var str="hello world";

var count=0;

for(i=0;i<str.length;i++){
  if (str[i]==="a"||str[i]==="e"||str[i]==="i"||str[i]==="o"||str[i]==="u"||
  str[i]==="A"||str[i]==="E"||str[i]==="I"||str[i]==="O"||str[i]==="U"){
    count+=1
  }
}
console.log(count)

// 4. **Find the First Non-Repeated Character in a String**
//    - Task: Write a function that finds the first non-repeated character in a string.
//    - Test:
//      ```javascript
//      console.log(firstNonRepeatedCharacter("swiss"));
//      ```
//    - Expected Output: `"w"`



// 5. **Count the Number of Words in a String**
//    - Task: Write a function that counts the number of words in a string. Assume words are separated by spaces.
//    - Test:
//      ```javascript
//      console.log(countWords("This is a test string"));
//      ```
//    - Expected Output: `5`

let str = "This is a test string"; 
let wordCount = 0;
let inWord = false;

for (let i = 0; i < str.length; i++) {
    if (str[i] !== ' ') { 
        if (!inWord) { 
            inWord = true;
            wordCount++;
        }
    } else { 
        inWord = false; 
    }
}

console.log("Number of words:", wordCount);


// 6. **Check if Two Strings are Anagrams**
//    - Task: Write a function that checks if two strings are anagrams (contain the same characters in different orders).
//    - Test:
//      ```javascript
//      console.log(areAnagrams("listen", "silent"));
//      console.log(areAnagrams("hello", "world"));
//      ```
//    - Expected Output:
//      ```javascript
//      true
//      false
//      ```

function compar(A,B){
  return A.toLowerCase().split('').sort().join('')===
  B.toLowerCase().split('').sort().join('')
}
console.log(compar("listen","silent"))
console.log(compar("hello", "world"))

// 15 min


// 7. **Replace All Spaces in a String with Hyphens**
//    - Task: Write a function that replaces all spaces in a string with hyphens (`-`).
//    - Test:
//      ```javascript
//      console.log(replaceSpaces("Hello World"));
//      ```
//    - Expected Output: `"Hello-World"`

var space="Hello World";
var remove_space=space.replace(" ","-");
console.log(remove_space)

// 1 min

// 8. **Convert a String to Title Case**
//    - Task: Write a function that converts a string to title case (capitalizes the first letter of each word).
//    - Test:
//      ```javascript
//      console.log(toTitleCase("this is a test string"));
//      ```
//    - Expected Output: `"This Is A Test String"`

var line="this is a test string"
var world=line.split(" ")
for(i=0;i<world.length;i++){
  world[i]=world[i][0].toUpperCase()+world[i].slice(1)
}
var finel=world.join(" ")
console.log(finel)

// 15 min
// littel help of chatgpt

// 9. **Check if a String Contains Only Digits**
//    - Task: Write a function that checks if a string contains only numeric digits.
//    - Test:
//      ```javascript
//      console.log(isNumeric("12345"));
//      console.log(isNumeric("123a5"));
//      ```
//    - Expected Output:
//      ```javascript
//      true
//      false
//      ```

var number="12345a6"

var output="True"

for(i=0;i<number.length;i++){
 if(number[i]<"0"||number[i]>"9"){
    output="False"
  
  }
} 
console.log(output)


// 10. **Remove Duplicates Characters from a String**
//     - Task: Write a function that removes duplicate characters from a string.
//     - Test:
//       ```javascript
//       console.log(removeDuplicates("programming"));
//       ```
//     - Expected Output: `"progamin"`
function better(String){
  return [...new Set(String)].join('')
}
var letter="programming"
var output=better(letter)
console.log(output)





// 11. **Find the Longest Word in a String**
//     - Task: Write a function that finds the longest word in a string.
//     - Test:
//       ```javascript
//       console.log(findLongestWord("The quick brown fox jumped over the lazy dog"));
//       ```
//     - Expected Output: `"jumped"`



// 12. **Capitalize the First Letter of Each Word in a String**
//     - Task: Write a function that capitalizes the first letter of each word in a string.
//     - Test:
//       ```javascript
//       console.log(capitalizeFirstLetters("javascript is fun"));
//       ```
//     - Expected Output: `"Javascript Is Fun"`

var line="javascript is a fun"
var world=line.split(" ")
for(i=0;i<world.length;i++){
  world[i]=world[i][0].toUpperCase()+world[i].slice(1)
}
var finel=world.join(" ")
console.log(finel)

// 1 min
// help of que 8

// 13. **Repeat a String N Times**
//     - Task: Write a function that repeats a given string `n` times.
//     - Test:
//       ```javascript
//       console.log(repeatString("abc", 3));
//       ```
//     - Expected Output: `"abcabcabc"`

var title="abc"
var output=title.repeat(3);
console.log(output)

// <1 min

// 14. **Check if a String Contains a Substring**
//     - Task: Write a function that checks if a string contains a given substring.
//     - Test:
//       ```javascript
//       console.log(containsSubstring("hello world", "world"));
//       console.log(containsSubstring("hello world", "planet"));
//       ```
//     - Expected Output:
//       ```javascript
//       true
//       false
//       ```
var a="hello world!"
var c="hello world"
var B= a.includes("world");
var D=c.includes("planet")
console.log(B);
console.log(D)

// 5 min


// 15. **Convert a String to an Array of Words**
//     - Task: Write a function that converts a string to an array of words.
//     - Test:
//       ```javascript
//       console.log(stringToWords("This is a test"));
//       ```
//     - Expected Output: `["This", "is", "a", "test"]`

var line="This Is A Test"
var Array=line.split(" ");
console.log(Array)

//  7 min


// 16. **Truncate a String**
//     - Task: Write a function that truncates a string to a specified length and adds "..." at the end.
//     - Test:
//       ```javascript
//       console.log(truncateString("This is a long string", 10));
//       ```
//     - Expected Output: `"This is a..."`


var line="This is a long string"
position=10
var swiggy=line.slice(0,position-1)
var dot="..."

var output=swiggy+dot
console.log(output)

// 7 min

// 17. **Check if a String Starts with a Specific Substring**
//     - Task: Write a function that checks if a string starts with a given substring.
//     - Test:
//       ```javascript
//       console.log(startsWith("hello world", "hello"));
//       console.log(startsWith("hello world", "world"));
//       ```
//     - Expected Output:
//       ```javascript
//       true
//       false
//       ```

var str1="hello world"
var str2="hello world"
var output1=str1.startsWith("hello")
var output2=str2.startsWith("world")
console.log(output1)
console.log(output2)

// 6  min


// 18. **Check if a String Ends with a Specific Substring**
//     - Task: Write a function that checks if a string ends with a given substring.
//     - Test:
//       ```javascript
//       console.log(endsWith("hello world", "world"));
//       console.log(endsWith("hello world", "hello"));
//       ```
//     - Expected Output:
//       ```javascript
//       true
//       false
//       ```

var str1="hello world"

var str2="hello world"

var output1=str2.endsWith("hello")

var output2=str1.endsWith("world")

console.log(output2)

console.log(output1)

// 2 min

// 19. **Insert a Substring at a Specific Position in a String**
//     - Task: Write a function that inserts a substring at a specific position in a string.
//     - Test:
//       ```javascript
//       console.log(insertSubstring("Hello World", "Beautiful ", 6));
//       ```
//     - Expected Output: `"Hello Beautiful World"`


var str="Hello World"
var subsring="Beautiful"
var position=6;


var sring_slice1=str.slice(0,position)
var sring_slice2=str.slice(position-1)

var finel=sring_slice1 + subsring + sring_slice2
console.log(finel)

// 10 min

// 20. **Remove All Instances of a Substring**
//     - Task: Write a function that removes all instances of a substring from a string.
//     - Test:
//       ```javascript
//       console.log(removeSubstring("This is a test. This is only a test.", "test"));
//       ```
//     - Expected Output: `"This is a . This is only a ."`

var line="This is a test. This is only a test."
var put=line.replaceAll("test"," ")
console.log(put)

// 2min


//                                               Array Questions

// 1. **Sum All Elements in an Array**  
//    - Task: Write a function that returns the sum of all numbers in an array.  
//    - Test: `sumArray([1, 2, 3, 4, 5])`  
//    - Expected Output: `15`

var ary=[1,2,3,4,5]
var count=0 
for(i=0;i<ary.length;i++){
  count+=ary[i]
}
console.log(count)


// 2. **Find the Largest Number in an Array**  
//    - Task: Write a function that returns the largest number in an array.  
//    - Test: `findLargest([1, 5, 3, 9, 2])`  
//    - Expected Output: `9`

function smolest_number(arr){
  return Math.max(...arr);
  }
  const number=[1,5,3,9,2];
  const resultofnumber=smolest_number(number);
  console.log(resultofnumber);
  

// 3. **Find the Smallest Number in an Array**  
//    - Task: Write a function that returns the smallest number in an array.  
//    - Test: `findSmallest([1, 5, 3, 9, 2])`  
//    - Expected Output: `1`

function smolest_number(arr){
  return Math.min(...arr);
  }
  const number=[1, 5, 3, 9, 2];
  const resultofnumber=smolest_number(number);
  console.log(resultofnumber);
  

// 4. **Sort an Array in Ascending Order**  
//    - Task: Write a function that sorts an array in ascending order.  
//    - Test: `sortArray([5, 2, 9, 1, 5, 6])`  
//    - Expected Output: `[1, 2, 5, 5, 6, 9]`
const numbers = [5, 2, 9, 1, 5, 6];

var B=numbers.sort((a, b) => a - b);

console.log(B); 



// 5. **Sort an Array in Descending Order**  
//    - Task: Write a function that sorts an array in descending order.  
//    - Test: `sortArrayDescending([5, 2, 9, 1, 5, 6])`  
//    - Expected Output: `[9, 6, 5, 5, 2, 1]`

const numbers = [5, 2, 9, 1, 5, 6];

var B=numbers.sort((a, b) => b - a);

console.log(B); 

// 6. **Reverse an Array**  
//    - Task: Write a function that reverses the elements of an array.  
//    - Test: `reverseArray([1, 2, 3, 4, 5])`  
//    - Expected Output: `[5, 4, 3, 2, 1]`

var ary=[1,2,3,4,5]
var new_ary=[];
for(i=ary.length-1;i>=0;i--){
  new_ary.push(ary[i])
}

console.log(new_ary);



// 7. **Check if an Array Contains a Specific Element**  
//    - Task: Write a function that checks if an array contains a specific element.  
//    - Test: `containsElement([1, 2, 3, 4, 5], 3)`  
//    - Expected Output: `true`

var number=[1,2,3,4,5]
var output=number.includes(3)
console.log(output)



// 8. **Find the Index of a Specific Element in an Array**  
//    - Task: Write a function that returns the index of a specific element in an array. If the element is not found, return -1.  
//    - Test: `findIndex([1, 2, 3, 4, 5], 3)`  
//    - Expected Output: `2`

var ary=[1,2,3,4,5];
var findindex=3;
index_number=-1
for(i=0;i<ary.length;i++){
  if(ary[i]===findindex){
    index_number=i;
    break;
  }
}
console.log(index_number)


// 9. **Remove Duplicates from an Array**  
//    - Task: Write a function that removes duplicate elements from an array.  
//    - Test: `removeDuplicates([1, 2, 2, 3, 4, 4, 5])`  
//    - Expected Output: `[1, 2, 3, 4, 5]`

function remove(arr){
  return [...new Set(arr)];//help for this line
}

var number=[1, 2, 2, 3, 4, 4, 5]
var fineloutput=remove(number)
console.log(fineloutput)

// 10. **Merge Two Arrays**  
//     - Task: Write a function that merges two arrays into one.  
//     - Test: `mergeArrays([1, 2, 3], [4, 5, 6])`  
//     - Expected Output: `[1, 2, 3, 4, 5, 6]`

var ary1=[1,2,3];
var ary2=[4,5,6];
var ary=ary1.concat(ary2)
console.log(ary)


// 11. **Find the Intersection of Two Arrays**  
//     - Task: Write a function that returns the intersection of two arrays.  
//     - Test: `findIntersection([1, 2, 3], [2, 3, 4])`  
//     - Expected Output: `[2, 3]`

function same_number(array1, array2) {
  return array1.filter(element => array2.includes(element));
}

const array1 = [1, 2, 3];
const array2 = [2,3, 4];

const result = same_number(array1, array2);
console.log(result); 


// 12. **Find the Union of Two Arrays**  
//     - Task: Write a function that returns the union of two arrays.  
//     - Test: `findUnion([1, 2, 3], [2, 3, 4])`  
//     - Expected Output: `[1, 2, 3, 4]`




// 13. **Check if an Array is Sorted**  
//     - Task: Write a function that checks if an array is sorted in ascending order.  
//     - Test: `isSorted([1, 2, 3, 4, 5])`  
//     - Expected Output: `true`

const numbers = [1, 2, 3, 4, 5];

var B=numbers.sort((a, b) => a - b);

if(numbers===B){
  console.log("True")
} else{
  console.log("false")
}

// 2 min

// 14. **Find the Difference of Two Arrays**  
//     - Task: Write a function that returns the difference of two arrays (elements in the first array that are not in the second array).  
//     - Test: `findDifference([1, 2, 3], [2, 3, 4])`  
//     - Expected Output: `[1]`



// 15. **Rotate an Array by K Positions**  
//     - Task: Write a function that rotates an array by `k` positions.  
//     - Test: `rotateArray([1, 2, 3, 4, 5], 2)`  
//     - Expected Output: `[4, 5, 1, 2, 3]`



// 16. **Find the Maximum Difference Between Two Elements in an Array**  
//     - Task: Write a function that finds the maximum difference between any two elements in an array.  
//     - Test: `maxDifference([2, 3, 10, 6, 4, 8, 1])`  
//     - Expected Output: `8`

var number=[2, 3, 10, 6, 4, 8, 1]
if(number.length<2){
  console.log("flase")
  
}else{
var maxnum=Math.max(...number)
var minnum=Math.min(...number)

  var out=maxnum-minnum
  
console.log(out)  
  
  
}


// 17. **Find the Second Largest Element in an Array**  
//     - Task: Write a function that returns the second largest element in an array.  
//     - Test: `secondLargest([1, 2, 3, 4, 5])`  
//     - Expected Output: `4`

const numbers = [1, 2, 3, 4, 5];

var B=numbers.sort((a, b) => b - a);

console.log(B[1]); 


// 18. **Find the Pair of Elements with the Maximum Sum in an Array**  
//     - Task: Write a function that finds the pair of elements with the maximum sum in an array.  
//     - Test: `maxSumPair([1, 2, 3, 4, 5])`  
//     - Expected Output: `[4, 5]`
var number=[1, 2, 3, 4, 5]

number.sort((a,b) => b-a)
 const max=number[0];
 const max2=number[1]
 console.log(`[${max},${max2}]`)


// 19. **Find the Pair of Elements with the Minimum Sum in an Array**  
//     - Task: Write a function that finds the pair of elements with the minimum sum in an array.  
//     - Test: `minSumPair([1, 2, 3, 4, 5])`  
//     - Expected Output: `[1, 2]`

var number=[1, 2, 3, 4, 5]

number.sort((a,b) => a-b)
 const max=number[0];
 const max2=number[1]
 console.log(`[${max},${max2}]`)

// 20. **Move All Zeros to the End of an Array**  
//     - Task: Write a function that moves all zeros in an array to the end, preserving the order of the other elements.  
//     - Test: `moveZeros([0, 1, 0, 3, 12])`  
//     - Expected Output: `[1, 3, 12, 0, 0]`



// 21. **Count the Frequency of Each Element in an Array**  
//     - Task: Write a function that counts the frequency of each element in an array.  
//     - Test: `countFrequency([1, 2, 2, 3, 3, 3])`  
//     - Expected Output: `{1: 1, 2: 2, 3: 3}`



// 22. **Find the Most Frequent Element in an Array**  
//     - Task: Write a function that finds the most frequent element in an array.  
//     - Test: `mostFrequent([1, 2, 2, 3, 3, 3])`  
//     - Expected Output: `3`



// 23. **Find the Longest Increasing Subsequence in an Array**  
//     - Task: Write a function that finds the longest increasing subsequence in an array.  
//     - Test: `longestIncreasingSubsequence([10, 22, 9, 33, 21, 50, 41, 60, 80])`  
//     - Expected Output: `[10, 22, 33, 50, 60, 80]`



// 24. **Find the Longest Consecutive Sequence in an Array**  
//     - Task: Write a function that finds the longest consecutive sequence in an array.  
//     - Test: `longestConsecutive([100, 4, 200, 1, 3, 2])`  
//     - Expected Output: `4` (sequence is `[1, 2, 3, 4]`)


//                                             Object Questions

// 1. **Create a Simple Object**
//    - Task: Create an object representing a person with properties `name`, `age`, and `city`.
//    - Test:
//      ```javascript
//      const person = createPerson("John", 25, "New York");
//      console.log(person);
//      ```
//    - Expected Output: `{ name: 'John', age: 25, city: 'New York' }`

function profile(obj, property) {
  return obj?.[property];
}


const person = {
  name: "John",
  age: 35,
  city:"New York"
};

profile(person); 

// 2. **Access Object Properties**
//    - Task: Write a function that returns the value of a given property from an object.
//    - Test:
//      ```javascript
//      const obj = { name: 'Alice', age: 30 };
//      console.log(getProperty(obj, 'name'));
//      ```
//    - Expected Output: `'Alice'`

function profile(obj, property) {
  return obj?.[property];
}


const person = {
  name: "John",
  age: 35,
  city:"New York"
};

console.log(profile(person,"name")); 


// 3. **Add a New Property to an Object**
//    - Task: Write a function that adds a new property to an object.
//    - Test:
//      ```javascript
//      const car = { brand: 'Toyota', model: 'Corolla' };
//      addProperty(car, 'year', 2020);
//      console.log(car);
//      ```
//    - Expected Output: `{ brand: 'Toyota', model: 'Corolla', year: 2020 }`
const car = { brand: 'Toyota', model: 'Corolla' };
 car.year="2020"
 console.log(car)


// 4. **Delete a Property from an Object**
//    - Task: Write a function that deletes a property from an object.
//    - Test:
//      ```javascript
//      const user = { username: 'john_doe', password: '12345' };
//      deleteProperty(user, 'password');
//      console.log(user);
//      ```
//    - Expected Output: `{ username: 'john_doe' }`

const user = { username: 'john_doe', password: '12345' };
 
 delete user.password
 console.log(user)


// 5. **Check if an Object has a Property**
//    - Task: Write a function that checks if an object has a specific property.
//    - Test:
//      ```javascript
//      const obj = { name: 'Alice', age: 30 };
//      console.log(hasProperty(obj, 'age'));
//      ```
//    - Expected Output: `true`

var obj={name:"jone",age:25}
console.log('age' in obj)




// 6. **Merge Two Objects**
//    - Task: Write a function that merges two objects into one.
//    - Test:
//      ```javascript
//      const obj1 = { a: 1, b: 2 };
//      const obj2 = { b: 3, c: 4 };
//      console.log(mergeObjects(obj1, obj2));
//      ```
//    - Expected Output: `{ a: 1, b: 3, c: 4 }`

const obj1 = { a: 1, b: 2 };
  const obj2 = { b: 3, c: 4 };

var obj={...obj1,...obj2}
console.log(obj)



// 7. **Clone an Object**
//    - Task: Write a function that creates a deep clone of an object.
//    - Test:
//      ```javascript
//      const original = { name: 'Alice', details: { age: 30, city: 'NYC' } };
//      const clone = cloneObject(original);
//      clone.details.city = 'LA';
//      console.log(original.details.city);
//      console.log(clone.details.city);
//      ```
//    - Expected Output:
//      ```
//      'NYC'
//      'LA'             <=>baki
//      ```
var obj={name:"jone",detail:{age:25,city:"NYC"}}

// console.log(clone)

console.log(obj.detail.city);


// 8. **Loop Through Object Properties**
//    - Task: Write a function that loops through all the properties of an object and prints them.
//    - Test:
//      ```javascript
//      const user = { name: 'John', age: 30, city: 'New York' };
//      printProperties(user);
//      ```
//    - Expected Output:
//      ```
//      name: John
//      age: 30
//      city: New York
//      ```
function profile(obj) {
  for (let key in obj) {
    
    if (obj.hasOwnProperty(key)) {
      console.log(`${key}: ${obj[key]}`);
    }
  }
}


const Object = {
  name: "jone",
  age: 25,
  address: 
    "New York"
    
};

profile(Object);



// 9. **Count the Number of Properties in an Object**
//    - Task: Write a function that counts the number of properties in an object.
//    - Test:
//      ```javascript
//      const obj = { name: 'Alice', age: 30, city: 'NYC' };
//      console.log(countProperties(obj));
//      ```
//    - Expected Output: `3`

const obj = { name: 'Alice', age: 30, city: 'NYC' };
count=0
for(let x in obj){
  count+=1
}
console.log(count)
// 1 min

// 10. **Convert Object to Array of Keys**
//     - Task: Write a function that converts an object to an array of its keys.
//     - Test:
//       ```javascript
//       const obj = { name: 'Alice', age: 30, city: 'NYC' };
//       console.log(objectKeysToArray(obj));
//       ```
//     - Expected Output: `['name', 'age', 'city']`

const obj = { name: 'Alice', age: 30, city: 'NYC' }
 var newArray = Object.keys(obj)
 console.log(newArray)

// 11. **Convert Object to Array of Values**
//     - Task: Write a function that converts an object to an array of its values.
//     - Test:
//       ```javascript
//       const obj = { name: 'Alice', age: 30, city: 'NYC' };
//       console.log(objectValuesToArray(obj));
//       ```
//     - Expected Output: `['Alice', 30, 'NYC']`

const obj = { name: 'Alice', age: 30, city: 'NYC' };
var value_obj=Object.values(obj);
console.log(value_obj)

// 12. **Convert an Array of Objects to a Single Object**
//     - Task: Write a function that converts an array of objects into a single object. Assume each object in the array has a unique `key` property.
//     - Test:
//       ```javascript
//       const arr = [{ key: 'a', value: 1 }, { key: 'b', value: 2 }];
//       console.log(arrayToObject(arr));
//       ```
//     - Expected Output: `{ a: 1, b: 2 }`
function aryobject(arr) {
  return arr.reduce((acc, current) => {
    acc[current.key] = current.value;
    return acc;
  }, {});
}


const arrayOfObjects = [
  { key: 'a', value: 1 },
  { key: 'b', value: 2 }
  
];

const result = aryobject(arrayOfObjects);
console.log(result); 



// full use chatgptr


// 13. **Group Objects by a Property**
//     - Task: Write a function that groups an array of objects by a specific property.
//     - Test:
//       ```javascript
//       const users = [
//         { name: 'Alice', age: 30 },
//         { name: 'Bob', age: 20 },
//         { name: 'Charlie', age: 30 }
//       ];
//       console.log(groupBy(users, 'age'));
//       ```
//     - Expected Output:
//       ```javascript
//       {
//         20: [{ name: 'Bob', age: 20 }],
//         30: [{ name: 'Alice', age: 30 }, { name: 'Charlie', age: 30 }]
//       }
//       ```



// 14. **Find the Object with the Maximum Value of a Property**
//     - Task: Write a function that finds the object with the maximum value of a given property in an array of objects.
//     - Test:
//       ```javascript
//       const users = [
//         { name: 'Alice', age: 30 },
//         { name: 'Bob', age: 20 },
//         { name: 'Charlie', age: 35 }
//       ];
//       console.log(findMax(users, 'age'));
//       ```
//     - Expected Output: `{ name: 'Charlie', age: 35 }`



// 15. **Sum the Values of a Specific Property in an Array of Objects**
//     - Task: Write a function that sums the values of a specific property in an array of objects.
//     - Test:
//       ```javascript
//       const items = [
//         { name: 'item1', price: 10 },
//         { name: 'item2', price: 15 },
//         { name: 'item3', price: 20 }
//       ];
//       console.log(sumProperty(items, 'price'));
//       ```
//     - Expected Output: `45`








