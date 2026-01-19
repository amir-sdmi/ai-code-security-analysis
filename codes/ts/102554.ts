import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string;
  conversationId: string;
  userId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  budget?: string;
  timeline?: string;
  needs?: string;
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  painPoints?: string[];
  decisionMaker?: boolean;
}

interface LeadAnalysis {
  isQualified: boolean;
  score: number;
  intent: string;
  extractedData: LeadData;
  requestedInfo: boolean;
  schedulingIntent: boolean;
  reasoning: string;
  nextSteps: string[];
  buyingSignals: string[];
  painPoints: string[];
  meetingRequested?: boolean;
  preferredMeetingTime?: string;
  meetingType?: string;
  conversationEnding?: boolean;
}

interface MeetingDetails {
  date: string;
  time: string;
  duration: string;
  type: string;
  agenda: string[];
  meetingLink: string;
  calendarLink: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationId, userId, conversationHistory }: ChatRequest = await req.json()

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Check if the user wants to end the conversation
    const isEndingConversation = detectConversationEnding(message)

    // Create system prompt for consulting sales agent with conversation ending detection
    const systemPrompt = `You are Sarah Mitchell, a Senior Business Development Manager at Strategic Solutions Consulting. 

CRITICAL RESPONSE RULES:
1. MAXIMUM 30 WORDS per response - this is MANDATORY
2. NO asterisks (*) or special formatting characters
3. Use proper sentence structure with natural flow
4. Be conversational and professional
5. Ask ONE focused question per response
6. NO bullet points or lists in responses

CONVERSATION ENDING DETECTION:
If the client says goodbye, needs to go, wants to end the conversation, or shows clear ending signals like:
- "bye", "goodbye", "see you later"
- "I have to go", "I need to leave"
- "let's end this", "can we stop"
- "talk later", "speak soon"
- "thanks, that's all"
- "nothing for now"
- "we'll discuss later"

RESPOND WITH A POLITE CLOSING MESSAGE like:
- "Thank you for your time! Looking forward to connecting again soon."
- "Great speaking with you! I'll follow up with relevant information."
- "Thanks for the conversation! Feel free to reach out anytime."
- "Appreciate your time today! Looking forward to our next discussion."

DO NOT ask additional questions when they want to end the conversation.

CORE SERVICES:
• Management Consulting - Organizational restructuring, leadership development
• Strategy Planning - Market entry, competitive analysis, growth planning  
• Business Process Improvement - Operational efficiency, cost reduction
• Market Research - Industry analysis, customer insights

YOUR APPROACH (only when conversation is continuing):
- Ask strategic business questions about their challenges
- Focus on operational inefficiencies, growth obstacles, strategic planning needs
- Qualify company size, decision authority, timeline, budget
- Guide toward scheduling consultations or assessments
- Share relevant case studies when appropriate

CONVERSATION STYLE:
- Professional but approachable
- Business-focused questions
- Demonstrate expertise subtly
- Focus on business outcomes and ROI
- Executive-level communication

EXAMPLE GOOD RESPONSES (under 30 words):
"What operational challenges are currently limiting your growth?"
"How are you approaching strategic planning for next year?"
"I'd love to discuss your efficiency goals. When works for a brief consultation?"

EXAMPLE ENDING RESPONSES (when they want to stop):
"Thank you for your time! Looking forward to connecting again soon."
"Great speaking with you! I'll follow up with relevant information."

Remember: Keep responses under 30 words, no asterisks, natural conversation flow. ALWAYS respect when someone wants to end the conversation.`

    // Prepare conversation context for Gemini
    let conversationContext = systemPrompt + "\n\nConversation History:\n"
    
    // Add recent conversation history
    conversationHistory.slice(-6).forEach(msg => {
      conversationContext += `${msg.role === 'user' ? 'Client' : 'Sarah'}: ${msg.content}\n`
    })
    
    // Add special instruction if conversation is ending
    if (isEndingConversation) {
      conversationContext += `\nClient: ${message}\nSarah (the client wants to end the conversation - respond politely with a closing message, maximum 30 words):`
    } else {
      conversationContext += `\nClient: ${message}\nSarah (respond in maximum 30 words, no asterisks):`
    }

    // Call Gemini API for main response
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversationContext
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100, // Reduced to enforce shorter responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    })

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error}`)
    }

    const geminiData = await geminiResponse.json()
    
    // Extract the AI response
    let aiResponse = "I apologize, but I'm having trouble processing your message right now. Could you please try again?"
    
    if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
      aiResponse = geminiData.candidates[0].content.parts[0].text || aiResponse
    }

    // Clean up and format the response
    aiResponse = cleanAndFormatResponse(aiResponse)

    // Use Gemini AI for intelligent lead analysis (but skip if conversation is ending)
    let leadAnalysis: LeadAnalysis
    if (isEndingConversation) {
      // Create a simple analysis for ending conversations
      leadAnalysis = createEndingConversationAnalysis(message, conversationHistory)
    } else {
      leadAnalysis = await analyzeLeadWithAI(message, aiResponse, conversationHistory, geminiApiKey)
    }
    
    // Check if we should send an email (but not for ending conversations unless they're qualified)
    const shouldSendEmail = !isEndingConversation && (leadAnalysis.isQualified || leadAnalysis.requestedInfo || leadAnalysis.schedulingIntent || leadAnalysis.meetingRequested)

    let emailSent = false
    if (shouldSendEmail && leadAnalysis.extractedData.email) {
      // If meeting was requested, send meeting details
      if (leadAnalysis.meetingRequested || leadAnalysis.schedulingIntent) {
        const meetingDetails = generateMeetingDetails(leadAnalysis)
        emailSent = await sendMeetingInvitation(leadAnalysis.extractedData, aiResponse, meetingDetails)
      } else {
        // Send regular follow-up email
        emailSent = await sendFollowUpEmail(leadAnalysis.extractedData, aiResponse, leadAnalysis.intent)
      }
    }

    // Return the AI response along with analysis data
    return new Response(
      JSON.stringify({
        response: aiResponse,
        leadAnalysis: leadAnalysis,
        emailSent: emailSent,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat message',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function detectConversationEnding(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim()
  
  // Common conversation ending phrases
  const endingPhrases = [
    'bye', 'goodbye', 'see you later', 'see you soon', 'talk later', 'speak soon',
    'i have to go', 'i need to go', 'i need to leave', 'i have to leave',
    'gotta go', 'got to go', 'need to run', 'have to run',
    'end the conversation', 'stop the conversation', 'can we end',
    'that\'s all for now', 'nothing for now', 'not right now',
    'we\'ll discuss later', 'we will discuss later', 'talk about this later',
    'thanks, that\'s all', 'thank you, that\'s all', 'that\'s enough',
    'i\'ll get back to you', 'will get back to you', 'i\'ll be in touch',
    'catch up later', 'connect later', 'follow up later'
  ]
  
  // Check if message contains any ending phrases
  return endingPhrases.some(phrase => lowerMessage.includes(phrase))
}

function createEndingConversationAnalysis(message: string, history: any[]): LeadAnalysis {
  // Create a basic analysis for ending conversations
  const fullConversation = history.map(h => h.content).join(' ').toLowerCase()
  
  // Basic email extraction
  const emailMatch = (message + ' ' + fullConversation).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  const phoneMatch = (message + ' ' + fullConversation).match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)
  
  // Basic scoring based on conversation length and data provided
  let score = Math.min(history.length * 5, 30) // Base score from engagement
  if (emailMatch) score += 20
  if (phoneMatch) score += 15
  
  return {
    isQualified: score >= 40, // Lower threshold for ending conversations
    score: Math.min(score, 100),
    intent: 'information_gathering',
    extractedData: {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      name: null,
      company: null,
      jobTitle: null,
      industry: null,
      companySize: null,
      budget: null,
      timeline: null,
      needs: null,
      painPoints: [],
      decisionMaker: null
    },
    requestedInfo: false,
    schedulingIntent: false,
    meetingRequested: false,
    preferredMeetingTime: null,
    meetingType: null,
    reasoning: 'Conversation ending - basic qualification maintained',
    nextSteps: ['Follow up via email if qualified', 'Respect their time and schedule'],
    buyingSignals: [],
    painPoints: [],
    conversationEnding: true
  }
}

function cleanAndFormatResponse(response: string): string {
  // Remove asterisks and other formatting characters
  let cleaned = response
    .replace(/\*/g, '') // Remove all asterisks
    .replace(/\#/g, '') // Remove hash symbols
    .replace(/\-\s/g, '') // Remove bullet points
    .replace(/\•/g, '') // Remove bullet symbols
    .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
    .replace(/\n/g, ' ') // Replace single newlines with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()

  // Limit to 30 words
  const words = cleaned.split(' ')
  if (words.length > 30) {
    cleaned = words.slice(0, 30).join(' ')
    
    // Ensure it ends with proper punctuation
    if (!cleaned.match(/[.!?]$/)) {
      // Remove incomplete sentence and add period
      const sentences = cleaned.split(/[.!?]/)
      if (sentences.length > 1) {
        cleaned = sentences.slice(0, -1).join('.') + '.'
      } else {
        cleaned = cleaned + '.'
      }
    }
  }

  // Ensure proper capitalization
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  return cleaned
}

async function analyzeLeadWithAI(userMessage: string, aiResponse: string, history: any[], geminiApiKey: string): Promise<LeadAnalysis> {
  try {
    // Prepare the full conversation context for analysis
    const fullConversation = history.map(h => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${userMessage}\nassistant: ${aiResponse}`

    // Create a specialized prompt for consulting lead analysis
    const analysisPrompt = `You are an expert sales analyst for a management consulting firm. Analyze this conversation with a potential client and assess their qualification as a consulting lead.

CONVERSATION TO ANALYZE:
${fullConversation}

Our consulting services include:
- Management Consulting (organizational restructuring, leadership development, change management)
- Strategy Planning (market entry, competitive analysis, growth planning, digital transformation)  
- Business Process Improvement (operational efficiency, workflow optimization, cost reduction)
- Market Research (industry analysis, customer insights, competitive intelligence)

Analyze this conversation and respond with a JSON object:

{
  "isQualified": boolean, // true if this is a qualified consulting lead (score >= 50)
  "score": number, // lead score from 0-100 based on consulting qualification criteria
  "intent": string, // one of: "high_intent", "medium_intent", "problem_aware", "information_gathering", "not_interested"
  "extractedData": {
    "name": string or null,
    "email": string or null,
    "phone": string or null,
    "company": string or null,
    "jobTitle": string or null, // CEO, VP, Director, Manager, etc.
    "industry": string or null,
    "companySize": string or null, // startup, small, medium, large, enterprise
    "budget": string or null,
    "timeline": string or null,
    "needs": string or null, // specific consulting needs mentioned
    "painPoints": [array of business challenges mentioned],
    "decisionMaker": boolean or null // likely decision maker based on title/authority
  },
  "requestedInfo": boolean, // asked for case studies, proposals, information
  "schedulingIntent": boolean, // wants to schedule consultation, assessment, call
  "meetingRequested": boolean, // explicitly asked to schedule a meeting/consultation
  "preferredMeetingTime": string or null, // any time preferences mentioned
  "meetingType": string or null, // type of meeting requested (assessment, consultation, demo, etc.)
  "reasoning": string, // explain the qualification assessment
  "nextSteps": [array of recommended actions], // what sales team should do next
  "buyingSignals": [array of consulting buying signals detected],
  "painPoints": [array of business pain points mentioned]
}

CONSULTING-SPECIFIC SCORING CRITERIA:
- Senior executive title (C-level, VP, Director): +20-25 points
- Company size (medium to large): +15-20 points
- Specific business challenges mentioned: +10-15 points each
- Budget authority or budget mentioned: +15-20 points
- Timeline for implementation: +10-15 points
- Previous consulting experience: +5-10 points
- Strategic initiatives mentioned: +10-15 points
- Operational inefficiencies mentioned: +10-15 points
- Growth challenges or market pressures: +10-15 points
- Contact information provided: +15-20 points
- Request for assessment/consultation: +15-20 points
- Meeting scheduling request: +20-25 points

MEETING/SCHEDULING DETECTION:
Look for phrases like:
- "schedule a meeting"
- "book a consultation"
- "set up a call"
- "arrange an assessment"
- "meet to discuss"
- "available for a meeting"
- "when can we talk"
- "let's schedule"
- "book an appointment"

CONSULTING BUYING SIGNALS:
- Mentions of strategic planning needs
- Operational efficiency challenges
- Organizational restructuring
- Market expansion plans
- Competitive pressures
- Process improvement needs
- Change management requirements
- Performance optimization goals
- ROI improvement objectives

Respond ONLY with the JSON object, no additional text.`

    // Call Gemini for lead analysis
    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    })

    if (!analysisResponse.ok) {
      console.error('Gemini analysis API error')
      return getFallbackAnalysis(userMessage, history)
    }

    const analysisData = await analysisResponse.json()
    
    if (analysisData.candidates && analysisData.candidates[0] && analysisData.candidates[0].content) {
      const analysisText = analysisData.candidates[0].content.parts[0].text
      
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])
          
          // Validate and sanitize the analysis
          return {
            isQualified: Boolean(analysis.isQualified),
            score: Math.min(Math.max(Number(analysis.score) || 0, 0), 100),
            intent: analysis.intent || 'information_gathering',
            extractedData: {
              name: analysis.extractedData?.name || null,
              email: analysis.extractedData?.email || null,
              phone: analysis.extractedData?.phone || null,
              company: analysis.extractedData?.company || null,
              jobTitle: analysis.extractedData?.jobTitle || null,
              industry: analysis.extractedData?.industry || null,
              companySize: analysis.extractedData?.companySize || null,
              budget: analysis.extractedData?.budget || null,
              timeline: analysis.extractedData?.timeline || null,
              needs: analysis.extractedData?.needs || null,
              painPoints: Array.isArray(analysis.extractedData?.painPoints) ? analysis.extractedData.painPoints : [],
              decisionMaker: analysis.extractedData?.decisionMaker || null
            },
            requestedInfo: Boolean(analysis.requestedInfo),
            schedulingIntent: Boolean(analysis.schedulingIntent),
            meetingRequested: Boolean(analysis.meetingRequested),
            preferredMeetingTime: analysis.preferredMeetingTime || null,
            meetingType: analysis.meetingType || null,
            reasoning: analysis.reasoning || 'AI analysis completed',
            nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : [],
            buyingSignals: Array.isArray(analysis.buyingSignals) ? analysis.buyingSignals : [],
            painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : []
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI analysis:', parseError)
      }
    }

    // Fallback if AI analysis fails
    return getFallbackAnalysis(userMessage, history)

  } catch (error) {
    console.error('Lead analysis error:', error)
    return getFallbackAnalysis(userMessage, history)
  }
}

function getFallbackAnalysis(userMessage: string, history: any[]): LeadAnalysis {
  // Simple fallback analysis if AI fails
  const message = userMessage.toLowerCase()
  const fullConversation = history.map(h => h.content).join(' ').toLowerCase()
  
  // Basic email extraction as fallback
  const emailMatch = (userMessage + ' ' + fullConversation).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  const phoneMatch = (userMessage + ' ' + fullConversation).match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)
  
  const buyingSignals = ['strategy', 'consulting', 'improve', 'efficiency', 'growth', 'planning', 'optimization']
  const detectedSignals = buyingSignals.filter(signal => message.includes(signal))
  
  const meetingKeywords = ['schedule', 'meeting', 'call', 'consultation', 'appointment', 'book', 'meet']
  const meetingRequested = meetingKeywords.some(keyword => message.includes(keyword))
  
  let score = 10 // Base score
  if (emailMatch) score += 25
  if (phoneMatch) score += 20
  if (meetingRequested) score += 25
  score += detectedSignals.length * 10
  
  return {
    isQualified: score >= 50,
    score: Math.min(score, 100),
    intent: detectedSignals.length > 0 ? 'medium_intent' : 'information_gathering',
    extractedData: {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      name: null,
      company: null,
      jobTitle: null,
      industry: null,
      companySize: null,
      budget: null,
      timeline: null,
      needs: null,
      painPoints: [],
      decisionMaker: null
    },
    requestedInfo: message.includes('send') && (message.includes('info') || message.includes('email')),
    schedulingIntent: meetingRequested,
    meetingRequested: meetingRequested,
    preferredMeetingTime: null,
    meetingType: null,
    reasoning: 'Fallback analysis due to AI processing error',
    nextSteps: ['Follow up with more qualifying questions'],
    buyingSignals: detectedSignals,
    painPoints: []
  }
}

function generateMeetingDetails(leadAnalysis: LeadAnalysis): MeetingDetails {
  // Generate meeting details based on lead analysis
  const now = new Date()
  const meetingDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  
  // Determine meeting type based on analysis
  let meetingType = 'Strategic Business Consultation'
  let duration = '45 minutes'
  let agenda = [
    'Business challenges assessment',
    'Strategic objectives discussion',
    'Consulting solutions overview',
    'Next steps and recommendations'
  ]

  if (leadAnalysis.meetingType) {
    if (leadAnalysis.meetingType.toLowerCase().includes('assessment')) {
      meetingType = 'Complimentary Strategic Assessment'
      duration = '60 minutes'
      agenda = [
        'Current state analysis',
        'Strategic gap assessment',
        'Opportunity identification',
        'Preliminary recommendations',
        'Implementation roadmap discussion'
      ]
    } else if (leadAnalysis.meetingType.toLowerCase().includes('demo')) {
      meetingType = 'Executive Briefing & Capabilities Demo'
      duration = '30 minutes'
      agenda = [
        'Strategic Solutions overview',
        'Case study presentation',
        'Methodology demonstration',
        'Q&A session'
      ]
    }
  }

  // Format date and time
  const dateStr = meetingDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = '2:00 PM EST'

  // Generate meeting links - use environment variable or generate unique meeting ID
  const baseZoomUrl = Deno.env.get('ZOOM_BASE_URL') || 'https://zoom.us/j/'
  const meetingId = Deno.env.get('ZOOM_MEETING_ID') || `${Date.now()}`
  const meetingLink = `${baseZoomUrl}${meetingId}`
  const calendarLink = generateCalendarLink(meetingDate, meetingType, duration)

  return {
    date: dateStr,
    time: timeStr,
    duration,
    type: meetingType,
    agenda,
    meetingLink,
    calendarLink
  }
}

function generateCalendarLink(date: Date, title: string, duration: string): string {
  const startTime = new Date(date)
  startTime.setHours(14, 0, 0, 0) // 2:00 PM
  
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + (duration.includes('60') ? 60 : duration.includes('30') ? 30 : 45))

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: 'Strategic business consultation with Sarah Mitchell from Strategic Solutions Consulting.',
    location: 'Video Conference (link will be provided)',
    sf: 'true',
    output: 'xml'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  if (!text) return ''
  return text.replace(/[&<>"']/g, (match) => {
    const escape: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return escape[match]
  })
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function sendMeetingInvitation(leadData: LeadData, aiResponse: string, meetingDetails: MeetingDetails): Promise<boolean> {
  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      console.log('SendGrid API key not configured, skipping email')
      return false
    }

    // Validate API key format
    if (!sendgridApiKey.startsWith('SG.')) {
      console.error('Invalid SendGrid API key format')
      return false
    }

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'sonalirajput0730@gmail.com'

    const toEmail = leadData.email
    if (!toEmail || !isValidEmail(toEmail)) {
      console.error('Invalid email address:', toEmail)
      return false
    }

    const subject = `📅 Meeting Confirmed: ${escapeHtml(meetingDetails.type)} - ${escapeHtml(meetingDetails.date)}`
    
    // Create plain text version
    const plainTextContent = `
Meeting Confirmed: ${meetingDetails.type}

Date: ${meetingDetails.date}
Time: ${meetingDetails.time}
Duration: ${meetingDetails.duration}
Type: ${meetingDetails.type}
Location: Video Conference

Meeting Link: ${meetingDetails.meetingLink}
Calendar Link: ${meetingDetails.calendarLink}

Agenda:
${meetingDetails.agenda.map(item => `- ${item}`).join('\n')}

To Prepare:
- Think about your top 3 business challenges
- Consider your strategic objectives for the next 12-18 months
- Prepare any questions about our consulting approach
- Have your calendar ready to discuss potential project timelines

Best regards,
Sarah Mitchell
Strategic Solutions Consulting
    `
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0;">Strategic Solutions Consulting</h1>
          <p style="color: #6b7280; margin: 5px 0;">Management Consulting • Strategy Planning • Process Improvement</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #1e40af; margin-bottom: 30px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0;">🎯 Meeting Confirmed!</h2>
          <p style="margin: 0; color: #1f2937;">Thank you for scheduling your ${escapeHtml(meetingDetails.type)}. I'm looking forward to our strategic discussion!</p>
        </div>

        <h2 style="color: #1f2937;">Meeting Details</h2>
        
        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: bold; color: #374151; width: 120px;">📅 Date:</span>
              <span style="color: #1f2937;">${escapeHtml(meetingDetails.date)}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: bold; color: #374151; width: 120px;">⏰ Time:</span>
              <span style="color: #1f2937;">${escapeHtml(meetingDetails.time)}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: bold; color: #374151; width: 120px;">⏱️ Duration:</span>
              <span style="color: #1f2937;">${escapeHtml(meetingDetails.duration)}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: bold; color: #374151; width: 120px;">🎯 Type:</span>
              <span style="color: #1f2937;">${escapeHtml(meetingDetails.type)}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px 0;">
              <span style="font-weight: bold; color: #374151; width: 120px;">💻 Location:</span>
              <span style="color: #1f2937;">Video Conference</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingDetails.meetingLink}" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">🎥 Join Meeting</a>
          <a href="${meetingDetails.calendarLink}" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">📅 Add to Calendar</a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">📋 Meeting Agenda:</h3>
          <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">
            ${meetingDetails.agenda.map(item => `<li style="color: #4b5563; margin-bottom: 5px;">${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">📝 To Prepare for Our Meeting:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #92400e;">
            <li>Think about your top 3 business challenges</li>
            <li>Consider your strategic objectives for the next 12-18 months</li>
            <li>Prepare any questions about our consulting approach</li>
            <li>Have your calendar ready to discuss potential project timelines</li>
          </ul>
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Questions or need to reschedule?</strong><br>
            Reply to this email or reach out anytime:<br>
            📧 <a href="mailto:sarah.mitchell@strategicsolutions.com" style="color: #1e40af;">sarah.mitchell@strategicsolutions.com</a><br>
            📞 (555) 123-4567<br>
            🌐 <a href="https://strategicsolutions.com" style="color: #1e40af;">strategicsolutions.com</a>
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          Looking forward to our strategic discussion!<br><br>
          Best regards,<br>
          Sarah Mitchell<br>
          Senior Business Development Manager<br>
          Strategic Solutions Consulting
        </p>
      </div>
    `

    const emailData = {
      personalizations: [{
        to: [{ email: toEmail, name: escapeHtml(leadData.name || '') }],
        subject: subject
      }],
      from: { email: fromEmail, name: 'Strategic Solutions Consulting' },
      reply_to: { email: fromEmail, name: 'Sarah Mitchell' },
      content: [
        {
          type: 'text/plain',
          value: plainTextContent
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (response.ok) {
      console.log('Meeting invitation sent successfully to:', toEmail)
      return true
    } else {
      const errorText = await response.text()
      console.error(`SendGrid API Error (${response.status}):`, errorText)
      
      // Handle specific error cases
      if (response.status === 429) {
        console.error('Rate limit exceeded - consider implementing retry logic')
      } else if (response.status === 401) {
        console.error('Invalid API key - check SENDGRID_API_KEY')
      } else if (response.status === 400) {
        console.error('Bad request - check email data format')
      }
      
      return false
    }

  } catch (error) {
    console.error('Meeting invitation sending error:', error)
    return false
  }
}

async function sendFollowUpEmail(leadData: LeadData, aiResponse: string, intent: string): Promise<boolean> {
  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      console.log('SendGrid API key not configured, skipping email')
      return false
    }

    // Validate API key format
    if (!sendgridApiKey.startsWith('SG.')) {
      console.error('Invalid SendGrid API key format')
      return false
    }

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'sonalirajput0730@gmail.com'

    const toEmail = leadData.email
    if (!toEmail || !isValidEmail(toEmail)) {
      console.error('Invalid email address:', toEmail)
      return false
    }

    // Customize email based on intent for consulting services
    let subject = 'Strategic Solutions for Your Business Challenges'
    
    // Create plain text version
    const plainTextContent = `
Thank you for connecting with us!

Hi${leadData.name ? ` ${leadData.name}` : ''},

It was great speaking with you about your business challenges and strategic objectives. Based on our conversation, I wanted to follow up with some relevant insights and next steps.

How We Can Help:
- Strategic planning and roadmap development
- Operational efficiency improvements
- Change management and implementation
- Market analysis and competitive positioning

Questions about strategic consulting?
Email: sarah.mitchell@strategicsolutions.com
Phone: (555) 123-4567

Best regards,
Sarah Mitchell
Strategic Solutions Consulting
    `
    
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0;">Strategic Solutions Consulting</h1>
          <p style="color: #6b7280; margin: 5px 0;">Management Consulting • Strategy Planning • Process Improvement</p>
        </div>
        
        <h2 style="color: #1f2937;">Thank you for connecting with us!</h2>
        <p>Hi${leadData.name ? ` ${escapeHtml(leadData.name)}` : ''},</p>
        <p>It was great speaking with you about your business challenges and strategic objectives. Based on our conversation, I wanted to follow up with some relevant insights and next steps.</p>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">🎯 How We Can Help:</h3>
          <ul style="line-height: 1.8;">
            <li>Strategic planning and roadmap development</li>
            <li>Operational efficiency improvements</li>
            <li>Change management and implementation</li>
            <li>Market analysis and competitive positioning</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:sarah.mitchell@strategicsolutions.com?subject=Follow-up Discussion" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">📞 Continue Our Discussion</a>
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Questions about strategic consulting?</strong><br>
            📧 <a href="mailto:sarah.mitchell@strategicsolutions.com" style="color: #1e40af;">sarah.mitchell@strategicsolutions.com</a><br>
            📞 (555) 123-4567
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          Best regards,<br>
          Sarah Mitchell<br>
          Strategic Solutions Consulting
        </p>
      </div>
    `

    const emailData = {
      personalizations: [{
        to: [{ email: toEmail, name: escapeHtml(leadData.name || '') }],
        subject: subject
      }],
      from: { email: fromEmail, name: 'Strategic Solutions Consulting' },
      reply_to: { email: fromEmail, name: 'Sarah Mitchell' },
      content: [
        {
          type: 'text/plain',
          value: plainTextContent
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (response.ok) {
      console.log('Follow-up email sent successfully to:', toEmail)
      return true
    } else {
      const errorText = await response.text()
      console.error(`SendGrid API Error (${response.status}):`, errorText)
      
      // Handle specific error cases
      if (response.status === 429) {
        console.error('Rate limit exceeded - consider implementing retry logic')
      } else if (response.status === 401) {
        console.error('Invalid API key - check SENDGRID_API_KEY')
      } else if (response.status === 400) {
        console.error('Bad request - check email data format')
      }
      
      return false
    }

  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}