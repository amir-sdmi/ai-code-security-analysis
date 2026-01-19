/**
 * This favicon generation script was generated using ChatGPT-3.5-turbo:
 * see https://chat.openai.com/share/f637fe5a-975e-435d-b373-084135fa357f
 */

function setup() {
    cnv = createCanvas(32, 32);
    cnv.parent('favicon');
    noStroke();
    noLoop();
}

function draw() {
    // Draw a random pattern or shape
    drawRandomPattern();

    // Convert the canvas to a data URL
    let faviconUrl = canvas.toDataURL();

    // Create a favicon link element
    let link = document.querySelector('link[rel=icon]');
    link.href = faviconUrl;
}

function drawRandomPattern() {
    // Draw a circle circumscribed to the canvas
    let baseHue = random(360);
    fill(colorHsluv(baseHue, 50, 90));
    circle(width / 2, height / 2, width);

    // Draw a random number of shapes
    let numShapes = floor(random(5, 15));

    for (let i = 0; i < numShapes; i++) {
        // Set random size
        let size = random(2, width / 2);

        // Set a random position
        let x = random(width - size) + size / 2;
        let y = random(height - size) + size / 2;

        // Set a random color
        fill(colorHsluv(
            baseHue + random(45) % 360,
            random(60, 100),
            random(60, 80),
            random(128, 255)
        ));

        // Draw a circle
        circle(x, y, size);
    }
}

function colorHsluv(h, s, l, a = 255) {
    const rgb = hsluv.hsluvToRgb([h, s, l]);
    return color(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255, a);
}
