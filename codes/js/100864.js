let player1;

function setup() {
	let sketch = createCanvas(400, 400);
    sketch.parent("mycanvas");

    player1 = new Pacman(200, 200, 30, 30);
    
}//end setup

function draw() {
    background(200,0,80);

    player1.display();
    player1.move();
    
    fill(255);
    textSize(30);
    text("Direction: " + player1.direction, 50, 50);
   
}//end draw

function mousePressed() {
    player1.x = 200;
    player1.y = 200;
}//end mousePressed
// **************  Pacman Class ************
class Pacman {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.direction = 0;
        this.speed = 2;
    }
    display() {
        fill(255, 255, 0);
        rect(this.x, this.y, this.w, this.h); 
        fill(0);
        circle(this.x + 23, this.y + 10, 5)
    }

    move(){
        let xspeed =  this.speed * Math.cos( Math.PI/180 * this.direction   )  ;
        let yspeed = this.speed * Math.sin( Math.PI/180 * this.direction   )  ;
        //the above 2 lines were created by chatGPT using the search: "write formulas for determining xspeed and yspeed in javascript from a direction and a speed"
               
        this.x += xspeed;
        this.y += yspeed;

        if( keyIsDown(RIGHT_ARROW) ){
            this.direction += 2;
        } else if ( keyIsDown(LEFT_ARROW) ){
            this.direction -= 2;
        }

        this.direction %= 360;
        if( this.direction < 0 ){
            this.direction = 360 + this.direction;
        }
        
    }

}//Pacman


