import * as Location from "expo-location";
import googleConfig from "@/googlemapsEnv";


/***********************************************
* This was created with ChatGPT.
* I was feeding it random search results from Github and StackOverflow
* So not crafted by me alone, but slowly scraped together through my prompts :D!
************************************************/

// this has been made to try to match the expo-location city and country 

const fetchAddressWithGoogleAPI = async (
	location: Location.LocationObjectCoords
): Promise<Location.LocationGeocodedAddress[] | null> => {
	if (location) {
		const { latitude, longitude } = location;
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleConfig.API_KEY}`;

		try {
			const response = await fetch(url);

			if (response.ok) {
				const data = await response.json();

				console.log("Google Places API Response:", data);

				if (data.status === "OK" && data.results && data.results.length > 0) {
					const addressComponents = data.results[0].address_components;

					let city: string | null = null;
					let country: string | null = null;

					addressComponents.forEach((component: any) => {
						if (
							component.types.includes("locality") || 
							component.types.includes("postal_town") ||
							component.types.includes("sublocality") 
						) {
							city = city || component.long_name; 
						} else if (
							component.types.includes("administrative_area_level_2")
						) {
							city = city || component.long_name;
						} else if (
							component.types.includes("administrative_area_level_1")
						) {
							city = city || component.long_name;
						} else if (component.types.includes("country")) {
							country = component.long_name; 
						}
					});

					// Return array with the address object (city, country)
					return [
						{
							city: city,
							country: country,
							district: null,
							streetNumber: null,
							street: null,
							region: null,
							subregion: null,
							postalCode: null,
							name: null,
							isoCountryCode: null,
							timezone: null,
							formattedAddress: null,
						},
					];
				} else {
					console.warn("No address found or error occurred:", data.status);
					return null;
				}
			} else {
				console.error("Failed to fetch address. HTTP Status:", response.status);
				return null;
			}
		} catch (error) {
			console.error("Error fetching address on web:", error);
			return null;
		}
	}

	return null;
};

export default fetchAddressWithGoogleAPI;
