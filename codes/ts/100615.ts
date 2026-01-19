import { GetInput } from "@/helpers/inputGetter";

export default {
    name: 'partTwo',
    async setup() {
        const offset = 10000000000000;
        const regex = /X[+=](\d+), Y[+=](\d+)/g
        const input = (await GetInput(2024, 13)).split("\r\n\r\n");

        let total = 0;

        input.forEach(game => {
            const data = [...game.matchAll(regex)];

            const buttonA: Vector2 = {
                x: parseInt(data[0][1]),
                y: parseInt(data[0][2]),
            };

            const buttonB: Vector2 = {
                x: parseInt(data[1][1]),
                y: parseInt(data[1][2]),
            };

            const prize: Vector2 = {
                x: parseInt(data[2][1]) + offset,
                y: parseInt(data[2][2]) + offset,
            }

            // I cheated with ChatGPT to give me the equations for this part. I didn't have the free time to do advanced math
            const a = parseFloat(((prize.x - buttonB.x * prize.y / buttonB.y) / (buttonA.x - buttonB.x * buttonA.y / buttonB.y)).toFixed(3));
            const b = parseFloat(((prize.y - buttonA.y * a) / buttonB.y).toFixed(3));

            const cost = (3 * a) + b;

            if (cost % 1 == 0) {
                total += cost;
            }
        });

        const solution = total;

        return { solution };
    },
}

interface Vector2 {
    x: number,
    y: number,
}