/* 
TITLE: 

Heatmap Photobooth

NOTE: 
Works best in natural lightiing / well-lit spaces.


OBJECTIVE: 

A Photobooth that creates a heat map effect based on the motion detected by the webcam. 

CONTROLS: 

Sliders 
- sensitivity: change the sensitivity threshold for motion
- zoom: change the pixel sizes and the camera zoom

Buttons: 
- reset motion: allows you to start motion track at 0; restarts 
- turn mic on and off to change saturation, default is 80% 
- save image: saves image as a .png to local computer

CREDITS: 
Based on this article and source code by julesdocx: 
--> https://medium.com/@jules.docx/motion-heatmap-in-javascript-p5js-fa545233968a

--> Zoom Feature Assisted by TA Thomas

--> troubleshooting and other elements assisted by ChatGPT

ADDED ELEMENTS: 
--> Panel UI (slider and button functionality)
--> Mic input for Saturation
--> Zoom and Scaler 
--> Image Export / saving 
--> Decay effect for pixels
*/

var video;
const devices = [];
var scaler;
var preFrame;
let motionCaptureArray = [];
let mapNumber = 1;

//Panel UI Elements
let thresholdSlider; 
let pixelSizeSlider;
let resetButton; 
let saveButton;

//Sound input 
let mic; 
let amplitude; 
let micActive = false; 
let micButton; 


function setup() {
  //Initial pixel size
  scaler = 5;
  
  //Canvas and Panel size 
  createCanvas(1040, 680);
  let drawableWidth = width - 200; 
  
  //Capture Webcam Video
  video = createCapture(VIDEO);
 
  
  //video.size(width / scaler, height / scaler);
  video.size(drawableWidth / 5, height / 5); 
  video.hide();
  
  pixelDensity(1);
  preFrame = createImage(video.width, video.height);
  frameRate(10);
  
  //Threshold slider range is 10000 to 50000
//low: 10000, high: 50000, default: 30000; interval size: 10000
  thresholdSlider = createSlider(10000, 50000, 30000, 10000); 

  //Pixel size slider represented in scaler
  pixelSizeSlider = createSlider(5, 15, 5, 1); 
  
  //Reset motion button
  resetButton = createButton("Reset Motion");
  resetButton.mousePressed(resetMotion);
  resetButton.style('font-family', 'monospace'); 
  
  //Mic input button 
  micButton = createButton("🎤︎");
  micButton.mousePressed(toggleMic);
  
//save image 
  saveButton = createButton("Save Image"); 
  saveButton.mousePressed(saveImage)  
  saveButton.style('font-family', 'monospace'); 
  
  //Set up mic input 
  mic = new p5.AudioIn(); 
  amplitude = new p5.Amplitude();
  positionUI();
}


function draw() {
  background(0, 20);
  
  //Update pixel size based on slider value.  
   scaler = pixelSizeSlider.value();
  
  //Panel
  let drawableWidth = width - 200;
  
  //Assisted by TA Thomas
  
  // Calculate center position
  let centerX = (drawableWidth - (video.width * scaler)) / 2;
  let centerY = (height - (video.height * scaler)) / 2;
  
  // Draw video at center
  image(video, centerX, centerY, video.width * scaler, video.height * scaler);
  
  //Load pixel data from current and previous frame
  video.loadPixels();
  preFrame.loadPixels();

  //Fill pixel if empty
  if (motionCaptureArray.length === 0) {
    motionCaptureArray = Array.prototype.slice.call(preFrame.pixels);
  }
  
  //
  if (frameCount % 10 == 0) {
    mapNumber = Math.max(...motionCaptureArray);
  }
   
  //Assited by ChatGPT 
  //Map mic to color saturation
  let micLevel = micActive ? amplitude.getLevel() : 0; 
  let saturation = micActive ? map(micLevel, 0, 1, 50, 100): 80;

  //Pixel motion detection loop
  if (frameCount >= 10) {
    for (let y = 0; y < video.height; y++) {
      for (let x = 0; x < video.width; x++) {
        let index = (x + y * video.width) * 4;
        let pr = preFrame.pixels[index + 0];
        let pg = preFrame.pixels[index + 1];
        let pb = preFrame.pixels[index + 2];

        let r = video.pixels[index + 0];
        let g = video.pixels[index + 1];
        let b = video.pixels[index + 2];

        //Threshold value mapped to threshold value slider
        var threshold = thresholdSlider.value(); 
        
        //Places colors for distance formula
        var diff = distSq(r, g, b, pr, pg, pb);
        
        //If difference is more than threshold, increase motion intensity
        if (diff * diff > threshold) {
          motionCaptureArray[index] = lerp(motionCaptureArray[index] , motionCaptureArray[index] + 1, 0.5);

        }
        //decay 
        motionCaptureArray[index] *= 0.99;
        noStroke();
        //colorMode(HSB);
        
        let pixelX = centerX + (x * scaler); 
        let pixelY = centerY + (y * scaler); 

        colorMode(HSB);
        fill(
          map(motionCaptureArray[index], 0, mapNumber, 180, 360),
          saturation, //Saturation mapped to mic level
          map(motionCaptureArray[index], 0, mapNumber, 80, 100)
        );
        rect(pixelX, pixelY, scaler, scaler);

        colorMode(RGB);
        fill((r + g + b) / 3, 90);
        rect(pixelX, pixelY, scaler, scaler);
      }
    }
  }
  //Update frame
  preFrame.copy(
    video,
    0,
    0,
    video.width,
    video.height,
    0,
    0,
    video.width,
    video.height
  );
  //Draw panel and elements
  drawPanel(); 
  positionUI();
}

function positionUI(){
  let panel = width * 0.8; 
  let spacing = width * 0.1;
  
  thresholdSlider.position(panel, spacing * 0.8);
  pixelSizeSlider.position(panel , spacing * 1.25); 
  resetButton.position(panel, spacing * 2); 
  micButton.position(panel, spacing * 2.5);
  saveButton.position(panel, spacing * 3); 
}

//Reset motion tracking 
function resetMotion() {
  motionCaptureArray = Array(video.pixels.length).fill(0);
}

//Toggle mic input 
function toggleMic(){ 
  micActive = !micActive; 
  if (micActive){
    mic.start(); 
    amplitude.setInput(mic); 
    micButton.html("((🎤︎))"); 
  } else{ 
    mic.stop(); 
    micButton.html("🎤︎");
  }
  }

//Save image
function saveImage() {
  let webcamScreen = get(0, 0, width - 300, height);
  webcamScreen.save('heated_motion', 'png');
}

//Draw the control panel
function drawPanel() { 
  let side = width  * 0.75;
  let words = width * 0.80;
  let bunch = width * 0.25;
  let up = height * 0.06;
  fill(30, 30, 45); 
  noStroke(); 
  rect(side, 0, bunch, height);
  
  fill(255); 
  textSize(20); 
  textFont('monospace');
  textAlign(LEFT, CENTER); 
  text("Controls", words, up)
  
  textSize(12); 
   text("Sensitivity Threshold",  words, up * 1.8);
  text("Zoom", words, up * 2.9); 
   textSize(24); 
  fill("red");
  text("Heat Map", words, up * 12);
   text("Camera", words, up * 13)
  
  
}

//Distance formula for colors
const distSq = (x1, y1, z1, x2, y2, z2) => {
  let d = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1);
  return d;
} 