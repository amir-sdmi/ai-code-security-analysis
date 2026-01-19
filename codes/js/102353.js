//I had to rewrite the code because I had issues following the original code
// This import brings in data from  The data.js file

import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";
import "./bookPreview.js";

// Created an object `library` that contains arrays and objects  that have just been imported
const library = {
  books,
  authors,
  genres,
};

//This is the web component for book reviews
function createBookElement({ author, id, image, title }) {
  const bookPreview = document.createElement("book-preview");
  bookPreview.setAttribute("image", image);
  bookPreview.setAttribute("title", title);
  bookPreview.setAttribute("author", authors[author]);
  bookPreview.setAttribute("data-preview", id); //this line of lacking code prevented me from opening the preview section of the page ,I used chatgpt to troubleshoot this issue
  return bookPreview;
}

//The following  two  defintion is from chatgpt  im keeping it here so i remember how it and why its done:
//The page variable is crucial for managing which portion of the matches list is currently displayed. For example, if BOOKS_PER_PAGE is 10, and page is 1, then the first 10 books from the matches array will be displayed. As the user clicks a "Show more" button or navigates through pages, the page variable will be incremented to show the next set of books.
//Filtering and Searching: The matches variable is dynamically updated based on user input (e.g., search terms, selected filters). When users search or apply filters, matches will only contain books that meet the criteria. The page variable will then help paginate through this filtered list.
let page = 1; // Current page number
let matches = library.books; //

// This will create a  a DOM efent  element for a book preview. */

/*function createBookElement({ author, id, image, title }) {
  const element = document.createElement("button"); // This will create a button element
  element.classList = "preview"; // This will assign a class for styling
  element.setAttribute("data-preview", id); // Sets the id

  // Set the inner HTML of the button with the book details
  element.innerHTML = `
          <img
              class="preview__image" 
              src="${image}" 
          />
          <div class="preview__info">
              <h3 class="preview__title">${title}</h3>
              <div class="preview__author">${authors[author]}</div>
          </div>
      `;
  return element; // Return the button element
} */
//This is somthing you need remember : "DocumentFragment" is a lightweight, invisible container that you can use to group multiple DOM elements before inserting them into the actual document. It’s often used to improve performance when updating or appending multiple elements to the DOM.
function renderBookList(books, container) {
  const fragment = document.createDocumentFragment(); // Create a document fragment for efficient DOM updates
  for (const book of books) {
    fragment.appendChild(createBookElement(book)); // Append each book element to the fragment
  }
  container.appendChild(fragment); // Append the fragment to the container
}
//This function ill help create a dropdown menu
function createDropdownOptions(options, firstOptionText) {
  const fragment = document.createDocumentFragment(); // Create a document fragment for efficient DOM updates
  const firstElement = document.createElement("option"); // Create the first option element
  firstElement.value = "any"; // Set the value for the default "any" option
  firstElement.innerText = firstOptionText; // Set the display text
  fragment.appendChild(firstElement); // Append the default option to the fragment

  return fragment; // Return the completed fragment
}
// Sets up the theme based on the user's preference for dark mode or light mode.For clarity i had to use chapt to understand a few concepts such as Matchmedia
//window.matchMedia() This method is used to check if the user's device or browser matches certain conditions, like screen width, orientation, or in this case, a preference for dark or light themes.
function setupTheme() {
  const prefersDarkScheme =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches; // Check if user prefers dark mode
  const theme = prefersDarkScheme ? "night" : "day";
  document.querySelector("[data-settings-theme]").value = theme; // Set the theme in the settings
  const darkColor = prefersDarkScheme ? "255, 255, 255" : "10, 10, 20";
  const lightColor = prefersDarkScheme ? "10, 10, 20" : "255, 255, 255";
  document.documentElement.style.setProperty("--color-dark", darkColor);
  document.documentElement.style.setProperty("--color-light", lightColor);
}

/**
 * Updates the "Show more" button based on the number of remaining books.
 */
function updateShowMoreButton() {
  const showMoreButton = document.querySelector("[data-list-button]");
  const remainingBooks = matches.length - page * BOOKS_PER_PAGE; // Calculate how many books are left
  showMoreButton.innerText = `Show more (${remainingBooks})`; // Update button text
  showMoreButton.disabled = remainingBooks <= 0; // Disable button if no more books

  // Update button HTML to show remaining books count
  showMoreButton.innerHTML = `
          <span>Show more</span>
          <span class="list__remaining"> (${
            remainingBooks > 0 ? remainingBooks : 0
          })</span>
      `;
}

//for full transparancy  i did use chatgpt in this section heavily to get this right mainly due to time concerns

function addEventListeners() {
  // Close the search overlay when the cancel button is clicked
  document
    .querySelector("[data-search-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = false;
    });

  // Close the settings overlay when the cancel button is clicked
  document
    .querySelector("[data-settings-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = false;
    });

  // Open the search overlay when the search icon in the header is clicked
  document
    .querySelector("[data-header-search]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = true;
      document.querySelector("[data-search-title]").focus(); // Focus on the search input
    });

  // Open the settings overlay when the settings icon in the header is clicked
  document
    .querySelector("[data-header-settings]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = true;
    });

  // Close the book detail overlay when the close button is clicked
  document.querySelector("[data-list-close]").addEventListener("click", () => {
    document.querySelector("[data-list-active]").open = false;
  });
}

// Handle theme changes from the settings form
document
  .querySelector("[data-settings-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData); // Extract the selected theme from the form data

    // Apply the selected theme colors to CSS variables
    if (theme === "night") {
      document.documentElement.style.setProperty(
        "--color-dark",
        "255, 255, 255"
      );
      document.documentElement.style.setProperty("--color-light", "10, 10, 20");
    } else {
      document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
      document.documentElement.style.setProperty(
        "--color-light",
        "255, 255, 255"
      );
    }

    document.querySelector("[data-settings-overlay]").open = false; // Close settings overlay
  });

// Handle search form submission and filter books based on user input
document
  .querySelector("[data-search-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData); // Extract filter values from the form
    const result = [];

    // Filter books based on the search criteria
    for (const book of library.books) {
      let genreMatch = filters.genre === "any"; // Default to genre match

      // Check if the book's genre matches the selected filter
      for (const singleGenre of book.genres) {
        if (genreMatch) break;
        if (singleGenre === filters.genre) {
          genreMatch = true;
        }
      }

      // Check if the book matches title, author, and genre filters
      if (
        (filters.title.trim() === "" ||
          book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.author === "any" || book.author === filters.author) &&
        genreMatch
      ) {
        result.push(book); // Add matching book to results
      }
    }

    page = 1; // Reset page to 1 for new search
    matches = result; // Update matches with search results

    // Show or hide the message if no results are found
    if (result.length < 1) {
      document
        .querySelector("[data-list-message]")
        .classList.add("list__message_show");
    } else {
      document
        .querySelector("[data-list-message]")
        .classList.remove("list__message_show");
    }

    // Clear current book list and render new results
    document.querySelector("[data-list-items]").innerHTML = "";
    renderBookList(
      result.slice(0, BOOKS_PER_PAGE), // Display only the first page of results
      document.querySelector("[data-list-items]")
    );
    updateShowMoreButton(); // Update the "Show more" button
    window.scrollTo({ top: 0, behavior: "smooth" }); // Smoothly scroll to the top of the page
    document.querySelector("[data-search-overlay]").open = false; // Close search overlay
  });

// Handle "Show more" button click to load more books
document.querySelector("[data-list-button]").addEventListener("click", () => {
  const fragment = document.createDocumentFragment(); // Create a document fragment for efficient DOM updates
  renderBookList(
    matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE), // Render the next page of books
    fragment
  );
  document.querySelector("[data-list-items]").appendChild(fragment); // Append the new books to the container
  page += 1; // Increment the page number
  updateShowMoreButton(); // Update the "Show more" button
});

// Handle click on book preview to show detailed view
document
  .querySelector("[data-list-items]")
  .addEventListener("click", (event) => {
    const pathArray = Array.from(event.path || event.composedPath()); // Get the event path
    let active = null;

    // Traverse the event path to find the clicked book preview element
    for (const node of pathArray) {
      if (active) break;
      if (node?.dataset?.preview) {
        let result = null;

        // Find the book that matches the clicked preview ID
        for (const singleBook of library.books) {
          if (result) break;
          if (singleBook.id === node?.dataset?.preview) result = singleBook;
        }

        active = result;
      }
    }

    // Show the detailed view if a book was found
    if (active) {
      document.querySelector("[data-list-active]").open = true;
      document.querySelector("[data-list-blur]").src = active.image;
      document.querySelector("[data-list-image]").src = active.image;
      document.querySelector("[data-list-title]").innerText = active.title;
      document.querySelector("[data-list-subtitle]").innerText = `${
        library.authors[active.author]
      } (${new Date(active.published).getFullYear()})`;
      document.querySelector("[data-list-description]").innerText =
        active.description;
    }
  });

//To initialize the  setup
function initialize() {
  const starting = document.createDocumentFragment(); // Create a document fragment for initial render
  renderBookList(matches.slice(0, BOOKS_PER_PAGE), starting); // Render the first page of books
  document.querySelector("[data-list-items]").appendChild(starting); // Append initial books to the container

  // Create and append dropdown options for genres and authors
  const genreHtml = createDropdownOptions(library.genres, "All Genres");
  document.querySelector("[data-search-genres]").appendChild(genreHtml);

  const authorsHtml = createDropdownOptions(library.authors, "All Authors");
  document.querySelector("[data-search-authors]").appendChild(authorsHtml);

  setupTheme(); // Set up the initial theme
  updateShowMoreButton(); // Set the initial state of the "Show more" button
  addEventListeners(); // Attach event listeners for interactivity
}

initialize();

/*import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

let page = 1;
let matches = books

const starting = document.createDocumentFragment()

for (const { author, id, image, title } of matches.slice(0, BOOKS_PER_PAGE)) {
    const element = document.createElement('button')
    element.classList = 'preview'
    element.setAttribute('data-preview', id)

    element.innerHTML = `
        <img
            class="preview__image"
            src="${image}"
        />
        
        <div class="preview__info">
            <h3 class="preview__title">${title}</h3>
            <div class="preview__author">${authors[author]}</div>
        </div>
    `

    starting.appendChild(element)
}

document.querySelector('[data-list-items]').appendChild(starting)

const genreHtml = document.createDocumentFragment()
const firstGenreElement = document.createElement('option')
firstGenreElement.value = 'any'
firstGenreElement.innerText = 'All Genres'
genreHtml.appendChild(firstGenreElement)

for (const [id, name] of Object.entries(genres)) {
    const element = document.createElement('option')
    element.value = id
    element.innerText = name
    genreHtml.appendChild(element)
}

document.querySelector('[data-search-genres]').appendChild(genreHtml)

const authorsHtml = document.createDocumentFragment()
const firstAuthorElement = document.createElement('option')
firstAuthorElement.value = 'any'
firstAuthorElement.innerText = 'All Authors'
authorsHtml.appendChild(firstAuthorElement)

for (const [id, name] of Object.entries(authors)) {
    const element = document.createElement('option')
    element.value = id
    element.innerText = name
    authorsHtml.appendChild(element)
}

document.querySelector('[data-search-authors]').appendChild(authorsHtml)

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.querySelector('[data-settings-theme]').value = 'night'
    document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
    document.documentElement.style.setProperty('--color-light', '10, 10, 20');
} else {
    document.querySelector('[data-settings-theme]').value = 'day'
    document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
    document.documentElement.style.setProperty('--color-light', '255, 255, 255');
}

document.querySelector('[data-list-button]').innerText = `Show more (${books.length - BOOKS_PER_PAGE})`
document.querySelector('[data-list-button]').disabled = (matches.length - (page * BOOKS_PER_PAGE)) > 0

document.querySelector('[data-list-button]').innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
`

document.querySelector('[data-search-cancel]').addEventListener('click', () => {
    document.querySelector('[data-search-overlay]').open = false
})

document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
    document.querySelector('[data-settings-overlay]').open = false
})

document.querySelector('[data-header-search]').addEventListener('click', () => {
    document.querySelector('[data-search-overlay]').open = true 
    document.querySelector('[data-search-title]').focus()
})

document.querySelector('[data-header-settings]').addEventListener('click', () => {
    document.querySelector('[data-settings-overlay]').open = true 
})

document.querySelector('[data-list-close]').addEventListener('click', () => {
    document.querySelector('[data-list-active]').open = false
})

document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const { theme } = Object.fromEntries(formData)

    if (theme === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
        document.documentElement.style.setProperty('--color-light', '10, 10, 20');
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
        document.documentElement.style.setProperty('--color-light', '255, 255, 255');
    }
    
    document.querySelector('[data-settings-overlay]').open = false
})

document.querySelector('[data-search-form]').addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const filters = Object.fromEntries(formData)
    const result = []

    for (const book of books) {
        let genreMatch = filters.genre === 'any'

        for (const singleGenre of book.genres) {
            if (genreMatch) break;
            if (singleGenre === filters.genre) { genreMatch = true }
        }

        if (
            (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) && 
            (filters.author === 'any' || book.author === filters.author) && 
            genreMatch
        ) {
            result.push(book)
        }
    }

    page = 1;
    matches = result

    if (result.length < 1) {
        document.querySelector('[data-list-message]').classList.add('list__message_show')
    } else {
        document.querySelector('[data-list-message]').classList.remove('list__message_show')
    }

    document.querySelector('[data-list-items]').innerHTML = ''
    const newItems = document.createDocumentFragment()

    for (const { author, id, image, title } of result.slice(0, BOOKS_PER_PAGE)) {
        const element = document.createElement('button')
        element.classList = 'preview'
        element.setAttribute('data-preview', id)
    
        element.innerHTML = `
            <img
                class="preview__image"
                src="${image}"
            />
            
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `

        newItems.appendChild(element)
    }

    document.querySelector('[data-list-items]').appendChild(newItems)
    document.querySelector('[data-list-button]').disabled = (matches.length - (page * BOOKS_PER_PAGE)) < 1

    document.querySelector('[data-list-button]').innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
    `

    window.scrollTo({top: 0, behavior: 'smooth'});
    document.querySelector('[data-search-overlay]').open = false
})

document.querySelector('[data-list-button]').addEventListener('click', () => {
    const fragment = document.createDocumentFragment()

    for (const { author, id, image, title } of matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)) {
        const element = document.createElement('button')
        element.classList = 'preview'
        element.setAttribute('data-preview', id)
    
        element.innerHTML = `
            <img
                class="preview__image"
                src="${image}"
            />
            
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `

        fragment.appendChild(element)
    }

    document.querySelector('[data-list-items]').appendChild(fragment)
    page += 1
})

document.querySelector('[data-list-items]').addEventListener('click', (event) => {
    const pathArray = Array.from(event.path || event.composedPath())
    let active = null

    for (const node of pathArray) {
        if (active) break

        if (node?.dataset?.preview) {
            let result = null
    
            for (const singleBook of books) {
                if (result) break;
                if (singleBook.id === node?.dataset?.preview) result = singleBook
            } 
        
            active = result
        }
    }
    
    if (active) {
        document.querySelector('[data-list-active]').open = true
        document.querySelector('[data-list-blur]').src = active.image
        document.querySelector('[data-list-image]').src = active.image
        document.querySelector('[data-list-title]').innerText = active.title
        document.querySelector('[data-list-subtitle]').innerText = `${authors[active.author]} (${new Date(active.published).getFullYear()})`
        document.querySelector('[data-list-description]').innerText = active.description
    }
})*/
