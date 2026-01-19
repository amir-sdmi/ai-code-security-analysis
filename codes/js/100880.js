//1. Two Sum

/*
Example 1:

Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
Example 2:

Input: nums = [3,2,4], target = 6
Output: [1,2]
Example 3:

Input: nums = [3,3], target = 6
Output: [0,1] */

function TwoPointer(arr, target) {

    let pointerOne = 0;
    let PointerTwo = 1;

    while (pointerOne < arr.length - 1) {

        if (arr[pointerOne] + arr[PointerTwo] == target) {
            return [pointerOne, PointerTwo];
        }
        if (arr[pointerOne] + arr[PointerTwo] < target) {
            PointerTwo++;

        } else {
            pointerOne++;
            PointerTwo = pointerOne + 1;
        }

    }


}

console.log(TwoPointer([2, 7, 11, 15], 9));
console.log(TwoPointer([3, 2, 4], 6));
console.log(TwoPointer([3, 3], 6));
console.log(TwoPointer([5, 75, 25], 100));

//time:O(n^2)
// space:O(1)



//it use a two pointers one and two 

//initially i use one=0 and two = 1 
//i use while loop for O(n) time 

// below i use chatgpt for O(n)

function twoSum(nums, target) {
    let map = {};  // to store number and its index

    for (let i = 0; i < nums.length; i++) {
        let diff = target - nums[i];
        if (map.hasOwnProperty(diff)) {
            return [map[diff], i];
        }
        map[nums[i]] = i;
    }
}
