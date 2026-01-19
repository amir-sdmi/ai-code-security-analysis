import axios from 'axios';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

// Gemini API Key
const GEMINI_API_KEY = 'AIzaSyCpVjvn47rubZ8pnwexTclzPe8ylJVNZlo';
// Updated API URL to use Gemini 1.5 Pro model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
// Fallback to regular Gemini Pro model if needed
const GEMINI_FALLBACK_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

export const ChatbotController = {
  /**
   * Process incoming message from the chatbot
   */
  processMessage: async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Get user context for more personalized responses
      const user = await User.findById(userId);
      
      // Get user's joined activities
      const joinedActivities = await Activity.find({
        participants: userId
      }).sort({ dateTime: 1 }).limit(5);

      // Get user's created activities
      const createdActivities = await Activity.find({
        creator: userId
      }).sort({ dateTime: 1 }).limit(5);

      // Create a context for Gemini to better understand the user and their activities
      const userContext = {
        name: user.name || user.username,
        interests: user.interests || [],
        activityPreferences: user.activityPreferences || [],
        joinedActivities: joinedActivities.map(activity => ({
          title: activity.title,
          type: activity.activityType,
          location: activity.location,
          dateTime: activity.dateTime,
          description: activity.description
        })),
        createdActivities: createdActivities.map(activity => ({
          title: activity.title,
          type: activity.activityType,
          location: activity.location,
          dateTime: activity.dateTime,
          description: activity.description
        }))
      };

      // Create the prompt for Gemini with user context
      const prompt = `
You are an advanced AI assistant for the MEETFIT platform, a social fitness app that connects people for group workouts and activities. While you specialize in fitness and activity-related topics, you can answer questions on ANY topic with accuracy and helpfulness.

USER INFORMATION:
- Name: ${userContext.name}
- Interests: ${userContext.interests.join(', ') || 'Not specified'}
- Activity Preferences: ${userContext.activityPreferences.join(', ') || 'Not specified'}

USER'S JOINED ACTIVITIES:
${userContext.joinedActivities.map(activity => 
  `- ${activity.title} (${activity.type}) at ${activity.location} on ${new Date(activity.dateTime).toLocaleString()}`
).join('\n') || 'No joined activities.'}

USER'S CREATED ACTIVITIES:
${userContext.createdActivities.map(activity => 
  `- ${activity.title} (${activity.type}) at ${activity.location} on ${new Date(activity.dateTime).toLocaleString()}`
).join('\n') || 'No created activities.'}

USER'S QUERY: "${message}"

RESPONSE GUIDELINES:
1. Be friendly, supportive and personalized - address the user by name when appropriate.
2. For activity questions, reference their specific activities by name from the lists above.
3. If they ask for recommendations, suggest activities aligned with their listed interests and preferences.
4. Keep responses concise (under 150 words) but informative and engaging.
5. For scheduling questions, be specific about dates, times, and locations from their activity data.
6. If they have no activities and ask about their schedule, encourage them to join activities.
7. Include motivational fitness tips when relevant to fitness queries.
8. For non-fitness related questions, provide accurate, helpful information on ANY topic the user asks about.
9. If asked about controversial topics, provide balanced, factual information without bias.
10. For questions about current events, acknowledge that your information may not be up-to-date and suggest checking recent sources.

Your response should be conversational yet professional. For fitness-related queries, focus on helping the user make the most of the MEETFIT platform. For all other queries, provide the most accurate and helpful information possible.
`;

      console.log(`Sending request to Gemini API for message: "${message}"`);
      
      try {
        // Call Gemini API with full configuration
        try {
          const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.6,          // Slightly lower temperature for more focused responses
                topK: 32,                  // Optimized for Gemini 1.5
                topP: 0.9,                 // Slightly lower for more predictable responses
                maxOutputTokens: 1024      // Keep this the same
              },
              // Safety settings moved outside generationConfig
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
              ]
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
      
          // Extract the response text
          const geminiResponse = response.data.candidates[0].content.parts[0].text;
          console.log(`Received response from Gemini API: "${geminiResponse.substring(0, 50)}..."`);
      
          return res.status(200).json({ reply: geminiResponse });
        } catch (configError) {
          console.log("Failed with safety settings, trying fallback approach without them");
          
          try {
            // Fallback approach - try with minimal configuration
            const fallbackResponse = await axios.post(
              `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.6,
                  topK: 32,
                  topP: 0.9,
                  maxOutputTokens: 1024
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Extract the response text
            const fallbackGeminiResponse = fallbackResponse.data.candidates[0].content.parts[0].text;
            console.log(`Received fallback response from Gemini API: "${fallbackGeminiResponse.substring(0, 50)}..."`);
        
            return res.status(200).json({ reply: fallbackGeminiResponse });
          } catch (fallbackError) {
            console.log("Failed with 1.5-pro model, trying with standard gemini-pro model");
            
            // Final fallback to standard gemini-pro model
            const standardResponse = await axios.post(
              `${GEMINI_FALLBACK_URL}?key=${GEMINI_API_KEY}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Extract the response text
            const standardGeminiResponse = standardResponse.data.candidates[0].content.parts[0].text;
            console.log(`Received standard gemini-pro response: "${standardGeminiResponse.substring(0, 50)}..."`);
        
            return res.status(200).json({ reply: standardGeminiResponse });
          }
        }
      } catch (apiError) {
        console.error('Gemini API error:', apiError.response?.data || apiError.message);
        
        // Determine if this is an activity-related query
        const activityRelatedTerms = ['activity', 'activities', 'schedule', 'when', 'next', 'upcoming', 'join'];
        const isActivityQuery = activityRelatedTerms.some(term => 
          message.toLowerCase().includes(term)
        );
        
        // Recommendation-related terms
        const recommendationTerms = ['recommend', 'suggestion', 'suggest', 'find', 'what should'];
        const isRecommendationQuery = recommendationTerms.some(term => 
          message.toLowerCase().includes(term)
        );
        
        // Check for specific query types and provide appropriate responses
        if (message.toLowerCase().includes('when is my next activity') || 
            (isActivityQuery && message.toLowerCase().includes('next'))) {
          // Activity scheduling query
          if (joinedActivities.length > 0 || createdActivities.length > 0) {
            // User has activities
            const allActivities = [...joinedActivities, ...createdActivities];
            const futureActivities = allActivities.filter(a => new Date(a.dateTime) > new Date())
              .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            
            if (futureActivities.length > 0) {
              const nextActivity = futureActivities[0];
              const activityDate = new Date(nextActivity.dateTime);
              const formattedDate = activityDate.toLocaleString();
              
              return res.status(200).json({ 
                reply: `Hi ${userContext.name}! Your next activity is "${nextActivity.title}" at ${nextActivity.location} on ${formattedDate}.`
              });
            } else {
              return res.status(200).json({ 
                reply: `Hi ${userContext.name}! You don't have any upcoming activities scheduled. Would you like to browse available activities to join?`
              });
            }
          } else {
            // No activities
            return res.status(200).json({ 
              reply: `Hi ${userContext.name}! You don't have any activities scheduled yet. Would you like me to help you find some activities to join?`
            });
          }
        } else if (isRecommendationQuery) {
          // Recommendation query
          return res.status(200).json({ 
            reply: `Hi ${userContext.name}! Based on your interests${userContext.interests.length > 0 ? ' in ' + userContext.interests.join(', ') : ''}, I'd recommend checking out the Activities tab to find group workouts and fitness events near you. What type of activities do you enjoy most?`
          });
        } else {
          // Generic fallback for other queries
          return res.status(200).json({ 
            reply: `Hi ${userContext.name}! I'd be happy to help you with that. Could you try asking in a different way? For example, you can ask about your upcoming activities, find recommendations, or get fitness advice.`
          });
        }
      }
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      
      // Provide a more helpful error message based on the type of error
      let errorMessage = 'Error processing your message';
      
      // For user queries about activities when there are none
      if (error.message && error.message.includes('activities')) {
        return res.status(200).json({ 
          reply: "I don't see any activities scheduled for you at the moment. Would you like me to help you find some activities to join?" 
        });
      }
      
      return res.status(500).json({ message: errorMessage, error: error.message });
    }
  },

  /**
   * Get activity recommendations based on user preferences
   */
  getRecommendations: async (req, res) => {
    try {
      console.log('Getting recommendations for user');
      const userId = req.user.id;
      
      // Get user data
      const user = await User.findById(userId);
      
      if (!user) {
        console.log('User not found for recommendations');
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's interests and preferences
      const userInterests = user.interests || [];
      const userPreferences = user.activityPreferences || [];
      
      console.log(`User interests: ${userInterests.join(', ')}`);
      console.log(`User preferences: ${userPreferences.join(', ')}`);
      
      // Find activities that match user interests and preferences
      // Exclude activities the user has already joined
      const recommendations = await Activity.find({
        $and: [
          { 
            $or: [
              { activityType: { $in: userPreferences } },
              { description: { $regex: userInterests.join('|'), $options: 'i' } }
            ] 
          },
          { participants: { $ne: userId } },
          { creator: { $ne: userId } },
          { dateTime: { $gt: new Date() } },
          { status: 'open' }
        ]
      })
      .sort({ dateTime: 1 })
      .limit(5)
      .populate('creator', 'username name profileImage');

      console.log(`Found ${recommendations.length} recommendations for user`);
      
      return res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
    }
  }
};