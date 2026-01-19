//Main Container
const mainContainer = document.querySelector("#main-container")


//Initial Grid
for (i=0; i<16; i++) {
        const columnDivInit = document.createElement("div")
        columnDivInit.classList.add("column-div")
        columnDivInit.style.width = `${650/16}px`
        columnDivInit.style.height = '650px'
        mainContainer.appendChild(columnDivInit)
    } 

const columnsInit = document.querySelectorAll(".column-div")

for (const divInit of columnsInit ) {
    for (i=0; i<16; i++) {
        const singularDivInit = document.createElement("div")
        singularDivInit.classList.add("singular-div")
        singularDivInit.style.height = `${650/16}px` 
        divInit.appendChild(singularDivInit)
    }

const boxes = document.querySelectorAll(".singular-div")
for (const box of boxes) {
    box.addEventListener("dragstart", (e) => e.preventDefault())
    box.addEventListener("mousemove", () => {
    if (event.buttons === 1){
        box.style.backgroundColor = `${color}`
    }
    })
}
}

//Box Count Input
const input = document.querySelector("#size-input")
let userInput
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
        if (input.value >= 16 && input.value <= 200){
            e.preventDefault()
            userInput = input.value
            console.log(userInput)
            createDivs(userInput)
        }
    }
})


//Color Picker
const colorInput = document.querySelector("#color-input")
let color = "black"
const colorHistory = ["black"]

if (color === null) {
    color = "black"
}

colorInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
        e.preventDefault()
        color = `${colorInput.value}`
        colorHistory.push(`${color}`)
        console.log(color)
        console.log(colorHistory)
    }
})

//Eraser
const eraser = document.querySelector(".eraser-button")
eraser.addEventListener("click", (e) => {
    e.preventDefault()
    if (eraser.textContent === "Disabled") {
        eraser.textContent = "Enabled"
        color = "white"
        console.log(colorHistory)
    } else if (eraser.textContent === "Enabled") {
        eraser.textContent = "Disabled"
        color = `${colorHistory[colorHistory.length - 1]}`
        console.log(colorHistory)
    }
})

//Grid Creation Logic
function createDivs(userInput) {

    mainContainer.replaceChildren()

    for (i=0; i<userInput; i++) {
        const columnDiv = document.createElement("div")
        columnDiv.classList.add("column-div")
        columnDiv.style.width = `${650/userInput}px`
        columnDiv.style.height = '650px'
        mainContainer.appendChild(columnDiv)
    } 

    const columns = document.querySelectorAll(".column-div")
    
    for (const div of columns ) {
        for (i=0; i<userInput; i++) {
            const singularDiv = document.createElement("div")
            singularDiv.classList.add("singular-div")
            singularDiv.style.height = `${650/userInput}px` 
            div.appendChild(singularDiv)
        }
    }

    //Drawing Logic
    const boxes = document.querySelectorAll(".singular-div")
    for (const box of boxes) {
        box.addEventListener("dragstart", (e) => e.preventDefault())
        box.addEventListener("mousemove", () => {
        if (event.buttons === 1){
            box.style.backgroundColor = `${color}`
        }
        })
    }
}


/*
Where I left off:
-Trying to fix eraser button using ChatGPT

Features to Add:
-Eraser
-Undo Button

To Do:
-Apply the drawing event listeners to the entire document

Bugs:
-Eraser button is not reverting to previous color after Enabled -> Disabled
-Drawing over canvas even when the mouse is not held down

*/