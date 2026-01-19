// this project i am building a star system or "stars in the universe" 
// using chatGPT as my guide and tool to learn how canvas works.


// setting some variables for the canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// setting width and height of the canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// creating an empty array for the stars and a set number of how
// many i want to spawn in the canvas.
const stars = [];
const numOfStars = 200;

// now creating a forLoop to position the stars
for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * canvas.width - canvas.width / 2,
    y: Math.random() * canvas.height - canvas.height / 2,
    z: Math.random() * canvas.width
  });
}

// this function draws the stars (static).
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for( let i = 0; i < stars.length; i++) {
    const star = stars[i];

    const k = 128.0 / star.z;
    const x = star.x * k + canvas.width / 2;
    const y = star.y * k + canvas.height / 2;

    const size = ( 1 - star.z / canvas.width) * 2;
    const brightness = 1 - star.z / canvas.width;

    ctx.beginPath();
    ctx.arc( x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fill();
  }
}

// this function is using a for loop to animate the stars as if traveling through space.
function updateStars() {
  for( let i = 0; i < stars.length; i++) {
    stars[i].z -= 2;

    if (stars[i].z <= 0) {
      stars[i].x = Math.random() * canvas.width - canvas.width / 2;
      stars[i].y = Math.random() * canvas.height - canvas.height / 2;
      stars[i].z = canvas.width;
    }
  }
}
// a function to put them all together to create the full effect.
function animate() {
  updateStars();
  drawStars();
  requestAnimationFrame(animate);
}
// this function creates the end result.
animate();

// adding responsiveness for window resizing.
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  stars.length = 0;

  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width - canvas.width / 2,
      y: Math.random() * canvas.height - canvas.height / 2,
      z: Math.random() * canvas.width
    });
  }
});

