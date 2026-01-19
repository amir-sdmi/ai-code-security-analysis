'use strict'

const config = {
    parent: 'phaser-game',  // for info text
    type: Phaser.WEBGL,     // for tinting
    width: 1280, // formerly 1280 x 720
    height: 720,
    pixelArt: true,
    zoom: 1,
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [ Load, Title, Character, Play ]
}

const game = new Phaser.Game(config)


// Used for matrix generation (made with chatgpt)
function getRandomInt(min, max) {
    min = Math.ceil(min); // Round up to the nearest integer
    max = Math.floor(max); // Round down to the nearest integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// These are some of the important sizes for placing the rooms
// all of them are measured in pixels
let tileSize = 20
let roomHeight = 220
let roomWidth = 320
// These measure the thickness of the walls
let wThick = 40
let nsDoorWidth = 27
let ewDoorWidth = 24

// character selection global
let characterSelect = []
let characterImage
