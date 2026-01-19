const fs = require('node:fs');

const base = process.cwd() + '/2024/04/';
const files = [
  { name: 'test', filename: base + 'test.in' },
  { name: 'input', filename: base + 'data.in' },
];

for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
  const file = files[fileIndex];
  console.log(`Reading file: ${file.name}`);

  let data = fs.readFileSync(file.filename, 'utf8'); // Synchronous reading
  const grid = data.split('\n').map(row => row.split(''));

  console.log('Part 1 results:', countWordOccurrences(grid, 'XMAS'));
  console.log('Part 2 results:', countXShapeMAS(grid));
  console.log('Part 2 results2:', countMASInDiagonalPattern(grid));

}

// POWERED BY CHATGPT -.-'
function countWordOccurrences(grid, word) {
  const rows = grid.length;
  const cols = grid[0].length;
  const directions = [
    [0, 1],   // Right
    [0, -1],  // Left
    [1, 0],   // Down
    [-1, 0],  // Up
    [1, 1],   // Down-Right
    [1, -1],  // Down-Left
    [-1, 1],  // Up-Right
    [-1, -1]  // Up-Left
  ];

  let count = 0; // To store the total count of occurrences

  // Helper function to check word in a specific direction
  function checkDirection(x, y, dx, dy) {
    for (let i = 0; i < word.length; i++) {
      const newX = x + i * dx;
      const newY = y + i * dy;
      if (
        newX < 0 || newX >= rows ||
        newY < 0 || newY >= cols ||
        grid[newX][newY] !== word[i]
      ) {
        return false;
      }
    }
    return true;
  }

  // Search the grid
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      if (grid[x][y] === word[0]) { // First letter matches
        for (const [dx, dy] of directions) {
          if (checkDirection(x, y, dx, dy)) {
            count++; // Increment count for each match
          }
        }
      }
    }
  }

  return count; // Return the total count of occurrences
}


// POWERED BY JE! :P
// redo function to count X-shape word
// find all mas in the grid with an x
// like m . s
//      . a .
//      m . s

// mas could be in any direction like mas or sam or both sam sam in x shape

function countXShapeMAS(grid) {
  const word = 'MAS';
  const rows = grid.length;
  const cols = grid[0].length;

  let count = 0;

  // // find all a's in the grid
  // // we should ignore the first row and column because we can't have a full x-mas in the first row or column
  // // hence the x,y  = 1
  // for (let x = 1; x < rows; x++) {
  //   for (let y = 1; y < cols; y++) {
  //     if (grid[x][y] === word[1]) {

  //       if (

  //         (
  //           // normal top left and bottom right
  //           ((x-1 >= 0 && y-1 >= 0 && grid[x-1][y-1] === word[0]) && (x+1 < rows && y+1 < cols && grid[x+1][y+1] === word[2]))  &&
  //           // normal bottom left and top right
  //           ((x-1 >= 0 && y+1 < cols && grid[x-1][y+1] === word[2]) && (x+1 < rows && y-1 >= 0 && grid[x+1][y-1] === word[0]))
  //         ) ||
  //         (
  //           // reversed top left and bottom right
  //           ((x-1 >= 0 && y-1 >= 0 && grid[x-1][y-1] === word[2]) && (x+1 < rows && y+1 < cols && grid[x+1][y+1] === word[0])) &&
  //           // reversed bottom left and top right
  //           ((x-1 >= 0 && y+1 < cols && grid[x-1][y+1] === word[0]) && (x+1 < rows && y-1 >= 0 && grid[x+1][y-1] === word[2]))
  //         )
  //       ) {
  //         console.log('found x-mas a at', x, y);
  //         count++;
  //       }
  //     }
  //   }
  // }
  // POWERED BY CHATGPT -.-'
  for (let x = 1; x < rows - 1; x++) {  // Avoid first and last rows
    for (let y = 1; y < cols - 1; y++) {  // Avoid first and last columns
      if (grid[x][y] === word[1]) {  // Check if the center is 'a'
        // Collect all diagonal elements around the center
        const diagonals = [
          grid[x - 1][y - 1], // Top-left
          grid[x - 1][y + 1], // Top-right
          grid[x + 1][y - 1], // Bottom-left
          grid[x + 1][y + 1]  // Bottom-right
        ];

        // Count occurrences of 'm' and 's' in diagonals
        const mCount = diagonals.filter(cell => cell === word[0]).length;
        const sCount = diagonals.filter(cell => cell === word[2]).length;

        // If there are exactly 2 'm's and 2 's's, we found a valid pattern
        if (mCount === 2 && sCount === 2) {
          console.log('Found X-Mas a at', x, y);
          count++;
        }
      }
    }
  }



  return count;
}

function countMASInDiagonalPattern(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let count = 0;

  // Helper function to check the MAS pattern for a given center
  const isMASPattern = (row, col) => {
      if (row - 1 < 0 || row + 1 >= rows || col - 1 < 0 || col + 1 >= cols) return false;

      // Ensure center is 'a'
      if (matrix[row][col] !== 'a') return false;

      // Check all 4 diagonal combinations for 'm' and 's'
      const diagonals = [
          [row - 1, col - 1, row + 1, col + 1], // Top-left to bottom-right
          [row - 1, col + 1, row + 1, col - 1], // Top-right to bottom-left
          [row + 1, col - 1, row - 1, col + 1], // Bottom-left to top-right
          [row + 1, col + 1, row - 1, col - 1], // Bottom-right to top-left
      ];

      for (const [r1, c1, r2, c2] of diagonals) {
          if (
              (matrix[r1][c1] === 'm' && matrix[r2][c2] === 's') ||
              (matrix[r1][c1] === 's' && matrix[r2][c2] === 'm')
          ) {
              return true;
          }
      }
      return false;
  };

  // Loop through the matrix
  for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
          if (isMASPattern(row, col)) {
              count++;
          }
      }
  }

  return count;
}
