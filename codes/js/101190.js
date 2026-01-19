// Javascript for the new-account page
// Form validation and form submission logic for creating a new lawyer account
// Original for this project with ChatGPT assistance

document.getElementById("submit").addEventListener("click", function(event) {
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(e => e.textContent = '');
    document.querySelectorAll('input, select, textarea').forEach(e => e.classList.remove('input-error'));


     // First Name Validation
     const firstName = document.getElementById("lawyer_first_name");
    
     
     if (!firstName.value.trim()) {
         displayError(firstName, "First Name is required");
         isValid = false;
     }
 
     // Last Name Validation
     const lastName = document.getElementById("lawyer_last_name");
     if (!lastName.value.trim()) {
         displayError(lastName, "Last Name is required");
         isValid = false;
     }


    // Password Validation
    const password = document.getElementById("password");
    if (!password.value.trim()) {
        displayError(password, "Please input a password");
        isValid = false;
    }

    const password2 = document.getElementById("password2");
    if (password.value.trim() !== password2.value.trim()) {
        displayError(password, "Passwords do not match");
        isValid = false;
    }



    // Email Address Validation
    const emailAddress = document.getElementById("email_address");
    if (!emailAddress.value.trim() || !/\S+@\S+\.\S+/.test(emailAddress.value)) {
        displayError(emailAddress, "A valid email address is required");
        isValid = false;
    }

    if (!isValid) {
        event.preventDefault();
        return; // Stop the function if the form is not valid
    }

    if(isValid) {
        // Only proceed if the form is valid
        const formData = {
            lawyer_first_name: document.getElementById("lawyer_first_name").value,
            lawyer_last_name: document.getElementById("lawyer_last_name").value,
            email_address: document.getElementById("email_address").value,
            password: document.getElementById("password").value,
        };

        fetch('/create_lawyer_account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            
            if (data.error) {
                document.getElementById("existingAccountMessage").style.display = "block";
                console.log(data.error);
            }
            else {
                console.log('Success:', data);
                document.getElementById("pleaseLogin").style.display = "block";
                document.getElementById("existingAccountMessage").style.display = "none";
                document.getElementById("loginForm").style.display = "none";
                console.log(data.error);
            }
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
