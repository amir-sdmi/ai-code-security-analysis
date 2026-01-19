// Coding assisted by Gemini at https://gemini.google.com/app/052aa114c034c579

// Function to fetch and parse CSV file
async function fetchCSV() {
    // console.log("Fetching images.csv file..."); // Debugging log
    try {
        const response = await fetch("art/images.csv"); // Load CSV file - Ensure path is correct relative to index.html
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        // console.log("images.csv fetched."); // Debugging log
        return parseCSV(data); // Parse CSV content
    } catch (error) {
        console.error("Error fetching images.csv:", error);
        // Display an error message on the page if fetch fails
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = `Error loading gallery data: ${error.message}`;
        document.body.appendChild(errorDiv); // Or append to a specific error area
        return []; // Return empty array on error to prevent further issues
    }
}

// Function to parse CSV with quoted values and apply formatting rules
function parseCSV(csvText) {
    // console.log("Parsing CSV text..."); // Debugging log
    const rows = csvText.trim().split("\n");
    if (rows.length === 0) {
        console.warn("CSV file is empty."); // Debugging log
        return [];
    }
    // Assuming header is always the first row:
    rows.shift(); // Remove headers

    const imageData = rows.map(row => {
        // ✅  Manual parsing loop to handle quoted fields and escaped quotes more robustly
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1]; // Look ahead for escaped quotes

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentValue += '"'; // Handle escaped quote "" -> add a single quote
                    i++; // Skip the next quote character
                } else {
                    inQuotes = !inQuotes; // Enter or exit quote mode
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue); // Do not trim yet, trim after getting value
                currentValue = '';
            } else {
                // Otherwise, append the character to the current value
                currentValue += char;
            }
        }
        values.push(currentValue); // Push the last value after the loop

        // Trim leading/trailing whitespace from each collected value
        const trimmedValues = values.map(val => val.trim());

        if (trimmedValues.length < 3) {
            console.warn(`Skipping row due to incorrect format: "${row}"`); // Debugging log for skipped rows
            return null;
        }

        // Access values from the trimmed array and remove surrounding quotes
        const folder = trimmedValues[0].replace(/"/g, "").trim();
        const originalName = trimmedValues[1].replace(/"/g, "").trim(); // Name from CSV (for filenames)
        const tags = trimmedValues[2].replace(/"/g, "").trim();

        // Start with original name for display processing
        let displayName = originalName;

        // ✅  Rule 1: If the name ends with digits, insert &pound; before them
        // Apply this rule first
        const endsWithDigitsMatch = originalName.match(/(\d+)$/);
        if (endsWithDigitsMatch) {
            displayName = originalName.replace(/(\d+)$/, '&pound;$1');
        }

        // ✅  Rule 2: If displayname contains "x" immediately followed by a digit, replace "x" with &times;
        // Apply this rule to the current displayName (result of Rule 1)
        displayName = displayName.replace(/x(\d)/g, '&times;$1');

        // console.log(`Parsed: Original='${originalName}', Display='${displayName}', Folder='${folder}', Tags='${tags}'`); // Debugging parsed data

        return {
            folder: folder,
            name: originalName, // Original name (for filenames)
            displayName: displayName, // Modified name for display with both rules applied
            tags: tags
        };
    }).filter(item => item !== null);

    // console.log(`CSV parsing complete. Found ${imageData.length} valid image entries.`); // Debugging log
    return imageData;
}

// Function to generate HTML from CSV data and initialize scripts
async function generateGalleryAndInitialize() {
    // console.log("Starting gallery generation and initialization..."); // Debugging log
    const imageData = await fetchCSV();

    // Target the div with class "row" that is inside .projects-holder
    const galleryRow = document.querySelector('.projects-holder > .row');

    if (!galleryRow) {
        console.error("Error: Could not find the gallery row element (.projects-holder > .row).");
        // Display an error message on the page
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Error loading gallery: Gallery container not found.';
        document.body.appendChild(errorDiv); // Or append to a specific error area
        return; // Stop execution if the container is not found
    }

    // Clear any existing placeholder content within the row
    galleryRow.innerHTML = '';

    let galleryHTML = '';
    if (imageData.length > 0) {
        imageData.forEach((item) => {
            galleryHTML += `
                <div class="col-md-6 col-sm-6 project-item mix ${item.tags}">
                    <!-- div class="thumbnail" -->
                        <div class="image">
                            <a href="art/${item.folder}/${item.name}.jpg" data-lightbox="gallery" data-title="${item.displayName}">
                                <img src="art/${item.folder}/thumb/${item.name}.jpg" alt="${item.displayName}">
                            </a>
                            <span class="alt-tooltip"></span> <!-- Make sure this line IS PRESENT -->
                        </div>
                    <!-- /div -->
                </div>
                `;
        });
        // The above class should be thumbnail, but Sarah liked the no border look. So corrupt the class name or rem out the div.
        // console.log(`Generated HTML for ${imageData.length} images.`); // Debugging log
    } else {
        console.warn("No valid image data found in CSV to generate gallery."); // Debugging log
        galleryHTML = '<p>No gallery items available.</p>'; // Display message if no images
    }


    // Append all generated HTML to the row element
    galleryRow.innerHTML += galleryHTML;

    // console.log("Gallery HTML appended to .projects-holder > .row."); // Debugging log

    // ✅  IMPORTANT: Call initializeTooltips() IMMEDIATELY AFTER HTML IS INJECTED ?
    initializeTooltips();
    // console.log("initializeTooltips() called after HTML injection.");


    // ✅  After adding elements, tell MixItUp to REMIX with filter 'all'
    // Use a short delay
    setTimeout(() => {
        // Check if jQuery and MixItUp are loaded
        if (typeof $ !== 'undefined' && typeof $.fn.mixitup !== 'undefined') {
            // console.log("Attempting MixItUp remix 'all' after generation."); // Debugging log
            // Select the MixItUp container (.projects-holder) and call the remix method
            $('.projects-holder').mixitup('remix', 'all'); // Use remix for v1.5.5
            // console.log("MixItUp remix 'all' command issued."); // Debugging log
        } else {
            console.warn("jQuery or MixItUp library not loaded. Cannot trigger remix.");
        }
    }, 500); // User tested delay


    // ✅  Programmatically click the 'all' filter button after a slightly longer delay
    // This mimics the user action that currently fixes the blank display on load.
    setTimeout(() => {
        // Select the 'all' filter button - Adjust selector if yours is different
        const allFilterButton = document.querySelector('.filter[data-filter="all"]');

        if (allFilterButton) {
            // console.log("Programmatically clicking the 'all' filter button."); // Debugging log
            allFilterButton.click(); // Simulate a click
            // console.log("'all' filter button clicked programmatically."); // Debugging log
        } else {
            console.warn("Could not find the 'all' filter button with selector '.filter[data-filter=\"all\"]'.");
        }
    }, 400); // User tested delay


    // ✅  Reinitialize Lightbox after images are added
    // Ensure Lightbox initializes after content is likely visible and positioned
    setTimeout(() => {
        if (typeof lightbox !== "undefined") {
            // console.log("Initializing Lightbox..."); // Debugging log
            lightbox.init();
            // console.log("Lightbox initialized."); // Debugging log
        } else {
            console.warn("Lightbox library not found.");
        }
    }, 500); // User tested delay

    // console.log("Gallery generation and initialization process complete."); // Debugging log
}

// Ensure everything loads in the correct order
document.addEventListener("DOMContentLoaded", async function() {
    // console.log("DOMContentLoaded fired. Starting gallery generation and initialization process."); // Debugging log
    // Keep this direct call.
    await generateGalleryAndInitialize();
    // console.log("Initial gallery setup process initiated."); // Debugging log
    // New code to link "Contact Me" text in the portfolio section to the pop-up button.
    // Attach a click handler to the new "Contact Me" hyperlink.
    // When this hyperlink is clicked, it will programmatically trigger a click
    // on the existing `.pop-button` element. This leverages the pop-up's
    // existing display logic that is already handled by other scripts (e.g., plugins.js).
    // Use a slight delay to ensure all pop-up related scripts are loaded and ready.
    setTimeout(() => {
        const portfolioContactLink = document.getElementById('portfolioContactLink');
        if (portfolioContactLink) {
            portfolioContactLink.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent the default action of the anchor link (e.g., jumping to the top of the page).
                const popButton = document.querySelector('.pop-button');
                if (popButton) {
                    popButton.click(); // Programmatically trigger the click event on the original pop-up button.
                    // console.log("'Contact Me' link clicked, triggered pop-up button behavior."); // NWW Debug Log
                } else {
                    console.warn("'.pop-button' element not found to trigger contact pop-up.");
                }
            });
        } else {
            console.warn("NWW: '#portfolioContactLink' element not found. Contact link functionality may not work.");
        }
    }, 100); // Small delay to ensure the .pop-button element is fully interactive.
});

// ------------------------------------------------------------------------------------------------------------------

// Function to fetch last updated date from a text file (art/lastmodified.txt)
// It will dynamically display the date from 'art/lastmodified.txt'.

async function displayLastModifiedDate(elementSelector, relativePathToTxtFile) {
    try {
        // Add a cache-busting timestamp to the URL to ensure the latest version is always fetched
        const cacheBuster = new Date().getTime();
        const fullUrl = new URL(`${relativePathToTxtFile}?_=${cacheBuster}`, window.location.href).href;

        // console.log(`Attempting to fetch last modified date from: ${fullUrl}`); // Debugging

        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${fullUrl}`);
        }

        // Read the date directly from the text file content
        const formattedDate = await response.text();

        // Find the placeholder element in the HTML and update its text content
        const dateElement = document.querySelector(elementSelector);
        if (dateElement) {
            dateElement.textContent = `${formattedDate.trim()}`; // trim() removes any leading/trailing whitespace. Literal text can be inserted before $
            // console.log(`Successfully updated date in '${elementSelector}' to: ${formattedDate.trim()}`); // Debugging
        } else {
            console.warn(`Element with selector '${elementSelector}' not found for date display.`);
        }
    } catch (error) {
        console.error(`Error fetching last modified date from '${relativePathToTxtFile}':`, error);
    }
}

// Ensure the script runs after the entire page has loaded,
// so the '.last-updated' element is available in the DOM.
window.addEventListener('load', () => {
    // Call the function to display the last modified date from 'art/lastmodified.txt'
    displayLastModifiedDate('.last-updated', 'art/lastmodified.txt'); // Changed target file
});

// ------------------------------------------------------------------------------------------------------------------

// Function to initialize tooltips after the gallery HTML has been added to the DOM
function initializeTooltips() {
    // console.log('initializeTooltips() called.'); // Debugging log

    // Get all image container elements (elements with the .image class)
    const imageContainers = document.querySelectorAll('.image');

    // console.log(`Found ${imageContainers.length} image containers.`); // Debugging log

    // Loop through each image container to attach event listeners
    imageContainers.forEach(container => {
        const img = container.querySelector('img');
        const tooltip = container.querySelector('.alt-tooltip');

        if (img) {
            // console.log(`Processing image: ${img.alt}`);
        } else {
            console.log('Image not found in container.');
        }
        if (tooltip) {
            // console.log('Tooltip span found.');
        } else {
            console.log('Tooltip span NOT found.');
        }

        // Check if both image and tooltip elements exist within the container
        if (img && tooltip) {
            // Set the tooltip's text content to the image's alt attribute
            tooltip.textContent = img.alt;

            let mouseMoveHandler = null; // Declare outside to remove correctly

            // Event listener for when the mouse enters the image container
            container.addEventListener('mouseenter', (event) => {
                // console.log('Mouse entered image, showing tooltip.'); // Debugging log
                // Show the tooltip
                tooltip.style.display = 'block';

                // Define the mousemove handler
                mouseMoveHandler = (e) => {
                    const mouseX = e.clientX;
                    const mouseY = e.clientY;
                    const offsetX = 15; // Pixels to the right of the cursor
                    const offsetY = 15; // Pixels below the cursor

                    tooltip.style.left = (mouseX + offsetX) + 'px';
                    tooltip.style.top = (mouseY + offsetY) + 'px';

                    // Optional: Prevent tooltip from going off-screen (more advanced, can be added later)
                    // You would get tooltip's dimensions and window dimensions here
                    // const tooltipRect = tooltip.getBoundingClientRect();
                    // if (mouseX + offsetX + tooltipRect.width > window.innerWidth) {
                    //     tooltip.style.left = (mouseX - tooltipRect.width - offsetX) + 'px'; // Move to left of cursor
                    // }
                    // if (mouseY + offsetY + tooltipRect.height > window.innerHeight) {
                    //     tooltip.style.top = (mouseY - tooltipRect.height - offsetY) + 'px'; // Move above cursor
                    // }
                };

                // Add the mousemove listener to the *container*
                container.addEventListener('mousemove', mouseMoveHandler);
            });

            // Event listener for when the mouse leaves the image container
            container.addEventListener('mouseleave', () => {
                // console.log('Mouse left image, hiding tooltip.'); // Debugging log
                // Hide the tooltip
                tooltip.style.display = 'none';

                // Remove the mousemove listener to stop updating position
                if (mouseMoveHandler) {
                    container.removeEventListener('mousemove', mouseMoveHandler);
                    mouseMoveHandler = null; // Clear the handler reference
                }
            });
        }
    });
}

// ------------------------------------------------------------------------------------------------------------------

// Function to dynamically display an email address to deter bots
function displayEmailAddress() {
    const username = 'sarah';
    const domain = 'sarart.uk';
    const atSymbol = '@';
    const dotSymbol = '.';

    // You can even break it further or use character codes for higher obfuscation, e.g.:
    // const usernameParts = ['sar', 'ah'];
    // const domainParts = ['sarart', 'uk'];
    // const fullEmail = usernameParts[0] + usernameParts[1] + atSymbol + domainParts[0] + dotSymbol + domainParts[1];
    // For simplicity, let's stick to direct concatenation for now unless needed.

    const fullEmail = username + atSymbol + domain;

    const emailElement = document.getElementById('contact-email');

    if (emailElement) {
        // emailElement.textContent = fullEmail;
        // Optional: rem the above line and un-rem next 4 or 5 lines if you want it to be a clickable mailto link too:
        const mailtoLink = document.createElement('a');
        mailtoLink.href = 'mailto:' + fullEmail;
        mailtoLink.textContent = fullEmail;
        emailElement.appendChild(mailtoLink);
        //console.log("Email address displayed via JS."); // Debugging
    } else {
        console.warn("Placeholder element with ID 'contact-email' not found for email display.");
    }
}

// Call the function when the DOM is ready, ensuring the placeholder exists
document.addEventListener('DOMContentLoaded', () => {
    // Other DOMContentLoaded-dependent functions might be called here (like generateGalleryAndInitialize)
    // Make sure displayEmailAddress is called after the HTML placeholder is available.
    displayEmailAddress();
});

// ------------------------------------------------------------------------------------------------------------------
