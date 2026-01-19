const response = document.getElementById('response');
const synth = window.speechSynthesis;

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  synth.speak(utter);
  response.innerText = text;
}

async function askChatGPT(question) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer https://replit.com/@ANGADGAMER321/Monday-backend-1?s=app"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    })
  });

  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content || "Sorry, I couldn’t think of a response.";
  speak(answer);
}

function startListening() {
  if (!('webkitSpeechRecognition' in window)) {
    speak("Sorry, your browser doesn't support voice recognition.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.start();

  recognition.onresult = function (event) {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("You said:", command);

    // Simple commands
    if (command.includes("open youtube")) {
      response.innerHTML = `YouTube: <a href="https://youtube.com" target="_blank">Click here</a>`;
    } else if (command.includes("open instagram")) {
      response.innerHTML = `Instagram: <a href="https://instagram.com" target="_blank">Click here</a>`;
    } else {
      // Use ChatGPT for all other responses
      askChatGPT(command);
    }
  };

  recognition.onerror = function () {
    speak("Sorry, there was an error while listening.");
  };
}