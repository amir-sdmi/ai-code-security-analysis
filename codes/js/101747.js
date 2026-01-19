document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const summarySection = document.getElementById('summary-section');
  const summaryText = document.getElementById('summaryText');
  const readingSection = document.getElementById('reading-section');
  const wordDisplay = document.getElementById('wordDisplay');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const wpmInput = document.getElementById('wpmInput');
  const progressBar = document.getElementById('progressBar');
  const fileNameDisplay = document.getElementById('fileName');

  let fullText = '';
  let words = [];
  let currentWordIndex = 0;
  let readingInterval = null;

  // File input change event
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Display file name
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = function(event) {
        fullText = event.target.result;
        processText(fullText);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'pdf') {
      const reader = new FileReader();
      reader.onload = function(event) {
        const typedarray = new Uint8Array(event.target.result);
        pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
          let pdfText = '';
          let pagePromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(
              pdf.getPage(i).then((page) => {
                return page.getTextContent().then((textContent) => {
                  const pageText = textContent.items.map(item => item.str).join(' ');
                  pdfText += pageText + '\n';
                });
              })
            );
          }
          Promise.all(pagePromises).then(() => {
            processText(pdfText);
          });
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported file type. Please upload a .txt or .pdf file.');
    }
  });

  function processText(text) {
    // Use ChatGPT API to get a summary
    getSummary(text).then(summary => {
      summarySection.classList.remove('hidden');
      summaryText.innerText = summary;
    }).catch(error => {
      console.error('Error getting summary:', error);
      summarySection.classList.remove('hidden');
      summaryText.innerText = 'Could not generate summary. Using first 100 characters instead: ' + 
        text.substring(0, 100) + '...';
    });

    // Prepare words for speed reading
    words = text.split(/\s+/);
    readingSection.classList.remove('hidden');
    currentWordIndex = 0;
    wordDisplay.innerText = '';
    progressBar.style.width = '0%';
  }

  function getSummary(text) {
    // Get a shorter version of the text to save API tokens
    const maxChars = 4000;
    const textToSummarize = text.length > maxChars ? text.substring(0, maxChars) : text;
    
    return new Promise((resolve, reject) => {
      // If no API key is set, fallback to simple summary
      if (!config.openaiApiKey || config.openaiApiKey === "your-openai-api-key") {
        console.log("No API key found. Using simple summary.");
        const first100Chars = text.substring(0, 100);
        return resolve(`Summary (no API key): ${first100Chars}...`);
      }
      
      // Prepare the request to OpenAI API
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: config.summaryModel,
          messages: [
            {
              role: "system",
              content: `Summarize the following text in about ${config.maxSummaryLength} characters.`
            },
            {
              role: "user", 
              content: textToSummarize
            }
          ],
          temperature: config.summaryTemperature,
          max_tokens: 150
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices.length > 0) {
          resolve(data.choices[0].message.content.trim());
        } else {
          reject(new Error('No summary generated from API'));
        }
      })
      .catch(error => {
        console.error('Error calling OpenAI API:', error);
        reject(error);
      });
    });
  }

  function startReading() {
    const wpm = parseInt(wpmInput.value);
    if (isNaN(wpm) || wpm <= 0) {
      alert("Please enter a valid WPM value.");
      return;
    }
    const intervalTime = 60000 / wpm; // milliseconds per word

    if (readingInterval) clearInterval(readingInterval);
    readingInterval = setInterval(() => {
      if (currentWordIndex >= words.length) {
        clearInterval(readingInterval);
        return;
      }
      wordDisplay.innerText = words[currentWordIndex];
      currentWordIndex++;
      updateProgress();
    }, intervalTime);
    
    // Visual feedback when reading starts
    wordDisplay.style.color = 'var(--primary-color)';
    startBtn.disabled = true;
  }

  function pauseReading() {
    if (readingInterval) {
      clearInterval(readingInterval);
      readingInterval = null;
      startBtn.disabled = false;
    }
  }

  function updateProgress() {
    const percentage = (currentWordIndex / words.length) * 100;
    progressBar.style.width = percentage + '%';
  }

  startBtn.addEventListener('click', startReading);
  stopBtn.addEventListener('click', pauseReading);

  // Allow keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      if (readingInterval) {
        pauseReading();
      } else {
        startReading();
      }
      e.preventDefault();
    }
  });
});
