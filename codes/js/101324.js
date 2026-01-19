// Created in part with ChatGPT

console.log("Content script loaded!");
function getTranscriptText() {
  // Find the element with the data-testid="transcript_list"
  const transcriptList = document.querySelector(
    '[data-testid="transcript_list"]'
  );

  if (transcriptList) {
    console.log("Transcript list found:", transcriptList);

    // Get the text content of all child elements
    const childTexts = Array.from(transcriptList.children).map((child) =>
      child.textContent.trim()
    );

    // Log the extracted text
    console.log("Transcript text:", childTexts);

    return childTexts;
  } else {
    console.log("Transcript list not found.");
    return [];
  }
}

function timeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// Function to check for the video element periodically
function waitForVideo() {
  const video = document.querySelector("video");
  if (video) {
    console.log("Video element found:", video);
    attachTimeDisplay(video);
  } else {
    console.log("Waiting for video element...");
    setTimeout(waitForVideo, 1000); // Retry after 1 second
  }
}

// Attach the time display
function attachTimeDisplay(video) {
  const timeDisplay = createTimeDisplay();
  setTimeout(function () {
    const transcript = getTranscriptText();
    const url = "http://127.0.0.1:5000/getstampedtopics";
    console.log("transcript", transcript, transcript.join("\n"));
    const body = { transcript: transcript.join("\n") };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      mode: "cors",
    })
      .then((response) => {
        console.log("response", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        const stampedTopics = data["stamped_topics"];
        console.log('stamped topics', data)

        video.addEventListener("timeupdate", () => {
          const currentTime = video.currentTime; // Current time in seconds
          const minutes = Math.floor(currentTime / 60);
          const seconds = Math.floor(currentTime % 60);
          console.log(
            `Video time: ${minutes}:${seconds.toString().padStart(2, "0")}`
          );
          let text = "";
          for (let i = 0; i < stampedTopics.length; i++) {
            topicTime = timeToSeconds(stampedTopics[i][3]);
            if (currentTime >= topicTime) text = stampedTopics[i][0] + "\n" + stampedTopics[i][5];
          }

          timeDisplay.innerHTML = text.replace(/\n/g, "<br>");
        });
      });
  }, 4000);
}

// Create the time display element and append it to the body
function createTimeDisplay() {
  const timeDisplay = document.createElement("div");
  timeDisplay.id = "video-time-display";
  timeDisplay.style.position = "fixed"; // Fixed position ensures it stays in view
  timeDisplay.style.top = "630px"; // Positioned near the top
  timeDisplay.style.left = "15px"; // Positioned near the left
  timeDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.92)";
  timeDisplay.style.color = "white";
  timeDisplay.style.padding = "10px";
  timeDisplay.style.borderRadius = "5px";
  timeDisplay.style.fontSize = "18px";
  timeDisplay.style.zIndex = "10000"; // High z-index to stay above other elements
  timeDisplay.textContent = "Processing transcript...";

  // Append it as the first element of the body
  document.body.insertBefore(timeDisplay, document.body.firstChild);
  return timeDisplay;
}

// Start the video check
waitForVideo();
