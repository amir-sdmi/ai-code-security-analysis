//-------------------------setters-------------------------//
//--------------------------------------------------------//

const wordOptions = document.querySelector('#word-options')
const backArrow = document.querySelector('#back-arrow')
const word1 = document.querySelector('#word1')
const word2 = document.querySelector('#word2')
const word3 = document.querySelector('#word3')
const word4 = document.querySelector('#word4')
const word5 = document.querySelector('#word5')
const word6 = document.querySelector('#word6')
const word7 = document.querySelector('#word7')
const word8 = document.querySelector('#word8')
const word9 = document.querySelector('#word9')
const word10 = document.querySelector('#word10')
const word11 = document.querySelector('#word11')
const word12 = document.querySelector('#word12')
const wordChoices = document.querySelectorAll(".word-choices")
const nextArrow = document.querySelector('#next-arrow')
const gameGraphic = document.querySelector('#game-graphic')
const selWord1 = document.querySelector('#your-word1')
const selWord2 = document.querySelector('#your-word2')
const selWord3 = document.querySelector('#your-word3')
const selWord4 = document.querySelector('#your-word4')
const selWord5 = document.querySelector('#your-word5')
const selWord6 = document.querySelector('#your-word6')
const selWord7 = document.querySelector('#your-word7')
const selWord8 = document.querySelector('#your-word8')
const selWord9 = document.querySelector('#your-word9')
const selWord10 = document.querySelector('#your-word10')
const notebookWords = document.querySelectorAll('.word-bank')
const selectedWords = document.querySelector('#selected-words')
const submitWords = document.querySelector('.submit')
const newRound = document.querySelector('#new-round')
const finishedPoem = document.querySelector('#finished-poem')
const poemDisplay = document.querySelector('#poem-display')

let currentPage = 1

const write = new Audio('assets/soundFX/write.mp3')
const erase = new Audio('assets/soundFX/erase.mp3')

//-------------------------arrays-------------------------//

const cuteWords = ['snuggle', 'thimble', 'boop', 'sleepy', 'twinkle', 'squishy', 'sweet', 'candy', 'sprinkle', 'daisy', 'bubble', 'giggle', 'toodles', 'flibbertigibbet']

const sillyWords = ['noodle', 'periwinkle', 'jimminies', 'kerfuffle', 'twiddle', 'looky', 'kumquat', 'banana', 'boing', 'doodle', 'bubble', 'dink', 'whoopsie', 'shennanigans']

const happyWords = ['smile', 'spring', 'warm', 'laugh', 'beautiful', 'flower', 'friend', 'love', 'family', 'gift', 'giggle', 'dink', 'bittersweet', 'overjoyed']

const sadWords = ['rain', 'tear', 'frown', 'moody', 'loss', 'pain', 'hurt', 'blue', 'gray', 'colorless', 'toodles', 'whoopsie', 'bittersweet', 'melancholy']

const dramaticWords = ['stage', 'theater', 'curtains','opratic', 'theatrical', 'vivd', 'sensational', 'astonishing', 'efferevescent', 'epic', 'flibbertigibbet', 'shennanigans', 'overjoyed', 'melancholy']

const sharedWords = ['bubble', 'giggle', 'toodles', 'flibbertigibbet', 'dink', 'whoopsie', 'shennanigans', 'bittersweet', 'overjoyed', 'melancholy']

const arrayOfClouds = [cuteWords, sillyWords, happyWords, sadWords, dramaticWords]

const judges = ['cute', 'silly', 'happy', 'sad', 'dramatic']

const judgeGreetings = [`Hi hi! I'm Tori, and this is Boscoe, and we're really excited to be here! Just do your best, okay?`, `Well howdy hey! I'm Herb, and I'll be judging your poems today. As a hint, I always love a good chortle!`, `Hello all! Wonderful to see so many of you here today. I hope we all have fun with this!`, `Oh, hey. I'll be judging your poems. I hope at least some of them are good.`, `Well hello! Greetings and salutations to you all. I am honored to be here today, but remember: Only one of you can journey onward.`]

let wordCloud = []

let page1 = []

let page2 = []

let page3 = []

let pageArray = [page1, page2, page3]

let chosenWords = []

let chosenJudges = []

let currentJudgeGreeting = []

let chosenArrays = []

let turnNumber = 0

//-----------------------chatGPT stuff-----------------------//



async function generatePoem() {
    
    const prompt = `Write me a ${chosenJudges[turnNumber]} poem containing the words ${chosenWords.join(', ')} and using only eight lines. Please make sure the poem is complete.`
    console.log(prompt)

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',  // Or another GPT model like gpt-4, etc.
                messages: [
                    { role: "system", content: "You are a helpful assistant." },  // System-level role
                    { role: "user", content: prompt }  // User input
                ],
                max_tokens: 100,  // Adjust this based on how long you want the poem
                temperature: 0.7  // Adjust for creativity and randomness
            })
        });

        const data = await response.json();
        console.log(data)
        const poem = data.choices[0].message.content.trim()
        let finalPoem = poem.replace(/\n/g, "<br>")
        console.log(poem)
        finishedPoem.innerHTML = finalPoem

    } catch (error) {
        console.error('Error generating poem:', error);
    }
} 

//These lines of code were made with a lot of help from chatGPT and some troubleshooting with the guide of previous questions on stackoverflow.com. I take little to no credit for the work done here. There is a screenshot of the code chatGPT gave in the README that has been updated to what you see above. The following was the prompt: I am making a browser based game using javascript in which players choose ten words from a randomized list of words to fit a prompt. I want to use chatgpt to return a poem using the words the player chose, fitting the tone provided by the game. How would I do this? 


//------------------------functions------------------------//
//---------------------------------------------------------//

const randomArrNum = (arr) => {
    let random = Math.floor(Math.random() * (arr.length - 5))
    //console.log(random)
    return random
}

const populateCloud = (currentArr) => {
    let numbers = []
    for (let i = 0; i < 6; i++) {
        let random=randomArrNum(currentArr)
        if (numbers.includes(random)) {
            i--
        } else {
            numbers.push(random)
            wordCloud.push(currentArr[random])            
        }
    }
    //console.log(wordCloud)
    return wordCloud
}

const populateShared = () => {
    let numbers = []
    for ( let i = 0; i < 6; i++) {
        let random = Math.floor(Math.random() * (sharedWords.length - 1))
        if (numbers.includes(random)) {
            i--
        } else {
            numbers.push(random)
            wordCloud.push(sharedWords[random])
        }
    }
}

const pickJudge = () => {
    chosenJudges.splice(0, chosenJudges.length)
    let numbers = []
    for (let i = 0; i < 3; i++) {
        let number = Math.floor(Math.random() * 5)
        if (numbers.includes(number)) {
            i--
        } else {
            numbers.push(number)
            chosenJudges.push(judges[number])
            chosenArrays.push(arrayOfClouds[number])
            currentJudgeGreeting.push(judgeGreetings[number])
        }
    }
}

populateCloud(cuteWords)
populateCloud(sillyWords)
populateCloud(happyWords)
populateCloud(sadWords)
populateCloud(dramaticWords)
console.log(wordCloud)
populateShared()
console.log(wordCloud)
pickJudge()

const cloudSort = () => {
    wordCloud.sort()
    console.log(wordCloud)
    page1.splice(0, page1.length)
    page2.splice(0, page2.length)
    page3.splice(0, page3.length)
    for (let a = 0; a < 12; a++) {
        page1.push(wordCloud[a])
    }
    for (let b = 12; b < 24; b++) {
        page2.push(wordCloud[b])
    }
    for (let c = 24; c < 36; c++) {
        page3.push(wordCloud[c])
    }
    console.log(page1)
    console.log(page2)
    console.log(page3)
    //console.log(pageArray)
    return pageArray
}

cloudSort()

const updateCloud = (pageNum) => {
    for (i = 0; i < 12; i++) {
        //console.log(`word${i+1}`)
        //console.log(pageNum[i])
        let word = pageNum[i]
        document.querySelector(`#word${i + 1}`).innerHTML = word
    }
}

const setJudgeImage = () => {
    let currentJudge = chosenJudges[turnNumber]
    let currentGreeting = currentJudgeGreeting[turnNumber]
    gameGraphic.setAttribute ('src', `assets/judges/${currentJudge}Judge.png`)
    console.log(`${currentJudge}Judge`)
    alert(currentGreeting)
}

updateCloud(page1)
console.log(chosenJudges)
console.log(chosenArrays)
setJudgeImage()

const nextPage = () => {
    if (currentPage === 1) {
        updateCloud(page2)
        currentPage++
        backArrow.style.opacity = '1'
    } else if (currentPage === 2) {
        updateCloud(page3)
        currentPage++
        nextArrow.style.opacity = '0'
    }
}

const prevPage = () => {
    if (currentPage === 2) {
        updateCloud(page1)
        backArrow.style.opacity = '0'
        currentPage--
        nextArrow.style.opacity='1'
    } else if (currentPage === 3) {
        updateCloud(page2)
        currentPage--
        nextArrow.style.opacity = '1'
    }
}

const addWord = (newWord) => {
    if (chosenWords.includes(newWord)) {
        alert('choose a new word')
    } else {
        console.log(newWord)
        chosenWords.push(newWord)
        console.log(chosenWords)
        write.play()
    }
}

const removeWord = (newWord) => {
    console.log(newWord)
    chosenWords.push(newWord)
    console.log(chosenWords)
    erase.play()
}

const updateNotebook = () => {
    for (let i = 0; i < chosenWords.length; i++) {
        document.querySelector(`#your-word${i+1}`).innerHTML = chosenWords[i]
    }
}

const winner = () => {
    if (turnNumber === 2) {
        gameGraphic.setAttribute('src', 'assets/results/gameWin.png')
        alert('Congrats! You have won the poetry contest!')
        newRound.innerHTML = 'New Game.'
        newRound.style.display = 'flex'
        turnNumber -= 2
    } else {
        gameGraphic.setAttribute ('src', 'assets/results/win.png')
        newRound.innerHTML = 'Next Round!'
        newRound.style.display = 'flex'
        turnNumber++
    }
}

const tryAgain = () => {
    gameGraphic.setAttribute ('src', 'assets/results/lose.png')
    newRound.innerHTML = 'Try Again?'
    newRound.style.display = 'flex'
    pickJudge()
    for (let i = 1; i < turnNumber.length; i++) {
        turnNumber--
    } 
}

const scoreTally = () => {
    let score = 0
    selectedWords.style.display = 'none'
    submitWords.style.display = 'none'
    finishedPoem.innerHTML = 'writing...'
    poemDisplay.style.display = 'flex'
    generatePoem()
    for (i = 0; i < chosenArrays[turnNumber].length; i++) {
        if (chosenArrays[turnNumber].includes(chosenWords[i])) {
            score++
        }
    }
    console.log(score)
    if (turnNumber === 0) {
        if (score >= 5) {
            console.log('winner!')
            winner()
        } else {
            console.log('try again!')
            tryAgain()
        }
    } else if (turnNumber === 1) {
        if (score >= 6) {
            console.log('winner!')
            winner()
        } else {
            console.log('try again')
            tryAgain()
        }
    } else if (turnNumber === 2) {
        if (score >= 7) {
            console.log('winner!')
            winner()
        } else {
            console.log('try again')
            tryAgain()
        }
    }
}

const newTurn = () => {
    console.log(chosenJudges)
    console.log(chosenArrays)
    poemDisplay.style.display = 'none'
    selectedWords.style.display = 'grid'
    submitWords.style.display = 'grid'
    setJudgeImage()
    selWord1.innerHTML = 'Start writing!'
    chosenWords.splice(0, chosenWords.length)
    wordCloud.splice(0, wordCloud.length)
    populateCloud(cuteWords)
    populateCloud(sillyWords)
    populateCloud(happyWords)
    populateCloud(sadWords)
    populateCloud(dramaticWords)
    console.log(wordCloud)
    populateShared()
    console.log(wordCloud)
    cloudSort()
    updateCloud(page1)
    for (let i = 2; i < 11; i++) {
        document.querySelector(`#your-word${i}`).innerHTML = ''
    }
    newRound.style.display = 'none'
    if (currentPage === 3) {
        currentPage --
        prevPage()
    } if (currentPage === 2) {
        prevPage()
    }
}

//---------------------------DOM--------------------------//
//--------------------------------------------------------//

nextArrow.addEventListener('click', () => {
    console.log('next')
    nextPage()
})

backArrow.addEventListener('click', () => {
    console.log('previous')
    prevPage()
})

word1.addEventListener('click', () => {
    const textValue = word1.textContent
    console.log(textValue)
})

wordChoices.forEach((func) => {
    func.addEventListener('click', () => {
        const textValue = func.textContent
        //console.log(textValue)
        if (chosenWords.length < 10) {
            addWord(textValue)
            updateNotebook()
        } else {
            alert('please submit or remove a word')
        }
    })
})

notebookWords.forEach((func1) => {
    func1.addEventListener('click', () => {
        erase.play()
        const textValue = func1.textContent
        chosenWords = chosenWords.filter(word => word !== textValue)
        console.log(textValue)
        console.log(chosenWords)
        updateNotebook()
        document.querySelector(`#your-word${chosenWords.length+1}`).innerHTML = ''
    })
})

submitWords.addEventListener('click', () => {
    if (chosenWords.length < 10) {
        alert(`Finish your poem! You have ${10 - chosenWords.length} more words to go!`)
    } else {
        scoreTally()
        console.log(turnNumber)
    }
})

newRound.addEventListener('click', () => {
    newTurn()
    console.log(turnNumber)
})