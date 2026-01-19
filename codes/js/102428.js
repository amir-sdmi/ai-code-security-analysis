// const GAMINI_API_KEY = "AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw";
// const GAMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

// export const rankScrapersWithGamini = async (scrapers, city, state) => {
//   const dynamicPrompt = `
//     Rank the following scrap dealers based on their proximity and relevance to the location: ${city}, ${state}.
//     Scrap dealers:
//     ${scrapers
//       .map(
//         (scraper, index) =>
//           `${index + 1}. ${scraper.name} - Address: ${scraper.shop_address}`
//       )
//       .join("\n")}
//     Return the ranked list in the same order as provided, with the most relevant first.`;

//   try {
//     const response = await fetch(`${GAMINI_API_URL}${GAMINI_API_KEY}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         prompt: dynamicPrompt,
//         maxTokens: 500,
//       }),
//     });

//     const result = await response.json();
//     log("Gamini Response:", result);

//     // Extract ranked list from Gamini's response
//     const rankedScrapers = result.candidates?.[0]?.content
//       ?.split("\n")
//       .map((line) => {
//         const match = line.match(/^\d+\.\s(.+?)\s-\sAddress:/);
//         return match ? match[1] : null;
//       })
//       .filter(Boolean);

//     // Map the ranked names back to scraper objects
//     return scrapers.filter((scraper) =>
//       rankedScrapers.includes(scraper.name)
//     );
//   } catch (error) {
//     console.error("Error ranking scrapers with Gamini:", error);
//     return scrapers; // Fallback to unsorted scrapers
//   }
// };




// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI("AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw");

// export const findNearestScrapersWithGamini = async (city, state) => {
//   const dynamicPrompt = `You are an expert assistant helping users find active scrap dealers who **BUY** scrap materials from individuals. 

//   ## Task:
//   Find only **active and legitimate scrap dealers** in or near **${city}, ${state}** who **BUY** scrap materials from sellers.  
//   **Exclude:** 
//   - Dealers who **only sell scrap** or act as middlemen without purchasing directly.
//   - Recyclers or large industries that do **not buy from individuals**.
//   - Inactive or permanently closed businesses.
  
//   ### **Distance & Accessibility Constraint:**
//   - The scrap dealers must be **within 2-3 km** or **reachable in 10-15 minutes** by local transport.
//   - If no relevant dealers are found, return an **empty array []**`;
  
  

//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const result = await model.generateContent(dynamicPrompt);

//     // Retrieve raw response text
//     const rawText = await result.response.text();

//     // Remove backticks and sanitize the response
//     const sanitizedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

//     log("Sanitized Response Text:", sanitizedText);

//     // Parse the sanitized response text
//     const rankedScrapers = sanitizedText.startsWith("[")
//       ? JSON.parse(sanitizedText)
//       : []; // Fallback to an empty array if parsing fails

//     log("Ranked Scrapers:", rankedScrapers);
//     return rankedScrapers;
//   } catch (error) {
//     console.error("Error in Gamini API request:", error);
//     return [];
//   }
// };





// import axios from "axios";

// const GAMINI_API_KEY = "AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw";
// const GAMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GAMINI_API_KEY}`;

// /**
//  * Fetch nearby scrapers within a 4-5 km radius using Gamini API.
//  * @param {string} city - The city of the user.
//  * @param {string} state - The state of the user.
//  * @returns {Promise<Array>} - Returns an array of nearby scrapers.
//  */
// export const fetchNearbyScrapersWithGamini = async (city, state) => {
//   if (!city || !state) {
//     console.error("City and state are required to fetch nearby scrapers.");
//     return [];
//   }

//   const prompt = `
//   You are an expert in geospatial analysis and a local marketplace advisor. Your task is to identify the **5 nearest scrap dealers** located within a **4-5 km radius** of the following location: **${city}, ${state}, India**.

//   ### Requirements:
//   1. Focus only on scrap dealers **within 2-3 km** of the specified location.
//   2. Ensure consistency: The result for repeated queries with the same location should not change.
//   3. Provide results in **structured JSON format** with the following fields:
//      - **name**: Name of the scrap dealer.
//      - **shop_address**: Complete address of the shop (including city, state, and postal code).
//      - **contact_number**: Phone number of the scrap dealer (if available).

//   ### Additional Instructions:
//   - If no scrap dealers are found within the radius, return an **empty array** in JSON format.
//   - Respond only with the **JSON output**, and do not include any additional text or comments.

//   ### Example JSON Output:
//   [
//     {
//       "name": "Goyal Scrap Dealer",
//       "shop_address": "56, Saket Nagar, Indore, Madhya Pradesh 452018, India",
//       "contact_number": "+91 94256 67890"
//     },
//     {
//       "name": "Jain Scrap Mart",
//       "shop_address": "101, New Palasia, Opposite Nehru Park, Indore, Madhya Pradesh 452001, India",
//       "contact_number": "+91 99266 54321"
//     }
//   ]
//   `;

//   const requestBody = {
//     contents: [
//       {
//         role: "user",
//         parts: [{ text: prompt }],
//       },
//     ],
//   };

//   try {
//     const response = await axios.post(GAMINI_API_URL, requestBody, {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     log("Raw Gamini API Response:", response.data);

//     const candidateText = response.data.candidates[0]?.content?.parts?.[0]?.text?.trim();
//     log("Extracted Response Text:", candidateText);

//     // Remove any triple backticks from the response
//     const sanitizedText = candidateText.replace(/```json|```/g, "").trim();
//     log("Sanitized JSON Response:", sanitizedText);

//     // Parse the sanitized JSON text
//     let scrapersList = [];
//     try {
//       scrapersList = JSON.parse(sanitizedText);
//       if (!Array.isArray(scrapersList)) {
//         console.error("Parsed data is not an array:", scrapersList);
//         return [];
//       }
//     } catch (jsonError) {
//       console.error("Error parsing Gamini JSON response:", jsonError);
//       return [];
//     }

//     log("Final Nearby Scrapers List:", scrapersList);
//     return scrapersList;
//   } catch (error) {
//     console.error("Error fetching nearby scrapers from Gamini API:", error);
//     return [];
//   }
// };




// Import Firebase modules
// Import Firebase modules
import { db } from "../firebaseConfig"; 
import { collection, getDocs, doc, getDoc } from "firebase/firestore"; 
import { log } from "./log";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gamini API Constants
const GAMINI_API_KEY = "AIzaSyCLYSE-DC6RTRS8Pa58NX_Zz2q-5wZdbpw";
const GAMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GAMINI_API_KEY}`;

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GAMINI_API_KEY);

/**
 * Fetch nearby scrapers within a 4-5 km radius using Gemini API.
 * @param {string} city - The city of the user.
 * @param {string} state - The state of the user.
 * @returns {Promise<Array>} - Returns an array of nearby scrapers.
 */
export const fetchNearbyScrapersWithGamini = async (city, state) => {
  if (!city || !state) {
    console.error("City and state are required to fetch nearby scrapers.");
    return [];
  }

  // Add the demo scraper that should always be visible
  const demoScraper = {
    id: "XJuY6X93iFP1pKMBPnjRS6Eo7gj1", // Adding the ID from Firebase
    name: "Demoscraper",
    shop_address: "Rajwada",
    contact_number: "9755421622",
    email: "demoscraper@gmail.com"
  };

  const prompt = `
  You are an expert in geospatial analysis and a local marketplace advisor. Your task is to identify the **5 nearest scrap dealers** located within a **4-5 km radius** of the following location: **${city}, ${state}, India**.

  ### Requirements:
  1. Focus only on scrap dealers **within 4-5 km** of the specified location.
  2. Ensure consistency: The result for repeated queries with the same location should not change.
  3. Provide results in **structured JSON format** with the following fields:
     - **name**: Name of the scrap dealer.
     - **shop_address**: Complete address of the shop (including city, state, and postal code).
     - **contact_number**: Phone number of the scrap dealer (if available).

  ### Additional Instructions:
  - If no scrap dealers are found within the radius, return an **empty array** in JSON format.
  - Respond only with the **JSON output**, and do not include any additional text or comments.

  ### Example JSON Output:
  [
    {
      "name": "Goyal Scrap Dealer",
      "shop_address": "56, Saket Nagar, Indore, Madhya Pradesh 452018, India",
      "contact_number": "+91 94256 67890"
    },
    {
      "name": "Jain Scrap Mart",
      "shop_address": "101, New Palasia, Opposite Nehru Park, Indore, Madhya Pradesh 452001, India",
      "contact_number": "+91 99266 54321"
    }
  ]
  `;

  try {
    const response = await axios.post(GAMINI_API_URL, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.candidates[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Remove any triple backticks from the response
    const sanitizedText = text.replace(/```json|```/g, "").trim();

    // Parse the sanitized JSON text
    let scrapersList = [];
    try {
      scrapersList = JSON.parse(sanitizedText);
      if (!Array.isArray(scrapersList)) {
        console.error("Parsed data is not an array:", scrapersList);
        return [demoScraper]; // Return only demo scraper if parsing fails
      }
    } catch (jsonError) {
      console.error("Error parsing Gemini JSON response:", jsonError);
      return [demoScraper]; // Return only demo scraper if parsing fails
    }

    // Add the demo scraper to the beginning of the list
    scrapersList.unshift(demoScraper);

    log("Final Nearby Scrapers List:", scrapersList);
    return scrapersList;
  } catch (error) {
    console.error("Error fetching nearby scrapers from Gemini API:", error);
    return [demoScraper]; // Return only demo scraper if API call fails
  }
};

/**
 * Fetch current scrap rates for Indore, Madhya Pradesh market
 * @returns {Promise<Array>} - Returns an array of scrap rates
 */
export const fetchScrapRatesWithGamini = async () => {
  const prompt = `
  You are a market research expert specializing in scrap material prices in Indore, Madhya Pradesh, India.
  Provide the CURRENT market rates for different types of scrap materials.

  ### Requirements:
  1. Focus on scrap rates specifically for Indore, Madhya Pradesh market
  2. Provide rates in INR per kg
  3. Include rates for these categories:
     - Metal (Iron, Aluminum, Copper, Brass)
     - Paper
     - Plastic
     - Cardboard
     - Glass
     - Electronics
     - Textiles
     - Wood
     - Rubber
     - Batteries

  ### Response Format:
  Return ONLY a JSON array with this structure:
  [
    {
      "category": "Metal",
      "subcategory": "Iron",
      "rate": "32",
      "unit": "per kg",
      "trend": "stable",
      "last_updated": "2024-03"
    }
  ]

  Note: Rates should be realistic for the Indore market. If exact rates aren't available, provide approximate rates based on market trends.`;

  try {
    const response = await axios.post(GAMINI_API_URL, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.candidates[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Remove any triple backticks from the response
    const sanitizedText = text.replace(/```json|```/g, "").trim();

    // Parse the sanitized JSON text
    let ratesList = [];
    try {
      ratesList = JSON.parse(sanitizedText);
      if (!Array.isArray(ratesList)) {
        console.error("Parsed data is not an array:", ratesList);
        return [];
      }
    } catch (jsonError) {
      console.error("Error parsing Gemini JSON response:", jsonError);
      return [];
    }

    log("Final Scrap Rates List:", ratesList);
    return ratesList;
  } catch (error) {
    console.error("Error fetching scrap rates from Gemini API:", error);
    return [];
  }
};







// import { GoogleGenerativeAI } from "@google/generative-ai";
// import axios from "axios";

// const genAI = new GoogleGenerativeAI("AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw"); // Replace with your actual API key
// const GOOGLE_MAPS_API_KEY = "AIzaSyCcenVOKOAhHj0DO_JmR_bocN9FEebP74M"; // Replace with your actual API key

// export const findNearestScrapersWithGamini = async (userLat, userLng) => {
//   try {
//     log("🔹 Fetching real-time scrap dealers from Google Maps...");

//     // 🔹 Step 1: Use Google Places API to find scrap dealers
//     const googleMapsResponse = await axios.get(
//       `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
//       {
//         params: {
//           location: `${userLat},${userLng}`, // User's exact location
//           radius: 5000, // 5 km radius
//           keyword: "scrap dealer",
//           type: "store",
//           key: GOOGLE_MAPS_API_KEY,
//         },
//       }
//     );

//     const places = googleMapsResponse.data.results;

//     if (!places || places.length === 0) {
//       console.warn("⚠️ No nearby scrapers found via Google Maps API.");
//       return [];
//     }

//     log(`✅ Found ${places.length} scrap dealers via Google Maps.`);

//     // 🔹 Step 2: Extract and refine Google Maps data
//     const scraperDetails = await Promise.all(
//       places.map(async (place) => {
//         let phoneNumber = "No contact available";

//         // Fetch additional details to get the phone number
//         try {
//           const detailsResponse = await axios.get(
//             `https://maps.googleapis.com/maps/api/place/details/json`,
//             {
//               params: {
//                 place_id: place.place_id,
//                 fields: "name,vicinity,formatted_phone_number,rating",
//                 key: GOOGLE_MAPS_API_KEY,
//               },
//             }
//           );

//           if (detailsResponse.data.result.formatted_phone_number) {
//             phoneNumber = detailsResponse.data.result.formatted_phone_number;
//           }
// } catch (error) {
//   console.warn("⚠️ AI Response JSON Parsing Failed. Using Google Data.", error);
//   rankedScrapers = scraperDetails.slice(0, 5);
// }


//         return {
//           name: place.name,
//           shop_address: place.vicinity || "Address not available",
//           contact_number: phoneNumber,
//           rating: place.rating || "N/A",
//         };
//       })
//     );

//     // 🔹 Step 3: Use Gemini AI to refine and rank the best scrapers
//     log("🔹 Sending scraper details to Gemini AI for ranking...");

//     const dynamicPrompt = `
//       Rank the following scrap dealers based on:
//       - **Proximity to the user's location** (top priority)
//       - **Best ratings** (if available)
//       - **Highest reliability for buying scrap**
      
//       **Return only the top 5 scrapers in JSON format.**
      
//       Input JSON:
//       ${JSON.stringify(scraperDetails)}

//       Output JSON (max 5 scrapers):
//       [
//         {
//           "name": "Scraper Name",
//           "shop_address": "Shop Address",
//           "contact_number": "Contact Number",
//           "rating": "Rating"
//         }
//       ]
//     `;

//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const geminiResult = await model.generateContent(dynamicPrompt);

//     // 🔹 Extract AI response
//     const rawText = await geminiResult.response.text();
//     log("🔹 Raw Gemini AI Response:", rawText);

//     // 🔹 Step 4: Clean & Parse JSON Response
//     const sanitizedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
//     let rankedScrapers = [];

//     try {
//       rankedScrapers = JSON.parse(sanitizedText);
//     } catch (error) {
//       console.error("❌ Error in `findNearestScrapersWithGamini`:", error);
//       return [];
//     }
    

//     log("✅ Final Ranked Scrapers:", rankedScrapers);
//     return rankedScrapers;
//   } catch (error) {
//     console.error("❌ Error in `findNearestScrapersWithGamini`:", error);
//     return [];
//   }
// };



// import { GoogleGenerativeAI } from "@google/generative-ai";
// import axios from "axios";

// const genAI = new GoogleGenerativeAI("AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw"); // Replace with your Gemini AI key
// const GOOGLE_MAPS_API_KEY = "AIzaSyCcenVOKOAhHj0DO_JmR_bocN9FEebP74M"; // Replace with your Google Maps API key

// // 🔹 Fetch nearby scrap dealers using Google Maps API
// export const findScrapersFromGoogleMaps = async (userLat, userLng) => {
//   try {
//     log("📍 Fetching nearby scrap dealers from Google Maps...");

//     const googleMapsResponse = await axios.get(
//       `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
//       {
//         params: {
//           location: `${userLat},${userLng}`, // User's latitude & longitude
//           radius: 5000, // Search within 5 km
//           keyword: "scrap dealer", // Search keyword
//           type: "store", // Google Maps place type
//           key: GOOGLE_MAPS_API_KEY,
//         },
//       }
//     );

//     const places = googleMapsResponse.data.results;

//     if (!places || places.length === 0) {
//       console.warn("⚠️ No nearby scrapers found in Google Maps API.");
//       return [];
//     }

//     log(`✅ Found ${places.length} scrap dealers via Google Maps.`);

//     // Extract relevant details from Google API response
//     return places.map((place) => ({
//       name: place.name,
//       shop_address: place.vicinity || "Address not available",
//       contact_number: place.formatted_phone_number || "No contact available",
//       rating: place.rating || "N/A",
//       latitude: place.geometry?.location?.lat,
//       longitude: place.geometry?.location?.lng,
//     }));
//   } catch (error) {
//     console.error("❌ Error in Google Maps API request:", error);
//     return [];
//   }
// };

// // 🔹 Rank & filter the best scrap dealers using Gemini AI
// export const findNearestScrapersWithGamini = async (userLat, userLng, googleMapsScrapers) => {
//   try {
//     log("🔹 Refining scrap dealer list with Gemini AI...");

//     if (!googleMapsScrapers || googleMapsScrapers.length === 0) {
//       console.warn("⚠️ No scrapers available to refine.");
//       return [];
//     }

//     const dynamicPrompt = `
//       Given the following list of scrap dealers near latitude ${userLat} and longitude ${userLng}, rank them based on:
//       - **Proximity to the user** (top priority)
//       - **Best ratings** (if available)
//       - **Highest reliability for buying scrap**
//       - **Provide only the top 5 best results.**

//       Input JSON:
//       ${JSON.stringify(googleMapsScrapers)}

//       Output JSON (Max 5 results):
//       [
//         {
//           "name": "Scraper Name",
//           "shop_address": "Shop Address",
//           "contact_number": "Contact Number",
//           "rating": "Rating",
//           "latitude": "Latitude",
//           "longitude": "Longitude"
//         }
//       ]
//     `;

//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const geminiResult = await model.generateContent(dynamicPrompt);

//     // 🔹 Extract AI response
//     const rawText = await geminiResult.response.text();
//     log("🔹 Raw Gemini AI Response:", rawText);

//     // 🔹 Clean & Parse JSON Response
//     const sanitizedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
//     const rankedScrapers = sanitizedText.startsWith("[") ? JSON.parse(sanitizedText) : [];

//     log("✅ Ranked Scrapers:", rankedScrapers);
//     return rankedScrapers;
//   } catch (error) {
//     console.error("❌ Error in Gemini AI request:", error);
//     return [];
//   }
// };




// import { GoogleGenerativeAI } from "@google/generative-ai";
// // import axios from "axios";

// const genAI = new GoogleGenerativeAI("AIzaSyB1El1CE7z3rS6yEAuDgWAzlfwZJWD4lTw"); // Replace with your actual Gemini API key

// export const findNearestScrapersWithGamini = async (pinCode, address, city, state) => {
//   try {
//     let searchInput = "";

//     if (pinCode) {
//       log("📍 Searching scrapers using Pin Code:", pinCode);
//       searchInput = `Find active scrap dealers near the pin code ${pinCode}. Ensure they are within 5 km and prioritize those who buy scrap materials.`;
//     } else {
//       console.warn("⚠️ Pin Code not provided or inaccurate. Using address as fallback.");
//       searchInput = `
//         Find active scrap dealers near the address:
//         "${address}, ${city}, ${state}". 
//         Ensure they are within 5 km and prioritize those who buy scrap materials.
//       `;
//     }

//     const dynamicPrompt = `
//       ${searchInput}

//       Return the result in JSON format:
//       [
//         {
//           "name": "Scraper Name",
//           "shop_address": "Shop Address",
//           "contact_number": "Contact Number",
//           "distance": "Distance in km"
//         }
//       ]

//       Only return dealers who actively buy scrap. If none are found, return an empty array [].
//     `;

//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const result = await model.generateContent(dynamicPrompt);

//     const rawText = await result.response.text();
//     log("🔹 Raw Gemini AI Response:", rawText);

//     // Clean and parse the response text
//     const sanitizedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
//     const rankedScrapers = sanitizedText.startsWith("[") ? JSON.parse(sanitizedText) : [];

//     log("✅ Ranked Scrapers:", rankedScrapers);
//     return rankedScrapers;
//   } catch (error) {
//     console.error("❌ Error in findNearestScrapersWithGamini:", error);
//     return [];
//   }
// };
