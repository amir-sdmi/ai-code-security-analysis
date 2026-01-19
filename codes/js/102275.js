/* Jason Chew
 * CS 372 Project 5: Using 3D Models ("Glitzy Frog")
 * Calvin University
 * 2/17/25
 * 3D Models provided by Quaternius: https://poly.pizza/u/Quaternius
 * Player model: https://poly.pizza/m/MRjSlwCjHM
 * Enemy model: https://poly.pizza/m/l6AhogdZHe
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const PLAYER_SIZE = 1;
const ENEMY_SIZE = 0.5;
const NUM_ENEMIES = 8; // Note: NUM_ENEMIES *per color*, actual count is x2
const PLAYER_SPEED = 0.3;
const ENEMY_SPEED = 0.05;
const ARENA_SIZE = 100;

var gameOver = false;
var score = 0;

var redPlayer = new THREE.Group();
// Clock for red player's animation
const redPlayerClock = new THREE.Clock();
// Animation components to load in init() and use in animate()
var redMixer;
var redSwimAction;

var bluePlayer = new THREE.Group();
// Clock for blue player's animation
const bluePlayerClock = new THREE.Clock();
// Animation components to load in init() and use in animate()
var blueMixer;
var blueSwimAction;

// Loader for player models
var anglerLoader = new GLTFLoader();
var anglerGroup = new THREE.Group();
var anglerAnimations;

// Lists to store enemies and their animation components
var blueEnemies = [];
var blueEnemyClocks = [];
var blueEnemyMixers = [];
var blueEnemySwimActions = [];

var redEnemies = [];
var redEnemyClocks = [];
var redEnemyMixers = [];
var redEnemySwimActions = [];

// Loader for enemy models
var enemyLoader = new GLTFLoader();
var blueEnemyModel = new THREE.Group();
var redEnemyModel = new THREE.Group();
var enemyAnimations;

// View setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, // FOV
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Lower distance range of rendering
  100, // Upper distance range of rendering
);
// Top-down camera
camera.rotation.set(-Math.PI/2, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(
  window.innerWidth,
  window.innerHeight,
);
document.body.appendChild(renderer.domElement)

// Player model loader
// Model load and animation workflow provided by ChatGPT:
// https://chat.openai.com/share/77a94a09-59d5-4dc5-a806-6fd190d93ddf
anglerLoader.load('public/Anglerfish.glb', function (gltf) {
  var anglerModel = gltf.scene;
  var anglerBound = new THREE.Box3();

  // Original bounding box is incorrect. Correction written by ChatGPT:
  // https://chat.openai.com/share/380cd060-a4fd-4eff-aa1f-4bc3e32c9a55
  anglerModel.traverse(function (child) {
    if (child.isMesh) {
      anglerBound.expandByObject(child);
    }
  });
  
  anglerModel.scale.set(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);

  // Fix to align model's incorrect visual rotation with internal rotation
  anglerModel.rotation.set(0, Math.PI/2, 0);
  anglerGroup.add(anglerModel);

  // Set model to face up by default
  anglerGroup.rotation.set(0, Math.PI/2, 0);

  // Access animations
  anglerAnimations = gltf.animations;

  // Enemy model loader
  enemyLoader.load('public/Tetra.glb', function (gltf) {
    var enemyModel = gltf.scene;
    enemyModel.scale.set(ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE);
    // Fix to align model's incorrect visual rotation with internal rotation
    enemyModel.rotation.set(0, -Math.PI/2, 0);

    // Bases will first be corrected (rotation and bounding box) before usage
    var redEnemyBase = SkeletonUtils.clone(enemyModel);
    var blueEnemyBase = SkeletonUtils.clone(enemyModel);
    var enemyBound = new THREE.Box3();

    // Original bounding box is incorrect. Correction written by ChatGPT:
    // https://chat.openai.com/share/380cd060-a4fd-4eff-aa1f-4bc3e32c9a55
    redEnemyBase.traverse(function (child) {
      if (child.isMesh) {
        // Recolor enemy to be fully red
        child.material = new THREE.MeshLambertMaterial({color: 0xff0000});
        enemyBound.expandByObject(child);
      }
    });
    // Set model to face up by default
    redEnemyModel.add(redEnemyBase);
    redEnemyModel.rotation.set(0, Math.PI/2, 0);

    // Original bounding box is incorrect. Correction written by ChatGPT:
    // https://chat.openai.com/share/380cd060-a4fd-4eff-aa1f-4bc3e32c9a55
    blueEnemyBase.traverse(function (child) {
      if (child.isMesh) {
        // Recolor enemy to be fully blue
        child.material = new THREE.MeshLambertMaterial({color: 0x0000ff});
        enemyBound.expandByObject(child);
      }
    });
    // Set model to face up by default
    blueEnemyModel.add(blueEnemyBase);
    blueEnemyModel.rotation.set(0, Math.PI/2, 0);
  
    // Access animations
    enemyAnimations = gltf.animations;

    init();
  });
});

function init() {
  // Arena background
  const mapLoader = new THREE.TextureLoader;
  const background = mapLoader.load('public/stars.jpeg');
  const floorMaterial = new THREE.MeshLambertMaterial({map: background, side: THREE.BackSide});
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI/2;
  floor.position.set(0, 0, 0);
  scene.add(floor);

  // Ambient lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
  scene.add(ambientLight);

  // Players assigned anglerfish model, given point light "bulbs"
  bluePlayer = SkeletonUtils.clone(anglerGroup);
  const blueBulb = new THREE.PointLight(0x0000ff, 100);
  blueBulb.position.set(2.5*PLAYER_SIZE, 1.5*PLAYER_SIZE, 0);
  bluePlayer.add(blueBulb);
  bluePlayer.position.set(0, 0, -5*PLAYER_SIZE);
  scene.add(bluePlayer);

  redPlayer = SkeletonUtils.clone(anglerGroup);
  const redBulb = new THREE.PointLight(0xff0000, 100);
  redBulb.position.set(2.5*PLAYER_SIZE, 1.5*PLAYER_SIZE, 0);
  redPlayer.add(redBulb);
  redPlayer.position.set(0, 0, 0);
  scene.add(redPlayer);

  // Players assigned animations from anglerfish model
  blueMixer = new THREE.AnimationMixer(bluePlayer);
  blueSwimAction = blueMixer.clipAction(anglerAnimations[5]);
  blueSwimAction.play();

  redMixer = new THREE.AnimationMixer(redPlayer);
  redSwimAction = redMixer.clipAction(anglerAnimations[5]);
  redSwimAction.play();

  // Small chasing enemies, one of each color
  for (var i = 0; i < NUM_ENEMIES; i++) {
    var blueEnemy = SkeletonUtils.clone(blueEnemyModel);
    blueEnemy.position.set(randomOffset(), 0, randomOffset());
    scene.add(blueEnemy);
    blueEnemies.push(blueEnemy);

    var redEnemy = SkeletonUtils.clone(redEnemyModel);
    redEnemy.position.set(randomOffset(), 0, randomOffset());
    redEnemy.position.set(randomOffset(), 0, randomOffset());
    scene.add(redEnemy);
    redEnemies.push(redEnemy);

    // Store enemies' animation components for later use
    blueEnemyClocks.push(new THREE.Clock());
    blueEnemyMixers.push(new THREE.AnimationMixer(blueEnemy));
    blueEnemySwimActions.push(blueEnemyMixers[i].clipAction(enemyAnimations[3]));
    blueEnemySwimActions[i].play();
    
    redEnemyClocks.push(new THREE.Clock());
    redEnemyMixers.push(new THREE.AnimationMixer(redEnemy));
    redEnemySwimActions.push(redEnemyMixers[i].clipAction(enemyAnimations[3]));
    redEnemySwimActions[i].play();
  }
  animate();
}

// Keystate setup from ChatGPT:
// https://chat.openai.com/share/0f8b0d7e-ca9b-48fd-b347-58c329707370
const keyState = {};
window.addEventListener('keydown', (e) => {
  keyState[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keyState[e.code] = false;
});

// Restart button handling
document.getElementById("restart").addEventListener("click", function () {
  // Hide game over screen
  document.getElementById("end-screen").style.display = "none";
  // Respawn enemies at random positions
  for (var i = 0; i < NUM_ENEMIES; i++) {
    var blueEnemy = blueEnemies[i];
    var redEnemy = redEnemies[i];
    redEnemy.position.x = randomOffset();
    redEnemy.position.z = randomOffset();
    blueEnemy.position.x = randomOffset();
    blueEnemy.position.z = randomOffset();
  }
  // Respawn players at start points
  bluePlayer.position.set(0, 0, 0);
  bluePlayer.rotation.set(0, Math.PI/2, 0);
  redPlayer.position.set(0, 0, -5);
  redPlayer.rotation.set(0, Math.PI/2, 0);
  gameOver = false;
  score = 0;
  requestAnimationFrame(animate);
});


function animate() {
  if(!gameOver) {
    requestAnimationFrame(animate);
  }
  // Update Score HUD
  document.getElementById("score").innerText = "Score: " + score;
  var blueVel = {
    x: 0,
    z: 0,
  }
  var redVel = {
    x: 0,
    z: 0
  }

  // Map inputs
  if (keyState['ArrowUp']) {
    blueVel.z -= PLAYER_SPEED;
  }
  if (keyState['ArrowLeft']) {
    blueVel.x -= PLAYER_SPEED;
  }
  if (keyState['ArrowDown']) {
    blueVel.z += PLAYER_SPEED;
  }
  if (keyState['ArrowRight']) {
    blueVel.x += PLAYER_SPEED;
  }
  if (keyState['KeyW']) {
    redVel.z -= PLAYER_SPEED;
  }
  if (keyState['KeyA']) {
    redVel.x -= PLAYER_SPEED;
  }
  if (keyState['KeyS']) {
    redVel.z += PLAYER_SPEED;
  }
  if (keyState['KeyD']) {
    redVel.x += PLAYER_SPEED;
  }

  // Restrict blue so it can't move offscreen (get too far away from red)
  boundMotion(bluePlayer, blueVel, 70, 40, redPlayer.position.x, redPlayer.position.z);

  // Get net velocity of blue to restrict overall movement within arena
  blueVel.x += redVel.x;
  blueVel.z += redVel.z;
  boundMotion(bluePlayer, blueVel, ARENA_SIZE, ARENA_SIZE, 0, 0);
  boundMotion(redPlayer, redVel, ARENA_SIZE, ARENA_SIZE, 0, 0);

  // Apply calculated net velocities to players
  bluePlayer.position.x += blueVel.x;
  bluePlayer.position.z += blueVel.z;
  redPlayer.position.x += redVel.x;
  redPlayer.position.z += redVel.z;

  // Players begin turning towards direction of motion
  alignRotation(bluePlayer, blueVel);
  alignRotation(redPlayer, redVel);
  
  // Keep animations going
  blueMixer.update(bluePlayerClock.getDelta());
  redMixer.update(redPlayerClock.getDelta());

  // Keep camera hovering over red
  camera.position.set(redPlayer.position.x, 30, redPlayer.position.z);
  renderer.render(scene, camera);

  // Enemy animations
  for (var i = 0; i < NUM_ENEMIES; i++) {
    var blueEnemy = blueEnemies[i];
    var redEnemy = redEnemies[i];

    // Both enemy types chase the nearest player regardles of color
    if(distance(blueEnemy, bluePlayer) < distance(blueEnemy, redPlayer)) {
      chase(bluePlayer, blueEnemy);
    } else {
      chase(redPlayer, blueEnemy);
    }
    if(distance(redEnemy, redPlayer) < distance(redEnemy, bluePlayer)) {
      chase(redPlayer, redEnemy);
    } else {
      chase(bluePlayer, redEnemy);
    }

    // Prevent "grouping" by "killing" colliding enemies (randomly shift pos)
    for (var j = 0; j < NUM_ENEMIES; j++) {
      var otherBlueEnemy = blueEnemies[j];
      var otherRedEnemy = redEnemies[j];
      if(i != j) {
        // If two same-color enemies collide: kill one.
        if(isColliding(otherBlueEnemy, blueEnemy)) {
          blueEnemy.position.x = redPlayer.position.x + randomOffset();
          blueEnemy.position.z = redPlayer.position.z + randomOffset();
        }
        if(isColliding(otherRedEnemy, redEnemy)) {
          redEnemy.position.x = bluePlayer.position.x + randomOffset();
          redEnemy.position.z = bluePlayer.position.z + randomOffset();
        }

        // If two different-color enemies collide: kill both.
        if(isColliding(redEnemy, otherBlueEnemy)) {
          otherBlueEnemy.position.x = redPlayer.position.x + randomOffset();
          otherBlueEnemy.position.z = redPlayer.position.z + randomOffset();
          redEnemy.position.x = bluePlayer.position.x + randomOffset();
          redEnemy.position.z = bluePlayer.position.z + randomOffset();
        }
      }
      // Keep model animations going
      blueEnemyMixers[i].update(blueEnemyClocks[i].getDelta());
      redEnemyMixers[i].update(redEnemyClocks[i].getDelta());
    }

    // Game over if player collides with different-color enemy
    if(isColliding(redPlayer, blueEnemy) || isColliding (bluePlayer, redEnemy)) {
      document.getElementById("end-screen").style.display = "block";
      gameOver = true;
    }
    
    // Red player scores by "eating" red enemy
    if(isColliding(redPlayer, redEnemy)) {
      score++;
      // Move to random offscreen location
      redEnemy.position.x += randomOffset();
      redEnemy.position.z += randomOffset();
    }
    
    // Blue player scores by "eating" blue enemy
    if(isColliding(bluePlayer, blueEnemy)) {
      score++;
      // Move to random offscreen location
      blueEnemy.position.x += randomOffset();
      blueEnemy.position.z += randomOffset();
    }
  }
}

// Rotate, move pursuer towards target in a straight line
function chase(target, pursuer) {
  var diffX = target.position.x - pursuer.position.x;
  var diffZ = target.position.z - pursuer.position.z;
  var angle = Math.atan2(diffZ, diffX);
  var xVel = Math.abs(Math.cos(angle));
  var zVel = Math.abs(Math.sin(angle));
  pursuer.position.x += ENEMY_SPEED*Math.sign(diffX)*xVel;
  pursuer.position.z += ENEMY_SPEED*Math.sign(diffZ)*zVel;
  pursuer.rotation.y = 90 - angle + 45;
}

// Utility function to calculate straight-line distance between two objects
function distance(objA, objB) {
  var diffX = objA.position.x - objB.position.x;
  var diffZ = objA.position.z - objB.position.z;
  return Math.sqrt(diffX**2 + diffZ**2);
}

// Collision detection written by ChatGPT:
// https://chat.openai.com/c/2fcab630-0e8f-44aa-b311-930d2190df60
function isColliding(objA, objB) {
  var hitboxA = new THREE.Box3().setFromObject(objA);
  var hitboxB = new THREE.Box3().setFromObject(objB);
  
  return hitboxA.intersectsBox(hitboxB);
}

// Restrict given obj to a rectangular bounding area about a center point
function boundMotion(obj, vel, boundX, boundZ, centerX, centerZ) {
  var x = obj.position.x;
  var z = obj.position.z;
  if(x >= boundX/2 - PLAYER_SIZE/2 + centerX && vel.x > 0) {
    vel.x = 0;
    obj.position.x = boundX/2 - PLAYER_SIZE/2 + centerX;
  }

  if(x <= -boundX/2 + PLAYER_SIZE/2 + centerX && vel.x < 0) {
    vel.x = 0;
    obj.position.x = -boundX/2 + PLAYER_SIZE/2 + centerX;
  }

  if(z >= boundZ/2 - PLAYER_SIZE/2 + centerZ && vel.z > 0) {
    vel.z = 0;
    obj.position.z = boundZ/2 - PLAYER_SIZE/2 + centerZ;
  }

  if(z <= -boundZ/2 + PLAYER_SIZE/2 + centerZ && vel.z < 0) {
    vel.z = 0;
    obj.position.z = -boundZ/2 + PLAYER_SIZE/2 + centerZ;
  }
}

// Generate random spawn offset for enemies
function randomOffset() {
  var random_sign = Math.sign(Math.random() - 0.5);
  return random_sign * (Math.random() + 1) * 20;
}

// Increment rotation of object towards direction of motion
// Usage of quaternions inspired by:
// https://threejs.org/examples/webgl_math_orientation_transform
function alignRotation(obj, vel) {
  if(vel.x != 0 || vel.z != 0) {
    const targetAngle = -Math.atan2(vel.z, vel.x);
    var targetRotation = new THREE.Quaternion();
    targetRotation.setFromEuler(new THREE.Euler(0, targetAngle, 0));
    obj.quaternion.rotateTowards(targetRotation, 0.1);
  }
}