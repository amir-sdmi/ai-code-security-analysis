// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

//Global Variables

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true})
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


//globals for UI elements

let g_globalAngle = 0;
let g_globalAngleX = 0; // X rotation for up/down mouse drag
let g_globalAngleY = 0; // Y rotation for left/right mouse drag


let g_leftArmAngle = -70;
let g_leftHandAngle = 0;
let g_rightArmAngle = -70;
let g_rightHandAngle = -20;
let g_leftArmAnimation = false; // Controls if left arm is animated
let g_leftHandAnimation = false; // Controls if left hand is animated
let g_walkingStickAnimation = true; // Controls if walking stick is animated
let g_walkingStickAngle = 0; // Angle for walking stick
let g_rightArmAnimation = false; // Controls if right arm is animated
let g_rightHandAnimation = false; // Controls if right hand is animated

// Cached DOM elements for sliders (optimization) (gpt helped with this)
let walkingStickSlider, leftArmSlider, rightArmSlider, leftHandSlider, rightHandSlider, angleSlider;

function addActionsForHtmlUI(){
  // Cache slider elements globally
  leftArmSlider = document.getElementById('leftArmSlide');
  rightArmSlider = document.getElementById('rightArmSlide');
  leftHandSlider = document.getElementById('leftHandSlide');
  rightHandSlider = document.getElementById('rightHandSlide');
  walkingStickSlider = document.getElementById('walkingStickSlide');
  angleSlider = document.getElementById('angleSlide');

  // Arm sliders
  leftArmSlider.addEventListener('mousemove', function() {g_leftArmAngle = this.value; renderAllShapes();});
  rightArmSlider.addEventListener('mousemove', function() {g_rightArmAngle = this.value; renderAllShapes();});

  // Animation ON/OFF for left arm
  document.getElementById('animationLeftArmOnButton').onclick = function() { g_leftArmAnimation = true; };
  document.getElementById('animationLeftArmOffButton').onclick = function() { g_leftArmAnimation = false; };
  document.getElementById('animationLeftHandOnButton').onclick = function() { g_leftHandAnimation = true; };
  document.getElementById('animationLeftHandOffButton').onclick = function() { g_leftHandAnimation = false; };
  document.getElementById('leftHandSlide').addEventListener('mousemove', function() {g_leftHandAngle = this.value; renderAllShapes();});
  // Animation ON/OFF for right arm
  document.getElementById('animationRightArmOnButton').onclick = function() { g_rightArmAnimation = true; };
  document.getElementById('animationRightArmOffButton').onclick = function() { g_rightArmAnimation = false; };
  // Animation ON/OFF for right hand
  document.getElementById('animationRightHandOnButton').onclick = function() { g_rightHandAnimation = true; };
  document.getElementById('animationRightHandOffButton').onclick = function() { g_rightHandAnimation = false; };
  document.getElementById('rightHandSlide').addEventListener('mousemove', function() {g_rightHandAngle = this.value; renderAllShapes();});

  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});

  // Walking stick animation controls
  document.getElementById('animationWalkingStickOnButton').onclick = function() { g_walkingStickAnimation = true; };
  document.getElementById('animationWalkingStickOffButton').onclick = function() { g_walkingStickAnimation = false; };
  document.getElementById('walkingStickSlide').addEventListener('mousemove', function() {g_walkingStickAngle = Number(this.value); renderAllShapes();});
}

function main() {
  
  setupWebGL(); //webgl setup
  connectVariablestoGLSL();  //set up GLSL shader programs/variables

  addActionsForHtmlUI();  //HTML UI elements

  //gpt used to debug rotation/drag + make it smooth
  // Mouse drag rotation variables
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let startAngleY = 0, startAngleX = 0;

  // Mouse down: start drag
  canvas.addEventListener('mousedown', function(ev) {
    // Poke animation: shift+click, performance.now() for timing as suggested by gpt
    if (ev.shiftKey) {
      g_pokeActive = true;
      g_pokeStartTime = performance.now();
      renderAllShapes();
      return;
    }
    isDragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    startAngleY = g_globalAngleY + g_globalAngle;
    startAngleX = g_globalAngleX;
  });
  // Mouse up: stop drag
  canvas.addEventListener('mouseup', function(ev) {
    isDragging = false;
  });
  // Mouse leave: stop drag
  canvas.addEventListener('mouseleave', function(ev) {
    isDragging = false;
  });
  // Mouse move: update rotation if dragging
  canvas.addEventListener('mousemove', function(ev) {
    if (isDragging) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      g_globalAngleY = startAngleY + dx * 0.2 - g_globalAngle;
      g_globalAngleX = startAngleX + dy * 0.2;
      renderAllShapes();
    }
  });

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Render
  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

// Update the angles of everything if currently animated
function updateAnimationAngles() {
  // Handle poke animation timing
  if (g_pokeActive && performance.now() - g_pokeStartTime > POKE_DURATION) {
    g_pokeActive = false;
  }
  // Animate walking stick
  if (g_pokeActive) {
    // angery: swing rapidly
    g_walkingStickAngle = 90 * Math.sin((performance.now() - g_pokeStartTime) / 80);
    const walkingStickSlider = document.getElementById('walkingStickSlide');
    walkingStickSlider.value = g_walkingStickAngle;
  } else if (g_walkingStickAnimation) {
    g_walkingStickAngle = 30 * Math.sin(g_seconds);
    const walkingStickSlider = document.getElementById('walkingStickSlide');
    walkingStickSlider.value = g_walkingStickAngle;
  }

  if (g_leftArmAnimation) {
    //replaced with chatGPT help to get value from sliders for animation
    // Old animation logic (hardcoded -45 to 45):
    // g_yellowAngle = 45 * Math.sin(g_seconds);

    // New animation logic: uses slider min/max for left arm
    const leftArmSlider = document.getElementById('leftArmSlide');
    const minLA = Number(leftArmSlider.min);
    const maxLA = Number(leftArmSlider.max);
    g_leftArmAngle = ((maxLA - minLA) / 2) * Math.sin(g_seconds) + (maxLA + minLA) / 2;
    leftArmSlider.value = g_leftArmAngle;
  }
  if (g_leftHandAnimation) {
    //replaced with chatGPT help to get value from sliders for animation
    // Old animation logic (hardcoded -45 to 45):
    // g_magentaAngle = 45 * Math.sin(3 * g_seconds);

    // New animation logic: uses slider min/max for left hand
    const leftHandSlider = document.getElementById('leftHandSlide');
    const minLH = Number(leftHandSlider.min);
    const maxLH = Number(leftHandSlider.max);
    g_leftHandAngle = ((maxLH - minLH) / 2) * Math.sin(3 * g_seconds) + (maxLH + minLH) / 2;
    leftHandSlider.value = g_leftHandAngle;
  }
  if (g_rightArmAnimation) {
    const rightArmSlider = document.getElementById('rightArmSlide');
    const minRA = Number(rightArmSlider.min);
    const maxRA = Number(rightArmSlider.max);
    g_rightArmAngle = ((maxRA - minRA) / 2) * Math.sin(g_seconds) + (maxRA + minRA) / 2;
    rightArmSlider.value = g_rightArmAngle;
  }
   if (g_rightHandAnimation) {
    const rightHandSlider = document.getElementById('rightHandSlide');
    const minRH = Number(rightHandSlider.min);
    const maxRH = Number(rightHandSlider.max);
    g_rightHandAngle = ((maxRH - minRH) / 2) * Math.sin(3 * g_seconds) + (maxRH + minRH) / 2;
    rightHandSlider.value = g_rightHandAngle;
  }
}

//Called by browser repeatedly whenever its time
function tick() {
  // Save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  console.log(g_seconds);
  // Draw everything
  renderAllShapes();
  //Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

//Poke Animation Framework
let g_pokeActive = false;
let g_pokeStartTime = 0;
const POKE_DURATION = 1000; // ms

function renderAllShapes() {
  var startTime = performance.now();

  // chatgpt used to figure out full rotation and to make it work with slider
  // Compose global rotation: first X (vertical drag), then Y (horizontal drag)
  
  var globalRotMat = new Matrix4();
  globalRotMat.scale(0.7, 0.7, 0.7); // Zoom out more
  globalRotMat.rotate(g_globalAngle + g_globalAngleY, 0, 1, 0); // Combine slider and mouse drag for yaw
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0); // Pitch (vertical drag)
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  //clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  

  // Draw the body cube
  var body = new Cube();
  body.color = [0.55, 0.27, 0.07, 1.0]; // Brown
  body.matrix.translate(-.25, -1, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(1, 0.75, 0.75);
  body.render();

  // Draw a green pyramid next to the body cube
  var headPyramid = new Pyramid();
  headPyramid.color = [1.0, 0.87, 0.68, 1.0]; // Light peach (head)
  headPyramid.matrix.translate(-0.25, -0.3, 0.0); 
  headPyramid.matrix.rotate(-5,1,0,0);
  headPyramid.matrix.scale(1, 0.6, 0.6); 
  headPyramid.render();

  // Draw pyramid eyes
  var eyePyramid = new Pyramid();
  var eyePyramid2 = new Pyramid();
  if (g_pokeActive) {
    //angery, both eyes turn red
    eyePyramid.color = [1,0,0,1]; // Red
    eyePyramid2.color = [1,0,0,1]; // Red
  } else {
    eyePyramid.color = [0.5,0.5,0.5,1];
    eyePyramid2.color = [0.5,0.5,0.5,1];
  }
  eyePyramid.matrix.set(headPyramid.matrix);
  eyePyramid.matrix.translate(0.35, 0.5, 0.28);
  eyePyramid.matrix.rotate(-80,1,0,0);
  eyePyramid.matrix.scale(0.13, 0.13, 0.13);
  eyePyramid.render();

  eyePyramid2.matrix.set(headPyramid.matrix);
  eyePyramid2.matrix.translate(0.55, 0.5, 0.28);
  eyePyramid2.matrix.rotate(-80,1,0,0);
  eyePyramid2.matrix.scale(0.13, 0.13, 0.13);
  eyePyramid2.render();

  // Left arm
  var leftArm = new Cube();
  leftArm.color = [0.96, 0.76, 0.53, 1.0]; // Tan
  leftArm.matrix.translate(0,-.5,0.0);
  leftArm.matrix.rotate(5,1,0,0);
  leftArm.matrix.rotate(-g_leftArmAngle,0,0,1);   

  var leftArmCoordinatesMat = new Matrix4(leftArm.matrix);

  leftArm.matrix.scale(0.25, 0.7, 0.25); 
  leftArm.matrix.translate(0, 0.35, 0);
  leftArm.render();

  // Left Hand
  var leftHand = new Cube();
  leftHand.color = [1.0, 0.8, 0.86, 1.0]; // Pink
  leftHand.matrix = leftArmCoordinatesMat;
  leftHand.matrix.translate(0.06, 0.9, 0.05);
  leftHand.matrix.rotate(-g_leftHandAngle,0,0,1);
  leftHand.matrix.scale(.2,.2,.2);

  leftHand.render();

  // Walking stick (attached to left hand)
  var walkingStick = new Cube();
  walkingStick.color = [1, 1, 1, 1]; // White
  walkingStick.matrix = new Matrix4(leftHand.matrix); 
  walkingStick.matrix.translate(0.05, 0.7, 0.05); 
  walkingStick.matrix.rotate(90, 0, 0, 1); 
  walkingStick.matrix.rotate(-g_walkingStickAngle, 1, 0, 0); 
  walkingStick.matrix.scale(0.1, 4.0, 0.1);
  walkingStick.render();

  // Right arm
  var rightArm = new Cube();
  rightArm.color = [0.4, 0.6, 0.85, 1.0]; // Light blue
  rightArm.matrix.translate(0.3,-0.5,0.0); 
  rightArm.matrix.rotate(-5,1,0,0); 
  rightArm.matrix.rotate(g_rightArmAngle,0,0,1); 

  var rightArmCoordinatesMat = new Matrix4(rightArm.matrix);

  rightArm.matrix.scale(0.25, 0.7, 0.25); 
  rightArm.matrix.translate(0.125, 0.35, 0); 
  rightArm.render();

  // Right Hand
  var rightHand = new Cube();
  rightHand.color = [1.0, 0.8, 0.86, 1.0]; // Pink (same as left hand)
  rightHand.matrix = rightArmCoordinatesMat; 

  rightHand.matrix.translate(0.16, 0.9, 0.05); 
  rightHand.matrix.rotate(-g_rightHandAngle,0,0,1); 
  rightHand.matrix.scale(.2,.2,.2);

  rightHand.render();

  //debug time
  var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration)/10, "numdot");

}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}