//THIS WAS CREATED USING ChatGPT. I DID NOT SOLVE THIS BY MYSELF AND WAS SOLVED BY AN AI.

import {readFileSync} from 'fs'

const input = readFileSync('./Day4/input.txt', 'utf-8');

let input2 = input.split('\r\n')

// Parse the input to extract the ranges of section IDs.
const ranges = input2.map(pair => {
  const [range1, range2] = pair.split(",");
  const [start1, end1] = range1.split("-").map(Number);
  const [start2, end2] = range2.split("-").map(Number);
  return [[start1, end1], [start2, end2]];
});

// Check each pair of ranges to see if one fully contains the other.
let count = 0;
for (const [[start1, end1], [start2, end2]] of ranges) {
  if ((start1 <= start2 && end1 >= end2) || (start2 <= start1 && end2 >= end1)) {
    count++;
  }
}

// Output the number of pairs where one range fully contains the other.
console.log(count); // 2