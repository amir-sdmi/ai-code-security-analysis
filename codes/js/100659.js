navigator.geolocation.getCurrentPosition(
  function (position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    console.log("📍 Your location:", lat, lon);

    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');

    // Optional: scale or offset lat/lon if you want to map them
    // For now just place the dot somewhere obvious
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(320, 240, 6, 0, Math.PI * 2);
    ctx.fill();
  },
  function (error) {
    console.error("❌ Location error:", error.message);
  }
);const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
canvas.width = 640;
canvas.height = 480;

const cities = [
  { name: "Atlanta", x: 250, y: 300 },
  { name: "Charlotte", x: 350, y: 250 },
  { name: "Savannah", x: 300, y: 380 },
  { name: "Columbia", x: 320, y: 300 },
  { name: "Charleston", x: 360, y: 360 },
  { name: "Macon", x: 270, y: 330 },
  { name: "Greenville", x: 300, y: 260 },
  { name: "Jacksonville", x: 320, y: 430 },
  { name: "Chattanooga", x: 220, y: 260 },
  { name: "Knoxville", x: 240, y: 220 }
];

ctx.font = "12px monospace";
ctx.fillStyle = "white";

cities.forEach(city => {
  ctx.fillText(city.name, city.x, city.y);
  ctx.fillStyle = "yellow";
  ctx.fillText("??°", city.x, city.y + 12);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(city.x, city.y - 10, 5, 0, 2 * Math.PI);
  ctx.fill();
});

const tickerText = "Thx for watching WS4000 powered by ChatGPT and made by lunvyyrx. Current conditions at Augusta: Temp: 88°F  Heat Index: 92°F  Humidity: 70%  Dew Point: 70°F  Barometric Pressure: 30.12\"  Wind: NW 5 MPH  Visb: 12 MI  Ceiling: 12000 FT";
document.getElementById("ticker").textContent = tickerText;
