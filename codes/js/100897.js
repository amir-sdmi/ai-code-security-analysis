const inquirer = require('inquirer');
const color = require('color');
const fs = require('fs');
const generateSVG = require('./lib/shapes/shapes');
// created validation for input with ChatGPT
const validateLength = input => {
    return input.length >= 1 && input.length <= 3 || 'Input must be between 1 and 3 characters long.';
}
// created validation for color input with ChatGPT
const validateColor = input => {
    try{
        color(input);
        return true;
    } catch (error){
        return 'Invalid color format. Try all lowercase. Check your spelling.'
    }
}

const questions = [
    {
        type:'input',
        message:'Please input text up to 3 characters?',
        name:'text',
        validate: validateLength,
    },
    {
        type:'input',
        message:'What color would you like the text to be? (keyword or hexadecimal number with #)',
        name:'textColor',
        validate: validateColor
    },
    {
        type:'list',
        message:'Select a shape',
        name:'shape',
        choices: [
            {
                name: 'square',
            },
            {
                name: 'circle',
            },
            {
                name: 'triangle',
            }
        ]
    },
    {
        type:'input',
        message:'What color would you like your shape? (keyword or hexadecimal number with #)',
        name:'shapeColor',
        validate: validateColor
        
    }
    
];

function writeToFile(fileName, data) {
    fs.writeFile(fileName, 
        generateSVG(data), (err) => err ? console.error(err) : console.log('Generated logo.svg'))
}

function init() {
    inquirer.prompt(questions).then((response) => {
        writeToFile('logo.svg',response);
        console.log(response);
    })
}

init();