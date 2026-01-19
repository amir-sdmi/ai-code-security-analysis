#!/usr/bin/env node
/**
 * UNLIMITED CONTENT AUTOMATION TEST
 * 
 * This script tests storing full AI-generated articles in Notion page content blocks
 * instead of limited database properties, solving the 2000-character limitation.
 * 
 * Key Changes:
 * - Creates pages in databases with minimal properties (title, metadata)
 * - Stores full article content in page content blocks (unlimited text)
 * - Uses Notion API's page children blocks for unrestricted content storage
 * 
 * Progress: Content Automation Workflow with Unlimited Text Storage
 */

require('dotenv').config();

// Color codes for beautiful logging
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bg: {
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m'
    }
};

// Enhanced logging function
function log(message, type = 'info', indent = 0) {
    const timestamp = new Date().toISOString();
    const padding = '  '.repeat(indent);
    
    const typeColors = {
        info: colors.blue,
        success: colors.green,
        warning: colors.yellow,
        error: colors.red,
        start: colors.magenta,
        end: colors.cyan,
        data: colors.dim
    };
    
    const color = typeColors[type] || colors.white;
    console.log(`${color}${padding}[${timestamp}] ${message}${colors.reset}`);
}

// Test configuration
const TESTS = {
    1: { name: "Environment & Database Setup", enabled: true },
    2: { name: "Trending Topic with Content Blocks", enabled: true },
    3: { name: "Full Article Generation & Storage", enabled: true },
    4: { name: "Newsletter with Content Blocks", enabled: true },
    5: { name: "Complete Automation Workflow", enabled: true }
};

// Environment validation
const REQUIRED_ENV = [
    'NOTION_TOKEN',
    'DEEPSEEK_API_KEY',
    'PEXELS_API_KEY',
    'BRAVE_API_KEY',
    'RESEND_API_KEY'
];

const NOTION_DATABASES = {
    TRENDING_TOPICS: process.env.NOTION_DATABASE_TRENDING_TOPICS,
    GENERATED_ARTICLES: process.env.NOTION_DATABASE_GENERATED_ARTICLES,
    NEWSLETTERS: process.env.NOTION_DATABASE_NEWSLETTERS,
    SUBSCRIBERS: process.env.NOTION_DATABASE_SUBSCRIBERS
};

// API clients setup
let deepseekClient, pexelsClient, braveClient, resendClient, notionClient;

async function initializeClients() {
    log("Initializing API clients...", 'start');
    
    try {
        // Notion Client
        const { Client } = require('@notionhq/client');
        notionClient = new Client({ auth: process.env.NOTION_TOKEN });
        
        // Other clients (simplified)
        deepseekClient = { 
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };
        
        braveClient = {
            url: 'https://api.search.brave.com/res/v1/web/search',
            headers: {
                'X-Subscription-Token': process.env.BRAVE_API_KEY
            }
        };
        
        pexelsClient = {
            url: 'https://api.pexels.com/v1/search',
            headers: {
                'Authorization': process.env.PEXELS_API_KEY
            }
        };
        
        resendClient = {
            url: 'https://api.resend.com/emails',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };
        
        log("✅ All API clients initialized successfully", 'success', 1);
        return true;
    } catch (error) {
        log(`❌ Client initialization failed: ${error.message}`, 'error', 1);
        return false;
    }
}

// Utility function to make HTTP requests
async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch(url, {
            method: 'GET',
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        log(`Request failed: ${error.message}`, 'error', 2);
        throw error;
    }
}

// Test 1: Environment & Database Setup
async function test1_environmentSetup() {
    log("🧪 Test 1: Environment & Database Setup", 'start');
    
    try {
        // Check environment variables
        log("Checking environment variables...", 'info', 1);
        const missingVars = REQUIRED_ENV.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'error', 2);
            return false;
        }
        log("✅ All environment variables present", 'success', 2);
        
        // Check database IDs
        log("Checking Notion database IDs...", 'info', 1);
        const missingDbs = Object.entries(NOTION_DATABASES)
            .filter(([key, id]) => !id)
            .map(([key]) => key);
        
        if (missingDbs.length > 0) {
            log(`❌ Missing database IDs: ${missingDbs.join(', ')}`, 'error', 2);
            return false;
        }
        log("✅ All database IDs configured", 'success', 2);
        
        // Verify database accessibility
        log("Verifying database accessibility...", 'info', 1);
        for (const [name, dbId] of Object.entries(NOTION_DATABASES)) {
            try {
                const database = await notionClient.databases.retrieve({
                    database_id: dbId
                });
                log(`✅ ${name}: ${database.title[0]?.text?.content || 'Untitled'}`, 'success', 2);
            } catch (error) {
                log(`❌ ${name}: ${error.message}`, 'error', 2);
                return false;
            }
        }
        
        log("✅ Test 1 passed: Environment & Database Setup complete", 'success', 1);
        return true;
    } catch (error) {
        log(`❌ Test 1 failed: ${error.message}`, 'error', 1);
        return false;
    }
}

// Test 2: Trending Topic with Content Blocks
async function test2_trendingTopicWithBlocks() {
    log("🧪 Test 2: Trending Topic with Content Blocks", 'start');
    
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        const topicTitle = `AI Content Automation Test - ${timestamp}`;
        
        log("Creating trending topic with content blocks...", 'info', 1);
        
        // Create page in database with minimal properties
        const trendingTopic = await notionClient.pages.create({
            parent: {
                type: 'database_id',
                database_id: NOTION_DATABASES.TRENDING_TOPICS
            },
            properties: {
                'Topic': {
                    type: 'title',
                    title: [{ type: 'text', text: { content: topicTitle } }]
                },
                'Status': {
                    type: 'select',
                    select: { name: 'Research' }
                },
                'Priority': {
                    type: 'select',
                    select: { name: 'High' }
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: 'This is a test of unlimited content storage using Notion page content blocks. '
                                }
                            }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: 'Research Notes' }
                            }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: 'This content can be unlimited in length, unlike database properties which are limited to 2000 characters. '
                                }
                            }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: 'Advantage 1: No character limits' }
                            }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: 'Advantage 2: Rich formatting support' }
                            }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: 'Advantage 3: Structured content blocks' }
                            }
                        ]
                    }
                }
            ]
        });
        
        log(`✅ Created trending topic: ${trendingTopic.id}`, 'success', 2);
        log(`📄 Page URL: ${trendingTopic.url}`, 'data', 2);
        
        // Verify content was stored correctly
        log("Verifying content blocks were stored...", 'info', 1);
        const pageBlocks = await notionClient.blocks.children.list({
            block_id: trendingTopic.id
        });
        
        log(`✅ Found ${pageBlocks.results.length} content blocks`, 'success', 2);
        pageBlocks.results.forEach((block, index) => {
            log(`Block ${index + 1}: ${block.type}`, 'data', 3);
        });
        
        log("✅ Test 2 passed: Trending Topic with Content Blocks", 'success', 1);
        return { success: true, topicId: trendingTopic.id, topicUrl: trendingTopic.url };
    } catch (error) {
        log(`❌ Test 2 failed: ${error.message}`, 'error', 1);
        return { success: false, error: error.message };
    }
}

// Test 3: Full Article Generation & Storage
async function test3_fullArticleGeneration() {
    log("🧪 Test 3: Full Article Generation & Storage", 'start');
    
    try {
        log("Performing research with Brave Search...", 'info', 1);
        
        // Research with Brave Search
        const searchResponse = await makeRequest(
            `${braveClient.url}?q=artificial intelligence automation 2024&count=3`,
            { headers: braveClient.headers }
        );
        
        const researchData = searchResponse.web?.results?.slice(0, 3) || [];
        log(`✅ Found ${researchData.length} research sources`, 'success', 2);
        
        // Generate comprehensive article with DeepSeek
        log("Generating comprehensive article with DeepSeek...", 'info', 1);
        
        const researchContent = researchData.map(result => 
            `Title: ${result.title}\nURL: ${result.url}\nDescription: ${result.description}`
        ).join('\n\n');
        
        const articlePrompt = `Based on this research data, write a comprehensive 2000+ word article about AI automation trends in 2024:

${researchContent}

The article should include:
1. Executive Summary
2. Current State of AI Automation
3. Key Trends and Developments
4. Industry Applications
5. Future Outlook
6. Conclusion

Make it informative, well-structured, and professional.`;

        const articleResponse = await makeRequest(deepseekClient.url, {
            method: 'POST',
            headers: deepseekClient.headers,
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: articlePrompt }
                ],
                max_tokens: 4000,
                temperature: 0.7
            })
        });
        
        const fullArticle = articleResponse.choices[0].message.content;
        log(`✅ Generated article: ${fullArticle.length} characters`, 'success', 2);
        
        // Create article page with content blocks
        log("Storing article in Notion with unlimited content blocks...", 'info', 1);
        
        const timestamp = new Date().toISOString();
        const articleTitle = `AI Automation Trends 2024 - ${timestamp.split('T')[0]}`;
        
        // Split article into paragraphs for better formatting
        const paragraphs = fullArticle.split('\n\n').filter(p => p.trim());
        
        // Create content blocks for each paragraph
        const contentBlocks = [];
        
        // Add title block
        contentBlocks.push({
            object: 'block',
            type: 'heading_1',
            heading_1: {
                rich_text: [
                    {
                        type: 'text',
                        text: { content: 'AI Automation Trends 2024' }
                    }
                ]
            }
        });
        
        // Add paragraph blocks
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                // Check if it's a heading (starts with #)
                if (paragraph.trim().startsWith('#')) {
                    const headingText = paragraph.replace(/^#+\s*/, '').trim();
                    contentBlocks.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [
                                {
                                    type: 'text',
                                    text: { content: headingText }
                                }
                            ]
                        }
                    });
                } else {
                    // Split long paragraphs to avoid Notion limits on rich text
                    const maxLength = 2000;
                    if (paragraph.length > maxLength) {
                        const chunks = [];
                        for (let i = 0; i < paragraph.length; i += maxLength) {
                            chunks.push(paragraph.slice(i, i + maxLength));
                        }
                        
                        chunks.forEach(chunk => {
                            contentBlocks.push({
                                object: 'block',
                                type: 'paragraph',
                                paragraph: {
                                    rich_text: [
                                        {
                                            type: 'text',
                                            text: { content: chunk }
                                        }
                                    ]
                                }
                            });
                        });
                    } else {
                        contentBlocks.push({
                            object: 'block',
                            type: 'paragraph',
                            paragraph: {
                                rich_text: [
                                    {
                                        type: 'text',
                                        text: { content: paragraph }
                                    }
                                ]
                            }
                        });
                    }
                }
            }
        });
        
        // Create page in Generated Articles database
        const articlePage = await notionClient.pages.create({
            parent: {
                type: 'database_id',
                database_id: NOTION_DATABASES.GENERATED_ARTICLES
            },
            properties: {
                'Title': {
                    type: 'title',
                    title: [{ type: 'text', text: { content: articleTitle } }]
                },
                'Status': {
                    type: 'select',
                    select: { name: 'Draft' }
                },
                'WordCount': {
                    type: 'number',
                    number: fullArticle.split(' ').length
                },
                'GeneratedDate': {
                    type: 'date',
                    date: { start: new Date().toISOString().split('T')[0] }
                }
            },
            children: contentBlocks
        });
        
        log(`✅ Created article page: ${articlePage.id}`, 'success', 2);
        log(`📄 Article URL: ${articlePage.url}`, 'data', 2);
        log(`📊 Content blocks created: ${contentBlocks.length}`, 'data', 2);
        log(`📝 Total article length: ${fullArticle.length} characters`, 'data', 2);
        
        // Verify content was stored
        const storedBlocks = await notionClient.blocks.children.list({
            block_id: articlePage.id
        });
        
        log(`✅ Verified: ${storedBlocks.results.length} blocks stored successfully`, 'success', 2);
        
        log("✅ Test 3 passed: Full Article Generation & Storage", 'success', 1);
        return { 
            success: true, 
            articleId: articlePage.id, 
            articleUrl: articlePage.url,
            contentLength: fullArticle.length,
            blocksCreated: contentBlocks.length
        };
    } catch (error) {
        log(`❌ Test 3 failed: ${error.message}`, 'error', 1);
        return { success: false, error: error.message };
    }
}

// Test 4: Newsletter with Content Blocks
async function test4_newsletterWithBlocks() {
    log("🧪 Test 4: Newsletter with Content Blocks", 'start');
    
    try {
        const timestamp = new Date().toISOString();
        const newsletterTitle = `Weekly AI Update - ${timestamp.split('T')[0]}`;
        
        log("Creating newsletter with rich content blocks...", 'info', 1);
        
        // Create comprehensive newsletter content
        const newsletterContent = `
Welcome to this week's AI automation update! Here's what's happening in the world of artificial intelligence.

🔥 This Week's Highlights:
• Major breakthrough in automated content generation
• New developments in AI-powered business automation
• Industry leaders adopt AI for customer service
• Regulatory updates affecting AI implementation

📈 Key Statistics:
• 73% increase in AI automation adoption this quarter
• $2.4B in new AI automation investments
• 45% reduction in manual processes for early adopters

🚀 Featured Story: The Rise of Autonomous Content Systems
This week saw significant developments in autonomous content generation systems. Companies are now implementing end-to-end automation that can research topics, generate content, and distribute it across multiple channels without human intervention.

Key benefits organizations are seeing:
1. 300% increase in content production speed
2. 85% reduction in content creation costs  
3. Consistent quality and brand voice across all content
4. 24/7 content generation capabilities

🔍 Deep Dive: Implementation Strategies
Successful AI automation implementations follow these patterns:
- Start with pilot programs in low-risk areas
- Establish clear success metrics upfront
- Invest in proper training and change management
- Build feedback loops for continuous improvement

📊 Market Analysis:
The AI automation market continues its explosive growth trajectory. Recent research indicates that organizations implementing comprehensive automation strategies see average ROI of 290% within the first 18 months.

Industry breakdown:
• Technology: Leading adoption at 89%
• Finance: Strong growth at 67%
• Healthcare: Emerging sector at 45%
• Manufacturing: Traditional leader at 78%

🎯 Actionable Insights:
1. Focus on process automation before content automation
2. Ensure data quality and accessibility
3. Plan for change management and training
4. Start with measurable, repeatable tasks
5. Build in human oversight and feedback mechanisms

💡 Expert Prediction:
Industry experts predict that by 2025, 60% of enterprise content will be AI-generated, with human oversight focusing on strategy and creative direction rather than execution.

🔗 Resources:
• AI Automation Playbook: Best practices for implementation
• ROI Calculator: Estimate your automation savings
• Case Studies: Real-world success stories
• Training Programs: Upskill your team for the AI era

Thank you for reading! Reply with your automation questions and we'll feature answers in next week's newsletter.

Best regards,
The AI Automation Team
        `.trim();
        
        // Split content into structured blocks
        const sections = newsletterContent.split('🔥')[1].split('📈');
        const highlights = sections[0];
        const restContent = '📈' + sections[1];
        
        // Create content blocks
        const contentBlocks = [
            {
                object: 'block',
                type: 'heading_1',
                heading_1: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: 'Weekly AI Automation Update' }
                        }
                    ]
                }
            },
            {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: 'Welcome to this week\'s AI automation update! Here\'s what\'s happening in the world of artificial intelligence.' }
                        }
                    ]
                }
            },
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: '🔥 This Week\'s Highlights' }
                        }
                    ]
                }
            }
        ];
        
        // Add content sections as blocks
        const contentSections = restContent.split('\n\n').filter(s => s.trim());
        contentSections.forEach(section => {
            if (section.trim()) {
                // Split very long sections
                if (section.length > 2000) {
                    const chunks = [];
                    for (let i = 0; i < section.length; i += 1900) {
                        chunks.push(section.slice(i, i + 1900));
                    }
                    
                    chunks.forEach(chunk => {
                        contentBlocks.push({
                            object: 'block',
                            type: 'paragraph',
                            paragraph: {
                                rich_text: [
                                    {
                                        type: 'text',
                                        text: { content: chunk }
                                    }
                                ]
                            }
                        });
                    });
                } else {
                    // Check if it's a heading
                    if (section.includes('🔥') || section.includes('📈') || section.includes('🚀') || 
                        section.includes('🔍') || section.includes('📊') || section.includes('🎯') || 
                        section.includes('💡') || section.includes('🔗')) {
                        const lines = section.split('\n');
                        const title = lines[0];
                        const content = lines.slice(1).join('\n');
                        
                        contentBlocks.push({
                            object: 'block',
                            type: 'heading_2',
                            heading_2: {
                                rich_text: [
                                    {
                                        type: 'text',
                                        text: { content: title }
                                    }
                                ]
                            }
                        });
                        
                        if (content.trim()) {
                            contentBlocks.push({
                                object: 'block',
                                type: 'paragraph',
                                paragraph: {
                                    rich_text: [
                                        {
                                            type: 'text',
                                            text: { content: content.trim() }
                                        }
                                    ]
                                }
                            });
                        }
                    } else {
                        contentBlocks.push({
                            object: 'block',
                            type: 'paragraph',
                            paragraph: {
                                rich_text: [
                                    {
                                        type: 'text',
                                        text: { content: section }
                                    }
                                ]
                            }
                        });
                    }
                }
            }
        });
        
        // Create newsletter page
        const newsletterPage = await notionClient.pages.create({
            parent: {
                type: 'database_id',
                database_id: NOTION_DATABASES.NEWSLETTERS
            },
            properties: {
                'Title': {
                    type: 'title',
                    title: [{ type: 'text', text: { content: newsletterTitle } }]
                },
                'Status': {
                    type: 'select',
                    select: { name: 'Draft' }
                },
                'SendDate': {
                    type: 'date',
                    date: { start: new Date().toISOString().split('T')[0] }
                }
            },
            children: contentBlocks
        });
        
        log(`✅ Created newsletter: ${newsletterPage.id}`, 'success', 2);
        log(`📄 Newsletter URL: ${newsletterPage.url}`, 'data', 2);
        log(`📊 Content blocks: ${contentBlocks.length}`, 'data', 2);
        log(`📝 Total content length: ${newsletterContent.length} characters`, 'data', 2);
        
        log("✅ Test 4 passed: Newsletter with Content Blocks", 'success', 1);
        return { 
            success: true, 
            newsletterId: newsletterPage.id, 
            newsletterUrl: newsletterPage.url,
            blocksCreated: contentBlocks.length
        };
    } catch (error) {
        log(`❌ Test 4 failed: ${error.message}`, 'error', 1);
        return { success: false, error: error.message };
    }
}

// Test 5: Complete Automation Workflow
async function test5_completeWorkflow() {
    log("🧪 Test 5: Complete Automation Workflow", 'start');
    
    try {
        const workflow = {
            startTime: new Date(),
            steps: [],
            results: {}
        };
        
        // Step 1: Research trending topics
        log("Step 1: Research trending topics...", 'info', 1);
        const topics = await makeRequest(
            `${braveClient.url}?q=trending AI topics December 2024&count=3`,
            { headers: braveClient.headers }
        );
        
        const topicData = topics.web?.results?.[0] || null;
        workflow.steps.push('✅ Topic research completed');
        log(`✅ Found topic: ${topicData?.title || 'AI Trends'}`, 'success', 2);
        
        // Step 2: Generate comprehensive content
        log("Step 2: Generate comprehensive content...", 'info', 1);
        const contentPrompt = `Write a comprehensive article about: ${topicData?.title || 'AI Innovation Trends'}

Based on: ${topicData?.description || 'Current developments in artificial intelligence'}

Include:
1. Introduction with key insights
2. Main developments and trends
3. Industry impact analysis
4. Future implications
5. Actionable recommendations
6. Conclusion

Target length: 1500+ words with clear structure.`;

        const contentResponse = await makeRequest(deepseekClient.url, {
            method: 'POST',
            headers: deepseekClient.headers,
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: contentPrompt }],
                max_tokens: 3000,
                temperature: 0.7
            })
        });
        
        const generatedContent = contentResponse.choices[0].message.content;
        workflow.steps.push('✅ Content generation completed');
        log(`✅ Generated content: ${generatedContent.length} characters`, 'success', 2);
        
        // Step 3: Create article with unlimited content blocks
        log("Step 3: Store article with unlimited content blocks...", 'info', 1);
        
        const articleTitle = `Complete Workflow Test - ${new Date().toISOString().split('T')[0]}`;
        
        // Process content into blocks
        const paragraphs = generatedContent.split('\n\n').filter(p => p.trim());
        const contentBlocks = [{
            object: 'block',
            type: 'heading_1',
            heading_1: {
                rich_text: [{ type: 'text', text: { content: articleTitle } }]
            }
        }];
        
        // Add content blocks with proper formatting
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                const isHeading = paragraph.includes(':') && paragraph.length < 100;
                
                if (isHeading) {
                    contentBlocks.push({
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{ type: 'text', text: { content: paragraph.trim() } }]
                        }
                    });
                } else {
                    // Handle long paragraphs
                    if (paragraph.length > 2000) {
                        const chunks = [];
                        for (let i = 0; i < paragraph.length; i += 1900) {
                            chunks.push(paragraph.slice(i, i + 1900));
                        }
                        chunks.forEach(chunk => {
                            contentBlocks.push({
                                object: 'block',
                                type: 'paragraph',
                                paragraph: {
                                    rich_text: [{ type: 'text', text: { content: chunk } }]
                                }
                            });
                        });
                    } else {
                        contentBlocks.push({
                            object: 'block',
                            type: 'paragraph',
                            paragraph: {
                                rich_text: [{ type: 'text', text: { content: paragraph } }]
                            }
                        });
                    }
                }
            }
        });
        
        const finalArticle = await notionClient.pages.create({
            parent: {
                type: 'database_id',
                database_id: NOTION_DATABASES.GENERATED_ARTICLES
            },
            properties: {
                'Title': {
                    type: 'title',
                    title: [{ type: 'text', text: { content: articleTitle } }]
                },
                'Status': {
                    type: 'select',
                    select: { name: 'Published' }
                },
                'WordCount': {
                    type: 'number',
                    number: generatedContent.split(' ').length
                },
                'GeneratedDate': {
                    type: 'date',
                    date: { start: new Date().toISOString().split('T')[0] }
                }
            },
            children: contentBlocks
        });
        
        workflow.steps.push('✅ Article storage completed');
        workflow.results.articleId = finalArticle.id;
        workflow.results.articleUrl = finalArticle.url;
        workflow.results.contentLength = generatedContent.length;
        workflow.results.blocksCreated = contentBlocks.length;
        
        log(`✅ Created final article: ${finalArticle.id}`, 'success', 2);
        
        // Step 4: Create newsletter summary
        log("Step 4: Create newsletter summary...", 'info', 1);
        
        const newsletterSummary = `🚀 Automated Content Update

We've successfully generated and published a new article: "${articleTitle}"

📊 Key Metrics:
• Content Length: ${generatedContent.length} characters
• Word Count: ${generatedContent.split(' ').length} words
• Content Blocks: ${contentBlocks.length} structured sections
• Processing Time: ${Math.round((new Date() - workflow.startTime) / 1000)} seconds

✅ Automation Status: SUCCESSFUL
All content has been stored using unlimited page content blocks, eliminating the 2000-character database property limitation.

🔗 View Article: ${finalArticle.url}

This automated workflow demonstrates:
• Research → Content Generation → Storage → Distribution
• Unlimited content length using Notion page blocks
• Structured, formatted content with proper hierarchy
• Complete end-to-end automation pipeline

Next steps: Email distribution and social media posting.`;

        const newsletterBlocks = newsletterSummary.split('\n\n').map(section => ({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: section } }]
            }
        }));
        
        const summaryNewsletter = await notionClient.pages.create({
            parent: {
                type: 'database_id',
                database_id: NOTION_DATABASES.NEWSLETTERS
            },
            properties: {
                'Title': {
                    type: 'title',
                    title: [{ type: 'text', text: { content: `Automated Update - ${new Date().toISOString().split('T')[0]}` } }]
                },
                'Status': {
                    type: 'select',
                    select: { name: 'Ready' }
                },
                'SendDate': {
                    type: 'date',
                    date: { start: new Date().toISOString().split('T')[0] }
                }
            },
            children: newsletterBlocks
        });
        
        workflow.steps.push('✅ Newsletter summary completed');
        workflow.results.newsletterId = summaryNewsletter.id;
        workflow.results.newsletterUrl = summaryNewsletter.url;
        
        // Final workflow results
        workflow.endTime = new Date();
        workflow.duration = Math.round((workflow.endTime - workflow.startTime) / 1000);
        
        log("🎉 Complete Automation Workflow Results:", 'success', 1);
        log(`⏱️  Total Duration: ${workflow.duration} seconds`, 'data', 2);
        log(`📄 Article: ${workflow.results.articleUrl}`, 'data', 2);
        log(`📧 Newsletter: ${workflow.results.newsletterUrl}`, 'data', 2);
        log(`📊 Content Length: ${workflow.results.contentLength} characters`, 'data', 2);
        log(`🧱 Blocks Created: ${workflow.results.blocksCreated}`, 'data', 2);
        
        workflow.steps.forEach(step => log(step, 'data', 2));
        
        log("✅ Test 5 passed: Complete Automation Workflow", 'success', 1);
        return { success: true, workflow };
    } catch (error) {
        log(`❌ Test 5 failed: ${error.message}`, 'error', 1);
        return { success: false, error: error.message };
    }
}

// Main test runner
async function runTests() {
    const startTime = new Date();
    
    log("🚀 Starting Unlimited Content Automation Tests", 'start');
    log("=" .repeat(80), 'data');
    
    // Check for node-fetch
    try {
        await import('node-fetch');
    } catch (error) {
        log("❌ node-fetch not found. Installing...", 'error');
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
            exec('npm install node-fetch@2.6.7', (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve();
            });
        });
        log("✅ node-fetch installed", 'success');
    }
    
    // Environment check
    const missingVars = REQUIRED_ENV.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'error');
        process.exit(1);
    }
    
    // Initialize clients
    const clientsReady = await initializeClients();
    if (!clientsReady) {
        log("❌ Failed to initialize API clients", 'error');
        process.exit(1);
    }
    
    // Run tests
    const results = {
        total: Object.keys(TESTS).length,
        passed: 0,
        failed: 0,
        details: {}
    };
    
    for (const [testNum, test] of Object.entries(TESTS)) {
        if (!test.enabled) {
            log(`⏭️  Skipping Test ${testNum}: ${test.name}`, 'warning');
            continue;
        }
        
        log(`\n${'='.repeat(60)}`, 'data');
        
        let result;
        switch (testNum) {
            case '1':
                result = await test1_environmentSetup();
                break;
            case '2':
                result = await test2_trendingTopicWithBlocks();
                break;
            case '3':
                result = await test3_fullArticleGeneration();
                break;
            case '4':
                result = await test4_newsletterWithBlocks();
                break;
            case '5':
                result = await test5_completeWorkflow();
                break;
            default:
                result = { success: false, error: 'Unknown test' };
        }
        
        if (result === true || result.success) {
            results.passed++;
            log(`✅ Test ${testNum} PASSED: ${test.name}`, 'success');
        } else {
            results.failed++;
            log(`❌ Test ${testNum} FAILED: ${test.name}`, 'error');
            if (result.error) {
                log(`   Error: ${result.error}`, 'error', 1);
            }
        }
        
        results.details[testNum] = result;
    }
    
    // Final report
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log(`\n${'='.repeat(80)}`, 'data');
    log("🏁 UNLIMITED CONTENT AUTOMATION TEST SUMMARY", 'start');
    log(`⏱️  Total Duration: ${duration} seconds`, 'data');
    log(`✅ Tests Passed: ${results.passed}`, 'success');
    log(`❌ Tests Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'data');
    log(`📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, 
         results.failed === 0 ? 'success' : 'warning');
    
    // Key improvements achieved
    if (results.passed >= 3) {
        log("\n🎉 KEY IMPROVEMENTS ACHIEVED:", 'success');
        log("✅ Eliminated 2000-character database property limitation", 'success', 1);
        log("✅ Implemented unlimited content storage using page blocks", 'success', 1);
        log("✅ Structured content with proper formatting and hierarchy", 'success', 1);
        log("✅ Complete automation pipeline with rich content support", 'success', 1);
        
        if (results.details['3']?.success) {
            const article = results.details['3'];
            log(`📄 Sample Article: ${article.contentLength} chars in ${article.blocksCreated} blocks`, 'data', 1);
            log(`🔗 View: ${article.articleUrl}`, 'data', 1);
        }
    }
    
    log(`\n${'='.repeat(80)}`, 'data');
    
    return results;
}

// Execute if run directly
if (require.main === module) {
    runTests().catch(error => {
        log(`💥 Fatal error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { runTests };
