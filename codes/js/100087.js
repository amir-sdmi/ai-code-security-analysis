// I used ChatGPT to help me create this javascript file. I conversed with it to
// let it know what I wanted to do and it generated the code for me. I then
// examined the code and discussed it with ChatGPT to understand how it works.

// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails";
import mrujs from 'https://cdn.jsdelivr.net/npm/mrujs@1.0.2/+esm'

window.Turbo = Turbo;

mrujs.start();

document.addEventListener("turbo:load", function() {
  // Initialize all tooltips on the page
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
});
