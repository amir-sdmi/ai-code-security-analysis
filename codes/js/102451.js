const apiKey = '162313a01ef4e4c6097184872641259a'; // Your API Key
let forecastData = [];
let unsortedForecastData = [];
let currentPage = 1;
const itemsPerPage = 10;

// New variables for chatbot
let chatbotCurrentWeather = null;
let chatbotForecastData = [];

let isCelsius = true; // Global variable to track the temperature unit

// Import Gemini API in script.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI model
const geminiAPIKey = "AIzaSyBDTGpzMbqUnfbP_bNIFKwKTvjEm9WzZn4";
const genAI = new GoogleGenerativeAI(geminiAPIKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

document.getElementById('dashboardButton').addEventListener('click', () => {
    document.getElementById('dashboardPage').style.display = 'block'; // Show the dashboard page
    document.getElementById('tablesPage').style.display = 'none'; // Hide the tables page
});

document.getElementById('tablesButton').addEventListener('click', () => {
    document.getElementById('dashboardPage').style.display = 'none'; // Hide the dashboard page
    document.getElementById('tablesPage').style.display = 'block'; // Show the tables page
});

// Helper function to capitalize the first letter of each word
function capitalizeFirstLetterOfEachWord(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Function to get current location weather
function getWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            chatbotCurrentWeather = data; // Save the current weather data for chatbot
            updateCurrentWeatherUI(data);
            get5DayForecast(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('Error fetching weather data, please try again.');
        });
}

// Function to update the UI for current weather
function updateCurrentWeatherUI(data, isCelsius = true) {
    const weatherElement = document.getElementById('weather');
    const description = capitalizeFirstLetterOfEachWord(data.weather[0].description);
    
    // Convert temperature based on the selected unit
    const tempKelvin = data.main.temp;
    const temp = isCelsius ? (tempKelvin - 273.15).toFixed(2) : ((tempKelvin - 273.15) * 9/5 + 32).toFixed(2);

    const windSpeed = data.wind.speed;
    const location = data.name;

    // Update the forecast heading
    const forecastHeading = document.querySelector('.forecast-container h3');
    forecastHeading.innerHTML = `5-Day Weather Forecast of ${location}`;

    // Get the icon code from the response
    const iconCode = data.weather[0].icon; // e.g., "01d"
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; // URL for the icon image

    // Set the background image for the current weather box
    const weatherBox = document.querySelector('.current-weather-box');
    weatherBox.style.backgroundImage = `url(${iconUrl})`;
    weatherBox.style.backgroundSize = '200px'; // Limit the size of the icon
    weatherBox.style.backgroundPosition = 'right 20px top 5px'; // Position the icon nicely
    weatherBox.style.backgroundRepeat = 'no-repeat'; // Prevent image repetition
    weatherBox.style.color = 'white'; // Change text color for visibility
    weatherBox.style.padding = '20px'; // Ensure content inside the box is well padded

    weatherElement.innerHTML = `
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Weather:</strong> ${description}</p>
        <p><strong>Temperature:</strong> ${temp} °${isCelsius ? 'C' : 'F'}</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
    `;
}

// Function to get 5-day forecast
function get5DayForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            forecastData = data.list;
            unsortedForecastData = [...forecastData]; // Save a copy of the original data
            chatbotForecastData = [...forecastData]; // Store forecast data for chatbot
            displayForecast(currentPage);

            // Calculate daily averages
            const averageTemperatures = calculateDailyAverages(forecastData);

            // Create Bar Chart with average temperatures
            createBarChart(averageTemperatures);

            // Create Doughnut Chart with weather conditions
            createDoughnutChart(forecastData);

            // Create Line Chart with average temperatures
            createLineChart(averageTemperatures);
        })
        .catch(error => {
            console.error('Error fetching forecast data:', error);
        });
}

// Function to display forecast with boxes instead of table
function displayForecast(page, isCelsius = true) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const forecastGrid = document.getElementById('forecastGrid'); // Make sure this element exists
    forecastGrid.innerHTML = ''; // Clear previous data

    const paginatedData = forecastData.slice(start, end);
    paginatedData.forEach(entry => {
        const date = new Date(entry.dt * 1000); // Convert Unix timestamp to Date object
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedDate = date.toLocaleString('en-PK', options).replace(',', ''); // Format to "DD-MM-YYYY HH:MM AM"
        
        const description = capitalizeFirstLetterOfEachWord(entry.weather[0].description);
        
        // Convert temperature based on the selected unit
        const tempKelvin = entry.main.temp;
        const temp = isCelsius ? (tempKelvin - 273.15).toFixed(2) : ((tempKelvin - 273.15) * 9/5 + 32).toFixed(2);

        const windSpeed = entry.wind.speed;

        // Get the weather icon from the API
        const iconCode = entry.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        // Create forecast box structure
        const box = document.createElement('div');
        box.classList.add('forecast-box');
        box.innerHTML = `
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Weather:</strong> ${description}</p>
            <p><strong>Temperature:</strong> ${temp} °${isCelsius ? 'C' : 'F'}</p>
            <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
            <img src="${iconUrl}" class="forecast-icon" alt="Weather Icon">
        `;

        // Append the forecast box to the grid
        forecastGrid.appendChild(box);
    });

    // Update pagination buttons
    document.getElementById('pageInfo').textContent = `Page ${page}`;
    document.getElementById('prevBtn').disabled = page === 1;
    document.getElementById('nextBtn').disabled = end >= forecastData.length;
}

// Pagination button event listeners
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage * itemsPerPage < forecastData.length) {
        currentPage++;
        displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
    }
});

// Event listener for the sorting forecast boxes in ascending order
document.getElementById('ascendingButton').addEventListener('click', () => {
    // Sort the forecast data in ascending order by temperature
    forecastData.sort((a, b) => a.main.temp - b.main.temp);
    
    // Reset to page 1 when the forecast is sorted
    currentPage = 1; 
    
    // Display the forecast in ascending order
    displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
});

// Event listener for the sorting forecast boxes in descending order
document.getElementById('descendingButton').addEventListener('click', () => {
    // Sort the forecast data in descending order by temperature
    forecastData.sort((a, b) => b.main.temp - a.main.temp);
    
    // Reset to page 1 when the forecast is sorted
    currentPage = 1; 
    
    // Display the forecast in descending order
    displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
});

// Event listener for the filtering rainy days in the forecast
document.getElementById('filterRainyDaysButton').addEventListener('click', () => {
    // Filter the forecast data for rainy days
    const rainyDays = forecastData.filter(entry => {
        const description = entry.weather[0].description.toLowerCase();
        return description.includes('rain') && !description.includes('thunderstorm') && !description.includes('drizzle');
    });
    
    // If there are rainy days, display them, otherwise show a message
    if (rainyDays.length > 0) {
        forecastData = rainyDays; // Update the forecastData with only rainy entries
        currentPage = 1; // Reset to the first page
        displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
    } else {
        alert('No rainy days found in the forecast.');
    }
});

document.getElementById('highestTempButton').addEventListener('click', () => {
    // Use the reduce() method to find the entry with the highest temperature.
    const highestTemp = forecastData.reduce((acc, entry) => {
        return entry.main.temp > acc.main.temp ? entry : acc;
    });

    // Display the entry with the highest temperature
    forecastData = [highestTemp]; // Update the forecastData with only the highest temperature entry
    currentPage = 1; // Reset to the first page

    // Display the forecast with the highest temperature
    displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
});

// Event listener for the reseting forecast boxes in default order
document.getElementById('resetButton').addEventListener('click', () => {
    // Reset the forecast data to the original order
    forecastData = [...unsortedForecastData];
    
    // Reset to page 1 when the forecast is reset
    currentPage = 1; 
    
    // Display the forecast in default order
    displayForecast(currentPage, isCelsius); // Use the global temperature unit variable
});

// Get current location and load weather
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeather(lat, lon);
            },
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

document.getElementById('searchButton').addEventListener('click', searchWeather);

// Function to search weather by city name (fallback or on-demand)
function searchWeather() {
    const city = document.getElementById('cityInput').value;
    if (city) {
        currentPage = 1; // Reset to page 1 when a new city is searched
        getWeatherByCity(city);
    } else {
        alert('Please enter a city name.');
    }
}

document.getElementById('searchButton2').addEventListener('click', searchWeather2);

// Function to search weather by city name (fallback or on-demand)
function searchWeather2() {
    const city = document.getElementById('cityInput2').value;
    if (city) {
        currentPage = 1; // Reset to page 1 when a new city is searched
        getWeatherByCity(city);
    } else {
        alert('Please enter a city name.');
    }
}

// Function to get weather data using city name
function getWeatherByCity(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            chatbotCurrentWeather = data; // Save the current weather data for chatbots
            updateCurrentWeatherUI(data);
            get5DayForecast(data.coord.lat, data.coord.lon);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('City not found! Please try again.');
        });
}

// Call the function to get the location when the page loads
window.onload = function() {
    getLocation();
};

// Add an event listener to the input field for the Enter key
document.getElementById('cityInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchWeather(); // Call the searchWeather function when Enter is pressed
    }
});

// Add an event listener to the input field for the Enter key
document.getElementById('cityInput2').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchWeather2(); // Call the searchWeather function when Enter is pressed
    }
});

// Function to group forecast data by day and calculate the average temperature
function calculateDailyAverages(forecastData) {
    const dailyTemperatures = {};
    const dailyCount = {};

    // Group temperatures by day
    forecastData.forEach(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const tempCelsius = entry.main.temp - 273.15; // Convert from Kelvin to Celsius

        if (!dailyTemperatures[date]) {
            dailyTemperatures[date] = 0;
            dailyCount[date] = 0;
        }
        dailyTemperatures[date] += tempCelsius;
        dailyCount[date] += 1;
    });

    // Calculate average for each day
    const averageTemperatures = Object.keys(dailyTemperatures).map(date => ({
        date: date,
        avgTemp: (dailyTemperatures[date] / dailyCount[date]).toFixed(2)
    }));

    // Ensure we return at least 6 days
    return averageTemperatures.slice(0, 6); // Now returning the first 6 days, not just 5
}

// Function to create Bar Chart with average temperatures for the next 5 days
function createBarChart(averageTemperatures) {
    // Clear the existing chart if it exists
    const existingChart = Chart.getChart('barChart'); // Assuming 'barChart' is the ID of your canvas element
    if (existingChart) {
        existingChart.destroy();
    }

    // Now we slice to get up to 6 days instead of 5
    const limitedDays = averageTemperatures.slice(0, 6); 

    const labels = limitedDays.map(day => {
        const dateParts = day.date.split('/'); // Split date string into components
        return `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`; // Reformat as DD/MM/YYYY
    });

    const data = limitedDays.map(day => day.avgTemp);

    const barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: labels, // Formatted as DD/MM/YYYY
            datasets: [{
                label: 'Average Temperature (°C)',
                data: data,
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,

            scales: {
                y: {
                    beginAtZero: true,
                    min: Math.min(...data) - 5,  // Setting a lower minimum value
                    max: Math.max(...data) + 5   // Setting a higher maximum value
                }
            },
            animation: {
                delay: 500
            }
        }
    });
}

// Function to create Doughnut Chart
function createDoughnutChart(forecastData) {
    // Clear the existing chart if it exists
    const existingChart = Chart.getChart('doughnutChart'); // Assuming 'doughnutChart' is the ID of your canvas element
    if (existingChart) {
        existingChart.destroy();
    }

    const forecastDays = forecastData.slice(0, 40); // Data for 5 days (3-hour intervals)

    // Create a map to group weather conditions by date
    const weatherByDate = {};

    forecastDays.forEach(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString(); // Get the date (MM/DD/YYYY)
        const description = entry.weather[0].description.toLowerCase(); // Get the detailed description
        
        // Classify each description into the generic weather condition
        let genericCondition = '';

        if (description.includes('clear')) {
            genericCondition = 'Clear';
        } else if (description.includes('cloud')) {
            genericCondition = 'Clouds';
        } else if (description.includes('rain') && !description.includes('thunderstorm') && !description.includes('drizzle')) {
            genericCondition = 'Rain';
        } else if (description.includes('thunderstorm')) {
            genericCondition = 'Thunderstorm';
        } else if (description.includes('drizzle')) {
            genericCondition = 'Drizzle';
        } else if (description.includes('snow') || description.includes('sleet')) {
            genericCondition = 'Snow';
        } else if (description.includes('mist') || description.includes('fog') || description.includes('haze')) {
            genericCondition = 'Mist/Fog';
        } else if (description.includes('dust') || description.includes('sand')) {
            genericCondition = 'Dust/Sand';
        } else if (description.includes('smoke')) {
            genericCondition = 'Smoke';
        } else if (description.includes('volcanic ash')) {
            genericCondition = 'Volcanic Ash';
        } else if (description.includes('squall')) {
            genericCondition = 'Squall';
        } else if (description.includes('tornado')) {
            genericCondition = 'Tornado';
        }

        // Initialize the object for this date if it doesn't exist
        if (!weatherByDate[date]) {
            weatherByDate[date] = {};
        }

        // Count occurrences of each generic weather condition
        if (genericCondition) {
            if (weatherByDate[date][genericCondition]) {
                weatherByDate[date][genericCondition]++;
            } else {
                weatherByDate[date][genericCondition] = 1;
            }
        }
    });

    // Create a map to count the occurrences of each weather condition across all days
    const weatherConditionCounts = {};

    for (const date in weatherByDate) {
        const conditions = weatherByDate[date];
        const conditionEntries = Object.entries(conditions); // Array of [condition, count]

        // Sort by count, descending, to find the most frequent condition(s)
        conditionEntries.sort((a, b) => b[1] - a[1]);

        // The most frequent count for the day
        const highestCount = conditionEntries[0][1];

        // Increment counts for conditions that have the highest frequency
        conditionEntries.forEach(([condition, count]) => {
            if (count === highestCount) {
                if (weatherConditionCounts[condition]) {
                    weatherConditionCounts[condition]++;
                } else {
                    weatherConditionCounts[condition] = 1;
                }
            }
        });
    }

    // Prepare data for the chart
    const weatherConditions = Object.keys(weatherConditionCounts); // Weather conditions as labels
    const conditionCounts = Object.values(weatherConditionCounts); // Counts for each condition

    // Calculate the total entries for percentage calculation
    const totalEntries = Object.values(weatherConditionCounts).reduce((a, b) => a + b, 0);

    // Calculate the percentages
    const conditionPercentages = conditionCounts.map(count => ((count / totalEntries) * 100).toFixed(2));

    // Create the doughnut chart
    const doughnutChart = new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: weatherConditions, // Weather conditions as labels
            datasets: [{
                label: 'Weather Conditions (%)',
                data: conditionPercentages, // Percentages for each condition
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',   // Color for Clear
                    'rgba(54, 162, 235, 0.6)',   // Color for Clouds
                    'rgba(75, 192, 192, 0.6)',   // Color for Rain
                    'rgba(255, 206, 86, 0.6)',   // Color for Drizzle
                    'rgba(153, 102, 255, 0.6)',  // Color for Thunderstorm
                    'rgba(255, 159, 64, 0.6)',   // Color for Snow
                    'rgba(201, 203, 207, 0.6)',  // Color for Mist/Fog
                    'rgba(160, 82, 45, 0.6)',    // Color for Dust/Sand
                    'rgba(70, 130, 180, 0.6)',   // Color for Smoke
                    'rgba(105, 105, 105, 0.6)',  // Color for Volcanic Ash
                    'rgba(0, 191, 255, 0.6)',    // Color for Squall
                    'rgba(255, 0, 0, 0.6)'       // Color for Tornado
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)',
                    'rgba(160, 82, 45, 1)',
                    'rgba(70, 130, 180, 1)',
                    'rgba(105, 105, 105, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(255, 0, 0, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                delay: 500 // Delay animation for smooth effect
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top', // Legend position
                },
            }
        }
    });
}

function createLineChart(averageTemperatures) {
    // Clear the existing chart if it exists
    const existingChart = Chart.getChart('lineChart'); // Assuming 'lineChart' is the ID of your canvas element
    if (existingChart) {
        existingChart.destroy();
    }

    // Prepare labels and data for the line chart
    const labels = averageTemperatures.map(day => {
        const dateParts = day.date.split('/'); // Split date string into components
        return `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`; // Reformat as DD/MM/YYYY
    });

    const data = averageTemperatures.map(day => day.avgTemp);

    // Create the line chart
    const lineChart = new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: labels, // Formatted as DD/MM/YYYY
            datasets: [{
                label: 'Temperature (°C)',
                data: data,
                fill: false,
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                tension: 0.1 // Smooth the line
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            
            scales: {
                y: {
                    beginAtZero: true,
                    min: Math.min(...data) - 5, // Set a lower minimum value
                    max: Math.max(...data) + 5 // Set a higher maximum value
                }
            },
            animation: {
                onProgress: function(animation) {
                    this.chartArea.bottom += 5; // Drop effect
                },
                onComplete: function() {
                    this.chartArea.bottom = this.chartArea.bottom; // Reset position after animation
                }
            }
        }
    });
}

// Add the chatbot functions to the existing script

// Function to handle chatbot input and send response
async function handleUserInput(input) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'user-message'; // Set class for user message
    userMessageElement.textContent = `${input}`;
    messagesContainer.appendChild(userMessageElement);

    // Check for weather-related queries
    if (input.toLowerCase().includes('weather') || input.toLowerCase().includes('forecast')) {
        const weatherResponse = handleWeatherQuery(input);  // Call the weather query handler
        sendChatbotResponse(weatherResponse);
    } else {
        // Use Gemini API for non-weather queries
        const result = await model.generateContent(input);
        sendChatbotResponse(result.response.text());
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle Weather Queries in Chatbot
function handleWeatherQuery(input) {
    if (!chatbotCurrentWeather || !chatbotForecastData || chatbotForecastData.length === 0) {
        return "I don't have any weather data at the moment. Try searching for a city first.";
    }

    input = input.toLowerCase();

    if (input.includes('current temperature') || input.includes('temperature now')) {
        return `The current temperature is ${(chatbotCurrentWeather.main.temp - 273.15).toFixed(2)}°C.`;
    }

    if (input.includes('highest temperature') || input.includes('max temperature')) {
        const highestTemp = Math.max(...chatbotForecastData.map(entry => entry.main.temp));
        return `The highest forecasted temperature is ${(highestTemp - 273.15).toFixed(2)}°C.`;
    }

    if (input.includes('lowest temperature') || input.includes('min temperature')) {
        const lowestTemp = Math.min(...chatbotForecastData.map(entry => entry.main.temp));
        return `The lowest forecasted temperature is ${(lowestTemp - 273.15).toFixed(2)}°C.`;
    }

    if (input.includes('wind speed')) {
        return `The current wind speed is ${chatbotCurrentWeather.wind.speed} m/s.`;
    }

    if (input.includes('weather now') || input.includes('current weather')) {
        const description = chatbotCurrentWeather.weather[0].description;
        return `The current weather is ${description}, with a temperature of ${(chatbotCurrentWeather.main.temp - 273.15).toFixed(2)}°C.`;
    }

    if (input.includes('forecast')) {
        const tomorrow = chatbotForecastData[8]; // Assuming 3-hour intervals, index 8 is 24 hours from now
        return `Tomorrow's forecast: ${tomorrow.weather[0].description} with a temperature of ${(tomorrow.main.temp - 273.15).toFixed(2)}°C.`;
    }

    // If it's not a specific weather query, return null
    return null;
}

// Function to send chatbot response to UI
function sendChatbotResponse(message) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chatbot-message'; // Set class for bot response
    messageElement.textContent = `${message}`;
    messagesContainer.appendChild(messageElement);
    
    // Add a line break after the message
    messagesContainer.appendChild(document.createElement('br'));
}

// Event Listeners for Chatbot
document.addEventListener('DOMContentLoaded', (event) => {
    const sendButton = document.getElementById('sendChatButton');
    const chatInput = document.getElementById('chatInput');

    if (sendButton && chatInput) {
        sendButton.addEventListener('click', () => {
            const input = chatInput.value;
            handleUserInput(input);
            chatInput.value = ''; // Clear input field
        });

        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                const input = chatInput.value;
                handleUserInput(input);
                chatInput.value = ''; // Clear input field
            }
        });
    }
});

// Event listener for the toggle switch
document.getElementById('unit-toggle').addEventListener('change', function() {
    const currentWeatherData = chatbotCurrentWeather; // Get current weather data
    if (currentWeatherData) {
        // Get the temperature unit based on the toggle state
        const isCelsius = this.checked; // true if Celsius, false if Fahrenheit

        // Update the current weather UI
        updateCurrentWeatherUI(currentWeatherData, isCelsius);
    }
});

// Event listener for the toggle switch on the tables page
document.getElementById('unit-toggle2').addEventListener('change', function() {
    isCelsius = this.checked; // true if Celsius, false if Fahrenheit

    // Update the forecast display based on the selected unit
    displayForecast(currentPage, isCelsius);
});
