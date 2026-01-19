// Author: Vergara, Carlos Miguel
// Code from Codepen
// Edited with ChatGPT

let fetchedEvents = [];

const fetchEventData = async () => {
    try {
        const response = await fetch('../controller/fetchEvents.php'); 
        const result = await response.json();

        if (result.status === 'success') {
            fetchedEvents = result.event.map(event => {
                const currentDate = new Date();
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_time);

                let tag = "Upcoming";
                if (currentDate > endDate) {
                    tag = "Ended";
                }

                return {
                    id: event.event_id,
                    title: event.event_title,
                    description: event.event_description,
                    tags: [tag],
                    cover: [
                        event.image_data
                            ? `data:image/png;base64,${event.image_data}`
                            : 'https://via.placeholder.com/550x225/7D7D7D/969696?text=No+Image'
                    ],
                    date: startDate.toLocaleDateString(),
                    endDate: endDate.toLocaleDateString(),
                };
            });

            if (fetchedEvents.length === 0) {
                showNoEventsMessage(); // Display message if no events are found
            } else {
                renderCards(cardsContainer, fetchedEvents, 1);
                updatePagination(fetchedEvents, 1);
            }
        } else {
            console.error('Error fetching events:', result.message);
            showNoEventsMessage();
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        showNoEventsMessage();
    }
};

const showNoEventsMessage = () => {
    cardsContainer.innerHTML = `
        <div class="no-events-message text-center text-muted">
            <p>No events found. Please check back later.</p>
        </div>
    `;
};

const renderCards = (cardsContainer, cards, page = 1, cardsPerPage = 6) => {
    cardsContainer.innerHTML = ""; // Clear the container before rendering

    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const cardsToRender = cards.slice(startIndex, endIndex);

    const currentDate = new Date();

    cardsToRender.forEach((card) => {
        // Decode HTML entities in the title and description
        const title = decodeHtmlEntities(card.title);
        const description = decodeHtmlEntities(card.description);

        // Dynamically update the tag based on the date
        const startDate = new Date(card.date);
        const endDate = new Date(card.endDate || card.date);
        let tag = "Upcoming";

        if (currentDate > endDate) {
            tag = "Ended";
        }

        card.tags = [tag]; // Update the tag

        const { id, cover, date, tags } = card;

        const truncatedDescription = description.length > 500 
        ? description.substring(0, 500) + '...' 
        : description;

        const cardElement = document.createElement("div");
        cardElement.classList.add("col");

        cardElement.innerHTML = `
            <div class="card border-0 bg-transparent position-relative">
                <a href="../view/editevents.php?id=${encodeURIComponent(card.id)}" 
                    class="edit-icon position-absolute top-1 start-20 p-1 text-#003DA5" 
                    title="Edit Event">
                    <i class="fas fa-edit"></i>
                </a>

                <a href="#" class="delete-icon  position-absolute top-1 end-0 p-1 text-#003DA5" 
                    title="Delete Event" onclick="showConfirmationDeleteModal(${card.id}, '${card.title}')">
                    <i class="fas fas fa-trash"></i>
                </a>

                <a href="#" class="${cover.length > 1 ? "has-multiple" : ""}">
                    ${cover
                        .map(
                            (image) =>
                                `<img 
                                    src="${image}" 
                                    class="shadow-sm rounded cover-image w-100" 
                                    alt="${title}"
                                    style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                                `
                        )
                        .join("")}
                </a>
                <div class="bubble date rounded small">${date}</div>
                <div class="card-body">
                    <h2 class="h4"><a href="#" class="text-dark">${title}</a></h2>
                    <p class="text-muted">${truncatedDescription}</p>
                    <p class="m-0">
                        ${tags
                            .map(
                                (tag) =>
                                    `<a href="#" class="small me-1 text-dark border p-1 rounded">${tag}</a>`
                            )
                            .join(" ")}
                    </p>
                </div>
            </div>
        `;

        cardsContainer.appendChild(cardElement);
    });

    const carouselItems = document.querySelectorAll(".has-multiple");
    carouselItems.forEach(initializeCarousel);
};

const initializeCarousel = (carouselItem) => {
    const images = carouselItem.querySelectorAll("img");
    let currentIndex = 0;

    const prevButton = document.createElement("button");
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.addEventListener("click", (e) => {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateCarousel(carouselItem, images, currentIndex);
    });

    const nextButton = document.createElement("button");
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.classList.add("bubble", "end-0");
    nextButton.addEventListener("click", (e) => {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % images.length;
        updateCarousel(carouselItem, images, currentIndex);
    });

    carouselItem.appendChild(prevButton);
    carouselItem.appendChild(nextButton);

    const updateCarousel = (carouselItem, images, currentIndex) => {
        images.forEach((image, index) => {
            image.style.transform = `translateX(${index - currentIndex}00%)`;
        });
    };
};

const searchCards = (cards, searchTerm) => {
    return cards.filter((card) => {
        return (
            card.title.toLowerCase().includes(searchTerm) ||
            card.description.toLowerCase().includes(searchTerm) ||
            card.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
    });
};

const filterCardsByCategory = (cards, category) => {
    return cards.filter((card) => card.tags.some(tag => tag.toLowerCase() === category.toLowerCase()));
};

const handleSearch = (event, page = 1) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    const selectedCategory = document
        .querySelector(".categories .active")
        .textContent.toLowerCase()
        .trim();

    // Start with the unfiltered cards
    let filteredCards =
        selectedCategory !== "all"
            ? filterCardsByCategory(fetchedEvents, selectedCategory)
            : fetchedEvents;

    // Apply the search filter to the selected category
    filteredCards = searchCards(filteredCards, searchTerm);

    renderCards(cardsContainer, filteredCards, page);
    updatePagination(filteredCards, page);
};

const handleCategoryClick = (event, page = 1) => {
    event.preventDefault();

    const category = event.target.textContent.toLowerCase();

    // Remove 'active' class from all category links
    const categoryLinks = document.querySelectorAll(".categories a");
    categoryLinks.forEach((link) => link.classList.remove("active"));

    // Add 'active' class to the clicked category link
    event.target.classList.add("active");

    // Filter based on selected category
    let filteredCards = category === "all" 
        ? fetchedEvents 
        : filterCardsByCategory(fetchedEvents, category);

    // Render filtered cards
    renderCards(cardsContainer, filteredCards, page);
    updatePagination(filteredCards, page);
};

const updatePagination = (cards, page = 1, cardsPerPage = 6) => {
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    const paginationContainer = document.querySelector(".pagination ul");

    paginationContainer.innerHTML = ""; // Clear previous pagination

    // Add "Previous" button
    const prevPage = page > 1 ? page - 1 : 1;
    paginationContainer.innerHTML += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${prevPage}">&laquo;</a>
    </li>`;

    // Add page number buttons
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.innerHTML += `<li class="page-item ${i === page ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    // Add "Next" button
    const nextPage = page < totalPages ? page + 1 : totalPages;
    paginationContainer.innerHTML += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${nextPage}">Next &raquo;</a>
    </li>`;

    // Add event listeners to pagination links
    const paginationLinks = document.querySelectorAll(".pagination .page-link");
    paginationLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const selectedPage = parseInt(link.getAttribute("data-page"));
            const selectedCategory = document.querySelector(".categories .active").textContent.toLowerCase().trim();
            let filteredCards = selectedCategory !== "all"
                ? filterCardsByCategory(fetchedEvents, selectedCategory)
                : fetchedEvents;
            renderCards(cardsContainer, filteredCards, selectedPage);
            updatePagination(filteredCards, selectedPage);
        });
    });
};

const cardsContainer = document.getElementById("cards-container");
const searchInput = document.querySelector('input[type="search"]');
const categoryLinks = document.querySelectorAll(".categories a");

fetchEventData(); // Fetch data on load

searchInput.addEventListener("input", (event) => handleSearch(event, 1));
categoryLinks.forEach((link) =>
    link.addEventListener("click", (event) => handleCategoryClick(event, 1))
);

// delete events
async function deleteEvents(event_id, event_title) {
    console.log("Deleting event:", event_id);
    try {
        const response = await fetch(`../controller/processDeleteEvents.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ event_id }), 
        });
        const data = await response.json();
        if (data.success) {
            showFeedbackModal(`${event_title} deleted successfully.`);
           
            setTimeout(() => {
                location.reload(); // Reload after modal is displayed
            }, 1000); 
        } else {
            const errorMessage = data.error;
            showFeedbackModal(errorMessage);
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        showFeedbackModal("An error occurred while deleting the event.");
    }
}

// Show confirmation modal for deleting event
function showConfirmationDeleteModal(event_id, event_title) {
    console.log(event_id, event_title);
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.textContent = `Are you sure you want to delete this event?: ${event_title}?`;

    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'flex';
    const modalImage = document.getElementById('modalImage');
    modalImage.src = "../assets/images/delete.png";

    document.getElementById('confirmYes').onclick = function() {
        deleteEvents(event_id, event_title);
        closeConfirmationModal();
    };

    document.getElementById('confirmNo').onclick = closeConfirmationModal;
}

function closeConfirmationModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function showFeedbackModal(message) {
    const feedbackMessage = document.getElementById('feedbackMessage');
    feedbackMessage.textContent = message;

    const feedbackModal = document.getElementById('feedbackModal');
    feedbackModal.style.display = 'flex';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

// Function to decode HTML entities like &quot; back to "
function decodeHtmlEntities(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    const decodedString = doc.documentElement.textContent;
    return decodedString.replace(/\\/g, ''); // Remove all backslashes
}