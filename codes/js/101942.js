//the website has been iteratively designed using chatGPT to create a basic quiz system. From here I will be implementing the P5.js and data vis but the quiz functionally works. I'll need to add shuffling for questions once I have them. 
let questions = [
    { question: "Where is this tree?", correctAnswer: 1, img: 'c9.PNG' }, // College 9/10 button index
    { question: "Where is this tree?", correctAnswer: 0, img: 'BSOE.PNG' }, // BSOE button index
    { question: "Where is this tree?", correctAnswer: 2, img: 'Crown.PNG' }, // Crown/Merrill button index
    { question: "Where is this tree?", correctAnswer: 6, img: 'RCC.PNG' }, // Oakes/RCC button index
    { question: "Where is this tree?", correctAnswer: 0, img: 'BSOE2.PNG' }, // Porter/Kresge button index
    { question: "Where is this tree?", correctAnswer: 3, img: 'Porter.PNG' }, // Porter button index
    { question: "Where is this tree?", correctAnswer: 5, img: 'Cowell.PNG' }, // Cowell/Stevenson button index
    { question: "Where is this tree?", correctAnswer: 3, img: 'Kresge.PNG' }, // College 9/10 button index
    { question: "Where is this tree?", correctAnswer: 2, img: 'Merrill.PNG' }, // Crown/Merrill button index
    { question: "Where is this tree?", correctAnswer: 4, img: 'Libraries.PNG' } // S&E button index
];

let options = ["BSOE", "College 9/10", "Crown/Merrill", "Porter/Kresge", "Libraries", "Cowell/Stevenson", "Oakes/RCC"];
let buttonPositions = [
    { x: 50, y: 500 },
    { x: 250, y: 450 },
    { x: 450, y: 500 },
    { x: 50, y: 550 },
    { x: 250, y: 550 },
    { x: 450, y: 550 },
    { x: 50, y: 600 }
];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attempts = 0;
let attemptsPerQuestion = Array(questions.length).fill(0);
let timesScored = Array(questions.length).fill(0);
let dots = []; // Array to store positions of red dots

const distanceThreshold = 50; // Maximum distance to consider the answer correct

let resultMessage = '';
let resultColor = '';
let resultOpacity = 255;
let fadeOutTimer;
let currentImage;

function preload() {
    // Preload all images
    questions.forEach(q => {
        q.img = loadImage(q.img);
    });
}

function setup() {
    let canvas = createCanvas(600, 700);
    canvas.parent('canvas-container');
    shuffleQuestions();
    displayQuestion();
    createButton("reimagine").mousePressed(() => seed++);
}

function shuffleQuestions() {
    for (let i = questions.length - 1; i > 0; i--) {
        let j = floor(random(i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
}

function displayQuestion() {
    resultOpacity = 255; // Reset opacity
    currentImage = questions[currentQuestionIndex].img;
    redraw();
}

function draw() {
    drawBackground(); // Draw the provided background

    if (currentQuestionIndex >= questions.length) {
        displayResult();
        return;
    }

    // Draw the question image
    if (currentImage) {
        image(currentImage, 0, 0, width, height / 2); // Display the image at the top half of the canvas
    }

    // Draw the buttons
    for (let i = 0; i < buttonPositions.length; i++) {
        fill(200);
        rect(buttonPositions[i].x, buttonPositions[i].y, 150, 40, 5); // Adjusted the size of the buttons
        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text(options[i], buttonPositions[i].x + 75, buttonPositions[i].y + 20); // Adjusted the position of the text
    }

    // Draw all red dots
    for (let dot of dots) {
        fill(255, 0, 0);
        noStroke();
        ellipse(dot.x, dot.y, 10, 10);
    }

    // Display result message
    if (resultMessage) {
        fill(resultColor.levels[0], resultColor.levels[1], resultColor.levels[2], resultOpacity);
        textSize(16);
        textAlign(CENTER, CENTER);
        text(resultMessage, width / 2, height - 20);

        if (resultOpacity > 0) {
            resultOpacity -= 5; // Fade out effect
        }
    }

    // Display score
    fill(0);
    textSize(14);
    textAlign(RIGHT, TOP);
    text(`Score: ${correctAnswers}`, width - 10, 10);
}

function mousePressed() {
    if (mouseY > height / 2 && mouseY < height) { // Ensure the click is within the bottom half of the canvas
        let dot = { x: mouseX, y: mouseY };
        dots.push(dot);
        checkAnswer(dot);
        redraw();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        dots = []; // Clear dots for the next question
        displayQuestion();
    } else {
        currentQuestionIndex++;
        redraw();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        dots = []; // Clear dots for the previous question
        displayQuestion();
    }
}

function checkAnswer(dot) {
    let currentQuestion = questions[currentQuestionIndex];
    let correctButton = buttonPositions[currentQuestion.correctAnswer];
    let distance = dist(dot.x, dot.y, correctButton.x + 75, correctButton.y + 20); // Center of the button

    attempts++;
    attemptsPerQuestion[currentQuestionIndex]++;

    if (distance <= distanceThreshold) {
        resultMessage = "Correct!";
        resultColor = color('green');
        correctAnswers++;
        timesScored[currentQuestionIndex]++;
        resultOpacity = 255;
        clearTimeout(fadeOutTimer);
        fadeOutTimer = setTimeout(() => {
            resultMessage = '';
            nextQuestion();
        }, 1000); // Clear result and move to next question after 1 second
    } else {
        resultMessage = "Incorrect. Try again.";
        resultColor = color('red');
        resultOpacity = 255;
        clearTimeout(fadeOutTimer);
        fadeOutTimer = setTimeout(() => {
            resultMessage = '';
        }, 1000); // Clear result after 1 second
    }
}

function displayResult() {
    background(255);

    fill(0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Quiz Completed!", width / 2, height / 6);

    // Display attempts and scores bar graph
    let maxAttempts = max(attemptsPerQuestion);
    let maxScore = max(timesScored);

    textSize(16);
    textAlign(CENTER, CENTER);
    text("Attempts and Scores", width / 2, height / 5);

    for (let i = 0; i < questions.length; i++) {
        let barWidth = 30;
        let barSpacing = 40;
        let attemptsBarHeight = map(attemptsPerQuestion[i], 0, maxAttempts, 0, height / 4);
        let scoreBarHeight = map(timesScored[i], 0, maxScore, 0, height / 4);
        
        // Attempts bar
        fill(0, 102, 153);
        rect((i * barSpacing) + width / 2 - questions.length * barSpacing / 2, height / 2, barWidth, -attemptsBarHeight);
        
        // Score bar
        fill(0, 255, 0);
        rect((i * barSpacing) + width / 2 - questions.length * barSpacing / 2 + barWidth + 5, height / 2, barWidth, -scoreBarHeight);
        
        // Display question index below bars
        fill(0);
        textSize(12);
        text(i + 1, (i * barSpacing) + width / 2 - questions.length * barSpacing / 2 + barWidth / 2, height / 2 + 15);
    }

    // Display total score
    textSize(16);
    text(correctAnswers + " out of " + questions.length + " correct", width / 2, height / 2 + 50);
}

let seed = 239;

const dirtColor = "#76552b";
const shadeColor = "#636363";
const stoneColor = "#858290";
const treeColor = "#33330b";

function drawBackground() {
    randomSeed(seed);

    background(100);

    noStroke();

    fill(dirtColor);
    rect(0, 0, width, height);

    fill(treeColor);
    const trees = 700 * random();
    const scrub = mouseX / width;
    for (let i = 0; i < trees; i++) {
        let z = random();
        let x = width * ((random() + (scrub / 50 + millis() / 500000.0) / z) % 1);
        let s = width / 50 / z;
        let y = height / 6 + height / 20 / z;
        let f = y / 10;
        triangle(x, y - s, x - s / 4, y, x + s / 4, y);
        triangle(x, y - s - f, x - s / 4, y - f, x + s / 4, y - f);
        triangle(x, y - s - 2 * f, x - s / 4, y - 2 * f, x + s / 4, y - 2 * f);
    }

    fill(treeColor);
    let trees2 = 15 * random();
    let scrub2 = mouseX / width;
    for (let i = 0; i < trees2; i++) {
        let z = random();
        let x = width * (((scrub2 / 50 + millis() / 500000.0) / z) % 1);
        let s = width / 40 / z;
        let y = height / 6 + height / 20 / z;
        let f = y / 10;
        triangle(x, y - s, x - s / 4, y, x + s / 4, y);
        triangle(x, y - s - f, x - s / 4, y - f, x + s / 4, y - f);
        triangle(x, y - s - 2 * f, x - s / 4, y - 2 * f, x + s / 4, y - 2 * f);
    }
}