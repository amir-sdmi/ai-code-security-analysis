#!/usr/bin/env node

/**
 * ContainerCode Advisory - Enhanced Loop Automation System
 * Workflow: Gemini (Keywords) → BraveSearch (Research) → DeepSeek (Content) → Notion (Storage)
 * No approval language, pure professional articles
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

console.log('🚀 Starting ContainerCode Advisory Enhanced Loop Automation...');
console.log('=================================================================');

// ===================================================================
// API CLIENTS INITIALIZATION
// ===================================================================

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Database IDs
const databases = {
  trendingTopics: process.env.NOTION_DATABASE_TRENDING_TOPICS,
  generatedArticles: process.env.NOTION_DATABASE_GENERATED_ARTICLES,
  newsletters: process.env.NOTION_DATABASE_NEWSLETTERS,
  subscribers: process.env.NOTION_DATABASE_SUBSCRIBERS
};

// ===================================================================
// GEMINI API - KEYWORD GENERATION
// ===================================================================

async function generateTrendingKeywordsWithGemini() {
  try {
    console.log('🔮 Generating trending keywords with Google Gemini...');
    
    const prompt = `You are a technology consulting expert analyzing market trends. Generate 5 specific, trending keywords/topics for technology consulting services that private companies, government agencies, and SMEs are currently seeking in 2025.

Focus on areas like:
- AI automation and implementation
- Cloud transformation and migration
- Cybersecurity and compliance
- Software engineering and modernization
- Digital transformation initiatives
- DevOps and infrastructure automation
- Multi-cloud strategies
- Enterprise technology adoption

Return ONLY a simple list of 5 keywords/topics, one per line, without numbering or explanations. Make them specific and searchable.

Example format:
AI-powered business process automation
Multi-cloud security architecture
Legacy system modernization strategies
DevSecOps implementation for enterprises
Compliance automation in financial services`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Parse keywords from response
    const keywords = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./) && line.length > 10)
      .slice(0, 5);

    console.log(`✅ Generated ${keywords.length} trending keywords`);
    keywords.forEach((keyword, index) => {
      console.log(`   ${index + 1}. ${keyword}`);
    });

    return keywords;
  } catch (error) {
    console.error('❌ Gemini keyword generation failed:', error);
    // Fallback keywords if Gemini fails
    return [
      'AI automation for enterprise business processes',
      'Multi-cloud security architecture implementation',
      'DevSecOps transformation for financial services',
      'Legacy system modernization with cloud migration',
      'Compliance automation for healthcare organizations'
    ];
  }
}

// ===================================================================
// BRAVE SEARCH API - RESEARCH
// ===================================================================

async function researchTopicWithBrave(keyword) {
  try {
    console.log(`🔍 Researching: ${keyword}`);
    
    const searchUrl = 'https://api.search.brave.com/res/v1/web/search';
    const response = await fetch(`${searchUrl}?q=${encodeURIComponent(keyword + ' 2025 trends implementation')}&count=5`, {
      headers: {
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Brave Search failed: ${response.status}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    console.log(`   ✅ Found ${results.length} research sources`);
    return results;
  } catch (error) {
    console.error('❌ Brave Search error:', error);
    return [];
  }
}

// ===================================================================
// DEEPSEEK API - CONTENT GENERATION (NO APPROVAL LANGUAGE)
// ===================================================================

async function generateProfessionalArticleWithDeepSeek(keyword, researchData) {
  try {
    console.log(`🤖 Generating professional article with DeepSeek...`);
    
    const prompt = `You are a senior technology consultant at ContainerCode Advisory writing a definitive article for enterprise decision-makers.

Write a comprehensive, authoritative article about: "${keyword}"

COMPANY CONTEXT:
ContainerCode Advisory is a premier technology consulting firm specializing in:
- Multi-cloud solutions (AWS, Azure, Google Cloud, Oracle, IBM)
- Cybersecurity and compliance consulting
- DevOps and DevSecOps implementation
- Digital transformation services
- Enterprise software engineering

RESEARCH DATA:
${researchData.map((item, index) => `
${index + 1}. ${item.title}
   Source: ${item.url}
   Key Points: ${item.snippet}
`).join('')}

ARTICLE REQUIREMENTS:
- Write as a definitive expert guide, not a proposal or draft
- 2500-3500 words of substantial, actionable content
- Professional, authoritative tone for CTOs and IT Directors
- Include specific implementation strategies and best practices
- Provide concrete business benefits and ROI considerations
- Structure with clear headings and logical flow
- End with actionable next steps, NOT requests for approval or refinement

STRICT WRITING RULES:
- NO phrases like "Would you like refinement?" or "Any additional details?"
- NO approval-seeking language or draft disclaimers
- NO meta-commentary about the article itself
- Write as a published, final expert piece
- End with concrete recommendations and contact information

ARTICLE STRUCTURE:
1. Executive Summary
2. Current Market Landscape
3. Technical Implementation Strategy
4. Business Benefits and ROI Analysis
5. Best Practices and Common Pitfalls
6. Case Study Examples
7. Implementation Roadmap
8. Risk Management and Security Considerations
9. Future Outlook and Emerging Trends
10. Conclusion and Next Steps

Write the complete article now as a finished, professional publication.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a senior technology consultant writing definitive, professional articles for enterprise decision-makers. Never include approval requests, draft language, or meta-commentary. Write complete, authoritative content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up any approval/refinement language that might slip through
    content = content.replace(/Would you like.*?\?/g, '');
    content = content.replace(/Any additional details.*?\?/g, '');
    content = content.replace(/Let me know if.*?\./g, '');
    content = content.replace(/Please let me know.*?\./g, '');
    content = content.replace(/Would you prefer.*?\?/g, '');
    content = content.replace(/Is there anything.*?\?/g, '');
    
    const wordCount = content.split(' ').length;
    console.log(`   ✅ Generated article: ${wordCount} words`);
    
    return content;
  } catch (error) {
    console.error('❌ DeepSeek content generation failed:', error);
    return null;
  }
}

// ===================================================================
// NOTION STORAGE - UNLIMITED CONTENT BLOCKS
// ===================================================================

function convertToNotionBlocks(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const blocks = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;

    // Headers
    if (trimmed.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: trimmed.substring(2) } }]
        }
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: trimmed.substring(3) } }]
        }
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: trimmed.substring(4) } }]
        }
      });
    }
    // Bullet points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: trimmed.substring(2) } }]
        }
      });
    }
    // Regular paragraphs (split if too long)
    else {
      const maxLength = 1800;
      if (trimmed.length > maxLength) {
        const chunks = [];
        let remaining = trimmed;
        while (remaining.length > maxLength) {
          let splitIndex = remaining.lastIndexOf(' ', maxLength);
          if (splitIndex === -1) splitIndex = maxLength;
          chunks.push(remaining.substring(0, splitIndex));
          remaining = remaining.substring(splitIndex + 1);
        }
        if (remaining) chunks.push(remaining);
        
        chunks.forEach(chunk => {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: chunk } }]
            }
          });
        });
      } else {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: trimmed } }]
          }
        });
      }
    }
  }

  return blocks;
}

async function storeArticleInNotion(title, content, keyword, wordCount) {
  try {
    console.log(`📝 Storing article in Notion: ${title}`);
    
    let contentBlocks = convertToNotionBlocks(content);
    
    // Notion API limit: 100 blocks per request
    if (contentBlocks.length > 95) {
      console.log(`   ⚠️ Content has ${contentBlocks.length} blocks, truncating to 95...`);
      contentBlocks = contentBlocks.slice(0, 95);
    }
    
    const response = await notion.pages.create({
      parent: {
        database_id: databases.generatedArticles
      },
      properties: {
        Title: {
          title: [{ type: 'text', text: { content: title } }]
        },
        Keywords: {
          multi_select: keyword.split(' ').slice(0, 3).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1) }))
        },
        WordCount: {
          number: wordCount
        },
        GeneratedDate: {
          date: { start: new Date().toISOString() }
        },
        Status: {
          select: { name: 'Published' }
        },
        Category: {
          select: { name: 'Technology' }
        }
      },
      children: contentBlocks
    });

    console.log(`   ✅ Stored with ${contentBlocks.length} content blocks`);
    return response;
  } catch (error) {
    console.error('❌ Notion storage error:', error);
    throw error;
  }
}

// ===================================================================
// MAIN LOOP AUTOMATION WORKFLOW
// ===================================================================

async function runEnhancedLoopAutomation() {
  try {
    const startTime = Date.now();
    console.log('🎯 Starting Enhanced Loop Automation Workflow');
    console.log('===============================================');

    // Step 1: Generate trending keywords with Gemini
    const keywords = await generateTrendingKeywordsWithGemini();
    
    if (keywords.length === 0) {
      console.log('❌ No keywords generated, exiting...');
      return;
    }

    const processedArticles = [];

    // Step 2: Loop through each keyword
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n📋 Processing Keyword ${i + 1}/${keywords.length}: ${keyword}`);
      console.log('─'.repeat(50));

      try {
        // Step 3: Research with Brave Search
        const researchData = await performBraveResearch(keyword);
        
        if (researchData.length === 0) {
          console.log('⚠️ No research data found, skipping to next keyword...');
          continue;
        }

        // Step 4: Generate content with DeepSeek
        const content = await generateProfessionalArticleWithDeepSeek(keyword, researchData);
        
        if (!content) {
          console.log('⚠️ Content generation failed, skipping to next keyword...');
          continue;
        }

        // Step 5: Create clean title and store in Notion
        const title = `${keyword.split(' ').slice(0, 4).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - ${new Date().toLocaleDateString()}`;
        const wordCount = content.split(' ').length;

        await storeArticleInNotion(title, content, keyword, wordCount);
        
        processedArticles.push({
          title,
          keyword,
          wordCount,
          contentBlocks: convertToNotionBlocks(content).length
        });

        console.log(`✅ Article ${i + 1} completed successfully`);
        
        // Brief pause between articles to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing keyword "${keyword}":`, error);
        continue;
      }
    }

    // Final Summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 ENHANCED LOOP AUTOMATION COMPLETED');
    console.log('=====================================');
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`📊 Articles Generated: ${processedArticles.length}/${keywords.length}`);
    console.log(`📝 Total Words: ${processedArticles.reduce((sum, article) => sum + article.wordCount, 0)}`);
    console.log(`🧱 Total Content Blocks: ${processedArticles.reduce((sum, article) => sum + article.contentBlocks, 0)}`);
    
    if (processedArticles.length > 0) {
      console.log('\n📄 Generated Articles:');
      processedArticles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title} (${article.wordCount} words)`);
      });
    }

  } catch (error) {
    console.error('❌ Enhanced Loop Automation failed:', error);
    process.exit(1);
  }
}

// Helper function wrapper for Brave Search
async function performBraveResearch(keyword) {
  return await researchTopicWithBrave(keyword);
}

// ===================================================================
// EXECUTION
// ===================================================================

if (require.main === module) {
  runEnhancedLoopAutomation();
}

module.exports = {
  generateTrendingKeywordsWithGemini,
  researchTopicWithBrave,
  generateProfessionalArticleWithDeepSeek,
  storeArticleInNotion,
  runEnhancedLoopAutomation
};
