
    // SB Handle the "No file selected" text update & the filename display when a file is chosen for upload
    function updateFileName(inputElement) {
        const dropzone = document.getElementById('dropzone');
        const dropzoneText = document.getElementById('dropzone-text');
        const dropzoneIcon = document.querySelector('.dropzone-icon');
    
        if (inputElement.files.length > 0) {
            const fileName = inputElement.files[0].name;
            dropzoneText.innerText = `${fileName} file has been uploaded!`;
            dropzoneIcon.style.display = 'none'; // Hide the icon
        } else {
            dropzoneText.innerText = 'Drag your file here or click to explore!';
            dropzoneIcon.style.display = 'block'; // Show the icon
        }
    }
    
    
    
    // Trigger file input when dropzone is clicked
    document.getElementById('dropzone').addEventListener('click', function() {
        document.getElementById('hidden-file-input').click();
    });
    
    // Handle file selection from the file input
    document.getElementById('hidden-file-input').addEventListener('change', function(event) {
        let files = event.target.files; // Get the selected files
        for (let i = 0; i < files.length; i++) {
            console.log('Selected file:', files[i].name); // Process each file (example: logging file name)
        }
    });
    
    
    document.getElementById('dropzone').addEventListener('dragover', function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.style.backgroundColor = 'rgba(0, 210, 255, 0.2)';
    });
    document.getElementById('dropzone').addEventListener('drop', function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.style.backgroundColor = ''; // Reset background color
    
        const files = event.dataTransfer.files;
        document.getElementById('hidden-file-input').files = files; // Set the files to the hidden input
    
        // Update filename display and process files
        updateFileName(document.getElementById('hidden-file-input'));
    });
    
    
        const generateButton = document.getElementById('generate-button');
    
        generateButton.addEventListener('mouseover', function() {
            generateButton.textContent = 'Begin UMLify';
        });
    
        generateButton.addEventListener('mouseout', function() {
            generateButton.textContent = 'Generate UML Diagram';
        });
            // Define a function to limit API requests
        async function rateLimitedRequest(requestData) {
                // Implement your own rate-limiting logic here
                // For example, add a delay (e.g., 2 seconds) between requests
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                await delay(2000); // Adjust the delay as needed
    
                // Make the API request 
                return fetch('https://seniorprojectv5.azurewebsites.net/chatGPTRequest', { //Change URL to http://localhost:80 for local
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });
            }
    
    
    
    
        function interactWithChatGPT(userMessage) {
                document.getElementById('uml-generated-heading').textContent = 'UML Diagram Generating...';
    
                // Show loading circle
                document.getElementById('loading-circle').style.display = 'block';
    
                // Create a data object for the API request
                const requestData = {
                    model: 'gpt-3.5-turbo', // Specify the ChatGPT model
                    messages: [
                        { role: 'system', content: 'Please assist me in converting the following code to PlantUML format:' },
                        { role: 'user', content: userMessage },
                    ],
                    max_tokens: 1500, // You can adjust the max_tokens as needed
                };
    
                // Make an API request to ChatGPT
                console.log('API Request Data:', requestData);
                fetch('https://seniorprojectv5.azurewebsites.net/chatGPTRequest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                })
                    .then(response => response.json())
                    .then(data => {
                        // Hide loading circle
                        console.log('API Response:', data);
                        document.getElementById('loading-circle').style.display = 'none';
                        document.getElementById('uml-generated-heading').textContent = 'UML Diagram Generated:';
                        // Extract the response from ChatGPT
                        const chatGPTResponse = data.choices[0].message.content;
    
                        // Convert ChatGPT response to PlantUML format (customize this part)
                        const plantUMLCode = convertChatGPTResponseToPlantUML(chatGPTResponse);
    
                        // Display the PlantUML code
                        displayPlantUMLCode(plantUMLCode);

                        const regenerateButton = document.getElementById('regenerate-button');
                        if (regenerateButton) {
                            regenerateButton.style.display = 'block';
                            }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Hide loading circle in case of an error
                        document.getElementById('loading-circle').style.display = 'none';
                        document.getElementById('uml-generated-heading').textContent = 'Error Generating UML Diagram';
                    });
            }
    
    
    
    
            // Function to convert ChatGPT response to PlantUML format (customize this part)
        function convertChatGPTResponseToPlantUML(response) {
                // Parse the response
                const lines = response.split('\n');
                let plantUMLCode = '';
                let isInPlantUMLBlock = false;
    
                for (const line of lines) {
                    if (line.startsWith('@startuml')) {
                        isInPlantUMLBlock = true;
                        plantUMLCode += line + '\n';
                    } else if (line.startsWith('@enduml')) {
                        isInPlantUMLBlock = false;
                        plantUMLCode += line + '\n';
                    } else if (isInPlantUMLBlock) {
                        plantUMLCode += line + '\n';
                    }
                }
    
                return plantUMLCode;
            }
    
    
    
    
    
            // Function to display the PlantUML code and render the PlantUML diagram
        function displayPlantUMLCode(plantUMLCode) {
                // Log and verify this PlantUML code manually
                console.log('Original PlantUML Code: \n', plantUMLCode);
    
                // Encode the PlantUML code in HEX format
                const hexEncodedPlantUMLCode = encodePlantUMLInHex(plantUMLCode);
    
                // Construct the URL with HEX-encoded data
                const imageUrl = `https://www.plantuml.com/plantuml/png/~h${hexEncodedPlantUMLCode}`;
    
                // Log and manually access this URL to verify
                console.log('Image URL:', imageUrl);
    
                // Set the image source
                const plantUMLDiagramContainer = document.getElementById('plantUML-diagram-container');
                plantUMLDiagramContainer.innerHTML = '';
                const img = document.createElement('img');
                img.src = imageUrl;
                plantUMLDiagramContainer.appendChild(img);
                document.getElementById('generate-another-button').style.display = 'block';
            }
            
    
    function showUMLGeneratedText() {
        // Select the UML Generated heading and make it visible
        const umlGeneratedHeading = document.getElementById('uml-generated-heading');
        if (umlGeneratedHeading) {
            umlGeneratedHeading.style.display = 'block';
        }
    }
    
    
            // Function to encode PlantUML text in HEX format with correct line endings
        function encodePlantUMLInHex(plantUMLCode) {
                // Convert each character to HEX and include correct line endings (0D0A)
                let hex = '';
                for (let i = 0; i < plantUMLCode.length; i++) {
                    const charCode = plantUMLCode.charCodeAt(i).toString(16).toUpperCase();
                    hex += charCode.length < 2 ? '0' + charCode : charCode; // Ensure two characters for each code
                }
                return hex;
            }
    
    
    
    
    
            // Update the event listener to use ChatGPT
        document.getElementById('upload-form').addEventListener('submit', function (event) {
                event.preventDefault(); // Prevent the form submission
    
                // Get user input from the code file
                const fileInput = document.getElementById('hidden-file-input');
                const selectedFile = fileInput.files[0];
    
                if (selectedFile) {
                    // Read the contents of the selected file
                    showUMLGeneratedText()
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const codeContent = event.target.result;
    
                        // Send the code content to ChatGPT for conversion
                        interactWithChatGPT(codeContent);
                    };
                    reader.onerror = function (event) {
                        // Handle file read errors here
                        console.error('File read error:', event.target.error);
    
                        // Display an error message to the user
                        const plantUMLContainer = document.getElementById('plantUML-code-container');
                        plantUMLContainer.textContent = 'Error: Failed to read the selected file.';
                    };
                    reader.readAsText(selectedFile);
                }
                 else {
            // You might want to handle the case where no file is selected before submitting
            alert("Please select a file to generate the UML diagram.");
            }
            });
            
    
        // Function to show the UML Generated text
    function showUMLGeneratedText() {
        // Select the UML Generated heading and make it visible
        const umlGeneratedHeading = document.getElementById('uml-generated-heading');
        if (umlGeneratedHeading) {
            umlGeneratedHeading.style.display = 'block';
        }
    }   
     function clearDiagram() {
        const plantUMLDiagramContainer = document.getElementById('plantUML-diagram-container');
        plantUMLDiagramContainer.innerHTML = '';
        document.getElementById('generate-another-button').style.display = 'none';
    }
    
        // Function to generate another diagram
    function generateAnotherDiagram() {
        const fileInput = document.getElementById('hidden-file-input');
        fileInput.value = ''; // Reset the file input
        updateFileName(fileInput); // Reset the dropzone text
        
        // Hide the "Regenerate Diagram" button
        const regenerateButton = document.getElementById('regenerate-button');
        if (regenerateButton) {
            regenerateButton.style.display = 'none';
        }
        
        // Call the function to clear the last diagram
        const umlGeneratedHeading = document.getElementById('uml-generated-heading');
        umlGeneratedHeading.style.display = 'none';
        clearDiagram();
    }
        document.getElementById('generate-another-button').addEventListener('click', generateAnotherDiagram);



        document.addEventListener('DOMContentLoaded', function () {
            // Wrap your code in this event listener to ensure the DOM is fully loaded
        
            function regenerateDiagram() {
                const fileInput = document.getElementById('hidden-file-input');
                const selectedFile = fileInput.files[0];
        
                if (selectedFile) {
                    // Read the contents of the selected file
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const codeContent = event.target.result;
        
                        // Send the code content to ChatGPT for regeneration
                        interactWithChatGPT(codeContent);
                    };
                    reader.onerror = function (event) {
                        // Handle file read errors here
                        console.error('File read error:', event.target.error);
        
                        // Display an error message to the user
                        const plantUMLContainer = document.getElementById('plantUML-code-container');
                        plantUMLContainer.textContent = 'Error: Failed to read the selected file.';
                    };
                    reader.readAsText(selectedFile);
                } else {
                    // You might want to handle the case where no file is selected for regeneration
                    alert("Please select a file to regenerate the UML diagram.");
                }
            }
        
            // Add an event listener to the "Regenerate Diagram" button
            const regenerateButton = document.getElementById('regenerate-button');
            if (regenerateButton) {
                regenerateButton.addEventListener('click', regenerateDiagram);
            }
        });
        