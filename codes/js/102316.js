// backend/controllers/skinDetection.js
const SkinConditionDetection = require('../models/SkinConditionDetection');
const Pet = require('../models/Pet');
const DiseaseAlert = require('../models/DiseaseAlert');
const UserAlert = require('../models/UserAlert');
const User = require('../models/User');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notifications');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const OpenAI = require('openai');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: "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",
 
});


exports.analyzeSkin = async (req, res) => {
  try {
    const { petId, notes } = req.body;
    const imageFile = req.file;
    
    if (!imageFile) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Verify file exists before processing
    if (!fs.existsSync(imageFile.path)) {
      return res.status(400).json({ error: 'Uploaded file not found' });
    }

    // Get pet info
    const pet = await Pet.findById(petId).populate('owner_id');
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Call AI service
    const form = new FormData();
    form.append('image', fs.createReadStream(imageFile.path), {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype
    });
    form.append('species', pet.species);
    
    const aiResponse = await axios.post(process.env.PYTHON_DISEASE_SERVICE, form, {
      headers: form.getHeaders(),
      withCredentials: true
    });

    // Create skin_images directory if it doesn't exist
    const skinImagesDir = path.join(__dirname, '../uploads/skin_images');
    if (!fs.existsSync(skinImagesDir)) {
      fs.mkdirSync(skinImagesDir, { recursive: true });
    }

    // Move file to permanent storage
    const newFilename = `${Date.now()}-${imageFile.originalname}`;
    const newPath = path.join(skinImagesDir, newFilename);
    fs.renameSync(imageFile.path, newPath);

    // Generate enhanced recommendation with ChatGPT
    const enhancedRecommendation = await generateEnhancedRecommendation(
      aiResponse.data.prediction,
      aiResponse.data.confidence,
      pet.species,
      notes
    );

    // Create and save detection record
    const detection = new SkinConditionDetection({
      pet_id: petId,
      user_id: pet.owner_id._id,
      image_url: `/uploads/skin_images/${newFilename}`,
      prediction: aiResponse.data.prediction,
      confidence: aiResponse.data.confidence,
      species: pet.species,
      notes,
      recommendation: enhancedRecommendation
    });

    await detection.save();
    if (detection.confidence > 0.3 && detection.prediction !== 'healthy') {
       await checkForDiseaseOutbreak(detection, req.app.get('wss'));
    }

     if (req.body.addToHealthRecords) {
      const pet = await Pet.findById(petId);
      pet.healthRecords.push({
        type: 'skin_detection',
        title: `Skin Analysis - ${aiResponse.data.prediction}`,
        description: `Skin condition detection with ${Math.round(aiResponse.data.confidence * 100)}% confidence`,
        images: [`/uploads/skin_images/${newFilename}`],
        notes,
        data: {
          prediction: aiResponse.data.prediction,
          confidence: aiResponse.data.confidence,
          recommendation: enhancedRecommendation
        },
        createdBy: pet.owner_id._id
      });
      await pet.save();
    }

    res.json({
      ...detection.toObject(),
      recommendation: enhancedRecommendation
    });
  } catch (error) {
    console.error('Error analyzing skin:', error);
    
    // Clean up temp file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add this to your existing controller file
exports.getAnalysisHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const history = await SkinConditionDetection.find({ pet_id: petId })
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email');
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

function generateRecommendation(condition, confidence) {
  if (condition === 'healthy') {
    return 'No issues detected. Continue regular care.';
  } else if (confidence > 0.8) {
    return 'Seek veterinary attention within 24 hours.';
  } else {
    return 'Monitor closely. Consult vet if condition persists or worsens.';
  }
}

async function generateEnhancedRecommendation(prediction, confidence, species, notes) {
  let baseRecommendation = generateRecommendation(prediction, confidence);

  try {
    const prompt = `As a veterinary assistant, provide information in JSON format about ${prediction} in ${species} with these exact keys:
    {
      "explanation": "2-sentence plain English explanation",
      "home_care": ["tip1", "tip2", "tip3"],
      "vet_urgency": "low/medium/high",
      "contagious": "yes/no/possibly"
    }
    Owner notes: ${notes || 'none'}`;
     
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Debugging: Log the completion object
    console.log('Completion object:', JSON.stringify(completion, null, 2));

    // Safely parse the response
    let aiResponse;
    try {
      const content = completion.choices?.[0]?.message?.content; // Fixed: was .messages?.content
      if (!content) {
        throw new Error('No content in AI response');
      }
      aiResponse = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    if (!aiResponse || typeof aiResponse !== 'object') {
      throw new Error('Invalid AI response format');
    }

    return {
      baseRecommendation,
      explanation: aiResponse.explanation || "No explanation available",
      home_care: Array.isArray(aiResponse.home_care) ? aiResponse.home_care.slice(0, 3) : [],
      vet_urgency: ["low", "medium", "high"].includes(aiResponse.vet_urgency?.toLowerCase()) 
        ? aiResponse.vet_urgency.toLowerCase()
        : "medium",
      contagious: ["yes", "no", "possibly"].includes(aiResponse.contagious?.toLowerCase())
        ? aiResponse.contagious.toLowerCase()
        : "unknown"
    };

  } catch (error) {
    console.error("AI recommendation failed:", error);
    return {
      baseRecommendation,
      explanation: "Could not generate additional details",
      home_care: [],
      vet_urgency: confidence > 0.8 ? "high" : "medium",
      contagious: "unknown"
    };
  }
}

exports.askQuestion = async (req, res) => {
  try {
    const { question, analysisId } = req.body;
    
    const analysis = await SkinConditionDetection.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const prompt = `As a veterinary assistant, answer in JSON format this question about ${analysis.prediction} in ${analysis.species}:
    Question: ${question}
    
    Respond with this exact JSON structure:
    {
      "answer": "2-3 sentence response",
      "needs_vet": "yes/no/possibly"
    }`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Debugging: Log the completion object
    console.log('Ask Question Completion:', JSON.stringify(completion, null, 2));

    let response;
    try {
      const content = completion.choices?.[0]?.message?.content; // Fixed: was .messages?.content
      if (!content) {
        throw new Error('No content in AI response');
      }
      response = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error("Parse error:", e);
      throw new Error("Failed to parse AI response");
    }

    res.json({
      answer: response?.answer || "No answer available",
      needs_vet: ["yes", "no", "possibly"].includes(response?.needs_vet?.toLowerCase())
        ? response.needs_vet.toLowerCase()
        : "possibly",
      disclaimer: "AI suggestions should not replace professional veterinary advice"
    });

  } catch (error) {
    console.error("Ask question error:", error);
    res.status(500).json({ 
      error: "Failed to get AI response",
      fallback_answer: "Please consult your veterinarian for this question",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


async function checkForDiseaseOutbreak(detection, wss) {
  try {
    // Get the pet's location info with proper null checks
    const pet = await Pet.findById(detection.pet_id).populate('owner_id');
    if (!pet || !pet.owner_id) {
      console.log('Pet or owner not found');
      return;
    }

    // Check if owner has location data
    if (!pet.owner_id.city) {
      console.log('Owner missing location data');
      return;
    }

    // Find similar cases in the same area within 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // First find all matching cases (regardless of location)
    const allMatchingCases = await SkinConditionDetection.find({
      _id: { $ne: detection._id },
      prediction: detection.prediction,
      confidence: { $gt: 0.3 },
      species: detection.species,
      createdAt: { $gte: fortyEightHoursAgo },
      user_id: { $exists: true, $ne: null } // Ensure user_id exists
    }).populate({
      path: 'user_id',
      select: 'city village'
    });

    // Filter cases that match the location
    const similarCases = allMatchingCases.filter(caseItem => {
      return caseItem.user_id && 
             caseItem.user_id.city === pet.owner_id.city &&
             (caseItem.user_id.village === pet.owner_id.village || 
              (!caseItem.user_id.village && !pet.owner_id.village));
    });

    console.log(`Found ${similarCases.length} similar cases in ${pet.owner_id.city}`);

    // If we have 2 or more similar cases (plus current = 3 total), create an alert
    if (similarCases.length >= 2) {
      const allCases = [...similarCases, detection];
      const regionMap = new Map();
allCases.concat(detection).forEach(c => {
  const city = c.user_id?.city || pet.owner_id.city;
  const village = c.user_id?.village || pet.owner_id.village || null;
  const key = `${city}-${village || 'null'}`;
  if (city && !regionMap.has(key)) {
    regionMap.set(key, { city, village });
  }
});
const regions = Array.from(regionMap.values());


      // Check if active alert already exists
      const existingAlert = await DiseaseAlert.findOne({
        disease: detection.prediction,
        species: detection.species,
        isActive: true,
        'regions.city': pet.owner_id.city,
        'regions.village': pet.owner_id.village || { $exists: false }
      });

      if (!existingAlert) {
        // Determine severity based on confidence and case count
        const avgConfidence = allCases.reduce((sum, c) => sum + c.confidence, 0) / allCases.length;
        let severity = 'low';
        if (avgConfidence > 0.8 || allCases.length > 5) severity = 'high';
        else if (avgConfidence > 0.3 || allCases.length > 3) severity = 'medium';

        // Create the alert
        const alert = new DiseaseAlert({
          disease: detection.prediction,
          species: detection.species,
          regions,
          caseCount: allCases.length,
          confidenceThreshold: avgConfidence,
          severity,
          message: `Potential ${detection.prediction} outbreak detected in ${pet.owner_id.city}${pet.owner_id.village ? ` (${pet.owner_id.village})` : ''}`,
          recommendations: [
            `Monitor your ${detection.species} for symptoms of ${detection.prediction}`,
            'Avoid contact with other animals in the area',
            'Consult your veterinarian if symptoms appear'
          ],
          triggeredByCases: allCases.map(c => c._id)
        });

        await alert.save();
        console.log(`Created new disease alert for ${detection.prediction}`);

        // Notify users in the area
        if (wss) {
          await notifyDiseaseAlert(alert, wss);
        }
      } else {
        // Update existing alert
        existingAlert.caseCount = similarCases.length + 1;
        await existingAlert.save();
        console.log(`Updated existing alert for ${detection.prediction}`);
      }
    }
  } catch (error) {
    console.error('Error checking for disease outbreak:', error);
  }
}

const notifyDiseaseAlert = async (alert, wss) => {
  try {
    // Go through each region in the alert
    for (const region of alert.regions) {
      console.log(`🌐 Processing alert for region: ${region.city}, ${region.village || 'No village'}`);

      // 1. Find ALL users in the same city (regardless of village)
      const userQuery = {
        city: region.city
      };
      
      // Only add village filter if it exists in the region
      if (region.village) {
        userQuery.$or = [
          { village: region.village },
          { village: { $in: [null, ''] } }
        ];
      }

      const users = await User.find(userQuery).select('_id city village');

      if (users.length === 0) {
        console.log(`⚠️ No users found in ${region.city}, ${region.village}`);
        continue;
      }

      // 2. Get ALL pets of the correct species owned by these users
      const userIds = users.map(u => u._id);
      const affectedPets = await Pet.find({
        owner_id: { $in: userIds },
        species: alert.species
      }).populate('owner_id');

      if (affectedPets.length === 0) {
        console.log(`⚠️ No ${alert.species} pets found in ${region.city}`);
        continue;
      }

      console.log(`✅ Found ${affectedPets.length} ${alert.species} pets in ${region.city}`);

      // 3. Notify each pet's owner (deduplicate owners)
      const notifiedOwners = new Set();
      
      for (const pet of affectedPets) {
        if (!pet || !pet.owner_id || notifiedOwners.has(pet.owner_id._id.toString())) {
          continue;
        }

        notifiedOwners.add(pet.owner_id._id.toString());
        
        const message = `⚠️ Disease Alert in ${region.city}${region.village ? ' - ' + region.village : ''}: ${alert.disease} may affect ${alert.species} in your area.`;
        const link = `/alerts/${alert._id}`;

        // Create UserAlert record first
        const userAlert = new UserAlert({
          userId: pet.owner_id._id,
          petId: pet._id,
          alertId: alert._id,
          alertModel: 'DiseaseAlert',
          read: false
        });
        await userAlert.save();
        console.log(`📌 Created UserAlert record for user ${pet.owner_id._id}`);

        // Save notification to DB
        await notificationController.createNotification(
          pet.owner_id._id,
          message,
          link,
          'disease-alert',
          wss,
          alert.severity,
          pet._id,
          alert._id
        );

        // Send via WebSocket
        const activeConnections = global.activeConnections || {};
        const targetWs = activeConnections[pet.owner_id._id.toString()];
        
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          try {
            targetWs.send(JSON.stringify({
              type: 'disease-alert',
              message,
              link,
              severity: alert.severity,
              petId: pet._id,
              alertId: alert._id,
              createdAt: new Date(),
              userAlertId: userAlert._id // Include the UserAlert ID in the WS message
            }));
            console.log(`✅ WS sent to user ${pet.owner_id._id}`);
          } catch (err) {
            console.error(`❌ WS send failed to user ${pet.owner_id._id}:`, err);
          }
        } else {
          console.log(`ℹ️ User ${pet.owner_id._id} not connected via WS`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in notifyDiseaseAlert:', error);
    throw error; // Re-throw to allow higher level handling
  }
};
