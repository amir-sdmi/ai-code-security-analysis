/* exported generateGrid, drawGrid */
/* global placeTile */

class Room {
  constructor(x, y, size) {
    this.x = x; // center x
    this.y = y; // center y
    this.size = size;
    this.half = Math.floor(size / 2);
    
    this.left = x - this.half;
    this.right = x + this.half;
    this.top = y - this.half;
    this.bottom = y + this.half;
  }

  intersects(otherRoom) {
    return !(this.right < otherRoom.left || this.left > otherRoom.right || this.bottom < otherRoom.top || this.top > otherRoom.bottom);
  }

  getCenter() {
    return [this.x, this.y];
  }
}

class Door {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
  }
}
let doors = [];

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1;
    this.size = 8;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  draw() {
    fill(255, 0, 0);
    rect(this.x, this.y, this.size, this.size);
  }
}

let player;

function generateDungeonGrid(numCols, numRows) {
  doors = [];
  let grid = [];
  let rooms = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("_");
    }
    grid.push(row);
  }
  let randomRoomCount = floor(random(7,2));
  for (let p = 0; p < randomRoomCount; p++) {
    let x = floor(numRows / 2) + floor(random(-5, 5));
    let y = floor(numCols / 2) + floor(random(-5, 5));
    
    // Dont make rooms near each other
    if (rooms.length > 0){
      for (let o = 0; o < rooms.length; o++){
        while (abs(rooms[o].x - x) < 2 && abs(rooms[o].y - y) < 2){
          console.log("Rerolling")
          x = floor(numRows / 2) + floor(random(-5, 5));
          y = floor(numCols / 2) + floor(random(-5, 5));
        }
      }
    }
    
    let room = generateSquareRoom(x, y, numCols, numRows, grid);
    if (room) {
      rooms.push(room);
    }

  }
  
  for (let i = 1; i < rooms.length; i++) {
    let [x1, y1] = rooms[i - 1].getCenter();
    let [x2, y2] = rooms[i].getCenter();

    //Horizontal hallway
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      grid[y1][x] = ".";
    }

    //Vertical hallway
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      grid[y][x2] = ".";
    }
    
    if (rooms[i].size > 4) {
      //Add a pillar
      if (random(100,0) > 35) generatePillar(grid,rooms[i])
    }
  }
  //Create a player object in the center of the first room
  let [x, y] = rooms[0].getCenter();
  if (grid[y][x] == "_" || grid[y][x] == "|") {
    [x, y] = rooms[1].getCenter();
  }
  player = new Player(x * 16, y * 16);
  placeDoor(grid, rooms);
  return grid
}


//Modified with ChatGPT
function generateSquareRoom(x, y, numCols, numRows, grid) {
  let minRoomSize = 2;
  
  //Calculate max size based on distance from x, y to each edge
  let maxWidth = min(x, numRows - x - 2) * 2 + 1;
  let maxHeight = min(y, numCols - y - 2) * 2 + 1;
  let maxRoomSize = min(maxWidth, maxHeight);

  maxRoomSize = min(maxRoomSize, floor(min(numRows, numCols) / 2 - 1));

  if (maxRoomSize < minRoomSize) return null;

  let roomSize = floor(random(minRoomSize, maxRoomSize));
  let halfRoom = floor(roomSize / 2);

  //Place the room and record bounds
  for (let i = y - halfRoom; i <= y + halfRoom; i++) {
    for (let j = x - halfRoom; j <= x + halfRoom; j++) {
      if (i >= 0 && i < numRows && j >= 0 && j < numCols) {
        grid[i][j] = ".";
      }
    }
  }

  //Return a Room object with coordinates and size
  return new Room(x, y, roomSize);
}

function placeDoor(grid, rooms) {
  let candidates = [];

  for (let room of rooms) {
    for (let i = room.top; i <= room.bottom; i++) {
      for (let j = room.left; j <= room.right; j++) {
        //Only scan the perimeter
        if (i === room.top || i === room.bottom || j === room.left || j === room.right) {
          let bitCode = gridCode(grid, i, j, "_");
          if (bitCode === 1) {
            candidates.push({ i, j });
          }
        }
      }
    }
  }

  //Prefer higher-up tiles
  candidates.sort((a, b) => a.i - b.i);

  if (candidates.length > 0) {
    let { i, j } = candidates[0];
    doors.push(new Door(j * 16, i * 16));
  } else {
    console.warn("No valid door location found!");
  }
}


function generatePillar(grid,room){
  let x = room.right - floor(random(room.size-1,1))
  let y = room.bottom - floor(random(room.size-2,1))
  
  grid[y][x] = "|";
  grid[y-1][x] = "|"
}


function drawDungeonGrid(grid) {
  background(128);

  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      if (gridCheck(grid,i,j,"_")) { //If its an underscore draw grass.
        placeTile(i, j, 10, 21);
      }
      else if (gridCheck(grid,i,j,".")) {
        placeTile(i,j, 10, 23)
        roomWallsDisplay(i,j,grid)
      }
      else if (gridCheck(grid,i,j,"|")) {
        drawPillar(grid,i,j)
      }
    }
  }
  for (let door of doors) {
    placeTile(door.y/16, door.x/16, 15, 25); // Draw door graphic
  }

  handlePlayerMovement(grid);
}

//Written by chatGPT.
//Movement to follow the mouse position
function handlePlayerMovement(grid) {
  if (player) {
    let dx = (mouseX - player.x) * player.speed;
    let dy = (mouseY - player.y) * player.speed;
  
    dx = constrain(dx, -player.speed, player.speed);
    dy = constrain(dy, -player.speed, player.speed);
  
    // Attempt X movement
    let nextX = player.x + dx;
    let collidesX = false;
  
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (gridCheck(grid, i, j, "_")) {
          let wallX = j * 16;
          let wallY = i * 16;
          if (collideRectRect(wallX, wallY, 16, 16, nextX, player.y, player.size, player.size)) {
            collidesX = true;
          }
        }
      }
    }
  
    if (!collidesX) {
      player.x = nextX;
    }
  
    // Attempt Y movement
    let nextY = player.y + dy;
    let collidesY = false;
  
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (gridCheck(grid, i, j, "_")) {
          let wallX = j * 16;
          let wallY = i * 16;
          if (collideRectRect(wallX, wallY, 16, 16, player.x, nextY, player.size, player.size)) {
            collidesY = true;
          }
        }
      }
    }
  
    if (!collidesY) {
      player.y = nextY;
    }
  
    player.draw();

    let touchedDoor = checkDoorCollision(player, doors);
    if (touchedDoor) {
      reseed();
    }
  }
  
}

function checkDoorCollision(player, doors) {
  for (let door of doors) {
    if (collideRectRect(
      door.x, door.y, door.size, door.size,
      player.x, player.y, player.size, player.size
    )) {
      return door;
    }
  }
  return null;
}



function roomWallsDisplay(i, j, grid) {
  let bitCode = gridCode(grid, i, j, "_");
  const [ti, tj] = lookup[bitCode];
  if (bitCode == 0) return;
  if (bitCode == 1 && random(100,0) <= 15) {
    for (let door of doors) {
      if (door.x == j * 16 && door.y == i * 16) return;
    }
    doors.push(new Door(j * 16, i * 16));
  } 
  else placeTile(i, j, ti, tj);
}

function gridCheck(grid, i, j, target) {
  if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
    return false;
  }
  
  if (grid[i][j] == target) {
    return true;
  }
  else return false
}

function gridCode(grid, i, j, target) {
  let northBit = gridCheck(grid, i - 1, j, target);
  let southBit = gridCheck(grid, i + 1, j, target);
  let eastBit  = gridCheck(grid, i, j + 1, target);
  let westBit  = gridCheck(grid, i, j - 1, target);

  return (northBit << 0) + 
         (southBit << 1) + 
         (eastBit  << 2) + 
         (westBit  << 3);
}

function drawPillar(grid,i,j) {
  let code = gridCode(grid,i,j,"|")
  
  if (code & 1) {
    placeTile(i, j, 10, 21);
    placeTile(i,j,29,1)
  }
  else if (code & 2) {
    placeTile(i, j, 10, 21);
    placeTile(i,j,29,0)
  }
  else {
    placeTile(i, j, 10, 21);
    placeTile(i,j,4,29);
  }
}


//Generated with ChatGPT
const lookup = [
  /*  0: 0000 */ [10, 23],      // No Neighbors
  /*  1: 0001 */ [16, 21],    // Only north
  /*  2: 0010 */ [16, 23],    // Only south
  /*  3: 0011 */ [11, 21],    // North + South
  /*  4: 0100 */ [17, 22],    // Only east
  /*  5: 0101 */ [17, 21],    // North + east
  /*  6: 0110 */ [17, 23],    // South + east
  /*  7: 0111 */ [17, 21],    // North + south + east
  /*  8: 1000 */ [15, 22],    // Only west
  /*  9: 1001 */ [15, 21],    // North + west
  /* 10: 1010 */ [15, 23],    // South + west
  /* 11: 1011 */ [15, 21],    // North + south + west
  /* 12: 1100 */ [11, 21],    // East + west
  /* 13: 1101 */ [16, 21],    // North + east + west
  /* 14: 1110 */ [16, 23],    // South + east + west
  /* 15: 1111 */ [10, 23],    // All directions 
];

