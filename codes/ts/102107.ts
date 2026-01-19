import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Use Gemma 7B for complex agentic tasks requiring planning, tool use, and reasoning
const model = genAI.getGenerativeModel({ 
  model: 'gemma-2-27b-it',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});

export interface ContactPersonalization {
  personalizedMessage: string;
  talkingPoints: string[];
  iceBreakers: string[];
  followUpSuggestions: string[];
}

export interface BusinessInsight {
  companyOverview: string;
  keyDecisionMakers: string[];
  businessChallenges: string[];
  opportunities: string[];
  competitiveAdvantages: string[];
}

export interface EmailSuggestion {
  subject: string;
  body: string;
  tone: 'professional' | 'casual' | 'persuasive' | 'urgent';
  followUpTiming: string;
}

export interface ProposalContent {
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  benefitsAndValue: string[];
  implementation: string;
  timeline: string;
  nextSteps: string[];
}

export const geminiService = {
  async suggestPersonalization(contact: any): Promise<ContactPersonalization> {
    try {
      const prompt = `
        You are an expert sales strategist with deep expertise in personalized outreach. Let's approach this systematically.

        First, outline the steps needed to create a personalized communication strategy:
        1. Analyze the contact's profile and context
        2. Identify key value propositions based on their role/industry
        3. Develop personalized messaging angles
        4. Create specific talking points and ice breakers
        5. Plan follow-up strategy

        Now, execute each step for this contact:
        
        Contact Profile:
        Name: ${contact.name}
        Email: ${contact.email}
        Company: ${contact.company || 'Not specified'}
        Position: ${contact.position || 'Not specified'}
        Industry: ${contact.industry || 'Not specified'}
        Location: ${contact.location || 'Not specified'}
        Notes: ${contact.notes || 'No additional notes'}
        Status: ${contact.status || 'lead'}
        
        Step 1 - Profile Analysis: What can you infer about their priorities, challenges, and decision-making authority?
        Step 2 - Value Proposition: What specific benefits would resonate most with someone in their position?
        Step 3 - Messaging Strategy: How should you position your approach?
        Step 4 - Tactical Elements: What specific talking points and ice breakers would work?
        Step 5 - Follow-up Plan: What's the optimal sequence and timing?

        Provide your final recommendations as JSON with keys: personalizedMessage, talkingPoints, iceBreakers, followUpSuggestions
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse as JSON, fallback to structured response
      try {
        return JSON.parse(text);
      } catch {
        return {
          personalizedMessage: text.substring(0, 200) + '...',
          talkingPoints: ['Personalized approach based on their role', 'Industry-specific insights', 'Value proposition alignment'],
          iceBreakers: ['Reference their recent work', 'Mention mutual connections', 'Industry trend discussion'],
          followUpSuggestions: ['Schedule a brief call', 'Share relevant case study', 'Invite to industry event']
        };
      }
    } catch (error) {
      console.error('Gemini API error in personalization suggestions:', error);
      throw error;
    }
  },

  async analyzeBusinessInsights(company: string, industry?: string): Promise<BusinessInsight> {
    try {
      const prompt = `
        You are a strategic business analyst. I need you to conduct a comprehensive analysis of ${company}${industry ? ` in the ${industry} industry` : ''}. Let's break this down systematically.

        First, outline your analysis framework:
        1. Research company background and market positioning
        2. Identify organizational structure and key stakeholders  
        3. Assess current market challenges and pain points
        4. Evaluate growth opportunities and market trends
        5. Determine competitive positioning and unique advantages

        Now, execute each step:

        Step 1 - Company Research: What can you determine about ${company}'s business model, size, recent developments, and market presence${industry ? ` within the ${industry} sector` : ''}?

        Step 2 - Decision Maker Analysis: Based on typical ${industry || 'business'} organizations, who are the likely key decision makers, their priorities, and influence levels?

        Step 3 - Challenge Assessment: What are the most pressing business challenges facing ${industry ? `${industry} companies like ` : ''}${company} in the current market environment?

        Step 4 - Opportunity Identification: What growth opportunities, market trends, or strategic initiatives could benefit ${company}?

        Step 5 - Competitive Analysis: What unique strengths, market advantages, or differentiators should ${company} leverage?

        Based on your analysis, provide insights formatted as JSON with keys: companyOverview, keyDecisionMakers, businessChallenges, opportunities, competitiveAdvantages
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return {
          companyOverview: `Analysis for ${company} in the ${industry || 'business'} sector.`,
          keyDecisionMakers: ['CEO/President', 'CTO/VP Technology', 'VP Sales', 'Director of Operations'],
          businessChallenges: ['Market competition', 'Digital transformation', 'Cost optimization', 'Customer retention'],
          opportunities: ['Technology adoption', 'Process improvement', 'Market expansion', 'Strategic partnerships'],
          competitiveAdvantages: ['Innovation', 'Customer service', 'Cost efficiency', 'Market expertise']
        };
      }
    } catch (error) {
      console.error('Gemini API error in business insights:', error);
      throw error;
    }
  },

  async generateEmailSuggestions(
    contact: any,
    purpose: string,
    context?: string
  ): Promise<EmailSuggestion[]> {
    try {
      const prompt = `
        Generate 3 different email suggestions for the following scenario:
        
        Contact: ${contact.name} (${contact.position || 'Unknown position'}) at ${contact.company || 'Unknown company'}
        Purpose: ${purpose}
        Context: ${context || 'General outreach'}
        Industry: ${contact.industry || 'Not specified'}
        
        Create 3 emails with different tones:
        1. Professional and formal
        2. Casual and friendly
        3. Persuasive and value-focused
        
        For each email, provide:
        - Subject line
        - Body content (2-3 paragraphs)
        - Recommended follow-up timing
        
        Format as JSON array with objects containing: subject, body, tone, followUpTiming
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return [
          {
            subject: `Following up on our conversation - ${contact.name}`,
            body: `Hi ${contact.name},\n\nI wanted to follow up on our recent discussion about ${purpose}. Based on your role at ${contact.company}, I believe our solution could provide significant value.\n\nWould you be available for a brief call this week to explore this further?\n\nBest regards,`,
            tone: 'professional' as const,
            followUpTiming: '3-5 business days'
          }
        ];
      }
    } catch (error) {
      console.error('Gemini API error in email suggestions:', error);
      throw error;
    }
  },

  async generateProposal(
    dealInfo: any,
    requirements?: string
  ): Promise<ProposalContent> {
    try {
      const prompt = `
        Generate a comprehensive business proposal based on the following information:
        
        Deal: ${dealInfo.title}
        Company: ${dealInfo.company}
        Value: $${dealInfo.value}
        Stage: ${dealInfo.stage}
        Requirements: ${requirements || 'Standard business solution'}
        Notes: ${dealInfo.notes || 'No additional notes'}
        
        Create a structured proposal with:
        1. Executive Summary
        2. Problem Statement
        3. Proposed Solution
        4. Benefits and Value
        5. Implementation Plan
        6. Timeline
        7. Next Steps
        
        Format as JSON with keys: executiveSummary, problemStatement, proposedSolution, benefitsAndValue (array), implementation, timeline, nextSteps (array)
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return {
          executiveSummary: `This proposal outlines a comprehensive solution for ${dealInfo.company} to address their business needs.`,
          problemStatement: 'Current business challenges require a strategic solution to improve efficiency and growth.',
          proposedSolution: 'Our integrated approach combines technology and expertise to deliver measurable results.',
          benefitsAndValue: ['Increased efficiency', 'Cost reduction', 'Improved ROI', 'Strategic advantage'],
          implementation: 'Phased approach with dedicated project management and support throughout the process.',
          timeline: '3-6 months for full implementation with key milestones at 30, 60, and 90 days.',
          nextSteps: ['Schedule detailed requirements session', 'Finalize project scope', 'Begin implementation planning']
        };
      }
    } catch (error) {
      console.error('Gemini API error in proposal generation:', error);
      throw error;
    }
  },

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyPhrases: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Analyze the sentiment and provide insights for the following text:
        
        "${text}"
        
        Provide:
        1. Overall sentiment (positive, negative, or neutral)
        2. Confidence score (0-1)
        3. Key phrases that influenced the sentiment
        4. Recommendations for response or action
        
        Format as JSON with keys: sentiment, confidence, keyPhrases (array), recommendations (array)
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      try {
        return JSON.parse(responseText);
      } catch {
        return {
          sentiment: 'neutral' as const,
          confidence: 0.5,
          keyPhrases: ['business discussion', 'professional communication'],
          recommendations: ['Follow up with additional information', 'Schedule a meeting to discuss further']
        };
      }
    } catch (error) {
      console.error('Gemini API error in sentiment analysis:', error);
      throw error;
    }
  },

  async generateMeetingAgenda(
    purpose: string,
    attendees: string[],
    previousNotes?: string
  ): Promise<string> {
    try {
      const prompt = `
        You're an expert sales assistant. Create a structured meeting agenda with clear sections based on:

        - Purpose: ${purpose}
        - Attendees: ${attendees.join(', ')}
        - Previous notes: ${previousNotes || 'N/A'}

        Use headings like "Introduction", "Client Needs", "Demo", "Q&A", "Next Steps".
        Keep it short, clear, and business-ready.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini API error in meeting agenda generation:', error);
      throw error;
    }
  },

  async generateReasoning(prompt: string): Promise<string> {
    try {
      const reasoningPrompt = `
        You're an AI strategist. ${prompt}

        Briefly explain the rationale, section structure, and strategic importance of the agenda. Keep it under 150 words.
      `;

      const result = await model.generateContent(reasoningPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini API error in reasoning generation:', error);
      throw error;
    }
  }
};

// React hook for components to use Gemini service
export const useGemini = () => {
  return geminiService;
};

export default geminiService;