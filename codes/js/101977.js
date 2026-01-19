/**
 * Video Generation Service
 * 
 * This service integrates with Gemini/Veo2 to generate videos for loading screens
 * and other video content needs in the application.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadFileToSirv } from './sirvService.js';
import axios from 'axios';

// Load environment variables
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (error) {
  logger.error('[VideoGenerationService] Error loading environment variables:', error);
}

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20'; // Use same model as main service
const SIRV_CLIENT_ID = process.env.SIRV_CLIENT_ID;
const SIRV_CLIENT_SECRET = process.env.SIRV_CLIENT_SECRET;

let genAI;
let initialized = false;

/**
 * Initialize the video generation service
 */
export const initializeVideoGenerationService = () => {
  try {
    if (!GEMINI_API_KEY) {
      logger.error('[VideoGenerationService] GEMINI_API_KEY not found in environment variables');
      return false;
    }

    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    initialized = true;
    logger.info('[VideoGenerationService] Video generation service initialized successfully');
    return true;
  } catch (error) {
    logger.error('[VideoGenerationService] Error initializing service:', error);
    return false;
  }
};

/**
 * Generate video using Gemini/Veo2
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The text prompt for video generation
 * @param {string} params.aspectRatio - Either '2:3' or '9:16'
 * @param {number} params.duration - Duration in seconds (default: 8)
 * @param {string} params.jobId - Job ID for tracking
 * @returns {Promise<Object>} Result with video data and metadata
 */
export const generateVideo = async ({ prompt, aspectRatio = '9:16', duration = 8, jobId }) => {
  if (!initialized) {
    const initResult = initializeVideoGenerationService();
    if (!initResult) {
      throw new Error('Video generation service not properly initialized');
    }
  }

  try {
    logger.info(`[VideoGenerationService] Generating video for job ${jobId} with prompt: "${prompt}"`);

    // Validate aspect ratio
    if (!['2:3', '9:16'].includes(aspectRatio)) {
      throw new Error('Invalid aspect ratio. Must be either "2:3" or "9:16"');
    }

    // Validate duration
    if (duration < 1 || duration > 60) {
      throw new Error('Duration must be between 1 and 60 seconds');
    }

    // Get the model for video generation
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        responseModalities: ["TEXT", "VIDEO"] // Enable video generation
      }
    });

    // Enhanced prompt with technical specifications
    const enhancedPrompt = `Create a high-quality ${duration}-second video with ${aspectRatio} aspect ratio (vertical format). 

Content: ${prompt}

Technical requirements:
- Duration: exactly ${duration} seconds
- Aspect ratio: ${aspectRatio} (vertical orientation)
- Resolution: 1080p minimum
- Format: MP4
- Smooth motion and transitions
- Professional quality suitable for loading screens
- No text overlays or watermarks
- Loopable if possible

The video should be engaging, visually appealing, and suitable for use as a loading screen or introduction video.`;

    // Call Gemini API for video generation
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;

    // Check if video content was generated
    let videoData = null;
    let textResponse = null;

    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const content = response.candidates[0].content;
      
      if (content.parts) {
        for (const part of content.parts) {
          if (part.text) {
            textResponse = part.text;
            logger.info(`[VideoGenerationService] Text response: ${part.text}`);
          }
          
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('video/')) {
            videoData = {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            };
            logger.info(`[VideoGenerationService] Video generated successfully: ${part.inlineData.mimeType}`);
          }
        }
      }
    }

    if (!videoData) {
      // If no video was generated, check if it's a capability issue
      const errorMessage = textResponse || 'Video generation failed - no video content returned';
      logger.warn(`[VideoGenerationService] ${errorMessage}`);
      
      // Return a structured response indicating the issue
      return {
        success: false,
        error: 'Video generation not available',
        message: 'Video generation with Veo2 is not currently available in your region or for this model. Please try uploading a video file instead.',
        textResponse: textResponse,
        canRetry: false
      };
    }

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoData.data, 'base64');
    
    // Create temporary file
    const tempDir = path.resolve('./tmp/video-generation');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFileName = `generated-video-${jobId}-${Date.now()}.mp4`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Write video to temporary file
    fs.writeFileSync(tempFilePath, videoBuffer);
    
    // Upload to Sirv
    const sirvPath = `app-demos/loading-videos/${jobId}/ai-generated-${Date.now()}.mp4`;
    logger.info(`[VideoGenerationService] Uploading to Sirv: ${sirvPath}`);
    
    const sirvUrl = await uploadFileToSirv(tempFilePath, sirvPath, true); // Delete local file after upload
    
    // Clean up temp file if it still exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    logger.info(`[VideoGenerationService] Video generated and uploaded successfully: ${sirvUrl}`);
    
    return {
      success: true,
      videoUrl: sirvUrl,
      aspectRatio: aspectRatio,
      duration: duration,
      prompt: prompt,
      mimeType: videoData.mimeType,
      fileSize: videoBuffer.length,
      textResponse: textResponse
    };

  } catch (error) {
    logger.error('[VideoGenerationService] Error generating video:', error);
    
    // Handle specific error cases
    if (error.message.includes('not supported') || error.message.includes('not available')) {
      return {
        success: false,
        error: 'Video generation not supported',
        message: 'Video generation with Veo2 is not currently available for this model or region. Please try uploading a video file instead.',
        canRetry: false
      };
    }
    
    return {
      success: false,
      error: error.message,
      message: 'An error occurred during video generation. Please try again with a different prompt.',
      canRetry: true
    };
  }
};

/**
 * Check if video generation is available
 * @returns {Promise<boolean>} True if video generation is available
 */
export const isVideoGenerationAvailable = async () => {
  if (!initialized) {
    const initResult = initializeVideoGenerationService();
    if (!initResult) {
      return false;
    }
  }

  try {
    // Just check if we can initialize the model with video generation config
    // Don't actually try to generate content as this is expensive and may not work
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        responseModalities: ["TEXT", "VIDEO"]
      }
    });

    // If we can create the model successfully, assume video generation might work
    // The actual capability will be tested when user tries to generate
    logger.info('[VideoGenerationService] Video generation model initialized successfully');
    return true;
    
  } catch (error) {
    logger.error('[VideoGenerationService] Error checking video generation availability:', error);
    
    // If video generation isn't supported, we can still try with basic model
    try {
      const basicModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      logger.info('[VideoGenerationService] Basic model available, video generation may be limited');
      return true; // Allow users to try, with proper error handling in generation
    } catch (basicError) {
      logger.error('[VideoGenerationService] Basic model also failed:', basicError);
      return false;
    }
  }
};

/**
 * Get video generation service status
 * @returns {Object} Service status information
 */
export const getVideoGenerationStatus = () => {
  return {
    initialized: initialized,
    hasApiKey: !!GEMINI_API_KEY,
    model: GEMINI_MODEL,
    hasSirvCredentials: !!(SIRV_CLIENT_ID && SIRV_CLIENT_SECRET),
    supportedAspectRatios: ['2:3', '9:16'],
    maxDuration: 60,
    defaultDuration: 8
  };
};

// Initialize on module load
initializeVideoGenerationService(); 