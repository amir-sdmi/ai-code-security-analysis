// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE =
  'precision mediump float;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'attribute vec3 a_Normal;\n' +
  'varying vec2 v_UV;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec4 v_VertPos;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '  v_UV = a_UV;\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));\n' +
  '  v_VertPos = u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec2 v_UV;\n' +
  'varying vec3 v_Normal;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform sampler2D u_Sampler2;\n' +
  'uniform sampler2D u_Sampler3;\n' +
  'uniform int u_whichTexture;\n' +
  'uniform vec3 u_lightPos;\n' +
  'uniform vec3 u_cameraPos;\n' +
  'uniform bool u_lightOn;\n' +
  'uniform vec3 u_spotLightPos;\n' +
  'uniform vec3 u_spotLightDir;\n' +
  'uniform float u_spotLightCutoff;\n' +
  'uniform bool u_spotLightOn;\n' +
  'varying vec4 v_VertPos;\n' +
  'void main() {\n' +
  '  if (u_whichTexture == -3) {\n' +  //normal
  '    gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);\n' +
  '    return;\n' +
  '  } else if (u_whichTexture == -2) {\n' +  //color
  '    gl_FragColor = u_FragColor;\n' +
  '  } else if (u_whichTexture == -1) {\n' +    //uv debug color
  '    gl_FragColor = vec4(v_UV, 1.0, 1.0);\n' +
  '    return;\n' +
  '  } else if (u_whichTexture == 0) {\n' +  //texture0
  '    gl_FragColor = texture2D(u_Sampler0, v_UV);\n' +
  '  } else if (u_whichTexture == 1) {\n' +  //texture1 (maze)
  '    gl_FragColor = texture2D(u_Sampler1, v_UV);\n' +
  '  } else if (u_whichTexture == 2) {\n' +  //texture2 (diamond)
  '    gl_FragColor = texture2D(u_Sampler2, v_UV);\n' +
  '  } else if (u_whichTexture == 3) {\n' +  //texture3 (disco ball)
  '    gl_FragColor = texture2D(u_Sampler3, v_UV);\n' +
  '  } else {\n' +  //error
  '    gl_FragColor = vec4(1,.2,.2,1);\n' +
  '    return;\n' +
  '  }\n' +
  '  if (u_lightOn) {\n' +
  '    vec3 lightVector = u_lightPos - vec3(v_VertPos);\n' +
  '    float r=length(lightVector);\n' +
  '    vec3 L = normalize(lightVector);\n' +
  '    vec3 N = normalize(v_Normal);\n' +
  '    float nDotL = max(dot(N,L), 0.0);\n' +
  '    vec3 R = reflect(-L, N);\n' +
  '    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));\n' +
  '    float specular = pow(max(dot(E, R), 0.0), 32.0);\n' +
  '    vec3 diffuse = vec3(gl_FragColor) * nDotL;\n' +
  '    vec3 ambient = vec3(gl_FragColor) * 0.3;\n' +
    '    if (u_whichTexture == 0) {\n' +
      '      gl_FragColor = vec4(specular + diffuse + ambient, 1.0);\n' +
    '    } else if (u_whichTexture == 1 || u_whichTexture == 2 || u_whichTexture == -2) {\n' +
      '      gl_FragColor = vec4(diffuse + ambient, 1.0);\n' +
    '    } else if (u_whichTexture == 3) {\n' +
      '      gl_FragColor = vec4(specular + diffuse + ambient, 1.0);\n' +
    '    }\n' +
  '  }\n' +
  //ChatGPT helped figure out the spot light code
  '  if (u_spotLightOn) {\n' +
  '    vec3 spotLightVector = u_spotLightPos - vec3(v_VertPos);\n' +
  '    vec3 spotL = normalize(spotLightVector);\n' +
  '    vec3 spotDir = normalize(u_spotLightDir);\n' +
  '    float spotAngle = dot(-spotL, spotDir);\n' +
  '    if (spotAngle > u_spotLightCutoff) {\n' +
  '      vec3 N = normalize(v_Normal);\n' +
  '      float spotNDotL = max(dot(N, spotL), 0.0);\n' +
  '      vec3 spotDiffuse = vec3(gl_FragColor) * spotNDotL * 0.8;\n' +
  '      float fadeoff = (spotAngle - u_spotLightCutoff) / (1.0 - u_spotLightCutoff);\n' +
  '      gl_FragColor = vec4(vec3(gl_FragColor) + spotDiffuse * fadeoff, 1.0);\n' +
  '    }\n' +
  '  }\n' +
  '}\n';

//Global Variables

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_spotLightPos;
let u_spotLightDir;
let u_spotLightCutoff;
let u_spotLightOn;
let u_NormalMatrix;

// Global variables for mouse drag camera rotation
let g_isDragging = false;
let g_lastMouseX = -1;
const MOUSE_SENSITIVITY_X = 0.2; //senstivity of mouse rotation

//global variables for optimization (suggested by chatgpt)
let g_projMat = new Matrix4();
let g_viewMat = new Matrix4();
let g_globalRotMat = new Matrix4();
let g_normalMatrix = new Matrix4();
let g_floorCube = null; 
let g_skyCube = null;
let g_wallCube = null; 
let g_sphere = null;


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

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  //more debugging
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler3');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_spotLightPos = gl.getUniformLocation(gl.program, 'u_spotLightPos');
  if (!u_spotLightPos) {
    console.log('Failed to get the storage location of u_spotLightPos');
    return;
  }

  u_spotLightDir = gl.getUniformLocation(gl.program, 'u_spotLightDir');
  if (!u_spotLightDir) {
    console.log('Failed to get the storage location of u_spotLightDir');
    return;
  }

  u_spotLightCutoff = gl.getUniformLocation(gl.program, 'u_spotLightCutoff');
  if (!u_spotLightCutoff) {
    console.log('Failed to get the storage location of u_spotLightCutoff');
    return;
  }

  u_spotLightOn = gl.getUniformLocation(gl.program, 'u_spotLightOn');
  if (!u_spotLightOn) {
    console.log('Failed to get the storage location of u_spotLightOn');
    return;
  }

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  //Initialize global objects after GLSL setup
  g_floorCube = new Cube();
  g_skyCube = new Cube();
  g_wallCube = new Cube();
  g_sphere = new Sphere();

}


//globals for UI elements

let g_globalAngle = 0;
let g_globalAngleX = 0; // X rotation for up/down mouse drag
let g_globalAngleY = 0; // Y rotation for left/right mouse drag
let g_normalOn = false;
let g_lightPos = [4.5, 1.0, 2.5];
let g_animationPaused = false; // Flag to control animation pause
let g_lightOn = true; // Flag to control light on/off state

//chatGPT helped figure out how to aim the spot light
let g_spotLightPos = [-3.25, 0.5, 5]; // Position next to sphere
let g_spotLightDir = [-1, 0, 0]; // Direction pointing left
let g_spotLightCutoff = 0.7; // Cosine of 45 degree cutoff angle
let g_spotLightOn = false; // Spot light starts off

// Cached DOM elements for sliders (optimization) (gpt helped with this)
//let angleSlider; // Keep for camera



function addActionsForHtmlUI(){
  // Cache slider elements globally

  //angleSlider = document.getElementById('angleSlide');

  //document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});

  document.getElementById('normalOn').onclick = function() {g_normalOn=true;};
  document.getElementById('normalOff').onclick = function() {g_normalOn=false;};

  document.getElementById('animationToggle').onclick = function() {
    g_animationPaused = !g_animationPaused;
    if (g_animationPaused) {
      console.log("Animation Paused");
    } else {
      //reset g_startTime to avoid jump in animation
      g_startTime = performance.now()/1000.0 - g_seconds;
      console.log("Animation Resumed");
    }
  };

  document.getElementById('lightOn').onclick = function() {
    g_lightOn = true;
    console.log("Light On");
    renderAllShapes(); // Re-render
  };

  document.getElementById('lightOff').onclick = function() {
    g_lightOn = false;
    console.log("Light Off");
    renderAllShapes(); // Re-render
  };

  document.getElementById('spotLightOn').onclick = function() {
    g_spotLightOn = true;
    console.log("Spot Light On");
    renderAllShapes(); // Re-render
  };

  document.getElementById('spotLightOff').onclick = function() {
    g_spotLightOn = false;
    console.log("Spot Light Off");
    renderAllShapes(); // Re-render
  };

  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[0] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[1] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[2] = this.value/100; renderAllShapes();}});

  // Register mouse event handlers for camera rotation
  canvas.onmousedown = handleMouseDown;
  document.onmousemove = handleMouseMove; // Use document to catch moves outside canvas
  document.onmouseup = handleMouseUp;   // Use document to catch mouse up outside canvas
}

function handleMouseDown(ev) {
  if (ev.button === 0) { // Check for left mouse button
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
  }
}

function handleMouseMove(ev) {
  if (!g_isDragging) {
    return;
  }

  let deltaX = ev.clientX - g_lastMouseX;

  if (deltaX !== 0) {
    g_camera.panRight(deltaX * MOUSE_SENSITIVITY_X);
  }

  g_lastMouseX = ev.clientX;
  renderAllShapes(); // Re-render the scene after camera pan
}

function handleMouseUp(ev) {
  if (ev.button === 0) { // Check for left mouse button
    g_isDragging = false;
  }
}

function initTextures() {
  
  //command_block.png (Sampler0)
  var image0 = new Image();
  if (!image0) {
    console.log('Failed to create the image object for Sampler0');
    return false;
  }
  image0.onload = function() { sendTextureToTEXTURE0(image0); }
  image0.src = 'command_block.png'; // This used to be a command block, but I changed it to a differentwall block

  //maze_block_texture.png (Sampler1)
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object for Sampler1');
    return false;
  }
  image1.onload = function() { sendTextureToTEXTURE1(image1); }
  image1.src = 'maze_block_texture.png';

  // diamond_block.png (Sampler2)
  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object for Sampler2');
    return false;
  }
  image2.onload = function() { sendTextureToTEXTURE2(image2); }
  image2.src = 'diamond_block.png';   //this one also used to be diamond block, but the gold block had a more interesting texture

  // disco_ball.png (Sampler3)
  var image3 = new Image();
  if (!image3) {
    console.log('Failed to create the image object for Sampler3');
    return false;
  }
  image3.onload = function() { sendTextureToTEXTURE3(image3); }
  image3.src = 'disco_ball.png';

  return true;
}

//send texture to TEXTURE0
function sendTextureToTEXTURE0(image) {
  //create texture
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  //flips the image vertically (y axis)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //set parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler0, 0);

  console.log('finished loadTexture');
}

// send texture to TEXTURE1 (maze blocks)
function sendTextureToTEXTURE1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for Sampler1');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  //flips the image vertically (y axis)
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //set parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler1, 1); //use texture unit 1

  console.log('finished loadTexture for Sampler1 (maze)');
}

// send texture to TEXTURE2 (diamond blocks)
function sendTextureToTEXTURE2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for Sampler2');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  //flips the image vertically (y axis)
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //set parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler2, 2); //use texture unit 2

  console.log('finished loadTexture for Sampler2 (diamond)');
}

// send texture to TEXTURE3 (disco ball)
function sendTextureToTEXTURE3(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object for Sampler3');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  //flips the image vertically (y axis)
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //set parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler3, 3); //use texture unit 3

  console.log('finished loadTexture for Sampler3 (disco ball)');
}

function main() {
  
  setupWebGL(); //webgl setup
  connectVariablestoGLSL();  //set up GLSL shader programs/variables

  //Init global objects for performance (suggested by chatgpt)
  g_floorCube = new Cube();
  g_skyCube = new Cube();
  g_wallCube = new Cube();
  g_sphere = new Sphere();


  addActionsForHtmlUI();  //HTML UI elements


  g_camera = new Camera();
  document.onkeydown = keydown;

  initTextures();

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
  g_lightPos[0] = Math.cos(g_seconds); 
  // Move slider with animation
  var lightSliderX = document.getElementById('lightSlideX');
  if (lightSliderX) {
    lightSliderX.value = g_lightPos[0] * 100;
  }
}



//Called by browser repeatedly whenever its time
function tick() {
  if (g_animationPaused) {
    renderAllShapes(); // Still render the current state
    requestAnimationFrame(tick); // Keep the loop going to check for unpause
    return;
  }

  // Save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  //console.log(g_seconds);
  // Draw everything
  renderAllShapes();
  //Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

// not used anymore (I think)
// //Poke Animation Framework
// let g_pokeActive = false;
// let g_pokeStartTime = 0;
// const POKE_DURATION = 1000; // ms

function keydown(ev) {
  if (ev.keyCode == 68) { // D key
    // g_globalAngle += 0.2; // Old rotation code
    g_camera.right();
  } else if (ev.keyCode == 65) { // A key
    // g_globalAngle -= 0.2; // Old rotation code
    g_camera.left();
  } else if (ev.keyCode == 87) { // W key
    g_camera.forward();
  } else if (ev.keyCode == 83) { // S key
    g_camera.back();
  } else if (ev.keyCode == 81) { // Q key rotato left
    g_camera.panLeft();
  } else if (ev.keyCode == 69) { // E key rotato right
    g_camera.panRight();
    //gpt helped figure out some of this logic for breaking blocks
  } else if (ev.keyCode == 66) { // B key - Break block
    // Calculate forward vector
    let forwardVec = new Vector3(g_camera.at.elements);
    forwardVec.sub(g_camera.eye);
    forwardVec.normalize();

    // Calculate position one unit in front
    let targetPos = new Vector3(g_camera.eye.elements);
    targetPos.add(forwardVec); // Add normalized forward vector

    let targetMapX = Math.floor(targetPos.elements[0] + MAP_SIZE_X / 2);
    let targetMapZ = Math.floor(targetPos.elements[2] + MAP_SIZE_Z / 2);

    // Check bounds
    if (targetMapX >= 0 && targetMapX < MAP_SIZE_X && targetMapZ >= 0 && targetMapZ < MAP_SIZE_Z) {
      // Check if the block is a diamond block (value 3)
      if (g_map[targetMapZ][targetMapX] === 3) {
        g_map[targetMapZ][targetMapX] = 0; // Set to empty space
        console.log(`Broke diamond block at map coordinates (${targetMapX}, ${targetMapZ})`);   //todo output to html
        
        // Display the victory pop-up
        var victoryPopup = document.getElementById('victoryPopup');
        if (victoryPopup) {
          victoryPopup.style.display = 'block';
        }
      }
    }
  }

  renderAllShapes();
  // console.log(ev.keyCode);
}

var g_camera = new Camera();

// Used chatgpt to help with optimization here, apparently it's faster to use a global variable for the map?
// map global variable 16x16 (resized to focus on maze)
// 3 = diamond block

const g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //1
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //2
  [1,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1], //3
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //4
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //5
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //6
  [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1], //7
  [1,0,0,0,0,0,2,2,2,2,0,2,0,0,0,1], //8
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1], //9
  [1,0,0,0,0,0,2,2,0,2,2,2,0,0,0,1], //10
  [1,0,0,0,0,0,2,2,0,0,0,2,3,0,0,1], //11
  [1,0,0,0,0,0,0,0,2,0,0,2,0,0,0,1], //12
  [1,0,0,0,0,2,2,0,2,0,0,2,0,0,0,1], //13
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //14
  [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1], //15
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  //16
];
const MAP_SIZE_X = g_map[0].length;
const MAP_SIZE_Z = g_map.length;

function drawMap() {

  for (let x = 0; x < MAP_SIZE_X; x++) {
    for (let z = 0; z < MAP_SIZE_Z; z++) {
      let blockType = g_map[z][x]; // Note: map[z][x] corresponds to world (x, z)
      
      if (blockType > 0) {
        // Determine texture and height based on block type
        let actualRenderHeight;
        
        if (blockType === 3) { // Diamond block (technically gold but diamond is the name of the texture)
          if (g_normalOn) {
            g_wallCube.textureNum = -3; // Normal visualization
          } else {
            g_wallCube.textureNum = 2; // Diamond texture
          }
          actualRenderHeight = 1;    // Diamond blocks are height 1
        } else if (blockType === 2) { // Maze blocks (type 2 only)
          if (g_normalOn) {
            g_wallCube.textureNum = -3; // Normal visualization
          } else {
            g_wallCube.textureNum = 1; // Maze texture
          }
          actualRenderHeight = 2;    // Maze blocks are height 2
        } else { // Default wall blocks (includes boundary type 1)
          if (g_normalOn) {
            g_wallCube.textureNum = -3; // Normal visualization
          } else {
            g_wallCube.textureNum = 0; // Default wall texture (used for boundary)
          }
          actualRenderHeight = blockType; // Use the map value as height (e.g. height 1 for boundary)
        }

        for (let y = 0; y < actualRenderHeight; y++) {
          g_wallCube.matrix.setTranslate(x - MAP_SIZE_X / 2, y - 0.5, z - MAP_SIZE_Z / 2);
          // Set normal matrix for each wall cube instance
          g_normalMatrix.setInverseOf(g_wallCube.matrix);
          g_normalMatrix.transpose();
          gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
          g_wallCube.render();
        }
      }
    }
  }
}

function renderAllShapes() {
  var startTime = performance.now();

  // Use global projection matrix
  // var projMat = new Matrix4();
  g_projMat.setPerspective(g_camera.fov, canvas.width/canvas.height, 0.1, 1000); // Update global matrix
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_projMat.elements);



  // var viewMat = new Matrix4();
  g_viewMat.setLookAt(g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
                    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
                    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]); // Update global matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_viewMat.elements);

  // Use global rotation matrix
  // var globalRotMat = new Matrix4();
  // Reset global rotation matrix before applying new rotations
  g_globalRotMat.setIdentity();

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_globalRotMat.elements);

  //clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  gl.uniform1i(u_lightOn, g_lightOn); // Pass the light state
  gl.uniform3f(u_spotLightPos, g_spotLightPos[0], g_spotLightPos[1], g_spotLightPos[2]);
  gl.uniform3f(u_spotLightDir, g_spotLightDir[0], g_spotLightDir[1], g_spotLightDir[2]);
  gl.uniform1f(u_spotLightCutoff, g_spotLightCutoff);
  gl.uniform1i(u_spotLightOn, g_spotLightOn);

  // Function to set normal matrix (to avoid repetition) (suggested by chatgpt)
  function setNormalMatrix(modelMatrix) {
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  }

  var light=new Cube();
  light.color = [2,2,0,1];
  light.textureNum = -2; // Use color
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  setNormalMatrix(light.matrix); // Set normal matrix for the light cube
  light.render();

  // Spot light visual indicator (cube)
  var spotLight = new Cube();
  spotLight.color = g_spotLightOn ? [1,0.5,0,1] : [0.3,0.15,0,1]; // Orange when on, dark when off
  spotLight.textureNum = -2; // Use color
  spotLight.matrix.translate(g_spotLightPos[0], g_spotLightPos[1], g_spotLightPos[2]);
  spotLight.matrix.scale(-0.1, -0.1, -0.1);
  spotLight.matrix.translate(-0.5, -0.5, -0.5);
  setNormalMatrix(spotLight.matrix); // Set normal matrix for the spot light cube
  spotLight.render();



  // var floor = new Cube();
  g_floorCube.color = [0.2, 0.4, 0.2, 1.0]; // Darker Green color
  if (g_normalOn) {
    g_floorCube.textureNum = -3; // Use normal visualization
  } else {
    g_floorCube.textureNum = -2; // Use color
  }
  g_floorCube.matrix.setIdentity(); 
  g_floorCube.matrix.translate(0, -0.75, 0);
  g_floorCube.matrix.scale(MAP_SIZE_X, 0.5, MAP_SIZE_Z);
  g_floorCube.matrix.translate(-0.5, 0, -0.5);
  setNormalMatrix(g_floorCube.matrix); // Set normal matrix for floor
  g_floorCube.render();



  // var sky = new Cube();
  g_skyCube.color = [0.3, 0.5, 0.7, 1.0]; // Darker Light blue color
  if (g_normalOn) {
    g_skyCube.textureNum = -3; // Use normal
  } else {
    g_skyCube.textureNum = -2; // Use color (default)
  }
  // Reset matrix before applying transformations
  g_skyCube.matrix.setIdentity(); 
  g_skyCube.matrix.scale(-50, -50, -50);
  g_skyCube.matrix.translate(-0.5, -0.5, -0.5);
  setNormalMatrix(g_skyCube.matrix); // Set normal matrix for sky
  g_skyCube.render();

  // Render the sphere
  g_sphere.color = [0.8, 0.2, 0.2, 1.0]; //Red color
  if (g_normalOn) {
    g_sphere.textureNum = -3; // Use normal visualization
  } else {
    g_sphere.textureNum = 3; // Use disco ball texture
  }
  g_sphere.matrix.setIdentity(); // Reset matrix
  g_sphere.matrix.translate(-4, 0.5, 5);
  g_sphere.matrix.scale(0.5, 0.5, 0.5); //half size
  setNormalMatrix(g_sphere.matrix); // Set normal matrix for sphere
  g_sphere.render();

  drawMap();

  //performance indicator stuff
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

