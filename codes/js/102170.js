// Button colour
const buttons = document.querySelectorAll('.changeShape');

buttons.forEach(button => {
  button.addEventListener('click', function () {
    buttons.forEach(btn => btn.classList.remove('changeColour'));
    this.classList.add('changeColour');
  });
});

// define tone scales
window.scale = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4"];

// Functionalities under here
window.addEventListener('DOMContentLoaded', () => {

  // Colour swatch selector
let currentColour = "random";

document.querySelectorAll('.colourButton').forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.getAttribute('data-color');
    currentColour = color;
    document.querySelectorAll('.colourButton').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

function randomiseSwatches() {
  document.querySelectorAll('.colourButton:not(.random-btn)').forEach(btn => {
    const randomColour = getRandomColor();
    btn.style.backgroundColor = randomColour;
    btn.setAttribute('data-color', randomColour);
  });
}
randomiseSwatches();
document.getElementById('reloadSwatches').addEventListener('click', () => {
  randomiseSwatches();
});

  const speakers = document.querySelectorAll('img[src="Speaker.png"]');

// define animation for speakers to be called up
function animateSpeakers() {
  speakers.forEach(speaker => {
    speaker.classList.add('speaker-bounce');
    setTimeout(() => speaker.classList.remove('speaker-bounce'), 200);
  });
}

  // define tone instruments in relation to shapes
  const synth = new Tone.Synth().toDestination();
  const circleSynth = new Tone.AMSynth().toDestination();
  const squareSynth = new Tone.PolySynth().toDestination();
  const triangleSynth = new Tone.FMSynth().toDestination();

  const shapeInstruments = {
    circle: circleSynth,
    square: squareSynth,
    triangle: triangleSynth
  };

  // on page load, default on circle, not looping.
  let currentShape = 'circle';
  let loopEvent = null;
  let loopRunning = false;

  // randomise colours (don't like the colour picker)
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Tempo controls
  const tempoSlider = document.getElementById('tempoSlider');
  const tempoDisplay = document.getElementById('tempoDisplay');
  Tone.Transport.bpm.value = parseInt(tempoSlider.value, 10);
  tempoDisplay.textContent = tempoSlider.value;

  tempoSlider.addEventListener('input', () => {
    const bpm = parseInt(tempoSlider.value, 10);
    Tone.Transport.bpm.value = bpm;
    tempoDisplay.textContent = bpm;
  });

  // Pitch
  function getPitchFromY(y) {
    const canvasHeight = 500;
    const noteIndex = Math.floor((1 - y / canvasHeight) * (scale.length - 1));
    return scale[Math.max(0, Math.min(scale.length - 1, noteIndex))];
  }

  // random number generator :)
  function getRandomSize(min = 10, max = 80) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

  // create shapes
function createShape(pos) {
  const size = getRandomSize();
  let shape;

  switch (currentShape) {
    case 'circle':
      shape = new Konva.Circle({
        x: pos.x,
        y: pos.y,
        fill: currentColour === "random" ? getRandomColor() : currentColour,
        radius: size,
        draggable: true
      });
      break;

    case 'square':
      shape = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        fill: currentColour === "random" ? getRandomColor() : currentColour,
        width: size*2,
        height: size*2,
        offsetX: size / 2,
        offsetY: size / 2,
        draggable: true
      });
      break;

    case 'triangle':
      shape = new Konva.RegularPolygon({
        x: pos.x,
        y: pos.y,
        fill: currentColour === "random" ? getRandomColor() : currentColour,
        sides: 3,
        radius: size,
        draggable: true
      });
      break;
  }

  console.log(size)

  group.add(shape);
  layer.draw();

    // relate pitch to y position of shape, tone emit sound (Code assisted by ChatGPT)
    const pitch = getPitchFromY(pos.y);
    Tone.start();
    shapeInstruments[currentShape].triggerAttackRelease(pitch, "4n");
    animateSpeakers();
  }

  stage.on('mousedown', function (e) {
    const isRightClick = e.evt.button === 2;
    const pos = stage.getPointerPosition();
    const clickedShape = stage.getIntersection(pos);
  
    // right click to remove
    if (isRightClick) {
      if (clickedShape && clickedShape !== playhead) {
        clickedShape.destroy();
        layer.draw();
      }
      return;
    }
  
    // shape check, if mouse hovering over a shape does not allow left click to create a shape.
    if (!clickedShape || clickedShape === playhead) {
      createShape(pos);
    }
  });

  document.getElementById('shape1').addEventListener('click', () => currentShape = 'circle');
  document.getElementById('shape2').addEventListener('click', () => currentShape = 'square');
  document.getElementById('shape3').addEventListener('click', () => currentShape = 'triangle');
  stage.getContent().addEventListener('contextmenu', e => e.preventDefault());

  // SOUND PLAYBACK (Code assisted by ChatGPT)
  document.getElementById('playButton').addEventListener('click', () => {
    const shapes = group.getChildren();
    if (shapes.length === 0) return;

    const canvasWidth = stage.width();
    const bpm = Tone.Transport.bpm.value;
    const beatsPerBar = 4;
    const duration = (60 / bpm) * beatsPerBar;

    shapes.forEach(shape => shape.hasPlayed = false);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.position = 0;
    Tone.start();
    Tone.Transport.start();

    playhead.visible(true);
    layer.draw();

    const startTime = Tone.now();

    function animate() {
      const now = Tone.now();
      const elapsed = now - startTime;
      const progress = elapsed / duration;
      const x = progress * canvasWidth;

      playhead.points([x, 0, x, stage.height()]);
      layer.draw();

      shapes.forEach(shape => {
        const shapeX = shape.x();
        if (!shape.hasPlayed && Math.abs(shapeX - x) < 5) {
          const pitch = getPitchFromY(shape.y());
          let type;
          if (shape instanceof Konva.Circle) type = 'circle';
          else if (shape instanceof Konva.Rect) type = 'square';
          else if (shape instanceof Konva.RegularPolygon) type = 'triangle';
          else return;

          const instrument = shapeInstruments[type];
          instrument.triggerAttackRelease(pitch, '8n', now);
          animateSpeakers();
          shape.hasPlayed = true;

          shape.stroke('yellow');
          shape.strokeWidth(4);
          shape.shadowColor('yellow');
          shape.shadowBlur(10);
          layer.draw();

          setTimeout(() => {
            shape.stroke(null);
            shape.shadowColor(null);
            shape.shadowBlur(0);
            layer.draw();
          }, 150);
        }
      });

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        playhead.visible(false);
        layer.draw();
        shapes.forEach(shape => delete shape.hasPlayed);
      }
    }

    requestAnimationFrame(animate);
  });

  // LOOP PLAYBACK
  document.getElementById('startLoop').addEventListener('click', () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.position = 0;
    Tone.start();
    Tone.Transport.start();
  
    const shapes = group.getChildren();
    if (shapes.length === 0) return;
  
    const canvasWidth = stage.width();
    const beatsPerBar = 4;
  
    let loopStart = Tone.now();
  
    function animateLoop() {
      const bpm = Tone.Transport.bpm.value;
      const duration = (60 / bpm) * beatsPerBar;
      const now = Tone.now();
      const elapsed = (now - loopStart) % duration;
      const progress = elapsed / duration;
      const x = progress * canvasWidth;
  
      playhead.points([x, 0, x, stage.height()]);
      layer.draw();
  
      shapes.forEach(shape => {
        const shapeX = shape.x();
        if (!shape.lastPlayed || now - shape.lastPlayed > 0.2) {
          if (Math.abs(shapeX - x) < 5) {
            const pitch = getPitchFromY(shape.y());
            let type;
            if (shape instanceof Konva.Circle) type = 'circle';
            else if (shape instanceof Konva.Rect) type = 'square';
            else if (shape instanceof Konva.RegularPolygon) type = 'triangle';
            else return;
  
            const instrument = shapeInstruments[type];
            instrument.triggerAttackRelease(pitch, '8n', now);
            animateSpeakers();
            shape.lastPlayed = now;
  
            shape.stroke('yellow');
            shape.strokeWidth(4);
            shape.shadowColor('yellow');
            shape.shadowBlur(10);
            layer.draw();
  
            setTimeout(() => {
              shape.stroke(null);
              shape.shadowColor(null);
              shape.shadowBlur(0);
              layer.draw();
            }, 150);
          }
        }
      });
  
      if (loopRunning) {
        requestAnimationFrame(animateLoop);
      }
    }
  
    loopRunning = true;
    playhead.visible(true);
    layer.draw();
    animateLoop();
  });

  // Stop Loop
  document.getElementById('stopLoop').addEventListener('click', () => {
    Tone.Transport.stop();
    loopRunning = false;
    playhead.visible(false);
    layer.draw();
  });

// Save JPG image
document.getElementById('saveImg').addEventListener('click', () => {
  const dataURL = stage.toDataURL({ mimeType: 'image/jpeg' });

  const link = document.createElement('a');
  link.download = 'canvas.jpg';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Reset canvas
document.getElementById('resetImg').addEventListener('click', () => {
  Tone.Transport.stop();
  loopRunning = false;
  group.destroyChildren();
  playhead.visible(false);
  layer.draw();     
});

// Volume Control (Code assisted by ChatGPT)
const volControl = document.getElementById("volSlider");
volControl.value = 100;

function remapRange(value, fromLow, fromHigh, toLow, toHigh) {
  return ((value - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

volControl.addEventListener("input", e => {
  const value = parseInt(e.target.value, 10);
  const newVolume = remapRange(clamp(value, 0, 100), 0, 100, -48, 0);
  Object.values(shapeInstruments).forEach(instr => {
    instr.volume.value = newVolume;
  });
});
});

