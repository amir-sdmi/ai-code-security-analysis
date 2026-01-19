/*SETUP */
// First, let's get references to all the elements we’ll be interacting with.
let audioElement = document.getElementById("audioElement");
// the buttons for the controls
let playButton = document.getElementById("playButton");
let stopButton = document.getElementById("stopButton");
// the progress element
let progressBar = document.getElementById("progressBar");
// the disk
let Disk = document.getElementById("rotateDisk");

// let animatedDisk = the html animated disk
let animatedDisk = document.getElementById("rotateDisk");

// We remove the controls attribute using JS instead of leaving it out in the HTML as a fallback.
// This ensures that if the JS fails to load, the media player will still display the default controls. audioElement.removeAttribute("controls");audioElement.removeAttribute("controls");

document.getElementById("controlsWrapper").style.display = "flex";

// Now, we listen for the loadedmetadata event to trigger, allowing us to retrieve the media's total duration.
// Using an arrow function, we update the progress element’s max attribute with this duration.
// This ensures the progress bar reflects the correct percentage of the media as it plays.
audioElement.addEventListener("loadedmetadata", () => {
  progressBar.setAttribute("max", audioElement.duration);
});

// Some mobile devices may not trigger the loadedmetadata event, so we need a fallback to ensure the attribute is set.
audioElement.addEventListener("playing", () => {
  if (!progressBar.getAttribute("max")) {
    progressBar.setAttribute("max", audioElement.duration);
  }
});

audioElement.addEventListener("waiting", () => {
  progressBar.classList.add("timeline-loading");
});
audioElement.addEventListener("canplay", () => {
  progressBar.classList.remove("timeline-loading");
});

/* PLAY/PAUSE BUTTON */
// We can control playback using the .play() and .pause() methods on the media element.
// By combining them into one function, we make sure it behaves as expected.
// And if the media is paused or stopped, we simply call .play().

function playPause() {
  if (audioElement.paused || audioElement.ended) {
    audioElement.play();
    playButton.style.backgroundImage = "url('pause.png')";

    animatedDisk.style.animationPlayState = "running";
  } else {
    audioElement.pause();
    playButton.style.backgroundImage = "url('./play.png')";
    animatedDisk.style.animationPlayState = "paused";
  }
}

playButton.addEventListener("click", playPause);

Disk.addEventListener("click", playPause);

/* TIMELINE */
// We have two main tasks for our timeline: updating the progress bar to show how much of the audio has played, and allowing the user to click the bar to jump to a specific point.
// To update the progress bar, we listen for the timeupdate event, which triggers whenever the current playback time changes. While the audio plays, this event fires continuously, keeping the progress bar in sync.
audioElement.addEventListener("timeupdate", () => {
  //We update the progress bar's value using the audio's currentTime property. Since the timeupdate event fires whenever the current time changes, the progress bar stays in sync whether the audio is playing, skipped, or paused.
  progressBar.value = audioElement.currentTime;

  //updatinglog with the current time
  //console.log(parseInt(videoElement.currentTime))
  let currentLengthOnlySec = parseInt(audioElement.currentTime);
  // console.log(currentLength);

  // converting seconds to a time 00:00

  function convertingToTime(currentLengthOnlySec) {
    var minutes = Math.floor(currentLengthOnlySec / 60);
    var remainingSeconds = currentLengthOnlySec - minutes * 60;
    //this particular convertingToTime code I was using chatGPD to write, it setting the remaining seconds to calculate the currentLengthOnlySec
    // joining minutes and remainingSeconds, adding in a 0 in front of remainingSeconds if the value is lower than 10 so that numbers will appear in the same format even when single digit.
    var formattedTime =
      minutes + " : " + (remainingSeconds < 10 ? "0" : "") + remainingSeconds;
    return formattedTime;
  }

  var formattedTime = convertingToTime(currentLengthOnlySec);
  // Call the function and get the result
  document.getElementById("currentLengthNum").textContent = formattedTime;

  /* Create a new variable and assign the audio element's duration to it, using a parse function to round the value */ let totalDurationOnlySec =
    parseInt(audioElement.duration);
  /* calling the math function Chat GPT created above for convertingToTime and applying it to the newly parsed total duration var i have created  */
  var totalDurationConverted = convertingToTime(
    totalDurationOnlySec - currentLengthOnlySec
  );
  /* Set the formatted time as the content for the totalDuration ID in the HTML */
  document.getElementById("totalDuration").textContent = totalDurationConverted;

  // adding a percentage amount to be able to add a circle where the progress is
  progressPercentage = (currentLengthOnlySec / totalDurationOnlySec) * 100;
  console.log(parseInt(progressPercentage) + "%");

  document.getElementById("progressSlide").style.left =
    progressPercentage - 1.5 + "%";
});

// The simplest way to implement scrubbing is by updating the audio’s currentTime when the user clicks on the timeline. Normally, I used my finger to drag the progress bar when I'm watching video or film online so I would like to create the that same satisfy experience here, as advanced user experience.
// In addition to a single click, the code below allows users to click and drag along the timeline, continuously updating the currentTime, and only finishing scrubbing when the mouse button is released.
// This requires a more sophisticated use of event listeners, but I’ll walk through the design and technical approach to make it clear.
function scrubToTime(e) {
  // The first step is to create a function that calculates the mouse’s position relative to the timeline and updates the audio element's currentTime accordingly.
  // Each time the function runs, we’ll need the mouse position, which we can capture from the event passed to it.
  // To make the interaction work when the mouse is over the progress bar, we could use the event, but since we want it to function even when the mouse is held down and dragged elsewhere on the page, we need to calculate it manually.
  // e.clientX gives us the current cursor position from the left edge of the page.
  // We subtract (progressBar.getBoundingClientRect().left + window.scrollX) to account for any gap between the left edge of the page and the beginning of the progress bar
  let x =
    e.clientX - (progressBar.getBoundingClientRect().left + window.scrollX);
  // Finally, we update audioElement.currentTime to set the playback position based on this calculation.
  let newTime =
    clampZeroOne(x / progressBar.offsetWidth) * audioElement.duration;

  // Check if newTime is a valid number and finite before assigning it
  if (isFinite(newTime) && newTime >= 0 && newTime <= audioElement.duration) {
    audioElement.currentTime = newTime;
  } else {
    console.error("Invalid time value: ", newTime); // Debugging info if the value is invalid
  }
}

// Helper function to clamp the value between 0 and 1
function clampZeroOne(input) {
  return Math.min(Math.max(input, 0), 1);
}

// The click event only triggers when the user presses and releases the mouse on the same element.
//To enable more flexible interactions, we can break this down into two separate events: mousedown and mouseup, giving us finer control over the behavior.
progressBar.addEventListener("mousedown", scrubToTime);
progressBar.addEventListener("mousedown", (e) => {
  // In this case, we listen for the mousemove event while the mouse is held down, allowing us to track the cursor's movement.
  //Once the mouse button is released, stop listening to the event.
  window.addEventListener("mousemove", scrubToTime);
  window.addEventListener("mouseup", () => {
    window.removeEventListener("mousemove", scrubToTime);
  });
});

// Mute button functionality
function muteAudio() {
  // Mute the audio
  audioElement.muted = true;
  console.log("Audio muted");
}

// Unmute button functionality
function unmuteAudio() {
  // Unmute the audio
  audioElement.muted = false;
  console.log("Audio unmuted");
}

// Add event listeners for both buttons
muteButton.addEventListener("click", muteAudio);
unmuteButton.addEventListener("click", unmuteAudio);

// This function ensures that the given input is clamped between 0 and 1. It takes an input value and returns the value if it's between 0 and 1; otherwise, it returns the nearest boundary (0 or 1). This part is write by chat GPT
// It ensures the value never exceeds 1 or falls below 0 — a process known as clamping, where we limit the value to stay within a specific range.
// Finally, we use this clamped value to calculate the exact point in the audio by multiplying it with the total duration, determining where to scrub.
function clampZeroOne(input) {
  return Math.min(Math.max(input, 0), 1);
}

function logEvent(e) {
  // This simple function logs the event e to the console, making it easier to track or debug interactions by printing out event information.
  console.log(e);
}
// I was trying to create an interactive tracklist that automatically plays the next track and highlights the current one as it plays.
// array of audio files in the correct order
const audioTracks = [
  "https://ia802706.us.archive.org/24/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/Hummingbird%20%28Metro%20Boomin%20%26%20James%20Blake%29.mp3", // Hummingbird
  "https://dn720300.ca.archive.org/0/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/Nas%20Morales%20%28Metro%20Boomin%20%26%20Nas%29.mp3", // Nas Morales
  "https://dn720300.ca.archive.org/0/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/All%20The%20Way%20Live%20%28Spider-Man%20Across%20the%20Spider-Verse%29%20%28Metro%20Boomin%20%26%20Future%2C%20Lil%20Uzi%20Vert%29.mp3", // All The Way Live
];

let currentTrackIndex = 0; // Start at the first track (Hummingbird)
// Sometimes the track takes a while to start. I know it's just loading, not broken, but the original website can be really slow at times. I haven't found a way to fully solve this delay, so I just hope that each time I open the tab, it works fine. I've done what I can to improve the performance where possible.
// Function to load and play a new track
function loadTrack(index) {
  // This function loads and plays a track from the audioTracks array, based on the provided index. It also updates the display by reloading the track and setting it as the active track.
  currentTrackIndex = index; // update current track index
  audioElement.src = audioTracks[index]; // set the audio source
  audioElement.load(); // load the new track
  audioElement.play(); // play the track

  // update the track button colors based on the current track
  //based on the .track-button.active {
  updateTrackButtonColors(index);
}

// event listener for next button
nextButton.addEventListener("click", () => {
  // move to the next track in the array, and loop back to the first if at the end
  currentTrackIndex = (currentTrackIndex + 1) % audioTracks.length;
  loadTrack(currentTrackIndex);
});

// event listener for previous button
prevButton.addEventListener("click", () => {
  // move to the previous track in the array, and loop to the last track if at the start
  currentTrackIndex =
    (currentTrackIndex - 1 + audioTracks.length) % audioTracks.length;
  loadTrack(currentTrackIndex);
});

// when the track ends, automatically go to the next track
audioElement.addEventListener("ended", () => {
  currentTrackIndex = (currentTrackIndex + 1) % audioTracks.length;
  loadTrack(currentTrackIndex);
});

audioElement.addEventListener("timeupdate", () => {
  // This listener continuously updates the progress bar as the track plays, reflecting the current time. It also formats and displays the current playback time in minutes and seconds.
  progressBar.value = audioElement.currentTime;
});

document.addEventListener("DOMContentLoaded", function () {
  //to make sure it goes with right order, I decided to define the audio track here
  const audioTracks = [
    "https://ia802706.us.archive.org/24/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/Hummingbird%20%28Metro%20Boomin%20%26%20James%20Blake%29.mp3",
    "https://dn720300.ca.archive.org/0/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/Nas%20Morales%20%28Metro%20Boomin%20%26%20Nas%29.mp3",
    "https://dn720300.ca.archive.org/0/items/metro-boomin-presents-spider-man-across-the-spider-verse-soundtrack-from-and-ins/All%20The%20Way%20Live%20%28Spider-Man%20Across%20the%20Spider-Verse%29%20%28Metro%20Boomin%20%26%20Future%2C%20Lil%20Uzi%20Vert%29.mp3",
  ];

  const audioElement = document.getElementById("audioElement");
  const progressBar = document.getElementById("progressBar");
  const currentLengthNum = document.getElementById("currentLengthNum");

  // function to load and play the selected track
  function loadTrack(index) {
    audioElement.src = audioTracks[index];
    audioElement.load();
    // reload the audio with the new source

    // reset the progress bar and current time display when a new track is loaded
    progressBar.value = 0;
    currentLengthNum.textContent = "00:00";

    // play the new track
    audioElement.play();
  }

  // add event listeners to the track list buttons
  const trackButtons = document.querySelectorAll(".track-button");
  trackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const trackIndex = button.getAttribute("data-track-index");
      loadTrack(trackIndex);
    });
  });

  // update progress bar max when track metadata is loaded
  audioElement.addEventListener("loadedmetadata", () => {
    progressBar.setAttribute("max", audioElement.duration);
  });

  // update progress bar value as the track plays
  audioElement.addEventListener("timeupdate", () => {
    progressBar.value = audioElement.currentTime;

    // update current time display in mm:ss format
    let minutes = Math.floor(audioElement.currentTime / 60);
    let seconds = Math.floor(audioElement.currentTime % 60);
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    currentLengthNum.textContent = minutes + ":" + seconds;
  });
});
//whenever code that related to math, I always using chatGPT, here is the case. However, this code is kinda easy for me to understand.

// get the track buttons and store them in an array
const trackButtons = document.querySelectorAll(".track-button");
// function to update the track button colors
function updateTrackButtonColors(currentTrackIndex) {
  trackButtons.forEach((button, index) => {
    if (index == currentTrackIndex) {
      button.classList.add("active"); // add the active class to the currently playing track
    } else {
      button.classList.remove("active"); // remove the active class from other tracks
    }
  });
}

// function to load and play a new track
function loadTrack(index) {
  audioElement.src = audioTracks[index];
  audioElement.load(); // Reload the audio with the new source
  audioElement.play(); // Play the new track

  // update the button colors based on the current track
  updateTrackButtonColors(index);
}

// event listener for Next Button
nextButton.addEventListener("click", () => {
  currentTrackIndex = (currentTrackIndex + 1) % audioTracks.length; // Loop through tracks
  loadTrack(currentTrackIndex);
});

// event listener for Previous Button
prevButton.addEventListener("click", () => {
  currentTrackIndex =
    (currentTrackIndex - 1 + audioTracks.length) % audioTracks.length; // Loop through tracks
  loadTrack(currentTrackIndex);
});

// event listener for Track Buttons
trackButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    loadTrack(index); // load the track when the button is clicked
  });
});

// when the track ends, automatically go to the next track
audioElement.addEventListener("ended", () => {
  currentTrackIndex = (currentTrackIndex + 1) % audioTracks.length;
  loadTrack(currentTrackIndex);
});
