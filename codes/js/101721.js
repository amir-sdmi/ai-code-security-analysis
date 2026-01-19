// 📖 Dynamic Dictionary Tooltips Demo
// This script highlights words defined in a dictionary and shows their definitions in a tooltip when hovered or pressed.
// Written by ChatGPT under the command of Prototypen
// https://prototypen.no

// Constants for class names and keys
const CONTAINER_CLASS_NAME = 'dictionary';
const WORD_CLASS_NAME = 'dictionary__word';
const TOOLTIP_CLASS_NAME = 'dictionary__word__definition'; 
const WORD_KEY = 'word';
const DEFINITION_KEY = 'description';
const API_SOURCE = 'https://axelferdinand.github.io/Dynamic-Dictionary-Tooltips/dictionary.json';

/**
 * Entry point of the script. This function locates text elements in the document,
 * checks them for dictionary words, and highlights them.
 * @param {Array} dictionaryEntries - List of dictionary words and their definitions.
 */
function main(dictionaryEntries) {
    let textElements = document.querySelectorAll(`.${CONTAINER_CLASS_NAME}`);
    let regexPattern = createRegexPattern(dictionaryEntries);
    
    // Process each text-containing element to highlight matching words
    for (let element of textElements) {
        processNestedNodes(element, dictionaryEntries, regexPattern);
        
        // Dynamically highlight matching words in content added after initial processing
        element.addEventListener("mouseover", debounce((e) => {
            if (e.target.nodeType === 3) {
                makeTargetable(e.target.parentNode, regexPattern, dictionaryEntries);
            }
        }, 250), true);
    }
}

/**
 * Recursively checks nodes for dictionary words and highlights them.
 * @param {Node} node - The current DOM node being inspected.
 * @param {Array} dictionaryEntries - List of dictionary words and their definitions.
 * @param {RegExp} regexPattern - The regex pattern for dictionary words.
 */
function processNestedNodes(node, dictionaryEntries, regexPattern) {
    if (node.nodeType === 3) {
        makeTargetable(node.parentNode, regexPattern, dictionaryEntries);
    } else if (node.childNodes && node.childNodes.length) {
        for (let child of node.childNodes) {
            processNestedNodes(child, dictionaryEntries, regexPattern);
        }
    }
}

/**
 * Creates a regex pattern for matching dictionary entries.
 * The function constructs a pattern that:
 * 1. Ensures that each dictionary word is captured as a whole word (i.e., not part of another word).
 * 2. Takes care of potential punctuation marks or quotes around the word.
 * 3. Combines all dictionary words into a single regex pattern using the "|" (or) operator.
 *
 * @param {Array} dictionaryEntries - List of dictionary words and their definitions.
 * @return {RegExp} - The compiled regex pattern which matches any of the dictionary words as whole words, 
 *                    while ignoring words when they are part of another word or surrounded by certain punctuation.
 */
function createRegexPattern(dictionaryEntries) {
    let words = dictionaryEntries.map(entry => {
        return `(?<![a-zA-Z-'“‘”’«'"])\\b${entry[WORD_KEY]}\\b(?![-a-zA-Z'“‘”’»"'])`;
    }).join("|");
    return new RegExp(words, 'ig');
}

/**
 * Processes a node's content, highlighting words that match the dictionary.
 * Also sets up tooltips for these words.
 * @param {Node} currentNode - The DOM node containing text to be processed.
 * @param {RegExp} regexPattern - The regex pattern for dictionary words.
 * @param {Array} dictionaryEntries - List of dictionary words and their definitions.
 */
function makeTargetable(currentNode, regexPattern, dictionaryEntries) {
    if (currentNode.nodeName === 'P' && !isDescendantOfAnchor(currentNode)) {
        // Extract all direct text nodes from the current node
        let textNodes = Array.from(currentNode.childNodes).filter(node => node.nodeType === 3);

        // Process each text node to highlight matching words and set up tooltips
        textNodes.forEach(textNode => {
            let text = textNode.nodeValue;
            let matches = [...text.matchAll(regexPattern)];
            let fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach(match => {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));

				// Extract the matched word and find its dictionary definition
                let word = match[0];
                let dictionaryEntry = dictionaryEntries.find(entry => entry[WORD_KEY].toLowerCase() === word.toLowerCase());

				// Create the highlighted element and set up the tooltip
                let highlighted = document.createElement('span');
                highlighted.className = WORD_CLASS_NAME;
                highlighted.textContent = word;
                highlighted.dataset.title = dictionaryEntry[WORD_KEY];
                highlighted.dataset.description = encodeURIComponent(dictionaryEntry[DEFINITION_KEY]);
                highlighted.setAttribute('aria-haspopup', 'true');
                highlighted.setAttribute('aria-expanded', 'false');

                let tooltipSpan = document.createElement('span');
                tooltipSpan.className = TOOLTIP_CLASS_NAME;
                tooltipSpan.style.display = 'none';
                tooltipSpan.setAttribute('role', 'tooltip');
                tooltipSpan.setAttribute('aria-hidden', 'true');

                // Create an inner span for the tooltip content
                let innerContentSpan = document.createElement('span');
                innerContentSpan.textContent = decodeURIComponent(dictionaryEntry[DEFINITION_KEY]);
                tooltipSpan.appendChild(innerContentSpan);

                highlighted.appendChild(tooltipSpan);
                highlighted.addEventListener("mouseover", () => {
                    tooltipSpan.style.display = 'block';
                    highlighted.setAttribute('aria-expanded', 'true');
                    tooltipSpan.setAttribute('aria-hidden', 'false');
                });
                highlighted.addEventListener("mouseout", () => {
                    tooltipSpan.style.display = 'none';
                    highlighted.setAttribute('aria-expanded', 'false');
                    tooltipSpan.setAttribute('aria-hidden', 'true');
                });

                fragment.appendChild(highlighted);
                lastIndex = match.index + word.length;
            });

            // Append any remaining non-matching text
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            currentNode.replaceChild(fragment, textNode);
        });
    }
}

/**
 * Checks if a node is a descendant of an anchor tag.
 * @param {Node} node - The DOM node to be checked.
 * @return {boolean} - True if the node is a descendant of an anchor, otherwise false.
 */
function isDescendantOfAnchor(node) {
    while (node !== null) {
        if (node.nodeName === 'A') {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * Utility function to debounce function calls.
 * This ensures the function doesn't execute too frequently.
 * @param {function} func - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @return {function} - The debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Fetch dictionary entries from the API and process them on document load
(function () {
    fetch(API_SOURCE)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            main(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation: ', error);
        });
})();