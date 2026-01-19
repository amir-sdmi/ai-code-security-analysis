// Class written by ChatGPT with prompt: "Can you make a wrapper class for the rects I'm drawing. I want to keep track of its i, j value in the grid, the color its filled, whether it's been colored in and its location."
// modified by me

class gridRect {
  constructor(i, j, xLoc, yLoc, squareWidth) {
    this.i = i; // Grid column index
    this.j = j; // Grid row index
    this.xLoc = xLoc; // x-location on canvas
    this.yLoc = yLoc; // y-location on canvas
    this.squareWidth = squareWidth; // width of the square
    this.filled = false; // Whether it's been filled
    this.filledColor = null;
  }

  // Set the color and filled status
  setIsFilled(c, val) {
    this.filledColor = c;
    this.filled = val;
  }

  // Draw the rectangle
  drawRect() {
    if (this.filled) {
      noStroke();
      rect(this.xLoc, this.yLoc, this.squareWidth, this.squareWidth);
    }
  }
}
