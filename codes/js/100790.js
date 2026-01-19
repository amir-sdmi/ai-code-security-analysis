// 📷 Start camera
const video = document.getElementById("video");

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    document.getElementById("response").innerText = "Camera error: " + err;
  });

// 🎤 Start voice input
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.start();

  document.getElementById("response").innerText = "Listening... 🎙️";

  recognition.onresult = async function (event) {
    const text = event.results[0][0].transcript;
    document.getElementById("response").innerText = "You said: " + text;

    const reply = await getAIResponse(text);
    document.getElementById("response").innerText = reply;

    const utter = new SpeechSynthesisUtterance(reply);
    window.speechSynthesis.speak(utter);
  };

  recognition.onerror = function () {
    document.getElementById("response").innerText = "Voice error. Try again.";
  };
}

// 🤖 AI Brain using ChatGPT API
async function getAIResponse(userInput) {
  const apiKey = "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";
  // <--- Replace this with your real OpenAI API Key
  const url = "https://api.openai.com/v1/chat/completions";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userInput }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    return "Error getting response from AI. Check your internet or API key.";
  }
}
