/*
    Bubble Sort

    Bubble sort is a simple sorting algorithm that works by repeatedly swapping adjacent elements if they are in the wrong order. The algorithm gets its name from the way smaller elements "bubble" to the top of the list as the algorithm progresses.

    The basic idea of bubble sort is to make several passes through the list, comparing adjacent elements and swapping them if they are in the wrong order. After each pass, the largest element "bubbles" to the top of the list, and the algorithm repeats the process with the remaining elements. The process continues until the list is sorted.

    Time Complexity
        1. Best Case: O(n)
        2. Average Case: O(n^2)
        3. Worst Case: O(n^2)

    Space Complexity: O(1)

    Description and comments created by chatgpt and github copilot
*/

function bubbleSort(data: Array<number>): Array<number>
{   
    for(let j = 0; j < data.length; j++){
        for(let i = 1; i < data.length; i++){
            if(data[i - 1] > data[i]){ // if the previous element is greater than the current element, swap them
                const temp = data[i - 1]; 
                data[i - 1] = data[i];
                data[i] = temp;
            }
        }
    }
    return data;
}

let data:Array<number> = [5, 2, 8, 9, 7, 4, 3, 6, 10, 1];
let result:Array<number> = bubbleSort(data);

console.log(result); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]