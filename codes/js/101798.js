const puppeteer = require('puppeteer')

async function testSingleImageExtraction(adUrl) {
  let browser = null
  
  try {
    console.log('🧪 Testing single image extraction for:', adUrl)
    
    browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1366,768'
      ],
      defaultViewport: { width: 1366, height: 768 }
    })

    const page = await browser.newPage()
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    console.log('📱 Navigating to ad URL...')
    await page.goto(adUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 8000))
    
    // Extract single main ad image using our updated 3-strategy logic
    const result = await page.evaluate(() => {
      console.log('🔍 Starting single image extraction with 3-strategy approach...')
      
      const container = document.body
      let mainAdImage = null
      
      // Strategy 1: Look for Facebook's standard ad creative containers (as suggested by ChatGPT)
      const adCreativeSelectors = [
        '[data-testid=\"ad-creative\"] img',
        '[data-testid=\"ad-preview-visual\"] img',
        '[data-testid=\"ad-image\"] img',
        '.x1n2onr6 img'
      ]
      
      for (const selector of adCreativeSelectors) {
        const creativeImages = Array.from(container.querySelectorAll(selector))
        console.log(`Strategy 1 - Checking ${selector}: found ${creativeImages.length} images`)
        
        if (creativeImages.length > 0) {
          for (const img of creativeImages) {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original')
            if (src && src.includes('scontent') && src.includes('fbcdn.net') && 
                !src.includes('emoji') && !src.includes('profile') && !src.includes('icon')) {
              try {
                mainAdImage = decodeURIComponent(src)
                console.log(`✅ Found ad creative image using ${selector}`)
                break
              } catch (e) {
                continue
              }
            }
          }
          if (mainAdImage) break
        }
      }
      
      // Strategy 2: Look for the main ad link containers (our previous approach)
      if (!mainAdImage) {
        console.log('🔄 Strategy 2 - Checking ad link containers...')
        const adLinkContainers = Array.from(container.querySelectorAll('a.x1hl2dhg.x1lku1pv, a[href*=\"l.facebook.com\"]'))
        console.log(`Found ${adLinkContainers.length} ad link containers`)
        
        for (const linkContainer of adLinkContainers.slice(0, 3)) {
          const images = Array.from(linkContainer.querySelectorAll('img'))
          console.log(`  Checking container with ${images.length} images`)
          
          for (const img of images) {
            const sources = [
              img.src,
              img.getAttribute('data-src'),
              img.getAttribute('data-original'),
              img.srcset?.split(',')[0]?.split(' ')[0]
            ].filter(Boolean)
            
            const src = sources[0]
            if (!src) continue
            
            // Must be Facebook CDN and exclude obvious non-ad content
            if (!src.includes('scontent') || !src.includes('fbcdn.net')) continue
            if (src.includes('emoji') || src.includes('data:image') || 
                src.includes('profile') || src.includes('icon') || 
                src.includes('avatar') || src.includes('logo') ||
                src.includes('_40x40') || src.includes('_24x24')) continue
            
            try {
              const decodedSrc = decodeURIComponent(src)
              
              // Prioritize larger format images
              if (decodedSrc.includes('_s600x600') || decodedSrc.includes('_n.jpg') || decodedSrc.includes('_o.jpg')) {
                console.log(`✅ Found primary ad image: ${decodedSrc.includes('_s600x600') ? '600x600' : 'original'} format`)
                mainAdImage = decodedSrc
                break
              }
              
              // Backup: accept 400x400
              if (!mainAdImage && (decodedSrc.includes('_s400x400') || decodedSrc.includes('_s320x320'))) {
                console.log(`📸 Found backup ad image: ${decodedSrc.includes('_s400x400') ? '400x400' : '320x320'} format`)
                mainAdImage = decodedSrc
              }
              
            } catch (e) {
              // Skip if can't decode
            }
          }
          
          // If we found a high-quality image, stop searching
          if (mainAdImage && (mainAdImage.includes('_s600x600') || mainAdImage.includes('_n.jpg'))) {
            break
          }
        }
      }
      
      // Strategy 3: Broader search for any large Facebook images (final fallback)
      if (!mainAdImage) {
        console.log('🔄 Strategy 3 - Broader search for large Facebook images...')
        const allImages = Array.from(container.querySelectorAll('img'))
        const largeImages = []
        
        for (const img of allImages) {
          const src = img.src || img.getAttribute('data-src')
          if (src && src.includes('scontent') && src.includes('fbcdn.net') && 
              !src.includes('emoji') && !src.includes('profile') && !src.includes('icon') &&
              !src.includes('_40x40') && !src.includes('_24x24')) {
            try {
              const decodedSrc = decodeURIComponent(src)
              
              // Only consider large images
              if (decodedSrc.includes('_s600x600') || decodedSrc.includes('_s400x400') || 
                  decodedSrc.includes('_n.jpg') || decodedSrc.includes('_o.jpg')) {
                largeImages.push(decodedSrc)
              }
            } catch (e) {
              // Skip
            }
          }
        }
        
        if (largeImages.length > 0) {
          // Prefer 600x600, then original, then 400x400
          mainAdImage = largeImages.find(img => img.includes('_s600x600')) ||
                       largeImages.find(img => img.includes('_n.jpg') || img.includes('_o.jpg')) ||
                       largeImages[0]
          console.log(`📸 Found fallback large image: ${largeImages.length} candidates, selected best quality`)
        }
      }
      
      return {
        success: !!mainAdImage,
        mainImage: mainAdImage,
        strategies: {
          strategy1Count: adCreativeSelectors.reduce((sum, selector) => 
            sum + container.querySelectorAll(selector).length, 0),
          strategy2Count: container.querySelectorAll('a.x1hl2dhg.x1lku1pv, a[href*=\"l.facebook.com\"]').length,
          strategy3Count: container.querySelectorAll('img').length
        }
      }
    })
    
    console.log('\n✅ EXTRACTION RESULTS:')
    console.log('Success:', result.success)
    console.log('Strategies used:')
    console.log('  Strategy 1:', result.strategies.strategy1Count)
    console.log('  Strategy 2:', result.strategies.strategy2Count)
    console.log('  Strategy 3:', result.strategies.strategy3Count)
    if (result.mainImage) {
      console.log('Main ad image found:')
      console.log('  URL:', result.mainImage.substring(0, 100) + '...')
      console.log('  Quality:', result.mainImage.includes('_s600x600') ? '600x600 (High)' : 
                                result.mainImage.includes('_s400x400') ? '400x400 (Medium)' : 'Original')
    } else {
      console.log('❌ No main ad image found')
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
    
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test with the specific ad that should return only 1 image
const testUrl = 'https://www.facebook.com/ads/library/?id=1835764217158523'
testSingleImageExtraction(testUrl)
  .then(result => {
    console.log('\n🎯 FINAL TEST RESULT:', result.success ? 'PASS' : 'FAIL')
    process.exit(0)
  })
  .catch(err => {
    console.error('Test error:', err)
    process.exit(1)
  }) 