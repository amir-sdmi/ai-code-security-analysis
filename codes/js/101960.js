
//
////
//1 innerHtml
//2 innerText


document.querySelector(".box").innerHTML
// 'Hey this is class Box..!! '

document.querySelector(".box").innerHTML="i am jitu"
// 'i am jitu'
//----> changes the innerHtml

document.querySelector(".container").innerHTML
// '\n        <div class="box">Hey this is class Box..!! </div>\n    

document.querySelector("body").innerHTML
// '\n    <div class="container">\n        <div class="box">Hey this is class Box..!! </div>\n    </div>\n    \n\n'

document.querySelector(".container").innerText
// 'Hey this is class Box..!!'

//
////
//3 outerHTML
//4 outerText

document.querySelector(".container").outerHTML
// '<div class="container">\n        <div class="box">Hey this is class Box..!! </div>\n    </div>'

document.querySelector(".container").outerText
// 'Hey this is class Box..!!'


//5 nodeName
// The tagName property is meant specifically for element nodes (type 1 nodes) to get the type of element.
//6 tagName


document.querySelector(".container").nodeName
// 'DIV'

document.querySelector(".container").tagName
// 'DIV'


//7 hidden
//hiddes the element content

document.querySelector(".box").hidden
// false

// document.querySelector(".box").hidden="true"
// 'true'


//8  hasAttribute
//9  getAttribute
//10 setAttribute
// syntax :
// element.setAttribute(name, value)




document.querySelector(".container").hasAttribute("style")
// false

document.querySelector(".box").hasAttribute("style")
// true

document.querySelector(".box").getAttribute("style")
// ''

// document.querySelector(".box").setAttribute("display:inline")
// VM1822:1 Uncaught TypeError: Failed to execute 'setAttribute' on 'Element': 2 arguments required, but only 1 present.
//     at <anonymous>:1:32
// (anonymous) @ VM1822:1

//         [NEW] Explain Console errors by using Copilot in Edge: click 
//          to explain an error. 
//         Learn more
//         Don't show again

document.querySelector(".box").setAttribute("style","display:inline")
// undefined

document.querySelector(".box")
{/* <div class=​"box" style=​"display:​inline">​Hey this is class Box..!! ​</div>​ */}




// 11 attributes
// 12 removeAttribute

document.querySelector(".box").attributes
// NamedNodeMap {0: class, 1: style, class: class, style: style, length: 2}

document.querySelector(".box").removeAttribute("style")
// undefined

document.querySelector(".box").attributes
// NamedNodeMap {0: class, class: class, length: 1}


//
////
//13 designMode-->you can edit any info through using this particular line

document.designMode="on"
// 'on'


//14 data-createdby="harry"
//15 datset
document.querySelector(".box").dataset
// DOMStringMap {createdby: 'harry'}



// 16 data-conceptby
document.querySelector(".box").dataset
// DOMStringMap {createdby: 'harry', conceptby: 'jitu'}


// 17 createElement


// 18 append
// 19 prepend
 

let div=document.createElement("div");
div.innerHTML="new data element  <b> DIV inserted</b>"
div.setAttribute("class","created");
//
document.querySelector(".container").append(div)

//
////
// document.querySelector(".container").prepend(div)

//
///
////
// 20 after
// 21 before 




// document.querySelector(".container").before(div)
// undefined//


// document.querySelector(".container").after(div)
// undefined//

//
///
////
//////
// 22 replacewith

let div1=document.createElement("div");
div1.innerHTML="new data element  <b> DIV replaced</b>"
div1.setAttribute("class","created");
document.querySelector(".container").children[1].replaceWith(div1)
// undefined


// 23 insertAdjacentElement()
// 24 insertAdjacentHTML()
// 25 insertAdjacentText()

// The insertAdjacentElement() method inserts a an element into a specified position.
// syntax :
// node.insertAdjacentElement(position, element)

// The insertAdjacentHTML() method inserts HTML code into a specified position
// Syntax :
// element.insertAdjacentHTML(position, html)

// The insertAdjacentText() method inserts a a text into a specified position.
// Syntax  :
// element.insertAdjacentText(position, text)

///
////
/////
//////
// Parameter  ->	Description
// position	  ->    Required.
// A position relative to the element:

// Value	            Description
// 1 afterbegin	        After the beginning of the element (first child)
// 2 afterend	        After the element
// 3 beforebegin	    Before the element
// 4 beforeend	        Before the end of the element (last child)
// text	          ->    The text to insert.

let div2=document.createElement("div");
div2.innerHTML="<b>insertAdjacentElement </b>"
div2.setAttribute("class","created");
document.querySelector(".container").insertAdjacentElement("afterbegin",div2)
document.querySelector(".container").insertAdjacentHTML("afterbegin","<div><b>insertAdjacentHTML</b></div>")
document.querySelector(".container").insertAdjacentText("afterbegin","insertAdjacentText")


// 26 remove()

// Syntax :
// element.remove()
// or
// node.remove()

let div3=document.createElement("div");
div3.innerHTML="new data element  <b> </b>"
div3.setAttribute("class","created2");

document.querySelector(".container").append(div3)
document.querySelector(".created2").remove(div3)
//removing the specified element

//
////
// 27 classList
// 28 className

//classList properties
//29 classList.add
//30 classList.remove
//31 classList.toggle

document.querySelector(".container").classList
// DOMTokenList(3) ['container', 'parent', 'top', value: 'container parent top']

document.querySelector(".container").className
// 'container parent top'

document.querySelector(".container").classList.add("jitu")
// undefined

document.querySelector(".container").classList
// DOMTokenList(4) ['container', 'parent', 'top', 'jitu', value: 'container parent top jitu']

document.querySelector(".container").classList.add("jitu1")
// undefined

document.querySelector(".container").classList
// DOMTokenList(5) ['container', 'parent', 'top', 'jitu', 'jitu1', value: 'container parent top jitu jitu1']

document.querySelector(".container").classList.remove("jitu1")
// undefined

document.querySelector(".container").classList
// DOMTokenList(4) ['container', 'parent', 'top', 'jitu', value: 'container parent top jitu']


document.querySelector(".container").classList.toggle("jitu2")
// true
document.querySelector(".container").classList.toggle("jitu2")
// false

