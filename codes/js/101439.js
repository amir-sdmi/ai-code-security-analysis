require('dotenv').config();
const axios = require('axios');
const form = require('../models/form.model');
const address = require('../models/address.model');

const getGoogleReviews = async (req, res) => {
  try {
    const nameDoc = await form.findOne().sort({ createdAt: -1 });
    const addressDoc = await address.findOne().sort({ createdAt: -1 });

    const name = nameDoc?.propertyName;
    const location = addressDoc?.city || addressDoc?.state || '';

    if (!name || !location) {
      return res.send({ error: 'Hotel name or location missing in database' });
    }

    // Step 1: Get Place ID
    const searchResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          input: `${name}, ${location}`,
          inputtype: 'textquery',
          fields: 'place_id',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const placeId = searchResponse.data?.candidates?.[0]?.place_id;
    if (!placeId) {
      return res.send({ error: 'Place not found on Google Maps' });
    }

    // Step 2: Get Place Details with Reviews
    const detailResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'name,rating,user_ratings_total,url,reviews',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const result = detailResponse.data?.result;
    const reviews = result.reviews || [];

    // Step 3: Analyze review sentiment
    let fiveStar = 0;
    let fourStarOrLess = 0;

    reviews.forEach((r) => {
      if (r.rating === 5) {
        fiveStar++;
      } else {
        fourStarOrLess++;
      }
    });

    const total = reviews.length;
    const fiveStarPercentage = total > 0 ? ((fiveStar / total) * 100).toFixed(2) : 0;
    const negativePercentage = total > 0 ? ((fourStarOrLess / total) * 100).toFixed(2) : 0;

    // Step 4: Prepare recent reviews
    const recentReviews = reviews.slice(0, 4).map(r => ({
      authorName: r.author_name,
      rating: r.rating,
      text: r.text,
      timeDescription: r.relative_time_description,
      profilePhotoUrl: r.profile_photo_url,
    }));

    // Step 5: Generate Key Insight using ChatGPT
    const reviewTexts = reviews.slice(0, 10).map(r => `- ${r.text}`).join('\n');

    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a review analysis expert. Summarize key insights from hotel guest reviews.',
          },
          {
            role: 'user',
            content: `Here are some recent Google reviews for a hotel:\n\n${reviewTexts}\n\nPlease provide key insights about customer satisfaction, complaints, and recurring themes.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const insights = chatGPTResponse.data.choices[0].message.content;

    // Final Response
    res.send({
      name: result.name,
      rating: result.rating,
      totalReviews: result.user_ratings_total,
      googleMapsLink: result.url,
      reviewSummary: {
        totalAnalyzed: total,
        fiveStar: fiveStar,
        belowFiveStar: fourStarOrLess,
        fiveStarPercentage: `${fiveStarPercentage}%`,
        negativePercentage: `${negativePercentage}%`,
      },
      recentReviews,
      insights, // 👈 This is for your "Key Insight" tab
    });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send({ error: 'Failed to fetch Google reviews or generate insights' });
  }
};

module.exports = getGoogleReviews;
