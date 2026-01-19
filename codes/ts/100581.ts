import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

interface TripDetails {
  currentLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
}

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function generateTripPlan(tripDetails: TripDetails): Promise<Response> {
  const { currentLocation, destination, startDate, endDate } = tripDetails;
  try {
    // Using Deepseek R1 API for trip planning
    const response = streamText({
      model: deepseek('deepseek-chat'),
      messages: [
        {
          role: "system",
          content: "You are a professional travel planner that creates detailed, personalized trip itineraries."
        },
        {
          role: "user",
          content: `Create a comprehensive trip plan for a traveler:
            - Current Location: ${currentLocation}
            - Destination: ${destination}
            - Trip Duration: ${startDate} to ${endDate}
            
            Please include:
            1. Top attractions to visit
            2. Recommended daily itinerary
            3. Travel and transportation tips
            4. Estimated time at each location
            5. Any special local experiences`
        }
      ],

    });

    return response?.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating trip plan:', error);
    throw new Error('Could not generate trip plan');
  }
}