// Code is largely from Dano's example + using copilot to autofill and edit / write new features.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js"
import {
  getDatabase,
  ref,
  set,
  query,
  orderByChild,
  equalTo,
  push,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js"
import { firebaseConfig } from "./firebaseConfig.js"

let myDBID
let authUser
let uiConfig
let loggedIn = false
let localUserEmail = "no email"
let db
let appName = "itpnyu-sharedminds-week5"
let allText = {}

const replicateProxy = "https://replicate-api-proxy.glitch.me"
const textObjects = []
const authContainer = document.createElement("div")

initFirebase()
createUI()

function initFirebase() {
  initFirebaseDB()
  initFirebaseAuthUI()
}

authContainer.id = "firebaseui-auth-container"

function createUI() {
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
  inputBox.disabled = true // Disable the input box by default
  inputBox.style.backgroundColor = "gray" // Set background color to gray
  document.body.appendChild(inputBox)

  // Create and append the Firebase sign-in container
  document.body.appendChild(authContainer)

  // Add event listener to capture input and response
  inputBox.addEventListener("keydown", async function (event) {
    if (event.key === "Enter") {
      const inputValue = inputBox.value
      // Call askForWords with the input value
      const promptText = `These are my thoughts ${inputValue}. Ask me a follow up question to dig deeper into my thoughts. Only ask one question, only ask the question, everything else is unnecessary.`
      const generatedText = await askForWords(promptText)
      console.log("Generated text:", generatedText)
      // Create a new Thought object and display it
      if (generatedText) {
        const thought = new Thought(promptText, generatedText)
        console.log("Thought object JSON:", JSON.stringify(thought, null, 2)) // Log the Thought object as JSON
        thought.display()
        if (authUser) {
          setInFirebase(
            "Thoughts",
            { uid: authUser.uid, input: inputValue, response: generatedText },
            authUser.uid
          )
        } else {
          console.error("authUser is not defined")
        }
      } else {
        console.error("Generated text is null")
      }
      inputBox.value = "" // Clear the input box
      inputBox.style.display = "none" // Hide the input box
      authContainer.style.display = "none" // Hide the Firebase sign-in container
    }
  })
}

function initFirebaseAuthUI() {
  // const authContainer = document.getElementById("firebaseui-auth-container")
  initFirebaseAuth()
}

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
    console.log("API response JSON:", JSON.stringify(proxy_said, null, 2)) // Log the JSON response

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
function createColorButtons(textElement, thought) {
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

      saveTextObjectToFirebase(textObjects[textObjects.length - 1], thought) // Save to Firebase

      // Start fading out the text after a delay
      startFadingText(textElement, color)

      // Create reply input box
      createReplyInputBox(textElement, thought)
    })

    buttonContainer.appendChild(colorButton)
  })

  document.body.appendChild(buttonContainer)
}

// Function to start fading out the text
function startFadingText(textElement, color) {
  // Counter for red text fade times
  let redFadeCounter = 0

  // Calculate the delay based on the color
  let delay
  if (color === "red") {
    delay = 1000 // 1 second
  } else if (color === "green") {
    delay = 2000 // 2 seconds
  } else if (color === "blue") {
    delay = 3000 // 3 seconds
  } else if (color === "orange") {
    delay = 4000 // 4 seconds
  } else if (color === "purple") {
    delay = 5000 // 5 seconds
  } else if (color === "yellow") {
    delay = 6000 // 6 seconds
  } else if (color === "pink") {
    delay = 7000 // 7 seconds
  } else if (color === "cyan") {
    delay = 8000 // 8 seconds
  } else if (color === "magenta") {
    delay = 9000 // 9 seconds
  } else {
    delay = 10000 // 10 seconds
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

        // Start fading out the text again
        startFadingText(textElement, color)
      }
    }, delay)
  }, delay)
}

// Function to create reply input box
function createReplyInputBox(textElement, thought) {
  const replyInputBox = document.createElement("input")
  replyInputBox.setAttribute("type", "text")
  replyInputBox.setAttribute("placeholder", "Reply here")
  replyInputBox.style.position = "absolute"
  replyInputBox.style.left = textElement.style.left

  // Calculate the top position to be right below the text
  const textRect = textElement.getBoundingClientRect()
  replyInputBox.style.top = textRect.bottom + "px"
  replyInputBox.style.fontSize = "20px"
  replyInputBox.style.fontFamily = "Arial"

  // Add event listener to the reply input box
  replyInputBox.addEventListener("keydown", async function (event) {
    if (event.key === "Enter") {
      const replyValue = replyInputBox.value
      console.log("Reply value:", replyValue)

      // Call askForWords with the reply value
      const replyPrompt = `These are my thoughts ${replyValue}. Ask me a follow up question to dig deeper into my thoughts. Only ask one question, only ask the question, everything else is unnecessary.`
      const replyGeneratedText = await askForWords(replyPrompt)
      console.log("Reply generated text:", replyGeneratedText)

      // Add the reply to the Thought object and update the displayed text
      if (replyGeneratedText) {
        thought.addReply(replyPrompt, replyGeneratedText, textElement)
        console.log(
          "Updated Thought object JSON:",
          JSON.stringify(thought, null, 2)
        ) // Log the updated Thought object as JSON
      } else {
        console.error("Reply generated text is null")
      }

      replyInputBox.value = ""
    }
  })

  document.body.appendChild(replyInputBox)
  document.body.appendChild(authContainer)
}

uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      authUser = authResult
      console.log("succesfuly logged in", authResult.user.email)
      if (loggedIn) location.reload() //reboot if this is a change.
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return false
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById("loader").style.display = "none"
    },
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: "popup",
  // signInSuccessUrl: '<url-to-redirect-to-on-success>',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  tosUrl: "<your-tos-url>",
  privacyPolicyUrl: "<your-privacy-policy-url>",
}

export function initFirebaseAuth() {
  firebase.initializeApp(firebaseConfig)
  //this allowed separate tabs to have separate logins
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
  firebase.auth().onAuthStateChanged((firebaseAuthUser) => {
    console.log("my goodness there has been an auth change")
    document.getElementById("signOut").display = "block"
    const inputBox = document.getElementById("inputBox")
    if (!firebaseAuthUser) {
      document.getElementById("name").display = "none"
      document.getElementById("profile-image").display = "none"
      document.getElementById("signOut").style.display = "none"
      console.log("no valid login, sign in again?")
      var ui = new firebaseui.auth.AuthUI(firebase.auth())
      ui.start("#firebaseui-auth-container", uiConfig)
      if (inputBox) {
        inputBox.disabled = true // Disable the input box
        inputBox.style.backgroundColor = "gray" // Set background color to gray
      }
    } else {
      console.log("we have a user", firebaseAuthUser)
      authUser = firebaseAuthUser

      document.getElementById("signOut").style.display = "block"
      localUserEmail = authUser.multiFactor.user.email
      myDBID = authUser.multiFactor.user.uid
      console.log("User", authUser, "myDBID", myDBID)
      document.getElementById("name").innerHTML =
        authUser.multiFactor.user.displayName
      if (authUser.multiFactor.user.photoURL != null)
        document.getElementById("profile-image").src =
          authUser.multiFactor.user.photoURL
      checkForUserInRegularDB(authUser.multiFactor.user)
      // subscribeToUsers()
      if (inputBox) {
        inputBox.disabled = false // Enable the input box
        inputBox.style.backgroundColor = "white" // Set background color to white
      }
    }
  })
}

document.getElementById("signOut").addEventListener("click", function () {
  firebase
    .auth()
    .signOut()
    .then(function () {
      console.log("User signed out")
      location.reload()
    })
    .catch(function (error) {
      console.log("Error:", error)
    })
})

export function checkForUserInRegularDB(user) {
  //write a firebase query to do look for a uid in the database
  console.log("checkForUserInDB", user.uid)
  db = getDatabase()
  let UIDRef = ref(db, appName + "/users/" + user.uid + "/")

  onValue(UIDRef, (snapshot) => {
    if (snapshot.exists()) {
      console.log(snapshot.val())
      let data = snapshot.val()

      console.log("someone by that id in db", myDBID, data)
    } else {
      giveAuthUserRegularDBEntry(authUser)
    }
  })
}

export function giveAuthUserRegularDBEntry(authUser) {
  let testUserTemplate = {
    email: "dan@example.com",
    displayName: "Test User",
    photoURL: "emptyProfile.png",
  }
  console.log("Authuser but no user info in DB yet", authUser, testUserTemplate)
  if (!authUser.displayName) authUser.displayName = authUser.email.split("@")[0]
  let displayName = authUser.displayName ?? testUserTemplate.displayName
  let photoURL = authUser.photoURL ?? testUserTemplate.photoURL
  if (!authUser.displayName) authUser.displayName = testUserTemplate.displayName
  if (!authUser.photoURL) authUser.photoURL = testUserTemplate.photoURL

  const db = getDatabase()
  set(ref(db, appName + "/users/" + authUser.uid + "/"), {
    uid: authUser.uid,
    email: authUser.email,
    displayName: displayName,
    defaultProfileImage: photoURL,
    onlineStatus: "available",
  })
}

export { authUser, uiConfig, loggedIn, localUserEmail }

export function initFirebaseDB() {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  let folder = "texts"
  //get callbacks when there are changes either by you locally or others remotely
  const commentsRef = ref(db, appName + "/" + folder + "/")
  onChildAdded(commentsRef, (data) => {
    allText[data.key] = data.val() //adds it
    console.log("added", data.key, data.val())
    drawAll()
  })
  onChildChanged(commentsRef, (data) => {
    allText[data.key] = data.val()
    console.log("changed", data.key, data.val())
    drawAll()
  })
  onChildRemoved(commentsRef, (data) => {
    console.log("removed", data.key)
    delete allText[data.key] //removes it
    drawAll()
  })
}

export function setInFirebase(folder, data, uid) {
  const dbRef = ref(db, `${appName}/users/${uid}/${folder}/`)
  push(dbRef, data) // Always create a new entry
}

export function saveTextObjectToFirebase(textElement, thought, uid) {
  const textRect = textElement.getBoundingClientRect()
  const data = {
    prompt: thought.prompt,
    response: thought.response,
    replies: thought.replies,
    x: textRect.left,
    y: textRect.top,
    color: textElement.style.color,
  }
  setInFirebase("Thoughts", data, uid)
}

export class Thought {
  constructor(prompt, response) {
    this.prompt = prompt
    this.response = response
    this.replies = []
  }

  display() {
    const text = document.createElement("div")
    text.textContent = this.response
    text.style.position = "absolute"
    text.style.left = inputBox.style.left
    text.style.top = inputBox.style.top
    text.style.fontSize = "30px"
    text.style.fontFamily = "Arial"
    text.style.opacity = "1" // Set opacity to 1
    text.style.transition = "opacity 1s" // Add transition for opacity
    document.body.appendChild(text)

    // Add the new text object to the array
    textObjects.push(text)

    // Create color selection buttons
    createColorButtons(text, this)
  }

  addReply(replyPrompt, replyResponse, textElement) {
    this.prompt = replyPrompt
    this.response = replyResponse
    this.replies.push({ prompt: replyPrompt, response: replyResponse })
    textElement.textContent = replyResponse
  }
}
