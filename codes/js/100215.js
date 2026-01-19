/**
 * all of this file (except for this comment)
 * was written by ChatGPT
 * 
 * lol :p
*/

const imageElement = document.getElementById('topLogo');
const canvasElement = document.getElementById('canvas');
canvasElement.width = imageElement.width;
canvasElement.height = imageElement.height;
const context = canvasElement.getContext('2d');
context.drawImage(imageElement, 0, 0);
const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
const data = imageData.data;
for (let i = 0; i < data.length; i += 4) {
  let r = data[i];
  let g = data[i + 1];
  let b = data[i + 2];
  r = (r + i) % 256;
  g = (g + i) % 256;
  b = (b + i) % 256;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
}
context.putImageData(imageData, 0, 0);
setInterval(() => {
    context.putImageData(imageData, 0, 0);
    }, 50);
