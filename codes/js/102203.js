// MESSAGE INPUT
const textarea = document.querySelector('.chatbox-message-input')
const chatboxForm = document.querySelector('.chatbox-message-form')

textarea.addEventListener('input', function () {
	let line = textarea.value.split('\n').length

	if(textarea.rows < 6 || line < 6) {
		textarea.rows = line
	}

	if(textarea.rows > 1) {
		chatboxForm.style.alignItems = 'flex-end'
	} else {
		chatboxForm.style.alignItems = 'center'
	}
})



// TOGGLE CHATBOX
const chatboxToggle = document.querySelector('.chatbox-toggle')
const chatboxMessage = document.querySelector('.chatbox-message-wrapper')

chatboxToggle.addEventListener('click', function () {
	chatboxMessage.classList.toggle('show')
})



// DROPDOWN TOGGLE
const dropdownToggle = document.querySelector('.chatbox-message-dropdown-toggle')
const dropdownMenu = document.querySelector('.chatbox-message-dropdown-menu')

dropdownToggle.addEventListener('click', function () {
	dropdownMenu.classList.toggle('show')
})

document.addEventListener('click', function (e) {
	if(!e.target.matches('.chatbox-message-dropdown, .chatbox-message-dropdown *')) {
		dropdownMenu.classList.remove('show')
	}
})






// ==============function to get crsf-token =================================================================

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}
const csrftoken = getCookie('csrftoken');


// ==============function to get crsf-token =================================================================

const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
const chatboxNoMessage = document.querySelector('.chatbox-message-no-message')


function scrollBottom() {
	chatboxMessageWrapper.scrollTo(0, chatboxMessageWrapper.scrollHeight)
}




$(document).ready(function() {

  // After loading the dcument run this function
  sendButtonClicked()
});





function sendButtonClicked(){
  $(".chatbox-message-submit").click(function(e){
      e.preventDefault();

      console.log("button is clicked")

      // hit the api and get the respnse 
      sendAndGetResponse()

      // console.log(myPrompt)

  })
  }




  // function for handling request
function sendAndGetResponse(){

let myPrompt = $('#user-input').val()
let datasend = new FormData()

// populating the data with crsftoken and prompt 
datasend.append("prompt", myPrompt);
datasend.append("csrfmiddlewaretoken", csrftoken);

//  run   displaying user message function()
              writeMessage(myPrompt)


              // for showing typing.. message at the status before making the fetch request
            showTypingMessage();

              let options = {
                method: "POST",
                body: datasend,
                credentials: "same-origin",
              }

          fetch("/api/", options)
              .then((response) => response.json())
              .then(function(json){



                console.log(json)
                console.log(json.choices[0].text)


                let botreply = json.choices[0].text
                // function to disply the reply of bot

                autoReply(botreply)

                   // Call show online status again or to hide the loading indicator
                  console.log("complete")
                  hideTypingMessage()

              })
          

          }




    //      displaying user message function()
function writeMessage(prompt) {
	const today = new Date()
	let message = `
		<div class="chatbox-message-item sent">
			<span class="chatbox-message-item-text">
				${prompt}
			</span>
			<span class="chatbox-message-item-time">You</span>
		</div>
	`
	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
	chatboxForm.style.alignItems = 'center'
	textarea.rows = 1
	textarea.focus()
	textarea.value = ''
	chatboxNoMessage.style.display = 'none'
	scrollBottom()
}


// bot reply function
function autoReply(botreply) {
	// const today = new Date()
	let message = `
		<div class="chatbox-message-item received">
			<span class="chatbox-message-item-text">
			${botreply}
			</span>
			<span class="chatbox-message-item-time">Powered by chatgpt</span>
		</div>
	`
	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
	scrollBottom()
}





function showTypingMessage(){
  $(".chatbox-message-status").text("typing.....");

}


function hideTypingMessage(){

  $(".chatbox-message-status").text("Online");
}

































































































      





























// CHATBOX MESSAGE
// const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
// const chatboxNoMessage = document.querySelector('.chatbox-message-no-message')

// chatboxForm.addEventListener('submit', function (e) {
// 	e.preventDefault()

// 	if(isValid(textarea.value)) {
// 		writeMessage()
// 		setTimeout(autoReply, 1000)
// 	}
// })



// function addZero(num) {
// 	return num < 10 ? '0'+num : num
// }

// function writeMessage() {
// 	const today = new Date()
// 	let message = `
// 		<div class="chatbox-message-item sent">
// 			<span class="chatbox-message-item-text">
// 				${textarea.value.trim().replace(/\n/g, '<br>\n')}
// 			</span>
// 			<span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
// 		</div>
// 	`
// 	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
// 	chatboxForm.style.alignItems = 'center'
// 	textarea.rows = 1
// 	textarea.focus()
// 	textarea.value = ''
// 	chatboxNoMessage.style.display = 'none'
// 	scrollBottom()
// }

// function autoReply() {
// 	const today = new Date()
// 	let message = `
// 		<div class="chatbox-message-item received">
// 			<span class="chatbox-message-item-text">
// 				Thank you for your awesome support!
// 			</span>
// 			<span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
// 		</div>
// 	`
// 	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
// 	scrollBottom()
// }

// function scrollBottom() {
// 	chatboxMessageWrapper.scrollTo(0, chatboxMessageWrapper.scrollHeight)
// }

// function isValid(value) {
// 	let text = value.replace(/\n/g, '')
// 	text = text.replace(/\s/g, '')

// 	return text.length > 0
// }