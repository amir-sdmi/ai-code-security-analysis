// Inefficient Code

// const home = document.querySelector('#home')
// const about = document.querySelector('#about')
// const contact = document.querySelector('#contact')


// const hometext = document.querySelector('#hometext')
// const abouttext = document.querySelector('#abouttext')
// const contacttext = document.querySelector('#contacttext')

// hometext.style.display = "block";
// hometext.style.width = "50%";

// home.addEventListener("click", function(){
//     removealltext();
//     hometext.style.display = "block";
//     hometext.style.width = "50";
// })

// about.addEventListener("click", function(){
//     removealltext();
//     abouttext.style.display = "block";
//     abouttext.style.width = "50";
// })

// contact.addEventListener("click", function(){
//     removealltext();
//     contacttext.style.display = "block";
//     contacttext.style.width = "50";
// })

// function removealltext(){
//     document.querySelectorAll("h3").forEach(function(h3){
//         h3.style.display = "none";
//     })
// }


//Efficient Code[Using chatgpt]
var divs = document.querySelectorAll('.tab');
var texts = document.querySelectorAll('h3');

texts[0].style.display = "block";
texts[0].style.width = "50%";

divs.forEach(function (div, index){
    div.addEventListener('click', function(){
        hideAlltext();
        texts[index].style.display = "block";
        texts[index].style.width = "50%";
    });
});

function hideAlltext(){
    texts.forEach(function (text) {
        text.style.display = "none";
    })
}