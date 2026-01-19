// code generated with chatgpt at the start


import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Adding the following import solves the issue where the model loads in 'npm run dev', but doesn't work when 'npm run deploy or build'.
// Issue shown in inspect-console: "Error occured while loading model: 404"
// https://stackoverflow.com/a/69616533
import modelScene from './models/Glass_DispersionTest.gltf?url';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 5;
camera.position.set(0, 1, 5); // Adjust as needed
// camera.up = new THREE.Vector3( 0, 0, -1 );
// camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

const renderer = new THREE.WebGLRenderer( {antialias: true} ); // antialias: true option enables smoother edges by multisampling.
// renderer.setPixelRatio( window.devicePixelRatio ); // set pixel ratio to display pixel ratio for HiDPI monitors
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
renderer.setSize(window.innerWidth, window.innerHeight); // set the renderer to fill the entire viewport by matching to browser dimension.
renderer.shadowMap.enabled = false; // Disable shadows globally


document.body.appendChild(renderer.domElement); // adds the renderer's canvas (renderer.domElement) to the DOM inside the container element for rendering the scene.

// const environment = new RoomEnvironment();
// const pmremGenerator = new THREE.PMREMGenerator( renderer );
// 
// scene.backgroundBlurriness = 0.5;
// 
// const env = pmremGenerator.fromScene( environment ).texture;
// scene.background = env;
// scene.environment = env;
// environment.dispose();

// Load GLTF model
const loader = new GLTFLoader();
loader.load(
    modelScene, // Path to your exported file
    (gltf) => {
        const model = gltf.scene; // Get the 3D model
        model.position.set(0, 0, 0); // Set position
        model.rotation.y = -Math.PI / 2;
        // model.scale.set(1, 1, 1); // Adjust scale if necessary
        scene.add(model); // Add the model to the scene
        console.log('Model loaded successfully');
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded'); // Loading progress
    },
    (error) => {
        console.error('An error occurred while loading the model:', error);
    }
);

// 3. Add the cube to the scene
// scene.add( cube );

const controls = new OrbitControls( camera, renderer.domElement );
controls.addEventListener( 'change', renderer.render(scene, camera) ); // use if there is no animation loop // This line requires the function render
controls.minDistance = 0.1;
controls.maxDistance = 10;
controls.target.set( 0, 0, 0 );
controls.update();


// 1. Create a light source
const pointLight = new THREE.PointLight(0xFFFFFF, 12, 100);
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

// const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 3); // Sky color, ground color, intensity
// scene.add(hemisphereLight);

// Directional lighting
const directionalLight = new THREE.DirectionalLight( 0xffffff, 9 ); // White light with intensity 1
directionalLight.position.set(6, 0, 0); // Position the light in the scene
scene.add(directionalLight);

const directionalLightTwo = new THREE.DirectionalLight( 0xffffff, 9 ); // White light with intensity 1
directionalLightTwo.position.set(-6, 0, 0); // Position the light in the scene
scene.add(directionalLightTwo);

// Create a helper for the directional light
const directionalLights = [directionalLight, directionalLightTwo];
const helpers = directionalLights.map(directionalLights => new THREE.DirectionalLightHelper(directionalLights, 5));
const pointHelper = new THREE.PointLightHelper( pointLight, 5 );
scene.add(...helpers, pointHelper); // this line basically does this: helpers.forEach(helper => scene.add(helper));

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Brightness can be adjusted
// scene.add(ambientLight);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.render( scene, camera );
});

animate();

console.log(scene);



function animate() {
  requestAnimationFrame(animate);
  renderer.render( scene, camera );
}


