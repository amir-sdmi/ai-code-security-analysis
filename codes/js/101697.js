// Javascript for the index page
// Form validation and form submission logic
// Original for this project with ChatGPT assistance

const validStateCodes = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'AS', 'DC', 'FM', 'GU', 'MH', 'MP', 'PW', 'PR', 'VI'
];


window.onload = function() {
    //fucntion to check if the user is logged - via the authentication in the backend.
    
    fetch('/check_login', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
        }
        else {

            // Check if lawyer_id is set
            if (data.lawyer_id) {
                // If it is, hide the login button and show the logout and lawyer view buttons
                document.getElementById('loginButton').style.display = 'none';
                document.getElementById('logoutButton').style.display = 'inline-block';
                document.getElementById('lawyerView').style.display = 'inline-block';
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}


document.getElementById("startIntakeBtn").addEventListener("click", function() {
    document.getElementById("intakeForm").style.display = "block";
    this.style.display = "none";
});




document.getElementById("submit").addEventListener("click", function(event) {
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(e => e.textContent = '');
    document.querySelectorAll('input, select, textarea').forEach(e => e.classList.remove('input-error'));

    // First Name Validation
    const firstName = document.getElementById("client_first_name");
    if (!firstName.value.trim()) {
        displayError(firstName, "First Name is required");
        isValid = false;
    }

    // Last Name Validation
    const lastName = document.getElementById("client_last_name");
    if (!lastName.value.trim()) {
        displayError(lastName, "Last Name is required");
        isValid = false;
    }

    // Case Type Validation
    const caseType = document.getElementById("type");
    if (caseType.value === "Please Select") {
        displayError(caseType, "Please select a case type");
        isValid = false;
    }

    // Description Validation
    const description = document.getElementById("description");
    if (!description.value.trim()) {
        displayError(description, "A description is required");
        isValid = false;
    }

    //phone number validation
    const phoneNumber = document.getElementById("phone_number");
    const phoneNumberRegex = /^\d{10}$/;
    if (!phoneNumberRegex.test(phoneNumber.value)) {
        displayError(phoneNumber, "Phone number must be 10 digits");
        isValid = false;
    }

    // Email Address Validation
    const emailAddress = document.getElementById("email_address");
    if (!emailAddress.value.trim() || !/\S+@\S+\.\S+/.test(emailAddress.value)) {
        displayError(emailAddress, "A valid email address is required");
        isValid = false;
    }

    // Street Address Validation
    const streetAddress = document.getElementById("street_address");
    if (!streetAddress.value.trim()) {
        displayError(streetAddress, "Street Address is required");
        isValid = false;
    }

    // City Validation
    const city = document.getElementById("city");
    if (!city.value.trim()) {
        displayError(city, "City is required");
        isValid = false;
    }

    // State Validation
    const state = document.getElementById("state");
    if (!state.value.trim() || state.value.trim().length !== 2 || !validStateCodes.includes(state.value.trim().toUpperCase())) {
        displayError(state, "Invalid state");
        isValid = false;
    }

    // Zip Validation
    const zip = document.getElementById("zip");
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(zip.value)) {
        displayError(zip, "Invalid zip");
        isValid = false;
    }


    if (!isValid) {
        event.preventDefault();
        return; // Stop the function if the form is not valid
    }

    if(isValid) {
        // Only proceed if the form is valid
        const formData = {
            client_first_name: document.getElementById("client_first_name").value,
            client_last_name: document.getElementById("client_last_name").value,
            type: document.getElementById("type").value,
            description: document.getElementById("description").value,
            phone_number: document.getElementById("phone_number").value,
            email_address: document.getElementById("email_address").value,
            address_street: document.getElementById("street_address").value,
            address_city: document.getElementById("city").value,
            address_state: document.getElementById("state").value,
            address_zip: document.getElementById("zip").value
        };

        fetch('/create_case', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            document.getElementById("intakeForm").style.display = "none";
            document.getElementById("thankYouMessage").style.display = "block";
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

function displayError(element, message) {
    const errorMessage = document.getElementById(element.id + "_error") 
    errorMessage.textContent = message;
    element.classList.add('input-error');
}
