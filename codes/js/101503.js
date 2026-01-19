// Configuration
const OPENAI_API_KEY = 'your-api-key-here'; // Replace with your actual API key

// Create and inject ChatGPT button for each textarea
function injectGPTButtons() {
  const textareas = document.querySelectorAll('textarea');
  
  textareas.forEach(textarea => {
    if (!textarea.hasGPTButton) {
      const wrapper = document.createElement('div');
      wrapper.className = 'gpt-wrapper';
      
      // Position the wrapper
      textarea.parentNode.insertBefore(wrapper, textarea);
      wrapper.appendChild(textarea);
      
      // Create the GPT button
      const gptButton = document.createElement('button');
      gptButton.className = 'gpt-button';
      gptButton.innerHTML = '🤖';
      gptButton.title = 'Ask ChatGPT';
      wrapper.appendChild(gptButton);
      
      // Create the prompt modal
      const modal = createModal();
      document.body.appendChild(modal);
      
      // Add click handler
      gptButton.addEventListener('click', () => {
        modal.style.display = 'block';
        const promptInput = modal.querySelector('.gpt-prompt-input');
        promptInput.value = '';
        promptInput.focus();
        
        // Store reference to the current textarea
        modal.currentTextarea = textarea;
      });
      
      textarea.hasGPTButton = true;
    }
  });
}

// Create modal for prompt input
function createModal() {
  const modal = document.createElement('div');
  modal.className = 'gpt-modal';
  modal.innerHTML = `
    <div class="gpt-modal-content">
      <span class="gpt-close">&times;</span>
      <h2>Ask ChatGPT</h2>
      <textarea class="gpt-prompt-input" placeholder="Enter your prompt here..."></textarea>
      <button class="gpt-submit">Generate</button>
      <div class="gpt-loading" style="display: none;">Generating...</div>
    </div>
  `;
  
  // Close button handler
  const closeBtn = modal.querySelector('.gpt-close');
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Close on outside click
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Submit button handler
  const submitBtn = modal.querySelector('.gpt-submit');
  submitBtn.onclick = async () => {
    const promptInput = modal.querySelector('.gpt-prompt-input');
    const loadingDiv = modal.querySelector('.gpt-loading');
    const textarea = modal.currentTextarea;
    
    if (promptInput.value.trim()) {
      loadingDiv.style.display = 'block';
      submitBtn.disabled = true;
      
      try {
        const response = await generateText(promptInput.value);
        textarea.value = response;
        modal.style.display = 'none';
      } catch (error) {
        alert('Error generating text: ' + error.message);
      } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
      }
    }
  };
  
  return modal;
}

// Generate text using ChatGPT API
async function generateText(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate text');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Initialize
injectGPTButtons();

// Watch for dynamically added textareas
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      injectGPTButtons();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});