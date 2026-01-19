const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini (we'll add Claude later)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');

// Configuration
const IMAGE_DIRS = [
  path.join(__dirname, '../public/images/products'),
  path.join(__dirname, '../public/images/vendors'),
  path.join(__dirname, '../../teva-deli'),
  path.join(__dirname, '../../people-store'),
  path.join(__dirname, '../../queens-cuisine'),
  path.join(__dirname, '../../gahn-delight'),
  path.join(__dirname, '../../vop-shop'),
  path.join(__dirname, '../../Garden of Light (1)')
];

// Vision prompt for product analysis
const VISION_PROMPT = `Analyze this product image and provide:
1. Product name (be specific)
2. Product category (e.g., "Vegan Meat Alternative", "Fermented Foods", "Beverages")
3. Brand or vendor (if visible)
4. Detailed description (2-3 sentences)
5. Key ingredients or features visible
6. Is this a real product photo or placeholder? (confidence 0-100)

Format your response as JSON:
{
  "productName": "...",
  "category": "...",
  "vendor": "...",
  "description": "...",
  "features": ["..."],
  "isProductPhoto": true/false,
  "confidence": 0-100
}`;

// Collect all images
async function collectAllImages() {
  const images = [];
  
  for (const dir of IMAGE_DIRS) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
          const fullPath = path.join(dir, file);
          const stats = await fs.stat(fullPath);
          images.push({
            path: fullPath,
            filename: file,
            directory: path.basename(dir),
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    } catch (error) {
      console.log(`Skipping directory ${dir}: ${error.message}`);
    }
  }
  
  return images;
}

// Analyze image with Gemini Vision
async function analyzeImageWithGemini(imagePath) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Read image as base64
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    
    const result = await model.generateContent([
      VISION_PROMPT,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
    }
    
    return null;
  } catch (error) {
    console.error(`Gemini analysis failed for ${imagePath}:`, error.message);
    return null;
  }
}

// Mock Claude analysis (to be implemented with actual API)
async function analyzeImageWithClaude(imagePath) {
  // For now, return mock data
  // In production, use actual Claude API
  return {
    productName: "Pending Claude Analysis",
    confidence: 0
  };
}

// Load current product catalog
async function loadCurrentCatalog() {
  try {
    const catalogPath = path.join(__dirname, '../lib/data/complete-catalog.ts');
    const catalogContent = await fs.readFile(catalogPath, 'utf-8');
    
    // Extract product data from the TypeScript file
    const productsMatch = catalogContent.match(/export const completeProductCatalog = (\[[\s\S]*\]);/);
    if (productsMatch) {
      // Use eval carefully here - in production use proper parsing
      const products = eval(productsMatch[1]);
      return products;
    }
  } catch (error) {
    console.error('Failed to load catalog:', error);
  }
  return [];
}

// Match vision results with current catalog
function matchWithCatalog(visionResult, currentProducts, imagePath) {
  const matches = [];
  
  for (const product of currentProducts) {
    let score = 0;
    
    // Check name similarity
    if (product.name.toLowerCase().includes(visionResult.productName.toLowerCase()) ||
        visionResult.productName.toLowerCase().includes(product.name.toLowerCase())) {
      score += 40;
    }
    
    // Check vendor match
    if (visionResult.vendor && product.vendor) {
      if (product.vendor.toLowerCase().includes(visionResult.vendor.toLowerCase()) ||
          visionResult.vendor.toLowerCase().includes(product.vendor.toLowerCase())) {
        score += 30;
      }
    }
    
    // Check category match
    if (visionResult.category && product.category) {
      if (product.category.toLowerCase().includes(visionResult.category.toLowerCase()) ||
          visionResult.category.toLowerCase().includes(product.category.toLowerCase())) {
        score += 20;
      }
    }
    
    // Check if image path contains product ID
    if (imagePath.toLowerCase().includes(product.id.toLowerCase())) {
      score += 10;
    }
    
    if (score > 0) {
      matches.push({
        product,
        score,
        visionResult
      });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// Generate audit report
async function generateAuditReport(results) {
  const report = {
    summary: {
      totalImages: results.length,
      productPhotos: results.filter(r => r.visionAnalysis?.isProductPhoto).length,
      placeholders: results.filter(r => !r.visionAnalysis?.isProductPhoto).length,
      highConfidence: results.filter(r => r.matchScore >= 70).length,
      mediumConfidence: results.filter(r => r.matchScore >= 40 && r.matchScore < 70).length,
      lowConfidence: results.filter(r => r.matchScore < 40).length,
      noMatch: results.filter(r => !r.bestMatch).length
    },
    details: results,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(__dirname, '../vision-audit-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

// Main audit function
async function runVisionAudit() {
  console.log('🔍 Starting Vision-Based Product Audit...\n');
  
  // Step 1: Collect all images
  console.log('📸 Collecting all images...');
  const images = await collectAllImages();
  console.log(`Found ${images.length} images\n`);
  
  // Step 2: Load current catalog
  console.log('📚 Loading current product catalog...');
  const currentProducts = await loadCurrentCatalog();
  console.log(`Loaded ${currentProducts.length} products\n`);
  
  // Step 3: Analyze images
  console.log('🤖 Analyzing images with Vision AI...');
  const results = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`\nAnalyzing ${i + 1}/${images.length}: ${image.filename}`);
    
    // Analyze with vision APIs
    const geminiResult = await analyzeImageWithGemini(image.path);
    const claudeResult = await analyzeImageWithClaude(image.path);
    
    // Use Gemini result as primary (add Claude when available)
    const visionAnalysis = geminiResult || claudeResult;
    
    if (visionAnalysis) {
      // Match with catalog
      const matches = matchWithCatalog(visionAnalysis, currentProducts, image.path);
      const bestMatch = matches[0];
      
      results.push({
        image: image,
        visionAnalysis: visionAnalysis,
        bestMatch: bestMatch?.product,
        matchScore: bestMatch?.score || 0,
        allMatches: matches.slice(0, 3) // Top 3 matches
      });
      
      console.log(`✅ ${visionAnalysis.productName} (Confidence: ${visionAnalysis.confidence}%)`);
      if (bestMatch) {
        console.log(`   Matched to: ${bestMatch.product.name} (Score: ${bestMatch.score})`);
      } else {
        console.log(`   ❌ No match found in catalog`);
      }
    } else {
      results.push({
        image: image,
        visionAnalysis: null,
        error: 'Vision analysis failed'
      });
      console.log(`❌ Analysis failed`);
    }
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 4: Generate report
  console.log('\n📊 Generating audit report...');
  const report = await generateAuditReport(results);
  
  console.log('\n✅ Audit Complete!');
  console.log(`\nSummary:`);
  console.log(`- Total Images: ${report.summary.totalImages}`);
  console.log(`- Product Photos: ${report.summary.productPhotos}`);
  console.log(`- High Confidence Matches: ${report.summary.highConfidence}`);
  console.log(`- Low Confidence Matches: ${report.summary.lowConfidence}`);
  console.log(`- No Matches: ${report.summary.noMatch}`);
  console.log(`\nReport saved to: vision-audit-report.json`);
}

// Run the audit
if (require.main === module) {
  runVisionAudit().catch(console.error);
}

module.exports = { runVisionAudit, analyzeImageWithGemini };