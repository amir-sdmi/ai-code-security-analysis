// i added the controls using chatgpt, will study this in the future with other models
import * as THREE from "three";
import { GLTFLoader }   from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ‑‑‑ basic scene setup ‑‑‑
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // anti alias for smooth pixels
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ‑‑‑ mouse controls ‑‑‑
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;           // smooth, inertial motion
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);            // where the camera orbits around

// ‑‑‑ load and centre the model ‑‑‑
const loader = new GLTFLoader();
loader.load(
  "matilda/matilda.glb",
  (gltf) => {
    const model = gltf.scene;
    
    // 1️⃣  Centre the model on the world origin
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);          // shift the model so its centre is (0,0,0)
    
    // 2️⃣  Move the camera back just far enough to fit the whole model
    const size  = box.getSize(new THREE.Vector3()).length();          // diagonal length
    const fov   = camera.fov * (Math.PI / 180);                       // in radians
    const dist  = size / (2 * Math.tan(fov / 2));                     // fit formula
    camera.position.set(0, 0, dist * 1.3);                            // 30 % padding
    controls.update();                                                // tell controls

    scene.add(model);
  },
  undefined,
  (err) => console.error(err)
);

// ‑‑‑ keep things responsive ‑‑‑
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ‑‑‑ render loop ‑‑‑
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();               // only needed when damping is on
  renderer.render(scene, camera);
};
animate();
