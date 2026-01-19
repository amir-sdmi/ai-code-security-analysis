const express = require('express');
const Agreement = require('../models/agreementModel');
const { sendToChatGPTWithQuery2, sendToChatGPTWithQuery3, chatWithGPT } = require('../chatgptService'); // Import chatWithGPT

const router = express.Router();

router.post('/ai-insight-agreement', async (req, res) => {
    try {
        const { companyName, agreementName, versionNumber } = req.body;

        // Log the input values
        console.log('Received values:', { companyName, agreementName, versionNumber });

        // Fetch the agreement details from the database using the company name and agreement name
        const agreement = await Agreement.findOne({ companyName, agreementName });
        console.log('Agreement found:', agreement);

        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        // Find the specific version with the given version number
        const version = agreement.versions.find(v => v.versionNumber === versionNumber);
        console.log('Version found:', version);

        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }

        // Check if aiInsight is already present
        if (version.aiInsight) {
            console.log('AI Insight already present:', version.aiInsight);
            return res.status(200).json(version.aiInsight);
        }

        // Log the aiOutput to the console
        console.log('AI Output:', version.aiOutput);

        // Send the aiOutput to ChatGPT service using query2
        const chatGPTResponse = await sendToChatGPTWithQuery2(version.aiOutput);
        console.log('ChatGPT Response:', chatGPTResponse);

        // Save the ChatGPT response in MongoDB
        version.aiInsight = chatGPTResponse;
        await agreement.save();
        
        res.status(200).json({ message: 'AI Insight fetched and saved successfully', aiInsight: chatGPTResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.post('/compare-ai-insight-agreement', async (req, res) => {
    try {
        const { companyName, agreementName, versionNumberA, versionNumberB } = req.body;

        // Log the input values
        console.log('Received values:', { companyName, agreementName, versionNumberA, versionNumberB });

        // Fetch the agreement details from the database using the company name and agreement name
        const agreement = await Agreement.findOne({ companyName, agreementName });
        console.log('Agreement found:', agreement);

        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        // Find the specific versions with the given version numbers
        const versionA = agreement.versions.find(v => v.versionNumber === versionNumberA);
        const versionB = agreement.versions.find(v => v.versionNumber === versionNumberB);
        console.log('Version A found:', versionA);
        console.log('Version B found:', versionB);

        if (!versionA || !versionB) {
            return res.status(404).json({ message: 'One or both versions not found' });
        }

        // Log the aiOutputs to the console
        console.log('AI Output A:', versionA.aiOutput);
        console.log('AI Output B:', versionB.aiOutput);

        // Send the aiOutputs to ChatGPT service for comparison
        const comparisonText = `Compare the following AI outputs:\n\nContract Version A status:\n${versionA.aiOutput}\n\n Contract Version B status:\n${versionB.aiOutput}`;
        const chatGPTResponse = await sendToChatGPTWithQuery3(comparisonText);
        console.log('ChatGPT Response:', chatGPTResponse);

        res.status(200).json({ comparison: chatGPTResponse });
    
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.post('/chat-ai-insight-agreement', async (req, res) => {
    try {
        const { initialResponse, userQuestion } = req.body;
        // Log the input values
        console.log('Received values:', { initialResponse, userQuestion });
        
        // User Q&A with ChatGPT based on the initial comparison output
        const chatGPTResponse = await chatWithGPT(initialResponse, userQuestion);
        console.log('ChatGPT Q&A Response:', chatGPTResponse);
        return res.status(200).json({ message: 'ChatGPT Q&A response fetched successfully', response: chatGPTResponse });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

module.exports = router;