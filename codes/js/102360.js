// Frequency Counter - sameFrequency
//
// Write a function called sameFrequency. Given two positive integers, find out if the two numbers have the same frequency of digits.
//
//     Your solution MUST have the following complexities:
//
//     Time: O(N)
//
// Sample Input:
//
//     sameFrequency(182,281) // true
// sameFrequency(34,14) // false
// sameFrequency(3589578, 5879385) // true
// sameFrequency(22,222) // false

// my solution at first
// function sameFrequency(num1, num2){
//     if (num1.toString().length !== num1.toString().length) return false;
//     const num1Freq = num1.toString().split('').reduce((accObj, stringNum)=>{
//         accObj[stringNum] ? accObj[stringNum]++ : accObj[stringNum] = 1;
//         return accObj;
//     }, {});
//     const num2Freq = {}
//     for (let stringNum of num2.toString()){
//         num2Freq[stringNum] = ++num2Freq[stringNum] || 1;
//     }
//     for (let num1Count in num1Freq){
//         if (!num2Freq[num1Count]) return false;
//         if (num2Freq[num1Count] !== num1Freq[num1Count]) return false;
//     }
//     return true;
// }

// After consulting with ChatGPT to find a way to do it in 2 loops instead of 3
// function sameFrequency(num1, num2){
//     const num1Arr = num1.toString().split('');
//     const num2Arr = num2.toString().split('');
//     if (num1Arr.length !== num2Arr.length) return false;
//     const freqCounter = {}
//     for (let i = 0; i < num1Arr.length; i++){
//         freqCounter[num1Arr[i]] = (freqCounter[num1Arr[i]] || 0) + 1;
//         freqCounter[num2Arr[i]] = (freqCounter[num2Arr[i]] || 0) - 1;
//     }
//     return parseInt(Object.values(freqCounter).join('')) === 0;
// }

// However, the "clever" way I evaluate in the end
// in an effort to get around the final loop is also O(n) so
// for clarity and effectiveness it is best to do an actual loop

function sameFrequency(num1, num2){
    const num1Arr = num1.toString().split('');
    const num2Arr = num2.toString().split('');
    if (num1Arr.length !== num2Arr.length) return false;
    const freqCounter = {}
    for (let i = 0; i < num1Arr.length; i++){
        freqCounter[num1Arr[i]] = (freqCounter[num1Arr[i]] || 0) + 1;
        freqCounter[num2Arr[i]] = (freqCounter[num2Arr[i]] || 0) - 1;
    }
    for (let freq in freqCounter){
        if (freqCounter[freq] !== 0) return false;
    }
    return true;
}

// console.log(sameFrequency(3589578, 5879385)); // true
// console.log(sameFrequency(34,14));
// console.log(sameFrequency(22,222));

// Frequency Counter / Multiple Pointers - areThereDuplicates
//
// Implement a function called, areThereDuplicates which accepts a variable number of arguments, and checks whether there are any duplicates among the arguments passed in.  You can solve this using the frequency counter pattern OR the multiple pointers pattern.
//
// Examples:
//
//     areThereDuplicates(1, 2, 3) // false
//     areThereDuplicates(1, 2, 2) // true
//     areThereDuplicates('a', 'b', 'c', 'a') // true
//
// Restrictions:
//
// Time - O(n)
//
// Space - O(n)
//
// Bonus:
//
// Time - O(n log n)
//
// Space - O(1)

// Here is the O(n) time complexity and
// O(n) space complexity solution
// function areThereDuplicates(...arr){
//     const freqDist = {}
//     for (let el of arr){
//         freqDist[el] = (freqDist[el] || 0) + 1;
//     }
//     for (let freq in freqDist){
//         if (freqDist[freq] !== 1) return true;
//     }
//     return false;
// }

// function areThereDuplicates(...arr){
//     if (typeof arr[0] === 'number'){
//         arr.sort((a, b) => a - b);
//     } else if (typeof arr[0] === 'string'){
//         arr.sort((a, b) => a.localeCompare(b));
//     } else {
//         return "This program can only test numbers and strings."
//     }
//
//     for (let i = 0, j = 1; j < arr.length; j++, i++){
//         if (arr[i] === arr[j]) return true;
//     }
//     return false;
// }

// instructor's one-liner solution
function areThereDuplicates(...args){
    return new Set(args).size !== args.length;
}

// console.log(areThereDuplicates(1, 2, 3)); // false
// console.log(areThereDuplicates(1, 2, 2)); // true
// console.log(areThereDuplicates('a', 'b', 'c', 'a')); // true

//Multiple Pointers - averagePair
//
// Write a function called averagePair. Given a sorted array of integers and a target average, determine if there is a pair of values in the array where the average of the pair equals the target average. There may be more than one pair that matches the average target.
//
// Bonus Constraints:
//
// Time: O(N)
//
// Space: O(1)
//
// Sample Input:
//
//     averagePair([1,2,3],2.5) // true
//     averagePair([1,3,3,5,6,7,10,12,19],8) // true
//     averagePair([-1,0,3,4,5,6], 4.1) // false
//     averagePair([],4) // false

function averagePair(arr, num){
    if (arr.length === 0) return false;
    let i = 0, j = arr.length - 1;
    while (i < j) {
        let average = (arr[j] + arr [i]) / 2;
        if (average === num) return true;
        else if (average < num) i++;
        else j--;
    }
    return false;
}

// console.log(averagePair([1, 3, 3, 5, 6, 7, 10, 12, 19], 8));
// console.log(averagePair([1, 2, 3], 2.5));
// console.log(averagePair([-1, 0, 3, 4, 5, 6], 4.1));


// Multiple pointers -- isSubSequence
//Write a function called isSubsequence which takes in two strings and checks whether the characters in the first string form a subsequence of the characters in the second string. In other words, the function should check whether the characters in the first string appear somewhere in the second string, without their order changing.
//
// Examples:
//
//     isSubsequence('hello', 'hello world'); // true
//     isSubsequence('sing', 'sting'); // true
//     isSubsequence('abc', 'abracadabra'); // true
//     isSubsequence('abc', 'acb'); // false (order matters)
//
// Your solution MUST have AT LEAST the following complexities:
//
// Time Complexity - O(N + M)
//
// Space Complexity - O(1)

function isSubsequence(str1, str2){
    let i = 0, j = 0;
    while (i < str1.length){
        if (str1[i] === str2[j]){
            if (i === str1.length - 1) return true;
            i++;
            j++;
        } else {
            if (!str2[j]) return false;
            j++;
        }
    }
    return false;
}

// console.log(isSubsequence('hello', 'hello world'));
// console.log(isSubsequence('sing', 'sting'));
// console.log(isSubsequence('abc', 'abracadabra'));
// console.log(isSubsequence('abc', 'acb'));

// check if the first two are the same
// yes - then advance both
// no - then advance the second

//   i
// abc
// acb
//    j


//  i
// sing
// sting
//   k

//   i
// abc
// abracadabra
//   k


// Sliding Window - maxSubarraySum
//
// Given an array of integers and a number, write a function called maxSubarraySum, which finds the maximum sum of a subarray with the length of the number passed to the function.
//
// Note that a subarray must consist of consecutive elements from the original array. In the first example below, [100, 200, 300] is a subarray of the original array, but [100, 300] is not.
//
//     maxSubarraySum([100,200,300,400], 2) // 700
//     maxSubarraySum([1,4,2,10,23,3,1,0,20], 4)  // 39
//     maxSubarraySum([-3,4,0,-2,6,-1], 2) // 5
//     maxSubarraySum([3,-2,7,-4,1,-1,4,-2,1],2) // 5
//     maxSubarraySum([2,3], 3) // null
//
// Constraints:
//
// Time Complexity - O(N)
//
// Space Complexity - O(1)

function maxSubarraySum(arr, num){
    if (arr.length < num) return null;
    let maxSum = 0;
    for (let i = 0; i < num; i++){
        maxSum += arr[i];
    }
    if (num === arr.length) return maxSum;
    let tempSum = maxSum;
    for (let k = num;  k < arr.length; k++){
        tempSum = tempSum - arr[k-num] + arr[k];
        if (tempSum > maxSum) maxSum = tempSum;
    }
    return maxSum;
}

// console.log(maxSubarraySum([100, 200, 300, 400], 2)); // 700
// console.log(maxSubarraySum([1, 4, 2, 10, 23, 3, 1, 0, 20], 4)); // 39
// console.log(maxSubarraySum([2,3], 3)); // null
// console.log(maxSubarraySum([1, 2, 3, 4], 4)) // 10
// console.log(maxSubarraySum([-3, 4, 0, -2, 6, -1], 2)); // 5
// console.log(maxSubarraySum([3, -2, 7, -4, 1, -1, 4, -2, 1], 2)); //5


// Sliding Window - minSubArrayLen
//
// Write a function called minSubArrayLen which accepts two parameters - an array of positive integers and a positive integer.
//
// This function should return the minimal length of a contiguous subarray of which the sum is greater than or equal to the integer passed to the function. If there isn't one, return 0 instead.
// Examples:
//
//     minSubArrayLen([2,3,1,2,4,3], 7) // 2 -> because [4,3] is the smallest subarray
//     minSubArrayLen([2,1,6,5,4], 9) // 2 -> because [5,4] is the smallest subarray
//     minSubArrayLen([3,1,7,11,2,9,8,21,62,33,19], 52) // 1 -> because [62] is greater than 52
//     minSubArrayLen([1,4,16,22,5,7,8,9,10],39) // 3
//     minSubArrayLen([1,4,16,22,5,7,8,9,10],55) // 5
//     minSubArrayLen([4, 3, 3, 8, 1, 2, 3], 11) // 2
//     minSubArrayLen([1,4,16,22,5,7,8,9,10],95) // 0
//
// Time Complexity - O(n)
//
// Space Complexity - O(1)

// Initial solution with troubleshooting outputs
// function minSubArrayLen(arr, num){
//     let i =0, j = 1;
//     let tempSum = arr[i];
//     console.log(`initial tempSum is ${arr[i]}`);
//     let minSumLen = 0;
//     while (j < arr.length){
//         console.log(`i is ${i} and is at ${arr[i]} and j is ${j} and is at ${arr[j]}`);
//         tempSum += arr[j];
//         console.log(`Recalculating tempSum to ${tempSum}`);
//         if (tempSum >= num){
//             minSumLen = j - i + 1;
//             break;
//         }
//         j++;
//     }
//     console.log(`After initial loop, i is ${i} and j is ${j}`);
//     if (minSumLen === 0) return minSumLen;
//     tempSum -= arr[i];
//     i++;
//     console.log(`initial tempSum is ${tempSum}`);
//     while (j < arr.length) {
//         console.log('Starting loop');
//         console.log(`i is at ${i} and is ${arr[i]}`);
//         console.log(`j is at ${j} and is ${arr[j]}`);
//         if (tempSum >= num) {
//             console.log("Tempsum greater than num");
//             console.log(`Recalculating minSumLen, it is now ${j}-${i}+1, which is ${j-i+1}`);
//             minSumLen = j-i + 1;
//             console.log("Tempsum greater than num, moving i forward");
//             i++;
//             console.log(`Recalculating tempSum, equals ${tempSum} - ${arr[i-1]}, which is:`);
//             tempSum -= arr[i-1];
//             console.log(tempSum);
//         } else {
//             console.log("tempSum less than num, moving both forward");
//             console.log(`Recalculating tempSum, equals ${tempSum} - ${arr[i]} + ${arr[j+1]}, which is:`);
//             if (j !== arr.length - 1) tempSum = tempSum - arr[i] + arr[j+1];
//             console.log(tempSum);
//             i++;
//             j++;
//         }
//     }
//     return minSumLen;
// }

// Initial solution with console logs cleaned up
function minSubArrayLen(arr, num){
    let i =0, j = 1;
    let tempSum = arr[i];
    let minSumLen = 0;
    while (j < arr.length){
        tempSum += arr[j];
        if (tempSum >= num){
            minSumLen = j - i + 1;
            break;
        }
        j++;
    }
    if (minSumLen === 0) return minSumLen;
    tempSum -= arr[i];
    i++;
    while (j < arr.length) {
        if (tempSum >= num) {
            minSumLen = j-i + 1;
            i++;
            tempSum -= arr[i-1];
        } else {
            if (j !== arr.length - 1) tempSum = tempSum - arr[i] + arr[j+1];
            i++;
            j++;
        }
    }
    return minSumLen;
}

// console.log(minSubArrayLen([2, 1, 6, 5, 4], 9)); // 2
// console.log(minSubArrayLen([1, 4, 16, 22, 5, 7, 8, 9, 10], 39)); // 3
// console.log(minSubArrayLen([1,4,16,22,5,7,8,9,10],95)); // 0
// console.log(minSubArrayLen([1, 4, 16, 22, 5, 7, 8, 9, 10], 55)); // 5
// console.log(minSubArrayLen([3,1,7,11,2,9,8,21,62,33,19], 52)); // 1
// console.log(minSubArrayLen([2, 1, 6, 5, 4], 9)); // 2
// console.log(minSubArrayLen([2, 3, 1, 2, 4, 3], 7)); // 2

// try this: start i and j at 0
// start a tempSum at the value of arr[0]
// while j is less than the array length
// carry a running sum until you find the sum is greater than num
// at that point, you set your minSubLen
// now you have to move i over by 1 and recalculate
// if the new sum is still greater than num
// you keep moving i over until it isn't
// if it isn't, you move the whole window over
// you recalculate tempSum and if it's greater, adjust minSubLen

// So here
// You start by running
// is 2 >= num?
// no, so move j over
// is 3 >= num?
// no, so move j over
// is 9 >= num?
// yes. So set base minSubLen

// now we contract the window to one less than 3
// so 2, so start i at 1 and j at 2

//  i
// [2,1,6,5,4]
//    j


// OK try this
//minSubArrayLen([1, 4, 16, 22, 5, 7, 8, 9, 10], 39)
// first we calculate the first instance of a subarray with
// a sum greater than 39
// it's 1 through 22, a length of 4 totaling 43
// 1 + 4 = 5 (l2), + 16 = 21 (l3), + 22 = 43 (l4)

// Now we slide the window forward one at i, so it's 4 through 22
// We recalculate the sum, it's now 43-1, which is 42
// so we adjust the minSubLen, move the window forward at i, and
// recalculate the tempSum

// Sliding Window - findLongestSubstring
//
// Write a function called findLongestSubstring, which accepts a string and returns the length of the longest substring with all distinct characters.
//
//     findLongestSubstring('') // 0
//     findLongestSubstring('rithmschool') // 7
//     findLongestSubstring('thisisawesome') // 6
//     findLongestSubstring('thecatinthehat') // 7
//     findLongestSubstring('bbbbbb') // 1
//     findLongestSubstring('longestsubstring') // 8
//     findLongestSubstring('thisishowwedoit') // 6
//
// Time Complexity - O(n)

// Initial solution with debug outputs
// function findLongestSubstring(str){
//     let longestSubstring = 0;
//     if (str.length === 0) return longestSubstring;
//     const map = {}
//     map[str[0]] = 0;
//     let i = 0, j = 1;
//     while (j < str.length){
//         console.log(`At loop start map is ${JSON.stringify(map)}`);
//         console.log(`At loop start i is ${i} and points to ${str[i]}`);
//         console.log(`At loop start j is ${j} and points to ${str[j]}`);
//         if (str[j] in map) {
//             console.log(`found ${str[j]} in map at ${map[str[j]]}`);
//             i = map[str[j]] + 1;
//             map[str[j]] = j;
//             for (let char in map){
//                 if (map[char] < i) delete map[char];
//             }
//             j++;
//             console.log(`indexes moved to ${i} and ${j}`);
//         } else {
//             console.log(`Did not find ${str[j]} in map, so adding it`);
//             map[str[j]] = j;
//             j++;
//             console.log(`indexes moved to ${i} and ${j}`);
//         }
//         if ((j - i) > longestSubstring) longestSubstring = j - i;
//     }
//     return longestSubstring;
// }

function findLongestSubstring(str){
    let longestSubstring = 0;
    if (str.length === 0) return longestSubstring;
    const map = {}
    map[str[0]] = 0;
    let i = 0, j = 1;
    while (j < str.length){
        if (str[j] in map) {
            i = map[str[j]] + 1;
            map[str[j]] = j;
            for (let char in map){
                if (map[char] < i) delete map[char];
            }
            j++;
        } else {
            map[str[j]] = j;
            j++;
        }
        if ((j - i) > longestSubstring) longestSubstring = j - i;
    }
    return longestSubstring;
}

// console.log(findLongestSubstring('rithmschool')); // 7
// console.log(findLongestSubstring('thisisawesome')); // 6
// console.log(findLongestSubstring('thecatinthehat')); // 7
// console.log(findLongestSubstring('bbbbbb')); // 1
// console.log(findLongestSubstring('longestsubstring')); // 8
// console.log(findLongestSubstring('thisishowwedoit')); // 6

// rithmschool
// OK here basically we set the initial window to 0 and 1
// at each iteration we add elements to a map
// the map will be letter:index
// then we extend out the end of the window as long as
// the end does not have a match in the map
// as soon as we do find identity between end and map element
// we move the window start up to map index + 1

// Frequency Counter - constructNote
//
// Write a function called constructNote, which accepts two strings, a message and some letters. The function should return true if the message can be built with the letters that you are given, or it should return false.
//
// Assume that there are only lowercase letters and no space or special characters in both the message and the letters.
//
// Bonus Constraints:
//
// If M is the length of message and N is the length of letters:
//
// Time Complexity: O(M+N)
//
// Space Complexity: O(N)
//
// Examples:
//
//     constructNote('aa', 'abc') // false
//     constructNote('abc', 'dcba') // true
//     constructNote('aabbcc', 'bcabcaddff') // true

// Frequency Counter - findAllDuplicates
//
// Given an array of positive integers, some elements appear twice and others appear once. Find all the elements that appear twice in this array. Note that you can return the elements in any order.
//
//     findAllDuplicates([4,3,2,7,8,2,3,1]) // array with 2 and 3
//     findAllDuplicates([4, 3, 2, 1, 0]) // []
//     findAllDuplicates([4, 3, 2, 1, 0, 1, 2, 3]) // array with 3, 2, and 1
//
// Time Complexity - O(n)

// Frequency Counter / Multiple Pointer - findPair
//
// Given an unsorted array and a number n, find if there exists a pair of elements in the array whose difference is n. This function should return true if the pair exists or false if it does not.
//
//     findPair([6,1,4,10,2,4], 2) // true
//     findPair([8,6,2,4,1,0,2,5,13],1) // true
//     findPair([4,-2,3,10],-6) // true
//     findPair([6,1,4,10,2,4], 22) // false
//     findPair([], 0) // false
//     findPair([5,5], 0) // true
//     findPair([-4,4], -8) // true
//     findPair([-4,4], 8) // true
//     findPair([1,3,4,6],-2) // true
//     findPair([0,1,3,4,6],-2) // true
//
// Part 1 - solve this with the following requirements:
//
// Time Complexity Requirement - O(n)
//
// Space Complexity Requirement - O(n)
//
// Part 2 - solve this with the following requirements:
//
// Time Complexity Requirement - O(n log n)
//
// Space Complexity Requirement - O(1)


