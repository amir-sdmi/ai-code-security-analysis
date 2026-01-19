//this was written by ChatGPT but it doesn't run in the actual program so it doesn't really count
//I only used it to edit the SVG textures

function scalePathData(pathData, scale, precision = 2) {
    // Function to format a number with trailing zeros removed and leading zero removed
    function formatNumber(num) {
        let parsedNum = parseFloat(num);
        if (parsedNum === 0) return '0'; // Special case for zero
        let formattedNum = parsedNum.toFixed(precision).replace(/\.?0+$/, ''); // Remove trailing zeros
        return formattedNum.replace(/^(-?)0+/, '$1'); // Remove leading zero for negative numbers
    }

    // Function to parse and scale a single command in the path data
    function scaleCommand(command, scale, precision) {
        return command.replace(/[+-]?\d*\.?\d+(?:e[+-]?\d+)?/gi, (num) => {
            const parsedNum = parseFloat(num);
            const scaledNum = formatNumber((parsedNum * scale).toFixed(precision));
            return scaledNum;
        });
    }

    // Split the path data into individual commands
    const commands = pathData.match(/([a-zA-Z][^a-zA-Z]*)/g);

    // Scale each command
    const scaledCommands = commands.map(command => scaleCommand(command, scale, precision));

    // Join the scaled commands back into a single string
    let result = scaledCommands.join('').trim();

    // Remove excessive whitespaces and ensure proper formatting
    result = result.replace(/\s*,\s*/g, ','); // Remove spaces around commas
    result = result.replace(/([a-zA-Z])\s+/g, '$1'); // Remove space after letters
    result = result.replace(/\s+([a-zA-Z])/g, '$1'); // Remove space before letters
    result = result.replace(/([+-]?\d+(\.\d+)?)\s+(-)/g, '$1$3'); // Join number with following negative number

    return result;
}