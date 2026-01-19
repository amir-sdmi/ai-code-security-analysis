// Written by ChatGPT
// Prompt: write me a javascript program that uses the canvas api to simulate ricci flow in 2d.  start with a random shape with variable number of points and apply the actual real scientific formulas to calculate the ricci flow for that shape.

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;

const NUM_POINTS = 10; // Number of vertices in the initial polygon
const ITERATIONS = 500;
const DELTA_T = 0.1; // Small time step for evolution

// Generate a random polygon with a given number of points
function generatePolygon(n, radius = 200) {
  let points = [];
  for (let i = 0; i < n; i++) {
    let angle = (i / n) * Math.PI * 2;
    let r = radius * (0.8 + Math.random() * 0.4); // Vary radius slightly
    points.push({
      x: canvas.width / 2 + r * Math.cos(angle),
      y: canvas.height / 2 + r * Math.sin(angle),
    });
  }
  return points;
}

let polygon = generatePolygon(NUM_POINTS);

// Compute discrete curvature at each vertex
function computeCurvature(points) {
  let curvatures = new Array(points.length).fill(0);
  for (let i = 0; i < points.length; i++) {
    let prev = points[(i - 1 + points.length) % points.length];
    let curr = points[i];
    let next = points[(i + 1) % points.length];

    let v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    let v2 = { x: next.x - curr.x, y: next.y - curr.y };

    let angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    if (angle < 0) angle += 2 * Math.PI;
    angle = Math.PI - angle; // Interior angle

    curvatures[i] = angle - Math.PI; // Ricci curvature approximation
  }
  return curvatures;
}

// Apply Ricci flow update with Laplacian smoothing
function applyRicciFlow(points) {
  let curvatures = computeCurvature(points);
  let newPoints = points.map((p, i) => {
    let prev = points[(i - 1 + points.length) % points.length];
    let next = points[(i + 1) % points.length];

    let k = curvatures[i]; // Local curvature
    let scale = 1 - k * DELTA_T; // Adjust scale dynamically

    return {
      x: (prev.x + next.x) / 2 + (p.x - (prev.x + next.x) / 2) * scale,
      y: (prev.y + next.y) / 2 + (p.y - (prev.y + next.y) / 2) * scale,
    };
  });
  return newPoints;
}

// Draw the polygon
function drawPolygon(points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
}

let iteration = 0;
function update() {
  if (iteration < ITERATIONS) {
    polygon = applyRicciFlow(polygon);
    drawPolygon(polygon);
    iteration++;
    requestAnimationFrame(update);
  }
}

drawPolygon(polygon);
update();
