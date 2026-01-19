function isValidDateTimeFormat(str) {
    // writen using ChatGPT
    // Regular expression to match the format: dd/mm/YYYY, HH:MM:SS
    const regex = /^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/;

    // Check if the string matches the format
    const match = str.match(regex);
    
    if (!match) return false; // If no match, return false
    
    // Extract the date and time components
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);
    
    // Check if the date and time are valid
    const isValidDate = day >= 1 && day <= 31 && month >= 1 && month <= 12;
    const isValidTime = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;

    return isValidDate && isValidTime;
}


function addTask() {
    
    var taskName = document.getElementById("taskName").value;
    var deadline = document.getElementById("deadline").value;
    var content = document.getElementById("content").value;

    if (! isValidDateTimeFormat(deadline)){
        alert(deadline + " is not match the format: \"%d/%m/%Y, %H:%M:%S\"");
        return;
    }
    

    var dataToPost =  JSON.stringify({taskName: taskName,deadline: deadline,content: content})

    // return;
    fetch("/add-task", {
            method: "POST",
            body: dataToPost
    }).then((_res) => {
        
        window.location.href = "/";
    });


    
}

function editTask(){

    btn = document.getElementById("btn-apply");
    id = btn.getAttribute('data');
    var taskName = document.getElementById("taskName").value;
    var deadline = document.getElementById("deadline").value;
    var content = document.getElementById("content").value;
    var dataToPost =  JSON.stringify({taskName: taskName,deadline: deadline,content: content})

    // addTask();
    if (! isValidDateTimeFormat(deadline)){
        alert(deadline + " is not match the format: \"%d/%m/%Y, %H:%M:%S\"");
        return;
    }
    
    fetch("/add-task", {
        method: "POST",
        body: dataToPost
    }).then((_res) => {
        fetch(`/delete-task-noano/${id}`, {
            method: "GET",
        });
    }).then((_res) => {
        window.location.href = "/";
    });

    
}

