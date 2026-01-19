// Import necessary modules or libraries
import './style.css'; // Import CSS file

/**
 * Navbar Toggle Functionality
 */
const navOpenBtn = document.querySelector("[data-nav-open-btn]");
const navbar = document.querySelector("[data-navbar]");
const navCloseBtn = document.querySelector("[data-nav-close-btn]");

const navElemArr = [navOpenBtn, navCloseBtn];
navElemArr.forEach(btn => {
  btn.addEventListener("click", () => {
    navbar.classList.toggle("active");
  });
});

// Close navbar when a link is clicked
const navbarLinks = document.querySelectorAll("[data-nav-link]");
navbarLinks.forEach(link => {
  link.addEventListener("click", () => {
    navbar.classList.remove("active");
  });
});

/**
 * Header Active on Scroll
 */
const header = document.querySelector("[data-header]");
window.addEventListener("scroll", () => {
  window.scrollY >= 50 ? header.classList.add("active") : header.classList.remove("active");
});

/**
 * Language Switcher
 */
const languageSelector = document.querySelector(".lang-switch");
languageSelector.addEventListener("change", (event) => {
  const selectedLanguage = event.target.value;
  console.log(`Language switched to: ${selectedLanguage}`);
  // Add logic to handle language switching, like loading language-specific content
});

/**
 * Donation Button Action
 */
const donateButtons = document.querySelectorAll(".btn-primary");
donateButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Implement donation logic here
    console.log("Donate button clicked!");
    window.location.href = "donate.html";  // Redirect to the donate page
  });
});

/**
 * Tab Navigation (About Us Section)
 */
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContent = document.querySelector(".tab-content");

tabButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    document.querySelector(".tab-btn.active").classList.remove("active");
    button.classList.add("active");
    
    // Update tab content (if necessary)
    tabContent.innerHTML = `Content for tab ${index + 1}`;
  });
});

/**
 * Testimonial Section
 */
const testimonials = [
  {
    name: "Jaya Kumar",
    title: "Disaster Relief Beneficiary",
    message: "ReliefChain became a lifeline for us. Through their platform, we could quickly raise funds for urgent needs like food, shelter, and medical aid.",
    imgSrc: "assets/rc.png"
  }
];

const testimonialCard = document.querySelector(".testi-card");
testimonials.forEach(testimonial => {
  testimonialCard.querySelector(".testi-name").textContent = testimonial.name;
  testimonialCard.querySelector(".testi-title").textContent = testimonial.title;
  testimonialCard.querySelector(".testi-text").textContent = testimonial.message;
  testimonialCard.querySelector(".card-avatar img").src = testimonial.imgSrc;
});

/**
 * Event Section Logic
 */
const events = [
  { title: "Hurricane Aftermath Relief", date: "Aug 5", type: "Hurricane" },
  { title: "Earthquake Recovery Fund", date: "Jul 23", type: "Earthquake" },
  { title: "Flood Disaster Aid", date: "Jul 27", type: "Flood" }
];

const eventList = document.querySelector(".event-list");
events.forEach(event => {
  const eventHTML = `
    <li>
      <div class="event-card">
        <time class="card-time" datetime="01-05">
          <span class="month">${event.date.split(" ")[0]}</span>
          <span class="date">${event.date.split(" ")[1]}</span>
        </time>
        <div class="wrapper">
          <div class="card-content">
            <p class="card-subtitle">${event.type}</p>
            <h3 class="card-title">${event.title}</h3>
          </div>
          <button class="btn btn-white">
            <span>View Events</span>
            <ion-icon name="arrow-forward"></ion-icon>
          </button>
        </div>
      </div>
    </li>
  `;
  eventList.innerHTML += eventHTML;
});

/**
 * Gemini Integration
 */
// Initialize Gemini client
const geminiClient = initializeGeminiClient();

async function analyzeDamage(data) {
  try {
    const analysis = await geminiClient.analyze(data);
    console.log('Damage analysis:', analysis);
    // Handle the analysis result
    // You can update your UI or perform other actions with the analysis result
  } catch (err) {
    console.error('Error analyzing damage:', err);
  }
}

// Example of how to use Gemini with some data
const sampleData = {}; // Replace with actual data
analyzeDamage(sampleData);

// Define Gemini client initialization function
function initializeGeminiClient() {
  return {
    analyze: async (data) => {
      // Replace with actual API call to Gemini
      return fetch('https://api.gemini.com/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(response => response.json());
    }
  };
}
