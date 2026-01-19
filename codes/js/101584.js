/**
 * A class for all entities/objects in the game.
 */
class GameObject {
    /**
     * Parameters that specify the location and size of an game object.
     * @param {number} x The x-coordinate of the game object.
     * @param {number} y The y-coordinate of the game object.
     * @param {number} w The width of the game object.
     * @param {number} h The height of the game object.
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    /**
     * A method for displaying the game objects, not shown in the actual game.
     */
    display() {
        fill(100, 0);
        rect(this.x, this.y, this.w, this.h);
    }
}

/**
 * A class for NPCs, extended from the GameObject class with all parameters the same in the parent constructor.
 */
class NPC extends GameObject {
    /**
     * A method for drawing the NPC sprites on the game canvas.
     * The let idleMotion line in this method is written by generative AI.
     * Author: ChatGPT
     * Date: 18/06/2025
     * @param {p5.Image} spritePng The character sprite sheet image.
     * @param {number} spriteX The x-coordinate of the NPC sprite on the sheet.
     * @param {number} spriteY The y-coordinate of the NPC sprite on the sheet.
     * @param {number} spriteW The width of the NPC sprite on the sheet.
     * @param {number} spriteH The height of the NPC sprite on the sheet.
     */
    display(spritePng, spriteX, spriteY, spriteW, spriteH) {
        let idleMotion = sin(frameCount * 0.1) * 0.5;   // Creating a floating animation as idle animation of NPCs, written by ChatGPT.
        let img = spritePng.get(spriteX, spriteY, spriteW, spriteH);    // Getting the sprite image from the sprite sheet

        // Draws the NPCs in center mode, then returns to corner mode for drawing other game objects.
        imageMode(CENTER);
        image(img, this.x, this.y + idleMotion, this.w, this.h);
        imageMode(CORNER);       
    }
}

/**
 * A class for the player character, extended from the GameObject class.
 */
class Player extends GameObject {
    /**
     * Parameters for the player character's location, size and animations.
     * @param {number} x The x-coordinate of the player character.
     * @param {number} y The y-coordinate of the player character.
     * @param {number} w The width of the player character.
     * @param {number} h The height of the player character.
     * @param {number} movementSpeed The number of pixels the player character moves per frame.
     * @param {number} frameDelay The number of frames to delay before displaying the next sprite image.
     * @param {p5.Image[]} animationArray An array holding the sprite images for the movement animation.
     */
    constructor(x, y, w, h, movementSpeed, frameDelay, animationArray) {
        super(x, y, w, h);
        this.movementSpeed = movementSpeed;
        this.frameDelay = frameDelay;
        this.animationArray = animationArray;
        this.index = 0;
        this.isMoving;
    }

    /**
     * A method for drawing the player character with walking animations.
     */
    display() {
        // If the player character moves, the character sprite updates per number of frames specified in frameDelay.
        if(this.isMoving && frameCount % this.frameDelay === 0) {
            this.index = (this.index + 1) % this.animationArray.length;
        }

        // Draws the player character's sprite/animation in center mode, then returns to corner mode for other game objects.
        imageMode(CENTER);
        image(this.animationArray[this.index], this.x, this.y, this.w, this.h);
        imageMode(CORNER);
    }

    /**
     * A method for updating the player character's location as they control it.
     * @param {Obstacle[]} obstacleArray An array holding the obstacle objects' collision boxes.
     */
    update(obstacleArray) {
        // Variables for the player character's location after movement.
        let nextX = this.x;
        let nextY = this.y;

        // Boolean for the player character's state of movement.
        this.isMoving = false;

        // Allows player movement with animations by WASD / direction keys and stops the player from moving while inside a dialogue.
        if(!dialogueBoxVisible && !dayTransitionOngoing) {
            if (keyIsDown(87) || keyIsDown(38)) {   // w, up arrow
                nextY -= this.movementSpeed;
                this.isMoving = true;
            }
            if (keyIsDown(65) || keyIsDown(37)) {   // a, left arrow
                nextX -= this.movementSpeed;
                this.animationArray = [];
                getPlayerSprite(characterSprite, this.animationArray, 8, spritePixelSize);
                this.isMoving = true;
            }
            if (keyIsDown(83) || keyIsDown(40)) {   // s, down arrow
                nextY += this.movementSpeed;
                this.isMoving = true;
            }
            if (keyIsDown(68) || keyIsDown(39)) {   // d, right arrow
                nextX += this.movementSpeed;
                this.animationArray = [];
                getPlayerSprite(characterSprite, this.animationArray, 8, 0);
                this.isMoving = true;
            }
        }
        
        // Checks if the player character's location after movement collides with any obstacles.
        // Divide the width and height by 4 for more accurate character size for collision detection.
        let collision = false;
        for (let obstacle of obstacleArray) {
            if (nextX + this.w / 4 >= obstacle.x && nextX - this.w / 4 <= obstacle.x + obstacle.w &&
                nextY + this.h / 4 >= obstacle.y && nextY - this.h / 4 - 5 <= obstacle.y + obstacle.h) {
                collision = true;
            break;
            }
        }

        // Updates player character's location only if there is no collision.
        if (!collision) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    /**
     * A method for checking collision by calculating the centre points of player and interactable areas.
     * @param {Object} other The other object to check for collision.
     * @returns {boolean} True if the player collides with other objects, false otherwise.
     */
    collides(other) {
        let d = dist(this.x, this.y, other.x, other.y);
        return d < this.w / 2 + other.w / 2;
    }
}