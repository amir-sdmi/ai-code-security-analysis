//written by chatgpt

window.onload = function() {
    // Get all elements with the class name "lightbox"
    var lightboxElements = document.getElementsByClassName("lightbox");

    // Define your event handler function for the lightbox elements
    function lightboxClickHandler(event) {
        // Your code to handle the click event on lightbox elements goes here
        // You can access the clicked element using 'event.target'
        // Example: console.log("Clicked element:", event.target);
        clearDetails(event.target)
    }

    // Add the click event handler to all "lightbox" elements
    for (var i = 0; i < lightboxElements.length; i++) {
        lightboxElements[i].addEventListener("click", lightboxClickHandler);
    }
    }

    function clearDetails(which) {
        // Get the parent of the clicked element
        var parent = which.parentNode;

        // Find the first checkbox element within the parent
        var firstChildCheckbox = parent.querySelector('input[type="checkbox"]');

        // Set the checked value to false
        if (firstChildCheckbox) {
            firstChildCheckbox.checked = false;
        }
     }