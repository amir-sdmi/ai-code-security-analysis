import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton";
import { Howl, Howler } from 'howler';
import ThreeMeshUI from "three-mesh-ui";
import FontJSON from 'three-mesh-ui/examples/assets/Roboto-msdf.json';
import FontImage from 'three-mesh-ui/examples/assets/Roboto-msdf.png';

var scene, camera, renderer, ambientLight, directionalLight, camobj, clock;
var physicsWorld, groundMaterial, vehicle, wheelMaterial, angle;
var busModel, cityMap, construction1, construction2;
var hud, startScreen, song;
var muted = false;
var isFirstPerson = true;
var currentTrack = 0;
//ChatGPT 4 is used for several parts of this project for inspirational and educational purposes
//before entering the prompts, I made sure I show chatGPT my whole code first, with some description 
//so it has information about what I am up to
//Initial prompt:
//act as a senior software engineer 25 years experience. 
//im building vr bus simulator. 
//i will ask you question about cannon js, threejs and more related the webbased vr. 
//you will answer concisely, with code, easy to understand
//[insert full code]


//This code section is inspired by chatGPT 4 
//By inspired, we mean the inspiration, and the suggestion of idea was provided by chatGPT, and we tuned it to our liking after
//All the prompts are executed one by one, in ascending order
//Prompt 1: now i want to add background music for my game. what should I do, show code
//Prompt 2: What if I want to have a playlist of songs that play in the background
const playlist = [
  //These 3 songs below are non copy righted music
  /*Music from #InAudio: https://inaudio.org/ 
  Track Name:
Upbeat Funk Podcast by Infraction [No Copyright Music] / Funk Town
Upbeat Funk Fashion by Infraction [No Copyright Music] / Holiday Party
Upbeat Funk Background by Infraction [No Copyright Music] / Step Club */
  // 'song1.mp3',  
  // 'song2.mp3',
  // 'song3.mp3',
  //Copy-righted music, we are not going to use these songs
  'woke-up-this-morning.mp3',
  'dont-stop-believing.mp3',
  'i-have-but-one-heart.mp3',
  'push-it-to-the-limit.mp3',
  'connie-wedding.mp3',
  'little-girl-of-mine',
  'dust-my-broom',
];

function init() {
    // Set up the window;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    clock = new THREE.Clock();
    document.body.appendChild(renderer.domElement);
    camobj = new THREE.Object3D();
    scene.add(camobj);

    // Camera position
    camobj.add(camera);
    camobj.position.set(-0.8, 0.8, -4.8);

    // Enable VR
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    // Lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
    
    // Physics
    physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    mapCollision(); 
    busCollision();

    // 3D Model
    modelLoader();

    // UI
    uiElements();

    // BGM
    playSong(currentTrack);
}
init();

function modelLoader() {
    // Bus
    const busLoader = new GLTFLoader();
    busLoader.load(
        "/generic_town_bus_rotated.glb",
        function (gltf) {
            busModel = gltf.scene;
            scene.add(busModel);
            if (busModel) {
            busModel.position.set(0, 0, 0);
            busModel.scale.set(0.1, 0.1, 0.1);
            }
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // Map
    const mapLoader2 = new GLTFLoader();
    mapLoader2.load("gta-san-map.glb", function (gltf) {
        cityMap = gltf.scene;
        scene.add(cityMap);
        if (cityMap) {
            cityMap.scale.set(1000, 1000, 1000);
            cityMap.position.set(-90, -15, 115);
        }
    });

    //construction signs
    const constructionLoader1 = new GLTFLoader();
    constructionLoader1.load("construction-sign-face-south.glb", function (gltf) {
        construction1 = gltf.scene;
        scene.add(construction1);
        if (construction1) {
            construction1.scale.set(20, 20, 20);
            construction1.position.set(175, 0, -608);
        }
    });
    const constructionLoader2 = new GLTFLoader();
    constructionLoader2.load("construction-sign-face-west.glb", function (gltf) {
        construction2 = gltf.scene;
        scene.add(construction2);
        if (construction2) {
            construction2.scale.set(20, 20, 20);
            construction2.position.set(-40, 0, -129);
        }
    });
}

function mapCollision() {
    // Add a ground body
    groundMaterial = new CANNON.Material("ground");
    const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: groundMaterial,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, 0, 0);
    physicsWorld.addBody(groundBody);
    const hb1LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(15, 10, 39)),
    });
    hb1LowLeft.position.set(20, 0, -38);
    //hb1LowLeft.quaternion.setFromEuler(0, Math.PI / 4, 0);
    physicsWorld.addBody(hb1LowLeft);
    const hb2LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(45, 10, 23)),
    });
    hb2LowLeft.position.set(-9, 0, -94);
    physicsWorld.addBody(hb2LowLeft);
    const hb3LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(10, 10, 19.5)),
    });
    hb3LowLeft.position.set(44, 0, 19);
    physicsWorld.addBody(hb3LowLeft);
    const hb4LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(48, 10, 7)),
    });
    hb4LowLeft.position.set(74, 0, -10);
    physicsWorld.addBody(hb4LowLeft);
    const hb5LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(26, 10, 10)),
    });
    hb5LowLeft.position.set(-30, 0, -50);
    physicsWorld.addBody(hb5LowLeft);
    const hb6LowLeft = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(15.5, 10, 28)),
    });
    hb6LowLeft.position.set(-18.8, 0, -23.5);
    physicsWorld.addBody(hb6LowLeft);
    const hb7LowLeftCorner = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(60, 10, 53)),
    });
    hb7LowLeftCorner.position.set(-38, 0, 61);
    physicsWorld.addBody(hb7LowLeftCorner);
    const hb8LeftMostSide = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(15, 10, 1357)),
    });
    hb8LeftMostSide.position.set(-89, 0, -1218);
    physicsWorld.addBody(hb8LeftMostSide);
    const hb9 = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(22, 10, 12)),
    });
    hb9.position.set(-49, 0, -187.5);
    physicsWorld.addBody(hb9);
    const hb10LeftMostSide = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(4, 10, 1227)),
    });
    hb10LeftMostSide.position.set(-68, 0, -1418);
    physicsWorld.addBody(hb10LeftMostSide);
    const hb11LowLeftTwoWayStreet = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(28, 10, 8)),
    });
    hb11LowLeftTwoWayStreet.position.set(-25.5, 0, -150);
    physicsWorld.addBody(hb11LowLeftTwoWayStreet);
    const hb12LowLeftTwoWayStreet = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(19, 10, 30)),
    });
    hb12LowLeftTwoWayStreet.position.set(15, 0, -169);
    physicsWorld.addBody(hb12LowLeftTwoWayStreet);
    const hb13LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(40, 10, 40)),
    });
    hb13LowLeftTwoWayStreetBuildingBlock.position.set(-3.5, 0, -258.5);
    physicsWorld.addBody(hb13LowLeftTwoWayStreetBuildingBlock);
    const hb14LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(41, 10, 100)),
    });
    hb14LowLeftTwoWayStreetBuildingBlock.position.set(-4, 0, -421);
    physicsWorld.addBody(hb14LowLeftTwoWayStreetBuildingBlock);
    const hb15LowLeftLaneDivVerti = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(5.5, 5, 235)),
    });
    hb15LowLeftLaneDivVerti.position.set(72, 0, -287);
    physicsWorld.addBody(hb15LowLeftLaneDivVerti);
    const hb16LowLeftLaneDivHori = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(624, 5, 4)),
    });
    hb16LowLeftLaneDivHori.position.set(691.5, 0, -54);
    physicsWorld.addBody(hb16LowLeftLaneDivHori);
    const hb17LowLeftLaneDivVerti = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(6, 5, 130)),
    });
    hb17LowLeftLaneDivVerti.position.set(69.5, 0, -670.5);
    physicsWorld.addBody(hb17LowLeftLaneDivVerti);
    const hb18LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(36, 10, 226)),
    });
    hb18LowLeftTwoWayStreetBuildingBlock.position.set(1.5, 0, -769);
    physicsWorld.addBody(hb18LowLeftTwoWayStreetBuildingBlock);
    const hb19LowLeftLaneDivVerti = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(6, 5, 127)),
    });
    hb19LowLeftLaneDivVerti.position.set(71, 0, -966);
    physicsWorld.addBody(hb19LowLeftLaneDivVerti);
    const hb20MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(42, 10, 195)),
    });
    hb20MidLeftTwoWayStreetBuildingBlock.position.set(-3.5, 0, -1213);
    physicsWorld.addBody(hb20MidLeftTwoWayStreetBuildingBlock);
    const hb21MidLeftLaneDivVerti = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(6, 5, 161)),
    });
    hb21MidLeftLaneDivVerti.position.set(70, 0, -1273);
    physicsWorld.addBody(hb21MidLeftLaneDivVerti);
    const hb22LowLeftPlantBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(139, 5, 14)),
    });
    hb22LowLeftPlantBlock.position.set(246.5, 0, -105);
    physicsWorld.addBody(hb22LowLeftPlantBlock);
    const hb23LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(125, 10, 58)),
    });
    hb23LowLeftTwoWayStreetBuildingBlock.position.set(235, 0, -198);
    physicsWorld.addBody(hb23LowLeftTwoWayStreetBuildingBlock);
    // Plane collision, bad thing so far
    const planeShape = new CANNON.Plane();
    const planeBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(42.5, 0.1, 6)),
    friction: 0.1,
    });
    planeBody.position.set(-20.5, -3, -113);
    planeBody.quaternion.setFromEuler(0, 0, Math.PI / 30);
    // planeBody.addShape(planeShape);
    physicsWorld.addBody(planeBody);
    const rampPlane = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Plane(new CANNON.Vec3(42.5, 0.1, 8)),
    });
    rampPlane.position.set(-7.5, 3, -113);
    rampPlane.quaternion.setFromEuler(0, 0, Math.PI / 2);
    physicsWorld.addBody(rampPlane);

    const hb24LowLeftRamp1 = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(46.5, 0.1, 8)),
    });
    hb24LowLeftRamp1.position.set(-11, 0, -113);
    hb24LowLeftRamp1.quaternion.setFromEuler(0, 0, Math.PI / 30);
    physicsWorld.addBody(hb24LowLeftRamp1);
    const hb25LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(31, 10, 123)),
    });
    hb25LowLeftTwoWayStreetBuildingBlock.position.set(134.5, 0, -378);
    physicsWorld.addBody(hb25LowLeftTwoWayStreetBuildingBlock);
    const hb26LowLeftTwoWayStreetPavement = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(31, 10, 5.5)),
    });
    hb26LowLeftTwoWayStreetPavement.position.set(132, 0, -520);
    physicsWorld.addBody(hb26LowLeftTwoWayStreetPavement);

    const hb27LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(32, 10, 63)),
    });
    hb27LowLeftTwoWayStreetBuildingBlock.position.set(134.5, 0, -605);
    physicsWorld.addBody(hb27LowLeftTwoWayStreetBuildingBlock);
    const hb28LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(27, 10, 65)),
    });
    hb28LowLeftTwoWayStreetBuildingBlock.position.set(134.5, 0, -738);
    physicsWorld.addBody(hb28LowLeftTwoWayStreetBuildingBlock);

    const hb29LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(75, 10, 79)),
    });
    hb29LowLeftTwoWayStreetBuildingBlock.position.set(181, 0, -916);
    physicsWorld.addBody(hb29LowLeftTwoWayStreetBuildingBlock);

    const hb30LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(71, 10, 34)),
    });
    hb30LowLeftTwoWayStreetBuildingBlock.position.set(347, 0, -878);
    physicsWorld.addBody(hb30LowLeftTwoWayStreetBuildingBlock);

    const hb31LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(72.5, 10, 37)),
    });
    hb31LowLeftTwoWayStreetBuildingBlock.position.set(345, 0, -966);
    physicsWorld.addBody(hb31LowLeftTwoWayStreetBuildingBlock);

    const hb32LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(33, 10, 33)),
    });
    hb32LowLeftTwoWayStreetBuildingBlock.position.set(385, 0, -1054);
    physicsWorld.addBody(hb32LowLeftTwoWayStreetBuildingBlock);
    const hb33LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(33, 10, 33)),
    });
    hb33LowLeftTwoWayStreetBuildingBlock.position.set(305, 0, -1054);
    physicsWorld.addBody(hb33LowLeftTwoWayStreetBuildingBlock);

    const hb34LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(75, 10, 38)),
    });
    hb34LowLeftTwoWayStreetBuildingBlock.position.set(182, 0, -1054);
    physicsWorld.addBody(hb34LowLeftTwoWayStreetBuildingBlock);

    const hb35LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(120, 10, 28)),
    });
    hb35LowLeftTwoWayStreetBuildingBlock.position.set(225, 0, -1156);
    physicsWorld.addBody(hb35LowLeftTwoWayStreetBuildingBlock);

    const hb36LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(53, 10, 29)),
    });
    hb36LowLeftTwoWayStreetBuildingBlock.position.set(415, 0, -1160);
    physicsWorld.addBody(hb36LowLeftTwoWayStreetBuildingBlock);

    const hb37MidLeftTwoWayStreetBuildingBlockExtension = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(11, 10, 26)),
    });
    hb37MidLeftTwoWayStreetBuildingBlockExtension.position.set(372, 0, -1226);
    physicsWorld.addBody(hb37MidLeftTwoWayStreetBuildingBlockExtension);

    const hb38LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(30, 10, 30)),
    });
    hb38LowLeftTwoWayStreetBuildingBlock.position.set(514, 0, -1159);
    physicsWorld.addBody(hb38LowLeftTwoWayStreetBuildingBlock);

    const hb39MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(29, 10, 53)),
    });
    hb39MidLeftTwoWayStreetBuildingBlock.position.set(516, 0, -1266);
    physicsWorld.addBody(hb39MidLeftTwoWayStreetBuildingBlock);

    const hb40MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(29, 10, 57)),
    });
    hb40MidLeftTwoWayStreetBuildingBlock.position.set(435, 0, -1264);
    physicsWorld.addBody(hb40MidLeftTwoWayStreetBuildingBlock);

    const hb41MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(46, 10, 24)),
    });
    hb41MidLeftTwoWayStreetBuildingBlock.position.set(338, 0, -1298);
    physicsWorld.addBody(hb41MidLeftTwoWayStreetBuildingBlock);

    const hb42LowLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(117, 10, 28)),
    });
    hb42LowLeftTwoWayStreetBuildingBlock.position.set(704, 0, -1159);
    physicsWorld.addBody(hb42LowLeftTwoWayStreetBuildingBlock);

    const hb43MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(16, 10, 58)),
    });
    hb43MidLeftTwoWayStreetBuildingBlock.position.set(598, 0, -1266);
    physicsWorld.addBody(hb43MidLeftTwoWayStreetBuildingBlock);

    const hb44MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(17, 10, 32)),
    });
    hb44MidLeftTwoWayStreetBuildingBlock.position.set(653, 0, -1245);
    physicsWorld.addBody(hb44MidLeftTwoWayStreetBuildingBlock);

    const hb45MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(28, 10, 30)),
    });
    hb45MidLeftTwoWayStreetBuildingBlock.position.set(704, 0, -1241);
    physicsWorld.addBody(hb45MidLeftTwoWayStreetBuildingBlock);

    const hb46MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(17, 10, 34)),
    });
    hb46MidLeftTwoWayStreetBuildingBlock.position.set(760, 0, -1240);
    physicsWorld.addBody(hb46MidLeftTwoWayStreetBuildingBlock);

    const hb47MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(12, 10, 56)),
    });
    hb47MidLeftTwoWayStreetBuildingBlock.position.set(812, 0, -1261);
    physicsWorld.addBody(hb47MidLeftTwoWayStreetBuildingBlock);

    const hb48MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(60.5, 10, 31.5)),
    });
    hb48MidLeftTwoWayStreetBuildingBlock.position.set(905, 0, -1292.5);
    physicsWorld.addBody(hb48MidLeftTwoWayStreetBuildingBlock);

    const hb49MidMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(58, 10, 48)),
    });
    hb49MidMidTwoWayStreetBuildingBlock.position.set(907, 0, -1189);
    physicsWorld.addBody(hb49MidMidTwoWayStreetBuildingBlock);

    const hb50MidLeftTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(70, 10, 23.5)),
    });
    hb50MidLeftTwoWayStreetBuildingBlock.position.set(711, 0, -1297.5);
    physicsWorld.addBody(hb50MidLeftTwoWayStreetBuildingBlock);


    const hb51LeftMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(219.5, 10, 28)),
    });
    hb51LeftMidTwoWayStreetBuildingBlock.position.set(323.5, 0, -1373);
    physicsWorld.addBody(hb51LeftMidTwoWayStreetBuildingBlock);

    const hb52LeftMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(190, 10, 31)),
    });
    hb52LeftMidTwoWayStreetBuildingBlock.position.set(773, 0, -1371);
    physicsWorld.addBody(hb52LeftMidTwoWayStreetBuildingBlock);

    const hb53MidMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(42, 10, 95)),
    });
    hb53MidMidTwoWayStreetBuildingBlock.position.set(1050, 0, -1224);
    physicsWorld.addBody(hb53MidMidTwoWayStreetBuildingBlock);

    const hb54MidMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(164, 10, 25)),
    });
    hb54MidMidTwoWayStreetBuildingBlock.position.set(1171, 0, -1369);
    physicsWorld.addBody(hb54MidMidTwoWayStreetBuildingBlock);

    const hb55MidMidTwoWayStreetBuildingBlock = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(111, 10, 35)),
    });

    const hb56MidMidTwoWayStreetRampDown = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(15.5, 0.1, 39)),
    });
    hb56MidMidTwoWayStreetRampDown.position.set(1355.5, -8, -1520);
    hb56MidMidTwoWayStreetRampDown.quaternion.setFromEuler(-Math.PI/25, 0, 0);

    physicsWorld.addBody(hb56MidMidTwoWayStreetRampDown);

    const hbR1MidMidTwoWayStreetRampUp = new CANNON.Body({
    mass: 0,

    friction:100,
    shape: new CANNON.Box(new CANNON.Vec3(29, 0.1, 39)),
    });
    hbR1MidMidTwoWayStreetRampUp.position.set(565, 0, -1520);
    hbR1MidMidTwoWayStreetRampUp.quaternion.setFromEuler(Math.PI/25, 0, 0);

    physicsWorld.addBody(hbR1MidMidTwoWayStreetRampUp);

    const hbR2MidMidTwoWayStreetRampFlat = new CANNON.Body({
    mass: 0,

    friction:100,
    shape: new CANNON.Box(new CANNON.Vec3(29, 0.01, 29.5)),
    });
    hbR2MidMidTwoWayStreetRampFlat.position.set(565, 5, -1588.5);

    physicsWorld.addBody(hbR2MidMidTwoWayStreetRampFlat);

    const hbR3MidMidTwoWayStreetRampDown = new CANNON.Body({
    mass: 0,
    friction:0,
    shape: new CANNON.Box(new CANNON.Vec3(35, 0.01, 41)),
    });
    hbR3MidMidTwoWayStreetRampDown.position.set(565, 1, -1658);
    hbR3MidMidTwoWayStreetRampDown.quaternion.setFromEuler(-Math.PI/30, 0, 0);

    physicsWorld.addBody(hbR3MidMidTwoWayStreetRampDown);

    const hbR3MidMidTwoWayStreetRampUp = new CANNON.Body({
    mass: 0,

    friction:10,
    shape: new CANNON.Plane(new CANNON.Vec3(69, 0.01, 39)),
    });
    hbR3MidMidTwoWayStreetRampUp.position.set(565, -1, -1659);
    hbR3MidMidTwoWayStreetRampUp.quaternion.setFromEuler(-Math.PI/25, 0, 0);

    physicsWorld.addBody(hbR3MidMidTwoWayStreetRampUp);

    const hbL1LowLeftLake = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(105.5, 10, 170)),
    });
    hbL1LowLeftLake.position.set(290.5, 0, -449);
    physicsWorld.addBody(hbL1LowLeftLake);

    const hbC1LowLeftConstructionSign = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(9, 10, 2)),
    });
    hbC1LowLeftConstructionSign.position.set(174, 0, -602);
    physicsWorld.addBody(hbC1LowLeftConstructionSign);

    const hbC2LowLeftConstructionSign = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(5, 10, 7)),
    });
    hbC2LowLeftConstructionSign.position.set(-43, 0, -129);
    physicsWorld.addBody(hbC2LowLeftConstructionSign);

}
 
function busCollision() {
    // Build the car chassis
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.3, 1.5, 6));
    const chassisBody = new CANNON.Body({ mass: 30 });
    chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 1.75, 0));

    // Create the vehicle
    vehicle = new CANNON.RigidVehicle({
    chassisBody: chassisBody,
    });

    // Add wheels to the vehicle
    const mass = 1.45;
    const wheelShape = new CANNON.Sphere(0.5);
    wheelMaterial = new CANNON.Material("wheel");
    const down = new CANNON.Vec3(0, -1, 0);
    const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody1.addShape(wheelShape);
    vehicle.addWheel({
    isFrontWheel: true,
    body: wheelBody1,
    position: new CANNON.Vec3(-1.3, 0.5, -3.5),
    axis: new CANNON.Vec3(-1, 0, 0),
    direction: down,
    });
    const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody2.addShape(wheelShape);
    vehicle.addWheel({
    isFrontWheel: true,
    body: wheelBody2,
    position: new CANNON.Vec3(1.3, 0.5, -3.5),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
    });
    const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody3.addShape(wheelShape);
    vehicle.addWheel({
    body: wheelBody3,
    position: new CANNON.Vec3(-1.3, 0.5, 2.5),
    axis: new CANNON.Vec3(-1, 0, 0),
    direction: down,
    });
    const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody4.addShape(wheelShape);
    vehicle.addWheel({
    body: wheelBody4,
    position: new CANNON.Vec3(1.3, 0.5, 2.5),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
    });
    vehicle.wheelBodies.forEach((wheelBody) => {
    // Some damping to not spin wheels too fast
    wheelBody.angularDamping = 0.9;
    });

    vehicle.addToWorld(physicsWorld);
    // Track rotation of the vehicle
    angle = new CANNON.Vec3();
    vehicle.chassisBody.quaternion.toEuler(angle);
}

function uiElements() {
    // HUD
    hud = new ThreeMeshUI.Block( {
		width: 0.8,
		height: 0.3,
		justifyContent: 'center',
		fontFamily: FontJSON,
		fontTexture: FontImage,
        fontSize: 0.05,
	} );
    hud.frame.layers.set(10);
	hud.position.set( 0, 18, 15 );
	hud.rotation.x = -Math.PI/2;
	scene.add( hud );

	const text = new ThreeMeshUI.Text( {
		content: 'Elapsed Time\xa0\xa0'
	} );
	const minute = new ThreeMeshUI.Text( {
		content: "0"
	} );
    const text2 = new ThreeMeshUI.Text( {
		content: ':'
	} );
    const second = new ThreeMeshUI.Text( {
		content: "0"
	} );
    const text3 = new ThreeMeshUI.Text( {
		content: '\nPress B to Switch to 3rd Person View\nPress A to Mute Sound\nPress X to reset the bus if you flipped it',
        fontSize: 0.02,
	} );
	hud.add( text, minute, text2, second, text3 );

	// triggers updates to the component to test onAfterUpdate
	setInterval( () => {
		minute.set( { content: String(Math.trunc(clock.getElapsedTime()/60)).padStart(2,'0') } );
        second.set( { content: String(Math.trunc(clock.getElapsedTime()%60)).padStart(2,'0') } );
	}, 500 );
}

function uiUpdate() {
    hud.position.x = camobj.position.x - 0.6 * Math.sin(angle.y) + 0.7 * Math.cos(angle.y);
    hud.position.y = 2.6;
    hud.position.z = camobj.position.z - 0.6 * Math.cos(angle.y) - 0.7 * Math.sin(angle.y);
    hud.rotation.x = 0;
    hud.rotation.y = angle.y;
}


//Update time in non vr mode
//This code section is created by chatGPT 4
//Prompt:
// write simple non vr hud for this. It looks like
// Press C to reset the bus if you flipped it
// Press F to mute/unmute the sound
// Time elapse: [minutes][seconds]

function updateHUDTimer() {
  const elapsed = Math.floor(clock.getElapsedTime());
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  
  document.getElementById('minutes').textContent = minutes;
  document.getElementById('seconds').textContent = seconds;
}

function cameraUpdate() {
    if (renderer.xr.isPresenting) {
        if (isFirstPerson) {
            camobj.position.x = vehicle.chassisBody.position.x - 4.8 * Math.sin(angle.y) - 0.8 * Math.cos(angle.y);
            camobj.position.y = 0.5;
            camobj.position.z = vehicle.chassisBody.position.z - 4.8 * Math.cos(angle.y) + 0.8 * Math.sin(angle.y);
            camobj.rotation.y = angle.y;
        }
        else {
            camobj.position.x = vehicle.chassisBody.position.x + 20 * Math.sin(angle.y);
            camobj.position.y = 20;
            camobj.position.z = vehicle.chassisBody.position.z + 20 * Math.cos(angle.y);
            camobj.rotation.y = angle.y;
            camera.lookAt(vehicle.chassisBody.position.x, 0, vehicle.chassisBody.position.z);
        }
    }
    else {
        camobj.position.x = vehicle.chassisBody.position.x + 20 * Math.sin(angle.y);
        camobj.position.y = 20;
        camobj.position.z = vehicle.chassisBody.position.z + 20 * Math.cos(angle.y);
        camobj.rotation.y = angle.y;
        camera.lookAt(vehicle.chassisBody.position.x, 0, vehicle.chassisBody.position.z);
    }

}

//This code section is inspired by chatGPT 4
//All the prompts are executed one by one, in ascending order
//Prompt 1: now i want to add background music for my game. what should I do, show code
//Prompt 2: What if I want to have a playlist of songs that play in the background

function playSong(index) {
    song = new Howl({
        src: [playlist[index]],
        onend: function() {
            // Play the next song when the current one ends
            currentTrack = (currentTrack + 1) % playlist.length;
            playSong(currentTrack);
        }
    });
    song.play();
}

// Define interactions between wheels and ground
const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 1,
  restitution: 0,
  contactEquationStiffness: 1000,
});
physicsWorld.addContactMaterial(wheel_ground);
const maxForce = 90;
const maxSteerVal = Math.PI / 8;

let currentInclineAngle = 0;
physicsWorld.addEventListener("beginContact", (event) => {
  // Check if event.contact exists and has the property 'ni'
  if (event.contact && event.contact.ni) {
    const bodyA = event.bodyA;
    const bodyB = event.bodyB;

    // Check if one of the bodies is the vehicle chassis
    let chassisBody = null;
    if (bodyA === vehicle.chassisBody || bodyB === vehicle.chassisBody) {
      chassisBody = vehicle.chassisBody;
    }

    // If the chassis is involved in the collision, calculate the incline angle
    if (chassisBody) {
      // The collision normal vector is event.contact.ni
      // Negate it if it's not pointing away from the chassis body
      const contactNormal =
        chassisBody === bodyA
          ? event.contact.ni.clone()
          : event.contact.ni.clone().negate();
      const upVector = new CANNON.Vec3(0, 1, 0);
      currentInclineAngle = Math.acos(contactNormal.dot(upVector));
    }
  }
});

// Add force on keydown
document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
    case "W":
    //code for climbing incline plane, didn't work
      // const inclineFactor = Math.sin(currentInclineAngle);
      // const adjustedForce = maxForce + inclineFactor * 10;
      const inclineForceModifier = Math.sin(currentInclineAngle);

      // Apply a dynamic force based on the incline angle
      vehicle.setWheelForce(maxForce, 2);
      vehicle.setWheelForce(-maxForce, 3);
      break;

    case "s":
    case "S":
      vehicle.setWheelForce(-maxForce / 2, 2);
      vehicle.setWheelForce(maxForce / 2, 3);
      break;

    case "a":
    case "A":
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 1);
      break;

    case "d":
    case "D":
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 1);
      break;

    case "c":
    case "C":
      //reset the vehicle if flipped
      vehicle.chassisBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        0
      );
      vehicle.chassisBody.velocity.set(0, 0, 0);
      vehicle.chassisBody.angularVelocity.set(0, 0, 0);

      break;
    // Use For Debugging only
    // case "e":
    // case "E":
    //   //teleport the vehicle to a position, used for debugging only
    //   vehicle.chassisBody.position.set(550,0,-1300);
    //   vehicle.chassisBody.velocity.set(0, 0, 0);
    //   vehicle.chassisBody.angularVelocity.set(0, 0, 0);
    //   break;
    case "v":
    case "V": 
      if (isFirstPerson) 
          isFirstPerson = false;
      else
          isFirstPerson = true;
      firstPressedTime = currentTime;
      break;

    case "f":
    case "F":
      if(!muted)
          muted=true;
        else
          muted=false;
        Howler.mute(muted);
        break;
  }
});
// Reset force on keyup
document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
    case "W":
      vehicle.setWheelForce(0, 2);
      vehicle.setWheelForce(0, 3);
      break;

    case "s":
    case "S":
      vehicle.setWheelForce(0, 2);
      vehicle.setWheelForce(0, 3);
      break;

    case "a":
    case "A":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "d":
    case "D":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;
  }
});

// Controller Input
// Left Controller
let leftControllerIndex = null;
const leftController = renderer.xr.getController(1);
scene.add(leftController);
leftController.addEventListener("connected", (event) => {
  leftControllerIndex = event.data.gamepad;
  console.log("connected");
});
// Right Controller
let rightControllerIndex = null;
const rightController = renderer.xr.getController(0);
scene.add(rightController);
rightController.addEventListener("connected", (event) => {
    rightControllerIndex = event.data.gamepad;
    console.log("connected");
});
let firstPressedTime = 0;
function controllerInput() {
    const currentTime = Date.now();
    if (leftControllerIndex !== null) {
        // Left Joystick: Accelerate/Decelerate
        if (leftControllerIndex.axes[3] < 0) {
            vehicle.setWheelForce(maxForce, 2);
            vehicle.setWheelForce(-maxForce, 3);
        } else if (leftControllerIndex.axes[3] > 0) {
            vehicle.setWheelForce(-maxForce / 2, 2);
            vehicle.setWheelForce(maxForce / 2, 3);
        } else {
            vehicle.setWheelForce(0, 2);
            vehicle.setWheelForce(0, 3);
        }
        if (leftControllerIndex.buttons[4].pressed) {
          // X Button: Reset the vehicle if flipped
          vehicle.chassisBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 1, 0),
            0
          );
          vehicle.chassisBody.velocity.set(0, 0, 0);
          vehicle.chassisBody.angularVelocity.set(0, 0, 0);
        }
    }

    if (rightControllerIndex !== null) {
        // Right Joystick: Steer
        if (rightControllerIndex.axes[2] < -0.3) {
            vehicle.setSteeringValue(maxSteerVal, 0);
            vehicle.setSteeringValue(maxSteerVal, 1);
        } else if (rightControllerIndex.axes[2] > 0.3) {
            vehicle.setSteeringValue(-maxSteerVal, 0);
            vehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            vehicle.setSteeringValue(0, 0);
            vehicle.setSteeringValue(0, 1);
        }
        // B Button: Switch between perspectives
        if (rightControllerIndex.buttons[5].pressed) {
            if (currentTime - firstPressedTime > 500) {
                if (isFirstPerson) 
                    isFirstPerson = false;
                else
                    isFirstPerson = true;
                firstPressedTime = currentTime;
            }
        }
        // A Button: Mute/Unmute Sound
        if (rightControllerIndex.buttons[4].pressed) {
            if (currentTime - firstPressedTime > 500) {
                if (!muted)
                  muted=true;
                else
                  muted=false;
                Howler.mute(muted);

                firstPressedTime = currentTime;
            }
        }
    }
}

//Collision sound
//This code section is inspired by chatGPT 4, there are adjustments integrated to match desired experience
//Prompt 1:this is my current code. Now i need to detect when the bus collide with any of the collision box. And when they collide, I want to play a sound. What should I do, show code
//Prompt 2: 
//I already get it to work. now this is my code. I want to do if the vehicle collide  in the collision box more than 3 times within 2 seconds then play a different sound. show code


let collisionCounter = 0;
let firstCollisionTime = 0;
//These sounds are from freesound.org and there is absolutely no copyright infringement
const collisionSound = new Howl({ src: ['collision-sound.wav'] });
const repeatedCollisionSound = new Howl({ src: ['oh-oh.wav'] });
physicsWorld.addEventListener("beginContact", (event) => {
  const bodyA = event.bodyA;
  const bodyB = event.bodyB;
  if (bodyA === vehicle.chassisBody || bodyB === vehicle.chassisBody) {
    const currentTime = Date.now();
    if (collisionCounter === 0 || currentTime - firstCollisionTime > 2000) {
      collisionCounter = 1;
      firstCollisionTime = currentTime;
    } else {
      collisionCounter++;
    }

    if (collisionCounter > 3) {
      repeatedCollisionSound.play();
      collisionCounter = 0;  // Reset counter after playing sound
    } else {
      collisionSound.play();
    } 
  }
});

// For Debugging the Collision
const cannonDebugger = new CannonDebugger(scene, physicsWorld, {});

// Animation loop
function animate() {
  renderer.setAnimationLoop(() => {
    physicsWorld.fixedStep();
    ThreeMeshUI.update();
    // For Debugging the Collision
    cannonDebugger.update();
    vehicle.chassisBody.quaternion.toEuler(angle);
    if (busModel) {
        // Update the bus's position and rotation
        busModel.position.copy(vehicle.chassisBody.position);
        busModel.quaternion.copy(vehicle.chassisBody.quaternion);

        const correctionQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        -Math.PI / 2
        ); //-90 degrees around y axis
        busModel.quaternion.multiply(correctionQuaternion);
    }
    cameraUpdate();
    updateHUDTimer();
    uiUpdate();
    controllerInput();
    renderer.render(scene, camera);
  });
}

animate();
