import { NextResponse } from "next/server"
import { generateText } from "ai"
import { GoogleGenerativeAI } from "@ai-sdk/google"
// Import the supabase client at the top of the file
import { supabase } from "@/lib/supabase"

// In the POST function, add caching logic
export async function POST(request: Request) {
  try {
    const { origin, destination, vesselType, vesselSize, preferences } = await request.json()

    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required" }, { status: 400 })
    }

    // Check if we have cached data for this route request
    const cacheKey = `route:${origin}:${destination}:${vesselType}:${vesselSize}:${JSON.stringify(preferences)}`
    const { data: cachedData } = await supabase.from("route_cache").select("*").eq("cache_key", cacheKey).single()

    // If we have fresh cached data (less than 1 hour old), return it
    if (cachedData && new Date().getTime() - new Date(cachedData.created_at).getTime() < 60 * 60 * 1000) {
      return NextResponse.json(JSON.parse(cachedData.data))
    }

    // Fetch geocoding data for origin and destination
    const originCoords = await fetchGeocodingData(origin)
    const destinationCoords = await fetchGeocodingData(destination)

    // Generate route data
    const routeData = await generateRouteData(
      origin,
      destination,
      originCoords,
      destinationCoords,
      vesselType,
      vesselSize,
      preferences,
    )

    // Generate AI analysis of the route
    const analysis = await generateRouteAnalysis(routeData)

    const responseData = {
      ...routeData,
      analysis,
    }

    // Cache the data in Supabase
    await supabase.from("route_cache").upsert({
      cache_key: cacheKey,
      data: JSON.stringify(responseData),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in route optimization:", error)
    return NextResponse.json({ error: "Failed to optimize route" }, { status: 500 })
  }
}

async function fetchGeocodingData(location: string) {
  // In production, use a geocoding API like OpenCage, Mapbox, or Google Maps
  // For this demo, we'll use mock data

  const mockGeoData: Record<string, [number, number]> = {
    rotterdam: [51.9225, 4.4792],
    singapore: [1.3521, 103.8198],
    shanghai: [31.2304, 121.4737],
    "new york": [40.7128, -74.006],
    "los angeles": [34.0522, -118.2437],
    "cape town": [-33.9249, 18.4241],
    sydney: [-33.8688, 151.2093],
    tokyo: [35.6762, 139.6503],
    hamburg: [53.5511, 9.9937],
    dubai: [25.2048, 55.2708],
    "suez canal": [30.0286, 32.5498],
    "panama canal": [9.08, -79.68],
    gibraltar: [36.1408, -5.3536],
  }

  // Try to match the location to our mock data
  const locationKey = Object.keys(mockGeoData).find((key) => location.toLowerCase().includes(key))

  if (locationKey) {
    return { lat: mockGeoData[locationKey][0], lng: mockGeoData[locationKey][1] }
  }

  // If no match, generate some plausible coordinates
  // This is just for demo purposes
  return {
    lat: Math.random() * 180 - 90,
    lng: Math.random() * 360 - 180,
  }
}

async function generateRouteData(
  origin: string,
  destination: string,
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number },
  vesselType: string,
  vesselSize: string,
  preferences: { fuelEfficiency: number; time: number; avoidRoughSeas: boolean },
) {
  // In production, this would use real maritime routing algorithms and weather data
  // For this demo, we'll generate plausible mock data

  // Generate waypoints along the route
  const waypoints = generateWaypoints(originCoords, destinationCoords)

  // Calculate base metrics
  const distance = calculateDistance(originCoords, destinationCoords)

  // Adjust metrics based on vessel type and size
  const speedFactor = getSpeedFactor(vesselType, vesselSize)
  const fuelFactor = getFuelFactor(vesselType, vesselSize)

  // Calculate duration based on distance and speed
  const duration = calculateDuration(distance, speedFactor)

  // Calculate fuel consumption and emissions
  const fuelConsumption = calculateFuelConsumption(distance, fuelFactor)
  const co2Emissions = fuelConsumption * 3.1 // Approximate CO2 emissions factor

  // Generate alternative routes
  const alternatives = generateAlternativeRoutes(origin, destination, distance, duration, fuelConsumption, co2Emissions)

  // Generate weather conditions along the route
  const weatherConditions = generateWeatherConditions(waypoints)

  return {
    origin,
    destination,
    optimizedRoute: {
      waypoints,
      distance,
      duration,
      fuelConsumption,
      co2Emissions,
    },
    alternatives,
    weatherConditions,
  }
}

function generateWaypoints(
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number },
) {
  const waypoints = [
    { ...originCoords, name: "Origin" },
    { ...destinationCoords, name: "Destination" },
  ]

  // Add intermediate waypoints based on the route
  // This is a simplified approach - real maritime routing would consider landmasses, shipping lanes, etc.
  const numWaypoints = 2 + Math.floor(Math.random() * 4) // 2-5 intermediate waypoints

  for (let i = 1; i <= numWaypoints; i++) {
    const ratio = i / (numWaypoints + 1)

    // Add some randomness to make the route more realistic
    const jitterLat = (Math.random() - 0.5) * 5
    const jitterLng = (Math.random() - 0.5) * 5

    waypoints.splice(i, 0, {
      lat: originCoords.lat + (destinationCoords.lat - originCoords.lat) * ratio + jitterLat,
      lng: originCoords.lng + (destinationCoords.lng - originCoords.lng) * ratio + jitterLng,
    })
  }

  // Add names to key waypoints based on their coordinates
  // In a real app, this would use reverse geocoding or a maritime database
  const keyPoints: Record<string, [number, number]> = {
    "Suez Canal": [30.0286, 32.5498],
    "Gibraltar Strait": [36.1408, -5.3536],
    "Panama Canal": [9.08, -79.68],
    "Cape of Good Hope": [-34.3568, 18.474],
    "Malacca Strait": [1.75, 101.0],
    "English Channel": [50.1, -1.0],
  }

  // Check if any waypoints are near key maritime points
  waypoints.forEach((waypoint) => {
    Object.entries(keyPoints).forEach(([name, [lat, lng]]) => {
      const distance = Math.sqrt(Math.pow(waypoint.lat - lat, 2) + Math.pow(waypoint.lng - lng, 2))

      if (distance < 5) {
        // Within 5 degrees (rough approximation)
        waypoint.name = name
      }
    })
  })

  return waypoints
}

function calculateDistance(
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number },
) {
  // Haversine formula to calculate distance between two points on Earth
  const R = 6371 // Earth's radius in km
  const dLat = ((destinationCoords.lat - originCoords.lat) * Math.PI) / 180
  const dLon = ((destinationCoords.lng - originCoords.lng) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originCoords.lat * Math.PI) / 180) *
      Math.cos((destinationCoords.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Convert to nautical miles
  return Math.round(distance * 0.539957)
}

function getSpeedFactor(vesselType: string, vesselSize: string) {
  // Base speed factors by vessel type (knots)
  const baseSpeedByType: Record<string, number> = {
    container: 20,
    tanker: 15,
    bulk: 14,
    cruise: 22,
    fishing: 12,
  }

  // Speed modifiers by vessel size
  const sizeModifiers: Record<string, number> = {
    small: 0.9,
    medium: 1.0,
    large: 1.1,
    vlcc: 0.85,
  }

  const baseSpeed = baseSpeedByType[vesselType] || 15
  const sizeModifier = sizeModifiers[vesselSize] || 1.0

  return baseSpeed * sizeModifier
}

function getFuelFactor(vesselType: string, vesselSize: string) {
  // Base fuel consumption factors by vessel type (metric tons per nautical mile)
  const baseFuelByType: Record<string, number> = {
    container: 0.3,
    tanker: 0.25,
    bulk: 0.2,
    cruise: 0.35,
    fishing: 0.1,
  }

  // Fuel modifiers by vessel size
  const sizeModifiers: Record<string, number> = {
    small: 0.6,
    medium: 1.0,
    large: 1.8,
    vlcc: 3.0,
  }

  const baseFuel = baseFuelByType[vesselType] || 0.25
  const sizeModifier = sizeModifiers[vesselSize] || 1.0

  return baseFuel * sizeModifier
}

function calculateDuration(distance: number, speedFactor: number) {
  // Calculate duration in hours
  return Math.round(distance / speedFactor)
}

function calculateFuelConsumption(distance: number, fuelFactor: number) {
  // Calculate fuel consumption in metric tons
  return Math.round(distance * fuelFactor)
}

function generateAlternativeRoutes(
  origin: string,
  destination: string,
  distance: number,
  duration: number,
  fuelConsumption: number,
  co2Emissions: number,
) {
  // Generate 2-3 alternative routes with different characteristics
  const numAlternatives = 2 + Math.floor(Math.random() * 2)
  const alternatives = []

  const routeTypes = [
    {
      id: "fastest",
      name: "Fastest Route",
      distanceFactor: 1.05,
      durationFactor: 0.85,
      fuelFactor: 1.2,
      weatherRisk: "medium",
    },
    {
      id: "eco",
      name: "Eco-Friendly Route",
      distanceFactor: 1.1,
      durationFactor: 1.15,
      fuelFactor: 0.8,
      weatherRisk: "low",
    },
    {
      id: "traditional",
      name: "Traditional Shipping Lane",
      distanceFactor: 1.0,
      durationFactor: 1.0,
      fuelFactor: 1.0,
      weatherRisk: "low",
    },
    {
      id: "northern",
      name: "Northern Route",
      distanceFactor: 0.9,
      durationFactor: 1.1,
      fuelFactor: 1.1,
      weatherRisk: "high",
    },
  ]

  // Select random route types
  const selectedTypes = routeTypes.sort(() => Math.random() - 0.5).slice(0, numAlternatives)

  for (const type of selectedTypes) {
    alternatives.push({
      id: type.id,
      name: type.name,
      distance: Math.round(distance * type.distanceFactor),
      duration: Math.round(duration * type.durationFactor),
      fuelConsumption: Math.round(fuelConsumption * type.fuelFactor),
      co2Emissions: Math.round(fuelConsumption * type.fuelFactor * 3.1),
      weatherRisk: type.weatherRisk as "low" | "medium" | "high",
    })
  }

  return alternatives
}

function generateWeatherConditions(waypoints: Array<{ lat: number; lng: number; name?: string }>) {
  // Generate weather conditions for each waypoint
  const weatherConditions = []

  const weatherTypes = [
    { conditions: "Clear skies", windSpeedRange: [5, 15], waveHeightRange: [0.5, 1.5], visibility: "Excellent" },
    { conditions: "Partly cloudy", windSpeedRange: [10, 20], waveHeightRange: [1, 2], visibility: "Good" },
    { conditions: "Overcast", windSpeedRange: [15, 25], waveHeightRange: [1.5, 3], visibility: "Moderate" },
    { conditions: "Light rain", windSpeedRange: [15, 30], waveHeightRange: [2, 4], visibility: "Moderate" },
    { conditions: "Heavy rain", windSpeedRange: [25, 40], waveHeightRange: [3, 5], visibility: "Poor" },
    { conditions: "Fog", windSpeedRange: [5, 15], waveHeightRange: [1, 2], visibility: "Very poor" },
    { conditions: "Storm", windSpeedRange: [35, 50], waveHeightRange: [4, 7], visibility: "Poor" },
  ]

  for (const waypoint of waypoints) {
    // Select random weather type with some bias based on latitude
    // Higher latitudes tend to have more severe weather
    const latitudeFactor = Math.abs(waypoint.lat) / 90 // 0 at equator, 1 at poles
    const weatherBias = Math.min(latitudeFactor * 3, 1) // Bias towards more severe weather at higher latitudes

    let weatherIndex = Math.floor(Math.random() * weatherTypes.length)
    if (Math.random() < weatherBias) {
      // More likely to select severe weather
      weatherIndex = Math.min(weatherIndex + 2, weatherTypes.length - 1)
    }

    const weatherType = weatherTypes[weatherIndex]

    // Generate random values within the ranges
    const windSpeed = Math.floor(
      weatherType.windSpeedRange[0] + Math.random() * (weatherType.windSpeedRange[1] - weatherType.windSpeedRange[0]),
    )

    const waveHeight = Number.parseFloat(
      (
        weatherType.waveHeightRange[0] +
        Math.random() * (weatherType.waveHeightRange[1] - weatherType.waveHeightRange[0])
      ).toFixed(1),
    )

    weatherConditions.push({
      location: `${waypoint.lat},${waypoint.lng}`,
      conditions: weatherType.conditions,
      windSpeed,
      waveHeight,
      visibility: weatherType.visibility,
    })
  }

  return weatherConditions
}

async function generateRouteAnalysis(routeData: any) {
  // Construct a detailed prompt for Gemini
  const prompt = `
    You are a maritime route optimization expert. Analyze the following maritime route data:
    
    Route: ${routeData.origin} to ${routeData.destination}
    
    Optimized Route Details:
    - Distance: ${routeData.optimizedRoute.distance} nautical miles
    - Duration: ${Math.floor(routeData.optimizedRoute.duration / 24)} days ${routeData.optimizedRoute.duration % 24} hours
    - Fuel Consumption: ${routeData.optimizedRoute.fuelConsumption} metric tons
    - CO2 Emissions: ${routeData.optimizedRoute.co2Emissions} metric tons
    
    Alternative Routes:
    ${routeData.alternatives
      .map(
        (alt: any) =>
          `- ${alt.name}: Distance ${alt.distance} nm, Duration ${Math.floor(alt.duration / 24)} days ${alt.duration % 24} hrs, Fuel ${alt.fuelConsumption} mt, Weather Risk: ${alt.weatherRisk}`,
      )
      .join("\n")}
    
    Weather Conditions Along Route:
    ${routeData.weatherConditions
      .map(
        (weather: any, index: number) =>
          `- Point ${index + 1}: ${weather.conditions}, Wind ${weather.windSpeed} knots, Waves ${weather.waveHeight}m, Visibility ${weather.visibility}`,
      )
      .join("\n")}
    
    Provide a detailed analysis of this maritime route, including:
    1. Overall assessment of the optimized route
    2. Key advantages compared to alternatives
    3. Weather and navigational challenges to be aware of
    4. Recommendations for the captain and crew
    5. Fuel efficiency and environmental considerations
    
    Use maritime terminology and be specific about locations, conditions, and recommendations. Format your response in clear paragraphs with appropriate line breaks.
  `

  try {
    // Use the AI SDK to generate text with Gemini
    const { text } = await generateText({
      model: GoogleGenerativeAI("gemini-pro"),
      prompt: prompt,
      maxTokens: 1024,
    })

    return text
  } catch (error) {
    console.error("Error generating text with Gemini:", error)
    return `Unable to generate route analysis. Please try again later.`
  }
}
