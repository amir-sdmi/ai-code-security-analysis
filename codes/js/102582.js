/**
 * Article Generator Worker
 * Main worker that orchestrates RSS parsing, content generation, validation, and Notion publishing
 */

import { parseRSSFeeds } from './utils/rss-parser.js';
import { generateArticle } from './utils/content-generator.js';
import { validateArticle, autoFixArticle } from './utils/content-validator.js';
import { createNotionArticle } from './utils/notion-client.js';
import { generateArticleImage } from './utils/image-generator.js';

export default {
  /**
   * Scheduled event handler for daily article generation
   * @param {ScheduledEvent} event - Scheduled event
   * @param {Object} env - Environment variables and bindings
   * @param {Object} ctx - Execution context
   */
  async scheduled(event, env, ctx) {
    console.log('🚀 Starting scheduled article generation job');
    
    // Log job start
    const jobId = await this.logJobStart(env, 'article-generation');
    let processedCount = 0;
    let errorCount = 0;

    try {
      // Always use BraveSearch + DeepSeek fallback for reliable generation
      console.log('🔍 Using BraveSearch + DeepSeek for reliable article generation...');
      const fallbackArticles = await this.generateArticlesFromBraveSearch(env);
      console.log(`Generated ${fallbackArticles.length} articles from BraveSearch + DeepSeek`);
      
      if (fallbackArticles.length === 0) {
        console.log('No articles generated from BraveSearch + DeepSeek, skipping generation');
        await this.logJobEnd(env, jobId, 'completed', 'No articles generated from BraveSearch + DeepSeek', 0);
        return;
      }
      
      const articlesToProcess = fallbackArticles;

      // Process each article
      for (const rssArticle of articlesToProcess.slice(0, 5)) { // Limit to 5 articles per run
        try {
          console.log(`\n📝 Processing article: "${rssArticle.title}"`);
          
          // Check if article already exists
          const existingArticle = await this.checkExistingArticle(env, rssArticle);
          if (existingArticle) {
            console.log('Article already exists, skipping...');
            continue;
          }

          // Generate comprehensive article content
          console.log('🤖 Generating article content with AI...');
          const generatedArticle = await generateArticle(rssArticle, rssArticle.category, env.AI);
          
          // Validate and fix article
          console.log('✅ Validating article content...');
          const validation = await validateArticle(generatedArticle);
          
          let finalArticle = generatedArticle;
          if (!validation.isValid) {
            console.log('🔧 Auto-fixing article issues...');
            finalArticle = autoFixArticle(generatedArticle);
            
            // Re-validate after fixes
            const revalidation = await validateArticle(finalArticle);
            if (!revalidation.isValid) {
              console.log('❌ Article validation failed, skipping:', revalidation.errors);
              errorCount++;
              continue;
            }
          }

          // Generate header image using Pexels API
          console.log('🎨 Generating header image with Pexels...');
          const imageUrl = await generateArticleImage(finalArticle, env.AI, env.IMAGES, env.PEXELS_API_KEY);
          
          // Store article in database
          console.log('💾 Storing article in database...');
          const dbResult = await env.DB.prepare(`
            INSERT INTO articles (
              title, content, summary, excerpt, slug, image_url, 
              category, tags, author, word_count, reading_time,
              source_url, source_feed, seo_title, seo_description,
              status, validation_status, created_at, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            finalArticle.title,
            finalArticle.content,
            finalArticle.summary,
            finalArticle.excerpt,
            finalArticle.slug,
            imageUrl,
            finalArticle.category,
            JSON.stringify(finalArticle.tags || []),
            finalArticle.author,
            finalArticle.word_count,
            finalArticle.reading_time,
            finalArticle.source_url,
            finalArticle.source_feed,
            finalArticle.seo_title,
            finalArticle.seo_description,
            'published',
            'valid',
            new Date().toISOString(),
            new Date().toISOString()
          ).run();

          const articleId = dbResult.meta.last_row_id;
          
          // Create Notion page
          console.log('📋 Creating Notion page...');
          const notionPage = await createNotionArticle(
            { ...finalArticle, id: articleId },
            env.NOTION_DATABASE_GENERATED_ARTICLES,
            imageUrl,
            env.NOTION_TOKEN
          );

          // Update article with Notion page ID
          await env.DB.prepare(`
            UPDATE articles SET notion_page_id = ? WHERE id = ?
          `).bind(notionPage.id, articleId).run();

          // Store validation results
          await env.DB.prepare(`
            INSERT INTO content_validations (
              article_id, validation_type, is_valid, errors, warnings, validated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            articleId,
            'comprehensive',
            validation.isValid,
            JSON.stringify(validation.errors || []),
            JSON.stringify(validation.warnings || []),
            new Date().toISOString()
          ).run();

          processedCount++;
          console.log(`✅ Successfully processed article: "${finalArticle.title}"`);
          
        } catch (error) {
          console.error(`❌ Error processing article "${rssArticle.title}":`, error);
          errorCount++;
        }
      }

      console.log(`\n🎉 Article generation completed. Processed: ${processedCount}, Errors: ${errorCount}`);
      
      // Log job completion
      await this.logJobEnd(env, jobId, 'completed', `Processed ${processedCount} articles`, processedCount);
      
      // Clean up old images if needed
      if (processedCount > 0) {
        console.log('🧹 Cleaning up old images...');
        try {
          const imageGenerator = new (await import('./utils/image-generator.js')).ImageGenerator(env.AI, env.IMAGES);
          await imageGenerator.cleanupOldImages(30);
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }

    } catch (error) {
      console.error('❌ Fatal error in article generation job:', error);
      await this.logJobEnd(env, jobId, 'failed', error.message, processedCount);
    }
  },

  /**
   * HTTP request handler for manual article generation
   * @param {Request} request - HTTP request
   * @param {Object} env - Environment variables and bindings
   * @param {Object} ctx - Execution context
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/generate' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Validate request
        if (!body.rss_url || !body.category) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: rss_url, category'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Always use BraveSearch + DeepSeek for reliable generation
        console.log('🔍 Using BraveSearch + DeepSeek for reliable article generation...');
        const fallbackArticles = await this.generateArticlesFromBraveSearch(env);
        
        if (fallbackArticles.length === 0) {
          return new Response(JSON.stringify({
            error: 'No articles generated from BraveSearch + DeepSeek'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const rssArticle = fallbackArticles[0];
        console.log(`✅ Generated article from BraveSearch + DeepSeek: "${rssArticle.title}"`);
        const generatedArticle = await generateArticle(rssArticle, body.category, env.AI);
        
        // Validate article
        const validation = await validateArticle(generatedArticle);
        
        let articleId = null;
        let notionPage = null;
        
        // Save to database if requested
        if (body.save_to_db || body.publish_to_notion) {
          console.log('💾 Saving article to database...');
          
          // Auto-fix article if needed
          const finalArticle = validation.isValid ? generatedArticle : await autoFixArticle(generatedArticle, validation);
          
          // Generate image if requested
          let imageUrl = null;
          if (body.generate_image) {
            console.log('🎨 Generating article image with Pexels...');
            try {
              const { generateArticleImage } = await import('./utils/image-generator.js');
              imageUrl = await generateArticleImage(finalArticle, env.AI, env.IMAGES, env.PEXELS_API_KEY);
            } catch (imageError) {
              console.error('Error generating image:', imageError);
            }
          }
          
          // Insert into database
          const dbResult = await env.DB.prepare(`
            INSERT INTO articles (
              title, content, summary, excerpt, slug, image_url, category, tags, author,
              word_count, reading_time, source_url, source_feed, seo_title, seo_description,
              status, validation_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            finalArticle.title,
            finalArticle.content,
            finalArticle.summary,
            finalArticle.excerpt,
            finalArticle.slug,
            imageUrl,
            finalArticle.category,
            JSON.stringify(finalArticle.tags || []),
            finalArticle.author,
            finalArticle.word_count,
            finalArticle.reading_time,
            finalArticle.source_url,
            finalArticle.source_feed,
            finalArticle.seo_title,
            finalArticle.seo_description,
            body.test ? 'draft' : 'published',
            validation.isValid ? 'valid' : 'pending',
            new Date().toISOString(),
            new Date().toISOString()
          ).run();

          articleId = dbResult.meta.last_row_id;
          console.log(`📝 Article saved to database with ID: ${articleId}`);
          
          // Create Notion page if requested
          if (body.publish_to_notion) {
            console.log('📋 Creating Notion page...');
            console.log('Database ID:', env.NOTION_DATABASE_GENERATED_ARTICLES);
            console.log('Token prefix:', env.NOTION_TOKEN?.substring(0, 10) + '...');
            
            try {
              notionPage = await createNotionArticle(
                { ...finalArticle, id: articleId },
                env.NOTION_DATABASE_GENERATED_ARTICLES,
                imageUrl,
                env.NOTION_TOKEN
              );

              if (notionPage && notionPage.id) {
                // Update article with Notion page ID
                await env.DB.prepare(`
                  UPDATE articles SET notion_page_id = ? WHERE id = ?
                `).bind(notionPage.id, articleId).run();
                
                console.log(`📋 Notion page created: ${notionPage.url || notionPage.id}`);
              } else {
                console.error('Notion page creation returned null or invalid response');
              }
            } catch (notionError) {
              console.error('Error creating Notion page:', notionError);
              console.error('Error details:', notionError.message);
            }
          }
        }
        
        return new Response(JSON.stringify({
          article: generatedArticle,
          validation: validation,
          saved: !!articleId,
          articleId: articleId,
          notionPage: notionPage
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/status') {
      const stats = await this.getJobStats(env);
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/trigger' && request.method === 'POST') {
      console.log('🚀 Manual trigger received - starting scheduled job');
      
      // Create a mock scheduled event
      const scheduledEvent = {
        scheduledTime: Date.now(),
        cron: '0 9 * * *'
      };
      
      // Execute the scheduled handler
      try {
        await this.scheduled(scheduledEvent, env, { waitUntil: () => {} });
        return new Response(JSON.stringify({
          success: true,
          message: 'Article generation job triggered successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/test-notion' && request.method === 'POST') {
      try {
        console.log('🧪 Testing Notion API integration...');
        
        // Get an existing article from database
        const article = await env.DB.prepare(`
          SELECT * FROM articles WHERE id = 1 LIMIT 1
        `).first();
        
        if (!article) {
          return new Response(JSON.stringify({
            error: 'No articles found to test with'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.log('Testing with article:', article.title);
        console.log('Database ID:', env.NOTION_DATABASE_GENERATED_ARTICLES);
        
        const { createNotionArticle } = await import('./utils/notion-client.js');
        const notionPage = await createNotionArticle(
          article,
          env.NOTION_DATABASE_GENERATED_ARTICLES,
          null, // no image for test
          env.NOTION_TOKEN
        );
        
        return new Response(JSON.stringify({
          success: true,
          notionPage: notionPage,
          articleTitle: article.title,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Notion test error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/test-brave-search' && request.method === 'POST') {
      try {
        const body = await request.json();
        const topic = body.topic || 'cloud migration strategy';
        
        console.log('🧪 Testing BraveSearch API for topic:', topic);
        
        const researchData = await this.researchTopicWithBraveSearch(topic, env.BRAVE_API_KEY);
        
        return new Response(JSON.stringify({
          success: true,
          topic: topic,
          researchData: researchData,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('BraveSearch test error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/test-deepseek' && request.method === 'POST') {
      try {
        const body = await request.json();
        const topic = body.topic || 'cloud migration strategy';
        const researchData = body.researchData || {
          insights: [{ title: 'Sample insight', description: 'Sample description' }],
          trends: [{ title: 'Sample trend', insight: 'Sample trend insight' }],
          bestPractices: [{ practice: 'Sample practice', description: 'Sample practice description' }]
        };
        
        console.log('🧪 Testing DeepSeek API for topic:', topic);
        
        const article = await this.generateArticleWithDeepSeek(topic, researchData, env.DEEPSEEK_API_KEY);
        
        return new Response(JSON.stringify({
          success: true,
          topic: topic,
          article: article,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('DeepSeek test error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/test-fallback' && request.method === 'POST') {
      try {
        console.log('🧪 Testing complete BraveSearch + DeepSeek fallback flow...');
        
        const fallbackArticles = await this.generateArticlesFromBraveSearch(env);
        
        if (fallbackArticles.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            message: 'No articles generated from BraveSearch + DeepSeek fallback',
            timestamp: new Date().toISOString()
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const article = fallbackArticles[0];
        
        // Save to database and Notion if requested
        const body = await request.json().catch(() => ({}));
        
        if (body.save_to_db || body.publish_to_notion) {
          // Generate comprehensive article content
          console.log('🤖 Generating article content with AI...');
          const { generateArticle } = await import('./utils/content-generator.js');
          const generatedArticle = await generateArticle(article, article.category, env.AI);
          
          // Validate and fix article
          console.log('✅ Validating article content...');
          const { validateArticle, autoFixArticle } = await import('./utils/content-validator.js');
          const validation = await validateArticle(generatedArticle);
          
          let finalArticle = generatedArticle;
          if (!validation.isValid) {
            console.log('🔧 Auto-fixing article issues...');
            finalArticle = autoFixArticle(generatedArticle);
          }
          
          // Generate header image using Pexels API
          console.log('🎨 Generating header image with Pexels...');
          const { generateArticleImage } = await import('./utils/image-generator.js');
          const imageUrl = await generateArticleImage(finalArticle, env.AI, env.IMAGES, env.PEXELS_API_KEY);
          
          // Store article in database
          console.log('💾 Storing article in database...');
          const dbResult = await env.DB.prepare(`
            INSERT INTO articles (
              title, content, summary, excerpt, slug, image_url, 
              category, tags, author, word_count, reading_time,
              source_url, source_feed, seo_title, seo_description,
              status, validation_status, created_at, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            finalArticle.title,
            finalArticle.content,
            finalArticle.summary,
            finalArticle.excerpt,
            finalArticle.slug,
            imageUrl,
            finalArticle.category,
            JSON.stringify(finalArticle.tags || []),
            finalArticle.author,
            finalArticle.word_count,
            finalArticle.reading_time,
            finalArticle.source_url,
            finalArticle.source_feed,
            finalArticle.seo_title,
            finalArticle.seo_description,
            'published',
            'valid',
            new Date().toISOString(),
            new Date().toISOString()
          ).run();

          const articleId = dbResult.meta.last_row_id;
          
          // Create Notion page if requested
          let notionPage = null;
          if (body.publish_to_notion) {
            console.log('📋 Creating Notion page...');
            const { createNotionArticle } = await import('./utils/notion-client.js');
            notionPage = await createNotionArticle(
              { ...finalArticle, id: articleId },
              env.NOTION_DATABASE_GENERATED_ARTICLES,
              imageUrl,
              env.NOTION_TOKEN
            );

            // Update article with Notion page ID
            await env.DB.prepare(`
              UPDATE articles SET notion_page_id = ? WHERE id = ?
            `).bind(notionPage.id, articleId).run();
          }
          
          return new Response(JSON.stringify({
            success: true,
            article: finalArticle,
            articleId: articleId,
            notionPage: notionPage,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          articles: fallbackArticles,
          count: fallbackArticles.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Fallback test error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Article Generator Worker\n\nEndpoints:\n- POST /generate\n- GET /status\n- POST /trigger\n- POST /test-notion\n- POST /test-brave-search\n- POST /test-deepseek\n- POST /test-fallback', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  /**
   * Check if article already exists in database
   * @param {Object} env - Environment bindings
   * @param {Object} rssArticle - RSS article data
   * @returns {Promise<boolean>} True if article exists
   */
  async checkExistingArticle(env, rssArticle) {
    const existing = await env.DB.prepare(`
      SELECT id FROM articles 
      WHERE source_url = ? OR title = ?
      LIMIT 1
    `).bind(rssArticle.link, rssArticle.title).first();
    
    return !!existing;
  },

  /**
   * Log job start
   * @param {Object} env - Environment bindings
   * @param {string} jobName - Job name
   * @returns {Promise<number>} Job ID
   */
  async logJobStart(env, jobName) {
    const result = await env.DB.prepare(`
      INSERT INTO cron_logs (job_name, status, start_time) 
      VALUES (?, ?, ?)
    `).bind(jobName, 'started', new Date().toISOString()).run();
    
    return result.meta.last_row_id;
  },

  /**
   * Log job completion
   * @param {Object} env - Environment bindings
   * @param {number} jobId - Job ID
   * @param {string} status - Job status
   * @param {string} result - Job result
   * @param {number} recordsProcessed - Records processed
   */
  async logJobEnd(env, jobId, status, result, recordsProcessed) {
    const endTime = new Date().toISOString();
    
    await env.DB.prepare(`
      UPDATE cron_logs 
      SET status = ?, end_time = ?, result = ?, records_processed = ?
      WHERE id = ?
    `).bind(status, endTime, result, recordsProcessed, jobId).run();
  },

  /**
   * Generate articles using BraveSearch + DeepSeek fallback
   * @param {Object} env - Environment bindings
   * @returns {Promise<Array>} Generated articles
   */
  async generateArticlesFromBraveSearch(env) {
    try {
      // Define consulting-focused search topics
      const searchTopics = [
        'cloud migration strategy 2024',
        'enterprise cybersecurity trends',
        'kubernetes adoption enterprise',
        'digital transformation consulting',
        'devops implementation best practices',
        'azure aws multi-cloud strategy',
        'zero trust security framework',
        'software engineering methodology',
        'AI adoption enterprise consulting',
        'containerization enterprise deployment'
      ];

      const generatedArticles = [];

      // Try BraveSearch first, but fallback quickly to basic template for reliability
      const topic = searchTopics[Math.floor(Math.random() * searchTopics.length)];
      console.log(`🔍 Researching topic: ${topic}`);
      
      try {
        // Quick BraveSearch attempt with short timeout
        const researchStartTime = Date.now();
        let researchData = null;
        
        try {
          researchData = await Promise.race([
            this.researchTopicWithBraveSearch(topic, env.BRAVE_API_KEY),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('BraveSearch timeout')), 10000)
            )
          ]);
          
          const researchTime = Date.now() - researchStartTime;
          console.log(`📊 BraveSearch completed in ${researchTime}ms`);
        } catch (researchError) {
          console.log(`⚠️ BraveSearch failed, using basic template`);
          researchData = null;
        }
        
        if (researchData) {
          // Try DeepSeek with very short timeout due to Cloudflare limits
          console.log(`🤖 Attempting DeepSeek generation with short timeout for: ${topic}`);
          const deepSeekStartTime = Date.now();
          
          try {
            const article = await Promise.race([
              this.generateArticleWithDeepSeek(topic, researchData, env.DEEPSEEK_API_KEY),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DeepSeek timeout')), 20000)
              )
            ]);
            
            const deepSeekTime = Date.now() - deepSeekStartTime;
            console.log(`📊 DeepSeek completed in ${deepSeekTime}ms`);
            
            if (article) {
              console.log(`✅ Successfully generated article with DeepSeek: "${article.title}"`);
              generatedArticles.push(article);
            }
          } catch (deepSeekError) {
            console.log(`⚠️ DeepSeek failed, using basic template:`, deepSeekError.message);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing topic "${topic}":`, error.message);
      }

      // If all attempts failed, create a basic fallback article
      if (generatedArticles.length === 0) {
        console.log('🔄 Creating fallback article using basic template...');
        const fallbackTopic = searchTopics[0];
        const fallbackArticle = {
          title: `${fallbackTopic.charAt(0).toUpperCase() + fallbackTopic.slice(1)} - A ContainerCode Advisory Analysis`,
          description: `Strategic insights on ${fallbackTopic} for enterprise technology leaders`,
          content: this.generateBasicFallbackContent(fallbackTopic),
          link: `https://containercode.club/insights/${this.generateSlug(fallbackTopic)}`,
          source: 'ContainerCode Advisory',
          category: 'technology',
          publishedDate: new Date(),
          author: 'ContainerCode Advisory Team',
          guid: `containercode-${Date.now()}`,
          tags: ['consulting', 'enterprise', 'technology'],
          word_count: 1500,
          reading_time: 8
        };
        
        generatedArticles.push(fallbackArticle);
        console.log(`✅ Created fallback article: "${fallbackArticle.title}"`);
      }

      return generatedArticles;
    } catch (error) {
      console.error('Error generating articles from BraveSearch:', error);
      
      // Last resort: create a basic article
      const basicArticle = {
        title: 'Enterprise Technology Consulting - A ContainerCode Advisory Analysis',
        description: 'Strategic insights on enterprise technology consulting for business leaders',
        content: this.generateBasicFallbackContent('enterprise technology consulting'),
        link: 'https://containercode.club/insights/enterprise-technology-consulting',
        source: 'ContainerCode Advisory',
        category: 'technology',
        publishedDate: new Date(),
        author: 'ContainerCode Advisory Team',
        guid: `containercode-${Date.now()}`,
        tags: ['consulting', 'enterprise'],
        word_count: 1200,
        reading_time: 6
      };
      
      return [basicArticle];
    }
  },

  /**
   * Research topic using BraveSearch
   * @param {string} topic - Topic to research
   * @param {string} apiKey - BraveSearch API key
   * @returns {Promise<Object|null>} Research data
   */
  async researchTopicWithBraveSearch(topic, apiKey) {
    try {
      const params = new URLSearchParams({
        q: `${topic} consulting enterprise best practices`,
        count: '10',
        search_lang: 'en',
        country: 'GB',
        safesearch: 'moderate',
        freshness: 'py'
      });

      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
          'User-Agent': 'ContainerCode Advisory/1.0'
        }
      });

      if (!response.ok) {
        console.error('BraveSearch API error:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.web?.results && data.web.results.length > 0) {
        // Extract key insights from search results
        const insights = data.web.results.slice(0, 5).map(result => ({
          title: result.title,
          description: result.description,
          url: result.url
        }));

        return {
          topic,
          insights,
          searchResults: data.web.results.length,
          researchedAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error researching topic with BraveSearch:', error);
      return null;
    }
  },

  /**
   * Generate article using DeepSeek API
   * @param {string} topic - Article topic
   * @param {Object} researchData - Research data from BraveSearch
   * @param {string} apiKey - DeepSeek API key
   * @returns {Promise<Object|null>} Generated article
   */
  async generateArticleWithDeepSeek(topic, researchData, apiKey) {
    try {
      const prompt = `You are a senior technology consultant writing for ContainerCode Advisory, a UK-based technology consulting firm specialising in cloud technologies, cybersecurity, DevOps, and digital transformation.

TOPIC: ${topic}

MARKET RESEARCH INSIGHTS:
${researchData.insights.map(insight => `- ${insight.title}: ${insight.description}`).join('\n')}

CONTAINERCODE ADVISORY CONTEXT:
ContainerCode Advisory is a premier UK technology consulting firm that specialises in:

CORE SERVICE OFFERINGS:
1. Cloud Infrastructure & Migration Services
   - AWS, Azure, GCP multi-cloud strategy development
   - Kubernetes and containerisation deployment
   - Infrastructure as Code (Terraform, CloudFormation)
   - Cloud cost optimisation and governance
   - Hybrid and multi-cloud architecture design

2. Cybersecurity & Compliance Consulting
   - Zero Trust security framework implementation
   - SOC 2, GDPR, ISO 27001 compliance guidance
   - Security architecture and risk assessment
   - Incident response and threat detection systems
   - Data protection and privacy compliance

3. DevOps Transformation & Automation
   - CI/CD pipeline design and implementation
   - Infrastructure automation and monitoring
   - Site reliability engineering (SRE) practices
   - Application modernisation and containerisation
   - DevSecOps integration and security automation

4. Digital Transformation Strategy
   - Enterprise architecture and technology roadmaps
   - Change management and organisational transformation
   - Technology due diligence and vendor selection
   - Business process optimisation and automation
   - Legacy system modernisation strategies

5. Data & Analytics Solutions
   - Data lake and warehouse architecture
   - AI/ML implementation and MLOps
   - Business intelligence and reporting systems
   - Data governance and quality frameworks
   - Real-time analytics and streaming platforms

CONTAINERCODE METHODOLOGY:
1. Discovery & Assessment Phase
   - Current state analysis and gap identification
   - Technology stack audit and security assessment
   - Business requirement gathering and stakeholder alignment
   - Risk assessment and compliance review

2. Strategy & Design Phase
   - Solution architecture and technology selection
   - Implementation roadmap with phased delivery
   - Cost-benefit analysis and ROI projections
   - Risk mitigation and contingency planning

3. Implementation & Delivery Phase
   - Agile delivery with continuous client collaboration
   - Proof of concept and pilot programme execution
   - Knowledge transfer and skills development
   - Quality assurance and testing protocols

4. Optimisation & Support Phase
   - Performance monitoring and continuous improvement
   - Ongoing support and maintenance services
   - Regular health checks and security reviews
   - Scaling and enhancement planning

TASK: Create a comprehensive, professional article (2000-2500 words) that demonstrates ContainerCode's expertise in ${topic} and naturally integrates our service offerings and methodology.

REQUIREMENTS:
1. Write in British English (use "colour", "realise", "centre", "optimise", etc.)
2. Target audience: CTOs, IT Directors, and senior technology managers
3. Focus on practical business implications and strategic considerations
4. Include actionable insights and recommendations from ContainerCode's perspective
5. Maintain a professional, authoritative tone befitting a senior consultant
6. Structure with clear headings and subheadings
7. Include relevant technical depth without being overly complex
8. Reference current industry trends and best practices from the research
9. Naturally integrate ContainerCode's consulting methodology and service offerings
10. Address common enterprise challenges and how ContainerCode's services solve them
11. Include specific next steps that align with ContainerCode's methodology
12. Mention compliance, security, and scalability considerations
13. Reference UK market specifics where relevant
14. Include case study examples or scenarios relevant to UK enterprises
15. Position ContainerCode as the trusted advisor for this technology area

CONTENT STRUCTURE:
- Executive Summary (business impact focus with ContainerCode value proposition)
- Current State Analysis (industry context with UK market insights)
- Strategic Implications (enterprise considerations and ContainerCode's approach)
- Implementation Approach (ContainerCode methodology and service offerings)
- Risk Mitigation & Compliance (how ContainerCode addresses these challenges)
- Success Metrics & ROI (measurement approach and expected outcomes)
- Next Steps & Recommendations (how to engage with ContainerCode)

RESPONSE FORMAT: Return a JSON object with the following structure:
{
  "title": "Professional article title that reflects ContainerCode's expertise in ${topic}",
  "content": "Full article content in Markdown format with ContainerCode insights",
  "summary": "2-3 sentence executive summary highlighting ContainerCode's value",
  "excerpt": "1 sentence compelling excerpt about ContainerCode's approach",
  "category": "technology category (cloud|devops|cybersecurity|technology|digital_transformation)",
  "tags": ["relevant", "tags", "array"],
  "reading_time": estimated_reading_time_in_minutes,
  "word_count": estimated_word_count
}`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.error('DeepSeek API error:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
          let content = data.choices[0].message.content;
          
          // Handle markdown-wrapped JSON responses
          if (content.includes('```json')) {
            const jsonStart = content.indexOf('```json') + 7;
            const jsonEnd = content.lastIndexOf('```');
            if (jsonStart > 6 && jsonEnd > jsonStart) {
              content = content.substring(jsonStart, jsonEnd).trim();
            }
          }
          
          const articleData = JSON.parse(content);
          
          // Create article in RSS-like format for compatibility with existing pipeline
          return {
            title: articleData.title,
            description: articleData.summary,
            content: articleData.content,
            link: `https://containercode.club/insights/${this.generateSlug(articleData.title)}`,
            source: 'BraveSearch + DeepSeek',
            category: articleData.category || 'technology',
            publishedDate: new Date(),
            author: 'ContainerCode Advisory Team',
            guid: `containercode-${Date.now()}`,
            tags: articleData.tags || [],
            word_count: articleData.word_count || this.countWords(articleData.content),
            reading_time: articleData.reading_time || this.calculateReadingTime(articleData.content)
          };
        } catch (parseError) {
          console.error('Error parsing DeepSeek response:', parseError);
          console.log('DeepSeek response content:', data.choices[0].message.content.substring(0, 200) + '...');
          
          // Fallback to basic article structure
          const content = data.choices[0].message.content;
          return {
            title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} - A ContainerCode Advisory Analysis`,
            description: `Strategic insights on ${topic} for enterprise technology leaders`,
            content: content,
            link: `https://containercode.club/insights/${this.generateSlug(topic)}`,
            source: 'BraveSearch + DeepSeek',
            category: 'technology',
            publishedDate: new Date(),
            author: 'ContainerCode Advisory Team',
            guid: `containercode-${Date.now()}`,
            tags: [topic.split(' ')[0], 'consulting', 'enterprise'],
            word_count: this.countWords(content),
            reading_time: this.calculateReadingTime(content)
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating article with DeepSeek:', error);
      return null;
    }
  },

  /**
   * Generate URL-friendly slug
   * @param {string} title - Article title
   * @returns {string} URL slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  },

  /**
   * Generate basic fallback content when all APIs fail
   * @param {string} topic - Article topic
   * @returns {string} Basic article content
   */
  generateBasicFallbackContent(topic) {
    return `# ${topic.charAt(0).toUpperCase() + topic.slice(1)} - A ContainerCode Advisory Analysis

## Executive Summary

As enterprise technology leaders navigate the rapidly evolving digital landscape, ${topic} has emerged as a critical consideration for organisational success. ContainerCode Advisory, a premier UK technology consulting firm, provides strategic guidance to help enterprises successfully implement and optimise their technology initiatives.

## Current State Analysis

The adoption of ${topic} across UK enterprises is accelerating, driven by the need for competitive advantage, operational efficiency, and digital transformation. However, many organisations face significant challenges in implementation, including:

- Complex technical requirements and integration challenges
- Skills gaps and resource constraints
- Compliance and security considerations
- Cost management and ROI optimisation

## ContainerCode Advisory's Approach

Our comprehensive methodology addresses these challenges through:

### 1. Discovery & Assessment Phase
- Current state analysis and gap identification
- Technology stack audit and security assessment
- Business requirement gathering and stakeholder alignment
- Risk assessment and compliance review

### 2. Strategy & Design Phase
- Solution architecture and technology selection
- Implementation roadmap with phased delivery
- Cost-benefit analysis and ROI projections
- Risk mitigation and contingency planning

### 3. Implementation & Delivery Phase
- Agile delivery with continuous client collaboration
- Proof of concept and pilot programme execution
- Knowledge transfer and skills development
- Quality assurance and testing protocols

### 4. Optimisation & Support Phase
- Performance monitoring and continuous improvement
- Ongoing support and maintenance services
- Regular health checks and security reviews
- Scaling and enhancement planning

## Key Service Offerings

ContainerCode Advisory specialises in:

**Cloud Infrastructure & Migration Services**
- AWS, Azure, GCP multi-cloud strategy development
- Kubernetes and containerisation deployment
- Infrastructure as Code (Terraform, CloudFormation)
- Cloud cost optimisation and governance

**Cybersecurity & Compliance Consulting**
- Zero Trust security framework implementation
- SOC 2, GDPR, ISO 27001 compliance guidance
- Security architecture and risk assessment
- Incident response and threat detection systems

**DevOps Transformation & Automation**
- CI/CD pipeline design and implementation
- Infrastructure automation and monitoring
- Site reliability engineering (SRE) practices
- DevSecOps integration and security automation

**Digital Transformation Strategy**
- Enterprise architecture and technology roadmaps
- Change management and organisational transformation
- Technology due diligence and vendor selection
- Business process optimisation and automation

## Next Steps

For organisations looking to leverage ${topic} effectively:

1. **Conduct a Strategic Assessment**: Evaluate current capabilities and identify gaps
2. **Develop a Comprehensive Roadmap**: Create a phased implementation plan
3. **Ensure Proper Governance**: Implement security, compliance, and cost controls
4. **Invest in Skills Development**: Build internal capabilities through training
5. **Partner with Experts**: Engage experienced consultants for guidance and support

## Conclusion

Success with ${topic} requires a strategic, methodical approach that aligns technology initiatives with business objectives. ContainerCode Advisory's proven methodology and deep expertise help organisations navigate this complex landscape and achieve measurable results.

Contact ContainerCode Advisory today to learn how we can help your organisation succeed with ${topic}.

---

*This analysis is provided by ContainerCode Advisory, your trusted partner for enterprise technology consulting. For more information about our services, visit containercode.club or contact our team directly.*`;
  },

  /**
   * Calculate reading time in minutes
   * @param {string} content - Article content
   * @returns {number} Reading time in minutes
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerMinute);
  },

  /**
   * Count words in content
   * @param {string} content - Article content
   * @returns {number} Word count
   */
  countWords(content) {
    return content.trim().split(/\s+/).length;
  },

  /**
   * Get job statistics
   * @param {Object} env - Environment bindings
   * @returns {Promise<Object>} Job statistics
   */
  async getJobStats(env) {
    const recentJobs = await env.DB.prepare(`
      SELECT * FROM cron_logs 
      WHERE job_name = 'article-generation' 
      ORDER BY start_time DESC 
      LIMIT 10
    `).all();

    const articleCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM articles
    `).first();

    const todaysArticles = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM articles 
      WHERE DATE(created_at) = DATE('now')
    `).first();

    return {
      total_articles: articleCount.count,
      todays_articles: todaysArticles.count,
      recent_jobs: recentJobs.results
    };
  }
};