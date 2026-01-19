const { env } = require('process');

const vscode = acquireVsCodeApi();
const oldState = vscode.getState();
let history = oldState?.history ? oldState.history : [];

let misoQueryStructure = '';

const chatgptToken = env.CHATGPT_TOKEN || chatgptToken || '';
const misoToken = env.MISO_TOKEN || misoToken || '';

const logger = (message) => {
  console.log(`%c ${message}`, 'background: #222; color: #C0C09A');
};

const changeConcept = async (item, index, element) => {
  item.currentConceptIndex = index;
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }

  item.current = 0;

  if (!item.references[item.currentConceptIndex]) {
    item.loading = true;
    const misoAnswers = await getMisoAnswers(
      item.codeConcepts[item.currentConceptIndex],
      item.language
    );
    item.references[item.currentConceptIndex] = misoAnswers;
    window.Alpine.store('history').updateVSSate();
    item.loading = false;
  }

  setTimeout(() => {
    console.log(item);
    const answer =
      item?.references[item.currentConceptIndex]?.[item.current]?.answer;

    let selector = answer.css_selector;

    selector = selector.replace(`:root>`, '');

    console.log(selector);

    const htmlContainer = document.querySelector(`.html-${item.uuid}`);
    console.log(htmlContainer);

    if (htmlContainer) {
      const element = htmlContainer.querySelector(selector);
      console.log('element', element);
      if (element) {
        // element.scrollIntoView();
      }
    }
<<<<<<< HEAD
<<<<<<< HEAD
  }, 100);
};
=======

    item.current = 0;


    if (!item.references[item.currentConceptIndex]) {
        item.loading = true;
        const misoAnswers = await getMisoAnswers(item.codeConcepts[item.currentConceptIndex], item.language)
        item.references[item.currentConceptIndex] = misoAnswers;
        window.Alpine.store('history').updateVSSate();
        item.loading = false;
    }


    setTimeout(() => {

        console.log(item);
        const answer = item?.references[item.currentConceptIndex]?.[item.current]?.answer;

        let selector = answer.css_selector

        selector = selector.replace(`:root>`, '');

        console.log(selector);


        const htmlContainer = document.querySelector(`.html-${item.uuid}`)
        console.log(htmlContainer);

        if (htmlContainer) {
            const element = htmlContainer.querySelector(selector);
            console.log('element', element);
            if (element) {
                // element.scrollIntoView();
            }
        }
    }, 100);
}
>>>>>>> 532bc9d (Using ChatGPT proxy)
=======
  }, 100);
};
>>>>>>> ebd73ac (removed hardcoded miso key)

const getChatGPTResponse = async (codeSnippet, language) => {
  const prompt = `The code snippet is: \`${codeSnippet}\` and the language is: ${language}. Pinpoint the most difficult part of the code snippet and concisely list the concepts you need to understand to understand the code.  Write maximum 7 concepts very concisely in the shortest form possible, in tag form without the #. Like this ["concept 1", "concept 2"] and nothing else. No description except the core concept. E.g. if it's promises, then just write promises and nothing else`;

  logger('-----------------------------------------------');
  logger('-----------------------------------------------');
  logger('-----------------------------------------------');
  logger('Step 1: Sending prompt to ChatGPT');
  logger(`ChatGPT Prompt: ${prompt}`);
  logger(' ');

<<<<<<< HEAD
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chatgptToken}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 100,
    }),
  });

  const json = await response.json();

<<<<<<< HEAD
  let result = [];

  result = json?.choices.map((choice) => choice?.message?.content);
  result = JSON.parse(result);

  logger('ChatGPT Response:');
  console.log(result);
  logger(' ');
  logger(' ');

  return result || [];
  // return result?.[0] || []
};
=======
    // const response = await fetch('https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/chatgpt-proxy', {
    const response = await fetch('https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/chatgpt-proxy', {
        method: 'POST',
        body: JSON.stringify({
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": prompt
                }
            ],
            "max_tokens": 100
        })
    })
=======
  // const response = await fetch('https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/chatgpt-proxy', {
  const response = await fetch(
    'https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/chatgpt-proxy',
    {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
        ],
        max_tokens: 100,
      }),
    }
  );

  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //     method: 'POST',
  //     headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${chatgptToken}`
  //     },
  //     body: JSON.stringify({
  //         model: "gpt-4",
  //         messages: [{ role: "system", content: prompt }],
  //         max_tokens: 100
  //     })
  // })

  const json = await response.json();
>>>>>>> ebd73ac (removed hardcoded miso key)

  let result = [];

  result = json?.choices.map((choice) => choice?.message?.content);
  result = JSON.parse(result);

  logger('ChatGPT Response:');
  console.log(result);
  logger(' ');
  logger(' ');

<<<<<<< HEAD
    result = json?.choices.map(choice => choice?.message?.content)
    result = JSON.parse(result)


    logger('ChatGPT Response:');
    console.log(result)
    logger(' ');
    logger(' ');


    return result || []
}
>>>>>>> 532bc9d (Using ChatGPT proxy)
=======
  return result || [];
};
>>>>>>> ebd73ac (removed hardcoded miso key)

const getMisoAnswers = async (codeConcept, language) => {
  let query = `lang:${language} ${codeConcept}`;

  query = misoQueryStructure
    .replace('{{{language}}}', language)
    .replace('{{{query}}}', codeConcept);

  logger('Step 2: Sending code concept to Miso API');
  logger(`Miso query: ${query}`);
  logger(' ');
  logger(' ');

<<<<<<< HEAD
  const misoAnswers = await fetch(
    'https://api.askmiso.com/v1/qa/question_answering',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': misoToken,
      },
      body: JSON.stringify({
        q: query,
        min_probability: 0.8,
        // fl: ["title", "type", "url", "authors", "type"],
        fl: ['*'],
        user_id: 'test_2_28_2024',
        enable_answer_html: true,
        enable_answer_block: false,
        rows: 3,
      }),
    }
  );

  const json = await misoAnswers.json();

  let answers = json?.data?.answers || [];

<<<<<<< HEAD
  answers = answers.map((item) => {
    item.id = item.custom_attributes?.isbn;
    item.authors = item.authors?.join(', ');
=======
    // const misoAnswers = await fetch('https://api.askmiso.com/v1/qa/question_answering', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'X-API-KEY': misoToken
    //     },
    //     body: JSON.stringify({
    //         q: query,
    //         min_probability: 0.8,
    //         // fl: ["title", "type", "url", "authors", "type"],
    //         fl: ["*"],
    //         user_id: "test_2_28_2024",
    //         enable_answer_html: true,
    //         enable_answer_block: false,
    //         rows: 3
    //     })
    // })

    const misoAnswers = await fetch('https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/ask-miso-proxy', {
        method: 'POST',
        body: JSON.stringify({
            q: query,
            min_probability: 0.8,
            fl: ["*"],
            user_id: "test_2_28_2024",
            enable_answer_html: true,
            enable_answer_block: false,
            rows: 3
        })
    })
>>>>>>> 532bc9d (Using ChatGPT proxy)

    let trimmed_html = item.html;
    // const parser = new DOMParser();
    // let html = item.answer_block.html
    // html = html.replace(/<code>/g, `<code class="language-${language}">`)

<<<<<<< HEAD
    // const doc = parser.parseFromString(item.answer_block.html, 'text/html');
    // const startIndex = item.answer_block.relevant_children_slice[0];
    // const endIndex = item.answer_block.relevant_children_slice[1] + 1;
=======
    console.log('Miso response:', json);
>>>>>>> 532bc9d (Using ChatGPT proxy)

    // let trimmed_html = '';
    // let relevantElements = [];

    // let parent = doc.body

    // if (doc.body.childNodes.length < endIndex) {
    //     const firstChild = doc.body.childNodes[0];
    //     if (firstChild.childNodes.length >= endIndex) {
    //         parent = firstChild;
    //     }
    // }

    // relevantElements = Array.from(parent.childNodes).slice(startIndex, endIndex);
    // trimmed_html = relevantElements.map(el => el.outerHTML).join('');

    item.trimmed_html = trimmed_html;

    return item;
  });

  logger('Miso response:');
  console.log(answers);

  const dates = answers.map((answer) => answer.updated_at);
  console.log(dates);
  logger(' ');

  answers = answers.filter((answer) => answer.trimmed_html.length > 0);

=======
  // const misoAnswers = await fetch('https://api.askmiso.com/v1/qa/question_answering', {
  //     method: 'POST',
  //     headers: {
  //         'Content-Type': 'application/json',
  //         'X-API-KEY': misoToken
  //     },
  //     body: JSON.stringify({
  //         q: query,
  //         min_probability: 0.8,
  //         // fl: ["title", "type", "url", "authors", "type"],
  //         fl: ["*"],
  //         user_id: "test_2_28_2024",
  //         enable_answer_html: true,
  //         enable_answer_block: false,
  //         rows: 3
  //     })
  // })

  const misoAnswers = await fetch(
    'https://oreilly-ai.ionaldesignsystemsinternat.com/.netlify/functions/ask-miso-proxy',
    {
      method: 'POST',
      body: JSON.stringify({
        q: query,
        min_probability: 0.8,
        fl: ['*'],
        user_id: 'test_2_28_2024',
        enable_answer_html: true,
        enable_answer_block: false,
        rows: 3,
      }),
    }
  );

  const json = await misoAnswers.json();

  console.log('Miso response:', json);

  let answers = json?.data?.answers || [];

  answers = answers.map((item) => {
    item.id = item.custom_attributes?.isbn;
    item.authors = item.authors?.join(', ');

    let trimmed_html = item.html;
    // const parser = new DOMParser();
    // let html = item.answer_block.html
    // html = html.replace(/<code>/g, `<code class="language-${language}">`)

    // const doc = parser.parseFromString(item.answer_block.html, 'text/html');
    // const startIndex = item.answer_block.relevant_children_slice[0];
    // const endIndex = item.answer_block.relevant_children_slice[1] + 1;

    // let trimmed_html = '';
    // let relevantElements = [];

    // let parent = doc.body

    // if (doc.body.childNodes.length < endIndex) {
    //     const firstChild = doc.body.childNodes[0];
    //     if (firstChild.childNodes.length >= endIndex) {
    //         parent = firstChild;
    //     }
    // }

    // relevantElements = Array.from(parent.childNodes).slice(startIndex, endIndex);
    // trimmed_html = relevantElements.map(el => el.outerHTML).join('');

    item.trimmed_html = trimmed_html;

    return item;
  });

  logger('Miso response:');
  console.log(answers);

  const dates = answers.map((answer) => answer.updated_at);
  console.log(dates);
  logger(' ');

  answers = answers.filter((answer) => answer.trimmed_html.length > 0);

>>>>>>> ebd73ac (removed hardcoded miso key)
  answers = answers.sort((a, b) => {
    const aTags = a.tags?.map((tag) => tag.toLowerCase());
    const bTags = b.tags?.map((tag) => tag.toLowerCase());
    if (aTags?.includes(language.toLowerCase())) {
      return -1;
    } else {
      return 1;
    }
  });

  logger('Step 3: Sort answers from Miso by relevance');
  logger('If the code language is in the tags of an answer, it is prioritized');
  logger(' ');
  logger(' ');

  return answers;
};

(() => {
  const calculateRelativeTime = () => {
    const items = window.Alpine.store('history').items;
    items.forEach((item, index) => {
      const now = new Date().getTime();
      const then = item.date;
      const diff = now - then;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(weeks / 4);
      const years = Math.floor(months / 12);

      let relativeTime = '';
      if (years > 0) {
        relativeTime = `${years} year${years > 1 ? 's' : ''} ago`;
      } else if (months > 0) {
        relativeTime = `${months} month${months > 1 ? 's' : ''} ago`;
      } else if (weeks > 0) {
        relativeTime = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else if (days > 0) {
        relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        relativeTime = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        relativeTime = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (seconds > 0) {
        relativeTime = `${seconds} second${seconds > 1 ? 's' : ''} ago`;
      } else {
        relativeTime = 'just now';
      }
      item.relativeTime = relativeTime;
    });
  };

  document?.addEventListener('alpine:init', () => {
    let allowDelete = true;

    window.Alpine.store('history', {
      items: [...history].map((item, index) => {
        item.show = true;
        item.new = false;
        item.loading = false;
        return item;
      }),
      add(item) {
        item.new = true;
        this.items.unshift(item);

        setTimeout(() => {
          const el = document.querySelector(`[data-uuid="${item.uuid}"]`);

          el.classList.remove('new');
          const targetHeight = el.offsetHeight;

          gsap.fromTo(
            el,
            {
              height: 0,
              opacity: 0,
              y: -20,
            },
            {
              y: 0,
              height: targetHeight,
              opacity: 1,
              duration: 0.3,
              onComplete: () => {
                el.classList.add('active');
              },
            }
          );
        }, 50);
      },
      delete(el) {
        let that = this;
        const uuid = el.dataset.uuid;
        const index = this.items.findIndex((item) => item.uuid === uuid);

        gsap.to(el, {
          height: 0,
          duration: 0.3,
          y: -20,
          ease: 'quad.out',
          onStart: () => {
            el.classList.remove('active');
            el.style.overflow = 'hidden';
          },
          onComplete: () => {
            setTimeout(() => {
              that.items.splice(index, 1);
              that.updateVSSate();
            }, 200);
          },
        });
      },
      updateVSSate() {
        vscode.setState({ history: this.items });
      },
    });

    setInterval(() => {
      calculateRelativeTime();
    }, 7000);

    calculateRelativeTime();

    Prism.highlightAll();
  });

  let historyEl = document.querySelector('#history');

  let testbutton = document.querySelector('#test-button');

  const sendMessage = (command, data) => {
    vscode.postMessage({
      sender: 'webview',
      command,
      data,
    });
  };

  window.selectCodeSnippet = (index) => {
    const item = window.Alpine.store('history').items?.[index];

    sendMessage('selectCodeSnippet', {
      file: item.filepath,
      startLine: item.snippet.startLine,
      endLine: item.snippet.endLine,
    });
  };

  const prismLanguages = {
    javascript: 'javascript',
    typescript: 'typescript',
    typescriptreact: 'tsx',
    javascriptreact: 'jsx',
    html: 'html',
    css: 'css',
    json: 'json',
    python: 'python',
  };

  window.addEventListener('message', async (event) => {
    const message = event.data; // The json data that the extension sent

    misoQueryStructure = message.misoQueryStructure;
    const total = window.Alpine.store('history').items.length + 1;

    // Prism language
    const prismLanguage = prismLanguages[message.language] || message.language;

    const codeSnippet = message.selectedText.trim();

    window.Alpine.store('history').add({
      filepath: message.file,
      uuid: crypto.randomUUID(),
      filename: message.file.split('/').pop(),
      language: message.language,
      date: new Date().getTime(),
      relativeTime: 'Just now',
      name: `ProjectNavigator-${total}.js`,
      open: false,
      loading: true,
      current: 0,
      snippet: {
        code: codeSnippet,
        startLine: message.startLine,
        endLine: message.endLine,
        prismLanguage: prismLanguage,
      },
      references: [],
    });

    setTimeout(() => {
      Prism.highlightAll();
    }, 100);

    const chatgptResponse = await getChatGPTResponse(
      codeSnippet,
      message.language
    );
    const misoAnswers = await getMisoAnswers(
      chatgptResponse[0],
      message.language
    );

    const item = window.Alpine.store('history').items[0];
    item.codeConcepts = chatgptResponse;
    item.currentConceptIndex = 0;
    // item.references = misoAnswers;
    item.references = [];
    item.references[item.currentConceptIndex] = misoAnswers;
    item.loading = false;

    window.Alpine.store('history').updateVSSate();
  });

  const init = () => {
    document.body.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'A' && target.href.startsWith('http')) {
        event.preventDefault();
        const url = target.href;

        vscode.postMessage({
          command: 'openLink',
          url: url,
        });
      }
    });
  };

<<<<<<< HEAD
<<<<<<< HEAD
  init();
})();
=======


    }

    init();
})()
>>>>>>> 532bc9d (Using ChatGPT proxy)
=======
  init();
})();
>>>>>>> ebd73ac (removed hardcoded miso key)
