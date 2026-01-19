// DOM-based interaction with ChatGPT
export async function evaluateClaim(claim, evidence) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ command: 'ensure-chatgpt-session' }, async (res) => {
      const { tabId, loginRequired } = res;

      if (loginRequired) {
        chrome.runtime.sendMessage({ command: 'show-chatgpt', tabId });
        resolve({ error: 'login-required' });
        return;
      }

      const prompt = buildPrompt(claim, evidence);
      await chrome.scripting.executeScript({
        target: { tabId },
        func: injectPrompt,
        args: [prompt]
      });

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: waitForResponse,
        args: [30000]
      });

      if (result.error) {
        resolve({ verdict: 'notenough', explanation: result.error });
      } else {
        try {
          const obj = JSON.parse(result.text);
          resolve(obj);
        } catch (e) {
          resolve({ verdict: 'notenough', explanation: result.text });
        }
      }
    });
  });
}

function buildPrompt(claim, evidence) {
  let text = 'SYSTEM: You are a fact-checker. Respond in JSON only.\n';
  text += `USER: Claim: "${claim}"\nEvidence:\n`;
  evidence.forEach((e, i) => {
    text += `${i + 1}) "${e.text}" (${e.url})\n`;
  });
  text += 'Output JSON { verdict: support|refute|notenough, explanation_ru: "..." }';
  return text;
}

function injectPrompt(prompt) {
  // This function runs in the ChatGPT tab context
  const textarea = document.querySelector('textarea');
  if (textarea) {
    textarea.value = prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const form = textarea.closest('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
  }
}

function checkLoginForm() {
  return !!document.querySelector('input[type="password"]');
}

function waitForResponse(timeout = 30000) {
  return new Promise(resolve => {
    const start = Date.now();
    const interval = setInterval(() => {
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
      const last = messages[messages.length - 1];
      if (last && last.textContent.trim()) {
        clearInterval(interval);
        resolve({ text: last.textContent.trim() });
      } else if (Date.now() - start >= timeout) {
        clearInterval(interval);
        resolve({ error: 'Timed out waiting for response' });
      }
    }, 1000);
  });
}
