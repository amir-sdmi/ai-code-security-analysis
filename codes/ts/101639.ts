//! My Try
// * New try using ChatGPT
//& New things learn

//! Even Number
//& Learn to use filter by own
// const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
// let result:number[] = numbers.filter((val:number)=> val % 2 == 0)
// console.log(result);

//! sum of array digits
// const calculateSum = (nums: Array<number>): number =>  {
//     if (nums.length == 0) {
//         return 0
//     }
//     else {
//         let count: number = 0
//         nums.map((val: number)=>{
//             count += val 
//         })
//         return count
//     }    
// }
// let result: number = calculateSum([])
// console.log(result);

//* sum of array digits
//& use (reduce) to compress the syntex and what the importence of the (reduce)
// const calculateSum = (nums: Array<number>): number => {
//     return nums.reduce((sum:number, val:number)=> sum+= val, 0)
// }
// console.log(calculateSum([1,2,3,4,5,8]));

//! find Longest String
// const findLongestString = (array: Array<string>):string => {
//     let max: string = "";
//     array.map((val:string)=>{
//         if (val.length > max.length){
//             max = val
//         }
//     })
//     return max
// } 
// console.log(findLongestString(["apple", "banana", "cherry", "date"]));

//* find Longest String
// const findLongestString = (array: Array<string>):string => {
//     return array.reduce((long: string, curr: string)=> long.length < curr.length ? curr : long, "")
// }
// console.log(findLongestString(["apple", "banana", "cherry", "date"]));

//! count Character Occurrences 
//& why we use (ForEach) instead of map
//& also use how to define type of a object
// const countCharacterOccurrences = (val: string): {[key:string]:number}=> {
//     let occurrences: {[key: string]:number} = {};
//     if (val.length == 0) {
//         return {}
//     }
//     val.split('').forEach((char:string) => {
//         if (char != " ") {
            
//         if (char in occurrences) {
//         occurrences[char]++;
//         }
//         else{
//             occurrences[char] = 1
//         }
//     }
//     })
//     return occurrences
    
// }
// console.log(countCharacterOccurrences("Hello World"));

//! reverse Words In Sentence
//& Learn why we use (trim) and what the importence in the real world
// const reverseWordsInSentence = (str: string):string => {
//     let array: Array<string>;
//     array = str.trim().split(" ").reverse()
//     return array.join(" ")
// }
// console.log(reverseWordsInSentence("Hello world this is TypeScript"));

//! find First Non Repeated Character 
//& Learn New syntex of for loop (for (const char of stringArr)) and why this things use becase we need result and i don't get with this (foreach) or (map) 
// const findFirstNonRepeatedCharacter = (str: string): string | null => {
//     let occurs: {[key: string]: number} = {};
//     let stringArr: Array<string> = [];
//     stringArr = str.trim().split("")
//     stringArr.forEach((char:string)=>{
//         if (char != " ") {
//             if (char in occurs) {
//                 occurs[char] += 1
//             }
//             else{
//                 occurs[char] = 1;
//             }
//         }
//     })
//     for(const char of stringArr){
//         if (occurs[char] === 1) {
//             return char
//         }
//     }
//     return null
// }

// console.log(findFirstNonRepeatedCharacter("wiss"));

//! is Palindrome
//& Learn '/\s+/g' is " " this is regex use remove all space
// const isPalindrome = (str: string):boolean => {
//     let normalStr: string = str.toLowerCase().trim().split("").join("").replace(/\s+/g, "")
//     let reverseStr: string = normalStr.split("").reverse().join("")
//     return normalStr === reverseStr
    
// }
// console.log(isPalindrome("A man a plan a canal Panama"));

//! length Of Longest Substring
//& Learn how to use (Set) and {sliding Window} 
// const lengthOfLongestSubstring = (str: string):number => {
//     let window: Set<string> = new Set();
//     let left: number = 0;
//     let right: number = 0;
//     let maxLength: number = 0;
//     for (right = 0; right < str.length; right++){
//         while (window.has(str[right])) {
//             window.delete(str[left])
//             left++;
//         }
//         window.add(str[right])
//         maxLength = Math.max(maxLength, right - left + 1); // trouble to understand
//     }
//     return maxLength
// }

// console.log(lengthOfLongestSubstring("abcabcbb"))

//! find Missing Number
//& Learn a new algo think but i don't apply this into my code [Missing number=Sum from 1 to n−Sum of elements in array]
// const findMissingNumber = (arr:Array<number>):number => {
//     let val:number = arr.reduce((sum:number, val:number):number=>sum += val, 0)
//     let count:number = 0
//     for(let i = 0; i <= arr[arr.length-1]; i++){
//         count += i
//     }
//     return count - val
// }
// console.log(findMissingNumber([1, 2, 4, 6, 3, 7, 8]));
// console.log(findMissingNumber([1, 2, 3, 5])); 

//! group Anagrams
// const groupAnagrams = (arr:Array<string>): Array<string> => {
//     let anagram: {[key:string]: string} = {};
//     arr.forEach((str:string)=>{
//         let sortStr:string = str.split("").sort().join("")
//         if (anagram[sortStr]) {
//             anagram[sortStr].push(str);
//         }
//         else{
//             anagram[sortStr] = [str];
//         }
//     })
//     return Object.values(anagram);
// }
// console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));