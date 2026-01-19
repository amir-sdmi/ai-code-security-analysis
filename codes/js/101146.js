// Uses the fileSaver.js library to implement saving feature
function saveFile() {
    let output = document.getElementById("noteInput").value;
    let file_name = prompt("Please enter the file name", "MyNote");

    if (file_name) {
        let blob = new Blob([output], { type: "text/plain;charset=utf-8" });
        saveAs(blob, file_name + ".md");
    }
}

// This function reads a file from the user's local storage
// It was fully implemented with the use of ChatGPT
function readFile() {
    // Get the input element
    var fileInput = document.getElementById('file-input');

    // Check if a file is selected
    if (fileInput.files.length > 0) {
        // Get the selected file
        var file = fileInput.files[0];

        // Create a FileReader object
        var reader = new FileReader();

        // Define the function to be executed when the file is loaded
        reader.onload = function (e) {
            // Get the contents of the file
            var contents = e.target.result;

            // Display the contents in the textarea
            var fileContentsTextarea = document.getElementById('noteInput');
            fileContentsTextarea.value = contents;
        };

        // Read the file as text
        reader.readAsText(file);
    }

}


function newDocument() {
    // Get the current content of the document
    let content = document.getElementById("noteInput").value;

    // Check if the document is not empty
    if (content.length > 0) {
        // Ask the user if they want to save the current document
        let save = confirm("Do you want to save the current document?");

        // If the user chooses to save calls saveFile()
        if (save) {
            saveFile();
        }
    }

    // Clear the content of the document to start a new one
    document.getElementById("noteInput").value = '';
    document.getElementById("note-display").innerText = '';
}

// This functions toggles the sidebar when you hover over the the left edge of the screen
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');

    //This function keeps the sidebar visible when the mouse is over it
    sidebar.addEventListener('mouseover', function () {
        sidebar.style.transform = "translateX(0%)";
    });

    //This function keeps closes the sidebar when the mouse leaves the sidebar area
    sidebar.addEventListener('mouseout', function () {
        if (!isMouseOverElement(sidebar) && !isCursorNearLeftEdge()) {
            sidebar.style.transform = "translateX(-100%)";
        }
    });

    // helper function to find if the mouse was over an element chatGPT was used to write this function
    function isMouseOverElement(element) {
        const rect = element.getBoundingClientRect();
        return (
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
    }
    // made using chatGPT to check if cursor is near the left edge of the user's browser window
    function isCursorNearLeftEdge() {
        const threshold = 10;
        return event.clientX <= threshold;
    }
});
