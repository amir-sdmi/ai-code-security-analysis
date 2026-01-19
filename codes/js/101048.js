import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import { logger } from '../utils/index.js';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

function processHtmlWithImages(htmlContent) {
  // Array to store extracted images
  const images = [];
  
  // Find all base64 image tags
  const imgRegex = /<img[^>]+src=["']data:image\/(jpeg|png|gif|webp);base64,([^"']+)["'][^>]*>/gi;
  
  // Replace each base64 image with a CID reference
  const processedHtml = htmlContent.replace(imgRegex, (match, type, base64Data, offset) => {
    // Extract any alt text from the original image
    const altMatch = match.match(/alt=["']([^"']*)["']/i);
    const altText = altMatch ? altMatch[1] : `Image ${images.length + 1}`;
    
    // Generate a unique content ID for this image
    const contentId = `image-${Date.now()}-${images.length + 1}`;
    
    // Store the image data
    images.push({
      contentId,
      contentType: `image/${type}`,
      base64Data,
      fileName: `${contentId}.${type}`,
      altText
    });
    
    // Replace with a CID reference that email clients understand
    return `<img src="cid:${contentId}" alt="${altText}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;">`;
  });
  
  return {
    html: processedHtml,
    images
  };
}

async function generateContent(promptText) {
  try {
    logger.info('Generating content with Gemini API');
    
    // Add instructions to ensure we get well-formatted HTML with appropriate images
    const enhancedPrompt = `${promptText}
    
    Please respond with well-formatted HTML content wrapped in <html><body>...</body></html> tags.
    Include appropriate styling to make the content look professional and readable in an email.
    
    Do not include any images, base64 data, or other non-textual content. Focus solely on textual information.`;
    
    // Use Gemini-2.0-flash model for quick response
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Using the correct format for the Gemini API
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
    });
    
    const response = await result.response;
    const rawHtml = response.text();
    
    // Process the HTML to handle base64 images
    const processedContent = processHtmlWithImages(rawHtml);
    
    if (processedContent.images.length > 0) {
      logger.info(`Successfully generated content with ${processedContent.images.length} embedded images`);
    } else {
      logger.info('Successfully generated content (no images)');
    }
    
    return processedContent;
  } catch (error) {
    logger.error(`Error generating content: ${error.message}`);
    throw error;
  }
}

export {
  generateContent,
};