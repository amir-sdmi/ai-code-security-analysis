// Add event listener to the albums
document.addEventListener('DOMContentLoaded', function() {
    const players = document.querySelectorAll('.player');
    const allAudioPlayers = document.querySelectorAll('audio');
  
    players.forEach(player => {
        const playButton = player.querySelector('.play-icon');
        const pauseButton = player.querySelector('.pause-icon');
        const audioPlayer = player.querySelector('audio');
        const progressBar = player.querySelector('.progress-bar');
        const progress = player.querySelector('.progress');
        const currentTimeDisplay = player.querySelector('.current-time');
        // Add event listener to the play button
        playButton.addEventListener('click', function() {
            // Ensure that only one audio player is playing at a time
            allAudioPlayers.forEach(otherAudioPlayer => {
                if (otherAudioPlayer !== audioPlayer) {
                    otherAudioPlayer.pause();
                    otherAudioPlayer.parentElement.querySelector('.play-icon').style.display = 'inline';
                    otherAudioPlayer.parentElement.querySelector('.pause-icon').style.display = 'none';
                }
            });
  
            // Play this audio player
            audioPlayer.play();
            playButton.style.display = 'none';
            pauseButton.style.display = 'inline';
        });
        // Change the play button to pause button when the audio is playing
        pauseButton.addEventListener('click', function() {
            audioPlayer.pause();
            playButton.style.display = 'inline';
            pauseButton.style.display = 'none';
        });
        // Update the progress bar and current time when the audio is playing
        audioPlayer.ontimeupdate = function() {
            const percentage = (this.currentTime / this.duration) * 100;
            progress.style.width = percentage + '%';
            currentTimeDisplay.textContent = formatTime(this.currentTime);
        };
        // Update the current time when clicking on the progress bar
        progressBar.addEventListener('click', function(e) {
            const progressPos = e.offsetX / this.clientWidth;
            audioPlayer.currentTime = progressPos * audioPlayer.duration;
        });
        // Format the time in MM:SS
        function formatTime(seconds) {
            let min = Math.floor((seconds / 60));
            let sec = Math.floor(seconds - (min * 60));
            if (sec < 10){ 
                sec  = `0${sec}`;
            }
            return `${min}:${sec}`;
        }
    });
  });
  
  
  // Add event listener to the floating player
  document.addEventListener('DOMContentLoaded', function() {
    // Get all the elements needed
    const albums = document.querySelectorAll('.player');
    const floatingPlayer = document.getElementById('floatingPlayer');
    const floatingAudio = floatingPlayer.querySelector('.floatAudioPlayer');
    const playButton = floatingPlayer.querySelector('.play-icon');
    const pauseButton = floatingPlayer.querySelector('.pause-icon');
    const progressBar = floatingPlayer.querySelector('.progress');
    const progressBarContainer = floatingPlayer.querySelector('.progress-bar-container');
    const currentTimeDisplay = floatingPlayer.querySelector('.current-time');
    const totalTimeDisplay = floatingPlayer.querySelector('.total-time');
    let currentPlayingAlbum = null;
    // Update the floating player progress bar when audio is playing
    // Use Chatgpt to help with the progress bar and time display
    progressBarContainer.addEventListener('click', function(event) {
        const bounds = this.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const percentage = x / this.offsetWidth;
        floatingAudio.currentTime = percentage * floatingAudio.duration;
    });

    albums.forEach(player => {
        const artContainer = player.querySelector('.album-art-container');
        const audio = player.querySelector('audio');

        // Play the audio when clicking on the album art
        artContainer.addEventListener('click', playAudio);

        // Play the audio when pressing Enter key on the album art
        artContainer.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                playAudio();
            }
        });

        function playAudio() {
            // Only play the audio if the window is large enough
            if (window.innerWidth >= 1024) {
                if (floatingAudio.src !== audio.src) {
                    floatingAudio.src = audio.src;
                    floatingAudio.play();
                    updatePlayPauseButtons(playButton, pauseButton);
                    updateFloatingPlayerInfo(player, floatingPlayer);
                    currentPlayingAlbum = player;
                }
            }
        }

        // Update the floating player info when hovering over the album art
        artContainer.addEventListener('mouseenter', function() {
            if (window.innerWidth >= 1024) {
                updateFloatingPlayerInfo(player, floatingPlayer);
            }
        });
        // Revert the floating player info when the mouse leaves the album art
        artContainer.addEventListener('mouseleave', function() {
            if (window.innerWidth >= 1024 && currentPlayingAlbum) {
                setTimeout(() => {
                    if (!document.querySelector('.player:hover')) {
                        updateFloatingPlayerInfo(currentPlayingAlbum, floatingPlayer);
                    }
                }, 100);  // A small delay to ensure it only reverts if truly no album is hovered
            }
        });
    });

  
  
    playButton.addEventListener('click', function() {
        if (floatingAudio.paused) {
            floatingAudio.play();
            updatePlayPauseButtons(playButton, pauseButton);
        }
    });
  
    pauseButton.addEventListener('click', function() {
        if (!floatingAudio.paused) {
            floatingAudio.pause();
            updatePlayPauseButtons(playButton, pauseButton);
        }
    });

    floatingAudio.addEventListener('timeupdate', function() {
        if (window.innerWidth >= 1024) {
        updateProgressBar(this, progressBar, currentTimeDisplay, totalTimeDisplay);}
    });
  });
  
  function updateFloatingPlayerInfo(player, floatingPlayer) {
    // implement the function to update the floating player info
    const albumArt = player.querySelector('.album-art');
    const title = player.querySelector('.song_title').textContent;
    const source = player.querySelector('.song_source').textContent;
    const intro = player.querySelector('.song_intro').textContent;
  
    floatingPlayer.querySelector('.album-art').src = albumArt.src;
    floatingPlayer.querySelector('.song_title').textContent = title;
    floatingPlayer.querySelector('.song_source').textContent = source;
    floatingPlayer.querySelector('.song_intro').textContent = intro;
  }
  
  function updatePlayPauseButtons(playButton, pauseButton) {
    // implement the function to update the play and pause buttons
    if (floatingPlayer.querySelector('.floatAudioPlayer').paused) {
        playButton.style.display = 'inline';
        pauseButton.style.display = 'none';
    } else {
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline';
    }
  }
  
  function updateProgressBar(audio, progressBar, currentTimeDisplay, totalTimeDisplay) {
    // implement the function to update the progress bar
    const duration = audio.duration;
    const currentTime = audio.currentTime;
    const percentage = (currentTime / duration) * 100;
    progressBar.style.width = `${percentage}%`;
    currentTimeDisplay.textContent = formatTime(currentTime);
    totalTimeDisplay.textContent = formatTime(duration);
}

  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

document.addEventListener('DOMContentLoaded', function() {
    // allow the user to drag the music slider
    const slider = document.getElementById('musics');
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // The *2 is the speed of the drag
        slider.scrollLeft = scrollLeft - walk;
    });

});
