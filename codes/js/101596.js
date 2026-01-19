// footer JS (written by chatGPT)

document.addEventListener("DOMContentLoaded", function() {
    var aboutModal = document.getElementById("about-modal");
    var aiModal = document.getElementById("ai-modal");
    var sourcesModal = document.getElementById("sources-modal");

    var aboutBtn = document.getElementById("about-btn");
    var aiBtn = document.getElementById("ai-btn");
    var sourcesBtn = document.getElementById("sources-btn");

    var closeModalBtns = document.getElementsByClassName("close");

    function openModal(modal) {
        modal.style.display = "block";
    }

    function closeModal(modal) {
        modal.style.display = "none";
    }

    aboutBtn.onclick = function() {
        openModal(aboutModal);
    }

    aiBtn.onclick = function() {
        openModal(aiModal);
    }

    sourcesBtn.onclick = function() {
        openModal(sourcesModal);
    }

    for (var i = 0; i < closeModalBtns.length; i++) {
        closeModalBtns[i].onclick = function() {
            var modal = this.parentElement.parentElement;
            closeModal(modal);
        }
    }

    window.onclick = function(event) {
        if (event.target == aboutModal || event.target == aiModal || event.target == sourcesModal) {
            closeModal(event.target);
        }
    }
});

// quiz interactive- help from chatGPT
document.addEventListener("DOMContentLoaded", function() {
	const questions = [
	  {
		question: "A software engineer working full-time for a tech company.",
		answer: "W2"
	  },
	  {
		question: "A freelance graphic designer hired for a short-term project.",
		answer: "1099"
	  },
	  {
		question: "An accountant employed by an accounting firm.",
		answer: "W2"
	  }
	];
  
	const quizContainer = document.getElementById('quiz');
	const retryBtn = document.getElementById('retry-btn');
	const resultsContainer = document.getElementById('results');
	let score = 0;
  
	// Function to generate the quiz
	function generateQuiz() {
	  questions.forEach(function(question, index) {
		const questionDiv = document.createElement('div');
		questionDiv.classList.add('question');
  
		const questionText = document.createElement('p');
		questionText.textContent = question.question;
		questionDiv.appendChild(questionText);
  
		const feedback = document.createElement('div');
		feedback.classList.add('feedback');
		questionDiv.appendChild(feedback);
  
		const btnW2 = document.createElement('button');
		btnW2.classList.add('btn', 'black-btn');
		btnW2.textContent = 'W2';
		btnW2.addEventListener('click', function() {
		  checkAnswer(index, 'W2');
		});
		questionDiv.appendChild(btnW2);
  
		const btn1099 = document.createElement('button');
		btn1099.classList.add('btn', 'black-btn');
		btn1099.textContent = '1099';
		btn1099.addEventListener('click', function() {
		  checkAnswer(index, '1099');
		});
		questionDiv.appendChild(btn1099);
  
		quizContainer.appendChild(questionDiv);
	  });
	}
  
	// Function to check the selected answer against the correct answer
	function checkAnswer(index, selectedAnswer) {
	  const correctAnswer = questions[index].answer;
	  const feedback = document.querySelectorAll('.feedback')[index];
  
	  if (selectedAnswer === correctAnswer) {
		feedback.textContent = 'Correct!';
		feedback.style.color = 'green';
		score++;
	  } else {
		feedback.textContent = 'Wrong!';
		feedback.style.color = 'red';
	  }
  
	  // Disable buttons after selection
	  const buttons = document.querySelectorAll('.question')[index].querySelectorAll('.btn');
	  buttons.forEach(function(btn) {
		btn.disabled = true;
	  });
  
	  // Show score after all questions are answered
	  if (score === questions.length) {
		resultsContainer.innerHTML = `<p class="results">You got ${score} out of ${questions.length} correct!</p>`;
	  }
	}
  
	// Function to reset the quiz
	function resetQuiz() {
	  const questionsDivs = document.querySelectorAll('.question');
	  questionsDivs.forEach(function(questionDiv) {
		const buttons = questionDiv.querySelectorAll('.btn');
		buttons.forEach(function(btn) {
		  btn.disabled = false;
		});
  
		const feedback = questionDiv.querySelector('.feedback');
		feedback.textContent = '';
	  });
  
	  resultsContainer.innerHTML = '';
	  score = 0;
	}
  
	// Generate the quiz when the page is loaded
	generateQuiz();
  
	// Retry button functionality
	retryBtn.addEventListener('click', resetQuiz);
  });
  
  
  

  