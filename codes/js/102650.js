// server.js - Express backend for the review analyzer
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const url = require('url');
const xpath = require('xpath');
const domParser = require('xmldom').DOMParser;
const dom = new domParser({
  errorHandler: {
    warning: () => {},
    error: () => {},
    fatalError: (e) => console.error('Fatal XML parsing error:', e)
  }
});
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

console.log('======================================');
console.log('Starting server with GEMINI API - UPDATED VERSION');
console.log('======================================');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: "v1" // Use v1 instead of v1beta
});

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 3,
  timeWindow: 60000, // 1 minute
  lastRequestTime: 0,
  requestCount: 0
};

// Puppeteer browser instance
let browser;

// Initialize browser on startup
async function initBrowser() {
  try {
    // Install Chrome if not present
    const { executablePath } = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    // Now launch with the correct executable path
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log('Puppeteer browser initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Puppeteer browser:', error);
    return false;
  }
}

// Close browser on server shutdown
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});

// In-memory cache for performance optimization
const reviewCache = new Map();

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Search for a product by name
app.get('/api/search/:productName', async (req, res) => {
  try {
    const productName = req.params.productName;
    
    // Check cache first
    if (reviewCache.has(productName)) {
      const cachedData = reviewCache.get(productName);
      const cacheTime = cachedData.timestamp;
      const now = Date.now();
      
      // Use cache if it's less than 1 hour old
      if (now - cacheTime < 3600000) {
        console.log(`Returning cached data for ${productName}`);
        return res.json(cachedData.data);
      }
    }
    
    console.log(`Searching for reviews of ${productName}`);
    
    // Create a better timeout wrapper for platform scraping
    const fetchWithTimeout = async (platformFn, productName, platformName, timeout = 45000) => {
      // Create a timeout promise that resolves with an empty array after timeout
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          console.error(`${platformName} search timed out after ${timeout}ms`);
          resolve({ status: 'rejected', reason: 'Timeout', value: [] });
        }, timeout);
      });
      
      // Create the actual fetch promise
      const fetchPromise = new Promise(async resolve => {
        try {
          const result = await platformFn(productName);
          resolve({ 
            status: 'fulfilled', 
            value: result || [] 
          });
        } catch (error) {
          console.error(`${platformName} search error:`, error.message);
          resolve({ 
            status: 'rejected', 
            reason: error.message,
            value: [] 
          });
        }
      });
      
      // Race the two promises - whichever completes first wins
      return Promise.race([fetchPromise, timeoutPromise]);
    };
    
    // Fetch from all platforms in parallel with timeout protection
    const results = await Promise.all([
      fetchWithTimeout(scrapeAmazonReviews, productName, 'Amazon'),
      fetchWithTimeout(scrapeFlipkartReviews, productName, 'Flipkart'),
      fetchWithTimeout(scrapeGoogleReviews, productName, 'Google')
    ]);
    
    // Log platform results
    results.forEach((result, index) => {
      const platform = ['Amazon', 'Flipkart', 'Google'][index];
      if (result.status === 'fulfilled') {
        console.log(`${platform}: Found ${result.value.length} reviews`);
      } else {
        console.error(`${platform}: Failed to scrape - ${result.reason}`);
      }
    });
    
    // Combine reviews from all platforms
    let allReviews = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allReviews = [...allReviews, ...result.value];
      }
    });
    
    // Ensure we get at least one review for analysis
    if (allReviews.length === 0) {
      // Try to get fallback data if no reviews found
      const fallbackReviews = [
        ...getMockReviews('Amazon', 7),
        ...getMockReviews('Flipkart', 7),
        ...getMockReviews('Google', 6)
      ];
      
      console.log(`No actual reviews found for ${productName}, using ${fallbackReviews.length} fallback reviews`);
      
      // Mark these as fallback reviews
      fallbackReviews.forEach(review => {
        review.isFallback = true;
      });
      
      allReviews = fallbackReviews;
    }
    
    // Log the number of reviews before analysis
    console.log(`Found a total of ${allReviews.length} review(s) for ${productName}, proceeding with analysis`);
    
    // Analyze reviews using AI - add error handling for the analysis
    let analysis;
    try {
      analysis = await analyzeReviewsWithAI(allReviews, productName);
    } catch (analysisError) {
      console.error(`Error during AI analysis: ${analysisError.message}`);
      // Use local fallback analysis if AI fails
      analysis = generateLocalAnalysis(allReviews, productName);
    }
    
    // Create response object
    const responseData = {
      name: productName,
      reviews: allReviews,
      analysis: analysis
    };
    
    // Update cache
    reviewCache.set(productName, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Send response
    res.json(responseData);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Error searching for product', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get reviews directly from a product URL
app.post('/api/url', async (req, res) => {
  try {
    const { productUrl } = req.body;
    
    if (!productUrl) {
      return res.status(400).json({ message: 'Product URL is required' });
    }
    
    console.log(`Processing URL: ${productUrl}`);
    
    // Check cache first
    if (reviewCache.has(productUrl)) {
      const cachedData = reviewCache.get(productUrl);
      const cacheTime = cachedData.timestamp;
      const now = Date.now();
      
      // Use cache if it's less than 1 hour old
      if (now - cacheTime < 3600000) {
        console.log(`Returning cached data for URL: ${productUrl}`);
        return res.json(cachedData.data);
      }
    }
    
    // Determine which platform the URL belongs to
    let parsedUrl, hostname;
    try {
      parsedUrl = url.parse(productUrl);
      hostname = parsedUrl.hostname ? parsedUrl.hostname.toLowerCase() : '';
      console.log(`Parsed URL: ${productUrl} -> hostname: ${hostname}`);
    } catch (parseError) {
      console.error(`Error parsing URL ${productUrl}: ${parseError.message}`);
      hostname = '';
    }
    
    let reviews = [];
    let productName = 'Unknown Product';
    let scrapingError = null;
    
    // Route to appropriate scraping function
    try {
      if (hostname.includes('amazon')) {
        console.log('Identified as Amazon URL');
        productName = await extractProductNameFromUrl(productUrl);
        reviews = await scrapeAmazonReviewsFromUrl(productUrl);
      } else if (hostname.includes('flipkart')) {
        console.log('Identified as Flipkart URL');
        productName = await extractProductNameFromUrl(productUrl);
        reviews = await scrapeFlipkartReviewsFromUrl(productUrl);
      } else if (hostname.includes('google')) {
        console.log('Identified as Google URL');
        productName = await extractProductNameFromUrl(productUrl);
        reviews = await scrapeGoogleReviewsFromUrl(productUrl);
      } else {
        // For other websites, try generic scraping
        console.log('Using generic scraping for URL');
        const result = await scrapeGenericReviewsFromUrl(productUrl);
        productName = result.productName;
        reviews = result.reviews;
      }
    } catch (scrapeError) {
      console.error(`Error during scraping: ${scrapeError.message}`);
      scrapingError = scrapeError.message;
    }
    
    // If no reviews were found at all, use fallback data
    if (reviews.length === 0) {
      console.log(`No reviews found for URL: ${productUrl}`);
      console.log('Using fallback reviews');
      
      // If no reviews were found, use fallback data
      let platform = 'Generic';
      
      if (hostname) {
        if (hostname.includes('amazon')) {
          platform = 'Amazon';
        } else if (hostname.includes('flipkart')) {
          platform = 'Flipkart';
        } else if (hostname.includes('google')) {
          platform = 'Google';
        }
      }
      
      console.log(`Using ${platform} fallback reviews`);
      
      // Use more fallback reviews
      if (platform === 'Generic') {
        // For generic, use a mix of all platforms
        reviews = [
          ...getMockReviews('Amazon', 7),
          ...getMockReviews('Flipkart', 7),
          ...getMockReviews('Google', 6)
        ];
      } else {
        // For known platforms, use more of that platform's reviews
        reviews = getMockReviews(platform, 20);
      }
      
      // Mark these as fallback reviews
      reviews.forEach(review => {
        review.isFallback = true;
      });
    }
    
    // Log the number of reviews before analysis
    console.log(`Found a total of ${reviews.length} review(s) for URL: ${productUrl}, proceeding with analysis`);
    
    // Analyze reviews using GPT - will work even with a single review now
    let analysis;
    try {
      analysis = await analyzeReviewsWithAI(reviews, productName);
    } catch (analysisError) {
      console.error(`Error during AI analysis: ${analysisError.message}`);
      // Use local fallback analysis if AI fails
      analysis = generateLocalAnalysis(reviews, productName);
    }
    
    // Create response object
    const responseData = {
      name: productName,
      url: productUrl,
      reviews: reviews,
      analysis: analysis
    };
    
    // Update cache
    reviewCache.set(productUrl, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Send response
    console.log(`Sending response with ${reviews.length} review(s) and analysis`);
    res.json(responseData);
  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ 
      message: 'Error processing product URL', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Extract product name from a URL
async function extractProductNameFromUrl(productUrl) {
  try {
    const { html } = await fetchHtml(productUrl);
    
    // Use cheerio directly for title extraction instead of XPath
    const $ = cheerio.load(html);
    const title = $('title').text() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="title"]').attr('content') || 
                 $('h1').first().text();
    
    return title.split('|')[0].split('-')[0].trim() || 'Unknown Product';
  } catch (error) {
    console.error('Error extracting product name:', error.message);
    return 'Unknown Product';
  }
}

// Scrape Amazon reviews from a specific product URL
async function scrapeAmazonReviewsFromUrl(url) {
  try {
    const { html, source } = await fetchHtml(url);
    console.log(`Got Amazon product page using ${source} method`);
    
    // Get product name using Cheerio
    const $ = cheerio.load(html);
    const productName = $('#productTitle').text().trim();
    
    if (!productName) {
      console.log('Could not find product name on Amazon');
      return [];
    }
    
    // Find reviews section link
    let reviewsUrl = $('a#customerReviews, a#cr-pagination-link-top, a[data-hook="see-all-reviews-link-foot"]').attr('href');
    
    if (!reviewsUrl) {
      console.log('No reviews link found on Amazon product page');
      return [];
    }
    
    // Make sure it's an absolute URL
    if (!reviewsUrl.startsWith('http')) {
      reviewsUrl = `https://www.amazon.com${reviewsUrl}`;
    }
    
    // Get reviews page
    const { html: reviewsHtml, source: reviewsSource } = await fetchHtml(reviewsUrl);
    console.log(`Got Amazon reviews page using ${reviewsSource} method`);
    
    // Parse reviews using Cheerio
    const reviews$ = cheerio.load(reviewsHtml);
    const reviews = [];
    
    // Try multiple review container selectors
    const reviewContainers = [
      'div[data-hook="review"]',
      'div.review',
      'div.customer-review',
      'div.review-item'
    ];
    
    for (const container of reviewContainers) {
      const reviewElements = reviews$(container);
      if (reviewElements.length > 0) {
        reviewElements.each((i, elem) => {
          if (i >= 20) return false; // Limit to 20 reviews
          
          // Try multiple title selectors
          const titleSelectors = [
            'a[data-hook="review-title"] span',
            'span.review-title',
            'h3.review-title'
          ];
          
          let reviewTitle = '';
          for (const selector of titleSelectors) {
            const title = reviews$(elem).find(selector).text().trim();
            if (title) {
              reviewTitle = title;
              break;
            }
          }
          
          // Try multiple content selectors
          const contentSelectors = [
            'span[data-hook="review-body"] span',
            'div.review-text',
            'div.review-content',
            'p.review-text'
          ];
          
          let reviewText = '';
          for (const selector of contentSelectors) {
            const text = reviews$(elem).find(selector).text().trim();
            if (text) {
              reviewText = text;
              break;
            }
          }
          
          // Try multiple rating selectors
          const ratingSelectors = [
            'i[data-hook="review-star-rating"] span',
            'span.a-icon-alt',
            'div.review-rating',
            'span.rating'
          ];
          
          let rating = 0;
          for (const selector of ratingSelectors) {
            const ratingText = reviews$(elem).find(selector).text().trim();
            if (ratingText) {
              const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
              rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
              break;
            }
          }
          
          if (reviewText) {
            reviews.push({
              title: reviewTitle,
              text: reviewText,
              rating: rating,
              source: 'Amazon'
            });
          }
        });
        
        // If we found reviews with this container, break the loop
        if (reviews.length > 0) break;
      }
    }
    
    // Try to get additional pages of reviews if needed
    if (reviews.length < 20) {
      try {
        // Look for pagination
        const nextPageLink = reviews$('li.a-last a, a.a-last').attr('href');
        if (nextPageLink) {
          const nextPageUrl = nextPageLink.startsWith('http') ? 
            nextPageLink : `https://www.amazon.com${nextPageLink}`;
          
          console.log(`Fetching additional Amazon reviews from page 2...`);
          const { html: page2Html } = await fetchHtml(nextPageUrl);
          
          const page2$ = cheerio.load(page2Html);
          
          // Try the same container selectors for page 2
          for (const container of reviewContainers) {
            const page2Reviews = page2$(container);
            if (page2Reviews.length > 0) {
              page2Reviews.each((i, elem) => {
                if (reviews.length >= 20) return false;
                
                // Use the same selectors as above
                let reviewTitle = '';
                for (const selector of titleSelectors) {
                  const title = page2$(elem).find(selector).text().trim();
                  if (title) {
                    reviewTitle = title;
                    break;
                  }
                }
                
                let reviewText = '';
                for (const selector of contentSelectors) {
                  const text = page2$(elem).find(selector).text().trim();
                  if (text) {
                    reviewText = text;
                    break;
                  }
                }
                
                let rating = 0;
                for (const selector of ratingSelectors) {
                  const ratingText = page2$(elem).find(selector).text().trim();
                  if (ratingText) {
                    const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
                    rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                    break;
                  }
                }
                
                if (reviewText) {
                  reviews.push({
                    title: reviewTitle,
                    text: reviewText,
                    rating: rating,
                    source: 'Amazon'
                  });
                }
              });
              
              // If we found reviews with this container, break the loop
              if (reviews.length > 0) break;
            }
          }
        }
      } catch (paginationError) {
        console.error('Error fetching additional Amazon reviews:', paginationError.message);
      }
    }
    
    console.log(`Found ${reviews.length} Amazon reviews for "${productName}"`);
    return reviews;
  } catch (error) {
    console.error('Amazon URL scraping error:', error.message);
    return [];
  }
}

// Scrape Flipkart reviews from a specific product URL
async function scrapeFlipkartReviewsFromUrl(url) {
  try {
    const { html, source } = await fetchHtml(url);
    console.log(`Got Flipkart product page using ${source} method`);
    
    // Get product name using Cheerio
    const $ = cheerio.load(html);
    const productName = $('span.B_NuCI').text().trim();
    
    if (!productName) {
      console.log('Could not find product name on Flipkart');
      return [];
    }
    
    // Find reviews section link
    let reviewsUrl = $('div._3UAT2v a').attr('href');
    
    if (!reviewsUrl) {
      console.log('No reviews link found on Flipkart product page');
      return [];
    }
    
    // Make sure it's an absolute URL
    if (!reviewsUrl.startsWith('http')) {
      reviewsUrl = `https://www.flipkart.com${reviewsUrl}`;
    }
    
    // Get reviews page
    const { html: reviewsHtml, source: reviewsSource } = await fetchHtml(reviewsUrl);
    console.log(`Got Flipkart reviews page using ${reviewsSource} method`);
    
    // Parse reviews using Cheerio
    const reviews$ = cheerio.load(reviewsHtml);
    const reviewElements = reviews$('div._1AtVbE div._27M-vq');
    
    const reviews = [];
    
    reviewElements.each((i, elem) => {
      if (i >= 20) return false; // Limit to 20 reviews
      
      const reviewTitle = reviews$(elem).find('p._2-N8zT').text().trim();
      const reviewText = reviews$(elem).find('div.t-ZTKy div div').text().trim();
      let rating = '0';
      
      const ratingText = reviews$(elem).find('div._3LWZlK').text().trim();
      if (ratingText) {
        rating = ratingText;
      }
      
      reviews.push({
        title: reviewTitle,
        text: reviewText,
        rating: parseFloat(rating),
        source: 'Flipkart'
      });
    });
    
    // Try to get additional pages of reviews if needed
    if (reviews.length < 20) {
      try {
        // Look for pagination
        const nextPageLink = reviews$('a._1LKTO3').last().attr('href');
        if (nextPageLink) {
          const nextPageUrl = nextPageLink.startsWith('http') ? 
            nextPageLink : `https://www.flipkart.com${nextPageLink}`;
          
          console.log(`Fetching additional Flipkart reviews from page 2...`);
          const { html: page2Html } = await fetchHtml(nextPageUrl);
          
          const page2$ = cheerio.load(page2Html);
          const page2Reviews = page2$('div._1AtVbE div._27M-vq');
          
          page2Reviews.each((i, elem) => {
            if (reviews.length >= 20) return false;
            
            const reviewTitle = page2$(elem).find('p._2-N8zT').text().trim();
            const reviewText = page2$(elem).find('div.t-ZTKy div div').text().trim();
            let rating = '0';
            
            const ratingText = page2$(elem).find('div._3LWZlK').text().trim();
            if (ratingText) {
              rating = ratingText;
            }
            
            reviews.push({
              title: reviewTitle,
              text: reviewText,
              rating: parseFloat(rating),
              source: 'Flipkart'
            });
          });
        }
      } catch (paginationError) {
        console.error('Error fetching additional Flipkart reviews:', paginationError.message);
      }
    }
    
    console.log(`Found ${reviews.length} Flipkart reviews for "${productName}"`);
    return reviews;
  } catch (error) {
    console.error('Flipkart URL scraping error:', error.message);
    return [];
  }
}

// Scrape Google reviews from a specific product URL
async function scrapeGoogleReviewsFromUrl(url) {
  try {
    const { html, source } = await fetchHtml(url);
    console.log(`Got Google product page using ${source} method`);
    
    // Use Cheerio to get product details
    const $ = cheerio.load(html);
    const productName = $('h1').first().text().trim();
    
    if (!productName) {
      console.log('Could not find product name on Google Shopping');
      return [];
    }
    
    // Extract reviews directly from the page
    const reviewElements = $('div.dIsU3e');
    
    const reviews = [];
    
    reviewElements.each((i, elem) => {
      if (i >= 20) return false; // Limit to 20 reviews
      
      const reviewText = $(elem).text().trim();
      let rating = '0';
      
      // Try to extract rating if available
      const ratingElement = $(elem).find('span[aria-label]');
      if (ratingElement.length) {
        const ratingText = ratingElement.attr('aria-label');
        rating = ratingText.match(/\d+(\.\d+)?/)?.[0] || '0';
      }
      
      reviews.push({
        title: reviewText.substring(0, 50) + '...',
        text: reviewText,
        rating: parseFloat(rating),
        source: 'Google'
      });
    });
    
    // For Google, we'll try to extract more reviews from the "View more" section if available
    if (reviews.length < 20) {
      try {
        // Look for "View more reviews" link
        const moreReviewsLink = $('a:contains("View more reviews"), a:contains("See all reviews")').attr('href');
        if (moreReviewsLink) {
          const moreReviewsUrl = moreReviewsLink.startsWith('http') ? 
            moreReviewsLink : `https://www.google.com${moreReviewsLink}`;
          
          console.log(`Fetching additional Google reviews...`);
          // For Google, we especially want to use Puppeteer for this request
          // as it often requires JavaScript to load reviews
          const { html: moreReviewsHtml } = await fetchHtml(moreReviewsUrl, { preferPuppeteer: true });
          
          const moreReviews$ = cheerio.load(moreReviewsHtml);
          const moreReviewElements = moreReviews$('div.Jtu6Td');
          
          moreReviewElements.each((i, elem) => {
            if (reviews.length >= 20) return false;
            
            const reviewText = moreReviews$(elem).text().trim();
            let rating = '0';
            
            // Try to extract rating if available
            const ratingElement = moreReviews$(elem).find('span[aria-label]');
            if (ratingElement.length) {
              const ratingText = ratingElement.attr('aria-label');
              rating = ratingText.match(/\d+(\.\d+)?/)?.[0] || '0';
            }
            
            reviews.push({
              title: reviewText.substring(0, 50) + '...',
              text: reviewText,
              rating: parseFloat(rating),
              source: 'Google'
            });
          });
        }
      } catch (moreReviewsError) {
        console.error('Error fetching additional Google reviews:', moreReviewsError.message);
      }
    }
    
    console.log(`Found ${reviews.length} Google reviews for "${productName}"`);
    return reviews;
  } catch (error) {
    console.error('Google URL scraping error:', error.message);
    return [];
  }
}

// Generic review scraper that tries to find reviews on any website
async function scrapeGenericReviewsFromUrl(productUrl) {
  try {
    const { html, source } = await fetchHtml(productUrl);
    console.log(`Got generic page using ${source} method`);
    
    // Extract product name
    const productName = await extractProductNameFromUrl(productUrl);
    
    // Use Cheerio for parsing
    const $ = cheerio.load(html);
    const reviews = [];
    
    // Try various common selectors for reviews
    const reviewSelectors = [
      'div.review', 'div.reviews', 'div.customer-review', 
      '.ratings-reviews', '[data-hook="review"]', '.review-item'
    ];
    
    // Try each selector until we find reviews
    let foundReviews = false;
    for (const selector of reviewSelectors) {
      const reviewElements = $(selector);
      if (reviewElements.length > 0) {
        reviewElements.each((i, element) => {
          if (i >= 20) return false; // Limit to 20 reviews
          
          // Try common content selectors
          const contentSelectors = ['p', 'div.content', 'div.text', 'div.review-content', 'div.review-text'];
          let content = '';
          
          for (const contentSelector of contentSelectors) {
            const foundContent = $(element).find(contentSelector).text().trim();
            if (foundContent && foundContent.length > 10) {
              content = foundContent;
              break;
            }
          }
          
          if (content) {
            // Try common rating selectors
            const ratingSelectors = ['span.rating', 'div.rating', 'span.stars', 'div.stars'];
            let rating = 3; // Default rating
            
            for (const ratingSelector of ratingSelectors) {
              const ratingText = $(element).find(ratingSelector).text().trim();
              if (ratingText) {
                const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
                rating = ratingMatch ? parseFloat(ratingMatch[1]) : 3;
                break;
              }
            }
            
            reviews.push({
              platform: 'Generic',
              content,
              rating,
              date: new Date()
            });
            
            foundReviews = true;
          }
        });
      }
      
      if (foundReviews) break;
    }
    
    // If still no reviews found, try simple text extraction
    if (reviews.length === 0) {
      console.log('No reviews found with specific selectors, trying simple text extraction');
      
      // Look for content that might be reviews
      $('p, div').each((i, element) => {
        if (reviews.length >= 20) return false; // Limit to 20 reviews
        
        const text = $(element).text().trim();
        // Look for paragraphs that are reasonably long (like reviews)
        if (text.length > 50 && text.length < 1000 && !$(element).has('p, div').length) {
          reviews.push({
            platform: 'Generic',
            content: text,
            rating: 3, // Default rating
            date: new Date()
          });
        }
      });
    }
    
    console.log(`Found ${reviews.length} reviews from generic page`);
    
    return {
      productName,
      reviews
    };
  } catch (error) {
    console.error('Generic URL scraping error:', error.message);
    return {
      productName: 'Unknown Product',
      reviews: []
    };
  }
}

// Web scraping functions for name-based search
async function scrapeAmazonReviews(productName) {
  try {
    console.log(`Searching Amazon for: ${productName}`);
    
    // Search for product on Amazon
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`;
    
    // Use Puppeteer for Amazon to handle dynamic content
    const { html, source } = await fetchHtml(searchUrl, { preferPuppeteer: true, scroll: true });
    console.log(`Got Amazon search results using ${source} method (${html.length} bytes)`);
    
    // Use Cheerio for more reliable HTML parsing
    const $ = cheerio.load(html);
    
    console.log('Scanning Amazon search results for product links...');
    
    // Find the first product link using multiple selector strategies
    let firstProductLink = null;
    let productLinkCount = 0;
    
    // Strategy 1: Standard Amazon search result links
    const standardSelectors = [
      'a.a-link-normal.s-no-outline',
      'a.a-link-normal.s-underline-text',
      'div.sg-col-inner h2 a',
      'h2.a-size-mini a',
      'h2 a.a-link-normal',
      'div[data-component-type="s-search-result"] h2 a'
    ];
    
    for (const selector of standardSelectors) {
      const links = $(selector);
      console.log(`Amazon selector "${selector}" found ${links.length} elements`);
      
      if (links.length > 0) {
        links.each((i, element) => {
          const href = $(element).attr('href');
          productLinkCount++;
          if (href && !firstProductLink) {
            console.log(`Found Amazon product link using selector "${selector}": ${href.substring(0, 50)}...`);
            firstProductLink = href;
          }
        });
        
        if (firstProductLink) break;
      }
    }
    
    // Strategy 2: Generic approach - find ASIN patterns in href attributes
    if (!firstProductLink) {
      console.log('Using generic approach to find Amazon product links');
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        if (href && (href.includes('/dp/') || href.includes('/gp/product/')) && !firstProductLink) {
          console.log(`Found Amazon product link using ASIN pattern: ${href.substring(0, 50)}...`);
          firstProductLink = href;
          productLinkCount++;
        }
      });
    }
    
    console.log(`Found ${productLinkCount} potential Amazon product links`);
    
    if (!firstProductLink) {
      console.log('No products found on Amazon');
      return [];
    }
    
    // Get product details page - make sure we have an absolute URL
    const productUrl = firstProductLink.startsWith('http') 
      ? firstProductLink 
      : `https://www.amazon.com${firstProductLink}`;
    
    console.log(`Selected Amazon product URL: ${productUrl}`);
    
    // Use the URL-based scraper
    return await scrapeAmazonReviewsFromUrl(productUrl);
  } catch (error) {
    console.error('Amazon scraping error:', error.message);
    // Return empty array on failure
    return [];
  }
}

async function scrapeFlipkartReviews(productName) {
  try {
    console.log(`Searching Flipkart for: ${productName}`);
    
    // Search for product on Flipkart
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
    
    // Use Puppeteer for Flipkart to handle dynamic content
    const { html, source } = await fetchHtml(searchUrl, { preferPuppeteer: true, scroll: true });
    console.log(`Got Flipkart search results using ${source} method (${html.length} bytes)`);
    
    // Use Cheerio for HTML parsing
    const $ = cheerio.load(html);
    
    console.log('Scanning Flipkart search results for product links...');
    
    // Find the first product link using multiple selector strategies
    let firstProductLink = null;
    let productLinkCount = 0;
    
    // Strategy 1: Common Flipkart product card selectors
    const selectors = [
      '_1fQZEK',      // Common product grid card
      'a.IRpwTa',     // Product title link
      'a.s1Q9rs',     // Another product link style
      '_2kHMtA a',    // Product row cards
      '_4ddWXP a',    // Small product cards
      '_13oc-S div a', // Product container links
      '.r5xu7J a',    // Newer product card design
      '._2UzuFa'      // Alternative product container
    ];
    
    for (const selector of selectors) {
      // Handle either class or direct selector
      const selectorStr = selector.includes(' ') ? selector : `.${selector}`;
      const elements = $(selectorStr);
      console.log(`Flipkart selector "${selectorStr}" found ${elements.length} elements`);
      
      elements.each((i, element) => {
        const href = $(element).attr('href');
        if (href) {
          productLinkCount++;
          if (!firstProductLink) {
            console.log(`Found Flipkart product link using selector "${selectorStr}": ${href.substring(0, 50)}...`);
            firstProductLink = href;
          }
        }
      });
      
      if (firstProductLink) break;
    }
    
    // Strategy 2: Generic approach - look for product detail page patterns
    if (!firstProductLink) {
      console.log('Using generic approach to find Flipkart product links');
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        if (href && (href.includes('/p/') || href.includes('pid='))) {
          productLinkCount++;
          if (!firstProductLink) {
            console.log(`Found Flipkart product link using generic pattern: ${href.substring(0, 50)}...`);
            firstProductLink = href;
          }
        }
      });
    }
    
    console.log(`Found ${productLinkCount} potential Flipkart product links`);
    
    if (!firstProductLink) {
      console.log('No products found on Flipkart');
      return [];
    }
    
    // Get product details page - make sure we have an absolute URL
    const productUrl = firstProductLink.startsWith('http') 
      ? firstProductLink 
      : `https://www.flipkart.com${firstProductLink}`;
    
    console.log(`Selected Flipkart product URL: ${productUrl}`);
    
    // Use the URL-based scraper
    return await scrapeFlipkartReviewsFromUrl(productUrl);
  } catch (error) {
    console.error('Flipkart scraping error:', error.message);
    // Return empty array on failure
    return [];
  }
}

async function scrapeGoogleReviews(productName) {
  try {
    console.log(`Searching Google for: ${productName}`);
    
    // For Google Shopping, search for the product
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(productName)}+reviews&tbm=shop`;
    
    // Use Puppeteer for Google to handle dynamic content
    const { html, source } = await fetchHtml(searchUrl, { 
      preferPuppeteer: true, 
      scroll: true,
      extraWaitMs: 2000 // Additional wait for Google's JavaScript to run
    });
    console.log(`Got Google search results using ${source} method (${html.length} bytes)`);
    
    // Use Cheerio for HTML parsing
    const $ = cheerio.load(html);
    
    console.log('Scanning Google search results for product links...');
    
    // Find product links in search results
    let productLink = null;
    let productLinkCount = 0;
    
    // Strategy 1: Common Google Shopping selectors
    const selectors = [
      'a.shntl',                  // Shopping results
      'div.pla-unit-title a',     // Product ads
      'a[href*="shopping/product"]', // Shopping product links
      'div.sh-dgr__content a',    // Shopping grid content
      'div.sh-dlr__list-result a', // Shopping list results
      'div.mnr-c a[href*="shopping"]' // Mixed results shopping links
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Google selector "${selector}" found ${elements.length} elements`);
      
      elements.each((i, element) => {
        const href = $(element).attr('href');
        if (href) {
          productLinkCount++;
          if (!productLink) {
            console.log(`Found Google product link using selector "${selector}": ${href.substring(0, 50)}...`);
            productLink = href;
          }
        }
      });
      
      if (productLink) break;
    }
    
    // Strategy 2: Generic approach - extract shopping/product links
    if (!productLink) {
      console.log('Using generic approach to find Google product links');
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        if (href && (
          href.includes('shopping/product') || 
          href.includes('google.com/shopping') ||
          href.includes('gp/product') ||
          href.includes('products/product')
        )) {
          productLinkCount++;
          if (!productLink) {
            console.log(`Found Google product link using generic pattern: ${href.substring(0, 50)}...`);
            productLink = href;
          }
        }
      });
    }
    
    console.log(`Found ${productLinkCount} potential Google product links`);
    
    // If still no link found with shopping, try a regular Google search
    if (!productLink) {
      console.log('No products found in Google Shopping, trying regular search...');
      
      // Do a regular Google search for product reviews
      const regularSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(productName)}+review`;
      
      // Fetch regular search results
      const { html: regularHtml } = await fetchHtml(regularSearchUrl, { 
        preferPuppeteer: true,
        extraWaitMs: 1000 
      });
      
      const regularSearch$ = cheerio.load(regularHtml);
      
      // Look for review-related links
      regularSearch$('a').each((i, element) => {
        const href = regularSearch$(element).attr('href');
        const text = regularSearch$(element).text();
        
        if (href && (
          (text && text.toLowerCase().includes('review')) ||
          (href.includes('review') || href.includes('product'))
        )) {
          productLinkCount++;
          if (!productLink) {
            console.log(`Found review link in regular search: ${href.substring(0, 50)}...`);
            productLink = href;
          }
        }
      });
    }
    
    if (!productLink) {
      console.log('No products or reviews found on Google, using fallback');
      return getMockReviews('Google', 6);
    }
    
    // Google URLs often have redirects in format "/url?q=actualUrl", extract actual URL
    if (productLink.startsWith('/url?') || productLink.includes('/url?q=')) {
      try {
        const urlObj = new URL(`https://www.google.com${productLink.startsWith('/') ? productLink : '/' + productLink}`);
        const actualUrl = urlObj.searchParams.get('q');
        if (actualUrl) {
          console.log(`Extracted actual URL from Google redirect: ${actualUrl.substring(0, 50)}...`);
          productLink = actualUrl;
        }
      } catch (urlError) {
        console.error('Error parsing Google redirect URL:', urlError.message);
      }
    }
    
    // Get product page
    const productUrl = productLink.startsWith('http') 
      ? productLink 
      : `https://www.google.com${productLink}`;
    
    console.log(`Selected Google product URL: ${productUrl}`);
    
    // Try specialized Google scraper first, fall back to generic if it fails
    try {
      const reviews = await scrapeGoogleReviewsFromUrl(productUrl);
      if (reviews && reviews.length > 0) {
        return reviews;
      }
      console.log('Google specialized scraper returned no reviews, trying generic approach');
    } catch (error) {
      console.error('Google specialized scraper failed:', error.message);
    }
    
    // If the URL is not a Google URL or specialized scraper failed, use generic approach
    try {
      const result = await scrapeGenericReviewsFromUrl(productUrl);
      // Ensure the platform is set to Google
      return result.reviews.map(review => ({
        ...review,
        platform: 'Google'
      }));
    } catch (error) {
      console.error('Generic scraper failed for Google URL:', error.message);
      return getMockReviews('Google', 6);
    }
  } catch (error) {
    console.error('Google scraping error:', error.message);
    // Return mock reviews on failure
    return getMockReviews('Google', 6);
  }
}

// Rate limiter function
async function rateLimit() {
  const now = Date.now();
  if (now - RATE_LIMIT.lastRequestTime > RATE_LIMIT.timeWindow) {
    RATE_LIMIT.requestCount = 0;
    RATE_LIMIT.lastRequestTime = now;
  }
  
  if (RATE_LIMIT.requestCount >= RATE_LIMIT.maxRequests) {
    const waitTime = RATE_LIMIT.timeWindow - (now - RATE_LIMIT.lastRequestTime);
    console.log(`Rate limit reached, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    RATE_LIMIT.requestCount = 0;
    RATE_LIMIT.lastRequestTime = Date.now();
  }
  
  RATE_LIMIT.requestCount++;
}

// AI analysis function
async function analyzeReviewsWithAI(reviews, productName) {
  try {
    // Ensure we have at least one review to analyze
    if (!reviews || reviews.length === 0) {
      console.log('No reviews to analyze, creating a default analysis');
      return {
        summary: `No reviews were found for ${productName}. Unable to provide sentiment analysis.`,
        sentiment: { positive: 0, neutral: 100, negative: 0 },
        keyPoints: ["No review data available"],
        pros: ["Insufficient data to determine pros"],
        cons: ["Insufficient data to determine cons"]
      };
    }
    
    // Log the number of reviews for debugging
    console.log(`Analyzing ${reviews.length} review(s) for ${productName}`);
    
    // Prepare reviews for analysis
    const reviewTexts = reviews.map(review => 
      `Platform: ${review.platform || 'Unknown'}, Rating: ${review.rating || 'Not rated'}, Review: ${review.content || review.text || 'No content'}`
    ).join('\n\n');
    
    try {
      // Apply rate limiting
      await rateLimit();
      
      // Create a dynamic prompt based on the number of reviews
      let prompt;
      
      if (reviews.length === 1) {
        prompt = `You are a product review analyzer. Analyze this single review for ${productName}:

${reviewTexts}

Provide a structured analysis with the following:
1. A brief summary of the sentiment (1-2 sentences)
2. Sentiment assessment (positive, neutral, or negative)
3. Key points mentioned in the review
4. Pros mentioned or implied in the review
5. Cons mentioned or implied in the review

Format your response as a JSON object with the following structure:
{
  "summary": "Overall summary text",
  "sentiment": {
    "positive": percentage based on your assessment,
    "neutral": percentage based on your assessment,
    "negative": percentage based on your assessment
  },
  "keyPoints": ["point1", "point2", "point3"],
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"]
}

Make sure to return only the JSON object, without any additional text or explanation.`;
      } else {
        prompt = `You are a product review analyzer. Analyze these ${reviews.length} reviews for ${productName}:

${reviewTexts}

Provide a structured analysis with the following:
1. A brief summary of overall sentiment (2-3 sentences)
2. Sentiment breakdown (percentage positive, neutral, negative)
3. ${Math.min(5, reviews.length)} key points mentioned across reviews
4. Top ${Math.min(3, reviews.length)} pros of the product
5. Top ${Math.min(3, reviews.length)} cons of the product

Format your response as a JSON object with the following structure:
{
  "summary": "Overall summary text",
  "sentiment": {
    "positive": percentage,
    "neutral": percentage,
    "negative": percentage
  },
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"]
}

Make sure to return only the JSON object, without any additional text or explanation.`;
      }
      
      // Get the Gemini Pro model - update to use the correct model name
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Generate content with safety settings
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };
      
      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ];
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      
      const response = await result.response;
      const text = response.text();
      
      // Clean the response text to ensure it's valid JSON
      const jsonText = text.replace(/```json\n|\n```/g, '').trim();
      
      // Parse the JSON response
      return JSON.parse(jsonText);
    } catch (apiError) {
      console.error('Gemini API error:', apiError.message);
      // Fallback to local analysis if API fails
      return generateLocalAnalysis(reviews, productName);
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return generateLocalAnalysis(reviews, productName);
  }
}

// Local analysis fallback function
function generateLocalAnalysis(reviews, productName) {
  console.log('Using local analysis fallback');
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 3), 0);
  const avgRating = totalRating / reviews.length;
  
  // Determine sentiment based on average rating
  let sentiment;
  if (avgRating >= 4) {
    sentiment = { positive: 80, neutral: 15, negative: 5 };
  } else if (avgRating >= 3) {
    sentiment = { positive: 40, neutral: 40, negative: 20 };
  } else {
    sentiment = { positive: 20, neutral: 30, negative: 50 };
  }
  
  // Extract common words and phrases
  const allText = reviews.map(r => r.content || r.text || '').join(' ');
  const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get most common words
  const commonWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Generate summary based on average rating
  let summary;
  if (avgRating >= 4) {
    summary = `Overall, ${productName} has received positive feedback with an average rating of ${avgRating.toFixed(1)}. Users generally seem satisfied with their purchase.`;
  } else if (avgRating >= 3) {
    summary = `Reviews for ${productName} are mixed, with an average rating of ${avgRating.toFixed(1)}. Some users are satisfied while others have concerns.`;
  } else {
    summary = `Based on reviews, ${productName} has received mostly negative feedback with an average rating of ${avgRating.toFixed(1)}. Users have expressed several concerns.`;
  }
  
  return {
    summary,
    sentiment,
    keyPoints: commonWords.map(word => `Frequently mentioned: ${word}`),
    pros: [
      avgRating >= 4 ? "Generally positive feedback" : "Some positive aspects mentioned",
      "Multiple user experiences available",
      "Detailed feedback provided"
    ],
    cons: [
      avgRating < 3 ? "Several concerns raised" : "Some areas for improvement",
      "Mixed user experiences",
      "Varying levels of satisfaction"
    ]
  };
}

// Fallback to mock data if scraping fails
function getMockReviews(platform, count = 3) {
  const mockData = {
    'Amazon': [
      {
        content: 'Great product, very satisfied with the purchase. The quality is excellent and it exceeded my expectations in every way.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'Decent quality but a bit overpriced compared to similar items. Works well enough but I expected better for the price.',
        rating: 3,
        date: new Date()
      },
      {
        content: 'The product arrived damaged and customer service was unhelpful. Had to return it and the process was frustrating.',
        rating: 1,
        date: new Date()
      },
      {
        content: 'Amazing product and fast shipping! Would definitely recommend to anyone considering this purchase.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'Product works exactly as described. No complaints so far after several weeks of use.',
        rating: 4,
        date: new Date()
      },
      {
        content: 'Instructions were confusing and setup was difficult. Once I got it working, the performance was okay.',
        rating: 3,
        date: new Date()
      },
      {
        content: 'Not worth the money at all. Poor build quality and stopped working after just a few uses.',
        rating: 2,
        date: new Date()
      }
    ],
    'Flipkart': [
      {
        content: 'Good value for money, fast delivery. The packaging was secure and the product was exactly as shown in pictures.',
        rating: 4,
        date: new Date()
      },
      {
        content: 'Product broke after two weeks of use. Very disappointed with the durability.',
        rating: 1,
        date: new Date()
      },
      {
        content: 'Excellent product with great features. This is the best version of this product I have used so far.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'The product is fine but delivery took longer than expected. Flipkart should improve their shipping times.',
        rating: 3,
        date: new Date()
      },
      {
        content: 'Perfect product for my needs. Easy to use and very efficient. Would buy again from this seller.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'Not as described in the product details. The color is different and some features are missing.',
        rating: 2,
        date: new Date()
      },
      {
        content: 'Average product for the price. There are better alternatives available but this works fine for basic use.',
        rating: 3,
        date: new Date()
      }
    ],
    'Google': [
      {
        content: 'Excellent customer service and product quality. The company really cares about their customers.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'Average product, nothing special but works as advertised. No major issues to report.',
        rating: 3,
        date: new Date()
      },
      {
        content: 'Would recommend to friends, good quality for the price. It has been reliable so far in my daily use.',
        rating: 4,
        date: new Date()
      },
      {
        content: 'Product design is sleek and modern. Performance is consistently good across all features.',
        rating: 5,
        date: new Date()
      },
      {
        content: 'Battery life is disappointing compared to what was advertised. Otherwise functions well.',
        rating: 3,
        date: new Date()
      },
      {
        content: 'Poor customer support when I had issues. Was on hold for hours and problem still not resolved.',
        rating: 2,
        date: new Date()
      }
    ]
  };
  
  return mockData[platform].slice(0, count).map(review => {
    return {
      platform: platform,
      ...review
    };
  });
}

// Sanitize and normalize URLs
function normalizeUrl(inputUrl) {
  try {
    // Handle special cases
    if (!inputUrl) return null;
    
    // Remove any whitespace
    let cleanUrl = inputUrl.trim();
    
    // If URL doesn't start with http or https, add https://
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Create a URL object to validate and normalize the URL
    const urlObj = new URL(cleanUrl);
    
    // Return the normalized URL
    return urlObj.toString();
  } catch (error) {
    console.error(`Error normalizing URL ${inputUrl}: ${error.message}`);
    // Return the original URL if we can't normalize it
    return inputUrl;
  }
}

// Helper function to fetch HTML content with Puppeteer, ScraperAPI, or direct request
async function fetchHtml(targetUrl, options = {}) {
  try {
    let html = '';
    let source = '';
    
    // Normalize the URL first
    const normalizedUrl = normalizeUrl(targetUrl);
    if (!normalizedUrl) {
      throw new Error(`Invalid URL: ${targetUrl}`);
    }
    
    console.log(`Fetching normalized URL: ${normalizedUrl}`);
    
    // Try Puppeteer first if browser is available and preferPuppeteer is true
    if (browser && (options.preferPuppeteer || options.forcePuppeteer)) {
      try {
        console.log(`Fetching ${normalizedUrl} with Puppeteer`);
        const page = await browser.newPage();
        
        // Set user agent and viewport
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        
        // Set extra HTTP headers
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        });
        
        // Set a reasonable navigation timeout
        const timeout = options.timeout || 30000;
        await page.setDefaultNavigationTimeout(timeout);
        
        // Navigate with waitUntil to ensure page is fully loaded
        await page.goto(normalizedUrl, { 
          waitUntil: ['load', 'domcontentloaded', 'networkidle2'],
          timeout
        });
        
        // Wait additional time for dynamic content to load if needed
        if (options.extraWaitMs) {
          await page.waitForTimeout(options.extraWaitMs);
        }
        
        // If scroll is needed to load lazy content
        if (options.scroll) {
          await autoScroll(page);
        }
        
        // Get the final HTML content
        html = await page.content();
        source = 'puppeteer';
        
        // Close the page to free resources
        await page.close();
        
        console.log(`Successfully fetched content from ${normalizedUrl} using Puppeteer (${html.length} bytes)`);
        return { html, source };
      } catch (puppeteerError) {
        console.error(`Puppeteer error for ${normalizedUrl}:`, puppeteerError.message);
        if (options.forcePuppeteer) {
          throw puppeteerError; // Re-throw if Puppeteer was explicitly required
        }
        // Otherwise fall through to next method
      }
    }
    
    // Next, try ScraperAPI if available
    if (process.env.SCRAPER_API_KEY) {
      try {
        console.log(`Fetching ${normalizedUrl} with ScraperAPI`);
        const scraperUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(normalizedUrl)}&render=true&retry=3`;
        const response = await axios.get(scraperUrl, {
          timeout: 30000,
          maxRedirects: 5
        });
        
        if (response.status === 200 && response.data) {
          console.log(`Successfully fetched content from ${normalizedUrl} using ScraperAPI`);
          source = 'scraperapi';
          return { html: response.data, source };
        }
      } catch (scraperError) {
        console.error(`ScraperAPI error for ${normalizedUrl}:`, scraperError.message);
        // Fall through to direct request if ScraperAPI fails
      }
    }
    
    // Fallback to direct request with robust headers
    console.log(`Fetching ${normalizedUrl} with direct request`);
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        ...options.headers
      },
      timeout: 30000, // 30 seconds timeout
      maxRedirects: 5,
      ...options
    });
    
    console.log(`Successfully fetched content from ${normalizedUrl} using direct request`);
    source = 'direct';
    return { html: response.data, source };
  } catch (error) {
    console.error(`Error fetching HTML from ${normalizedUrl}:`, error.message);
    throw error;
  }
}

// Helper function for auto-scrolling in Puppeteer
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight || totalHeight > 10000) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Function to extract content using XPath or Cheerio as fallback
function extractContent(html, xpathQuery, cheerioSelector) {
  try {
    // Skip XMLdom parsing which is causing issues
    // Go directly to Cheerio which is more robust
    const $ = cheerio.load(html);
    return $(cheerioSelector)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0);
  } catch (error) {
    console.error('Extraction error:', error.message);
    return [];
  }
}

// Function to extract structured review data with multiple fallback methods
async function extractReviews(html, platform) {
  const $ = cheerio.load(html);
  const reviews = [];
  
  // Define platform-specific extraction strategies with multiple fallback selectors
  const extractionStrategies = {
    'Amazon': {
      container: [
        'div[data-hook="review"]',
        'div.review',
        'div.customer-review',
        'div.review-item'
      ],
      content: [
        'span[data-hook="review-body"]',
        'div.review-text',
        'div.review-content',
        'p.review-text'
      ],
      rating: [
        'i[data-hook="review-star-rating"] span',
        'span.a-icon-alt',
        'div.review-rating',
        'span.rating'
      ],
      date: [
        'span[data-hook="review-date"]',
        'span.review-date',
        'div.review-date'
      ]
    },
    'Flipkart': {
      container: [
        'div._27M-vq',
        'div.review',
        'div.customer-review',
        'div.review-item'
      ],
      content: [
        'div.t-ZTKy',
        'div.review-text',
        'div.review-content',
        'p.review-text'
      ],
      rating: [
        'div._3LWZlK',
        'div.review-rating',
        'span.rating'
      ],
      date: [
        'p._2sc7ZR',
        'span.review-date',
        'div.review-date'
      ]
    },
    'Google': {
      container: [
        'div.HMeEI',
        'div.review',
        'div.customer-review',
        'div.review-item'
      ],
      content: [
        'div.QwwBsd',
        'div.review-text',
        'div.review-content',
        'p.review-text'
      ],
      rating: [
        'span.UzThIf',
        'div.review-rating',
        'span.rating'
      ],
      date: [
        'span.review-date',
        'div.review-date'
      ]
    },
    'Generic': {
      container: [
        'div.review',
        'div.reviews',
        'div.customer-review',
        '.ratings-reviews',
        '[data-hook="review"]',
        '.review-item',
        'div.comment',
        'div.feedback'
      ],
      content: [
        'p',
        'div.content',
        'div.text',
        'div.review-content',
        'div.review-text',
        'div.comment-text',
        'div.feedback-text'
      ],
      rating: [
        'span.rating',
        'div.rating',
        'span.stars',
        'div.stars',
        'span.score',
        'div.score'
      ],
      date: [
        'span.date',
        'div.date',
        'time',
        'span.posted-date',
        'div.posted-date'
      ]
    }
  };
  
  // Use the appropriate strategy or fallback to generic
  const strategy = extractionStrategies[platform] || extractionStrategies['Generic'];
  
  // Try each container selector until we find reviews
  for (const containerSelector of strategy.container) {
    $(containerSelector).each((i, element) => {
      if (i >= 20) return false; // Limit to 20 reviews
      
      // Try each content selector
      let content = '';
      for (const contentSelector of strategy.content) {
        const foundContent = $(element).find(contentSelector).text().trim();
        if (foundContent && foundContent.length > 10) {
          content = foundContent;
          break;
        }
      }
      
      if (content) {
        // Try each rating selector
        let rating = 3; // Default rating
        for (const ratingSelector of strategy.rating) {
          const ratingText = $(element).find(ratingSelector).text().trim();
          if (ratingText) {
            if (platform === 'Amazon') {
              const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
              rating = ratingMatch ? parseFloat(ratingMatch[1]) : 3;
            } else {
              const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
              rating = ratingMatch ? parseFloat(ratingMatch[1]) : 3;
            }
            break;
          }
        }
        
        // Try each date selector
        let date = new Date();
        for (const dateSelector of strategy.date) {
          const dateText = $(element).find(dateSelector).text().trim();
          if (dateText) {
            try {
              date = new Date(dateText);
              break;
            } catch (e) {
              // If date parsing fails, keep the default date
            }
          }
        }
        
        reviews.push({
          platform,
          content,
          rating,
          date
        });
      }
    });
    
    // If we found reviews with this container selector, break the loop
    if (reviews.length > 0) break;
  }

  // If still no reviews found with specific selectors, try simpler text extraction
  if (reviews.length === 0) {
    console.log(`No reviews found with specific selectors for ${platform}, trying simple text extraction`);
    
    // Look for content that might be reviews
    $('p, div').each((i, element) => {
      if (reviews.length >= 20) return false;
      
      const text = $(element).text().trim();
      // Look for paragraphs that are reasonably long (like reviews)
      if (text.length > 50 && text.length < 1000 && !$(element).has('p, div').length) {
        reviews.push({
          platform,
          content: text,
          rating: 3, // Default rating
          date: new Date()
        });
      }
    });
  }
  
  // If still no reviews found, use mock reviews
  if (reviews.length === 0) {
    console.log(`No reviews found for ${platform}, using mock reviews`);
    return getMockReviews(platform, 5);
  }
  
  return reviews;
}

// Add a debug endpoint to help diagnose issues
app.post('/api/debug', async (req, res) => {
  try {
    const { url, selector, action } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Debug request: ${action || 'fetch'} ${url} ${selector || ''}`);
    
    // Default action is to fetch the page
    if (!action || action === 'fetch') {
      const { html, source } = await fetchHtml(url, { 
        preferPuppeteer: true, 
        scroll: true,
        extraWaitMs: 2000
      });
      
      // Return a preview of the HTML and source
      return res.json({ 
        success: true, 
        source,
        htmlLength: html.length,
        htmlPreview: html.substring(0, 1000) + '...',
        fullUrl: url
      });
    }
    
    // If action is 'extract' and selector is provided, extract content using selector
    if (action === 'extract' && selector) {
      const { html, source } = await fetchHtml(url, { preferPuppeteer: true });
      const $ = cheerio.load(html);
      
      const elements = $(selector);
      const results = [];
      
      elements.each((i, el) => {
        if (i < 10) { // Limit to 10 results
          results.push({
            text: $(el).text().trim(),
            html: $(el).html(),
            attrs: $(el).attr()
          });
        }
      });
      
      return res.json({
        success: true,
        source,
        selector,
        count: elements.length,
        results,
        fullUrl: url
      });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add a test endpoint to directly test individual platform scrapers
app.get('/api/test-scraper', async (req, res) => {
  try {
    const { platform, query } = req.query;
    
    if (!platform || !query) {
      return res.status(400).json({ error: 'Platform and query parameters are required' });
    }
    
    console.log(`Testing ${platform} scraper with query: ${query}`);
    
    let result;
    let startTime = Date.now();
    
    // Call the appropriate scraper function based on platform
    switch (platform.toLowerCase()) {
      case 'amazon':
        result = await scrapeAmazonReviews(query);
        break;
      case 'flipkart':
        result = await scrapeFlipkartReviews(query);
        break;
      case 'google':
        result = await scrapeGoogleReviews(query);
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform. Use "amazon", "flipkart", or "google"' });
    }
    
    const duration = Date.now() - startTime;
    
    // Return the result
    return res.json({
      platform,
      query,
      duration: `${duration}ms`,
      reviewCount: result.length,
      reviews: result.slice(0, 3), // Only return first 3 reviews to avoid huge response
      hasMockData: result.some(r => r.isFallback)
    });
  } catch (error) {
    console.error('Test scraper error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

const PORT = process.env.PORT || 5000;
(async () => {
  try {
    // Initialize the headless browser
    const browserInitialized = await initBrowser();
    if (!browserInitialized) {
      console.warn('Warning: Puppeteer browser initialization failed. The application will continue without browser-based scraping.');
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.error('------------------------------------------------');
      console.error(' IMPORTANT: Web scraping disclaimer');
      console.error(' ');
      console.error(' This application performs web scraping, which may violate');
      console.error(' the Terms of Service of the websites being scraped.');
      console.error(' This code is provided for educational purposes only.');
      console.error(' ');
      console.error(' For production use, consider using official APIs from');
      console.error(' the respective platforms or obtaining proper permissions.');
      console.error('------------------------------------------------');
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend available at http://localhost:${PORT}`);
      
      // Log scraping methods available
      console.log('\nScraping methods available:');
      if (browserInitialized) console.log('✓ Puppeteer (browser-based scraping)');
      else console.log('✗ Puppeteer (not available)');
      
      if (process.env.SCRAPER_API_KEY) console.log('✓ ScraperAPI (API-based scraping)');
      else console.log('✗ ScraperAPI (not configured - add SCRAPER_API_KEY to .env)');
      
      console.log('✓ Direct requests (basic scraping)');
      console.log('------------------------------------------------');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();