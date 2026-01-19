// ===================== //
//         Data          //
// ===================== //

// Read the dictionary
// ↪ Word data found here: https://github.com/benjamincrom/scrabble/blob/master/scrabble/dictionary.json
const fs = require("fs");

const allWords = fs.readFileSync("./dictionary.txt", "utf8");

// Format the dictionary to be all uppercase
const dictionary = allWords.split(/\r?\n/);

dictionary.forEach((dictionaryWord, index) => {
    dictionary[index] = dictionaryWord.toUpperCase();
});

// The letters in scrabble with their tile count and points value
// Found here: https://github.com/dariusk/corpora/blob/master/data/games/scrabble.json
const letterData = require("./letter_data.json");

// ========================= //
//         Settings          //
// ========================= //

// Constants that are used as settings for the game

// Probability of not setting a starting board word
const NO_WORD_PROB = 10;

// Minimum letters in the rack
const MIN_RACK_LETTERS = 1;

// Maximum letters in the rack
const MAX_RACK__LETTERS = 7;

// ========================== //
//         Game Setup         //
// ========================== //

const rack = [];
let boardWord = "";
let numOfLettersInRack;
const arrayOfLetters = Object.keys(letterData);

// Check if a board word is to be set or not
// ↪ If yes, set the board word to a random one within the dictionary
if (Math.round(Math.random() * 100) >= NO_WORD_PROB) {
    boardWord = dictionary[Math.ceil(Math.random() * dictionary.length) - 1];

    // Remove the tiles used in the board word from the total tile count
    for (letter of boardWord) {
        letterData[letter].tiles -= 1;
    }
}

// Randomly decide how many letters go in the rack
const randomNumber = Math.round(Math.random() * 10);

// Make sure we don't go below the minimum or over the maximum
if (randomNumber > MIN_RACK_LETTERS && randomNumber < MAX_RACK__LETTERS) {
    numOfLettersInRack = randomNumber;
}
else if (randomNumber <= MIN_RACK_LETTERS) {
    numOfLettersInRack = MIN_RACK_LETTERS;
}
else if (randomNumber >= MAX_RACK__LETTERS) {
    numOfLettersInRack = MAX_RACK__LETTERS;
}

// Fill the rack with random letters
for (let i = 0; i < numOfLettersInRack; i++) {

    // Pick a random letter
    let letter = arrayOfLetters[Math.ceil(Math.random() * arrayOfLetters.length) - 1];

    // If the tiles for that letter are exhausted, pick a new letter
    while (letterData[letter].tiles === 0) {
        letter = arrayOfLetters[Math.ceil(Math.random() * arrayOfLetters.length) - 1];
    }

    // Remove one from count
    letterData[letter].tiles -= 1;

    // Add the letter to the rack
    rack.push(letter);
}

// ================================== //
//         Word Finding Logic         //
// ================================== //

const splitWord = boardWord.split("");
const rackLettersCount = {};

rack.forEach(letter => {
    rackLettersCount[letter] = (rackLettersCount[letter] || 0) + 1;
})

const canFormWord = (dictionaryWord, boardWord) => {

    // Same word cannot be used, only built on
    if (dictionaryWord === boardWord) return false;

    // ====== //
    // Part 1 //
    // ====== //

    // Check if board word is included in the dictionary word 
    // and the rest of the letters are in the rack

    const copyRackLettersCount = { ...rackLettersCount };

    const index = dictionaryWord.indexOf(boardWord);

    // If the board word is in the dictionary word
    if (index !== -1) {
        const before = dictionaryWord.slice(0, index);
        const after = dictionaryWord.slice(index + boardWord.length);
        const extraLetters = before + after;

        // Check if the remaining letters are in the rack or not
        for (const letter of extraLetters) {
            if (copyRackLettersCount[letter]) {
                copyRackLettersCount[letter] -= 1;
            }
            else {
                return false;
            }
        }
        return true;
    }

    // ====== //
    // Part 2 //
    // ====== //

    // Check if the dictionary word can be formed 
    // using only one letter from the board word
    // and the rest from the rack

    let boardLettersUsed = false;

    for (const letter of dictionaryWord) {

        // Check if the letter of the dictionary word is in the rack
        if (copyRackLettersCount[letter]) {
            copyRackLettersCount[letter] -= 1;
        }
        // If not check if we can use it from the board word
        // ↪ Maximum 1 letter can be used
        else if (splitWord.includes(letter) && !boardLettersUsed) {
            boardLettersUsed = true;
        }
        // If a letter from the board word has already been used, this word is invalid
        else {
            return false;
        }
    }

    return true;
}

const results = dictionary.filter(dictionaryWord => {
    return canFormWord(dictionaryWord, boardWord)
});

// =========================== //
//        Results Logic        //
// =========================== //

// If there is a no win scenario, display a message to let the user know.
if (!results.length) {
    console.log(`
=======================
        Results        
=======================

The word on the board was: ${boardWord ? `"${boardWord}"` : "(none)"}

The letters available on the rack were: "${rack.join(", ")}"

Unfortunately no valid word can be made with this combination. Better luck next time!
`);
}
// Display the results
else {
    // Will hold the points value of each word
    const wordPointValue = {};

    // Find the point value for each word in the results array
    results.forEach(resultWord => {

        wordPointValue[resultWord] = 0;

        for (const letter of resultWord) {

            wordPointValue[resultWord] += letterData[letter].points;
        }
    })

    // Generated by ChatGPT
    // ↪ Verified and tested before implementing
    const sortObject = (obj) => {
        return Object.fromEntries(
            Object.entries(obj)
                .sort((a, b) => {
                    // Sort by descending value
                    if (b[1] !== a[1]) return b[1] - a[1];
                    // If values are equal, sort keys alphabetically
                    return a[0].localeCompare(b[0]);
                })
        );
    }

    const sortedResults = sortObject(wordPointValue);

    // ============================= //
    //        Results Display        //
    // ============================= //

    const highestWord = Object.keys(sortedResults)[0];
    const highestPoints = sortedResults[highestWord];

    console.log(`
=======================
        Results        
=======================

The word on the board was: ${boardWord ? `"${boardWord}"` : "(none)"}

The letters available on the rack were: "${rack.join(", ")}"

The highest scoring valid word that can be played is: ${highestWord} worth ${highestPoints} points!
`);
}