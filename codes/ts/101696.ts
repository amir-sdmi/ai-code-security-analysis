import input from './input.txt';
import testInput1 from './input1.test.txt';
import testInput2 from './input2.test.txt';
import { testSolution, type Solution, solve } from '@lib';

const EXPECTED_PART_ONE = 14;
const EXPECTED_PART_TWO = 34;

interface Antenna {
    x: number;
    y: number;
    frequency: string;
}

interface Point {
    x: number;
    y: number;
}

const parseInput = (data: string): { antennas: Antenna[]; bounds: { width: number; height: number } } => {
    const lines = data.trim().split('\n');
    const antennas: Antenna[] = [];

    lines.forEach((line, y) => {
        line.trim()
            .split('')
            .forEach((char, x) => {
                if (char !== '.') {
                    antennas.push({ x, y, frequency: char });
                }
            });
    });

    return {
        antennas,
        bounds: {
            width: lines[0].length,
            height: lines.length,
        },
    };
};

const findAntinodes = (antenna1: Antenna, antenna2: Antenna, bounds: { width: number; height: number }): Point[] => {
    if (antenna1.frequency !== antenna2.frequency) {
        return [];
    }

    const dx = antenna2.x - antenna1.x;
    const dy = antenna2.y - antenna1.y;

    const antinodes: Point[] = [];

    // Calculate points at 1/3 and 2/3 of the distance from antenna1
    const x1 = antenna1.x - dx;
    const y1 = antenna1.y - dy;

    const x2 = antenna2.x + dx;
    const y2 = antenna2.y + dy;

    if (isInBounds({ x: x1, y: y1 }, bounds)) {
        antinodes.push({ x: x1, y: y1 });
    }
    if (isInBounds({ x: x2, y: y2 }, bounds)) {
        antinodes.push({ x: x2, y: y2 });
    }

    return antinodes;
};

const isInBounds = (point: Point, bounds: { width: number; height: number }): boolean => {
    return point.x >= 0 && point.x < bounds.width && point.y >= 0 && point.y < bounds.height;
};

const part1 = async (data: string): Promise<Solution> => {
    const { antennas, bounds } = parseInput(data);
    const antinodes = new Set<string>();

    console.log(antennas, bounds);

    // Check each pair of antennas
    for (let i = 0; i < antennas.length; i++) {
        for (let j = i + 1; j < antennas.length; j++) {
            const newAntinodes = findAntinodes(antennas[i], antennas[j], bounds);
            newAntinodes.forEach((point) => {
                antinodes.add(`${point.x},${point.y}`);
            });
        }
    }

    return antinodes.size;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const findAntinodes2 = (antenna1: Antenna, antenna2: Antenna, bounds: { width: number; height: number }): Point[] => {
    if (antenna1.frequency !== antenna2.frequency) {
        return [];
    }

    const dx = antenna2.x - antenna1.x;
    const dy = antenna2.y - antenna1.y;

    const antinodes: Point[] = [];

    // Calculate all points in line with the two antennas
    const stepX = dx / gcd(Math.abs(dx), Math.abs(dy));
    const stepY = dy / gcd(Math.abs(dx), Math.abs(dy));

    let x = antenna1.x;
    let y = antenna1.y;

    while (isInBounds({ x, y }, bounds)) {
        antinodes.push({ x, y });
        x += stepX;
        y += stepY;
    }

    x = antenna1.x;
    y = antenna1.y;

    while (isInBounds({ x, y }, bounds)) {
        antinodes.push({ x, y });
        x -= stepX;
        y -= stepY;
    }

    return antinodes;
};

// Part 2 takes too long, let's ask Copilot for help
// Part 1 took me 1 hour. Part 2 took me less than a minute with Copilot's help. Crazy.
const part2 = async (data: string): Promise<Solution> => {
    const { antennas, bounds } = parseInput(data);
    const antinodes = new Set<string>();

    // Check each pair of antennas
    for (let i = 0; i < antennas.length; i++) {
        for (let j = i + 1; j < antennas.length; j++) {
            const newAntinodes = findAntinodes2(antennas[i], antennas[j], bounds);

            newAntinodes.forEach((point) => {
                antinodes.add(`${point.x},${point.y}`);
            });
        }
    }

    // Add each antenna position if it is in line with at least one other antenna of the same frequency
    antennas.forEach((antenna) => {
        const sameFrequencyAntennas = antennas.filter((a) => a.frequency === antenna.frequency && a !== antenna);
        if (sameFrequencyAntennas.length > 0) {
            antinodes.add(`${antenna.x},${antenna.y}`);
        }
    });

    return antinodes.size;
};

export const main = async (year: string, day: string) => {
    return Promise.resolve()
        .then(function () {
            return testSolution(year, day, part1, testInput1, EXPECTED_PART_ONE);
        })
        .then(function () {
            return solve(year, day, part1, input);
        })
        .then(function () {
            return testSolution(year, day, part2, testInput2, EXPECTED_PART_TWO);
        })
        .then(function () {
            return solve(year, day, part2, input);
        })
        .then(function () {
            console.log(`DONE: 🎉`);
            process.exit(0);
        })
        .catch((error: Error) => {
            console.error(error.message);
        });
};
