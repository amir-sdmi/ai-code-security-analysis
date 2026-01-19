function printError(elemId, hintMsg){
    document.getElementById(elemId).innerHTML = hintMsg;
}

function contactUs(){ 
    var name = document.mydata.name.value;
    var email = document.mydata.email.value;
    var message = document.mydata.message.value;
    
    // ___ Defining error varriables with default value
    var name_err = email_err = message_err = true;

    // _______ validating Name
    if(name === ""){
        printError("name_err", "Please Enter Your Name");
        const errId = document.getElementById('name');
        errId.style.border = '1px solid red';
    }
    else  if(name.length < 5 || name.length > 50){
        printError("name_err", "Names should be between 5-50 characters");
        const errId = document.getElementById('name');
        errId.style.border = '1px solid red';
    }
    else{
        var regex = /^[a-zA-Z\s]+$/;
        if(regex.test(name) === false){
            printError("name_err", "Names should not include numeral characters.");
            const errId = document.getElementById('name');
            errId.style.border = '1px solid red';
        }else{
            var uppercase = /^[A-Z][a-z]* [A-Z][a-z]*/;
            if(uppercase.test(name) === false){
            printError("name_err", "First letter of Name should be In Uppercase i.e Phil Ubuntu");
            const errId = document.getElementById('name');
            errId.style.border = '1px solid red';
        }else{
            printError("name_err", "");
            name_err = false;
        }
        }
    }

    // _______ validating Email Info
    if(email === ""){
        printError("email_err", "Email cannot be left Empty");
        const errId = document.getElementById('email');
        errId.style.border = '1px solid red';
    }else{
        var letters = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;;
        if(letters.test(email) === false){
            printError("email_err", "Invalid Email(Include @)")
            const errId = document.getElementById('email');
            errId.style.border = '1px solid red';
        }else{
            printError("email_err", "");
            email_err = false;
        }
    }

    // _______ validating message
    if(message === ""){
        printError("message_err", "Please Enter Your Message");
        const errId = document.getElementById('message');
        errId.style.border = '1px solid red';
        }    else{
            var uppercase = /^[A-Z][a-z]*/;
            if(uppercase.test(message) === false){
                printError("message_err", "First letter Should be In CapsLock e.g This is..");
                const errId = document.getElementById('message');
                errId.style.border = '1px solid red';
            }else{
            printError("message_err", "");
            message_err = false;
        }
    }

    // // __Preventing the form from being submited if their are any errors
    // if(( name_err || email_err || message_err) === true){
    //     // Temporary removing this as suggested by ChatGPT when calling 2 function on submit button
    //     // we removed the event.preventDefault don't use this code in other project.
    //     // event.preventDefault()
    // }else{
    //     event.currentTarget.submit()
    // }  
}

    // Send Email      
    function sendMail() {
        var params = {
          name: document.getElementById("name").value,
          email: document.getElementById("email").value,
          message: document.getElementById("message").value,
        };
      
        const serviceID = "service_0vlh0ul";
        const templateID = "template_9n4gyyb";
      
          emailjs.send(serviceID, templateID, params)
          .then(res=>{
              document.getElementById("name").value = "";
              document.getElementById("email").value = "";
              document.getElementById("message").value = "";
              console.log(res);
              alert("Your message sent successfully!!")
      
          })
          .catch(err=>console.log(err));
      }

    // async function sendMail() {
    //     var params = {
    //       name: document.getElementById("name").value,
    //       email: document.getElementById("email").value,
    //       message: document.getElementById("message").value,
    //     };
      
    //     const serviceID = "service_0vlh0ul"; // Replace with your EmailJS service ID
    //     const templateID = "template_9n4gyyb"; // Replace with your EmailJS template ID
      
    //     try {
    //       const result = await emailjs.send(serviceID, templateID, params);
    //       console.log(result);
    //       alert("Your message sent successfully!!");
    //       // Clear the form fields after successful submission
    //       document.getElementById("name").value = "";
    //       document.getElementById("email").value = "";
    //       document.getElementById("message").value = "";
    //     } catch (error) {
    //       console.error("Error sending email:", error);
    //     }
    //   }

      function submitForm() {
        // Call contactUs() first to perform validation
        contactUs();

          // Prevent the default form submission
        event.preventDefault();
      
        // Check if the validation was successful before proceeding with sending email
        if (!name_err && !email_err && !message_err) {
          // If validation passes, call the sendMail() function to submit the form data via emailJS
          sendMail();
        } else {
          // If there are validation errors, do nothing. The form will not submit.
        }
      }

    