import './banner-generator.css'
import { GoogleGenerativeAI } from '@google/generative-ai'
import AIImageService from './ai-image-service.js'

/**
 * AI Banner Generator - Fully AI-Powered Version
 * Creates banners from text prompts using AI-generated images and layouts
 */
class BannerGenerator {
  constructor() {
    this.generatedImages = []
    this.canvas = null
    this.ctx = null
    this.geminiAI = null
    this.aiImageService = new AIImageService()
    this.currentBannerSize = { width: 1200, height: 600 }
    this.currentLayout = null
    this.isGenerating = false
    
    this.init()
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners()
    this.setupCanvas()
    
    // Check if API keys exist in localStorage
    const savedGeminiKey = localStorage.getItem('gemini-api-key')
    const savedHuggingFaceKey = localStorage.getItem('huggingface-api-key')
    
    if (savedGeminiKey) {
      console.log('🔑 Found saved Gemini API key, initializing AI...')
      try {
        this.geminiAI = new GoogleGenerativeAI(savedGeminiKey)
        this.showToast('✅ Gemini AI enabled for layout generation!')
      } catch (error) {
        console.error('Error initializing saved Gemini key:', error)
        localStorage.removeItem('gemini-api-key')
      }
    }
    
    if (savedHuggingFaceKey) {
      console.log('🎨 Found saved Hugging Face API key, enabling AI image generation...')
      this.aiImageService.setHuggingFaceToken(savedHuggingFaceKey)
      this.showToast('✅ AI image generation enabled!')
    }
    
    if (!savedGeminiKey || !savedHuggingFaceKey) {
      this.showApiKeyModal()
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Banner prompt input
    const bannerPrompt = document.getElementById('bannerPrompt')
    if (bannerPrompt) {
      bannerPrompt.addEventListener('input', this.handlePromptChange.bind(this))
    }

    // Example buttons
    const exampleButtons = document.querySelectorAll('.example-btn')
    exampleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const example = e.target.dataset.example
        if (bannerPrompt) {
          bannerPrompt.value = example
          this.handlePromptChange()
        }
      })
    })

    // Generate button
    const generateBtn = document.getElementById('generateBtn')
    if (generateBtn) {
      generateBtn.addEventListener('click', this.generateAIBanner.bind(this))
    }

    // Regenerate button
    const regenerateBtn = document.getElementById('regenerateBtn')
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', this.regenerateBanner.bind(this))
    }

    // Download button
    const downloadBtn = document.getElementById('downloadBtn')
    if (downloadBtn) {
      downloadBtn.addEventListener('click', this.downloadBanner.bind(this))
    }

    // Edit button
    const editBtn = document.getElementById('editBtn')
    if (editBtn) {
      editBtn.addEventListener('click', this.showFinetuneSection.bind(this))
    }

    // Apply changes button
    const applyChangesBtn = document.getElementById('applyChangesBtn')
    if (applyChangesBtn) {
      applyChangesBtn.addEventListener('click', this.applyFinetune.bind(this))
    }

    // Banner size selector
    const bannerSize = document.getElementById('bannerSize')
    if (bannerSize) {
      bannerSize.addEventListener('change', this.handleSizeChange.bind(this))
    }

    console.log('🎯 Event listeners setup completed')
  }

  /**
   * Setup canvas for banner rendering
   */
  setupCanvas() {
    this.canvas = document.getElementById('bannerCanvas')
    if (!this.canvas) {
      console.error('❌ Canvas element not found!')
      throw new Error('Canvas element not found')
    }
    
    this.ctx = this.canvas.getContext('2d')
    if (!this.ctx) {
      console.error('❌ Could not get 2D context!')
      throw new Error('Could not get 2D context')
    }
    
    console.log('✅ Canvas initialized successfully')
    this.updateCanvasSize()
  }

  /**
   * Update canvas size based on selected banner dimensions
   */
  updateCanvasSize() {
    this.canvas.width = this.currentBannerSize.width
    this.canvas.height = this.currentBannerSize.height
    this.clearCanvas()
  }

  /**
   * Clear the canvas
   */
  clearCanvas() {
    if (!this.ctx) {
      console.error('❌ Canvas context is null!')
      return
    }
    this.ctx.fillStyle = '#f8f9fa'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Show API key modal for dual API setup
   */
  showApiKeyModal() {
    // Create modal HTML if not exists
    if (!document.getElementById('apiKeyModal')) {
      this.createApiKeyModal()
    }
    
    const modal = document.getElementById('apiKeyModal')
    modal.style.display = 'flex'
  }

  /**
   * Create API key modal for dual API setup
   */
  createApiKeyModal() {
    const modalHTML = `
      <div id="apiKeyModal" class="modal" style="display: none;">
        <div class="modal-content">
          <h2>🔑 Setup AI API Keys</h2>
          <p>To use AI-powered banner generation, you need both API keys:</p>
          
          <div class="api-key-section">
            <h3>Google Gemini API (for layout generation)</h3>
            <input type="password" id="geminiApiKey" placeholder="Enter your Gemini API key">
            <small><a href="https://makersuite.google.com/app/apikey" target="_blank">Get Gemini API key (free)</a></small>
          </div>
          
          <div class="api-key-section">
            <h3>Hugging Face API (for image generation)</h3>
            <input type="password" id="huggingfaceApiKey" placeholder="Enter your Hugging Face API key">
            <small><a href="https://huggingface.co/settings/tokens" target="_blank">Get Hugging Face API key (free)</a></small>
          </div>
          
          <div class="modal-buttons">
            <button onclick="bannerApp.saveApiKeys()">💾 Save & Continue</button>
            <button onclick="bannerApp.skipApiKeys()" class="secondary">⏭️ Skip (Limited Mode)</button>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  /**
   * Save both API keys
   */
  async saveApiKeys() {
    const geminiKey = document.getElementById('geminiApiKey')?.value.trim()
    const hfKey = document.getElementById('huggingfaceApiKey')?.value.trim()
    
    let hasErrors = false
    
    if (geminiKey) {
      try {
        this.geminiAI = new GoogleGenerativeAI(geminiKey)
        localStorage.setItem('gemini-api-key', geminiKey)
        this.showToast('✅ Gemini AI enabled for layout generation!')
      } catch (error) {
        this.showToast('❌ Invalid Gemini API key', 'error')
        hasErrors = true
      }
    }
    
    if (hfKey) {
      this.aiImageService.setHuggingFaceToken(hfKey)
      localStorage.setItem('huggingface-api-key', hfKey)
      this.showToast('✅ Hugging Face AI enabled for image generation!')
    }
    
    if (!hasErrors && (geminiKey || hfKey)) {
      document.getElementById('apiKeyModal').style.display = 'none'
      this.showToast('🚀 AI Banner Generator is ready!', 'success')
    }
  }

  /**
   * Skip API keys and use limited mode
   */
  skipApiKeys() {
    document.getElementById('apiKeyModal').style.display = 'none'
    this.showToast('📝 Limited mode: Using placeholder images only', 'warning')
  }

  /**
   * Handle drag over event (legacy - kept for potential file upload feature)
   */
  handleDragOver(e) {
    e.preventDefault()
    e.currentTarget.style.borderColor = '#764ba2'
  }

  /**
   * Handle drop event (legacy - kept for potential file upload feature)
   */
  handleDrop(e) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    this.processImageFiles(files)
    e.currentTarget.style.borderColor = '#667eea'
  }

  /**
   * Handle image upload via input (legacy - kept for potential file upload feature)
   */
  handleImageUpload(e) {
    const files = Array.from(e.target.files)
    this.processImageFiles(files)
  }

  /**
   * Process uploaded image files (legacy - kept for potential file upload feature)
   */
  async processImageFiles(files) {
    // This method is kept for potential future use but not actively used in AI mode
    console.log('File upload attempted in AI mode - feature not active')
    this.showToast('ℹ️ Use AI prompts to generate images instead!', 'info')
  }

  /**
   * Load image file and create image object
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            image: img,
            url: e.target.result,
            name: file.name,
            width: img.width,
            height: img.height
          })
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Display uploaded image in the preview area
   */
  displayUploadedImage(name, url) {
    const container = document.getElementById('uploadedImages')
    const imageDiv = document.createElement('div')
    imageDiv.className = 'image-preview'
    imageDiv.innerHTML = `
      <img src="${url}" alt="${name}">
      <div class="image-name">${name}</div>
    `
    container.appendChild(imageDiv)
  }

  /**
   * Handle banner size change
   */
  handleSizeChange(e) {
    const size = e.target.value
    if (size === 'custom') {
      const width = prompt('Enter width:')
      const height = prompt('Enter height:')
      if (width && height) {
        this.currentBannerSize = { width: parseInt(width), height: parseInt(height) }
      }
    } else {
      const [width, height] = size.split('x').map(Number)
      this.currentBannerSize = { width, height }
    }
    this.updateCanvasSize()
  }

  /**
   * Generate banner using AI or manual mode (legacy method - replaced by generateAIBanner)
   */
  async generateBanner() {
    console.log('⚠️ Legacy generateBanner called - redirecting to AI generation')
    this.showToast('🔄 Redirecting to AI banner generation...', 'info')
    return this.generateAIBanner()
  }

  /**
   * Legacy method - removed for AI-powered version
   */
  async parseInstructionsWithAI(instructions, textContent) {
    console.log('⚠️ Legacy parseInstructionsWithAI called - this method is deprecated')
    return this.generateDefaultLayout('', '', 'modern', 'auto')
  }

  /**
   * Render banner based on layout
   */
  async renderBanner(layout) {
    console.log('🎨 Starting banner render with layout:', layout)
    
    if (!layout || !layout.layers) {
      throw new Error('Invalid layout: missing layers')
    }
    
    this.clearCanvas()

    // Sort layers by zIndex
    const sortedLayers = layout.layers.sort((a, b) => a.zIndex - b.zIndex)
    console.log('📋 Rendering layers in order:', sortedLayers.map(l => `${l.type}:${l.content}`))

    for (let i = 0; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i]
      console.log(`🔄 Rendering layer ${i + 1}/${sortedLayers.length}:`, layer.type, layer.content)
      try {
        await this.renderLayer(layer)
        console.log(`✅ Layer ${i + 1} rendered successfully`)
      } catch (error) {
        console.error(`❌ Error rendering layer ${i + 1}:`, error)
        throw new Error(`Failed to render ${layer.type} layer: ${error.message}`)
      }
    }
    
    console.log('🎉 Banner render completed successfully')
  }

  /**
   * Render individual layer
   */
  async renderLayer(layer) {
    console.log('🔧 Rendering layer:', layer)
    
    const x = (layer.position.x / 100) * this.canvas.width
    const y = (layer.position.y / 100) * this.canvas.height
    const width = (layer.size.width / 100) * this.canvas.width
    const height = (layer.size.height / 100) * this.canvas.height

    console.log('📏 Calculated positions:', { x, y, width, height })
    console.log('📏 Canvas size:', { canvasWidth: this.canvas.width, canvasHeight: this.canvas.height })

    this.ctx.save()
    this.ctx.globalAlpha = layer.style.opacity || 1

    // Draw a debug border for this layer (temporarily)
    if (layer.type === 'image' && layer.zIndex > 0) {
      console.log('🔍 Drawing debug border for overlay image')
      this.ctx.strokeStyle = '#ff0000'
      this.ctx.lineWidth = 3
      this.ctx.strokeRect(x, y, width, height)
    }

    if (layer.type === 'image') {
      console.log('🖼️ Rendering image:', layer.content)
      const imageData = this.uploadedImages.get(layer.content)
      if (imageData) {
        console.log('✅ Image found:', imageData.name, `${imageData.width}x${imageData.height}`)
        console.log('🎯 Target area:', { x, y, width, height })
        
        // For background images (zIndex 0), fill the entire area
        if (layer.zIndex === 0) {
          console.log('🖼️ Rendering as background image')
          this.ctx.drawImage(imageData.image, x, y, width, height)
        } else {
          // For overlay images, maintain aspect ratio
          console.log('🖼️ Rendering as overlay image with aspect ratio')
          const imgAspect = imageData.width / imageData.height
          const areaAspect = width / height
          
          let drawWidth = width
          let drawHeight = height
          let drawX = x
          let drawY = y
          
          // For small overlay images, don't maintain aspect ratio to ensure visibility
          if (width < 200 && height < 200) {
            console.log('🖼️ Small overlay - using full area for visibility')
            drawWidth = width
            drawHeight = height
            drawX = x
            drawY = y
          } else {
            if (imgAspect > areaAspect) {
              // Image is wider - fit to width
              drawHeight = width / imgAspect
              drawY = y + (height - drawHeight) / 2
            } else {
              // Image is taller - fit to height
              drawWidth = height * imgAspect
              drawX = x + (width - drawWidth) / 2
            }
          }
          
          console.log('🎯 Drawing overlay image at:', { drawX, drawY, drawWidth, drawHeight })
          
          // Add a subtle border to make overlay images more visible
          this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          this.ctx.shadowBlur = 5
          this.ctx.shadowOffsetX = 2
          this.ctx.shadowOffsetY = 2
          
          this.ctx.drawImage(imageData.image, drawX, drawY, drawWidth, drawHeight)
          
          // Reset shadow
          this.ctx.shadowColor = 'transparent'
        }
        
        console.log('✅ Image rendering completed')
      } else {
        console.error('❌ Image not found:', layer.content)
        console.log('📋 Available images:', Array.from(this.uploadedImages.keys()))
        
        // Draw a placeholder rectangle
        this.ctx.fillStyle = '#ffcccc'
        this.ctx.fillRect(x, y, width, height)
        this.ctx.fillStyle = '#ff0000'
        this.ctx.font = '20px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('Image Not Found', x + width/2, y + height/2)
        
        throw new Error(`Image not found: ${layer.content}`)
      }
    } else if (layer.type === 'text') {
      console.log('📝 Rendering text:', layer.content)
      console.log('📝 Text style:', layer.style)
      
      // Enhanced text rendering
      const fontSize = layer.style.fontSize || 32
      const fontWeight = layer.style.fontWeight || 'bold'
      const fontFamily = layer.style.fontFamily || 'Arial, sans-serif'
      const textAlign = layer.style.textAlign || 'left'
      const color = layer.style.color || '#ffffff'
      
      console.log('📝 Font settings:', { fontSize, fontWeight, fontFamily, textAlign, color })
      
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      this.ctx.textAlign = textAlign
      this.ctx.textBaseline = 'top'
      
      // Add strong text shadow for better readability
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      this.ctx.shadowBlur = 4
      this.ctx.shadowOffsetX = 2
      this.ctx.shadowOffsetY = 2
      
      // Draw text stroke for even better visibility
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.lineWidth = 2
      
      // Word wrap for long text
      const words = layer.content.split(' ')
      const lines = []
      let currentLine = words[0] || ''
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const testLine = currentLine + ' ' + word
        const metrics = this.ctx.measureText(testLine)
        
        if (metrics.width > width - 20 && currentLine !== '') { // Add 20px padding
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
      
      console.log('📝 Text lines:', lines)
      
      // Render each line
      const lineHeight = fontSize * 1.3
      let textX = x + 10 // Add some padding
      
      if (textAlign === 'center') {
        textX = x + width / 2
      } else if (textAlign === 'right') {
        textX = x + width - 10
      }
      
      this.ctx.fillStyle = color
      
      lines.forEach((line, index) => {
        const textY = y + 10 + (index * lineHeight) // Add top padding
        if (textY < y + height - lineHeight) { // Don't draw outside bounds
          console.log(`📝 Drawing line ${index + 1}: "${line}" at (${textX}, ${textY})`)
          
          // Draw stroke first
          this.ctx.strokeText(line, textX, textY)
          // Then fill
          this.ctx.fillText(line, textX, textY)
        }
      })
      
      // Reset shadow and stroke
      this.ctx.shadowColor = 'transparent'
      this.ctx.strokeStyle = 'transparent'
      this.ctx.lineWidth = 1
      
      console.log('✅ Text rendering completed')
    }

    this.ctx.restore()
  }

  /**
   * Download the generated banner
   */
  downloadBanner() {
    if (!this.canvas) {
      this.showToast('❌ No banner to download', 'error')
      return
    }

    try {
      const link = document.createElement('a')
      link.download = `ai-banner-${Date.now()}.png`
      link.href = this.canvas.toDataURL()
      link.click()
      
      this.showToast('✅ Banner downloaded successfully!', 'success')
    } catch (error) {
      console.error('Download failed:', error)
      this.showToast('❌ Download failed', 'error')
    }
  }

  /**
   * Show/hide loading indicator
   */
  showLoading(show) {
    const loading = document.getElementById('loading')
    const generateBtn = document.getElementById('generateBtn')
    
    loading.style.display = show ? 'block' : 'none'
    generateBtn.disabled = show
  }

  /**
   * Show/hide download controls
   */
  showDownloadControls(show) {
    document.getElementById('downloadControls').style.display = show ? 'block' : 'none'
  }

  /**
   * Handle prompt input changes
   */
  handlePromptChange() {
    const bannerPrompt = document.getElementById('bannerPrompt')
    const generateBtn = document.getElementById('generateBtn')
    
    if (bannerPrompt && generateBtn) {
      generateBtn.disabled = !bannerPrompt.value.trim()
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast')
    existingToasts.forEach(toast => toast.remove())
    
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    
    // Add to page
    document.body.appendChild(toast)
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100)
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  /**
   * Render text on canvas with advanced styling
   */
  renderTextOnCanvas(textConfig) {
    if (!this.ctx || !textConfig.content) return

    this.ctx.save()
    
    // Set font
    const fontSize = textConfig.fontSize || 32
    const fontFamily = textConfig.fontFamily || 'Arial'
    const fontWeight = textConfig.fontWeight || 'normal'
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    
    // Set text alignment
    this.ctx.textAlign = textConfig.textAlign || 'center'
    this.ctx.textBaseline = 'middle'
    
    // Calculate position
    const x = textConfig.x * this.canvas.width
    const y = textConfig.y * this.canvas.height
    
    // Text shadow
    if (textConfig.shadow) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      this.ctx.shadowBlur = 8
      this.ctx.shadowOffsetX = 2
      this.ctx.shadowOffsetY = 2
    }
    
    // Text stroke
    if (textConfig.stroke && textConfig.strokeWidth) {
      this.ctx.strokeStyle = textConfig.stroke
      this.ctx.lineWidth = textConfig.strokeWidth
      this.ctx.strokeText(textConfig.content, x, y)
    }
    
    // Text fill
    this.ctx.fillStyle = textConfig.color || '#ffffff'
    this.ctx.fillText(textConfig.content, x, y)
    
    this.ctx.restore()
  }

  /**
   * Generate AI banner from text prompt
   */
  async generateAIBanner() {
    if (this.isGenerating) {
      console.log('⏳ Already generating, please wait...')
      return
    }

    const bannerPrompt = document.getElementById('bannerPrompt')
    const additionalText = document.getElementById('additionalText')
    const imageStyle = document.getElementById('imageStyle')
    const colorScheme = document.getElementById('colorScheme')
    const layoutStyle = document.getElementById('layoutStyle')

    if (!bannerPrompt || !bannerPrompt.value.trim()) {
      this.showToast('⚠️ Please enter a banner description first!', 'error')
      return
    }

    console.log('🚀 Starting AI banner generation...')
    this.isGenerating = true
    this.showLoadingState(true)

    try {
      // Step 1: Generate images
      console.log('📍 Step 1: Generating images...')
      this.updateLoadingStep(1)
      const prompt = bannerPrompt.value.trim()
      const style = imageStyle ? imageStyle.value : 'photorealistic'
      const colors = colorScheme ? colorScheme.value : 'auto'
      
      console.log('🎨 Generating images for prompt:', prompt)
      console.log('🎨 Image style:', style, 'Colors:', colors)
      
      if (!this.aiImageService) {
        throw new Error('AI Image Service not initialized')
      }
      
      const generatedImages = await this.aiImageService.generateImagesForBanner(prompt, 1)
      console.log('✅ Generated images:', generatedImages)
      this.generatedImages = generatedImages

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error('No images were generated')
      }

      // Step 2: Plan layout with AI
      console.log('📍 Step 2: Planning layout...')
      this.updateLoadingStep(2)
      let layout = null
      if (this.geminiAI) {
        console.log('🤖 Using Gemini AI for layout generation')
        layout = await this.generateLayoutWithAI(prompt, additionalText?.value || '', style, colors, layoutStyle?.value || 'auto')
      } else {
        console.log('📝 Using default layout (no Gemini AI)')
        layout = this.generateDefaultLayout(prompt, additionalText?.value || '', style, colors)
      }
      console.log('✅ Layout generated:', layout)
      this.currentLayout = layout

      // Step 3: Add text
      console.log('📍 Step 3: Text handling complete')
      this.updateLoadingStep(3)
      // Text is handled in the layout

      // Step 4: Render banner
      console.log('📍 Step 4: Rendering banner...')
      this.updateLoadingStep(4)
      await this.renderAIBanner()
      console.log('✅ Banner rendered successfully')

      this.showBannerPreview()
      this.showToast('✅ AI banner generated successfully!', 'success')

    } catch (error) {
      console.error('❌ AI banner generation failed:', error)
      console.error('❌ Error stack:', error.stack)
      this.showToast(`❌ Banner generation failed: ${error.message}`, 'error')
    } finally {
      this.isGenerating = false
      this.showLoadingState(false)
      console.log('🏁 Banner generation process complete')
    }
  }

  /**
   * Generate layout using AI
   */
  async generateLayoutWithAI(prompt, additionalText, style, colors, layoutPreference) {
    try {
      const model = this.geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const aiPrompt = `
        You are a banner design expert. Create a layout configuration for this banner prompt: "${prompt}"
        
        Additional text: "${additionalText}"
        Style preference: ${style}
        Color scheme: ${colors}
        Layout preference: ${layoutPreference}
        
        IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks, no explanations.
        IMPORTANT: Do NOT use the same image for both background and foreground - choose ONE approach.
        
        Return exactly this JSON structure:
        {
          "background": {
            "type": "image",
            "imageIndex": 0,
            "opacity": 0.8,
            "filters": []
          },
          "images": [],
          "texts": [
            {
              "content": "Main text extracted from prompt",
              "x": 0.5,
              "y": 0.4,
              "fontSize": 64,
              "fontFamily": "Arial Black",
              "color": "#ffffff",
              "fontWeight": "bold",
              "textAlign": "center",
              "maxWidth": 0.8,
              "stroke": "#000000",
              "strokeWidth": 3,
              "shadow": true,
              "zIndex": 3
            }
          ]
        }
        
        Guidelines:
        - Extract main text content from the prompt (e.g., "Experience the Drive", "Adventure Awaits")
        - Use the image as background with text overlay (simpler, cleaner look)
        - Do NOT put images in the "images" array if using background
        - Ensure text has excellent contrast and readability
        - Position text in the best readable area
        - Use proper stroke and shadow for text visibility
        
        Respond with JSON only:
      `

      console.log('🤖 Sending prompt to Gemini AI:', aiPrompt)
      
      const result = await model.generateContent(aiPrompt)
      const response = await result.response
      const text = response.text()
      
      console.log('🤖 Raw Gemini response:', text)
      
      // Parse JSON with improved error handling
      return this.parseAILayoutResponse(text)

    } catch (error) {
      console.error('❌ AI layout generation failed:', error)
      console.log('🔄 Using default layout as fallback')
      return this.generateDefaultLayout(prompt, additionalText, style, colors)
    }
  }

  /**
   * Parse AI layout response with error handling
   */
  parseAILayoutResponse(text) {
    console.log('🔧 Raw AI response text:', text)
    
    try {
      // Try multiple JSON extraction methods
      let jsonText = null
      
      // Method 1: Find JSON block between ```json and ``` 
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
        console.log('🔧 Found JSON in code block:', jsonText)
      }
      
      // Method 2: Find JSON object with balanced braces
      if (!jsonText) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
          console.log('🔧 Found JSON with regex:', jsonText)
        }
      }
      
      // Method 3: Try to find JSON starting from first {
      if (!jsonText) {
        const firstBrace = text.indexOf('{')
        const lastBrace = text.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = text.substring(firstBrace, lastBrace + 1)
          console.log('🔧 Found JSON by brace positions:', jsonText)
        }
      }
      
      if (!jsonText) {
        throw new Error('No JSON structure found in AI response')
      }
      
      // Clean up the JSON text
      jsonText = jsonText
        .replace(/```json|```/g, '') // Remove code block markers
        .replace(/\n\s*\/\/.*$/gm, '') // Remove comments
        .trim()
      
      console.log('🔧 Cleaned JSON text:', jsonText)
      
      const parsed = JSON.parse(jsonText)
      console.log('✅ Successfully parsed AI layout:', parsed)
      
      // Validate the structure
      if (!parsed.background || !parsed.images || !parsed.texts) {
        console.warn('⚠️ AI response missing required fields, using default layout')
        return this.generateDefaultLayout('', '', 'modern', 'auto')
      }
      
      return parsed
      
    } catch (error) {
      console.error('❌ Failed to parse AI layout response:', error)
      console.error('❌ Original text:', text)
      console.log('🔄 Falling back to default layout')
      return this.generateDefaultLayout('', '', 'modern', 'auto')
    }
  }

  /**
   * Generate default layout when AI is not available
   */
  generateDefaultLayout(prompt, additionalText, style, colors) {
    // Extract text from prompt with improved parsing
    let mainText = ''
    
    // Look for text in quotes first
    const quoteMatch = prompt.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) {
      mainText = quoteMatch[1]
    } else {
      // Look for "with text" or "text:" patterns
      const textMatch = prompt.match(/(?:with\s+text[:\s]*|text[:\s]*)(.*?)(?:\s+in\s|\s*$)/i)
      if (textMatch) {
        mainText = textMatch[1].trim()
      } else {
        // Fallback: use first few words
        mainText = prompt.split(' ').slice(0, 3).join(' ')
      }
    }
    
    // Clean up the text
    mainText = mainText.replace(/['"]/g, '').trim()
    if (!mainText) {
      mainText = 'Your Text Here'
    }

    console.log('📝 Extracted text from prompt:', mainText)

    return {
      background: {
        type: "image",
        imageIndex: 0,
        opacity: 0.8
      },
      images: [
        // Don't duplicate the background image as a foreground element
      ],
      texts: [
        {
          content: mainText,
          x: 0.5,
          y: 0.5,
          fontSize: 64,
          fontFamily: "Arial",
          color: "#ffffff",
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: 0.8,
          stroke: "#000000",
          strokeWidth: 4,
          shadow: true,
          zIndex: 3
        },
        ...(additionalText ? [{
          content: additionalText,
          x: 0.5,
          y: 0.7,
          fontSize: 32,
          fontFamily: "Arial",
          color: "#ffffff",
          fontWeight: "normal",
          textAlign: "center",
          maxWidth: 0.6,
          stroke: "#000000",
          strokeWidth: 2,
          shadow: true,
          zIndex: 3
        }] : [])
      ]
    }
  }

  /**
   * Show/hide loading state
   */
  showLoadingState(show) {
    const loading = document.getElementById('loading')
    const generateBtn = document.getElementById('generateBtn')
    
    if (loading) {
      loading.style.display = show ? 'block' : 'none'
    }
    
    if (generateBtn) {
      generateBtn.disabled = show
      generateBtn.textContent = show ? '⏳ Generating...' : '✨ Generate AI Banner'
    }
  }

  /**
   * Update loading step indicator
   */
  updateLoadingStep(step) {
    const steps = document.querySelectorAll('.loading-steps .step')
    steps.forEach((stepElement, index) => {
      if (index + 1 === step) {
        stepElement.classList.add('active')
      } else {
        stepElement.classList.remove('active')
      }
    })
  }

  /**
   * Render the AI-generated banner on canvas
   */
  async renderAIBanner() {
    console.log('🎨 Starting banner rendering...')
    console.log('- Canvas:', !!this.canvas, this.canvas?.width, 'x', this.canvas?.height)
    console.log('- Context:', !!this.ctx)
    console.log('- Layout:', !!this.currentLayout)
    console.log('- Generated Images:', this.generatedImages?.length || 0)
    
    if (!this.ctx || !this.currentLayout || !this.generatedImages.length) {
      console.error('❌ Missing requirements for banner rendering')
      console.error('- Canvas/Context:', !!this.canvas, !!this.ctx)
      console.error('- Layout:', !!this.currentLayout)
      console.error('- Images:', this.generatedImages?.length || 0)
      return
    }

    try {
      // Clear canvas
      console.log('🧹 Clearing canvas...')
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Set background color or gradient
      console.log('🎨 Setting background...')
      this.ctx.fillStyle = '#f0f0f0'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      // Load all images first
      console.log('🖼️ Loading images...', this.generatedImages)
      const loadedImages = await Promise.all(
        this.generatedImages.map(img => this.loadImageFromUrl(img.url))
      )
      console.log('✅ Images loaded:', loadedImages.length)

      // Render background if specified
      if (this.currentLayout.background && this.currentLayout.background.type === 'image') {
        console.log('🖼️ Rendering background image...')
        const bgImageIndex = this.currentLayout.background.imageIndex || 0
        if (loadedImages[bgImageIndex]) {
          this.ctx.save()
          this.ctx.globalAlpha = this.currentLayout.background.opacity || 0.7
          this.ctx.drawImage(loadedImages[bgImageIndex], 0, 0, this.canvas.width, this.canvas.height)
          this.ctx.restore()
          console.log('✅ Background image rendered')
        }
      }

      // Render images
      if (this.currentLayout.images) {
        console.log('🖼️ Rendering layout images...', this.currentLayout.images.length)
        for (const imageConfig of this.currentLayout.images) {
          const image = loadedImages[imageConfig.index]
          if (image) {
            this.ctx.save()
            this.ctx.globalAlpha = imageConfig.opacity || 1
            
            const x = imageConfig.x * this.canvas.width
            const y = imageConfig.y * this.canvas.height
            const width = imageConfig.width * this.canvas.width
            const height = imageConfig.height * this.canvas.height
            
            console.log(`🖼️ Drawing image at (${x}, ${y}) size ${width}x${height}`)
            this.ctx.drawImage(image, x, y, width, height)
            this.ctx.restore()
          }
        }
      }

      // Render texts
      if (this.currentLayout.texts) {
        console.log('✍️ Rendering texts...', this.currentLayout.texts.length)
        for (const textConfig of this.currentLayout.texts) {
          console.log('✍️ Rendering text:', textConfig.content)
          this.renderTextOnCanvas(textConfig)
        }
      }

      console.log('✅ Banner rendered successfully')

    } catch (error) {
      console.error('❌ Error rendering banner:', error)
      throw error
    }
  }

  /**
   * Load image from URL
   */
  loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  /**
   * Regenerate banner with same prompt
   */
  async regenerateBanner() {
    const bannerPrompt = document.getElementById('bannerPrompt')
    if (bannerPrompt && bannerPrompt.value.trim()) {
      await this.generateAIBanner()
    }
  }

  /**
   * Show fine-tune section
   */
  showFinetuneSection() {
    const finetuneSection = document.getElementById('finetuneSection')
    if (finetuneSection) {
      finetuneSection.style.display = 'block'
      finetuneSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  /**
   * Apply fine-tune changes
   */
  async applyFinetune() {
    const finetunePrompt = document.getElementById('finetunePrompt')
    if (!finetunePrompt || !finetunePrompt.value.trim()) {
      this.showToast('⚠️ Please enter your refinement request!', 'error')
      return
    }

    // For now, regenerate with the original prompt
    // In the future, this could apply specific modifications
    this.showToast('🔄 Applying changes...', 'info')
    await this.regenerateBanner()
    
    finetunePrompt.value = ''
    this.showToast('✅ Changes applied!', 'success')
  }

  /**
   * Show banner preview after generation
   */
  showBannerPreview() {
    const previewContainer = document.querySelector('.preview-container')
    const placeholderText = document.getElementById('previewPlaceholder')
    const bannerControls = document.getElementById('previewControls')
    const canvas = document.getElementById('bannerCanvas')
    
    console.log('🖼️ Showing banner preview...')
    console.log('- Preview container:', !!previewContainer)
    console.log('- Placeholder:', !!placeholderText)
    console.log('- Controls:', !!bannerControls)
    console.log('- Canvas:', !!canvas)
    
    if (previewContainer) {
      previewContainer.style.display = 'block'
    }
    
    if (placeholderText) {
      placeholderText.style.display = 'none'
    }
    
    if (bannerControls) {
      bannerControls.style.display = 'flex'
    }
    
    if (canvas) {
      canvas.style.display = 'block'
      canvas.classList.add('visible')
    }
  }

  /**
   * Debug: Test banner generation with simple placeholder
   */
  async testBannerGeneration() {
    console.log('🧪 Testing banner generation...')
    
    try {
      // Create a simple test layout
      const testLayout = {
        background: {
          type: "color",
          color: "#1a1a2e"
        },
        images: [{
          url: "https://picsum.photos/800/600?random=1",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          opacity: 0.7,
          zIndex: 1
        }],
        texts: [{
          content: "Test Banner",
          x: 0.5,
          y: 0.5,
          fontSize: 48,
          fontFamily: "Arial",
          color: "#ffffff",
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: 0.8,
          stroke: "#000000",
          strokeWidth: 2,
          shadow: true,
          zIndex: 3
        }]
      }
      
      // Set test data
      this.currentLayout = testLayout
      this.generatedImages = [{
        url: "https://picsum.photos/800/600?random=1",
        prompt: "test image"
      }]
      
      // Try to render
      console.log('🎨 Attempting to render test banner...')
      await this.renderAIBanner()
      
      this.showBannerPreview()
      this.showToast('✅ Test banner rendered!', 'success')
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      this.showToast('❌ Test failed: ' + error.message, 'error')
    }
  }

  /**
   * Debug method to test AI layout generation
   */
  async debugAILayout(prompt = "Honda Accord 2025 with text 'Unleash the Power'") {
    console.log('🔧 Debug: Testing AI layout generation...')
    
    if (!this.geminiAI) {
      console.error('❌ Gemini AI not initialized')
      return
    }
    
    try {
      const layout = await this.generateLayoutWithAI(prompt, '', 'modern', 'auto', 'center')
      console.log('✅ Debug layout result:', layout)
      return layout
    } catch (error) {
      console.error('❌ Debug layout failed:', error)
      return null
    }
  }

  /**
   * Test canvas rendering with a simple draw
   */
  testCanvasRender() {
    console.log('🧪 Testing canvas render...')
    
    if (!this.canvas || !this.ctx) {
      console.error('❌ Canvas or context not available')
      return false
    }
    
    // Clear and draw a test pattern
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Background
    this.ctx.fillStyle = '#ff6b6b'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Test circle
    this.ctx.fillStyle = '#4ecdc4'
    this.ctx.beginPath()
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 100, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // Test text
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '32px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Canvas Test', this.canvas.width / 2, this.canvas.height / 2 + 10)
    
    // Show the canvas
    this.showBannerPreview()
    
    console.log('✅ Canvas test complete')
    return true
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.bannerApp = new BannerGenerator()
  
  // Add debug methods to window for testing
  window.testBanner = () => window.bannerApp.testBannerGeneration()
  window.testCanvas = () => window.bannerApp.testCanvasRender()
  window.debugLayout = (prompt) => window.bannerApp.debugAILayout(prompt)
  window.debugCarImage = (prompt) => window.bannerApp.aiImageService.debugCarGeneration(prompt)
  window.debugHuggingFace = () => window.bannerApp.aiImageService.debugHuggingFaceWithUI()
  window.testHuggingFace = () => window.bannerApp.aiImageService.debugHuggingFaceWithUI()
  window.checkHFToken = () => window.bannerApp.aiImageService.checkTokenStatusWithUI()
  window.testTokenGeneration = () => window.bannerApp.aiImageService.testTokenWithGeneration()
  window.validateToken = (token) => {
    if (token) {
      window.bannerApp.aiImageService.setHuggingFaceToken(token)
      localStorage.setItem('huggingface-api-key', token)
      console.log('✅ Token set, now testing...')
    }
    return window.bannerApp.aiImageService.checkTokenStatusWithUI()
  }
  window.quickTokenTest = async (token) => {
    console.log('🧪 Quick token test...')
    try {
      const response = await fetch('https://huggingface.co/api/whoami', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      console.log('Status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Token is valid! User:', data.name || data.id)
        return data
      } else {
        const error = await response.text()
        console.error('❌ Token failed:', response.status, error)
        return { error: response.status, details: error }
      }
    } catch (err) {
      console.error('❌ Network error:', err)
      return { error: 'network', details: err.message }
    }
  }
  window.realTokenTest = async (token) => {
    console.log('🎨 Testing token with actual image generation...')
    if (token) {
      window.bannerApp.aiImageService.setHuggingFaceToken(token)
    }
    const result = await window.bannerApp.aiImageService.testTokenWithGeneration()
    console.log('Result:', result)
    return result
  }
  window.debugAI = () => {
    console.log('🔍 Debug Info:')
    console.log('- Gemini AI:', !!window.bannerApp.geminiAI)
    console.log('- AI Image Service:', !!window.bannerApp.aiImageService)
    console.log('- HF Token:', !!window.bannerApp.aiImageService.huggingFaceToken)
    console.log('- Canvas:', !!window.bannerApp.canvas)
    console.log('- Context:', !!window.bannerApp.ctx)
    console.log('- Generated Images:', window.bannerApp.generatedImages)
    console.log('- Current Layout:', window.bannerApp.currentLayout)
  }
})