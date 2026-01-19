import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { Lensflare, LensflareElement } from "three/addons/objects/Lensflare.js";
import { GUI } from "dat.gui";

// Initialize global variables for the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// ThreeJS Bloom Effect
// https://waelyasmina.net/articles/unreal-bloom-selective-threejs-post-processing/
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

// Post-processing: Bloom Effect
// Adds a nice glow to the screen
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.1, // Don't put too much strength or everything is over exposed
  0.4,
  0.1
);
composer.addPass(bloomPass);

// Load the spaceship model
let spaceship;
let thrusters = [];

// Load materials first
const mtlLoader = new MTLLoader();
mtlLoader.load("Fighter.mtl", (materials) => {
  materials.preload();

  // Load the OBJ with materials
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load("Fighter.obj", (object) => {
    spaceship = object;

    // Place ship at origin
    object.position.set(0, 0, 0);
    object.rotateY(Math.PI);
    scene.add(object);

    // Load texture for fire effect
    const loader = new THREE.TextureLoader();
    const fireTexture = loader.load("fire.jpg");

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      map: fireTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      size: 0.75, // Adjust flame size
      color: new THREE.Color(1, 0.2, 0), // Orange-ish fire
    });

    // Function to create a thruster particle system
    function createThruster(position) {
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 100;

      // Random particle positions
      const positions = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 0.3; // Spread in X
        positions[i + 1] = (Math.random() - 0.5) * 0.3; // Spread in Y
        positions[i + 2] = Math.random() * -1.5; // Flames move downward
      }

      particlesGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const thruster = new THREE.Points(particlesGeometry, particleMaterial);
      thruster.position.copy(position); // Set position behind thruster
      spaceship.add(thruster);

      return thruster;
    }

    // Booster positions
    thrusters = [
      createThruster(new THREE.Vector3(-6.2, 1.5, -2.4)), // Left booster
      createThruster(new THREE.Vector3(6.2, 1.5, -2.4)), // Right booster
      createThruster(new THREE.Vector3(-0.5, 1.5, -2.4)), // Center left
      createThruster(new THREE.Vector3(0.5, 1.5, -2.4)), // Center right
    ];
  });
});

// Large Star (Goal)
const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
const sunMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0xffcc66) },
  },
  vertexShader: `  
        varying vec3 vNormal;
        void main() {
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  // Fragment shader's intensity parameter was created using ChatGPT and tweeked to desired levels
  fragmentShader: `  
        varying vec3 vNormal;
        uniform vec3 color;
        void main() {
            float intensity = pow(0.3 + dot(vNormal, vec3(0,0,1.3)), 2.0);
            gl_FragColor = vec4(color * intensity, 1.0);
        }
    `,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

// Create the sun mesh and place far into the scene
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, -50);
scene.add(sun);

// Light from the sun, illuminates the nose of the ship
const sunLight = new THREE.PointLight(0xffdd00, 300, 100, 2); // Intense yellow light
sunLight.position.copy(sun.position);
sunLight.position.add(new THREE.Vector3(-3, 3, 10));
scene.add(sunLight);

// Create lens flare effect
const textureLoader = new THREE.TextureLoader();
const flareTexture = textureLoader.load("lensflare.jpg");

const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(flareTexture, 2000, 0));
sunLight.add(lensflare);

// Add lighting
// If we only illuminate with the sun, the scene is too dark
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(0, 5, 10);
scene.add(directionalLight);

// Create a Starfield
const starCount = 600;
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];

// Startfield is created in a 200x200x200 cube.
// 200 is way off screen which gives the impression of going forever
for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 200; // Spread stars randomly
  const y = (Math.random() - 0.5) * 200;
  const z = Math.random() * -200; // Stars start at different depths
  starPositions.push(x, y, z);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Camera Configuration
camera.position.z = 10;
camera.position.y = 8;
camera.lookAt(scene.position);

// Movement control variables
const speed = 0.1; // Horizontal and Vertical Movement
var starSpeed = 1.5; // Depth Movement
const keys = { w: false, a: false, s: false, d: false, space: false };

// Event listeners for key press & release
document.addEventListener("keydown", (event) => {
  if (event.key in keys) {
    keys[event.key] = true;
  } else if (event.key === " ") {
    keys["space"] = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  } else if (event.key === " ") {
    keys["space"] = false;
  }
});

// Add dat.GUI
const gui = new GUI();

// GUI Controls
const guiControls = {
  bloomEnabled: true,
  bloomStrength: bloomPass.strength,
  bloomRadius: bloomPass.radius,
  bloomThreshold: bloomPass.threshold,
  movementSpeed: starSpeed,
  cameraX: camera.position.x,
  cameraY: camera.position.y,
  cameraZ: camera.position.z,
};

// GUI folders
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(guiControls, "cameraX", -20, 20).onChange((value) => {
  camera.position.x = value;
});
cameraFolder.add(guiControls, "cameraY", -20, 20).onChange((value) => {
  camera.position.y = value;
});
cameraFolder.add(guiControls, "cameraZ", 0, 20).onChange((value) => {
  camera.position.z = value;
});
cameraFolder.open();

const movementFolder = gui.addFolder("Movement");
movementFolder
  .add(guiControls, "movementSpeed", 0.1, 5)
  .onChange((value) => {
    starSpeed = value;
  })
  .name("Speed");
movementFolder.open();

const postProcessingFolder = gui.addFolder("Post Processing");
postProcessingFolder.add(guiControls, "bloomEnabled").onChange((value) => {
  bloomPass.enabled = value;
});
postProcessingFolder
  .add(guiControls, "bloomStrength", 0, 10)
  .onChange((value) => {
    bloomPass.strength = value;
  });
postProcessingFolder.add(guiControls, "bloomRadius", 0, 5).onChange((value) => {
  bloomPass.radius = value;
});
postProcessingFolder
  .add(guiControls, "bloomThreshold", 0, 5)
  .onChange((value) => {
    bloomPass.threshold = value;
  });
postProcessingFolder.open();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (spaceship) {
    // Move in X/Y plane based on WASD keys
    if (keys.w) spaceship.position.y += speed; // Up
    if (keys.s) spaceship.position.y -= speed; // Down
    if (keys.a) spaceship.position.x -= speed; // Left
    if (keys.d) spaceship.position.x += speed; // Right

    // Constraints to keep ship on screen
    if (spaceship.position.x > 8) {
      spaceship.position.x = 8;
    } else if (spaceship.position.x < -8) {
      spaceship.position.x = -8;
    }

    if (spaceship.position.y > 4) {
      spaceship.position.y = 4;
    } else if (spaceship.position.y < -6) {
      spaceship.position.y = -6;
    }

    spaceship.lookAt(sun.position);
  }

  // Move stars toward the camera
  const positions = starGeometry.attributes.position.array;
  for (let i = 2; i < positions.length; i += 3) {
    let particleSpeed = keys.space ? starSpeed * 2 : starSpeed;
    positions[i] += particleSpeed; // Move stars in Z direction toward camera

    // Reset stars when they pass the camera
    if (positions[i] > 5) {
      positions[i] = -200; // Reset to far away
      positions[i - 1] = (Math.random() - 0.5) * 200;
      positions[i - 2] = (Math.random() - 0.5) * 200;
    }
  }
  starGeometry.attributes.position.needsUpdate = true;

  // Animate thrusters
  thrusters.forEach((thruster) => {
    const positions = thruster.geometry.attributes.position.array;
    let particleSpeed = keys.space ? 0.3 : 0.1;
    let particleSpread = keys.space ? -3 : -1.5;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += particleSpeed; // Move particles downwards
      if (positions[i + 2] > 0)
        positions[i + 2] = Math.random() * particleSpread; // Reset when out of range
    }
    thruster.geometry.attributes.position.needsUpdate = true;
  });

  camera.lookAt(scene.position);
  composer.render(scene, camera);
}

// Call resize to setup window properties
onResize();

// Start animation loop
animate();

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // If we use a canvas then we also have to worry of resizing it
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(window.devicePixelRatio);
}

window.addEventListener("resize", onResize, true);
