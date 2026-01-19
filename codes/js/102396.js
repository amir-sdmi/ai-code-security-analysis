// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE =
  'precision mediump float;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'varying vec2 v_UV;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '  v_UV = a_UV;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec2 v_UV;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform sampler2D u_Sampler2;\n' +
  'uniform int u_whichTexture;\n' +
  'void main() {\n' +
  '  if (u_whichTexture == -2) {\n' +  //color
  '    gl_FragColor = u_FragColor;\n' +
  '  } else if (u_whichTexture == -1) {\n' +    //uv debug color
  '    gl_FragColor = vec4(v_UV, 1.0, 1.0);\n' +
  '  } else if (u_whichTexture == 0) {\n' +  //texture0
  '    gl_FragColor = texture2D(u_Sampler0, v_UV);\n' +
  '  } else if (u_whichTexture == 1) {\n' +  //texture1 (maze)
  '    gl_FragColor = texture2D(u_Sampler1, v_UV);\n' +
  '  } else if (u_whichTexture == 2) {\n' +  //texture2 (diamond)
  '    gl_FragColor = texture2D(u_Sampler2, v_UV);\n' +
  '  } else {\n' +  //error
  '    gl_FragColor = vec4(1,.2,.2,1);\n' +
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

// Global variables for mouse drag camera rotation
let g_isDragging = false;
let g_lastMouseX = -1;
const MOUSE_SENSITIVITY_X = 0.2; //senstivity of mouse rotation

//global variables for optimization (suggested by chatgpt)
let g_projMat = new Matrix4();
let g_viewMat = new Matrix4();
let g_globalRotMat = new Matrix4();
let g_floorCube = null; 
let g_skyCube = null;
let g_wallCube = null; 


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

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  //Initialize global objects after GLSL setup
  g_floorCube = new Cube();
  g_skyCube = new Cube();
  g_wallCube = new Cube(); 

}


//globals for UI elements

let g_globalAngle = 0;
let g_globalAngleX = 0; // X rotation for up/down mouse drag
let g_globalAngleY = 0; // Y rotation for left/right mouse drag

// Cached DOM elements for sliders (optimization) (gpt helped with this)
//let angleSlider; // Keep for camera



function addActionsForHtmlUI(){
  // Cache slider elements globally

  //angleSlider = document.getElementById('angleSlide');

  //document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});

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

function main() {
  
  setupWebGL(); //webgl setup
  connectVariablestoGLSL();  //set up GLSL shader programs/variables

  //Init global objects for performance (suggested by chatgpt)
  g_floorCube = new Cube();
  g_skyCube = new Cube();
  g_wallCube = new Cube(); 


  addActionsForHtmlUI();  //HTML UI elements

  // REMOVED: Old mouse click/drag handlers for shape/poke animation
  // Register function (event handler) to be called on a mouse press
  //  for shape manipulation/poke animation
  // canvas.onmousedown = click;
  // canvas.onmousemove = function(ev){ if(ev.buttons == 1) { click(ev) }};
  // canvas.onmousemove = function(ev){ 
  //     if(ev.buttons == 1) { 
  //         click(ev);
  //     } else {
  //         if(g_pokeAnimation){
  //             // Pass the event object to the handleMouseMove function
  //             handleMouseMove(ev);
  //         }
  //     }
  // };
  // canvas.onmousedown = origin;

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
  //old animation framework
}



//Called by browser repeatedly whenever its time
function tick() {
  // Save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  //console.log(g_seconds);
  // Draw everything
  renderAllShapes();
  //Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

//Poke Animation Framework
let g_pokeActive = false;
let g_pokeStartTime = 0;
const POKE_DURATION = 1000; // ms

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
// map global variable 32x32
// 3 = diamond block

const g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //1
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //2
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //3
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //4
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //5
  [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //5
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //7
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //8
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //9
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //10
  [1,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,1], //11
  [1,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //12
  [1,0,0,0,0,0,0,0,0,0,2,0,2,0,2,0,2,2,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //13
  [1,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //14
  [1,0,0,0,0,0,0,0,0,0,2,0,2,2,2,2,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,1], //15
  [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //16
  [1,0,0,0,0,0,0,0,0,0,2,0,2,2,0,2,2,2,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //17
  [1,0,0,0,0,0,0,0,0,0,2,0,2,2,0,0,0,2,3,2,0,0,0,0,0,0,0,0,0,0,0,1], //18
  [1,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,1], //19
  [1,0,0,0,0,0,0,0,0,0,2,2,2,2,2,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,1], //20
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //21
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //22
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //23
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //24
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //25
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //26
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //27
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //28
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //29
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //30
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] //31
];
const MAP_SIZE_X = g_map[0].length;
const MAP_SIZE_Z = g_map.length;

function drawMap() {

  for (let x = 0; x < MAP_SIZE_X; x++) {
    for (let z = 0; z < MAP_SIZE_Z; z++) {
      let wallHeight = g_map[z][x]; // Note: map[z][x] corresponds to world (x, z)
      
      if (wallHeight > 0) {
        // Determine which texture to use for this stack of wall blocks
        if (x >= 10 && x <= 19 && z >= 10 && z <= 19 && wallHeight === 2) {
          g_wallCube.textureNum = 1; // Maze texture for 2-block high walls in maze area
        } else if (wallHeight === 3 && g_map[z][x] === 3) { // Check for our specific diamond block marker
          g_wallCube.textureNum = 2; // Diamond block texture
          wallHeight = 1; // Override height to 1 for diamond block if map value is 3
        } else {
          g_wallCube.textureNum = 0; // Default wall texture for other walls
        }
        //gpt helped figure out some of this logic
        let actualRenderHeight = g_map[z][x];
        if (g_map[z][x] === 3) { // If it's a diamond block type
          g_wallCube.textureNum = 2; // Diamond texture
          actualRenderHeight = 1;    // Diamond blocks are always height 1
        } else if (x >= 10 && x <= 19 && z >= 10 && z <= 19 && g_map[z][x] === 2) {
          g_wallCube.textureNum = 1; // Maze texture
          actualRenderHeight = 2;    // Maze blocks are height 2
        } else {
          g_wallCube.textureNum = 0;
        }

        for (let y = 0; y < actualRenderHeight; y++) {
          g_wallCube.matrix.setTranslate(x - MAP_SIZE_X / 2, y - 0.5, z - MAP_SIZE_Z / 2);

          g_wallCube.renderfast();
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


  // var floor = new Cube();
  g_floorCube.color = [0.2, 0.6, 0.2, 1.0]; // Green color
  g_floorCube.textureNum = -2;
  // Reset matrix before applying transformations
  g_floorCube.matrix.setIdentity(); 
  g_floorCube.matrix.translate(0, -0.75, 0); // move floor down
  g_floorCube.matrix.scale(MAP_SIZE_X, 0.5, MAP_SIZE_Z); //base on map size
  g_floorCube.matrix.translate(-0.5, 0, -0.5); // Centered
  g_floorCube.render();



  // var sky = new Cube();
  g_skyCube.color = [0.5, 0.8, 1.0, 1.0]; // Light blue color
  g_skyCube.textureNum = -2; // Use color
  // Reset matrix before applying transformations
  g_skyCube.matrix.setIdentity(); 
  g_skyCube.matrix.scale(100, 100, 100);
  g_skyCube.matrix.translate(-0.5, -0.5, -0.5);
  g_skyCube.render();


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