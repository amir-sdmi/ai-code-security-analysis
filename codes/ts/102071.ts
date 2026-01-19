import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeWebsite } from './scraper';
import { EnhancedAnalyzer } from './analyzer';
import { analyzeFigmaDesignSystem, extractFileIdFromUrl, initializeFigmaClient } from './figma';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 全局缓存
let analysisCache: any = null;

// 全局Figma客户端
let figmaClient: any = null;

// 原有的网站分析路由（保持向后兼容）
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Analyzing website: ${url}`);
    const result = await scrapeWebsite(url);
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing website:', error);
    res.status(500).json({ 
      error: 'Failed to analyze website: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// 新的文件分析路由
app.post('/api/analyze-files', async (req, res) => {
  try {
    const { html, css } = req.body;
    
    if (!html || !css) {
      return res.status(400).json({ error: 'HTML and CSS content are required' });
    }

    console.log('Starting file analysis...');
    console.log(`HTML content length: ${html.length} characters`);
    console.log(`CSS content length: ${css.length} characters`);

    const analyzer = new EnhancedAnalyzer(process.env.DEEPSEEK_API_KEY || '');
    const analysis = await analyzer.analyzeFiles(html, css);
    
    // 更新缓存
    analysisCache = analysis;
    
    res.json(analysis);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error analyzing files:', errorMessage);
    res.status(500).json({ error: 'Failed to analyze files' });
  }
});

// 新的Figma分析路由
app.post('/api/analyze-figma', async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({ error: 'Figma URL is required' });
    }

    console.log(`Starting Figma analysis for: ${figmaUrl}`);
    
    // 从URL提取文件ID
    const fileId = extractFileIdFromUrl(figmaUrl);
    console.log(`Extracted file ID: ${fileId}`);
    
    // 使用环境变量中的Figma token
    const figmaToken = process.env.FIGMA_TOKEN;
    
    if (!figmaToken) {
      return res.status(400).json({ error: 'FIGMA_TOKEN environment variable is required' });
    }
    
    // 初始化Figma客户端
    if (!figmaClient) {
      figmaClient = initializeFigmaClient(figmaToken);
    }
    
    // 分析Figma设计系统
    const analysis = await analyzeFigmaDesignSystem(fileId, figmaToken);
    
    // 更新缓存
    analysisCache = analysis;
    
    console.log('Figma analysis completed successfully');
    res.json(analysis);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error analyzing Figma file:', errorMessage);
    res.status(500).json({ error: `Failed to analyze Figma file: ${errorMessage}` });
  }
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 默认路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Web Component Generator API',
    version: '2.0.0',
    endpoints: {
      'POST /api/analyze': 'Analyze website by URL (legacy)',
      'POST /api/analyze-files': 'Analyze HTML and CSS files',
      'POST /api/analyze-figma': 'Analyze Figma design file',
      'GET /health': 'Health check'
    }
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, analysisData } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use provided analysis data if cache is empty, or fall back to cache
    let designSpecs = analysisCache;
    if (!designSpecs && analysisData) {
      designSpecs = analysisData;
      console.log('Using analysis data from request body');
    }

    if (!designSpecs) {
      return res.status(400).json({ error: 'No design analysis found. Please analyze a website or upload files first.' });
    }

    console.log(`Generating component with prompt: ${prompt}`);
    
    // 调用AI生成函数
    const generatedComponent = await generateComponentWithAI(prompt, designSpecs);
    
    res.json({
      html: generatedComponent.html,
      css: generatedComponent.css,
      description: generatedComponent.description
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating component:', errorMessage);
    res.status(500).json({ error: 'Failed to generate component' });
  }
});

// AI生成函数
async function generateComponentWithAI(prompt: string, designSpecs: any) {
  // 提取所有可用的颜色
  const getAllColors = () => {
    const allColors: string[] = [];
    
    // 从颜色分类中提取所有颜色
    if (designSpecs.colors) {
      Object.values(designSpecs.colors).forEach((colorArray: any) => {
        if (Array.isArray(colorArray)) {
          allColors.push(...colorArray);
        }
      });
    }
    
    return allColors;
  };

  // 提取主要设计元素
  const extractDesignTokens = () => {
    const tokens = {
      colors: getAllColors(),
      fonts: designSpecs.typography?.fonts || [],
      fontSizes: designSpecs.typography?.sizes || [],
      fontWeights: designSpecs.typography?.weights || [],
      letterSpacings: designSpecs.typography?.letterSpacings || [],
      lineHeights: designSpecs.typography?.lineHeights || [],
      spacing: designSpecs.spacing || [],
      padding: designSpecs.padding || [],
      borderRadius: designSpecs.borderRadius || [],
      shadows: designSpecs.shadows || [],
      gradients: designSpecs.gradients || []
    };
    
    return tokens;
  };

  const designTokens = extractDesignTokens();

  // 构建智能AI prompt
  const aiPrompt = `
You are an expert frontend developer specializing in creating components that perfectly match existing design systems. Generate HTML and CSS code based on the analyzed Figma design specifications.

## 📋 FIGMA DESIGN SYSTEM ANALYSIS:
**Source**: ${designSpecs.fileName || 'Figma Design File'}
**Components Available**: ${designSpecs.components || 0} components
**Styles Available**: ${designSpecs.styles || 0} styles
**Last Modified**: ${designSpecs.lastModified || 'Recent'}

### 🎨 Color Categories & Usage Guidelines:
**Primary Colors** (Main brand elements, CTA buttons, headers): ${designSpecs.colors?.primary?.join(', ') || 'Use standard primary colors'}
**Secondary Colors** (Supporting elements, secondary buttons): ${designSpecs.colors?.secondary?.join(', ') || 'Use standard secondary colors'}
**Background Colors** (Page backgrounds, card backgrounds): ${designSpecs.colors?.background?.join(', ') || 'Use standard background colors'}
**Text Colors** (Main text, headings, body content): ${designSpecs.colors?.text?.join(', ') || 'Use standard text colors'}
**Accent Colors** (Highlights, links, active states): ${designSpecs.colors?.accent?.join(', ') || 'Use standard accent colors'}
**Error/Warning Colors** (Error states, warnings, alerts): ${designSpecs.colors?.error?.join(', ') || 'Use standard error colors'}

### ✍️ Typography System:
**Font Priority** (Use in order of preference): ${designTokens.fonts.slice(0, 5).join(' → ')}
**Font Size Hierarchy** (Large to Small): ${designTokens.fontSizes.slice(0, 8).join(' → ')}
**Font Weight Options**: ${designTokens.fontWeights.slice(0, 5).join(', ')}
**Letter Spacing Values**: ${designTokens.letterSpacings.slice(0, 5).join(', ')}
**Line Height Options**: ${designTokens.lineHeights.slice(0, 5).join(', ')}

### 📏 Spacing & Layout System:
**Available Spacing Values**: ${designTokens.spacing.slice(0, 8).join(', ')}
**Available Padding Values**: ${designTokens.padding.slice(0, 8).join(', ')}

### 🎨 Visual Effects & Styling:
**Border Radius Options**: ${designTokens.borderRadius.slice(0, 8).join(', ')}
**Shadow Effects**: ${designTokens.shadows.slice(0, 3).join(' | ')}

### 🌈 Gradient Options:
${designTokens.gradients.length > 0 ? designTokens.gradients.slice(0, 5).join('\n') : 'No gradients detected - use solid colors'}

## 🎯 USER COMPONENT REQUEST:
"${prompt}"

## 💡 GENERATION INSTRUCTIONS:

### Color Usage Strategy:
1. **Primary colors** → Main buttons, key headings, brand elements
2. **Secondary colors** → Secondary buttons, supporting text, borders
3. **Background colors** → Container backgrounds, sections, cards
4. **Text colors** → All text content, ensure readability
5. **Accent colors** → Links, hover states, highlights, active elements
6. **Error colors** → Form validation, warning messages, error states

### Typography Application:
- Use the **first available font** as primary font-family
- Apply **largest font sizes** for main headings (h1, h2)
- Use **medium font sizes** for subheadings and important text
- Apply **smaller font sizes** for body text and descriptions
- Use **font weights** from the available options for hierarchy
- Apply **letter spacing** values for refined typography
- Use **line height** values from the system for optimal readability

### Spacing & Layout Guidelines:
- Use **larger spacing values** for section separations
- Apply **medium spacing** for element gaps and margins
- Use **smaller spacing** for tight layouts and padding
- Maintain consistent rhythm throughout the component

### Visual Effects & Styling:
- Use **border radius** values from the system for rounded corners
- Apply **shadow effects** from the Figma design for depth and elevation
- Combine shadows with appropriate colors for consistent theming
- Use border radius consistently across similar elements

### CSS Best Practices:
- Use CSS custom properties (--color-name) for colors when possible
- Apply CSS Grid or Flexbox for responsive layouts
- Include hover/focus states for interactive elements
- Add smooth transitions for better UX (transition: all 0.2s ease)
- Ensure accessibility with proper contrast ratios
- Use semantic HTML5 elements
- Apply **exact font-weight values** from the Figma system
- Use **exact letter-spacing values** from the design tokens
- Apply **exact line-height values** for consistent typography
- Use **exact border-radius values** from the system
- Apply **exact shadow values** from the Figma design

### Responsive Design:
- Mobile-first approach with min-width media queries
- Flexible layouts that adapt to different screen sizes
- Scalable font sizes and spacing
- Touch-friendly interaction areas (min 44px)

## 📤 REQUIRED OUTPUT FORMAT:

Return **ONLY** valid JSON in this exact structure:

{
  "html": "<!-- COMPLETE HTML STRUCTURE: Use semantic HTML5 elements, proper nesting, accessibility attributes (alt, aria-label, role), and meaningful class names -->",
  "css": "/* COMPLETE CSS STYLES: Include all necessary properties, responsive design, hover states, transitions, and comments explaining color choices */",
  "description": "Brief explanation of design choices, color usage rationale, and how the component aligns with the analyzed design system"
}

## ⚠️ CRITICAL REQUIREMENTS:
- Use ONLY colors from the provided Figma categories
- Apply fonts in the specified priority order
- Use spacing/padding values from the Figma analysis
- Apply font weights, letter spacing, and line heights from the system
- Use border radius values from the Figma design
- Apply shadow effects from the Figma design tokens
- Include "/glue.jpg" for any image sources
- Ensure the component is production-ready
- Make it fully responsive and accessible
- Add proper CSS comments explaining design decisions

Generate a modern, beautiful, and functional component that perfectly matches the analyzed Figma design system!
`;

  // 使用DeepSeek API
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  // 添加 API 密钥验证和掩码日志
  const maskedApiKey = deepseekApiKey.substring(0, 7) + '...' + deepseekApiKey.substring(deepseekApiKey.length - 4);
  console.log(`Using DeepSeek API with key: ${maskedApiKey}`);

  try {
    console.log('Calling DeepSeek API for generation...');
    const aiResponse = await callDeepSeekAPI(aiPrompt, deepseekApiKey);
    console.log('DeepSeek API response received successfully');
    return aiResponse;
  } catch (error) {
    console.error('DeepSeek API failed:', error);
    
    // 更详细的错误信息
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw new Error(`Failed to generate component with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// DeepSeek API调用函数
async function callDeepSeekAPI(prompt: string, apiKey: string) {
  console.log('Preparing DeepSeek API request...');
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'You are an expert frontend developer who specializes in creating beautiful, responsive web components. Always return valid JSON in the exact format requested.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  console.log('Request body prepared, making API call...');
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`DeepSeek API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error response: ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    console.log('DeepSeek API response parsed successfully');
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content in DeepSeek response:', JSON.stringify(data, null, 2));
      throw new Error('No content received from DeepSeek');
    }

    console.log('Content received from DeepSeek, parsing JSON...');
    
    // 尝试解析JSON响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('JSON parsed successfully');
        return parsedResult;
      } else {
        console.error('No JSON found in DeepSeek response:', content);
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response as JSON:', content);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON response from DeepSeek');
    }
  } catch (fetchError) {
    console.error('Network error calling DeepSeek API:', fetchError);
    throw fetchError;
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API endpoints:`);
  console.log(`  POST http://localhost:${port}/api/analyze - Website analysis`);
  console.log(`  POST http://localhost:${port}/api/analyze-files - File analysis`);
  console.log(`  POST http://localhost:${port}/api/analyze-figma - Figma analysis`);
  console.log(`  GET http://localhost:${port}/health - Health check`);
}); 