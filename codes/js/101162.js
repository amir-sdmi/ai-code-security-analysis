// line 2-23 filter suggested by ChatGPT to find the words in the websites
function getTextNodes(node) {
  const nodes = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (
        node.parentNode &&
        ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.tagName)
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.nodeValue.trim()) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  });
  let current;
  while ((current = walker.nextNode())) {
    nodes.push(current);
  }
  return nodes;
}


const replacementPhrases = [
  "You seem to be tired.",
  "Did you sleep enough?",
  "Maybe you should take a rest.",
  "Maybe you need a break.",
  "Slow down.",
  "Touch some grass.",
  "Close your eyes.",
  "Rest, please."
];

function getRandomPhrase() {
  const i = Math.floor(Math.random() * replacementPhrases.length);
  return replacementPhrases[i];
}

// Extracts and store word positions from all text nodes
const originalNodes = getTextNodes(document.body);
const wordEntries = [];

originalNodes.forEach((node) => {
  const words = node.textContent.split(/(\s+)/); // keeps spaces
  if (words.length) {
    node._restWords = words; // store for reference
    words.forEach((word, i) => {
      if (!word.trim()) return; // skip spaces
      wordEntries.push({ node, index: i });
    });
  }
});

// Shuffle the words randomly
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

shuffle(wordEntries);
//when it starts and how long it goes
let currentIndex = 0;
const totalTime = 15000; 
const rampUpTime = 8000; 
const startTime = Date.now();

function replaceNextWord() {
  if (currentIndex >= wordEntries.length) return;

  const now = Date.now() - startTime;
  let interval;
//acceleration after 20 seconds
  if (now < rampUpTime) {
    const progress = now / rampUpTime;
    interval = 1000 - 700 * progress; 
  } else {
    interval = 100; 
  }

  const { node, index } = wordEntries[currentIndex];
  if (node._restWords && node._restWords[index]) {
    node._restWords[index] = getRandomPhrase(); 
    node.textContent = node._restWords.join('');
  }

  currentIndex++;
  setTimeout(replaceNextWord, interval);
}

replaceNextWord();
