// this is the final day 2 part 2 program condensed to a shortened version (from index2.js)
// using ChatGPT.
const fs = require('fs');

async function readInput() {
  return fs.readFileSync('input.txt', 'utf-8').split('\n');
}

function checkRow(row) {
  const values = row.split(" ").map(Number);
  let inc = true, dec = true, valid = true;
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - values[i - 1]);
    if (values[i] <= values[i - 1]) inc = false;
    if (values[i] >= values[i - 1]) dec = false;
    if (diff < 1 || diff > 3) valid = false;
  }
  return (inc || dec) && valid;
}

async function puzzle() {
  const rows = await readInput();
  let safeReports = 0;

  rows.forEach(row => {
    if (checkRow(row)) {
      safeReports++;
    } else {
      const values = row.split(" ");
      for (let i = 0; i < values.length; i++) {
        const newRow = values.filter((_, j) => j !== i).join(" ");
        if (checkRow(newRow)) {
          safeReports++;
          break;
        }
      }
    }
  });

  console.log(`${safeReports} reports are safe.`);
}

puzzle();
