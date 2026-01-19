
// This script loads a CSV file containing video metadata, creates video cards dynamically, and sets up custom controls for each video.
// The script was co-created by ChatGPT and the author of the original code.

function parseCSV(text) {
    const rows = [];
    const lines = text.trim().split('\n');
    for (const line of lines) {
      const match = line.match(/(\".*?\"|[^,]+)(?=,|$)/g);
      if (match) {
        rows.push(match.map(cell =>
          cell.startsWith('"') && cell.endsWith('"') 
            ? cell.slice(1, -1).replace(/""/g, '"') 
            : cell
        ));
      }
    }
    return rows;
  }

async function loadVideos() {
  const response = await fetch('sketches.csv');
  const data = await response.text();
  const allRows = parseCSV(data);
  const rows = allRows.slice(1); 

  const feed = document.getElementById('feed');

  rows.forEach(row => {
      const [order, id, file, shortTitle, caption, altText, mode] = row;

      if (!file) return;

      const card = document.createElement('div');
      card.className = 'video-card';
      card.id = id.trim();

      const captionElem = document.createElement('div');
      captionElem.className = 'caption';
      captionElem.innerHTML = caption;

      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-container';

      const video = document.createElement('video');
      video.src = `/videos/${file.trim()}`;
      video.setAttribute('alt', altText);
      video.setAttribute('preload', 'metadata');
      video.setAttribute('playsinline', '');
      video.muted = true;
      video.removeAttribute('controls');

      const overlay = document.createElement('div');
      overlay.className = 'custom-controls ' + mode;
      
      const timerSpan = document.createElement('span');
      timerSpan.className = 'timer '+ mode;
      timerSpan.textContent = '00:00';
      
      const statusIcon = document.createElement('img');
      statusIcon.className = 'status-icon ' + mode;
      statusIcon.src = 'assets/pause.png';
      
      overlay.appendChild(statusIcon);
      overlay.appendChild(timerSpan);
    

      videoContainer.appendChild(video);
      videoContainer.appendChild(overlay);

      const linkButton = document.createElement('button');
      linkButton.textContent = 'Copy link';
      linkButton.className = 'copy-link';
      linkButton.title = 'Copy link to this video';
      linkButton.onclick = () => {
          const fullURL = `${window.location.origin}${window.location.pathname}#${id.trim()}`;
          navigator.clipboard.writeText(fullURL).then(() => {
              linkButton.textContent = 'Link copied!';
              setTimeout(() => {
                  linkButton.textContent = 'Copy link';
              }, 1500);
          });
      };


      function stripHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
      }

      const shareButton = document.createElement('button');
      shareButton.textContent = 'Share video';
      shareButton.className = 'share-link';
      shareButton.title = 'Share this video';
      shareButton.onclick = () => {
        const fullURL = `${window.location.origin}${window.location.pathname}#${id.trim()}`;
        
        if (navigator.share) {
          const shareText = `${shortTitle || ''}: ${caption}`.trim();

          navigator.share({
                title: "Data is Blue #MyMatrescenceProject",
                text: shareText,
                url: fullURL
          }).catch((error) => {
            console.log('Share failed:', error);
          });
        } else {
          alert('Sharing is not supported in this browser.');
        }
      };  
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      buttonContainer.appendChild(shareButton);
      buttonContainer.appendChild(linkButton);
     

      card.appendChild(videoContainer);
      card.appendChild(captionElem);
      card.appendChild(buttonContainer);
      feed.appendChild(card);

      setupCustomControl(video, statusIcon, timerSpan);
  });

  setupAutoplay();

  const anchor = window.location.hash;
  if (anchor) {
    const target = document.querySelector(anchor);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

}

function setupCustomControl(video, iconEl, timerEl) {
  let isEnded = false;

  function updateIcon() {
    if (isEnded) {
        iconEl.src = 'assets/replay.png';
        if (timerEl) timerEl.textContent = 'Replay';
    } else if (video.paused) {
        iconEl.src = 'assets/play.png'; 
    } else {
        iconEl.src = 'assets/pause.png';
    }
}

  function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  video.addEventListener('timeupdate', () => {
      const remaining = video.duration - video.currentTime;
      timerEl.textContent = formatTime(remaining);
  });

  video.addEventListener('ended', () => {
      isEnded = true;
      updateIcon();
  });

      // Update icon when playback state changes
      video.addEventListener('play', () => {
        isEnded = false;
        updateIcon();
    });

    video.addEventListener('pause', updateIcon);


  video.parentElement.addEventListener('click', () => {
      video.parentElement.dataset.userInteracted = 'true';

      if (isEnded) {
          video.currentTime = 0;
          video.play();
          isEnded = false;
      } else if (video.paused) {
          video.play();
      } else {
          video.pause();
      }
      updateIcon();
  });

    // IMPORTANT: check if autoplay already started
    if (!video.paused && !video.ended) {
        updateIcon(); // video started automatically
    }


  updateIcon();
}

function setupAutoplay() {
    const videos = document.querySelectorAll('video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const container = video.parentElement;
            const userInteracted = container.dataset.userInteracted === 'true';

            if (entry.isIntersecting && entry.intersectionRatio === 1) {
                if (!userInteracted) {
                    video.play();
                }
            } else {
                if (!userInteracted) {
                    video.pause();
                }
            }
        });
    }, { threshold: 1.0 });

    videos.forEach(video => {
        observer.observe(video);
    });
}

loadVideos();
