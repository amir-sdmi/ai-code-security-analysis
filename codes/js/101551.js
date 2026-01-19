
var weatherData; // This will hold the main data at the end.
var geoData;
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;


export async function fetchData(city,coords) {
  try {
    //from here, fetching longituded and latitude by city's name.
    if(coords === undefined) {
      console.log("coords are undifined")
    }
    let GEO_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${city},+91&limit=1&appid=${API_KEY}`;
    geoData = await (await fetch(GEO_API_URL)).json(); // fetch Call !!!

    // console.log(geoData);

    if (!geoData || geoData.length === 0) {
      //checking if data is fetched properly or not.
      console.log("city not found");
      return;
    }
    const { country, lat, lon, state } = geoData[0];
    try {
      const name = geoData[0].local_names.en;
    } catch (error) {
      console.log("city name not in english" + error);
    }

  




    //now fetching real weather data by using longitude and latitude from previous call.
    weatherData = await (
      await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      )
    ).json();

    if (!weatherData || weatherData.length === 0) {
      console.log(`we are having some issues on our side`);
      return;
    }

    const { sunrise, sunset } = weatherData.city;
    // console.log(weatherData)
  } catch (error) {
    console.log(`Error Detected ${error}`);
  }
  // console.log(weatherData);

  function formateWeatherData(weatherData) {
    const { name } = geoData[0];
    const {
      city: {
        coord: { lat, lon },
        country,
        sunrise,
        sunset,
        timezone,
      },
    } = weatherData;

    const {
      main: { temp, feels_like, humidity, pressure, temp_max, temp_min },
      wind: { speed },
      dt,
    } = weatherData.list[0];

    const { icon, main } = weatherData.list[0].weather[0];



    const forcast = [
      {
        temp : weatherData.list[1].main.temp,
        icon : weatherData.list[1].weather[0].icon,
        main: weatherData.list[1].weather[0].main
      },
      {
        temp : weatherData.list[2].main.temp,
        icon : weatherData.list[2].weather[0].icon,
        main: weatherData.list[2].weather[0].main
      },
      {
        temp : weatherData.list[3].main.temp,
        icon : weatherData.list[3].weather[0].icon,
        main: weatherData.list[3].weather[0].main
      },
      {
        temp : weatherData.list[4].main.temp,
        icon : weatherData.list[4].weather[0].icon,
        main: weatherData.list[4].weather[0].main
      },
      {
        temp : weatherData.list[5].main.temp,
        icon : weatherData.list[5].weather[0].icon,
        main: weatherData.list[5].weather[0].main
      }
    ];

    // console.log(weatherData);
    //********************************************************************************************** */
    // written by chatGPT from line 74 to line 88 this function converts 24hr time formate to 12hr 

    function convertToAMPM(timestamp) {
      const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
      let hours = date.getHours(); // Get hours (0-23)
      const minutes = date.getMinutes(); // Get minutes
      const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM or PM

      // Convert 24-hour format to 12-hour format
      hours = hours % 12 || 12;

      // Format minutes to always show two digits
      const formattedMinutes = minutes.toString().padStart(2, "0");

      // Return time in HH:MM AM/PM format
      return `${hours}:${formattedMinutes} ${ampm}`;
    }
    //****************************************************************************************************************** */
    let updatedsunrise = convertToAMPM(sunrise);
    let updatedsunset = convertToAMPM(sunset);

    return {
      lat,
      lon,
      country,
      name,
      updatedsunrise,
      updatedsunset,
      timezone,
      dt,
      temp,
      feels_like,
      humidity,
      pressure,
      temp_max,
      temp_min,
      speed,
      icon,
      main,
      forcast
    };
  }
  return formateWeatherData(weatherData); //finally returning the data. to JSX file
}
