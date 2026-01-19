
    // NOTE: last lines are
    //  observer.observe(gif);
    //  startGif();

    // Click the gif to start/stop
    // Restarts when it comes back into view
    // Automatically stops after playDuration milliseconds
    // Written by chatGPT Jan 2025
    let playDuration = 5000; 

    const gif = document.getElementById('animated-gif');
    const staticFrame = "images/theBirds.png"; 
    const animatedGif = "images/theBirds.gif";
    let isPlaying = true;
    let stopTimeout;

    // Function to stop the GIF
    function stopGif() {
      if (isPlaying) {
        gif.src = staticFrame; // Replace GIF with static frame
        isPlaying = false; // Update state
      }
    }

    // Play the GIF and set a timeout to stop it
    function startGif() {
      gif.src = animatedGif; // Start the animated GIF
      isPlaying = true; // Update state
      clearTimeout(stopTimeout); // Clear any previous timeout
      stopTimeout = setTimeout(stopGif, playDuration); //Stop after playDuration
    }

    // Handle click event to toggle play/pause
    gif.addEventListener('click', () => {
      if (isPlaying) {
        stopGif();
      } else {
        startGif();
      }
    });


    // Restart GIF when it comes back into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isPlaying) {
            startGif(); // Restart the GIF if visible and stopped
          }
        });
      },
      { threshold: 0.5 } // Trigger when at least 50% of the GIF is visible
    );

    observer.observe(gif);
    startGif();
