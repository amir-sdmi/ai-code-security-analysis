const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST /geocode
router.post('/', async (req, res) => {
  const { description } = req.body;

  try {
    // Step 1: Use Gemini API to extract location name
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: `Extract the location from: ${description}` }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    const locationName = geminiResponse.data.candidates[0].content.parts[0].text.trim();

      // Step 2: Use Mapbox to get lat/lng from location name
      const mapboxResponse = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json`,
        {
          params: {
            access_token: process.env.MAPBOX_API_KEY,
            limit: 1,
          },
        }
      );
  
      const coordinates = mapboxResponse.data.features[0]?.geometry?.coordinates;
      if (!coordinates) return res.status(404).json({ error: 'No coordinates found for extracted location.' });
  
      res.json({ locationName, lat: coordinates[1], lng: coordinates[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  module.exports = router;
  