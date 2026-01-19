const axios = require('axios'); 
require('dotenv').config();      

const apiKey = process.env.OPENCAGE_API_KEY;

// getCoords(): partially written by ChatGPT
async function getCoords(zipCode, country='US') {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${zipCode}+${country}&key=${apiKey}`;
    
    try {
        const response = await axios.get(url);
        if (response.data.results.length > 0) {
            const result = response.data.results[0].geometry;
            //console.log(`Latitude: ${result.lat}, Longitude: ${result.lng}`);
            return result;
        } else {
            console.log("No results found.");
            return null;
        }
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// toRadians(): completely written by ChatGPT
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// haversine(): completely written by ChatGPT
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers. Use 3959 for miles

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers
    return distance;
}

async function getDistanceBetweenZips(zipCode1, zipCode2, country1='US', country2='US') { // zipcodes must be in string form
    let coords1 = await getCoords(zipCode1, country1);
    let coords2 = await getCoords(zipCode2, country2);
    let distance = haversine(coords1.lat, coords1.lng, coords2.lat, coords2.lng); // in kilometers (km)

    return distance;
} 

module.exports = getDistanceBetweenZips;