//create spider movement
//coded with copilot
function createNewSpider() {
    var newSpiderText = document.createElement('div');
    newSpiderText.id = 'spiderNew' + Math.random(); // Give it a unique id
    newSpiderText.innerText = '*'; 
    document.body.appendChild(newSpiderText);

    function moveRandomly() {
        var left = Math.random() * (window.innerWidth - newSpiderText.offsetWidth);
        var top = Math.random() * (window.innerHeight - newSpiderText.offsetHeight);
        newSpiderText.style.position = 'absolute';
        newSpiderText.style.color = 'white';
        newSpiderText.style.left = left + 'px';
        newSpiderText.style.top = top + 'px';
    }

    setInterval(moveRandomly, 1000); // Change position every 1 sec
}

window.onload = function() {
    var spiderText = document.getElementById('spiderText');
    var intervalId;

    setInterval(function() {
        var currentSize = parseFloat(window.getComputedStyle(spiderText, null).getPropertyValue('font-size'));
        spiderText.style.fontSize = (currentSize + 1) + 'px';
    }, 5000); // Increase font size every 5 sec

    function moveRandomly() {
        var left = Math.random() * (window.innerWidth - spiderText.offsetWidth);
        var top = Math.random() * (window.innerHeight - spiderText.offsetHeight);
        spiderText.style.position = 'absolute';
        spiderText.style.left = left + 'px';
        spiderText.style.top = top + 'px';
    }

    intervalId = setInterval(moveRandomly, 1000); // Change position every 1 sec

    window.addEventListener('click', function(event) {
        clearInterval(intervalId); // Stop the original movement

        // Move the spiderText to the clicked spot
        spiderText.style.left = event.clientX + 'px';
        spiderText.style.top = event.clientY + 'px';

        // Resume the original movement after 2 sec
        setTimeout(function() {
            intervalId = setInterval(moveRandomly, 1000);
        }, 2000);
    });

    setInterval(createNewSpider, 1000); // Create a new spider every 1 sec
}

//show come here text when clicked on the screen
function showComeHere(event) {
    var comeHereText = document.getElementById('comeHereText');
    comeHereText.style.left = (event.clientX - 40) + 'px';
    comeHereText.style.top = (event.clientY - 40) + 'px';
    comeHereText.style.opacity = 1;

    //spider come to the clicked spot
    spiderText.style.left = event.clientX + 'px';
    spiderText.style.top = event.clientY + 'px';

    speakText('come here'); //spider sound

    setTimeout(function() {
        comeHereText.style.opacity = 0;
    }, 1000); // fade after 1 sec
}

function redSpider() {
    spiderText.style.color = 'red';
    speakText('kill it');
    document.getElementById('bigSpider').style.display = 'block';
}

function bigSpider() {
    spiderText.style.fontSize = '3vw';

    speakText('kill it');
    document.getElementById('killSpider').style.display = 'block';
}

function killSpider() {
    spiderText.style.display = 'none';
    speakText('it is gone');
    comeHereText.textContent = 'you killed me';
}

//speak text
function speakText(text) {
    var utterance = new SpeechSynthesisUtterance(text);
    var voices = window.speechSynthesis.getVoices();

    if (comeHereText.textContent === 'you killed me') {
        return;
    }

    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = function() {
            voices = window.speechSynthesis.getVoices();
            utterance.voice = voices[148]; //whisper voice
            window.speechSynthesis.speak(utterance);
        };
    } else {
        utterance.voice = voices[148]; //whisper voice
        window.speechSynthesis.speak(utterance);
    }
}