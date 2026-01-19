let events = [];
let timeoutId;
let currentIndex = 0;

const thumbnailsDiv = document.querySelector("#thumbnails");
getUMEventsWithImages((eventsWithImages) => {
  events = eventsWithImages;
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    const thumbnail = document.createElement("img");
    thumbnail.src = event.styled_images.event_thumb;
    thumbnail.addEventListener("click", () => setSelectedIndex(index));
    thumbnailsDiv.appendChild(thumbnail);
  }
  setSelectedIndex(0);
  tenSeconds();
});

function tenSeconds() {
  timeoutId = setTimeout(() => {
    const nextIndex = (currentIndex + 1) % events.length;
    setSelectedIndex(nextIndex);
  }, 10000);
}

function setSelectedIndex(index) {
  clearTimeout(timeoutId);
  // had to use chatGPT to figure out how to fix my events always being selected
  for (let i = 0; i < events.length; i++) {
    events[i].selected = false;
  }
  const thumbnails = document.querySelectorAll("#thumbnails img");
  for (let i = 0; i < thumbnails.length; i++) {
    thumbnails[i].classList.remove("selected");
  }
  const selectedEvent = events[index];
  selectedEvent.selected = true;
  document.querySelector("#selected-image").src = selectedEvent.image_url;
  document.querySelector("#selected-title").innerText =
    selectedEvent.event_title;
  document.querySelector("#selected-title").href = selectedEvent.permalink;
  document.querySelector("#selected-date").innerText = getReadableTime(
    selectedEvent.datetime_start
  );
  document.querySelector("#selected-description").innerText =
    selectedEvent.description;
  const selectedThumbnail = document.querySelector(
    `#thumbnails img:nth-child(${index + 1})`
  );
  selectedThumbnail.classList.add("selected");
  currentIndex = index;
  tenSeconds();
}
