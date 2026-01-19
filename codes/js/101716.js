
let lastInputString = 0.01;
// This code was generated with chatGPT
document.addEventListener("htmx:afterRequest", function(evt) {
    if (evt.detail.xhr.getResponseHeader("HX-Location")) {
        setTimeout(() => {
            window.location.reload(); // Forces full reload after redirect
        }, 100); // Small delay to ensure redirection is processed
    }
});

// Snippet got from the W3C $$
var dropdown = document.getElementsByClassName("dropdown-btn");
var i;

for (i = 0; i < dropdown.length; i++) {
    dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "flex") {
            dropdownContent.style.display = "none";
        } else {
            dropdownContent.style.display = "flex";
        }
    });
}
//$$

//Code generated with chatgpt
function validateForm(event) {
    let form = event.target.closest("form");
    if (!form.checkValidity()) {
        alert("Please finish filling the form! Check if you miss any required ('*') field!");
        event.preventDefault(); // Prevent HTMX from sending request
        form.reportValidity(); // Show default validation messages
    }
}

function validateClosure(event) {
    const option = document.getElementById("closure-select")
    const reviewData = document.getElementById("review");
    if (option.options[0].selected) {
        event.preventDefault();
        reviewData.style.display = "none"
    } else {
        reviewData.style.display = "flex"
    }
} 

function changeOption(input) {
    for (i = 0; i < input.length; i++) {
        if (input.options[i].selected) {
            opt = document.getElementById("remaining").options[i];
            opt.selected = true;
            document.getElementById("MaxAmount").max = opt.value;
        }
    }
}

function displayReview(option) {
    const reviewData = document.getElementById("review");
    if (option.options[0].selected) {
        reviewData.style.display = "none";
    } else {
        reviewData.style.display = "flex";   
    }
}

function verifyPaymentAmount(input) {
    for (i = 0; i < input.value.length; i++) {
        if (input.value.at(i) === "." && input.value.substring(i).length > 2) {
            input.value = parseFloat(input.value).toFixed(2);
            break;
        }
    }

    if (input.value.length != 0) {
        lastInputString = input.value;
    }

    console.log(input.min)
    if (parseFloat(input.value) > input.max) {
        input.value = input.max;
        lastInputString = input.value;
        return;
    } else if (parseFloat(input.value) < parseFloat(0.01)) {
        input.value = 0.01;
        lastInputString = input.value;
        return ;
    }

    input.value = lastInputString;
}

function handleResponse(event) {
    let xhr = event.detail.xhr;
    let status = xhr.getResponseHeader("HX-Status");
    let message = xhr.getResponseHeader("HX-Message");
    if (status === "202") {
        return ;
    } else if (status === "200") {
        alert(message); // Show the success message
        document.getElementById("form-div").reset();
        setTimeout(() => {
            window.location.reload(); // Forces full reload after redirect
        }, 100); // Small delay to ensure redirection is processed
    } else if (status === "400") {
        alert(message); // Show the error message
    } else {
        alert("Something went wrong. Please try again.");
    }
}

function insertPhone(rmType) {
    const region = document.getElementById("ins_reg")
    const number = document.getElementById("ins_pn")

    if (region.value === "") {
        alert("Please input something in the region number!")
        return
    }

    if (parseInt(region.value) <= 0) {
        alert("Please input a valid region number!");
        return;
    } 

    if (number.value === "") {
        alert("Please input something as your phone number!")
        return
    }

    if (parseInt(number.value) < 10000000 || parseInt(number.value) > 99999999) {
        alert("Please input a valid phone number!");
        return;
    } 

    const table = document.getElementById("phone-numbers")
    const rows = table.rows
    
    for (let i = 1; i < rows.length; i++) {
        const cells =  rows[i].cells
        const phoneValue = cells[1].querySelector('input').value;
        
        if (phoneValue == number.value) {
            alert("Already inserted that phone number!");
            return ;
        }
    }

    const row = table.insertRow(rows.length);
    var regionCell = row.insertCell(0);
    var numberCell = row.insertCell(1);
    var cancelCell = row.insertCell(2);
    regionCell.innerHTML = `<input readonly type="text" value="${region.value}" name="region">`;
    numberCell.innerHTML = `<input readonly type="text" value="${number.value}" name="number">`;
    if (rmType === "button") {
        cancelCell.innerHTML = `<input type="button" value="rm" onclick="removeRow(${rows.length - 1})">`;
    } else if (rmType === "check") {
        cancelCell.innerHTML = `<input type="hidden" name="actions" value="keep"><input type="button" value="insert" onclick="changeToRm(this)">`;
    }

    region.value = "";
    number.value = "";
}

function changeToRm(button) {
    let hiddenInput = button.previousElementSibling; // Get hidden input
    if (hiddenInput.value === "keep") {
        hiddenInput.value = "rm"; // Change value
        button.value = "Remove"; // Change button text
        button.style.backgroundColor = "red"; // Optional: Change button style
    } else {
        hiddenInput.value = "keep"; // Toggle back
        button.value = "Keep";
        button.style.backgroundColor = "";
    }}

function removeRow(rowNo) {
    document.getElementById("phone-numbers").deleteRow(rowNo);
}

