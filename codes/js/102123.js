import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Deepseek API client (compatible with OpenAI SDK)
console.log('🔍 Debug: DEEPSEEK_API_KEY exists:', !!process.env.DEEPSEEK_API_KEY)
console.log('🔍 Debug: DEEPSEEK_API_KEY value:', process.env.DEEPSEEK_API_KEY ? `${process.env.DEEPSEEK_API_KEY.substring(0, 6)}...` : 'null')

const deepseek = process.env.DEEPSEEK_API_KEY && 
                 process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here' ? 
  new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
    timeout: 30000, // 30秒超时，适合Deepseek-V3的响应时间
  }) : null

console.log('🔍 Debug: Deepseek client initialized:', !!deepseek)

// Optimization strategies
const optimizationStrategies = {
  comprehensive: {
    name: '综合优化',
    systemPrompt: `你是一个专业的提示词优化专家，擅长使用Deepseek-V3的强大推理能力。请分析用户提供的提示词，并从以下几个方面进行综合优化：
1. 清晰度：确保指令明确、易理解
2. 具体性：增加必要的细节和约束条件  
3. 结构化：优化语言结构和逻辑顺序
4. 有效性：提高获得期望结果的可能性
5. 推理引导：利用链式思考方式引导更好的推理过程

请充分发挥你的推理能力，返回优化后的提示词以及详细的分析报告。`
  },
  clarity: {
    name: '清晰度优化',
    systemPrompt: `你是一个专注于语言清晰度的提示词优化专家，具备Deepseek-V3的强大语言理解能力。请重点关注：
1. 消除歧义表达
2. 简化复杂句式
3. 使用更准确的词汇
4. 确保指令易于理解
5. 提供清晰的逻辑链条

请运用你的深度推理能力，返回优化后的提示词并说明改进之处。`
  },
  specificity: {
    name: '具体性增强',
    systemPrompt: `你是一个专注于提示词具体性的优化专家，能够进行深度的细节分析。请重点关注：
1. 添加具体的要求和约束
2. 明确输出格式和结构
3. 提供清晰的示例或参考
4. 细化任务的各个步骤
5. 建立明确的成功标准

请运用Deepseek-V3的强大分析能力，返回更具体的提示词并说明增加的具体要求。`
  },
  creativity: {
    name: '创意激发',
    systemPrompt: `你是一个专注于激发创意的提示词优化专家，具备Deepseek-V3的创新思维能力。请重点关注：
1. 鼓励多角度思考
2. 激发创新思维
3. 引导发散性思考
4. 促进原创性表达
5. 建立创意思维框架

请发挥你的创造性推理能力，返回能够激发更多创意的提示词并说明优化策略。`
  }
}

// Mock AI optimization function (replace with real AI service)
async function optimizePromptWithAI(prompt, strategy) {
  console.log(`🔄 Optimizing prompt with strategy: ${strategy}`)
  console.log(`📝 Original prompt: "${prompt}"`)
  
  // If Deepseek is configured, use it
  if (deepseek) {
    console.log('🤖 Using Deepseek API')
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: optimizationStrategies[strategy].systemPrompt + `
            
请严格按照以下JSON格式返回结果，不要包含任何markdown标记或代码块标记：
{
  "optimizedPrompt": "优化后的提示词",
  "scores": {
    "clarity": 评分(1-10),
    "specificity": 评分(1-10),
    "effectiveness": 评分(1-10)
  },
  "analysis": {
    "improvements": "改进说明",
    "issues": ["原提示词的问题列表"]
  },
  "alternatives": [
    {
      "prompt": "其他建议的提示词",
      "reason": "建议理由"
    }
  ]
}

重要：请直接返回JSON对象，不要使用\`\`\`json标记或任何其他格式化标记。`
          },
          {
            role: "user",
            content: `请优化这个提示词：${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      console.log('✅ Deepseek API response received')
      console.log('🔍 Raw response content:', response.choices[0].message.content)
      
      try {
        const parsedResult = JSON.parse(response.choices[0].message.content)
        return parsedResult
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message)
        console.error('❌ Raw content that failed to parse:', response.choices[0].message.content)
        console.log('🔄 Falling back to mock response due to parsing error')
        // Fall back to mock response
      }
    } catch (error) {
      console.error('❌ Deepseek API error:', error.message)
      console.error('❌ Full error details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code
      })
      console.log('🔄 Falling back to mock response')
      // Fall back to mock response
    }
  } else {
    console.log('🎭 Using mock response (Deepseek not configured)')
  }

  // Mock response for demo purposes
  console.log('📦 Returning mock optimization result')
  return mockOptimizationResponse(prompt, strategy)
}

function mockOptimizationResponse(originalPrompt, strategy) {
  const mockResponses = {
    comprehensive: {
      optimizedPrompt: `作为专业的${getTopicFromPrompt(originalPrompt)}专家，请为我${originalPrompt.replace('写', '撰写').replace('做', '制作')}。

要求：
1. 内容结构清晰，逻辑性强
2. 语言专业准确，通俗易懂  
3. 包含具体的例子和数据支撑
4. 字数控制在800-1200字
5. 请采用总-分-总的结构

请在回答中体现您的专业知识和实践经验。`,
      scores: {
        clarity: 8,
        specificity: 9,
        effectiveness: 8
      },
      analysis: {
        improvements: "增加了角色设定、明确了输出要求、指定了字数范围和结构要求，使提示词更加具体和专业。",
        issues: [
          "原提示词过于简单，缺乏具体要求",
          "没有明确角色和输出格式",
          "缺少约束条件和质量标准"
        ]
      },
      alternatives: [
        {
          prompt: `请帮我创建一份关于${getTopicFromPrompt(originalPrompt)}的详细内容，包含背景介绍、核心观点、实例分析和总结建议。`,
          reason: "更注重内容的完整性和结构化"
        },
        {
          prompt: `以问答形式为我介绍${getTopicFromPrompt(originalPrompt)}，包含5-8个核心问题及其详细解答。`,
          reason: "采用问答形式，更易于理解和记忆"
        }
      ]
    },
    clarity: {
      optimizedPrompt: `请为我清晰地解释${getTopicFromPrompt(originalPrompt)}的基本概念、主要特点和实际应用。

请用简单易懂的语言，避免专业术语，如果必须使用请加以解释。`,
      scores: {
        clarity: 9,
        specificity: 7,
        effectiveness: 8
      },
      analysis: {
        improvements: "重新组织了语言结构，使用了更清晰的表达方式，明确了输出要求。",
        issues: [
          "原提示词表达不够清晰",
          "缺乏明确的指令"
        ]
      },
      alternatives: []
    },
    specificity: {
      optimizedPrompt: `作为领域专家，请为我创建一份详细的${getTopicFromPrompt(originalPrompt)}指南。

具体要求：
• 内容长度：1000-1500字
• 结构要求：标题、引言、主体内容（3-5个要点）、结论
• 包含具体例子和数据
• 提供可行的实施建议
• 用专业但易懂的语言

输出格式：
1. 一级标题用##
2. 二级标题用###  
3. 重要信息用**粗体**标注
4. 列表用•符号`,
      scores: {
        clarity: 8,
        specificity: 10,
        effectiveness: 9
      },
      analysis: {
        improvements: "大幅增加了具体要求，包括字数、结构、格式等详细规范，使输出更加可控。",
        issues: [
          "原提示词缺乏具体要求",
          "没有明确输出格式",
          "缺少质量标准"
        ]
      },
      alternatives: []
    },
    creativity: {
      optimizedPrompt: `发挥你的创意思维，从多个独特角度为我探索${getTopicFromPrompt(originalPrompt)}这个主题。

创意要求：
• 提供3-5个不同的视角或观点
• 包含一些意想不到的见解
• 运用比喻、类比等修辞手法
• 结合跨领域的知识和经验
• 鼓励创新思考和原创观点

请让你的回答充满想象力和启发性！`,
      scores: {
        clarity: 7,
        specificity: 8,
        effectiveness: 9
      },
      analysis: {
        improvements: "增加了创意激发要素，鼓励多角度思考和创新表达，使回答更有启发性。",
        issues: [
          "原提示词过于常规",
          "缺乏创意激发元素"
        ]
      },
      alternatives: []
    }
  }

  return mockResponses[strategy] || mockResponses.comprehensive
}

function getTopicFromPrompt(prompt) {
  // Simple topic extraction (could be enhanced with NLP)
  if (prompt.includes('人工智能') || prompt.includes('AI')) return '人工智能'
  if (prompt.includes('营销') || prompt.includes('推广')) return '营销'
  if (prompt.includes('量子')) return '量子计算'
  if (prompt.includes('应用') || prompt.includes('APP')) return '应用设计'
  if (prompt.includes('文章') || prompt.includes('写作')) return '写作'
  return '相关主题'
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Prompt Optimizer API is running' })
})

app.post('/api/optimize', async (req, res) => {
  try {
    const { prompt, strategy = 'comprehensive' } = req.body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid prompt', 
        message: '请提供有效的提示词' 
      })
    }

    if (!optimizationStrategies[strategy]) {
      return res.status(400).json({ 
        error: 'Invalid strategy', 
        message: '无效的优化策略' 
      })
    }

    // Simulate processing time (Deepseek-V3 响应时间)
    await new Promise(resolve => setTimeout(resolve, 3000))

    const result = await optimizePromptWithAI(prompt, strategy)

    res.json({
      success: true,
      originalPrompt: prompt,
      strategy,
      ...result
    })

  } catch (error) {
    console.error('Optimization error:', error)
    res.status(500).json({ 
      error: 'Optimization failed', 
      message: '优化过程中出现错误，请稍后重试' 
    })
  }
})

app.get('/api/strategies', (req, res) => {
  res.json({
    success: true,
    strategies: Object.keys(optimizationStrategies).map(key => ({
      id: key,
      name: optimizationStrategies[key].name
    }))
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({ 
    error: 'Internal server error', 
    message: '服务器内部错误' 
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Prompt Optimizer Server is running on port ${PORT}`)
  console.log(`📝 API available at http://localhost:${PORT}/api`)
  console.log(`💡 Deepseek integration: ${deepseek ? 'Enabled' : 'Disabled (using mock responses)'}`)
}) 