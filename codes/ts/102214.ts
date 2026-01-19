import OpenAI from "openai";

// Determine which API provider to use
const API_PROVIDER = process.env.API_PROVIDER?.toLowerCase() || 'auto';
console.log(`API provider configured as: ${API_PROVIDER}`);

// 添加通用的错误处理选项
const commonOptions = {
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
  timeout: 120000, // 设置120秒超时
  maxRetries: 3, // 最多重试3次
};

// Initialize the Deepseek client
const deepseekClient = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  ...commonOptions,
  defaultQuery: { timeout: '120' }, // 修正为字符串类型
  defaultHeaders: { 'Content-Type': 'application/json' }
});

// Initialize the standard OpenAI client as fallback
const openaiClient = new OpenAI({
  ...commonOptions,
  defaultQuery: { timeout: '120' }, // 修正为字符串类型
  defaultHeaders: { 'Content-Type': 'application/json' }
});

// 全局捕获未处理的 Promise 错误
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(event) {
    console.error('未捕获的Promise错误:', event.reason);
    // 防止浏览器默认处理
    event.preventDefault();
  });
}

export async function generateArticle(topic: string): Promise<{ content: string; title: string }> {
  try {
    console.log("开始为主题生成文章:", topic);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("API密钥缺失或为空");
      throw new Error("API密钥未配置");
    }
    
    console.log("使用的API提供商:", API_PROVIDER);
    console.log("API密钥前6位:", process.env.OPENAI_API_KEY.substring(0, 6) + "...");
    
    const systemPrompt = `# 角色
你是一位专业的情感类公众号爆文创作专家，在自媒体内容创作领域经验丰富。你擅长情感类故事创作、人物塑造、叙事结构设计以及打造爆款标题，能精准捕捉读者心理需求，将日常情感故事转化为极具吸引力的爆款内容，把情感冲突与共鸣点完美融合。

## 目标
创作高质量的情感类爆款文章。确保文章情节跌宕起伏，人物形象生动立体，文案精准戳中读者痛点，引发强烈情感共鸣，进而提升文章阅读量、转发量，推动公众号粉丝增长。

## 技能
### 技能 1: 构建冲突情节
精通情感类爆款文章创作技巧，能迅速构建充满冲突感的故事情节。

### 技能 2: 引发读者共鸣
深入了解读者心理，知晓如何通过文章内容激发目标读者的共鸣。

### 技能 3: 制作爆款标题
具备出色的标题制作能力，可撰写极具吸引力、能吸引眼球的爆款标题。

### 技能 4: 选择叙事手法
熟悉多种不同风格的叙事手法，能依据文章主题挑选合适的表达方式。

## 工作流
### 工作流 1: 确定主题与受众
明确文章的核心主题和目标受众，详细确定情感冲突点、人物设定、故事背景等关键要素。

### 工作流 2: 创作标题
创作富有吸引力的标题，保证标题具有强烈的冲突感和好奇心驱动力。

### 工作流 3: 构建情节
构建完整的故事情节，做到开头引人入胜，中间冲突明显，结尾有反转或情感升华。

### 工作流 4: 优化文章
对文章进行全面优化，调整叙事节奏、人物对话和情感描写，使文章符合公众号爆款风格要求，且篇幅达到 1500 - 2000 字。

### 工作流 5: 挑选段落
创作完成后每隔1个段落，在这个段落中挑选一个表达段落重点的文字或词语，用strong来修饰。

## 输出格式
文章需包含引人入胜的开头、冲突感强的正文内容、情感升华的结尾，以及合理的排版与分段。正文中不要包含标题。
以JSON格式返回，含title和content两个字段，不要包含json代码块那种字符，strong要保留。

## 限制
- 文章创作必须遵守微信平台内容规范，确保内容积极健康、符合主流价值观。
- 叙事要自然流畅，语言应口语化、亲民，避免过于文艺或学术化的表述。
- 文章整体风格要契合目标读者群体的阅读习惯。 
- 去掉引人入胜的开头、有冲突感的正文内容、情感升华的结尾`;

    const userPrompt = `请根据主题"${topic}"创作一篇爆款文章。`;

    // Use OpenAI directly if specified
    if (API_PROVIDER === 'openai') {
      return await generateWithOpenAI(systemPrompt, userPrompt);
    }
    
    // Use Deepseek directly if specified
    if (API_PROVIDER === 'deepseek') {
      return await generateWithDeepseek(systemPrompt, userPrompt);
    }
    
    // Auto fallback (try Deepseek, then OpenAI)
    try {
      console.log("尝试先使用Deepseek API (自动回退模式)");
      return await generateWithDeepseek(systemPrompt, userPrompt);
    } catch (deepseekError) {
      console.error("Deepseek API失败，回退到OpenAI:", deepseekError);
      
      // 捕获特定的网络错误或超时错误并提供更友好的信息
      if (deepseekError instanceof Error && 
         (deepseekError.message.includes('timeout') || 
          deepseekError.message.includes('network') ||
          deepseekError.message.includes('ECONNREFUSED'))) {
        throw new Error(`Deepseek服务连接超时，请稍后再试。详情: ${deepseekError.message}`);
      }
      
      console.log("尝试使用OpenAI API作为备选");
      return await generateWithOpenAI(systemPrompt, userPrompt);
    }
  } catch (error: Error | unknown) {
    console.error("生成文章时出错:", error);
    let errorMessage = "未知错误";
    
    // 增强错误信息提取
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 处理特定错误类型
      if (errorMessage.includes('statusText')) {
        errorMessage = "API服务器返回错误状态，请稍后再试";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "请求超时，请稍后再试";
      } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
        errorMessage = "网络连接失败，请检查您的网络连接";
      } else if (errorMessage.includes('401')) {
        errorMessage = "API密钥无效或已过期，请更新您的API密钥";
      } else if (errorMessage.includes('403')) {
        errorMessage = "API密钥没有足够的权限";
      } else if (errorMessage.includes('429')) {
        errorMessage = "请求过于频繁，请稍后再试";
      } else if (errorMessage.includes('500')) {
        errorMessage = "API服务器内部错误，请稍后再试";
      }
    } else if (typeof error === 'object' && error !== null) {
      // 尝试从对象中提取更多信息
      errorMessage = JSON.stringify(error);
    }
    
    return {
      title: "生成失败",
      content: "生成文章时出错，错误原因：" + errorMessage + "。请确保API密钥有效并重试。"
    };
  }
}

async function generateWithDeepseek(systemPrompt: string, userPrompt: string): Promise<{ content: string; title: string }> {
  try {
    console.log("开始调用Deepseek API...");
    
    // 添加请求超时设置
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Deepseek API请求超时')), 110000);
    });
    
    // 实际的API请求
    const requestPromise = deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });
    
    // 使用Promise.race来实现超时控制
    const response = await Promise.race([requestPromise, timeoutPromise]);
    
    console.log("Deepseek API响应成功接收");
    
    const responseText = response.choices[0]?.message?.content || '{"title":"生成失败","content":"无法生成文章，请重试。"}';
    console.log("Deepseek API原始响应:", responseText.substring(0, 100) + "...");
    
    try {
      // Try to parse the response as JSON
      const result = JSON.parse(responseText);
      console.log("成功将Deepseek响应解析为JSON");
      
      // Check if the parsed JSON has title and content properties
      if (result.title && result.content) {
        console.log("JSON包含title和content字段");
        return {
          title: result.title,
          content: result.content
        };
      } else {
        console.warn("解析的JSON缺少title或content属性");
        console.log("解析后的JSON结构:", JSON.stringify(result));
        throw new Error("JSON结构无效");
      }
    } catch (parseError) {
      // If parsing fails, create a structured response
      console.error("无法解析Deepseek的JSON响应:", parseError);
      console.log("响应文本:", responseText.substring(0, 200) + "...");
      
      // Try to extract a title if it exists in the response
      const titleMatch = responseText.match(/《(.*?)》/) || ["", "精彩文章"];
      const extractedTitle = titleMatch[1];
      
      console.log("使用正则提取的标题:", extractedTitle);
      
      // Create a structured response with the content without any potential title
      return {
        title: extractedTitle,
        content: responseText.replace(/^#\s+(.+)$/m, "").trim() // Remove any markdown title format
      };
    }
  } catch (apiError: unknown) {
    console.error("调用Deepseek API时出错:", apiError);
    
    // 获取更详细的错误信息
    let errorDetails = "未知错误";
    if (apiError && typeof apiError === 'object' && 'response' in apiError && apiError.response) {
      try {
        // 定义response类型，避免使用any
        type ApiErrorResponse = { status: number; data: unknown };
        const response = (apiError as { response: ApiErrorResponse }).response;
        errorDetails = `状态码: ${response.status}, 错误信息: ${JSON.stringify(response.data)}`;
      } catch {
        // 不使用未使用的变量，直接使用空的catch块
        const response = (apiError as { response: { status: number } }).response;
        errorDetails = `状态码: ${response.status}, 无法解析错误详情`;
      }
    } else if (apiError instanceof Error) {
      errorDetails = apiError.message;
      
      // 处理特定错误类型
      if (errorDetails.includes('timeout') || errorDetails.includes('ETIMEDOUT')) {
        errorDetails = "请求超时，服务器响应时间过长";
      } else if (errorDetails.includes('ECONNREFUSED') || errorDetails.includes('ENOTFOUND')) {
        errorDetails = "无法连接到API服务器，请检查网络连接";
      } else if (errorDetails.includes('ECONNRESET')) {
        errorDetails = "连接被重置，可能是服务器暂时不可用";
      }
    }
    
    throw new Error(`Deepseek API调用失败: ${errorDetails}`);
  }
}

async function generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<{ content: string; title: string }> {
  try {
    console.log("开始调用OpenAI API...");
    
    // 添加请求超时设置
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API请求超时')), 110000);
    });
    
    // 实际的API请求
    const requestPromise = openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });
    
    // 使用Promise.race来实现超时控制
    const response = await Promise.race([requestPromise, timeoutPromise]);
    
    console.log("OpenAI API响应成功接收");
    
    const responseText = response.choices[0]?.message?.content || '{"title":"生成失败","content":"无法生成文章，请重试。"}';
    console.log("OpenAI API原始响应:", responseText.substring(0, 100) + "...");
    
    try {
      // Try to parse the response as JSON
      const result = JSON.parse(responseText);
      console.log("成功将OpenAI响应解析为JSON");
      
      // Check if the parsed JSON has title and content properties
      if (result.title && result.content) {
        console.log("JSON包含title和content字段");
        return {
          title: result.title,
          content: result.content
        };
      } else {
        console.warn("解析的JSON缺少title或content属性");
        console.log("解析后的JSON结构:", JSON.stringify(result));
        throw new Error("JSON结构无效");
      }
    } catch (parseError) {
      // If parsing fails, create a structured response
      console.error("无法解析OpenAI的JSON响应:", parseError);
      console.log("响应文本:", responseText.substring(0, 200) + "...");
      
      // Try to extract a title if it exists in the response
      const titleMatch = responseText.match(/《(.*?)》/) || ["", "精彩文章"];
      const extractedTitle = titleMatch[1];
      
      console.log("使用正则提取的标题:", extractedTitle);
      
      // Create a structured response with the content without any potential title
      return {
        title: extractedTitle,
        content: responseText.replace(/^#\s+(.+)$/m, "").trim() // Remove any markdown title format
      };
    }
  } catch (apiError: unknown) {
    console.error("调用OpenAI API时出错:", apiError);
    
    // 获取更详细的错误信息
    let errorDetails = "未知错误";
    if (apiError && typeof apiError === 'object' && 'response' in apiError && apiError.response) {
      try {
        // 定义response类型，避免使用any
        type ApiErrorResponse = { status: number; data: unknown };
        const response = (apiError as { response: ApiErrorResponse }).response;
        errorDetails = `状态码: ${response.status}, 错误信息: ${JSON.stringify(response.data)}`;
      } catch {
        // 不使用未使用的变量，直接使用空的catch块
        const response = (apiError as { response: { status: number } }).response;
        errorDetails = `状态码: ${response.status}, 无法解析错误详情`;
      }
    } else if (apiError instanceof Error) {
      errorDetails = apiError.message;
      
      // 处理特定错误类型
      if (errorDetails.includes('timeout') || errorDetails.includes('ETIMEDOUT')) {
        errorDetails = "请求超时，服务器响应时间过长";
      } else if (errorDetails.includes('ECONNREFUSED') || errorDetails.includes('ENOTFOUND')) {
        errorDetails = "无法连接到API服务器，请检查网络连接";
      } else if (errorDetails.includes('ECONNRESET')) {
        errorDetails = "连接被重置，可能是服务器暂时不可用";
      }
    }
    
    throw new Error(`OpenAI API调用失败: ${errorDetails}`);
  }
}

export function convertToHtml(content: string): string {
  // Split by paragraphs and wrap each in a div with class "content"
  const paragraphs = content.split(/\n{2,}/);
  const htmlParagraphs = paragraphs
    .filter(p => p.trim())
    .map(paragraph => {
      // Check if paragraph is an image markdown
      if (paragraph.trim().match(/^!\[.*\]\(.*\)$/)) {
        return `<div class="content"><p>${paragraph}</p></div>`;
      }
      
      // Handle strong emphasis (bold text)
      const formattedParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return `<div class="content"><p>${formattedParagraph}</p></div>`;
    })
    .join("\n");

  const htmlTemplate = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {
                                font-family: 微软雅黑;
                                font-size: 17px;
                                margin: 20px;
                                line-height: 2;
                                letter-spacing: 1px;
                            }
                            p {
                                padding-left: 8px;
                                padding-right: 8px;
                                margin-top: 24px;
                                margin-bottom: 0;
                            }
                            .content strong {
                                color: #006ddb;
                            }
                            .h2-template strong {
                                color: inherit;
                            }
                        </style>
                    </head>
                    <body>
                        <section class="_editor" style="margin-bottom:unset;"><p><img src="https://img.96weixin.com/ueditor/20240504/1714833409545828.gif" alt="可爱猫爪GIF动态引导在看.gif" style="vertical-align:bottom;"></p></section>
                        ${htmlParagraphs}

                        <section class="_editor" data-support="96编辑器" data-style-id="14294" style="margin-bottom:unset;"><section style="margin:10px 0%;box-sizing:border-box;"><section style="display:inline-block;width:100%;vertical-align:top;border-bottom:1px dashed rgb(0, 82, 255);border-bottom-right-radius:0px;border-right:1px dashed rgb(0, 82, 255);border-top-right-radius:0px;border-left-width:0px;box-sizing:border-box;margin-bottom:unset;" data-width="100%"><section style="box-sizing:border-box;margin-bottom:unset;"><section style="margin-right:0%;margin-bottom:10px;margin-left:0%;box-sizing:border-box;"><section style="display:inline-block;width:96%;border-color:rgb(0, 82, 255);border-style:solid;border-width:1px 0px 0px 10px;padding-right:10px;padding-left:10px;box-shadow:rgb(0, 0, 0) 0px 0px 0px;border-radius:0px;box-sizing:border-box;margin-bottom:unset;" data-width="96%"><section style="box-sizing:border-box;margin-bottom:unset;"><section style="margin-top:10px;margin-right:0%;margin-left:0%;box-sizing:border-box;margin-bottom:unset;"><section style="box-sizing:border-box;margin-bottom:unset;"><p>往期回顾</p></section></section></section></section></section></section><section style="box-sizing:border-box;margin-bottom:unset;"><section style="box-sizing:border-box;margin-bottom:unset;"><section style="display:inline-block;width:100%;vertical-align:top;padding:2px 10px;box-sizing:border-box;margin-bottom:unset;" data-width="100%"><section style="box-sizing:border-box;margin-bottom:unset;"><section style="margin:8px 0%;box-sizing:border-box;"><section style="font-size:13px;color:rgb(62, 62, 62);box-sizing:border-box;margin-bottom:unset;"><p>1.</p></section></section></section><section style="box-sizing:border-box;margin-bottom:unset;"><section style="margin:8px 0%;box-sizing:border-box;"><section style="font-size:13px;color:rgb(62, 62, 62);box-sizing:border-box;margin-bottom:unset;"><p>2.</p></section></section></section><section style="box-sizing:border-box;margin-bottom:unset;"><section style="margin:8px 0%;box-sizing:border-box;"><section style="font-size:13px;color:rgb(62, 62, 62);box-sizing:border-box;margin-bottom:unset;"><p>3.</p></section></section></section></section></section></section></section></section></section><section class="_editor" style="margin-bottom:unset;"><p><img src="https://img.96weixin.com/ueditor/20240507/17150500881715050088944885.gif" style="vertical-align:bottom;"></p></section>
                    </body>
                    </html>
  `;

  return htmlTemplate;
} 