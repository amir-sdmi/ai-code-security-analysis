// this was generated with chatgpt afterwards
// Example input lines (replace with your own puzzle input)
const fs = require('fs');
const input = fs.readFileSync('./day14.txt', 'utf8')
    .trim()
    .split('\n')
    .map(line => line.trim());

// Space dimensions
const width = 101;
const height = 103;

// Time after which we check positions
const T = 100;

// Parse each line of input to extract initial positions and velocities
const robots = input.map(line => {
    // Line format: p=x,y v=x,y
    const [pPart, vPart] = line.split(" ");
    const pMatch = pPart.match(/p=(-?\d+),(-?\d+)/);
    const vMatch = vPart.match(/v=(-?\d+),(-?\d+)/);

    const pX = parseInt(pMatch[1], 10);
    const pY = parseInt(pMatch[2], 10);
    const vX = parseInt(vMatch[1], 10);
    const vY = parseInt(vMatch[2], 10);

    return { pX, pY, vX, vY };
});

// Function to wrap position correctly
function wrap(value, max) {
    // Modulo that works correctly for negative numbers as well
    const mod = value % max;
    return mod < 0 ? mod + max : mod;
}
// Print the pattern at a given time
function printPatternAtTime(robots, time) {
    // Simulate to the given time
    let simRobots = robots.map(r => ({ ...r }));
    for (let t = 0; t < time; t++) {
        step(simRobots);
    }

    const { minX, maxX, minY, maxY } = getBounds(simRobots);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Initialize a 2D array of '.'
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));

    // Mark robot positions
    for (const r of simRobots) {
        const gx = r.x - minX;
        const gy = r.y - minY;
        grid[gy][gx] = '#';
    }

    // Print the pattern
    for (let row = 0; row < height; row++) {
        console.log(grid[row].join(''));
    }
}


function getBounds(robots) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const r of robots) {
        if (r.x < minX) minX = r.x;
        if (r.x > maxX) maxX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.y > maxY) maxY = r.y;
    }
    return { minX, maxX, minY, maxY };
}

function step(robots) {
    for (const r of robots) {
        r.x += r.vx;
        r.y += r.vy;
    }
}


// Compute positions after T seconds
const finalPositions = robots.map(({ pX, pY, vX, vY }) => {
    const finalX = wrap(pX + vX * T, width);
    const finalY = wrap(pY + vY * T, height);
    return { x: finalX, y: finalY };
});

// Determine quadrant counts
// Middle lines are at x=50 and y=51
// Quadrants:
//   top-left: x<50, y<51
//   top-right: x>50, y<51
//   bottom-left: x<50, y>51
//   bottom-right: x>50, y>51

let topLeft = 0;
let topRight = 0;
let bottomLeft = 0;
let bottomRight = 0;

for (const { x, y } of finalPositions) {
    if (x === 50 || y === 51) {
        // On a dividing line, don't count
        continue;
    } else if (x < 50 && y < 51) {
        topLeft++;
    } else if (x > 50 && y < 51) {
        topRight++;
    } else if (x < 50 && y > 51) {
        bottomLeft++;
    } else if (x > 50 && y > 51) {
        bottomRight++;
    }
}

// Safety factor is the product of the counts in all four quadrants
const safetyFactor = topLeft * topRight * bottomLeft * bottomRight;

console.log("Safety Factor:", safetyFactor);

console.log("Pattern at that time:");
printPatternAtTime(initialRobots, bestTime);
