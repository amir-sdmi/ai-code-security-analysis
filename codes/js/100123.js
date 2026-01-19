document.getElementById("title").innerHTML="hey this is changed heading with js"
console.log(document.getElementById("title").className);  // get the class of element with id "title"
console.log(document.getElementById("title").id);  
console.log(document.getElementById("title").getAttribute('class'));  // gives value inside class
console.log(document.getElementById("title").getAttribute('id'));   // gives value inside id 

// see difference b/w them with CHATGPT



document.getElementById("myid").setAttribute('class','ourclass'); // override the class from myclass --> yourclass
// to not to replace and only add class do this 
document.getElementById("myid").setAttribute('class','ourclass myclass');

/*
    difference b/w 

*/
console.log("\n ***** difference section ********\n");
console.log(document.getElementById("testSection").innerHTML); // gives the full HTML like also give tag inside tag as well
console.log(document.getElementById("testSection").innerText); // display the content showing in real webpage
console.log(document.getElementById("testSection").textContent); // also shows the content which is set to "display: none" through css and not visible normally
