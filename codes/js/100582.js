// this is the final day 4 part 2 program condensed to a shortened version (from index2.js)
// using ChatGPT.
const fs = require("fs");

async function readInput() {
  return fs.readFileSync("sample.txt", "utf-8").split("\n").map(x => x.split(""));
}

async function puzzle() {
  const grid = await readInput();
  const charsToCheck = ["A", "M"];
  const data = [];

  const directions = [
    { di: -1, dj: 1, name: "upper right" },
    { di: 1, dj: 1, name: "lower right" },
    { di: 1, dj: -1, name: "lower left" },
    { di: -1, dj: -1, name: "upper left" }
  ];

  grid.forEach((row, i) => row.forEach((cell, j) => {
    if (cell === "S") {
      directions.forEach(({ di, dj, name }) => {
        let charsFound = 0;
        charsToCheck.forEach((char, k) => {
          const ni = i + (k + 1) * di;
          const nj = j + (k + 1) * dj;
          if (grid[ni]?.[nj] === char) charsFound++;
        });
        if (charsFound === charsToCheck.length) {
          data.push({ row: i + (di === 1 ? 2 : 0), col: j + (dj === 1 ? 2 : 0) });
        }
      });
    }
  }));

  const counts = data.reduce((acc, obj) => {
    const key = JSON.stringify(obj);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const result = data.map(obj => ({ ...obj, count: counts[JSON.stringify(obj)] }));
  console.log(`How many times does SAM appear? ${result.filter(x => x.count === 2).length / 2}`);
}

puzzle();
