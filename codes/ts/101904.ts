


import { GoogleGenAI, Type } from "@google/genai";
import type { Currency, TravelData, TripCostSummary, AirbnbListing } from '../types';
import { searchFlights } from './duffel';
import { searchHotels } from './amadeus';

// Step 1: Define the schema for Gemini to extract structured data from the user's query.
const parameterExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        flightOriginIata: { type: Type.STRING, description: 'The IATA code for the flight origin city. Infer from the user query.' },
        flightDestinationIata: { type: Type.STRING, description: 'The IATA code for the flight destination city. Infer from the user query.' },
        flightDepartureDate: { type: Type.STRING, description: 'The departure date in YYYY-MM-DD format. Infer from the user query, assuming the current year if not specified.' },
        hotelCity: { type: Type.STRING, description: 'The name of the city for the hotel search. This should be the destination city.' },
        hotelCheckInDate: { type: Type.STRING, description: 'The check-in date for the hotel in YYYY-MM-DD format. This is usually the same as the flight departure date.' },
        hotelNights: { type: Type.NUMBER, description: 'The number of nights for the hotel stay. Infer from the query (e.g., "a week" is 7).' },
        adults: { type: Type.NUMBER, description: 'The number of adult travelers. Default to 1 if not specified.' },
    },
    required: ["flightOriginIata", "flightDestinationIata", "flightDepartureDate", "hotelCity", "hotelCheckInDate", "hotelNights", "adults"]
};

const costEstimationSchema = {
    type: Type.OBJECT,
    properties: {
        dailyFoodEstimate: { type: Type.NUMBER, description: 'The estimated daily cost for food per person.' },
        totalTripEstimate: { type: Type.NUMBER, description: 'The calculated total trip cost including flights, hotel, and food.' },
        summary: { type: Type.STRING, description: 'A brief, encouraging summary of the trip budget.' },
    },
    required: ["dailyFoodEstimate", "totalTripEstimate", "summary"],
}

const airbnbGenerationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A catchy, descriptive title for the listing." },
            type: { type: Type.STRING, description: "Type of property, e.g., 'Entire apartment', 'Private room', 'Loft'." },
            guests: { type: Type.NUMBER, description: "Maximum number of guests allowed." },
            rating: { type: Type.NUMBER, description: "A plausible rating between 4.50 and 5.00." },
            pricePerNight: { type: Type.NUMBER, description: "The price per night in the requested currency." },
            isSuperhost: { type: Type.BOOLEAN, description: "Whether the host is a Superhost." },
            photoUrl: { type: Type.STRING, description: "A URL for a high-quality, appealing photo of a modern interior or exterior. Use a real, publicly accessible image URL from sites like Unsplash or Pexels." },
            bookingUrl: { type: Type.STRING, description: "A plausible but fake booking URL on a platform like Airbnb." },
        },
        required: ["title", "type", "guests", "rating", "pricePerNight", "isSuperhost", "photoUrl", "bookingUrl"],
    }
};

// Step 3: Define the system instruction for the final summarization step.
const getSummarizationSystemInstruction = (currency: Currency) => `You are a world-class, intelligent travel curator called ClearTravel. Your motto is "Fewer options, better curated."
You will be given a JSON object containing real-time flight and hotel data. Your task is to provide a helpful, comparative summary and a useful travel tip.

**Output Format (Strictly Enforced):**
Your entire output must consist of two parts separated by '|||'.

**Part 1: JSON Data**
A single, valid JSON object containing ONLY the 'hotelSummary' field.
{
    "hotelSummary": "string (A 1-2 sentence comparative analysis of the provided hotel options, helping the user make a decision.)"
}

**Part 2: Travel Tip**
Immediately after the JSON, use the '|||' separator, followed by a friendly, insightful travel tip related to the destination.

**Example:**
{
  "hotelSummary": "The Grand Hyatt is a great luxury option close to downtown, while The Budget Inn offers a more affordable stay with excellent free breakfast."
}
|||
For your trip, remember to book museum tickets in advance to avoid long lines, especially for the Louvre!

Adhere to this format precisely. The JSON must be first, then the separator, then the tip.`;


export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ type: 'error', payload: 'Method Not Allowed' }), { status: 405 });
    }

    const { query, currency = 'USD' } = await req.json();
    if (!query) {
        return new Response(JSON.stringify({ type: 'error', payload: 'Query is required.' }), { status: 400 });
    }

    if (!process.env.API_KEY || !process.env.DUFFEL_API_KEY || !process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
        const message = 'One or more API keys (Google, Duffel, Amadeus) are not configured on the server.';
        console.error(message);
        return new Response(JSON.stringify({ type: 'error', payload: message }), { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // --- Step 1: Use Gemini for NLU to extract search parameters ---
        const nluResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extract travel parameters from this query: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: parameterExtractionSchema,
            }
        });

        const params = JSON.parse(nluResponse.text);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                const enqueue = (data: object) => controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));

                try {
                    // --- Step 2: Fetch real data from providers in parallel ---
                    const [flightsResponse, hotelsResponse] = await Promise.allSettled([
                        searchFlights({
                            origin: params.flightOriginIata,
                            destination: params.flightDestinationIata,
                            departureDate: params.flightDepartureDate,
                            adults: params.adults,
                            currency: currency,
                        }),
                        searchHotels({
                            city: params.hotelCity,
                            checkInDate: params.hotelCheckInDate,
                            nights: params.hotelNights,
                            adults: params.adults,
                            currency: currency,
                        }),
                    ]);

                    let travelData: Partial<TravelData> = {};

                    if (flightsResponse.status === 'fulfilled') {
                        travelData.flights = flightsResponse.value;
                        enqueue({ type: 'data', payload: { flights: travelData.flights } });
                    } else {
                        console.error("Duffel Error:", flightsResponse.reason);
                        enqueue({ type: 'error', payload: `Could not fetch flights. ${flightsResponse.reason.message || ''}` });
                    }

                    if (hotelsResponse.status === 'fulfilled') {
                        travelData.hotels = hotelsResponse.value.hotels;
                        travelData.destinationCoordinates = hotelsResponse.value.coordinates;
                        travelData.destinationCityName = params.hotelCity;
                        enqueue({ type: 'data', payload: { hotels: travelData.hotels, destinationCoordinates: travelData.destinationCoordinates, destinationCityName: travelData.destinationCityName } });
                    } else {
                        console.error("Amadeus Error:", hotelsResponse.reason);
                        enqueue({ type: 'error', payload: `Could not fetch hotels. ${hotelsResponse.reason.message || ''}` });
                    }

                    // --- Step 3: Use Gemini to generate Airbnb listings and summarize real data ---
                    if (travelData.flights?.length || travelData.hotels?.length) {
                         const [summaryStream, airbnbResponse] = await Promise.all([
                            // A: Hotel summary and tip
                            ai.models.generateContentStream({
                                model: "gemini-2.5-flash",
                                contents: `Here is the travel data. Please generate a summary and a tip.\n\n${JSON.stringify(travelData)}`,
                                config: {
                                    systemInstruction: getSummarizationSystemInstruction(currency as Currency),
                                }
                            }),
                            // B: Generate Airbnb listings
                            ai.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: `Generate a list of 3 vacation rentals for a trip to ${params.hotelCity} for ${params.adults} adults. The price should be in ${currency}. Provide a diverse set of options (e.g., apartment, loft, house).`,
                                config: {
                                    systemInstruction: "You are a travel agent who finds interesting vacation rentals. You always return valid JSON that conforms to the provided schema. You find real-looking images for the properties from royalty-free sources like Unsplash.",
                                    responseMimeType: "application/json",
                                    responseSchema: airbnbGenerationSchema,
                                }
                            })
                         ]);

                        // Process summary and tip
                        let buffer = '';
                        for await (const chunk of summaryStream) {
                            buffer += chunk.text;
                        }
                        const separatorIndex = buffer.indexOf('|||');
                        if (separatorIndex !== -1) {
                            const jsonPart = buffer.substring(0, separatorIndex);
                            const tipPart = buffer.substring(separatorIndex + 3);
                            try {
                                const summaryJson = JSON.parse(jsonPart);
                                if (summaryJson.hotelSummary) {
                                    enqueue({ type: 'data', payload: { hotelSummary: summaryJson.hotelSummary }});
                                }
                                if (tipPart) {
                                    enqueue({ type: 'tip', payload: tipPart.trim() });
                                }
                            } catch(e) {
                                console.error("Failed to parse summary JSON from Gemini", e);
                            }
                        }
                        
                        // Process Airbnb listings
                        try {
                            const airbnbData: AirbnbListing[] = JSON.parse(airbnbResponse.text);
                            enqueue({ type: 'data', payload: { airbnbs: airbnbData } });
                        } catch (e) {
                            console.error("Failed to parse Airbnb JSON from Gemini", e);
                        }

                        // C: Total cost estimation
                        const totalFlightCost = travelData.flights?.[0]?.price || 0;
                        const totalHotelCost = travelData.hotels?.[0]?.pricePerNight * params.hotelNights || 0;

                        if (totalFlightCost > 0 && totalHotelCost > 0) {
                             const costPrompt = `Based on a trip to ${params.hotelCity} for ${params.hotelNights} nights for ${params.adults} adult(s), with a flight cost of ${totalFlightCost} ${currency} and a hotel cost of ${totalHotelCost} ${currency}, provide a budget summary.`;
                             const costResponse = await ai.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: costPrompt,
                                config: {
                                    systemInstruction: `You are a pragmatic travel budget advisor. Given flight costs, hotel costs, number of nights/adults, and destination city, you will estimate a daily food budget for a traveler seeking authentic, budget-friendly local cuisine. Then, calculate a total trip cost (flights + hotel + food). Return ONLY a JSON object.`,
                                    responseMimeType: "application/json",
                                    responseSchema: costEstimationSchema,
                                }
                             });
                             const costData: TripCostSummary = JSON.parse(costResponse.text);
                             enqueue({ type: 'cost_summary', payload: costData });
                        }
                    }

                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during data fetching.';
                    console.error("Error in stream:", err);
                    enqueue({ type: 'error', payload: errorMessage });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });

    } catch (err) {
        console.error("Error in API handler:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected server error occurred.';
        const errorPayload = { type: 'error', payload: errorMessage };
        return new Response(JSON.stringify(errorPayload), { status: 500 });
    }
}