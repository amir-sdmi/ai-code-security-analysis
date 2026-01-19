const { db } = require('../config/firebaseConfig');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sendToChatGPT = async (existingData, newData) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: 'user',
          content: `Here is an existing LinkedIn profile:
          ${JSON.stringify(existingData)}

          Based on the following new information, please update the LinkedIn profile:
          ${JSON.stringify(newData)}

          Please provide an updated LinkedIn profile in the following JSON format:

          {
            "personal_info": {
              "first_name": "",
              "last_name": "",
              "email": "",
              "location": "",
              "headline": ""
            },
            "about": "",
            "experience": [
              {
                "designation": "",
                "company": "",
                "duration": "",
                "location": "",
                "description": "",
                "job type": ""
              }
            ],
            "education": [
              {
                "institution": "",
                "degree": "",
                "graduation_year": ""
              }
            ],
            "certifications": [
              {
                "Certificate name": "",
                "issued by": "",
                "issued date": ""
              }
            ],
            "skills": [],
            "languages": []
          }

          Ensure all fields are updated with the new information, but retain and improve upon existing information where appropriate.`,
        },
      ],
    });

    const responseContent = response.choices[0].message.content.trim();

    // Extract the JSON block using regex
    const jsonString = responseContent.match(/{[\s\S]*}/)?.[0];

    if (jsonString) {
      return JSON.parse(jsonString);
    } else {
      throw new Error('No valid JSON found in the response');
    }
  } catch (error) {
    console.error(error);
    throw new Error('Error communicating with ChatGPT');
  }
};

const updateProfile = async (req, res) => {
  const { profileData } = req.body;
  const userId = req.user.uid;

  try {
    const userProfileRef = db.collection('profiles').doc(userId);
    const userProfile = await userProfileRef.get();

    let existingProfileData = {};
    if (userProfile.exists) {
      existingProfileData = userProfile.data().profileData;
    }

    // Send both the existing profile data and the new profile data to ChatGPT
    const generatedProfile = await sendToChatGPT(existingProfileData, profileData);

    // Update Firestore with the new generated profile
    if (userProfile.exists) {
      await userProfileRef.update({
        profileData: generatedProfile,
        updatedAt: new Date(),
      });
    } else {
      await userProfileRef.set({
        profileData: generatedProfile,
        createdAt: new Date(),
      });
    }

    res.status(200).json({ message: 'Profile updated successfully!', generatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  const userId = req.user.uid;

  try {
    const userProfileRef = db.collection('profiles').doc(userId);
    const userProfile = await userProfileRef.get();

    if (!userProfile.exists) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(userProfile.data());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const getProfileBYId = async (req, res) => {
  const userId = req.params.id;

  try {
    const userProfileRef = db.collection('profiles').doc(userId);
    const userProfile = await userProfileRef.get();

    if (!userProfile.exists) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(userProfile.data());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateProfile, getProfile, getProfileBYId };
