
function includeHTML() {
    var z, i, elmnt, file, xhttp;
    /*loop through a collection of all HTML elements:*/
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
      elmnt = z[i];
      /*search for elements with a certain atrribute:*/
      file = elmnt.getAttribute("w3-include-html");
      if (file) {
        /*make an HTTP request using the attribute value as the file name:*/
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4) {
            if (this.status == 200) {elmnt.innerHTML = this.responseText;}
            if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
            /*remove the attribute, and call this function once more:*/
            elmnt.removeAttribute("w3-include-html");
            includeHTML();
          }
        }      
        xhttp.open("GET", file, true);
        xhttp.send();
        /*exit the function:*/
        return;
      }
    }
  };

document.addEventListener("DOMContentLoaded", function () {
    const article_link = [
        'gen-ai.html',
        'games-uxr.html',
        'stakeholders.html',
        'methods.html',
        'ethics.html',
        'business.html'
    ];

    console.log('article_link:', article_link);

    let currentIndex = 0; // Start with the first video
  
    // Button and video element references
    const surprise_button = document.getElementsByClassName('surprise')[0];

    console.log(surprise_button);
  
    // Event listener for button click
    surprise_button.addEventListener('click', () => {
        console.log("surprise clicked");
        console.log(surprise_button);


        // Randomize website url and set to new_link
        const new_link = article_link[Math.floor(Math.random() * article_link.length)];

        console.log(new_link);

    
        // Update the source
        surprise_button.setAttribute('src', new_link);

        console.log(surprise_button);

        // Go to the new link
        // Code gotten from https://www.semrush.com/blog/javascript-redirect/
        window.location.href = new_link;
    });

    includeHTML();
});




// Loads the footer into the page once loaded
// Idea suggested by ChatGPT. Prompt: Can i do like a new "footer.html" and have that inserted at the bottom using JS. 
// document.addEventListener("DOMContentLoaded", function () {
//     console.log('huh')
//     fetch('footer.html')
//         .then(response => response.text())
//         .then(html => {
//             document.getElementById('footer-placeholder').innerHTML = html;
//         })
//         .catch(err => console.error('Failed to load footer: ', err));
// });