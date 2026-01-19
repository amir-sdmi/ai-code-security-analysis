// services/AIService.js - AI processing and response generation with Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { IncarraAgentService } = require('./IncarraAgentService');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });
    this.agentService = new IncarraAgentService();
    this.conversationHistory = new Map(); // Store conversation history per user
  }

  // Main interaction processing
  async processInteraction(userPublicKey, message, interactionType = 'conversation') {
    try {
      // Get agent context from blockchain
      const agentContext = await this.agentService.getAgentContext(userPublicKey);
      
      // Generate AI response based on interaction type
      let response, experienceGained, context;
      
      switch (interactionType) {
        case 'research':
          ({ response, experienceGained, context } = await this.handleResearchQuery(message, agentContext));
          break;
        case 'analysis':
          ({ response, experienceGained, context } = await this.handleDataAnalysis(message, agentContext));
          break;
        case 'problem_solving':
          ({ response, experienceGained, context } = await this.handleProblemSolving(message, agentContext));
          break;
        default:
          ({ response, experienceGained, context } = await this.handleConversation(message, agentContext, userPublicKey));
      }

      // Update conversation history
      this.updateConversationHistory(userPublicKey, message, response);

      return {
        response,
        experienceGained,
        context,
        agentLevel: agentContext.level,
        agentPersonality: agentContext.personality
      };
    } catch (error) {
      console.error('❌ Error processing interaction:', error);
      return {
        response: "I'm having trouble processing your request right now. Please try again later.",
        experienceGained: 0,
        context: { error: error.message }
      };
    }
  }

  // Handle general conversation
  async handleConversation(message, agentContext, userPublicKey) {
    const conversationHistory = this.getConversationHistory(userPublicKey);
    
    const systemPrompt = this.buildSystemPrompt(agentContext, 'conversation');
    
    // Build conversation context for Gemini
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    const fullPrompt = `${systemPrompt}

Previous conversation:
${conversationText}

User: ${message}

Please respond as ${agentContext.agentName} in character:`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response.text();

      return {
        response,
        experienceGained: 5 + (agentContext.level * 2), // Scale with agent level
        context: {
          messageType: 'conversation',
          userMessage: message,
          timestamp: Date.now(),
          modelUsed: 'gemini-1.5-flash'
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate conversation response');
    }
  }

  // Handle research queries
  async handleResearchQuery(message, agentContext) {
    const systemPrompt = this.buildSystemPrompt(agentContext, 'research');
    
    const researchPrompt = `${systemPrompt}

The user is asking a research-related question. Provide a comprehensive, scientific response that:
1. Addresses their query with current knowledge
2. Suggests relevant research directions
3. Recommends specific papers or resources when appropriate
4. Identifies knowledge gaps or areas for further investigation

User query: ${message}

Please provide a detailed research-oriented response:`;

    try {
      const result = await this.model.generateContent(researchPrompt);
      const response = result.response.text();

      // Extract potential knowledge areas from the response
      const extractedKnowledgeAreas = await this.extractKnowledgeAreas(message, response);

      return {
        response,
        experienceGained: 15 + (agentContext.level * 3),
        context: {
          messageType: 'research',
          userQuery: message,
          extractedKnowledgeAreas,
          researchDepth: 'comprehensive',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate research response');
    }
  }

  // Handle data analysis requests
  async handleDataAnalysis(message, agentContext) {
    const systemPrompt = this.buildSystemPrompt(agentContext, 'analysis');
    
    const analysisPrompt = `${systemPrompt}

The user needs help with data analysis. Provide:
1. Clear methodology recommendations
2. Statistical approaches if applicable
3. Visualization suggestions
4. Interpretation guidelines
5. Potential limitations or considerations

Analysis request: ${message}

Please provide a structured analytical response:`;

    try {
      const result = await this.model.generateContent(analysisPrompt);
      const response = result.response.text();

      return {
        response,
        experienceGained: 20 + (agentContext.level * 4),
        context: {
          messageType: 'analysis',
          userRequest: message,
          analysisType: 'data_analysis',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate analysis response');
    }
  }

  // Handle problem solving
  async handleProblemSolving(message, agentContext) {
    const systemPrompt = this.buildSystemPrompt(agentContext, 'problem_solving');
    
    const problemPrompt = `${systemPrompt}

The user has a problem they need help solving. Provide:
1. Problem analysis and breakdown
2. Multiple solution approaches
3. Step-by-step implementation guidance
4. Potential challenges and mitigation strategies
5. Success metrics or evaluation criteria

Problem: ${message}

Please provide a structured problem-solving response:`;

    try {
      const result = await this.model.generateContent(problemPrompt);
      const response = result.response.text();

      return {
        response,
        experienceGained: 18 + (agentContext.level * 3),
        context: {
          messageType: 'problem_solving',
          userProblem: message,
          solutionApproach: 'structured',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate problem-solving response');
    }
  }

  // Analyze research paper
  async analyzePaper(userPublicKey, paperId, paperContent) {
    try {
      const agentContext = await this.agentService.getAgentContext(userPublicKey);
      
      const analysisPrompt = `As ${agentContext.agentName}, an AI research companion with Level ${agentContext.level} experience, analyze this research paper:

Title/ID: ${paperId}
Content: ${paperContent.substring(0, 4000)}... [truncated]

Provide a comprehensive analysis including:
1. Main research question and hypothesis
2. Methodology and approach
3. Key findings and contributions
4. Limitations and future work
5. Relevance to current research trends
6. Potential applications

Keep your analysis scholarly but accessible, matching my current knowledge level in: ${agentContext.knowledgeAreas.join(', ')}

Analysis:`;

      const result = await this.model.generateContent(analysisPrompt);
      const analysis = result.response.text();

      return {
        analysis,
        paperId,
        analysisDate: new Date().toISOString(),
        agentLevel: agentContext.level,
        experienceGained: 25
      };
    } catch (error) {
      console.error('❌ Error analyzing paper:', error);
      throw error;
    }
  }

  // Simple chat endpoint
  async chat(userPublicKey, message, context = {}) {
    try {
      const agentContext = await this.agentService.getAgentContext(userPublicKey);
      const conversationHistory = this.getConversationHistory(userPublicKey);
      
      const systemPrompt = `You are ${agentContext.agentName}, an AI research companion. 
      
Your personality: ${agentContext.personality}
Your level: ${agentContext.level}
Your knowledge areas: ${agentContext.knowledgeAreas.join(', ')}
Total interactions: ${agentContext.totalInteractions}

You are helpful, knowledgeable, and grow smarter with each interaction. Respond naturally and engagingly.`;

      // Build conversation context
      const conversationText = conversationHistory.slice(-10) // Keep last 10 messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}

Recent conversation:
${conversationText}

User: ${message}

Response:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response.text();
      
      // Update conversation history
      this.updateConversationHistory(userPublicKey, message, response);

      return {
        response,
        agentName: agentContext.agentName,
        agentLevel: agentContext.level,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error in chat:', error);
      throw error;
    }
  }

  // Build system prompt based on agent context and interaction type
  buildSystemPrompt(agentContext, interactionType) {
    const basePrompt = `You are ${agentContext.agentName}, a Level ${agentContext.level} AI research companion.

Personality: ${agentContext.personality}
Experience: ${agentContext.experience} points
Reputation Score: ${agentContext.reputationScore}
Knowledge Areas: ${agentContext.knowledgeAreas.join(', ')}
Total Interactions: ${agentContext.totalInteractions}
Carv ID Verified: ${agentContext.carvVerified ? 'Yes' : 'No'}

You are an intelligent, adaptive AI that grows with each interaction. Your responses should reflect your current level and knowledge areas.`;

    const typeSpecificPrompts = {
      conversation: `\n\nYou excel at engaging conversation, helping users explore ideas, and providing thoughtful insights. Be personable and adaptive.`,
      research: `\n\nYou are specialized in research assistance, paper analysis, and academic discussions. Provide scholarly, well-researched responses.`,
      analysis: `\n\nYou excel at data analysis, statistical interpretation, and methodological guidance. Be precise and analytical.`,
      problem_solving: `\n\nYou are skilled at breaking down complex problems and providing structured solutions. Be systematic and practical.`
    };

    return basePrompt + (typeSpecificPrompts[interactionType] || typeSpecificPrompts.conversation);
  }

  // Extract knowledge areas from conversation
  async extractKnowledgeAreas(userMessage, aiResponse) {
    try {
      const extractionPrompt = `Based on this research conversation, identify 1-3 specific knowledge areas or topics that could be added to a researcher's profile. Return only the topics, separated by commas.

User: ${userMessage}
AI: ${aiResponse}

Knowledge areas (max 3, specific topics only):`;

      const result = await this.model.generateContent(extractionPrompt);
      const areasText = result.response.text();

      const areas = areasText
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0 && area.length <= 30)
        .slice(0, 3);

      return areas;
    } catch (error) {
      console.error('Error extracting knowledge areas:', error);
      return [];
    }
  }

  // Conversation history management
  getConversationHistory(userPublicKey) {
    return this.conversationHistory.get(userPublicKey) || [];
  }

  updateConversationHistory(userPublicKey, userMessage, aiResponse) {
    const history = this.getConversationHistory(userPublicKey);
    
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    // Keep only last 20 messages (10 exchanges)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationHistory.set(userPublicKey, history);
  }

  // Clear conversation history (useful for privacy)
  clearConversationHistory(userPublicKey) {
    this.conversationHistory.delete(userPublicKey);
  }

  // Get conversation summary for long sessions
  async getConversationSummary(userPublicKey) {
    const history = this.getConversationHistory(userPublicKey);
    
    if (history.length === 0) {
      return "No conversation history available.";
    }

    const conversationText = history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const summaryPrompt = `Summarize this conversation between a user and their AI research companion INCARRA in 2-3 sentences, highlighting key topics discussed and insights shared:

${conversationText}

Summary:`;

    try {
      const result = await this.model.generateContent(summaryPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return "Unable to generate conversation summary.";
    }
  }

  // Generate research recommendations
  async generateResearchRecommendations(userPublicKey) {
    try {
      const agentContext = await this.agentService.getAgentContext(userPublicKey);
      
      const recommendationPrompt = `Based on this researcher's profile, suggest 3 specific research directions or papers they should explore:

Knowledge Areas: ${agentContext.knowledgeAreas.join(', ')}
Experience Level: ${agentContext.level}
Research Projects: ${agentContext.researchProjects}

Provide specific, actionable research recommendations with brief explanations:`;

      const result = await this.model.generateContent(recommendationPrompt);

      return {
        recommendations: result.response.text(),
        generatedAt: new Date().toISOString(),
        agentLevel: agentContext.level
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

module.exports = { AIService };