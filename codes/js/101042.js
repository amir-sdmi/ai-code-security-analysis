// Script written by ChatGPT
// Designed to create line breaks for card titles to ensure no orphans occur, 
// placing the longest line of text at the bottom of a title

/* Ex: 
    
    How to forage for mushrooms in the woods
                    for fun!
    becomes...

               How to forage
    for mushrooms in the woods for fun!
*/

window.addEventListener("load", function () {
  const titleElements = document.querySelectorAll(".dynamic-title");

  // Cache container width for performance
  const containerWidth = titleElements[0].offsetWidth; // Assuming all titles have the same width

  function getTextWidth(text) {
    const tempSpan = document.createElement("span");
    tempSpan.className = "societys-press-card-title";
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.whiteSpace = "nowrap";
    tempSpan.textContent = text;
    document.body.appendChild(tempSpan);
    const width = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    return width;
  }

  titleElements.forEach(title => {
    const words = title.textContent.split(" ");
    let lines = [];
    let currentLine = "";

    // Check if the title fits in one line
    let fullLine = words.join(" ");
    if (getTextWidth(fullLine) <= containerWidth) {
      title.textContent = fullLine;
      return; // No need to wrap if it fits
    }

    // Break the line intelligently
    let wordIndex = words.length - 1;

    while (wordIndex >= 0) {
      const nextLine = currentLine ? words[wordIndex] + " " + currentLine : words[wordIndex] + " ";

      if (getTextWidth(nextLine) > containerWidth) {
        if (currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
        }
        currentLine = words[wordIndex] + " ";
      } else {
        currentLine = nextLine;
      }

      wordIndex--;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    // Reverse to put longest line at the bottom
    lines.reverse();

    title.innerHTML = "";

    lines.forEach((line, index) => {
      title.appendChild(document.createTextNode(line));

      if (index < lines.length - 1) {
        title.appendChild(document.createElement("br"));
      }
    });
  });
});

