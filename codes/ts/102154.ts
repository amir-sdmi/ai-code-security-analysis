import OpenAI from 'openai';
import { Task } from '../types';
import { tokenTracker } from './tokenTracker';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AISuggestion {
  title: string;
  description: string;
  type: 'ai-tool' | 'automation' | 'api-integration' | 'web-scraping' | 'workflow';
  complexity: 'Low' | 'Medium' | 'High';
  estimatedCost: number;
  costSaved: number;
  timeSaved: string;
  steps: string[];
  tools?: string[];
  actionUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

// Get user's current tools from localStorage
function getUserTools(): any[] {
  try {
    const savedTools = localStorage.getItem('user_tools');
    return savedTools ? JSON.parse(savedTools) : [];
  } catch (error) {
    console.error('Failed to load user tools:', error);
    return [];
  }
}

export async function generateTaskAutomationSuggestions(
  task: Task, 
  channelContext?: string, 
  userRefinement?: string
): Promise<AISuggestion[]> {
  try {
    const userTools = getUserTools();
    const toolsList = userTools.map(tool => `${tool.name} (${tool.category})`).join(', ') || 'No specific tools configured';
    
    const systemPrompt = `
You are an AI automation expert. Analyze the given task and suggest 2-4 ways it could be automated or completed using AI tools, APIs, or modern automation instead of hiring freelancers.

TASK DETAILS:
- Title: ${task.title}
- Description: ${task.description}
- Estimated Pay: $${task.estimatedPay}
- Estimated Time: ${task.estimatedTime}
${task.userNotes ? `- Task Notes: ${task.userNotes}` : ''}
${channelContext ? `- Channel Context: ${channelContext}` : ''}

USER'S CURRENT TOOLS: ${toolsList}

${userRefinement ? `USER REFINEMENT REQUEST: ${userRefinement}` : ''}

AUTOMATION GUIDELINES:
1. ALWAYS prioritize ChatGPT as the primary AI tool
2. Focus on integrations with the user's existing tools when possible
3. For data tasks: suggest Google Sheets + Apps Script, NOT Python programming
4. For workflows: suggest Zapier, Power Automate, or similar platforms
5. Solutions should be accessible to business users, not developers
6. Avoid suggesting complex programming unless absolutely necessary
7. When user has specific tools, create integrations with those tools

SUGGESTION TYPES:
- workflow: Custom scripts or low-code solutions
- ai-tool: ChatGPT-based solutions with detailed prompts
- automation: No-code automation platforms connecting existing tools
- api-integration: Simple integrations using existing tools' built-in features
- workflow: Google Apps Script or similar business-user-friendly scripting

For each suggestion, provide:
- A clear title and description
- Complexity level (Low/Medium/High)
- Estimated cost (consider tool subscriptions, API costs)
- Time and cost savings vs hiring freelancer
- Step-by-step process
- Required tools/services (prioritize ones user already has)
- ChatGPT prompts or automation setup instructions
- Simple setup instructions, not complex code
- Code snippet when applicable (JavaScript, Python, etc.)
- Programming language for syntax highlighting

Return JSON array with 2-4 practical suggestions that could realistically complete or assist with this task. Include working code examples when the task involves programming, web scraping, API calls, or automation scripts.

EXAMPLE RESPONSE:
[
  {
    "title": "AI Content Generation",
    "description": "Use GPT-4 to automatically generate the required content with proper prompts and refinement",
    "type": "ai-tool",
    "complexity": "Low",
    "estimatedCost": 3,
    "costSaved": 22,
    "timeSaved": "1-2 hours",
    "steps": ["Create detailed prompt", "Generate content via API", "Review and refine"],
    "tools": ["OpenAI API", "Custom script"],
    "actionUrl": "https://platform.openai.com/",
    "codeSnippet": "const response = await fetch('https://api.openai.com/v1/chat/completions', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    model: 'gpt-4',\n    messages: [{ role: 'user', content: 'Your prompt here' }]\n  })\n});",
    "codeLanguage": "javascript"
  }
EXAMPLE RESPONSE FORMAT:
[
  {
    "title": "ChatGPT + Google Sheets Automation",
    "description": "Use ChatGPT to process information and automatically populate Google Sheets via Apps Script",
    "type": "ai-tool",
    "complexity": "Low",
    "estimatedCost": 2,
    "costSaved": 28,
    "timeSaved": "2-3 hours",
    "steps": ["Set up ChatGPT prompts", "Create Google Sheet template", "Set up Apps Script trigger", "Test automation"],
    "tools": ["ChatGPT", "Google Sheets", "Google Apps Script"],
    "codeSnippet": "// Google Apps Script example\nfunction processWithChatGPT() {\n  // Simple automation using ChatGPT API\n  const prompt = 'Your specific prompt here';\n  // Process and add to sheet\n}",
    "codeLanguage": "javascript"
  }
]

Focus on realistic, implementable solutions that save time and money while maintaining quality.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this task for automation opportunities: ${task.title} - ${task.description}${userRefinement ? `\n\nUser wants: ${userRefinement}` : ''}` }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Track token usage
    const usage = completion.usage;
    if (usage) {
      tokenTracker.trackUsage(
        usage.prompt_tokens,
        usage.completion_tokens,
        "gpt-4o-mini",
        "task-automation-suggestions"
      );
    }

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Clean and parse JSON response
    const cleanedResponse = cleanJsonResponse(response);
    const suggestions: AISuggestion[] = JSON.parse(cleanedResponse);

    // Validate and filter suggestions
    return suggestions.filter(suggestion => 
      suggestion.title && 
      suggestion.description && 
      suggestion.type &&
      suggestion.estimatedCost !== undefined
    );

  } catch (error) {
    console.error('Error generating automation suggestions:', error);
    
    // Return fallback suggestions based on task type
    return generateFallbackSuggestions(task);
  }
}

function cleanJsonResponse(response: string): string {
  const trimmed = response.trim();
  
  // Remove markdown code block delimiters if present
  let cleaned = trimmed;
  if (cleaned.startsWith('```json') || cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    lines.shift(); // Remove first line with ```
    if (lines[lines.length - 1].trim() === '```') {
      lines.pop(); // Remove last line with ```
    }
    cleaned = lines.join('\n').trim();
  }
  
  // Find the first opening brace and last closing brace to extract JSON array or object
  const firstBrace = cleaned.indexOf('[') !== -1 ? Math.min(cleaned.indexOf('['), cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : cleaned.indexOf('[')) : cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf(']') !== -1 ? Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}') !== -1 ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']')) : cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Remove any trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove any extra text before or after the JSON
  cleaned = cleaned.replace(/^[^[{]*/, '').replace(/[^}\]]*$/, '');
  
  return cleaned;
}

function generateFallbackSuggestions(task: Task): AISuggestion[] {
  const userTools = getUserTools();
  const hasGoogleSheets = userTools.some(tool => tool.id === 'google-sheets' || tool.name.toLowerCase().includes('sheets'));
  const hasZapier = userTools.some(tool => tool.id === 'zapier' || tool.name.toLowerCase().includes('zapier'));
  const hasSlack = userTools.some(tool => tool.id === 'slack' || tool.name.toLowerCase().includes('slack'));
  
  const fallbacks: AISuggestion[] = [];
  
  const taskLower = `${task.title} ${task.description}`.toLowerCase();
  
  // Research tasks
  if (taskLower.includes('research') || taskLower.includes('analyze') || taskLower.includes('find')) {
    fallbacks.push({
      title: "ChatGPT Research + Report Generation",
      description: "Use ChatGPT with specific prompts to research topics and generate formatted reports",
      type: "ai-tool",
      complexity: "Low",
      estimatedCost: Math.max(2, Math.floor(task.estimatedPay * 0.2)),
      costSaved: Math.floor(task.estimatedPay * 0.8),
      timeSaved: "2-3 hours",
      steps: [
        "Create detailed ChatGPT research prompt",
        "Break research into focused questions",
        "Use ChatGPT to gather information",
        hasGoogleSheets ? "Export results to Google Sheets" : "Compile into document"
      ],
      tools: hasGoogleSheets ? ["ChatGPT", "Google Sheets"] : ["ChatGPT", "Google Docs"],
      codeSnippet: `ChatGPT Prompt Template:
"Research [TOPIC] and provide:
1. Key findings and statistics
2. Main trends and patterns  
3. Top 5 insights
4. Credible sources and references
5. Executive summary in 100 words

Format as: [structured template based on your needs]"`,
      codeLanguage: "text"
    });
  }
  
  // Content creation tasks
  if (taskLower.includes('write') || taskLower.includes('content') || taskLower.includes('copy')) {
    fallbacks.push({
      title: "ChatGPT Content Creation System",
      description: "Use ChatGPT with custom prompts and brand guidelines to generate consistent content",
      type: "ai-tool",
      complexity: "Low",
      estimatedCost: Math.max(1, Math.floor(task.estimatedPay * 0.15)),
      costSaved: Math.floor(task.estimatedPay * 0.85),
      timeSaved: "1-2 hours",
      steps: [
        "Define brand voice and content guidelines",
        "Create ChatGPT content prompts",
        "Generate content with AI",
        "Review and optimize output"
      ],
      tools: ["ChatGPT", hasGoogleSheets ? "Google Sheets (content calendar)" : "Content planning tool"],
      codeSnippet: `ChatGPT Content Prompt:
"Write [CONTENT TYPE] about [TOPIC] for [TARGET AUDIENCE].

Brand Guidelines:
- Tone: [Professional/Casual/Friendly]
- Style: [Informative/Persuasive/Educational]
- Key messages: [Your key points]

Requirements:
- Length: [word count]
- Include: [specific elements]
- CTA: [call to action]

Format: [blog post/social media/email/etc.]"`,
      codeLanguage: "text"
    });
  }
  
  // Data/analysis tasks
  if (taskLower.includes('data') || taskLower.includes('report') || taskLower.includes('analysis')) {
    fallbacks.push({
      title: hasGoogleSheets ? "Google Sheets + ChatGPT Data Analysis" : "ChatGPT Data Analysis",
      description: hasGoogleSheets 
        ? "Combine Google Sheets automation with ChatGPT for data processing and insights"
        : "Use ChatGPT to analyze data and generate insights and reports",
      type: "automation",
      complexity: "Medium",
      estimatedCost: Math.max(3, Math.floor(task.estimatedPay * 0.3)),
      costSaved: Math.floor(task.estimatedPay * 0.7),
      timeSaved: "3-4 hours",
      steps: hasGoogleSheets 
        ? [
            "Import data into Google Sheets",
            "Set up basic calculations and charts", 
            "Export summary to ChatGPT for analysis",
            "Generate insights and recommendations"
          ]
        : [
            "Prepare data in accessible format",
            "Use ChatGPT to analyze patterns",
            "Generate insights and recommendations",
            "Create summary report"
          ],
      tools: hasGoogleSheets 
        ? ["Google Sheets", "ChatGPT", "Google Apps Script"]
        : ["ChatGPT", "Data source", "Spreadsheet tool"],
      codeSnippet: hasGoogleSheets 
        ? `// Google Apps Script for data processing
function analyzeDataWithChatGPT() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Process data summary
  const summary = generateSummary(data);
  
  // Send to ChatGPT for analysis
  const prompt = "Analyze this data summary and provide insights: " + summary;
  // Use ChatGPT to generate insights
}`
        : `ChatGPT Analysis Prompt:
"Analyze this data and provide:
1. Key patterns and trends
2. Notable outliers or anomalies  
3. Actionable insights
4. Recommendations for improvement
5. Summary in executive format

Data: [paste your data summary here]"`,
      codeLanguage: hasGoogleSheets ? "javascript" : "text"
    });
  }

  // Communication/workflow tasks
  if (hasSlack && (taskLower.includes('team') || taskLower.includes('communication') || taskLower.includes('update'))) {
    fallbacks.push({
      title: "Slack + ChatGPT Automation",
      description: "Automate team updates and communication using Slack integrations with ChatGPT-generated content",
      type: "automation",
      complexity: "Medium",
      estimatedCost: Math.max(3, Math.floor(task.estimatedPay * 0.3)),
      costSaved: Math.floor(task.estimatedPay * 0.7),
      timeSaved: "2-3 hours",
      steps: [
        "Set up Slack workflow automation",
        "Create ChatGPT templates for updates",
        "Configure automated posting",
        "Test and refine workflow"
      ],
      tools: ["Slack", "ChatGPT", hasZapier ? "Zapier" : "Slack Workflow Builder"],
      codeSnippet: `ChatGPT Template for Team Updates:
"Generate a professional team update based on this information:
[INPUT DATA]

Format as:
📊 **Weekly Update - [Date]**
🎯 **Key Achievements:**
• [Achievement 1]
• [Achievement 2]

📈 **Metrics:** [relevant numbers]
🔄 **Next Steps:** [action items]

Keep tone: professional but friendly, under 200 words"`,
      codeLanguage: "text"
    });
  }
  
  return fallbacks.slice(0, 4); // Return up to 4 fallback suggestions
}