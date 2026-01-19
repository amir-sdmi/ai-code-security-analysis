// [HACKY] (written by chatgpt cuz I don't know web-dev for shit).
// Fixes zoomed image appearing behind table of contents +  zooms to only 80%
$(document).ready(function() {
  // Define the z-index variable.
  var zIndexValue = '1000000000000000000000';
  var scaleValue = 0.8;

  medium_zoom = mediumZoom('[data-zoomable]', {
    background: getComputedStyle(document.documentElement)
        .getPropertyValue('--global-bg-color') + 'ee',  // + 'ee' for transparency.
  });

  medium_zoom.on('open', function(event) {
    try {
      // Access the zoomed image element directly using event.target.
      var zoomedElement = event.target;

      // Check if the zoomed element exists before setting the z-index.
      if (zoomedElement) {
        // Set the z-index for the zoomed image's parent container.
        zoomedElement.parentElement.style.zIndex = zIndexValue;

        // Set the z-index for the zoomed image.
        zoomedElement.style.zIndex = zIndexValue;
        zoomedElement.style.scale = scaleValue;
        // zoomedElement.style.transform = scaleValue;

        // Log a message to the console with the z-index and scale values.
        console.log('Zoom function is running with z-index:', zIndexValue, 'and scale:', scaleValue);
      } else {
        console.error('Error: zoomedElement is undefined.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  medium_zoom.on('close', function(event) {
    try {
      // Access the zoomed image element directly using event.target.
      var zoomedElement = event.target;

      // Check if the zoomed element exists before rescaling.
      if (zoomedElement) {
        // Rescale back to the original scale.
        zoomedElement.style.scale = 1.0;
      } else {
        console.error('Error: zoomedElement is undefined.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});
