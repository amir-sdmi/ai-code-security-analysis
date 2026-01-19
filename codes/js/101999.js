// Global array to store markers
var markers = [];
var map;
var cityNames = [];
var locations = [];
var descriptions = [];
var start_years = [];
var end_years = [];
var infoWindows = [];
var currentInfoWindow = null;
var linePaths = [];
var deceased = [];
var onPopupClose;
// Use the function to load a JSON file
var data;
document.addEventListener('DOMContentLoaded', function () {
	// The map may not load properly if the API key is invalid or the network is down, in which case 
	// the popup still has to be loaded
	initPopup();
	initInfoButton();
	initButton();
});
async function callback() {
	var urlParams = new URLSearchParams(window.location.search);
	name = urlParams.get('name');
	if (name != "null" && name != "") {
		document.getElementById('nameInput').value = name.replace("-", " ");
		openPopup("Waiting for AI to respond...", close = false);
		try {
			data = await askAI(name);
			closePopup();
            if(data === "") {
                throw "AI returned an empty response";
            }
			for (let [i, item] of data.entries()) {
				cityNames.push(item.city + ", " + item.country);
				var lat = parseInt(item.latitude);
				if (isNaN(lat)) throw "Invalid latitude";
				var lng = parseInt(item.longitude);
				if (isNaN(lng)) throw "Invalid longitude";
				locations.push({ lat: lat, lng: lng });
				descriptions.push(item.description);
				if (item.start_year == -1) {
					start_years.push(i == 0 ? 0 : data[i - 1].start_year);
				} else {
					start_years.push(parseInt(item.start_year));
				}
				if (item.end_year == -1) {
					end_years.push(i == 0 ? 0 : data[i - 1].end_year);
				} else {
					end_years.push(parseInt(item.end_year));
				}
				deceased.push(item.is_deceased == true || item.is_deceased == "true" || item.is_deceased == "1");
			}
		} catch (e) {
            onPopupClose = function(){
				const urlWithoutParams = window.location.href.split('?')[0];
				window.location.href = urlWithoutParams;
            }
			openPopup("Seems like AI didn't return a valid response, try another query.", close = true);
			return;
		}
	}
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: { lat: 23.5, lng: 116 },
		mapTypeControl: false, // Hide Map/Satellite toggle button
		streetViewControl: false, // Hide Street View button
		rotateControl: false, // Hide Rotate map control
	});
	if (name != "null" && name != "") {
		map.setCenter(locations[0]);
	}
	loadMarkers(locations);
	connectMarkers();
	loadSlider();
}
function initButton() {
	var nameButton = document.getElementById('nameButton');
	nameButton.addEventListener('click', function () {
		var nameInput = document.getElementById('nameInput');
		if (nameInput.value == "") {
			return;
		}
		var url = new URL(window.location.href);
		url.searchParams.set("name", nameInput.value.replace(" ", "-"));
		window.location.href = url.href;
	});
	var shuffleButton = document.getElementById('shuffleButton');
	shuffleButton.addEventListener('click', async function () {
		var response = await axios.post('random');
		console.log(response.data);
		var url = new URL(window.location.href);
		url.searchParams.set("name", response.data);
		window.location.href = url.href;
	});
}
function initInfoButton() {
	var infoButton = document.getElementById('infoButton');
	infoButton.addEventListener('click', function () {
		openPopup("Type in a historic figure's name and find out their footsteps, powered by ChatGPT.<br><br>\
			Tip: Searching for people in recent history (1800 onwards) seem to work better.<br><br>\
			Disclaimer: The only purpose of this site is visualization.\
			AI's answer may not be accurate, and should not be used as references.\
			", close = true);
	});
}
function initPopup() {
	// JavaScript
	var popup = document.getElementById('popup');
	var closeButton = popup.getElementsByClassName('popup-close')[0];

	// When the user clicks on <span> (x), close the popup
	closeButton.onclick = function () {
		closePopup();
	}

	window.onclick = function (event) {
		if (event.target == popup && event.target.classList.includes != "closable") {
			popup.classList.remove('show'); // Remove the 'show' class
		}
	}
}
function openPopup(text, close = true) {
	var popup = document.getElementById('popup');
	document.getElementById("popup-text").innerHTML = text;
	if (close) {
		document.getElementsByClassName('popup-close')[0].style.display = "block";
		popup.classList.add('closable');
	} else {
		popup.getElementsByClassName('popup-close')[0].style.display = "none";
		popup.classList.remove('closable');
	}
	popup.classList.add('show');
}
function closePopup() {
	var popup = document.getElementById('popup');
	popup.classList.remove('show');
    if(onPopupClose !== undefined){
        onPopupClose();
        onPopupClose = undefined;
    }
}
function loadMarkers() {
	for (var i = 0; i < locations.length; i++) {
		addMarker(i);
	}
}
function loadSlider() {
	var slider = document.getElementById('yearSlider');
	slider.min = start_years[0];
	slider.max = end_years[end_years.length - 1];
	slider.value = slider.min;
	var labelsContainer = document.getElementById('labelsContainer');
	var lastPos = -1000;
	var overlapThreshold = 5; // Adjust this value to control the minimum distance between labels
	for (var i = 0; i < locations.length; i++) {
		var pos = (start_years[i] - slider.min) / (slider.max - slider.min) * 100;
		if (pos - lastPos >= overlapThreshold) {
			var label = document.createElement('span');
			label.className = 'yearLabel';
			label.style.left = pos + '%';
			label.textContent = start_years[i];
			labelsContainer.appendChild(label);
			lastPos = pos;
		}
	}

	slider.addEventListener('input', function () {
		var sliderValue = this.value;
		var final = -1
		for (var i = 0; i < locations.length; i++) {
			if (start_years[i] <= sliderValue) {
				markers[i].setMap(map);
				if (i > 0) linePaths[i - 1].setMap(map);
				final = i;
			} else {
				markers[i].setMap(null);
				if (i > 0) linePaths[i - 1].setMap(null);
				infoWindows[i].close();
			}
		}
		for (var i = 0; i < locations.length; i++) {
			if (i == final) {
				if (infoWindows[i].getMap() == null)
					infoWindows[i].open(map, markers[i]);
			} else {
				infoWindows[i].close();
			}
		}
	});
}
function addMarker(i) {
	var marker;
	if (i == 0) {
		marker = new google.maps.Marker({
			position: locations[i],
			map: map,
			icon: {
				url: "image/baby.png",
				scaledSize: new google.maps.Size(40, 40)
			}
		});
	} else if (deceased[i] && i == locations.length - 1) {
		marker = new google.maps.Marker({
			position: locations[i],
			map: map,
			icon: {
				url: "image/tombstone.png",
				scaledSize: new google.maps.Size(40, 40)
			}
		});
	} else {
		marker = new google.maps.Marker({
			position: locations[i],
			map: map
		});
	}
	// Save the marker in the global array
	age = start_years[i] - start_years[0];
	var infowindow = new google.maps.InfoWindow({
		content: `  <div class="indoWindowContent">
							  <h3>${cityNames[i]}</h3>
							  <p>Years: ${start_years[i]} - ${end_years[i]}</p>
							  <p>Age: ${age}</p>
							  <p>${descriptions[i]}</p>
						</div>`
	});
	infoWindows.push(infowindow);
	marker.addListener('click', function () {
		// Close the current info window, if any
		if (currentInfoWindow) {
			currentInfoWindow.close();
		}

		// Open the clicked info window and set it as the current info window
		infowindow.open(map, marker);
		currentInfoWindow = infowindow;
	});

	// Close the info window when the user clicks elsewhere on the map
	map.addListener('click', function () {
		if (currentInfoWindow) {
			currentInfoWindow.close();
		}
	});

	markers.push(marker);
}
function connectMarkers() {
	var lineCoordinates = markers.map(function (marker) {
		return marker.getPosition();
	});
	for (var i = 0; i < locations.length - 1; i++) {
		var coordinatePair = [
			lineCoordinates[i],
			lineCoordinates[i + 1]
		];

		var linePath = new google.maps.Polyline({
			path: coordinatePair,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 0.6,
			strokeWeight: 2
		});

		linePath.setMap(map);
		linePaths.push(linePath);
	}
}
async function askAI(name) {
	var response = await axios.post('ask', {
		data: name
	})
	if(response.status != 200){
		throw "Failed to ask AI";
	}
	return response.data;
}
function handleMapLoadError() {
	openPopup("Failed to load Google Maps API. Please check your internet connection and try again.", close = true);
}