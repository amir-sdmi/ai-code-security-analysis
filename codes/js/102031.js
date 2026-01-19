// Code is largely from Dano's example + using copilot to autofill and edit / write new features.

const replicateProxy = "https://replicate-api-proxy.glitch.me"

// Get the input box and the canvas element
const canvas = document.createElement("canvas")
canvas.setAttribute("id", "myCanvas")
canvas.style.position = "absolute"
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.left = "0"
canvas.style.top = "0"
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.appendChild(canvas)
console.log("canvas", canvas.width, canvas.height)

const inputBox = document.createElement("input")
inputBox.setAttribute("type", "text")
inputBox.setAttribute("id", "inputBox")
inputBox.setAttribute("placeholder", "Enter text here")
inputBox.style.position = "absolute"
inputBox.style.left = "50%"
inputBox.style.top = "50%"
inputBox.style.transform = "translate(-50%, -50%)"
inputBox.style.zIndex = "100"
inputBox.style.fontSize = "30px"
inputBox.style.fontFamily = "Arial"
document.body.appendChild(inputBox)

// Store text objects
const textObjects = []

// Function to move the input box to a random position
function moveInputToRandomPosition() {
  let randomX, randomY
  let isValidPosition = false

  // Keep generating random positions until a valid one is found
  while (!isValidPosition) {
    randomX = Math.floor(
      Math.random() * (window.innerWidth - inputBox.offsetWidth)
    )
    randomY = Math.floor(
      Math.random() * (window.innerHeight - inputBox.offsetHeight)
    )

    isValidPosition = true
    // Check for overlap with existing text objects
    for (const textObject of textObjects) {
      if (textObject instanceof HTMLElement) {
        // Ensure it's a valid DOM element
        const textRect = textObject.getBoundingClientRect()
        if (
          randomX < textRect.right &&
          randomX + inputBox.offsetWidth > textRect.left &&
          randomY < textRect.bottom &&
          randomY + inputBox.offsetHeight > textRect.top
        ) {
          isValidPosition = false
          break
        }
      }
    }
  }

  inputBox.style.left = randomX + "px"
  inputBox.style.top = randomY + "px"
}

// Create the prompt text element
const txtPrompt = document.createElement("div")
txtPrompt.style.display = "none" // Hide it as it's only used for generating the prompt text
document.body.appendChild(txtPrompt)

// Create the resulting text element
const textDiv = document.createElement("div")
textDiv.id = "resulting_text"
document.body.appendChild(textDiv)

// Add event listener to the input box
inputBox.addEventListener("keydown", async function (event) {
  if (event.key === "Enter") {
    const inputValue = inputBox.value

    // Call askForWords with the input value
    const promptText = `These are my thoughts ${inputValue}. Ask me a follow up question to dig deeper into my thoughts. Only ask one question, only ask the question, everything else is unnecessary.`
    const generatedText = await askForWords(promptText)

    // Replace the input value with the generated text
    if (generatedText) {
      const text = document.createElement("div")
      text.textContent = generatedText
      text.style.position = "absolute"
      text.style.left = inputBox.style.left
      text.style.top = inputBox.style.top
      text.style.fontSize = "30px"
      text.style.fontFamily = "Arial"
      document.body.appendChild(text)

      // Add the new text object to the array
      textObjects.push(text)

      // Create color selection buttons
      createColorButtons(text)
    }

    inputBox.value = ""
    moveInputToRandomPosition()
  }
})

async function askForWords(p_prompt) {
  const data = {
    version: "35042c9a33ac8fd5e29e27fb3197f33aa483f72c2ce3b0b9d201155c7fd2a287",
    input: {
      prompt: p_prompt,
    },
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  }

  const url = replicateProxy + "/create_n_get/"

  try {
    const words_response = await fetch(url, options)
    if (!words_response.ok) {
      throw new Error(`HTTP error! status: ${words_response.status}`)
    }
    const proxy_said = await words_response.json()

    if (!proxy_said.output || proxy_said.output.length === 0) {
      return null
    } else {
      return proxy_said.output.join("")
    }
  } catch (error) {
    console.error("Error fetching words:", error)
    return null
  }
}

// Function to create color selection buttons
function createColorButtons(textElement) {
  const colorOptions = [
    "red",
    "green",
    "blue",
    "orange",
    "purple",
    "yellow",
    "pink",
    "cyan",
    "magenta",
    "black",
  ] // Example colors
  const buttonContainer = document.createElement("div")
  buttonContainer.style.position = "absolute"
  buttonContainer.style.left = textElement.style.left

  // Calculate the top position to be right below the text
  const textRect = textElement.getBoundingClientRect()
  buttonContainer.style.top = textRect.bottom + "px"

  colorOptions.forEach((color) => {
    const colorButton = document.createElement("button")
    colorButton.textContent = color
    colorButton.style.backgroundColor = color

    // Add event listener to the color button
    colorButton.addEventListener("click", () => {
      textElement.style.color = color

      // Hide the color buttons
      buttonContainer.style.display = "none"

      // Create and display the opacity slider
      createOpacitySlider(textElement, color, buttonContainer)
    })

    buttonContainer.appendChild(colorButton)
  })

  document.body.appendChild(buttonContainer)
}

// Function to create the opacity slider
function createOpacitySlider(textElement, color, container) {
  const sliderContainer = document.createElement("div")
  sliderContainer.style.position = "absolute"
  sliderContainer.style.left = container.style.left // Same left position
  sliderContainer.style.top = container.style.top // Same top position

  const opacitySlider = document.createElement("input")
  opacitySlider.type = "range"
  opacitySlider.min = "0"
  opacitySlider.max = "1"
  opacitySlider.step = "0.01"
  opacitySlider.value = "1" // Initial opacity is 1 (fully opaque)

  // Style the slider track and thumb to match the text color
  opacitySlider.style.background = "lightgray" // Use a light gray for the track
  opacitySlider.style.WebkitAppearance = "none" // Required for custom styles in some browsers
  opacitySlider.style.height = "8px" // Adjust height as needed
  opacitySlider.style.borderRadius = "4px" // Adjust border radius as needed

  // Style the slider thumb
  opacitySlider.style.cursor = "pointer"
  opacitySlider.style.width = "50px" // Increased width
  opacitySlider.style.height = "10px" // Increased height
  opacitySlider.style.background = color

  // Add transition to textElement for smooth opacity change
  textElement.style.transition = "opacity 1s"

  // Counter for red text fade times
  let redFadeCounter = 0

  // Update event listener to change opacity directly
  opacitySlider.addEventListener("input", () => {
    const opacity = opacitySlider.value
    textElement.style.opacity = opacity

    // Hide the slider after adjusting the opacity
    opacitySlider.style.display = "none"

    // Calculate the delay based on the opacity value
    let delay
    if (color === "red") {
      delay = opacity * 1000 // 1% = 1 second
    } else if (color === "green") {
      delay = opacity * 2000 // 1% = 2 second
    } else if (color === "blue") {
      delay = opacity * 3000 // 1% = 3 second
    } else if (color === "orange") {
      delay = opacity * 4000 // 1% = 4 second
    } else if (color === "purple") {
      delay = opacity * 5000 // 1% = 5 second
    } else if (color === "yellow") {
      delay = opacity * 6000 // 1% = 6 second
    } else if (color === "pink") {
      delay = opacity * 7000 // 1% = 7 second
    } else if (color === "cyan") {
      delay = opacity * 8000 // 1% = 8 second
    } else if (color === "magenta") {
      delay = opacity * 9000 // 1% = 9 second
    } else {
      delay = opacity * 10000 // 10 times slower
    }

    // Start fading out the text after the calculated delay
    setTimeout(() => {
      textElement.style.opacity = "0"

      // Wait for the same amount of time while the text is at zero opacity
      setTimeout(() => {
        if (color !== "black") {
          if (color === "red") {
            redFadeCounter++
            if (redFadeCounter >= 3) {
              // Remove the text element after fading 3 times
              textElement.remove()
              return
            }
          }

          // Reset the text to 100% opacity
          textElement.style.opacity = "1"

          // Reset the slider value to 1 and display it again
          opacitySlider.value = "1"
          opacitySlider.style.display = "block"
        }
      }, delay)
    }, delay)
  })
  sliderContainer.appendChild(opacitySlider)
  document.body.appendChild(sliderContainer)
}

// Helper function to get RGB components from color name
function getColorComponents(colorName) {
  const tempElement = document.createElement("div")
  tempElement.style.color = colorName
  document.body.appendChild(tempElement)
  const computedStyle = getComputedStyle(tempElement)
  const rgbString = computedStyle.color // e.g., "rgb(255, 0, 0)"
  document.body.removeChild(tempElement) // Clean up
  const rgbValues = rgbString.slice(4, -1).split(",").map(Number)
  return rgbValues // Returns [255, 0, 0] for "red"
}
