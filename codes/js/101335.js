let lines = [];
let drops = [];
let force = [0, 0.5];

function setup() {
  createCanvas(windowWidth, windowHeight); // 화면 크기를 디스플레이 크기로 설정
}

function mousePressed() {
  let newLine = new Line();
  newLine.init(mouseX, mouseY, random(35, 80));
  lines.push(newLine);
}

function draw() {
  background(255);

  fill(0);
  textSize(20);
  text('mousePressed...', width * 0.5, 50);
  text('rain(line): ' + lines.length, 20, 30);
  text('waterdrops(drop): ' + drops.length, 20, 50);
  text('with ChatGPT', 20, 70);

  // 선 업데이트 및 렌더링
  for (let i = lines.length - 1; i >= 0; i--) {
    let aLine = lines[i];
    aLine.update(force);
    aLine.display();

    // 선이 화면 아래에 닿았다면 물방울 생성 및 선 제거
    if (aLine.y + aLine.length >= height) {
      for (let j = 0; j < 10; j++) {
        let newDrop = new Drop(aLine.x, height);
        drops.push(newDrop);
      }
      lines.splice(i, 1);
    }
  }

  // 물방울 업데이트 및 렌더링
  for (let i = drops.length - 1; i >= 0; i--) {
    let aDrop = drops[i];
    aDrop.update(force);
    aDrop.display();

    // 화면 아래로 벗어난 물방울 제거
    if (aDrop.y > height) {
      drops.splice(i, 1);
    }
  }
}

class Drop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-4, 4); // 랜덤 x 방향 속도
    this.vy = random(-8, -4); // 위로 튀는 y 방향 속도
    this.dropColor = color(
      random(180, 255),
      random(180, 255),
      random(180, 255)
    );
  }

  update(force) {
    this.vy += force[1];
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    fill(this.dropColor);
    noStroke();
    ellipse(this.x, this.y, random(8, 10), random(8, 10)); // 타원 모양으로 물방울 표현
  }
}

class Line {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.length = 0;
    this.vy = 0;
    this.lineColor = color(
      random(180, 255),
      random(180, 255),
      random(180, 255)
    );
  }

  init(x, y, length) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.lineColor = color(
      random(180, 255),
      random(180, 255),
      random(180, 255)
    );
  }

  update(force) {
    this.vy += force[1];
    this.y += this.vy;
  }

  display() {
    stroke(this.lineColor);
    strokeWeight(3);
    line(this.x, this.y, this.x, this.y + this.length);
  }
}
