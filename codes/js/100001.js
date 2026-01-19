const express = require('express');
const router = express.Router();
const { generateEducationalContent } = require('../controllers/generateContentController');

// @route   POST /api/generate-content
// @desc    Generate a script using Gemini, convert to TTS, upload to GCS, save in MongoDB
// @access  Public (or secure with auth middleware if needed)
router.post('/generate-content', generateEducationalContent);

module.exports = router;
