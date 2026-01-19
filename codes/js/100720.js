/**
 * Create a mosaic of a given p5.js sketch.
 * Created using ChatGPT-3.5-turbo:
 * https://chat.openai.com/share/a88e18c4-7a2f-467f-9933-53df1d5faf3e
 */

// Function to create iframes and load the sketch from a file
function createIframe(url, size) {
    let iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = size;
    iframe.height = size;
    iframe.onload = function () {
        iframe.classList.add('fade-in'); // Add the fade-in class after iframe has loaded
    };
    document.body.appendChild(iframe);
}

// Get scrollbar width
// see https://stackoverflow.com/a/40568748/10914628
function getScrollBarWidth() {
    let el = document.createElement("div");
    el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
    document.body.appendChild(el);
    let width = el.offsetWidth - el.clientWidth;
    el.remove();
    return width;
}

// Function to check if the user has scrolled to the bottom of the page
function isBottomOfPage() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight;
}

const scriptUrl = '../index.html';

// Create a 2 column grid of iframes that takes up the whole screen
const cols = 2;
const size = Math.floor((window.innerWidth - getScrollBarWidth()) / cols);
const rows = Math.ceil(window.innerHeight / size);

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        createIframe(scriptUrl, size);
    }
}

// Infinite scrolling
// Add more iframes as the user scrolls down
window.onscroll = function () {
    if (isBottomOfPage()) {
        for (let j = 0; j < cols; j++) {
            createIframe(scriptUrl, size);
        }
    }
};
