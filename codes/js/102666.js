// lib/reviewAnalysis.js
import { GoogleGenerativeAI } from '@google/generative-ai';

class ReviewAnalysisService {
 constructor() {
   // Initialize Gemini AI
   this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
   // Use Gemini 2.0 Flash - stable release
   this.model = this.genAI.getGenerativeModel({ 
     model: "gemini-2.0-flash",
     generationConfig: {
       temperature: 0.1, // Low temperature for consistent analysis
       topP: 0.8,
       topK: 40,
       maxOutputTokens: 2048,
     }
   });
   
   // Image fetch rate limiting (simple in-memory tracker)
   this.imageFetchAttempts = new Map();
   this.maxImageFetchesPerMinute = 10;
 }

 // Initialize model method for retry scenarios
 async initializeModel() {
   try {
     this.model = this.genAI.getGenerativeModel({ 
       model: "gemini-2.0-flash",
       generationConfig: {
         temperature: 0.1,
         topP: 0.8,
         topK: 40,
         maxOutputTokens: 2048,
       }
     });
     console.log('Gemini 2.0 Flash model initialized successfully');
   } catch (error) {
     console.error('Failed to initialize Gemini model:', error);
     throw error;
   }
 }

 // Calculate days between two dates
 calculateDaysBetween(purchaseDate, reviewDate) {
   try {
     if (!purchaseDate || !reviewDate) {
       return 'N/A';
     }
     
     const purchase = new Date(purchaseDate);
     const review = new Date(reviewDate);
     
     if (isNaN(purchase.getTime()) || isNaN(review.getTime())) {
       return 'Invalid dates';
     }
     
     const diffTime = Math.abs(review - purchase);
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays;
   } catch (error) {
     console.error('Error calculating days between dates:', error);
     return 'Error calculating';
   }
 }

 // Validate flags against allowed enum values
 validateFlags(flags) {
   const validFlags = [
     'spam', 'fake', 'inappropriate', 'helpful', 'verified_purchase',
     'long_text', 'short_text', 'positive_sentiment', 'negative_sentiment',
     'neutral_sentiment', 'high_sentiment_mismatch', 'moderate_sentiment_mismatch',
     'generic_language', 'suspiciously_short', 'ai_flagged_suspicious',
     'safety_filter_triggered', 'batch_analysis_error', 'product_mismatch',
     'no_purchase_verification', 'purchase_timing_suspicious', 'product_irrelevant_content',
     'unverified_purchase', 'generic_review', 'potential_fake_review',
     'suspicious_language_patterns', 'lack_product_specificity', 'rating_content_mismatch',
     'promotional_content', 'copy_paste_indicators', 'bot_like_patterns',
     'emotional_authenticity_low', 'timeline_suspicious', 'multiple_edits_suspicious',
     'technical_inaccuracies', 'price_expectation_mismatch', 'no_purchase_record',
     'lack_of_personal_experience', 'insufficient_product_details', 'overly_generic_language',
     'timing_analysis_suspicious', 'authenticity_concerns', 'product_knowledge_lacking',
     'review_pattern_suspicious', 'language_style_inconsistent', 'emotional_tone_mismatch',
     'product_feature_mismatch', 'experience_timeline_inconsistent', 'unverified_reviewer',
     'future_review_date', 'image_mismatch', 'stock_photo', 'low_quality_image',
     'sentiment_image_mismatch', 'promotional_style', 'watermark_detected',
     'image_generic', 'image_processing_error', 'image_analysis_failed',
     'image_analysis_error', 'json_parse_error', 'complete_analysis_failure',
     'no_purchase_image'
   ];

   if (!Array.isArray(flags)) {
     console.warn('Invalid flags format, expected array:', flags);
     return [];
   }

   const validatedFlags = flags.filter(flag => {
     if (typeof flag !== 'string') {
       console.warn('Invalid flag type, expected string:', flag);
       return false;
     }
     
     if (!validFlags.includes(flag)) {
       console.warn(`Invalid flag "${flag}" - not in allowed enum values. Adding as generic flag.`);
       // Return true but log the warning - we'll handle invalid flags gracefully
       return false;
     }
     
     return true;
   });

   console.log(`Flag validation: ${flags.length} input flags, ${validatedFlags.length} valid flags`);
   return validatedFlags;
 }

 async analyzeReview(reviewData) {
   console.log('🔍 Starting enhanced review analysis with product context:', {
     hasPurchased: reviewData.hasPurchased,
     purchaseDate: reviewData.purchaseDate,
     comment: reviewData.comment?.substring(0, 100) + '...',
     rating: reviewData.rating,
     productName: reviewData.productName
   });

   try {
     // Ensure model is initialized
     if (!this.model) {
       console.log('Model not initialized. Initializing now...');
       await this.initializeModel();
     }

     // Validate input data
     if (!reviewData || !reviewData.comment || reviewData.rating === undefined) {
       throw new Error('Invalid review data: missing comment or rating');
     }

     // Enhanced AI analysis prompt for comprehensive review assessment with detailed requirements
     const prompt = `
You are an EXPERT AI review fraud detection system with advanced analytical capabilities and real-world business intelligence.

REVIEW DATA:
- Rating: ${reviewData.rating}/5 stars
- Comment: "${reviewData.comment.trim()}"
- User: ${reviewData.user || 'Anonymous'}
- Review Date: ${reviewData.reviewDate || new Date().toISOString()}

PRODUCT CONTEXT:
- Product Name: "${reviewData.productName || 'Unknown Product'}"
- Product Description: "${reviewData.productDescription || 'No description available'}"
- Product Category: "${reviewData.productCategory || 'Unknown Category'}"
- Product Price: "${reviewData.productPrice || 'Unknown Price'}"

PURCHASE VERIFICATION STATUS:
- User Has Purchased Product: ${reviewData.hasPurchased === true ? 'YES - VERIFIED PURCHASER WITH COMPLETED ORDER ✅' : reviewData.hasPurchased === false ? 'NO - UNVERIFIED USER ❌' : 'UNKNOWN STATUS ⚠️'}
- Purchase Date: ${reviewData.purchaseDate || 'No purchase record found'}
- Review Date: ${reviewData.reviewDate || new Date().toISOString()}
- Days Between Purchase and Review: ${this.calculateDaysBetween(reviewData.purchaseDate, reviewData.reviewDate)} days

🧠 INTELLIGENT ANALYSIS RULES:

VERIFIED PURCHASERS (hasPurchased = true):
✅ AUTOMATIC BENEFITS:
- Classification: "genuine" (unless extreme bot behavior detected)
- Confidence: 0.85-0.95 (high confidence)
- Purchase Verification Score: 0.95 (verified buyer)
- Authenticity Score: 0.80-0.90 (real customer)
- Sentiment Score: Based on actual review content (can be low if disappointed)
- Product Relevance Score: 0.80-0.90 (bought the product)
- Overall Risk Score: 0.10-0.25 (low risk)
- Remove flags: "no_purchase_record", "unverified_reviewer"

REAL-WORLD LOGIC FOR VERIFIED PURCHASERS:
- 1-star + negative comment = GENUINE (disappointed customer)
- 5-star + positive comment = GENUINE (satisfied customer)
- 5-star + negative comment = GENUINE (rating system confusion or sarcasm)
- 1-star + positive comment = GENUINE (rating system confusion)
- Generic language = STILL GENUINE (not everyone writes detailed reviews)
- Quick review timing = GENUINE (excited to share experience)
- Delayed review timing = GENUINE (took time to test product)
- Sentiment-rating mismatch = GENUINE (customer confusion, not fraud)

UNVERIFIED USERS (hasPurchased = false):
❌ AUTOMATIC PENALTIES:
- Classification: "suspicious" (high probability of fake)
- Confidence: 0.20-0.40 (low confidence)
- Purchase Verification Score: 0.10-0.20 (no purchase proof)
- Must include flags: "no_purchase_record", "unverified_reviewer"
- Higher scrutiny for all other metrics

NON-PURCHASER RED FLAGS:
- 5-star + generic positive = FAKE PROMOTIONAL REVIEW
- 5-star + negative comment = HIGHLY SUSPICIOUS (coordinated attack)
- 1-star + positive comment = HIGHLY SUSPICIOUS (review manipulation)
- Overly detailed product knowledge without purchase = SUSPICIOUS
- Perfect grammar + promotional language = BOT REVIEW
- Generic timing patterns = COORDINATED ATTACK

UNKNOWN STATUS (hasPurchased = null/undefined):
⚠️ MODERATE APPROACH:
- Classification: "pending" (needs manual review)
- Confidence: 0.40-0.60 (moderate)
- Include flag: "unverified_reviewer"
- Analyze content more carefully

ADVANCED PATTERN RECOGNITION:

1. SENTIMENT-RATING INTELLIGENCE:
  - Verified buyer + ANY rating mismatch = GENUINE (honest opinion or confusion)
  - Non-buyer + rating mismatch = SUSPICIOUS (fake review)
  - Perfect 5-star + generic praise = Check purchase status first

2. CONTENT QUALITY ANALYSIS:
  - Verified buyer + brief review = GENUINE (busy customer)
  - Non-buyer + brief review = SUSPICIOUS (lazy fake)
  - Verified buyer + detailed review = GENUINE (engaged customer)
  - Non-buyer + detailed review = SUSPICIOUS (over-compensation)

3. TIMING INTELLIGENCE:
  - Same day purchase + review = GENUINE (immediate feedback)
  - No purchase + quick review = SUSPICIOUS (fake timing)
  - Long delay + purchase = GENUINE (tested thoroughly)
  - Long delay + no purchase = SUSPICIOUS (coordinated campaign)

4. PRODUCT RELEVANCE INTELLIGENCE:
  - Verified buyer + product mismatch = GENUINE (confused but real)
  - Non-buyer + perfect product match = SUSPICIOUS (researched fake)

5. EDIT PATTERN INTELLIGENCE:
  - Verified buyer + edits = GENUINE (correcting honest mistakes)
  - Non-buyer + edits = SUSPICIOUS (refining fake content)

SCORING INTELLIGENCE:

FOR VERIFIED PURCHASERS:
{
 "sentimentScore": 0.70-0.90, // Based on actual content sentiment
 "authenticityScore": 0.85-0.95, // High authenticity due to purchase
 "productRelevanceScore": 0.80-0.90, // They bought it, so relevant
 "purchaseVerificationScore": 0.95, // Maximum score for verified buyers
 "overallRiskScore": 0.10-0.25 // Low risk due to purchase proof
}

FOR NON-PURCHASERS:
{
 "sentimentScore": 0.30-0.60, // Question the sentiment authenticity
 "authenticityScore": 0.15-0.35, // Low authenticity without purchase
 "productRelevanceScore": 0.20-0.50, // How do they know without buying?
 "purchaseVerificationScore": 0.10-0.20, // No purchase proof
 "overallRiskScore": 0.70-0.90 // High risk without purchase
}

BUSINESS LOGIC PRIORITIES:
1. Purchase verification OVERRIDES everything else
2. Protect genuine customers (even if they're disappointed or confused)
3. Catch fake promotional reviews (non-buyers with generic praise)
4. Understand real customer behavior patterns (including rating confusion)
5. Balance automation with human judgment

${reviewData.editHistory && reviewData.editHistory.length > 0 ? `
EDIT HISTORY (CONTEXT FOR ANALYSIS):
- Number of Edits: ${reviewData.editHistory.length}
- Edit Details: ${reviewData.editHistory.map((edit, index) => `Edit ${index + 1}: ${edit.editedAt}, Previous Rating: ${edit.previousRating}`).join('; ')}
- Note: Verified buyers editing reviews = normal behavior, non-buyers editing = suspicious
` : 'EDIT HISTORY: No edits (Normal)'}

🎯 DETAILED ANALYSIS REQUIREMENTS:

For "purchaseVerificationAnalysis": Write 3-4 comprehensive sentences explaining how the purchase verification status impacts the overall authenticity assessment. Include specific reasoning about why verified purchases carry more weight and how this affects the final classification. Mention the timeline between purchase and review if relevant.

For "productRelevanceAnalysis": Write 3-4 detailed sentences analyzing how well the review content matches the specific product being reviewed. Discuss specific product features mentioned, accuracy of descriptions, and whether the reviewer demonstrates actual product knowledge or generic commentary.

For "authenticityAssessment": Write 4-5 comprehensive sentences providing an overall assessment of review authenticity. Include analysis of language patterns, emotional consistency, reviewer behavior patterns, and how all factors combine to indicate genuine vs suspicious activity. Be specific about what makes this review authentic or concerning.

For "linguisticAnalysis": Write 3-4 detailed sentences analyzing the writing style, language patterns, and emotional authenticity of the review. Discuss grammar patterns, vocabulary usage, emotional tone consistency, and whether the language feels natural or artificial/promotional.

For "suspiciousPatterns": Write 3-4 sentences identifying and explaining any suspicious patterns or red flags detected. Be specific about what patterns were found and why they are concerning. If no suspicious patterns exist, explain what positive indicators support authenticity.

For "timelineAnalysis": Write 2-3 sentences analyzing timing patterns between purchase and review submission, edit patterns if any, and how timing relates to typical customer behavior. Explain whether timing supports or undermines authenticity.

For "specificConcerns": Write 3-4 sentences highlighting specific concerns or positive indicators that influenced the final classification. Be detailed about the most important factors that drove the decision and explain the reasoning behind the confidence level assigned.

Respond with this EXACT JSON structure:

{
 "classification": "genuine" | "suspicious" | "pending",
 "confidence": 0.85,
 "detailedAnalysis": {
   "purchaseVerificationAnalysis": "WRITE 3-4 COMPREHENSIVE SENTENCES HERE with detailed analysis of purchase verification and its impact on authenticity assessment including timeline considerations and verification weight",
   "productRelevanceAnalysis": "WRITE 3-4 DETAILED SENTENCES HERE analyzing how well the review content matches the specific product including feature accuracy and product knowledge demonstration",
   "authenticityAssessment": "WRITE 4-5 COMPREHENSIVE SENTENCES HERE providing overall assessment of review authenticity including language patterns emotional consistency and behavioral analysis",
   "linguisticAnalysis": "WRITE 3-4 DETAILED SENTENCES HERE analyzing writing style language patterns vocabulary usage and emotional tone consistency",
   "suspiciousPatterns": "WRITE 3-4 SENTENCES HERE identifying and explaining any suspicious patterns or red flags with specific reasoning or positive authenticity indicators",
   "timelineAnalysis": "WRITE 2-3 SENTENCES HERE analyzing timing patterns between purchase and review submission and relationship to typical customer behavior",
   "specificConcerns": "WRITE 3-4 SENTENCES HERE highlighting specific concerns or positive indicators that influenced the final classification with detailed reasoning"
 },
 "flags": ["specific_flag_1", "specific_flag_2"],
 "reasoning": "WRITE 4-5 COMPREHENSIVE SENTENCES HERE providing clear explanation of why this review received this classification based on the analysis with specific reasoning and examples",
 "needsManualReview": true/false,
 "scores": {
   "sentimentScore": 0.75,
   "authenticityScore": 0.85,
   "productRelevanceScore": 0.80,
   "purchaseVerificationScore": 0.95,
   "overallRiskScore": 0.20
 },
 "riskLevel": "low" | "medium" | "high",
 "recommendations": {
   "action": "approve" | "reject" | "manual_review",
   "priority": "low" | "medium" | "high", 
   "explanation": "WRITE 3-4 SENTENCES HERE providing detailed recommendation explanation with specific reasoning for the suggested action"
 },
 "keyInsights": [
   "WRITE DETAILED INSIGHT about purchase verification impact with specific reasoning",
   "WRITE DETAILED INSIGHT about content authenticity with specific examples",
   "WRITE DETAILED INSIGHT about overall risk assessment with comprehensive reasoning"
 ]
}

CRITICAL SUCCESS FACTORS:
- Purchase verification is the PRIMARY trust signal
- Real customers can be disappointed, confused, or sarcastic (still genuine if purchased)
- Generic language from verified buyers is acceptable
- Rating-sentiment mismatch from verified buyers is normal human behavior
- Non-buyers should be heavily scrutinized regardless of content quality
- Balance between automated detection and human-like judgment
- Focus on protecting legitimate customers while catching fake reviews
- PROVIDE DETAILED, COMPREHENSIVE ANALYSIS in all text fields - minimum 3-4 sentences each
- BE SPECIFIC about observations, patterns, and reasoning rather than generic statements
- EXPLAIN THE "WHY" behind each assessment with concrete examples from the review

Provide intelligent, nuanced, and HIGHLY DETAILED analysis that reflects real-world e-commerce review patterns and human behavior with comprehensive explanations for all assessments.`;

     let result;
     let attempts = 0;
     const maxAttempts = 3;

     while (attempts < maxAttempts) {
       try {
         console.log(`Gemini API attempt ${attempts + 1}/${maxAttempts}`);
         result = await this.model.generateContent(prompt);
         
         // Check if we got a valid response
         const response = await result.response;
         if (!response) {
           throw new Error('Empty response from Gemini API');
         }
         
         break;
       } catch (error) {
         attempts++;
         console.error(`Gemini API attempt ${attempts} failed:`, error.message);
         
         // Handle specific error types
         if (error.message.includes('SAFETY')) {
           console.warn('Safety filter triggered, adjusting analysis approach');
           // Return a conservative analysis for safety-filtered content
           return this.createSafetyFilteredAnalysis(reviewData);
         }
         
         if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('RATE_LIMIT')) {
           console.warn('Rate limit or quota exceeded, implementing backoff');
           const backoffTime = Math.min(1000 * Math.pow(2, attempts), 10000);
           await new Promise(resolve => setTimeout(resolve, backoffTime));
         }
         
         if (attempts < maxAttempts) {
           // Progressive retry strategy
           await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
           
           // Try reinitializing model on second retry
           if (attempts === 2) {
             try {
               await this.initializeModel();
             } catch (initError) {
               console.error('Model reinitialization failed:', initError);
             }
           }
         } else {
           throw error;
         }
       }
     }

     if (!result) {
       throw new Error('Failed to get response from Gemini after all attempts');
     }

     const response = await result.response;
     const text = response.text();
     
     if (!text || text.trim().length === 0) {
       throw new Error('Empty response text from Gemini');
     }
     
     try {
       // Clean and parse the JSON response
       const cleanedText = this.cleanJsonResponse(text);
       const analysis = JSON.parse(cleanedText);
       
       // IMPORTANT: Perform web search to check for copied content
       console.log('🌐 Performing web search to detect copied content...');
       let webSearchResult = null;
       try {
         webSearchResult = await this.performWebSearch(reviewData.comment);
       } catch (webError) {
         console.warn('⚠️ Web search failed, continuing without it:', webError.message);
       }
       
       // Validate and sanitize the response
       const sanitizedAnalysis = this.sanitizeAnalysis(analysis);
       
       // Integrate web search results into analysis
       if (webSearchResult) {
         sanitizedAnalysis.webSearch = webSearchResult;
         
         // Add web search findings to the analysis
         if (webSearchResult.isCopied) {
           // Add copied content flag
           if (!sanitizedAnalysis.flags) sanitizedAnalysis.flags = [];
           sanitizedAnalysis.flags.push('copied_content');
           
           // Update reasoning to include web search findings
           const originalReasoning = sanitizedAnalysis.reasoning || '';
           sanitizedAnalysis.reasoning = `${originalReasoning} ${webSearchResult.analysis}`;
           
           // Add web search info to detailed analysis if present
           if (sanitizedAnalysis.detailedAnalysis) {
             sanitizedAnalysis.detailedAnalysis.webSearchFindings = webSearchResult.analysis;
           }
           
           console.log('🚨 COPIED CONTENT DETECTED:', {
             confidence: webSearchResult.confidence,
             sources: webSearchResult.sources?.length || 0,
             bestMatch: webSearchResult.bestMatch?.domain
           });
         } else {
           console.log('✅ Original content confirmed by web search');
         }
       }
       
       // POST-PROCESSING: Override for verified purchasers
       console.log('🔍 DEBUG: Post-processing check:', {
         hasPurchased: reviewData.hasPurchased,
         hasPurchasedType: typeof reviewData.hasPurchased,
         hasPurchasedStrict: reviewData.hasPurchased === true
       });
       
       if (reviewData.hasPurchased === true) {
         console.log('🔄 Applying verified purchaser overrides...');
         
         // Force high purchase verification score for verified purchasers
         if (sanitizedAnalysis.scores) {
           console.log('📊 Before override:', sanitizedAnalysis.scores);
           sanitizedAnalysis.scores.purchaseVerificationScore = 0.95;
           // Also boost other scores for verified purchasers
           sanitizedAnalysis.scores.authenticityScore = Math.max(0.8, sanitizedAnalysis.scores.authenticityScore);
           sanitizedAnalysis.scores.sentimentScore = Math.max(0.7, sanitizedAnalysis.scores.sentimentScore);
           sanitizedAnalysis.scores.productRelevanceScore = Math.max(0.8, sanitizedAnalysis.scores.productRelevanceScore);
           sanitizedAnalysis.scores.overallRiskScore = Math.min(0.3, sanitizedAnalysis.scores.overallRiskScore);
           console.log('📊 After override:', sanitizedAnalysis.scores);
         } else {
           console.log('📊 No scores object, creating new one');
           sanitizedAnalysis.scores = {
             purchaseVerificationScore: 0.95,
             authenticityScore: Math.max(0.8, sanitizedAnalysis.authenticityScore || 0.5),
             sentimentScore: Math.max(0.7, sanitizedAnalysis.sentimentScore || 0.5),
             productRelevanceScore: Math.max(0.8, sanitizedAnalysis.productRelevanceScore || 0.5),
             overallRiskScore: Math.min(0.3, sanitizedAnalysis.overallRiskScore || 0.5)
           };
         }
         
         // Remove ALL purchase-related flags for verified purchasers
         if (sanitizedAnalysis.flags) {
           console.log('🏴 Before flag removal:', sanitizedAnalysis.flags);
           const flagsToRemove = ['no_purchase_record', 'unverified_reviewer', 'no_purchase', 'unverified', 'purchase_verification_failed'];
           sanitizedAnalysis.flags = sanitizedAnalysis.flags.filter(flag => 
             !flagsToRemove.some(removeFlag => flag.toLowerCase().includes(removeFlag.toLowerCase()))
           );
           console.log('🏴 After flag removal:', sanitizedAnalysis.flags);
         }
         
         // Force classification to genuine for verified purchasers unless there are EXTREME red flags
         const extremeFlags = ['bot_behavior', 'copy_paste', 'spam', 'promotional'];
         const hasExtremeFlags = sanitizedAnalysis.flags && 
           sanitizedAnalysis.flags.some(flag => 
             extremeFlags.some(extreme => flag.toLowerCase().includes(extreme.toLowerCase()))
           );
         
         if (!hasExtremeFlags) {
           console.log('🔄 Overriding classification to genuine for verified purchaser');
           sanitizedAnalysis.classification = 'genuine';
           sanitizedAnalysis.confidence = Math.max(0.8, sanitizedAnalysis.confidence);
           sanitizedAnalysis.riskLevel = 'low';
           sanitizedAnalysis.needsManualReview = false;
           
           // Update reasoning to reflect purchase verification
           sanitizedAnalysis.reasoning = `VERIFIED PURCHASER: User has completed purchase with order confirmation. ${sanitizedAnalysis.reasoning || ''} Purchase verification overrides other concerns.`;
         }
         
         console.log('✅ Verified purchaser overrides applied:', {
           classification: sanitizedAnalysis.classification,
           confidence: sanitizedAnalysis.confidence,
           purchaseVerificationScore: sanitizedAnalysis.scores?.purchaseVerificationScore || sanitizedAnalysis.purchaseVerificationScore,
           flagsRemaining: sanitizedAnalysis.flags?.length || 0
         });
       } else {
         console.log('❌ Not applying overrides - user not verified purchaser');
       }
       
       console.log('Gemini 2.0 Flash analysis successful:', {
         classification: sanitizedAnalysis.classification,
         confidence: sanitizedAnalysis.confidence,
         riskLevel: sanitizedAnalysis.riskLevel
       });
       
       return sanitizedAnalysis;
       
     } catch (parseError) {
       console.error('Failed to parse Gemini response as JSON:', parseError);
       console.log('Raw Gemini response:', text.substring(0, 500));
       
       // IMPORTANT: Still perform web search even in fallback
       console.log('🌐 Performing web search in fallback analysis...');
       let webSearchResult = null;
       try {
         webSearchResult = await this.performWebSearch(reviewData.comment);
       } catch (webError) {
         console.warn('⚠️ Web search failed in fallback, continuing without it:', webError.message);
       }
       
       // Enhanced fallback analysis
       const fallbackAnalysis = this.enhancedFallbackAnalysis(reviewData, text);
       
       // Add web search results to fallback
       if (webSearchResult) {
         fallbackAnalysis.webSearch = webSearchResult;
         
         if (webSearchResult.isCopied) {
           if (!fallbackAnalysis.flags) fallbackAnalysis.flags = [];
           fallbackAnalysis.flags.push('copied_content');
           fallbackAnalysis.reasoning += ` ${webSearchResult.analysis}`;
         }
       }
       
       return fallbackAnalysis;
     }
     
   } catch (error) {
     console.error('Gemini API error:', error);
     
     // Return comprehensive fallback analysis
     return {
       classification: 'pending',
       confidence: 0,
       flags: ['analysis_failed'],
       reasoning: `AI analysis failed due to: ${error.message}. Manual review required for accurate assessment.`,
       needsManualReview: true,
       analyzedAt: new Date().toISOString(),
       error: error.message,
       riskLevel: 'medium'
     };
   }
 }

 // Clean JSON response from potential markdown formatting
 cleanJsonResponse(text) {
   // Remove markdown code blocks if present
   let cleaned = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
   
   // Remove any leading/trailing whitespace
   cleaned = cleaned.trim();
   
   // Find JSON object boundaries
   const startIndex = cleaned.indexOf('{');
   const endIndex = cleaned.lastIndexOf('}');
   
   if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
     cleaned = cleaned.substring(startIndex, endIndex + 1);
   }
   
   return cleaned;
 }

 // Validate and sanitize analysis response
 sanitizeAnalysis(analysis) {
   // Handle both old and new detailed analysis formats
   const sanitized = {
     classification: ['genuine', 'suspicious', 'pending', 'legitimate'].includes(analysis.classification) 
       ? analysis.classification : 'pending',
     confidence: Math.max(0, Math.min(1, parseFloat(analysis.confidence) || 0)),
     flags: this.validateFlags(Array.isArray(analysis.flags) ? analysis.flags.slice(0, 15) : []), // Added flag validation
     reasoning: String(analysis.reasoning || 'Analysis completed').substring(0, 2000), // Increased length for detailed analysis
     needsManualReview: Boolean(analysis.needsManualReview),
     analyzedAt: new Date().toISOString(),
     modelVersion: 'gemini-2.0-flash'
   };

   // Handle web search results if present
   if (analysis.webSearch) {
     sanitized.webSearch = {
       found: Boolean(analysis.webSearch.found),
       isCopied: Boolean(analysis.webSearch.isCopied),
       confidence: Math.max(0, Math.min(1, parseFloat(analysis.webSearch.confidence) || 0)),
       analysis: String(analysis.webSearch.analysis || '').substring(0, 500),
       sources: Array.isArray(analysis.webSearch.sources) ? analysis.webSearch.sources.slice(0, 5) : [],
       bestMatch: analysis.webSearch.bestMatch || null,
       searchInfo: analysis.webSearch.searchInfo || {}
     };
   }

   // Handle detailed analysis structure if present
   if (analysis.detailedAnalysis) {
     sanitized.detailedAnalysis = {
       purchaseVerificationAnalysis: String(analysis.detailedAnalysis.purchaseVerificationAnalysis || '').substring(0, 1000),
       productRelevanceAnalysis: String(analysis.detailedAnalysis.productRelevanceAnalysis || '').substring(0, 1000),
       authenticityAssessment: String(analysis.detailedAnalysis.authenticityAssessment || '').substring(0, 1000),
       linguisticAnalysis: String(analysis.detailedAnalysis.linguisticAnalysis || '').substring(0, 1000),
       suspiciousPatterns: String(analysis.detailedAnalysis.suspiciousPatterns || '').substring(0, 1000),
       timelineAnalysis: String(analysis.detailedAnalysis.timelineAnalysis || '').substring(0, 1000),
       specificConcerns: String(analysis.detailedAnalysis.specificConcerns || '').substring(0, 1000)
     };
     
     // Add web search findings if present
     if (analysis.detailedAnalysis.webSearchFindings) {
       sanitized.detailedAnalysis.webSearchFindings = String(analysis.detailedAnalysis.webSearchFindings).substring(0, 1000);
     }
   }

   // Handle scores (both old and new format)
   if (analysis.scores) {
     sanitized.scores = {
       sentimentScore: Math.max(0, Math.min(1, parseFloat(analysis.scores.sentimentScore) || 0.5)),
       authenticityScore: Math.max(0, Math.min(1, parseFloat(analysis.scores.authenticityScore) || 0.5)),
       productRelevanceScore: Math.max(0, Math.min(1, parseFloat(analysis.scores.productRelevanceScore) || 0.5)),
       purchaseVerificationScore: Math.max(0, Math.min(1, parseFloat(analysis.scores.purchaseVerificationScore) || 0.5)),
       overallRiskScore: Math.max(0, Math.min(1, parseFloat(analysis.scores.overallRiskScore) || 0.5))
     };
   } else {
     // Fallback to old format
     sanitized.sentimentScore = Math.max(0, Math.min(1, parseFloat(analysis.sentimentScore) || 0.5));
     sanitized.authenticityScore = Math.max(0, Math.min(1, parseFloat(analysis.authenticityScore) || 0.5));
     sanitized.productRelevanceScore = Math.max(0, Math.min(1, parseFloat(analysis.productRelevanceScore) || 0.5));
     sanitized.purchaseVerificationScore = Math.max(0, Math.min(1, parseFloat(analysis.purchaseVerificationScore) || 0.5));
   }

   // Handle recommendations
   if (analysis.recommendations) {
     sanitized.recommendations = {
       action: ['approve', 'reject', 'manual_review'].includes(analysis.recommendations.action) 
         ? analysis.recommendations.action : 'manual_review',
       priority: ['low', 'medium', 'high'].includes(analysis.recommendations.priority) 
         ? analysis.recommendations.priority : 'medium',
       explanation: String(analysis.recommendations.explanation || '').substring(0, 500)
     };
   }

   // Handle key insights
   if (Array.isArray(analysis.keyInsights)) {
     sanitized.keyInsights = analysis.keyInsights.slice(0, 5).map(insight => String(insight).substring(0, 300));
   }

   // Risk level
   sanitized.riskLevel = ['low', 'medium', 'high'].includes(analysis.riskLevel) ? 
     analysis.riskLevel : 'medium';

   // Legacy fields for backwards compatibility
   sanitized.specificIssues = Array.isArray(analysis.specificIssues) ? 
     analysis.specificIssues.slice(0, 5).map(issue => String(issue).substring(0, 200)) : [];

   return sanitized;
 }

 // Handle safety-filtered content
 createSafetyFilteredAnalysis(reviewData) {
   return {
     classification: 'pending',
     confidence: 0.1,
     flags: ['safety_filter_triggered'],
     reasoning: 'Content triggered safety filters and requires manual review for policy compliance.',
     needsManualReview: true,
     analyzedAt: new Date().toISOString(),
     sentimentScore: 0.5,
     authenticityScore: 0.5,
     specificIssues: ['Content flagged by safety filters'],
     riskLevel: 'high',
     modelVersion: 'gemini-2.0-flash'
   };
 }

 // Enhanced fallback analysis when JSON parsing fails
 enhancedFallbackAnalysis(reviewData, geminiText) {
   const comment = reviewData.comment.toLowerCase();
   const rating = parseInt(reviewData.rating);
   let flags = [];
   let confidence = 0.5;
   let reasoning = 'Fallback analysis used due to parsing issues. ';
   
   // Extract insights from Gemini's text response even if not JSON
   if (geminiText.toLowerCase().includes('suspicious') || geminiText.toLowerCase().includes('fake')) {
     flags.push('ai_flagged_suspicious');
     confidence = Math.max(0.2, confidence - 0.3);
     reasoning += 'AI detected suspicious patterns. ';
   }
   
   if (geminiText.toLowerCase().includes('genuine') || geminiText.toLowerCase().includes('authentic')) {
     confidence = Math.min(0.8, confidence + 0.3);
     reasoning += 'AI detected authentic patterns. ';
   }
   
   // Enhanced pattern detection
   const words = comment.split(/\s+/);
   const uniqueWords = new Set(words);
   
   // Repetition analysis
   if (words.length > 5 && uniqueWords.size / words.length < 0.6) {
     flags.push('high_repetition');
     confidence -= 0.2;
     reasoning += 'High word repetition detected. ';
   }
   
   // Sentiment-rating mismatch (enhanced)
   const strongNegative = /terrible|awful|bad|hate|worst|horrible|disgusting|waste|useless/.test(comment);
   const strongPositive = /amazing|excellent|great|love|perfect|wonderful|fantastic|outstanding/.test(comment);
   const moderateNegative = /okay|average|meh|disappointing|mediocre/.test(comment);
   const moderatePositive = /good|nice|decent|satisfied|happy/.test(comment);
   
   // Check for sentiment-rating mismatches
   if ((rating >= 4 && strongNegative) || (rating <= 2 && strongPositive)) {
     flags.push('severe_sentiment_mismatch');
     confidence -= 0.4;
     reasoning += 'Severe sentiment-rating mismatch detected. ';
   } else if ((rating >= 4 && moderateNegative) || (rating <= 2 && moderatePositive)) {
     flags.push('moderate_sentiment_mismatch');
     confidence -= 0.2;
     reasoning += 'Moderate sentiment-rating mismatch detected. ';
   }
   
   // Generic language detection
   const genericPhrases = /highly recommend|amazing product|great value|must buy|five stars|excellent quality/;
   if (genericPhrases.test(comment) && comment.length < 100) {
     flags.push('generic_language');
     confidence -= 0.15;
     reasoning += 'Generic promotional language detected. ';
   }
   
   // Length analysis
   if (comment.length < 20 && rating >= 4) {
     flags.push('suspiciously_short');
     confidence -= 0.1;
     reasoning += 'Suspiciously short positive review. ';
   }
   
   const finalConfidence = Math.max(0, Math.min(1, confidence));
   
   return {
     classification: finalConfidence > 0.6 ? 'genuine' : finalConfidence > 0.3 ? 'suspicious' : 'pending',
     confidence: finalConfidence,
     flags,
     reasoning: reasoning + `Raw AI response: ${geminiText.substring(0, 200)}...`,
     needsManualReview: true,
     analyzedAt: new Date().toISOString(),
     sentimentScore: this.calculateSentimentScore(comment, rating),
     authenticityScore: finalConfidence,
     specificIssues: flags.map(flag => flag.replace(/_/g, ' ')),
     riskLevel: finalConfidence > 0.6 ? 'low' : finalConfidence > 0.3 ? 'medium' : 'high',
     modelVersion: 'gemini-2.0-flash-fallback'
   };
 }

 // Calculate sentiment score based on text and rating
 calculateSentimentScore(comment, rating) {
   const positiveWords = comment.match(/amazing|excellent|great|love|perfect|wonderful|fantastic|good|nice|happy|satisfied/g) || [];
   const negativeWords = comment.match(/terrible|awful|bad|hate|worst|horrible|disappointing|useless|waste/g) || [];
   
   const sentimentFromText = (positiveWords.length - negativeWords.length) / Math.max(1, positiveWords.length + negativeWords.length);
   const sentimentFromRating = (rating - 3) / 2; // Normalize rating to -1 to 1
   
   // Weighted average
   const combinedSentiment = (sentimentFromText * 0.6 + sentimentFromRating * 0.4);
   
   // Convert to 0-1 scale
   return Math.max(0, Math.min(1, (combinedSentiment + 1) / 2));
 }

 // Batch analysis with improved error handling and rate limiting
 async batchAnalyzeReviews(reviews, batchSize = 3) {
   const results = [];
   const delayBetweenBatches = 2000; // 2 seconds between batches for rate limiting
   
   console.log(`Starting batch analysis of ${reviews.length} reviews with batch size ${batchSize}`);
   
   for (let i = 0; i < reviews.length; i += batchSize) {
     const batch = reviews.slice(i, i + batchSize);
     const batchNumber = Math.floor(i / batchSize) + 1;
     const totalBatches = Math.ceil(reviews.length / batchSize);
     
     console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} reviews)`);
     
     const batchPromises = batch.map(async (review, index) => {
       try {
         // Add small delay between requests in the same batch
         if (index > 0) {
           await new Promise(resolve => setTimeout(resolve, 500));
         }
         
         const analysis = await this.analyzeReview({
           comment: review.comment,
           rating: review.rating,
           user: review.user || review.username || 'Anonymous'
         });
         
         return {
           reviewId: review._id || review.id,
           success: true,
           analysis
         };
       } catch (error) {
         console.error(`Error analyzing review ${review._id || review.id}:`, error);
         return {
           reviewId: review._id || review.id,
           success: false,
           error: error.message,
          analysis: {
            classification: 'pending',
            confidence: 0,
            flags: ['batch_analysis_error'],
            reasoning: `Batch analysis failed: ${error.message}`,
            needsManualReview: true,
            analyzedAt: new Date().toISOString(),
            riskLevel: 'medium',
            modelVersion: 'gemini-2.0-flash'
          }
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress logging
    const successCount = batchResults.filter(r => r.success).length;
    console.log(`Batch ${batchNumber} completed: ${successCount}/${batchResults.length} successful`);
    
    // Delay between batches to respect rate limits
    if (i + batchSize < reviews.length) {
      console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  const totalSuccess = results.filter(r => r.success).length;
  console.log(`Batch analysis completed: ${totalSuccess}/${results.length} reviews analyzed successfully`);
  
  return results;
}

 // NEW: Web search integration for copied content detection
 async performWebSearch(reviewText) {
   try {
     console.log('🌐 Initiating web search for review content...');
     
     const response = await fetch('/api/web-search', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         reviewText: reviewText.trim()
       })
     });

     if (!response.ok) {
       throw new Error(`Web search API error: ${response.status}`);
     }

     const result = await response.json();
     
     if (!result.success) {
       throw new Error(result.error || 'Web search failed');
     }

     console.log('✅ Web search completed:', {
       found: result.webSearch.found,
       isCopied: result.webSearch.isCopied,
       confidence: result.webSearch.confidence
     });

     return result.webSearch;
     
   } catch (error) {
     console.error('❌ Web search integration error:', error.message);
     
     // Return safe fallback
     return {
       found: false,
       isCopied: false,
       confidence: 0,
       analysis: `Web search unavailable: ${error.message}`,
       sources: [],
       searchInfo: {
         error: error.message,
         timestamp: new Date().toISOString()
       }
     };
   }
 }

 // NEW: AI Agent for automated admin approval/rejection
 async aiAgentApproval(reviewAnalysis, reviewData) {
   console.log('🤖 Starting AI Agent approval process for review:', {
     classification: reviewAnalysis.classification,
     confidence: reviewAnalysis.confidence,
     hasPurchased: reviewData.hasPurchased
   });

   try {
     // Ensure model is initialized
     if (!this.model) {
       await this.initializeModel();
     }

     const agentPrompt = `
You are an EXPERT AI AGENT acting as an automated admin for review approval system. Your job is to make FINAL approval decisions based on the analysis from the primary AI reviewer.

REVIEW ANALYSIS RESULTS:
- Classification: ${reviewAnalysis.classification}
- Confidence: ${reviewAnalysis.confidence}
- Risk Level: ${reviewAnalysis.riskLevel}
- Flags: ${JSON.stringify(reviewAnalysis.flags || [])}
- Purchase Verified: ${reviewData.hasPurchased === true ? 'YES' : 'NO'}
- Authenticity Score: ${reviewAnalysis.scores?.authenticityScore || reviewAnalysis.authenticityScore || 0.5}
- Overall Risk Score: ${reviewAnalysis.scores?.overallRiskScore || 0.5}

${reviewAnalysis.imageAnalysis ? `
IMAGE ANALYSIS RESULTS:
- Has Images: ${reviewAnalysis.imageAnalysis.hasImages}
- Product Match Score: ${reviewAnalysis.imageAnalysis.productMatch || 'N/A'}
- Image Authenticity: ${reviewAnalysis.imageAnalysis.authenticity || 'N/A'} 
- Image Quality: ${reviewAnalysis.imageAnalysis.imageQuality || 'N/A'}
- Sentiment Match: ${reviewAnalysis.imageAnalysis.sentimentMatch || 'N/A'}
- Image Flags: ${JSON.stringify(reviewAnalysis.imageAnalysis.flags || [])}
- Image Analysis: "${reviewAnalysis.imageAnalysis.analysis || 'No image analysis available'}"
` : 'NO IMAGE ANALYSIS AVAILABLE'}

PRODUCT CONTEXT:
- Product Name: "${reviewData.productName || 'Unknown Product'}"
- Product Description: "${reviewData.productDescription || 'No description available'}"
- Product Category: "${reviewData.productCategory || 'Unknown Category'}"

REVIEW CONTENT:
- Rating: ${reviewData.rating}/5 stars
- Comment: "${reviewData.comment}"
- User: ${reviewData.user || 'Anonymous'}

🚨 ENHANCED AI AGENT DECISION LOGIC WITH STRICT CONTENT VALIDATION:

⚠️ CRITICAL OVERRIDE RULES (EVEN FOR VERIFIED BUYERS):

1. IMAGE-PRODUCT MISMATCH (HIGHEST PRIORITY):
   - If productMatch < 0.5 → IMMEDIATE RED FLAG even for verified buyers
   - Dog image for phone product = SUSPICIOUS (regardless of purchase verification)
   - Completely wrong product images = SUSPICIOUS 
   - Food images for electronics = SUSPICIOUS
   
2. CONTENT-PRODUCT MISMATCH (HIGH PRIORITY):
   - Review talks about different product than description = SUSPICIOUS
   - Electronics review content for clothing product = SUSPICIOUS  
   - Content completely irrelevant to product category = SUSPICIOUS
   
3. IMAGE FLAGS THAT OVERRIDE PURCHASE VERIFICATION:
   - "image_mismatch" = Force RED indicator (even verified buyers)
   - "stock_photo" for user reviews = Force YELLOW indicator minimum
   - "sentiment_image_mismatch" = Force YELLOW indicator minimum

📋 DECISION MATRIX:

FOR VERIFIED BUYERS WITH CONTENT/IMAGE ISSUES:
❌ NO MORE FREE PASS FOR IRRELEVANT CONTENT:
- Purchase verified BUT image shows wrong product → RED indicator (suspicious)
- Purchase verified BUT review content doesn't match product → RED indicator (suspicious)  
- Purchase verified BUT extreme image-sentiment mismatch → YELLOW indicator minimum
- Message: "Verified buyer but content/image concerns detected"

FOR VERIFIED BUYERS WITH GOOD CONTENT/IMAGES:
✅ STANDARD BENEFITS:
- Clean content + matching images → GREEN indicator
- Good content + minor image concerns → YELLOW indicator
- Minor content issues + good images → YELLOW indicator

FOR UNVERIFIED BUYERS:
🔍 ENHANCED VALIDATION WITH PROPER COLOR CODING:
- Any content/image issues → RED indicator (highly suspicious)
- Perfect genuine content + good images → GREEN indicator (verified authentic)
- Minor concerns but overall genuine → YELLOW indicator (caution)

BUSINESS LOGIC ENHANCEMENT:
1. Purchase verification is important BUT content relevance is equally critical
2. Wrong product images/content = fraud attempt (even from real buyers)
3. Protect other customers from misleading reviews  
4. Trust but verify - even verified buyers need content validation
5. Content quality standards apply to everyone

AI AGENT DECISION LOGIC:

FOR GENUINE REVIEWS (SIMPLIFIED):
✅ FINAL DECISION BASED ON CLASSIFICATION:
- If classification = 'genuine' AND confidence > 0.7 → APPROVE + GREEN indicator
- If classification = 'genuine' AND confidence 0.5-0.7 → APPROVE + YELLOW indicator  
- If classification = 'genuine' AND confidence < 0.5 → APPROVE + YELLOW indicator

FOR SUSPICIOUS REVIEWS:
❌ MAINTAIN STRICT APPROACH:
- If classification = 'suspicious' → APPROVE + RED indicator (show with warning)
- Extreme spam/bot behavior → REJECT (don't show)

SPECIAL OVERRIDE CASES (REGARDLESS OF CLASSIFICATION):
🚨 FORCE RED for severe mismatches:
- Dog image for electronics product → FORCE RED indicator
- Car image for beauty products → FORCE RED indicator  
- Image productMatch < 0.3 → FORCE RED indicator

SIMPLIFIED LOGIC: Trust the primary classification, use images only for extreme mismatches.

Respond with this EXACT JSON structure:

{
  "agentDecision": "approve" | "reject",
  "displayIndicator": "green" | "yellow" | "red",
  "agentReasoning": "WRITE 3-4 SENTENCES explaining the decision, specifically mentioning content-product match, image relevance, and purchase verification impact",
  "userDisplayStatus": "Verified Genuine" | "Under Review" | "Flagged Suspicious" | "Needs Attention",
  "agentConfidence": 0.85,
  "adminNotes": "WRITE 2-3 SENTENCES noting any content/image issues and verification status",
  "contentRelevanceScore": 0.75,
  "imageProductMatch": 0.80,
  "overrideReasons": ["image_mismatch", "content_mismatch", "verified_buyer_protection"]
}

🎯 CRITICAL SUCCESS FACTORS:
- Content relevance is NON-NEGOTIABLE (even for verified buyers)
- Wrong product images = automatic suspicion flag
- Review content must match product description/category
- Purchase verification + content validation = dual verification system
- Protect all customers from misleading reviews regardless of buyer status
- Transparency with appropriate warnings for problematic content

Make intelligent decisions prioritizing CONTENT ACCURACY and PRODUCT RELEVANCE above purchase verification status.`;

     const result = await this.model.generateContent(agentPrompt);
     const response = await result.response;
     const text = response.text();
     
     try {
       const cleanedText = this.cleanJsonResponse(text);
       const agentDecision = JSON.parse(cleanedText);
       
       // Validate agent decision
       const validatedDecision = {
         agentDecision: ['approve', 'reject'].includes(agentDecision.agentDecision) ? 
           agentDecision.agentDecision : 'approve',
         displayIndicator: ['green', 'yellow', 'red'].includes(agentDecision.displayIndicator) ? 
           agentDecision.displayIndicator : 'yellow',
         agentReasoning: String(agentDecision.agentReasoning || '').substring(0, 500),
         userDisplayStatus: ['Verified Genuine', 'Under Review', 'Flagged Suspicious', 'Needs Attention'].includes(agentDecision.userDisplayStatus) ? 
           agentDecision.userDisplayStatus : 'Under Review',
         agentConfidence: Math.max(0, Math.min(1, parseFloat(agentDecision.agentConfidence) || 0.5)),
         adminNotes: String(agentDecision.adminNotes || '').substring(0, 300),
         // NEW: Enhanced validation fields
         contentRelevanceScore: Math.max(0, Math.min(1, parseFloat(agentDecision.contentRelevanceScore) || 0.5)),
         imageProductMatch: Math.max(0, Math.min(1, parseFloat(agentDecision.imageProductMatch) || 0.5)),
         overrideReasons: Array.isArray(agentDecision.overrideReasons) ? agentDecision.overrideReasons.slice(0, 5) : [],
         processedAt: new Date().toISOString(),
         agentModelVersion: 'gemini-2.0-flash-agent-enhanced'
       };

       console.log('🤖 AI Agent decision completed:', {
         decision: validatedDecision.agentDecision,
         indicator: validatedDecision.displayIndicator,
         status: validatedDecision.userDisplayStatus
       });

       return validatedDecision;

     } catch (parseError) {
       console.error('Failed to parse AI Agent response:', parseError);
       
       // Fallback decision based on classification and flags
       const hasImageMismatch = reviewAnalysis.imageAnalysis?.flags?.includes('image_mismatch') || 
                                reviewAnalysis.flags?.includes('image_mismatch') ||
                                (reviewAnalysis.imageAnalysis?.productMatch && reviewAnalysis.imageAnalysis.productMatch < 0.5);
                                
       const hasContentMismatch = reviewAnalysis.flags?.includes('product_mismatch') || 
                                  reviewAnalysis.flags?.includes('product_irrelevant_content');
       
       let fallbackIndicator = 'yellow';
       let fallbackStatus = 'Under Review';
       
       if (hasImageMismatch || hasContentMismatch) {
         fallbackIndicator = 'red';
         fallbackStatus = hasImageMismatch ? 'Flagged Suspicious' : 'Flagged Suspicious';
       } else if (reviewAnalysis.classification === 'genuine') {
         fallbackIndicator = 'green';
         fallbackStatus = 'Verified Genuine';
       } else if (reviewAnalysis.classification === 'suspicious') {
         fallbackIndicator = 'red';
         fallbackStatus = 'Flagged Suspicious';
       }
       
       return {
         agentDecision: 'approve', // Default to showing reviews
         displayIndicator: fallbackIndicator,
         agentReasoning: `Fallback decision: ${reviewAnalysis.classification} review with ${reviewAnalysis.confidence} confidence. ${hasImageMismatch ? 'Image-product mismatch detected.' : ''} ${hasContentMismatch ? 'Content-product mismatch detected.' : ''}`,
         userDisplayStatus: fallbackStatus,
         agentConfidence: 0.5,
         adminNotes: 'Agent parsing failed, used enhanced fallback logic with content validation.',
         contentRelevanceScore: hasContentMismatch ? 0.3 : 0.7,
         imageProductMatch: hasImageMismatch ? 0.3 : 0.7,
         overrideReasons: [...(hasImageMismatch ? ['image_mismatch'] : []), ...(hasContentMismatch ? ['content_mismatch'] : [])],
         processedAt: new Date().toISOString(),
         agentModelVersion: 'gemini-2.0-flash-agent-enhanced-fallback'
       };
     }

   } catch (error) {
     console.error('AI Agent error:', error);
     
     // Safe fallback - approve and show with caution
     return {
       agentDecision: 'approve',
       displayIndicator: 'yellow',
       agentReasoning: `Agent failed due to ${error.message}. Defaulting to cautious approval.`,
       userDisplayStatus: 'Under Review',
       agentConfidence: 0.3,
       adminNotes: 'Agent processing failed, requires manual review.',
       processedAt: new Date().toISOString(),
       agentModelVersion: 'gemini-2.0-flash-agent-error'
     };
   }
 }

 // NEW: Complete review processing with both analysis and agent approval
 async processReviewComplete(reviewData) {
   console.log('🔄 Starting complete review processing (Analysis + Agent):', {
     comment: reviewData.comment?.substring(0, 50) + '...',
     hasPurchased: reviewData.hasPurchased,
     hasImages: !!(reviewData.images && reviewData.images.length > 0),
     imageCount: reviewData.images?.length || 0
   });

   try {
     // Step 1: Primary AI Analysis - Check if images are present
     let analysisResult;
     
     if (reviewData.images && reviewData.images.length > 0) {
       console.log('🖼️ Images detected - using image analysis');
       console.log('- Image count:', reviewData.images.length);
       console.log('- First image URL preview:', reviewData.images[0]?.url?.substring(0, 50) + '...');
       
       // Use the first image for analysis (can be extended for multiple images)
       const primaryImageUrl = reviewData.images[0]?.url;
       if (primaryImageUrl) {
         console.log('📷 Analyzing review with primary image...');
         analysisResult = await this.analyzeReviewWithImage(reviewData, primaryImageUrl);
       } else {
         console.log('⚠️ Image URL missing, falling back to text-only analysis');
         analysisResult = await this.analyzeReview(reviewData);
       }
     } else {
       console.log('📝 No images provided - using text-only analysis');
       analysisResult = await this.analyzeReview(reviewData);
     }
     
     // Step 2: AI Agent Approval Decision (enhanced with A2A validation)
     const agentResult = await this.aiAgentApproval(analysisResult, reviewData);
     
     // Step 2.5: A2A (Agent-to-Agent) validation for critical cases
     let finalAgentResult = agentResult;
     if (this.requiresA2AValidation(analysisResult, agentResult, reviewData)) {
       console.log('🤖🤖 A2A validation required - calling secondary agent...');
       try {
         const secondaryAgentResult = await this.secondaryAgentValidation(analysisResult, agentResult, reviewData);
         finalAgentResult = secondaryAgentResult;
         console.log('✅ A2A validation completed:', {
           originalDecision: agentResult.displayIndicator,
           finalDecision: finalAgentResult.displayIndicator,
           wasOverridden: agentResult.displayIndicator !== finalAgentResult.displayIndicator
         });
       } catch (a2aError) {
         console.warn('⚠️ A2A validation failed, using original agent decision:', a2aError.message);
         finalAgentResult.adminNotes += ' [A2A validation failed]';
       }
     }
     
     // Step 3: Combine results
     const completeResult = {
       ...analysisResult,
       agentApproval: finalAgentResult,
       finalStatus: {
         shouldDisplay: finalAgentResult.agentDecision === 'approve',
         displayIndicator: finalAgentResult.displayIndicator,
         userDisplayStatus: finalAgentResult.userDisplayStatus,
         isAutomatedDecision: true,
         processedAt: new Date().toISOString()
       }
     };

     console.log('✅ Complete review processing finished:', {
       classification: analysisResult.classification,
       agentDecision: finalAgentResult.agentDecision,
       displayIndicator: finalAgentResult.displayIndicator,
       shouldDisplay: finalAgentResult.agentDecision === 'approve',
       hasImageAnalysis: !!analysisResult.imageAnalysis,
       imageAnalysisFlags: analysisResult.imageAnalysis?.flags || [],
       a2aPerformed: !!finalAgentResult.a2aValidation?.performed,
       a2aDecision: finalAgentResult.a2aValidation?.decision || 'none'
     });

     return completeResult;

   } catch (error) {
     console.error('Complete review processing failed:', error);
     throw error;
   }
 }

 // NEW: Product-specific analytics for display on product page
 getProductAnalytics(reviews, productId) {
   // Validate input
   if (!reviews || !Array.isArray(reviews)) {
     console.warn('⚠️ Reviews is not an array, defaulting to empty array');
     reviews = [];
   }

   console.log(`📊 Generating product analytics for ${reviews.length} reviews`);
   
   const analytics = {
     productId: productId,
     totalReviews: reviews.length,
     displayedReviews: 0,
     hiddenReviews: 0,
     
     // Classification breakdown
     genuine: 0,
     suspicious: 0,
     pending: 0,
     
     // Display indicator breakdown  
     greenIndicator: 0,   // Verified genuine
     yellowIndicator: 0,  // Caution
     redIndicator: 0,     // Suspicious but shown
     
     // Purchase verification breakdown
     verifiedPurchasers: 0,
     unverifiedUsers: 0,
     
     // Rating distribution
     ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
     
     // Confidence metrics
     avgConfidence: 0,
     avgAuthenticityScore: 0,
     
     // Trust metrics
     trustScore: 0,
     reliabilityPercentage: 0,
     
     lastUpdated: new Date().toISOString()
   };

   let totalConfidence = 0;
   let totalAuthenticity = 0;
   let analyzedCount = 0;

   reviews.forEach(review => {
     // Count ratings
     if (review.rating >= 1 && review.rating <= 5) {
       analytics.ratingDistribution[review.rating]++;
     }

     // Count purchase verification
     if (review.hasPurchased === true) {
       analytics.verifiedPurchasers++;
     } else {
       analytics.unverifiedUsers++;
     }

     if (review.aiAnalysis) {
       analyzedCount++;
       
       // Classification counts
       if (review.aiAnalysis.classification === 'genuine') analytics.genuine++;
       else if (review.aiAnalysis.classification === 'suspicious') analytics.suspicious++;
       else analytics.pending++;
       
       // Display status counts
       if (review.aiAnalysis.agentApproval) {
         if (review.aiAnalysis.agentApproval.agentDecision === 'approve') {
           analytics.displayedReviews++;
           
           // Count display indicators
           const indicator = review.aiAnalysis.agentApproval.displayIndicator;
           if (indicator === 'green') analytics.greenIndicator++;
           else if (indicator === 'yellow') analytics.yellowIndicator++;
           else if (indicator === 'red') analytics.redIndicator++;
         } else {
           analytics.hiddenReviews++;
         }
       } else {
         analytics.displayedReviews++; // Default to displayed if no agent decision
       }
       
       // Confidence metrics
       totalConfidence += review.aiAnalysis.confidence || 0;
       totalAuthenticity += review.aiAnalysis.scores?.authenticityScore || 
                           review.aiAnalysis.authenticityScore || 0.5;
     }
   });

   // Calculate averages
   if (analyzedCount > 0) {
     analytics.avgConfidence = (totalConfidence / analyzedCount).toFixed(3);
     analytics.avgAuthenticityScore = (totalAuthenticity / analyzedCount).toFixed(3);
   }

   // Calculate average rating from all reviews
   let totalRating = 0;
   let ratingCount = 0;
   reviews.forEach(review => {
     if (review.rating >= 1 && review.rating <= 5) {
       totalRating += review.rating;
       ratingCount++;
     }
   });
   analytics.averageRating = ratingCount > 0 ? (totalRating / ratingCount) : 0;

   // Calculate trust metrics
   const verifiedGenuineCount = analytics.genuine + analytics.greenIndicator;
   analytics.trustScore = analytics.totalReviews > 0 ? 
     ((verifiedGenuineCount / analytics.totalReviews) * 100).toFixed(1) : '0';
   
   analytics.reliabilityPercentage = analytics.totalReviews > 0 ? 
     (((analytics.verifiedPurchasers + analytics.greenIndicator) / analytics.totalReviews) * 100).toFixed(1) : '0';

   // Add chart data for frontend
   analytics.chartData = {
     trustDistribution: [
       { name: 'Verified Genuine', value: analytics.greenIndicator, color: '#10B981' },
       { name: 'Caution Required', value: analytics.yellowIndicator, color: '#F59E0B' },
       { name: 'Suspicious', value: analytics.redIndicator, color: '#EF4444' }
     ],
     purchaseVerification: [
       { name: 'Verified Buyers', value: analytics.verifiedPurchasers, color: '#10B981' },
       { name: 'Unverified Users', value: analytics.unverifiedUsers, color: '#6B7280' }
     ],
     ratingBreakdown: Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
       rating: `${rating} Star`,
       count: count,
       percentage: analytics.totalReviews > 0 ? ((count / analytics.totalReviews) * 100).toFixed(1) : 0
     }))
   };

   console.log('📊 Product analytics generated:', {
     totalReviews: analytics.totalReviews,
     displayed: analytics.displayedReviews,
     hidden: analytics.hiddenReviews,
     trustScore: analytics.trustScore
   });

   return analytics;
 }

 // Enhanced analytics for admin dashboard
getAnalytics(reviews) {
  const totalReviews = reviews.length;
  let suspiciousCount = 0;
  let genuineCount = 0;
  let pendingCount = 0;
  let flaggedForManualReview = 0;
  let highRiskCount = 0;
  let avgConfidence = 0;
  let avgSentiment = 0;
  let avgAuthenticity = 0;
  
  const flagStats = {};
  const riskDistribution = { low: 0, medium: 0, high: 0 };
  const modelVersions = {};
  
  let analyzedCount = 0;
  
  reviews.forEach(review => {
    if (review.aiAnalysis) {
      analyzedCount++;
      
      // Classification counts
      switch (review.aiAnalysis.classification) {
        case 'suspicious':
          suspiciousCount++;
          break;
        case 'genuine':
          genuineCount++;
          break;
        case 'pending':
          pendingCount++;
          break;
      }
      
      // Manual review flags
      if (review.aiAnalysis.needsManualReview) flaggedForManualReview++;
      
      // Risk level distribution
      const riskLevel = review.aiAnalysis.riskLevel || 'medium';
      riskDistribution[riskLevel]++;
      if (riskLevel === 'high') highRiskCount++;
      
      // Average scores
      avgConfidence += review.aiAnalysis.confidence || 0;
      avgSentiment += review.aiAnalysis.sentimentScore || 0.5;
      avgAuthenticity += review.aiAnalysis.authenticityScore || 0.5;
      
      // Flag statistics
      if (review.aiAnalysis.flags) {
        review.aiAnalysis.flags.forEach(flag => {
          flagStats[flag] = (flagStats[flag] || 0) + 1;
        });
      }
      
      // Model version tracking
      const modelVersion = review.aiAnalysis.modelVersion || 'unknown';
      modelVersions[modelVersion] = (modelVersions[modelVersion] || 0) + 1;
    }
  });
  
  return {
    totalReviews,
    analyzedReviews: analyzedCount,
    analysisCoverage: totalReviews > 0 ? ((analyzedCount / totalReviews) * 100).toFixed(1) : '0',
    
    // Classification metrics
    genuineCount,
    suspiciousCount,
    pendingCount,
    flaggedForManualReview,
    highRiskCount,
    
    // Percentage metrics
    suspiciousPercentage: totalReviews > 0 ? ((suspiciousCount / totalReviews) * 100).toFixed(1) : '0',
    trustScore: totalReviews > 0 ? ((genuineCount / totalReviews) * 100).toFixed(1) : '0',
    riskPercentage: totalReviews > 0 ? ((highRiskCount / totalReviews) * 100).toFixed(1) : '0',
    
    // Average scores
    avgConfidence: analyzedCount > 0 ? (avgConfidence / analyzedCount).toFixed(3) : '0',
    avgSentiment: analyzedCount > 0 ? (avgSentiment / analyzedCount).toFixed(3) : '0.5',
    avgAuthenticity: analyzedCount > 0 ? (avgAuthenticity / analyzedCount).toFixed(3) : '0.5',
    
    // Detailed breakdowns
    flagStats,
    riskDistribution,
    modelVersions,
    
    // System info
    aiPowered: true,
    modelUsed: 'gemini-2.0-flash',
    lastUpdated: new Date().toISOString()
  };
}

 // Health check method for monitoring
 async healthCheck() {
   try {
     // Simple connectivity check without creating test reviews
     const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
     
     // Test with a minimal prompt
     const result = await model.generateContent("Health check: respond with 'OK'");
     const response = await result.response;
     
     return {
       status: 'healthy',
       model: 'gemini-2.0-flash',
       responseTime: Date.now(),
       apiResponse: response.text() ? 'OK' : 'No response'
     };
   } catch (error) {
     return {
       status: 'unhealthy',
       model: 'gemini-2.0-flash',
       error: error.message,
       timestamp: new Date().toISOString()
     };
   }
 }

 // NEW: Analyze review with image capability
 async analyzeReviewWithImage(reviewData, imageData = null) {
   console.log('🖼️ Starting enhanced review analysis with image support:', {
     hasPurchased: reviewData.hasPurchased,
     hasImage: !!imageData,
     imageType: imageData ? (typeof imageData === 'string' ? 
       (imageData.startsWith('data:') ? 'base64' : 'url') : 'object') : 'none',
     comment: reviewData.comment?.substring(0, 100) + '...',
     rating: reviewData.rating,
     productName: reviewData.productName
   });

   try {
     // If no image provided, use existing analysis method
     if (!imageData) {
       console.log('📝 No image provided, using text-only analysis');
       return await this.analyzeReview(reviewData);
     }

     // Additional image data validation
     if (typeof imageData !== 'string') {
       console.error('❌ Invalid image data type:', typeof imageData, 'Expected string, received:', imageData);
       throw new Error(`Invalid image data: expected string, received ${typeof imageData}`);
     }

     // Ensure model is initialized
     if (!this.model) {
       console.log('Model not initialized. Initializing now...');
       await this.initializeModel();
     }

     // Validate input data
     if (!reviewData || !reviewData.comment || reviewData.rating === undefined) {
       throw new Error('Invalid review data: missing comment or rating');
     }

     // Prepare image for Gemini Vision with enhanced security and validation
     let imagePart;
     try {
       // Validate and determine image type
       console.log('🔍 Validating image data:', imageData.substring(0, 50) + '...');
       const imageValidation = this.validateImageData(imageData);
       
       if (imageValidation.type === 'cloudinary') {
         // Rate limiting for image fetches
         const now = Date.now();
         const clientKey = 'global'; // In production, use user ID or IP
         const attempts = this.imageFetchAttempts.get(clientKey) || [];
         
         // Remove attempts older than 1 minute
         const recentAttempts = attempts.filter(time => now - time < 60000);
         
         if (recentAttempts.length >= this.maxImageFetchesPerMinute) {
           throw new Error('Image fetch rate limit exceeded. Please try again later.');
         }
         
         // Record this attempt
         recentAttempts.push(now);
         this.imageFetchAttempts.set(clientKey, recentAttempts);
         
         // Process Cloudinary URL
         const sanitizedUrl = imageValidation.url.split('?')[0]; // Remove query params for logging
         console.log('📷 Fetching image from Cloudinary URL:', sanitizedUrl + '...');
         
         let imageResponse;
         try {
           // Add fetch timeout and better error handling
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
           
           imageResponse = await fetch(imageValidation.url, { 
             signal: controller.signal,
             headers: { 
               'Accept': 'image/*',
               'User-Agent': 'ReviewAnalysisService/1.0'
             }
           });
           
           clearTimeout(timeoutId);
           
           if (!imageResponse.ok) {
             throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
           }
         } catch (fetchError) {
           if (fetchError.name === 'AbortError') {
             throw new Error('Image fetch timeout (10s)');
           }
           throw new Error(`Network error: ${fetchError.message}`);
         }
         
         // Validate image size before processing
         const contentLength = imageResponse.headers.get('content-length');
         if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
           throw new Error('Image too large (max 5MB)');
         }
         
         const arrayBuffer = await imageResponse.arrayBuffer();
         
         // Additional size check after download
         if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
           throw new Error('Image too large (max 5MB)');
         }
         
         // Safe browser-compatible base64 conversion
         const base64String = this.arrayBufferToBase64(arrayBuffer);
         const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
         
         imagePart = {
           inlineData: {
             data: base64String,
             mimeType: contentType
           }
         };
       } else if (imageValidation.type === 'base64') {
         // Process base64 data URL
         imagePart = {
           inlineData: {
             data: imageValidation.data,
             mimeType: imageValidation.mimeType
           }
         };
       }
     } catch (imageError) {
       console.error('❌ Image processing error:', imageError.message);
       // Fall back to text-only analysis if image fails
       const textAnalysis = await this.analyzeReview(reviewData);
       textAnalysis.imageAnalysis = {
         hasImages: false,
         imageCount: 0,
         analysis: `Image processing failed: ${imageError.message}`,
         flags: ['image_processing_error']
       };
       return textAnalysis;
     }

     // Enhanced prompt with more detailed analysis instructions
     const promptWithImage = `
You are an EXPERT AI review fraud detection system with ADVANCED IMAGE ANALYSIS capabilities and real-world business intelligence.

REVIEW DATA:
- Rating: ${reviewData.rating}/5 stars
- Comment: "${reviewData.comment.trim()}"
- User: ${reviewData.user || 'Anonymous'}
- Review Date: ${reviewData.reviewDate || new Date().toISOString()}

PRODUCT CONTEXT:
- Product Name: "${reviewData.productName || 'Unknown Product'}"
- Product Description: "${reviewData.productDescription || 'No description available'}"
- Product Category: "${reviewData.productCategory || 'Unknown Category'}"
- Product Price: "${reviewData.productPrice || 'Unknown Price'}"

PURCHASE VERIFICATION STATUS:
- User Has Purchased Product: ${reviewData.hasPurchased === true ? 'YES - VERIFIED PURCHASER WITH COMPLETED ORDER ✅' : reviewData.hasPurchased === false ? 'NO - UNVERIFIED USER ❌' : 'UNKNOWN STATUS ⚠️'}
- Purchase Date: ${reviewData.purchaseDate || 'No purchase record found'}
- Review Date: ${reviewData.reviewDate || new Date().toISOString()}
- Days Between Purchase and Review: ${this.calculateDaysBetween(reviewData.purchaseDate, reviewData.reviewDate)} days

🖼️ IMAGE ANALYSIS INSTRUCTIONS:
ANALYZE THE PROVIDED IMAGE CAREFULLY AND ASSESS:

1. PRODUCT MATCH:
   - Does the image show the exact product being reviewed?
   - Are product features, design, colors, size consistent with product description?
   - SEVERE MISMATCHES: Dog photo for phone, car for brush, food for electronics = productMatch score 0.0-0.3
   - MINOR MISMATCHES: Wrong color/size of same product = productMatch score 0.4-0.6  
   - GOOD MATCHES: Correct product with clear features = productMatch score 0.7-1.0
   - Rate product match: 0.0 (completely different) to 1.0 (perfect match)

2. IMAGE AUTHENTICITY:
   - Is this a genuine user-taken photo vs stock/promotional photo?
   - Check for: natural lighting, user environment, real-world context
   - Look for: stock photo watermarks, perfect studio lighting, promotional styling
   - Rate authenticity: 0.0 (fake/stock) to 1.0 (genuine user photo)

3. IMAGE QUALITY ASSESSMENT:
   - Photo quality, resolution, clarity
   - Signs of manipulation or editing
   - Rate quality: 0.0 (very poor/manipulated) to 1.0 (high quality/natural)

4. SENTIMENT-IMAGE CONSISTENCY:
   - Does the image support the review sentiment and rating?
   - Positive review + damaged product image = inconsistent
   - Negative review + perfect product image = inconsistent
   - Rate consistency: 0.0 (completely inconsistent) to 1.0 (perfectly consistent)

5. FRAUD INDICATORS:
   - Generic stock photos
   - Images that don't match the reviewed product
   - Professional/promotional style images from regular users
   - Low quality or suspicious images

IMAGE FLAGS TO DETECT:
- "image_mismatch": Image shows different product
- "stock_photo": Professional/promotional stock image detected
- "low_quality_image": Poor quality, blurry, or manipulated
- "sentiment_image_mismatch": Image contradicts review sentiment
- "promotional_style": Professional photography style suspicious for user review
- "watermark_detected": Stock photo watermarks or branding
- "image_generic": Generic or template-style image

🧠 INTEGRATED ANALYSIS RULES (TEXT + IMAGE):

VERIFIED PURCHASERS WITH GOOD IMAGES:
✅ MAXIMUM BENEFITS:
- Classification: "genuine" (very high confidence)
- All scores boosted additionally for image evidence
- Image analysis supports purchase verification

VERIFIED PURCHASERS WITH SUSPICIOUS IMAGES:
⚠️ STRICT IMAGE VALIDATION:
- SEVERE image-product mismatch = ALWAYS suspicious (dog image for phone product)
- Purchase verification does NOT override major image mismatches  
- Classification: "suspicious" for major product mismatches
- Manual review required for any significant image-product disconnect

UNVERIFIED USERS WITH GOOD IMAGES:
🔍 CAREFUL ANALYSIS:
- Good image doesn't override lack of purchase
- Still suspicious due to no purchase record
- Image might be stolen or generic

UNVERIFIED USERS WITH BAD IMAGES:
❌ MAXIMUM PENALTIES:
- Highly suspicious
- Multiple red flags compound
- Very low confidence scores

${reviewData.editHistory && reviewData.editHistory.length > 0 ? `
EDIT HISTORY (CONTEXT FOR ANALYSIS):
- Number of Edits: ${reviewData.editHistory.length}
- Edit Details: ${reviewData.editHistory.map((edit, index) => `Edit ${index + 1}: ${edit.editedAt}, Previous Rating: ${edit.previousRating}`).join('; ')}
` : 'EDIT HISTORY: No edits (Normal)'}

🎯 DETAILED ANALYSIS REQUIREMENTS:

For "purchaseVerificationAnalysis": Write 3-4 comprehensive sentences explaining how the purchase verification status impacts the overall authenticity assessment. Include specific reasoning about why verified purchases carry more weight and how this affects the final classification. Mention the timeline between purchase and review if relevant.

For "productRelevanceAnalysis": Write 3-4 detailed sentences analyzing how well the review content and image (if present) match the specific product being reviewed. Discuss specific product features mentioned, accuracy of descriptions, and whether the reviewer demonstrates actual product knowledge or generic commentary.

For "authenticityAssessment": Write 4-5 comprehensive sentences providing an overall assessment of review authenticity. Include analysis of language patterns, emotional consistency, reviewer behavior patterns, and how all factors combine to indicate genuine vs suspicious activity. Be specific about what makes this review authentic or concerning.

For "linguisticAnalysis": Write 3-4 detailed sentences analyzing the writing style, language patterns, and emotional authenticity of the review. Discuss grammar patterns, vocabulary usage, emotional tone consistency, and whether the language feels natural or artificial/promotional.

For "suspiciousPatterns": Write 3-4 sentences identifying and explaining any suspicious patterns or red flags detected. Be specific about what patterns were found and why they are concerning. If no suspicious patterns exist, explain what positive indicators support authenticity.

For "timelineAnalysis": Write 2-3 sentences analyzing timing patterns between purchase and review submission, edit patterns if any, and how timing relates to typical customer behavior. Explain whether timing supports or undermines authenticity.

For "specificConcerns": Write 3-4 sentences highlighting specific concerns or positive indicators that influenced the final classification. Be detailed about the most important factors that drove the decision and explain the reasoning behind the confidence level assigned.

For "imageAnalysis.analysis": Write 4-6 comprehensive sentences providing detailed analysis of the image including product match assessment, authenticity evaluation, quality assessment, and how the image supports or contradicts the review content. Be specific about visual elements observed, lighting conditions, composition style, and overall consistency with user-generated content vs professional photography.

🚨 CLASSIFICATION DECISION RULES:
1. If productMatch < 0.5 (severe image-product mismatch) → classification = "suspicious" REGARDLESS of purchase verification
2. If verified buyer + productMatch ≥ 0.7 + good content → classification = "genuine"  
3. If verified buyer + productMatch 0.5-0.7 + decent content → classification = "genuine" but flag concerns
4. If unverified user OR major content issues → classification = "suspicious"
5. Any dog image for electronics, car for beauty products, etc. → ALWAYS "suspicious"

Respond with this EXACT JSON structure (include imageAnalysis field):

{
 "classification": "genuine" | "suspicious" | "pending",
 "confidence": 0.85,
 "detailedAnalysis": {
   "purchaseVerificationAnalysis": "WRITE 3-4 COMPREHENSIVE SENTENCES HERE with detailed analysis of purchase verification and its impact on authenticity assessment including timeline considerations and verification weight",
   "productRelevanceAnalysis": "WRITE 3-4 DETAILED SENTENCES HERE analyzing how well the review content matches the specific product including feature accuracy and product knowledge demonstration",
   "authenticityAssessment": "WRITE 4-5 COMPREHENSIVE SENTENCES HERE providing overall assessment of review authenticity including language patterns emotional consistency and behavioral analysis",
   "linguisticAnalysis": "WRITE 3-4 DETAILED SENTENCES HERE analyzing writing style language patterns vocabulary usage and emotional tone consistency",
   "suspiciousPatterns": "WRITE 3-4 SENTENCES HERE identifying and explaining any suspicious patterns or red flags with specific reasoning or positive authenticity indicators",
   "timelineAnalysis": "WRITE 2-3 SENTENCES HERE analyzing timing patterns between purchase and review submission and relationship to typical customer behavior",
   "specificConcerns": "WRITE 3-4 SENTENCES HERE highlighting specific concerns or positive indicators that influenced the final classification with detailed reasoning"
 },
 "imageAnalysis": {
   "hasImages": true,
   "imageCount": 1,
   "productMatch": 0.85,
   "imageQuality": 0.75,
   "authenticity": 0.90,
   "sentimentMatch": 0.80,
   "analysis": "WRITE 4-6 COMPREHENSIVE SENTENCES HERE providing detailed image analysis including product match assessment authenticity evaluation quality assessment lighting conditions composition style and consistency with user-generated vs professional content",
   "flags": ["specific_image_flag_1", "specific_image_flag_2"]
 },
 "flags": ["specific_flag_1", "specific_flag_2"],
 "reasoning": "WRITE 4-5 COMPREHENSIVE SENTENCES HERE providing clear explanation including both text and image analysis results with specific reasoning for the classification decision",
 "needsManualReview": true/false,
 "scores": {
   "sentimentScore": 0.75,
   "authenticityScore": 0.85,
   "productRelevanceScore": 0.80,
   "purchaseVerificationScore": 0.95,
   "overallRiskScore": 0.20
 },
 "riskLevel": "low" | "medium" | "high",
 "recommendations": {
   "action": "approve" | "reject" | "manual_review",
   "priority": "low" | "medium" | "high", 
   "explanation": "WRITE 3-4 SENTENCES HERE providing detailed recommendation explanation including image factors and specific reasoning for the suggested action"
 },
 "keyInsights": [
   "WRITE DETAILED INSIGHT about purchase verification impact with specific reasoning",
   "WRITE DETAILED INSIGHT about content authenticity with specific examples", 
   "WRITE DETAILED INSIGHT about image analysis results with specific observations",
   "WRITE DETAILED INSIGHT about overall risk assessment with comprehensive reasoning"
 ]
}

CRITICAL SUCCESS FACTORS:
- Purchase verification is A PRIMARY trust signal BUT image-product mismatches override this
- Good images from verified buyers = very high confidence
- Bad images from verified buyers = SUSPICIOUS (dog image for phone = ALWAYS suspicious regardless of purchase)
- Any images from non-buyers = additional scrutiny
- SEVERE image-product mismatches (dog/phone, car/brush) = ALWAYS mark suspicious even for verified buyers
- Image analysis CAN OVERRIDE purchase verification when mismatch is severe
- Focus on protecting legitimate customers while catching ALL inappropriate images including from verified buyers
- PROVIDE DETAILED, COMPREHENSIVE ANALYSIS in all text fields - minimum 3-4 sentences each
- BE SPECIFIC about observations, patterns, and reasoning rather than generic statements
- EXPLAIN THE "WHY" behind each assessment with concrete examples from the review/image

Provide intelligent, nuanced, and HIGHLY DETAILED analysis that considers both text review patterns and visual evidence together with comprehensive explanations for all assessments.`;

     let result;
     let attempts = 0;
     const maxAttempts = 3;

     while (attempts < maxAttempts) {
       try {
         console.log(`🖼️ Gemini Vision API attempt ${attempts + 1}/${maxAttempts}`);
         
         // Use Gemini Vision capabilities
         result = await this.model.generateContent([promptWithImage, imagePart]);
         
         // Check if we got a valid response
         const response = await result.response;
         if (!response) {
           throw new Error('Empty response from Gemini Vision API');
         }
         
         break;
       } catch (error) {
         attempts++;
         console.error(`🖼️ Gemini Vision API attempt ${attempts} failed:`, error.message);
         
         // Handle specific error types
         if (error.message.includes('SAFETY')) {
           console.warn('Safety filter triggered for image content');
           return this.createSafetyFilteredAnalysisWithImage(reviewData);
         }
         
         if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('RATE_LIMIT')) {
           console.warn('Rate limit or quota exceeded, implementing backoff');
           const backoffTime = Math.min(1000 * Math.pow(2, attempts), 10000);
           await new Promise(resolve => setTimeout(resolve, backoffTime));
         }
         
         if (attempts < maxAttempts) {
           await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
           
           if (attempts === 2) {
             try {
               await this.initializeModel();
             } catch (initError) {
               console.error('Model reinitialization failed:', initError);
             }
           }
         } else {
           // If image analysis fails completely, fall back to text-only analysis
           console.warn('🖼️ Image analysis failed, falling back to text-only analysis');
           const textAnalysis = await this.analyzeReview(reviewData);
           textAnalysis.imageAnalysis = {
             hasImages: true,
             imageCount: 1,
             analysis: `Image analysis failed after ${maxAttempts} attempts: ${error.message}`,
             flags: ['image_analysis_failed']
           };
           return textAnalysis;
         }
       }
     }

     if (!result) {
       throw new Error('Failed to get response from Gemini Vision after all attempts');
     }

     const response = await result.response;
     const text = response.text();
     
     if (!text || text.trim().length === 0) {
       throw new Error('Empty response text from Gemini Vision');
     }
     
     try {
       // Clean and parse the JSON response
       const cleanedText = this.cleanJsonResponse(text);
       const analysis = JSON.parse(cleanedText);
       
       // IMPORTANT: Perform web search to check for copied content (same for image analysis)
       console.log('🌐 Performing web search to detect copied content in image review...');
       let webSearchResult = null;
       try {
         webSearchResult = await this.performWebSearch(reviewData.comment);
       } catch (webError) {
         console.warn('⚠️ Web search failed, continuing without it:', webError.message);
       }
       
       // Validate and sanitize the response (including image analysis)
       const sanitizedAnalysis = this.sanitizeAnalysisWithImage(analysis);
       
       // Integrate web search results into image analysis
       if (webSearchResult) {
         sanitizedAnalysis.webSearch = webSearchResult;
         
         // Add web search findings to the analysis
         if (webSearchResult.isCopied) {
           // Add copied content flag
           if (!sanitizedAnalysis.flags) sanitizedAnalysis.flags = [];
           sanitizedAnalysis.flags.push('copied_content');
           
           // Update reasoning to include web search findings
           const originalReasoning = sanitizedAnalysis.reasoning || '';
           sanitizedAnalysis.reasoning = `${originalReasoning} ${webSearchResult.analysis}`;
           
           // Add web search info to detailed analysis if present
           if (sanitizedAnalysis.detailedAnalysis) {
             sanitizedAnalysis.detailedAnalysis.webSearchFindings = webSearchResult.analysis;
           }
           
           console.log('🚨 COPIED CONTENT DETECTED in image review:', {
             confidence: webSearchResult.confidence,
             sources: webSearchResult.sources?.length || 0,
             bestMatch: webSearchResult.bestMatch?.domain
           });
         } else {
           console.log('✅ Original content confirmed by web search for image review');
         }
       }
       
       // Apply existing purchase verification overrides (images don't change this logic)
       console.log('🔍 DEBUG: Post-processing check with image:', {
         hasPurchased: reviewData.hasPurchased,
         hasImageAnalysis: !!sanitizedAnalysis.imageAnalysis
       });
       
       if (reviewData.hasPurchased === true) {
         console.log('🔄 Applying verified purchaser overrides (with image consideration)...');
         
         // Force high purchase verification score for verified purchasers
         if (sanitizedAnalysis.scores) {
           console.log('📊 Before override (with image):', sanitizedAnalysis.scores);
           sanitizedAnalysis.scores.purchaseVerificationScore = 0.95;
           
           // Boost scores even more if image analysis is positive
           const imageBoost = sanitizedAnalysis.imageAnalysis?.authenticity > 0.7 ? 0.05 : 0;
           sanitizedAnalysis.scores.authenticityScore = Math.max(0.8, sanitizedAnalysis.scores.authenticityScore + imageBoost);
           sanitizedAnalysis.scores.sentimentScore = Math.max(0.7, sanitizedAnalysis.scores.sentimentScore);
           sanitizedAnalysis.scores.productRelevanceScore = Math.max(0.8, sanitizedAnalysis.scores.productRelevanceScore);
           sanitizedAnalysis.scores.overallRiskScore = Math.min(0.3, sanitizedAnalysis.scores.overallRiskScore);
           console.log('📊 After override (with image):', sanitizedAnalysis.scores);
         }
         
         // Remove purchase-related flags but keep image flags if they exist
         if (sanitizedAnalysis.flags) {
           const purchaseFlags = ['no_purchase_record', 'unverified_reviewer', 'no_purchase', 'unverified', 'purchase_verification_failed'];
           sanitizedAnalysis.flags = sanitizedAnalysis.flags.filter(flag => 
             !purchaseFlags.some(removeFlag => flag.toLowerCase().includes(removeFlag.toLowerCase()))
           );
         }
         
         // Remove purchase-related image flags but keep quality/mismatch flags
         if (sanitizedAnalysis.imageAnalysis?.flags) {
           const purchaseImageFlags = ['no_purchase_image'];
           sanitizedAnalysis.imageAnalysis.flags = sanitizedAnalysis.imageAnalysis.flags.filter(flag => 
             !purchaseImageFlags.some(removeFlag => flag.toLowerCase().includes(removeFlag.toLowerCase()))
           );
         }
         
         // Force classification to genuine unless extreme flags (including severe image issues)
         const extremeFlags = ['bot_behavior', 'copy_paste', 'spam', 'promotional'];
         const extremeImageFlags = ['image_mismatch', 'stock_photo']; // These are concerning but not deal-breakers for verified buyers
         
         const hasExtremeFlags = sanitizedAnalysis.flags && 
           sanitizedAnalysis.flags.some(flag => 
             extremeFlags.some(extreme => flag.toLowerCase().includes(extreme.toLowerCase()))
           );
         
         if (!hasExtremeFlags) {
           sanitizedAnalysis.classification = 'genuine';
           sanitizedAnalysis.confidence = Math.max(0.8, sanitizedAnalysis.confidence);
           sanitizedAnalysis.riskLevel = 'low';
           sanitizedAnalysis.needsManualReview = false;
           
           // Update reasoning to include image analysis
           const imageNote = sanitizedAnalysis.imageAnalysis ? 
             ` Image analysis: ${sanitizedAnalysis.imageAnalysis.analysis || 'completed'}.` : '';
           sanitizedAnalysis.reasoning = `VERIFIED PURCHASER: User has completed purchase with order confirmation.${imageNote} Purchase verification overrides other concerns.`;
         }
         
         console.log('✅ Verified purchaser overrides applied (with image):', {
           classification: sanitizedAnalysis.classification,
           confidence: sanitizedAnalysis.confidence,
           imageFlags: sanitizedAnalysis.imageAnalysis?.flags?.length || 0
         });
       }
       
       console.log('🖼️ Gemini Vision analysis successful:', {
         classification: sanitizedAnalysis.classification,
         confidence: sanitizedAnalysis.confidence,
         hasImageAnalysis: !!sanitizedAnalysis.imageAnalysis,
         imageAuthenticity: sanitizedAnalysis.imageAnalysis?.authenticity
       });
       
       return sanitizedAnalysis;
       
     } catch (parseError) {
       console.error('Failed to parse Gemini Vision response as JSON:', parseError);
       console.log('Raw Gemini Vision response:', text.substring(0, 500));
       
       // IMPORTANT: Perform web search even in image analysis fallback
       console.log('🌐 Performing web search in image analysis fallback...');
       let webSearchResult = null;
       try {
         webSearchResult = await this.performWebSearch(reviewData.comment);
       } catch (webError) {
         console.warn('⚠️ Web search failed in image fallback, continuing without it:', webError.message);
       }
       
       // Fall back to text analysis with image error note
       const fallbackAnalysis = await this.analyzeReview(reviewData);
       fallbackAnalysis.imageAnalysis = {
         hasImages: true,
         imageCount: 1,
         analysis: `JSON parsing failed: ${parseError.message}`,
         flags: ['json_parse_error']
       };
       return fallbackAnalysis;
     }
     
   } catch (error) {
     console.error('🖼️ Gemini Vision API error:', error);
     
     // Fall back to text-only analysis with error note
     try {
       const fallbackAnalysis = await this.analyzeReview(reviewData);
       fallbackAnalysis.imageAnalysis = {
         hasImages: true,
         imageCount: 1,
         analysis: `Image analysis failed: ${error.message}`,
         flags: ['image_analysis_error']
       };
       return fallbackAnalysis;
     } catch (fallbackError) {
       // Complete fallback
       return {
         classification: 'pending',
         confidence: 0,
         flags: ['analysis_failed', 'image_analysis_failed'],
         reasoning: `Complete analysis failed: ${error.message}`,
         needsManualReview: true,
         analyzedAt: new Date().toISOString(),
         error: error.message,
         riskLevel: 'medium',
         imageAnalysis: {
           hasImages: true,
           imageCount: 1,
           analysis: 'Both text and image analysis failed',
           flags: ['complete_analysis_failure']
         }
       };
     }
   }
 }

 // Helper method to detect image MIME type from base64
 detectImageMimeType(base64String) {
   if (base64String.startsWith('data:')) {
     const mimeMatch = base64String.match(/data:([^;]+);/);
     return mimeMatch ? mimeMatch[1] : 'image/jpeg';
   }
   
   // Try to detect from base64 header
   const firstChars = base64String.substring(0, 10);
   if (firstChars.startsWith('/9j/')) return 'image/jpeg';
   if (firstChars.startsWith('iVBOR')) return 'image/png';
   if (firstChars.startsWith('R0lGO')) return 'image/gif';
   if (firstChars.startsWith('UklGR')) return 'image/webp';
   
   // Default fallback
   return 'image/jpeg';
 }

 // Safe browser-compatible base64 conversion for large images
 arrayBufferToBase64(arrayBuffer) {
   try {
     const uint8Array = new Uint8Array(arrayBuffer);
     
     // For very large images, process in chunks to avoid call stack size exceeded
     if (uint8Array.length > 100000) { // 100KB threshold
       let binary = '';
       const chunkSize = 8192; // 8KB chunks
       
       for (let i = 0; i < uint8Array.length; i += chunkSize) {
         const chunk = uint8Array.slice(i, i + chunkSize);
         try {
           binary += String.fromCharCode(...chunk);
         } catch (chunkError) {
           // Handle potential "Maximum call stack size exceeded" error
           for (let j = 0; j < chunk.length; j++) {
             binary += String.fromCharCode(chunk[j]);
           }
         }
       }
       return btoa(binary);
     } else {
       // For smaller images, use direct conversion with fallback
       try {
         return btoa(String.fromCharCode(...uint8Array));
       } catch (directError) {
         // Fallback to individual character conversion
         let binary = '';
         for (let i = 0; i < uint8Array.length; i++) {
           binary += String.fromCharCode(uint8Array[i]);
         }
         return btoa(binary);
       }
     }
   } catch (error) {
     throw new Error(`Base64 conversion failed: ${error.message}`);
   }
 }

 // Validate image format and security
 validateImageData(imageData, maxSizeBytes = 5 * 1024 * 1024) {
   if (!imageData || typeof imageData !== 'string') {
     throw new Error('Invalid image data: must be a string');
   }

   // Security: Prevent extremely long strings that could cause DoS
   if (imageData.length > 50 * 1024 * 1024) { // 50MB string limit
     throw new Error('Image data string too large');
   }

   // Cloudinary URL validation with additional security checks
   const cloudinaryRegex = /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\//;
   if (cloudinaryRegex.test(imageData)) {
     // Additional Cloudinary URL security checks
     if (imageData.includes('..') || imageData.includes('%2e%2e')) {
       throw new Error('Invalid Cloudinary URL: path traversal detected');
     }
     
     // Ensure HTTPS only
     if (!imageData.startsWith('https://')) {
       throw new Error('Only HTTPS Cloudinary URLs are allowed');
     }
     
     return { type: 'cloudinary', url: imageData };
   }

   // Base64 data URL validation with enhanced security
   const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
   if (dataUrlRegex.test(imageData)) {
     const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/i, '');
     
     // Validate base64 format more strictly
     if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
       throw new Error('Invalid base64 format');
     }
     
     // Prevent empty base64 data
     if (base64Data.length === 0) {
       throw new Error('Empty base64 image data');
     }
     
     // Estimate size (base64 is ~33% larger than original)
     const estimatedSize = (base64Data.length * 3) / 4;
     if (estimatedSize > maxSizeBytes) {
       throw new Error(`Image too large: ${Math.round(estimatedSize / 1024 / 1024)}MB (max ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
     }
     
     // Extract MIME type with case insensitive matching
     const mimeMatch = imageData.match(/data:(image\/[^;]+);/i);
     const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
     
     return { type: 'base64', data: base64Data, mimeType: mimeType };
   }

   throw new Error('Invalid image format. Only HTTPS Cloudinary URLs and base64 data URLs supported.');
 }

 // Enhanced sanitizer for image analysis
 sanitizeAnalysisWithImage(analysis) {
   // Get base sanitized analysis
   const sanitized = this.sanitizeAnalysis(analysis);
   
   // Add image analysis sanitization
   if (analysis.imageAnalysis) {
     sanitized.imageAnalysis = {
       hasImages: Boolean(analysis.imageAnalysis.hasImages),
       imageCount: Math.max(0, parseInt(analysis.imageAnalysis.imageCount) || 0),
       productMatch: analysis.imageAnalysis.productMatch !== undefined ? 
         Math.max(0, Math.min(1, parseFloat(analysis.imageAnalysis.productMatch))) : undefined,
       imageQuality: analysis.imageAnalysis.imageQuality !== undefined ? 
         Math.max(0, Math.min(1, parseFloat(analysis.imageAnalysis.imageQuality))) : undefined,
       authenticity: analysis.imageAnalysis.authenticity !== undefined ? 
         Math.max(0, Math.min(1, parseFloat(analysis.imageAnalysis.authenticity))) : undefined,
       sentimentMatch: analysis.imageAnalysis.sentimentMatch !== undefined ? 
         Math.max(0, Math.min(1, parseFloat(analysis.imageAnalysis.sentimentMatch))) : undefined,
       analysis: String(analysis.imageAnalysis.analysis || '').substring(0, 1000),
       flags: Array.isArray(analysis.imageAnalysis.flags) ? 
         analysis.imageAnalysis.flags.slice(0, 10).map(flag => String(flag)) : []
     };
   }
   
   return sanitized;
 }

 // Safety-filtered analysis with image support
 createSafetyFilteredAnalysisWithImage(reviewData) {
   const baseAnalysis = this.createSafetyFilteredAnalysis(reviewData);
   baseAnalysis.imageAnalysis = {
     hasImages: true,
     imageCount: 1,
     analysis: 'Image content triggered safety filters and requires manual review',
     flags: ['safety_filter_triggered']
   };
   return baseAnalysis;
 }

 // NEW: A2A (Agent-to-Agent) Validation System
 requiresA2AValidation(analysisResult, agentResult, reviewData) {
   // Trigger A2A validation for critical conflict scenarios
   const criticalConditions = [
     // Verified buyer but flagged as suspicious due to content/image mismatch
     reviewData.hasPurchased === true && agentResult.displayIndicator === 'red',
     
     // High confidence analysis but agent marked as suspicious
     analysisResult.confidence > 0.8 && agentResult.displayIndicator === 'red',
     
     // Image-product mismatch detected
     agentResult.overrideReasons?.includes('image_mismatch'),
     
     // Content-product mismatch detected  
     agentResult.overrideReasons?.includes('content_mismatch'),
     
     // Conflicting signals (genuine classification but red indicator)
     analysisResult.classification === 'genuine' && agentResult.displayIndicator === 'red'
   ];
   
   const requiresValidation = criticalConditions.some(condition => condition);
   
   console.log('🔍 A2A Validation Check:', {
     hasImageMismatch: agentResult.overrideReasons?.includes('image_mismatch'),
     hasContentMismatch: agentResult.overrideReasons?.includes('content_mismatch'),
     verifiedBuyerButSuspicious: reviewData.hasPurchased === true && agentResult.displayIndicator === 'red',
     highConfidenceButSuspicious: analysisResult.confidence > 0.8 && agentResult.displayIndicator === 'red',
     requiresValidation
   });
   
   return requiresValidation;
 }

 async secondaryAgentValidation(analysisResult, primaryAgentResult, reviewData) {
   console.log('🤖🤖 Starting secondary agent (A2A) validation...');
   
   try {
     if (!this.model) {
       await this.initializeModel();
     }

     const secondaryAgentPrompt = `
You are a SECONDARY AI AGENT (Agent 2) in an Agent-to-Agent (A2A) validation system. Your role is to provide an independent second opinion on challenging review approval decisions.

PRIMARY AGENT DECISION UNDER REVIEW:
- Decision: ${primaryAgentResult.agentDecision}
- Display Indicator: ${primaryAgentResult.displayIndicator}
- Reasoning: "${primaryAgentResult.agentReasoning}"
- User Status: ${primaryAgentResult.userDisplayStatus}
- Override Reasons: ${JSON.stringify(primaryAgentResult.overrideReasons || [])}

ORIGINAL ANALYSIS DATA:
- Classification: ${analysisResult.classification}
- Confidence: ${analysisResult.confidence}
- Flags: ${JSON.stringify(analysisResult.flags || [])}
- Purchase Verified: ${reviewData.hasPurchased === true ? 'YES' : 'NO'}

${analysisResult.imageAnalysis ? `
IMAGE ANALYSIS:
- Product Match: ${analysisResult.imageAnalysis.productMatch || 'N/A'}
- Image Authenticity: ${analysisResult.imageAnalysis.authenticity || 'N/A'}
- Image Flags: ${JSON.stringify(analysisResult.imageAnalysis.flags || [])}
` : ''}

REVIEW DATA:
- Product: "${reviewData.productName || 'Unknown'}"
- Category: "${reviewData.productCategory || 'Unknown'}"
- Comment: "${reviewData.comment}"
- Rating: ${reviewData.rating}/5

🎯 SECONDARY AGENT VALIDATION MISSION:

Your job is to INDEPENDENTLY evaluate if the primary agent's decision was correct. Ask yourself:

1. CONTENT RELEVANCE CHECK:
   - Does the review content actually match the product?
   - Is the review about the right product category?
   - Are the concerns legitimate?

2. IMAGE VALIDATION CHECK:  
   - If image mismatch flagged, is it truly wrong product?
   - Could it be related product or angle issue?
   - Is the mismatch severe enough to override purchase verification?

3. BUYER PROTECTION BALANCE:
   - Are we being too harsh on verified buyers?
   - Are we protecting customers from truly misleading content?
   - Is the decision fair and reasonable?

4. BUSINESS IMPACT:
   - Will this decision protect customers?
   - Are we maintaining trust in the review system?
   - Is transparency preserved?

DECISION CRITERIA:
- UPHOLD primary decision if reasoning is sound
- OVERRIDE if primary agent was too harsh/lenient
- ESCALATE if case needs human review

Respond with this EXACT JSON:

{
  "a2aDecision": "uphold" | "override" | "escalate",
  "finalDisplayIndicator": "green" | "yellow" | "red",
  "a2aReasoning": "WRITE 3-4 SENTENCES explaining your independent assessment and whether you agree with the primary agent",
  "disagreementPoints": ["specific area 1", "specific area 2"],
  "recommendedAction": "approve" | "reject" | "manual_review",
  "secondaryAgentConfidence": 0.85,
  "consensusReached": true | false
}

Provide objective, independent judgment that prioritizes fair treatment of customers while maintaining review quality standards.`;

     const result = await this.model.generateContent(secondaryAgentPrompt);
     const response = await result.response;
     const text = response.text();
     
     try {
       const cleanedText = this.cleanJsonResponse(text);
       const secondaryDecision = JSON.parse(cleanedText);
       
       // Process A2A result
       if (secondaryDecision.a2aDecision === 'override') {
         // Secondary agent overrides primary decision
         return {
           ...primaryAgentResult,
           displayIndicator: secondaryDecision.finalDisplayIndicator,
           agentReasoning: secondaryDecision.a2aReasoning,
           userDisplayStatus: this.getDisplayStatus(secondaryDecision.finalDisplayIndicator),
           adminNotes: `A2A Override: ${primaryAgentResult.adminNotes} | Secondary agent reasoning: ${secondaryDecision.a2aReasoning}`,
           agentConfidence: secondaryDecision.secondaryAgentConfidence,
           a2aValidation: {
             performed: true,
             decision: secondaryDecision.a2aDecision,
             consensusReached: secondaryDecision.consensusReached,
             disagreementPoints: secondaryDecision.disagreementPoints || []
           },
           agentModelVersion: 'gemini-2.0-flash-agent-a2a-override'
         };
       } else if (secondaryDecision.a2aDecision === 'escalate') {
         // Escalate to manual review
         return {
           ...primaryAgentResult,
           displayIndicator: 'yellow',
           userDisplayStatus: 'Needs Attention',
           adminNotes: `A2A Escalation: ${primaryAgentResult.adminNotes} | Requires human review: ${secondaryDecision.a2aReasoning}`,
           a2aValidation: {
             performed: true,
             decision: secondaryDecision.a2aDecision,
             consensusReached: false,
             escalationReason: secondaryDecision.a2aReasoning
           },
           agentModelVersion: 'gemini-2.0-flash-agent-a2a-escalation'
         };
       } else {
         // Uphold primary agent decision
         return {
           ...primaryAgentResult,
           adminNotes: `${primaryAgentResult.adminNotes} | A2A Validation: Decision upheld by secondary agent`,
           a2aValidation: {
             performed: true,
             decision: secondaryDecision.a2aDecision,
             consensusReached: secondaryDecision.consensusReached,
             validationNotes: secondaryDecision.a2aReasoning
           },
           agentModelVersion: 'gemini-2.0-flash-agent-a2a-upheld'
         };
       }
       
     } catch (parseError) {
       console.error('Failed to parse secondary agent response:', parseError);
       throw new Error('Secondary agent parsing failed');
     }
     
   } catch (error) {
     console.error('Secondary agent validation failed:', error);
     throw error;
   }
 }

 getDisplayStatus(indicator) {
   switch (indicator) {
     case 'green': return 'Verified Genuine';
     case 'yellow': return 'Under Review';
     case 'red': return 'Flagged Suspicious';
     default: return 'Under Review';
   }
 }
}

export default ReviewAnalysisService;

// Create a singleton instance for use throughout the application
const reviewAnalysisService = new ReviewAnalysisService();

// Export individual functions for easy importing
export const analyzeReview = (reviewData) => reviewAnalysisService.analyzeReview(reviewData);
export const processReviewComplete = (reviewData) => reviewAnalysisService.processReviewComplete(reviewData);
export const aiAgentApproval = (reviewAnalysis, reviewData) => reviewAnalysisService.aiAgentApproval(reviewAnalysis, reviewData);
export const getProductAnalytics = (reviews, productId) => reviewAnalysisService.getProductAnalytics(reviews, productId);
export const validateImageContent = (imageUrl) => reviewAnalysisService.validateImageContent(imageUrl);
export const performWebSearch = (query) => reviewAnalysisService.performWebSearch(query);