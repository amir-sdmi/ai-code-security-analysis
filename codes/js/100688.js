import { WeatherAPI } from "./WeatherApi";

//create new instance of the respective classes
const weatherAPIInstance = new WeatherAPI();

//add event listener to the form to get the location typed in by the user
document
  .getElementById("weatherForm")
  .addEventListener("submit", function (event) {
    // Prevent default form submission behavior
    event.preventDefault();

    // Get location input value
    const location = document.getElementById("locationInput").value;

    //call the weatherAPI method with the location as parameter
    weatherAPIInstance
      .getCurrentWeather(location)
      .then((data) => {
        console.log(data.current);
        console.log(data.location);
        //DOM Manipulation
        //Header
        const h1 = document.createElement("h1");
        h1.textContent = `This is the weather like in ${data.location.name}:`;
        document.body.appendChild(h1);
        //Temperature
        const p = document.createElement("p");
        p.textContent = `Temperature: ${data.current.temp_c}°C`;
        document.body.appendChild(p);
        //Temperature feels like
        const p1 = document.createElement("p");
        p1.textContent = `Feels like: ${data.current.feelslike_c}°C`;
        document.body.appendChild(p1);
        //Condition
        const p2 = document.createElement("p");
        p2.textContent = `Condition: ${data.current.condition.text}`;
        document.body.appendChild(p2);
        //Wind
        const p3 = document.createElement("p");
        p3.textContent = `Wind: ${data.current.wind_kph} kph`;
        document.body.appendChild(p3);
        //
        //Image
        const img = document.createElement("img");
        img.src = data.current.condition.icon;
        document.body.appendChild(img);
      })
      .catch((err) => {
        console.log(err);
      });
  });

//summary of the weather with ChatGPT API
