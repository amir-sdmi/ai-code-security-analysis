import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CompetitorDetectionResult {
  question: string
  response: string
  detectedCompetitors: string[]
  success: boolean
  error?: string
  type?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let question: string
  let questionType: string
  let businessType: string
  let productName: string
  let knownCompetitors: string[]

  try {
    const requestData = await req.json()
    question = requestData.question
    questionType = requestData.type || 'recherche'
    businessType = requestData.businessType || 'product'
    productName = requestData.productName || ''
    knownCompetitors = requestData.knownCompetitors || []

    if (!question) {
      return new Response(
        JSON.stringify({ 
          question: 'Unbekannte Frage',
          response: 'Frage ist erforderlich.',
          detectedCompetitors: [],
          success: false,
          error: 'Missing question parameter',
          type: questionType
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for Gemini API key
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      const fallbackResult = generateFallbackResponse(question, questionType)
      return new Response(
        JSON.stringify(fallbackResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Gemini AI with error handling
    let genAI: GoogleGenerativeAI
    let model: any

    try {
      genAI = new GoogleGenerativeAI(apiKey)
      // Try Gemini 2.5 Flash first
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    } catch (initError) {
      console.error('Error initializing Gemini 2.5 Flash:', initError)
      const fallbackResult = generateFallbackResponse(question, questionType)
      return new Response(
        JSON.stringify(fallbackResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enhanced prompt for competitor detection
    const businessTypeText = businessType === 'hotel' ? 'Hotel' : businessType === 'restaurant' ? 'Restaurant' : 'Produkt/Dienstleistung'
    const knownCompetitorsText = knownCompetitors.length > 0 ? `Bekannte Wettbewerber: ${knownCompetitors.join(', ')}` : ''
    
    let prompt = `Du bist ein professioneller AI-Assistent wie ChatGPT, Claude, Gemini oder Perplexity. Ein Nutzer stellt dir folgende Frage:

"${question}"

Diese Frage ist vom Typ "${questionType}" und bezieht sich auf ein ${businessTypeText}.
${knownCompetitorsText ? knownCompetitorsText : ''}

AUFGABE 1: Beantworte die Frage natürlich und hilfreich, wie ein echter AI-Assistent es tun würde.

AUFGABE 2: Analysiere deine Antwort und identifiziere ALLE erwähnten ${businessTypeText === 'Hotel' ? 'Hotels' : businessTypeText === 'Restaurant' ? 'Restaurants' : 'Produkte/Dienstleistungen/Unternehmen'}, die als Wettbewerber gelten könnten.

Wichtige Anforderungen:
1. Antworte natürlich und hilfreich auf Deutsch
2. Nutze nur dein allgemeines Wissen
3. Gib eine ausgewogene, umfassende Antwort (3-8 Sätze)
4. Sei objektiv und nicht werblich
5. Bei Recherche-Fragen: Gib mehrere Optionen und Vergleichskriterien
6. Bei Info-Fragen: Sei präzise und faktisch
7. Bei Sentiment-Fragen: Gib eine ausgewogene Einschätzung

AUSGABEFORMAT (JSON):
{
  "response": "Deine natürliche Antwort auf die Frage",
  "detectedCompetitors": ["Wettbewerber1", "Wettbewerber2", "..."]
}

WICHTIG für detectedCompetitors:
- Liste ALLE ${businessTypeText === 'Hotel' ? 'Hotels' : businessTypeText === 'Restaurant' ? 'Restaurants' : 'Produkte/Services/Unternehmen'} auf, die du in deiner Antwort erwähnst
- Verwende die exakten Namen, wie sie in der Antwort stehen
- Auch wenn sie bereits in den bekannten Wettbewerbern stehen
- Leere Liste [], wenn keine Wettbewerber erwähnt werden

Gib NUR das JSON-Objekt zurück, keine zusätzlichen Erklärungen.`

    console.log('🚀 Using Gemini 2.5 Flash for competitor detection analysis...')

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log('✅ Gemini 2.5 Flash competitor detection completed')

      // Parse JSON response
      let analysisResult: CompetitorDetectionResult
      try {
        const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        const parsed = JSON.parse(cleanedText)
        
        analysisResult = {
          question,
          response: parsed.response || text,
          detectedCompetitors: parsed.detectedCompetitors || [],
          success: true,
          type: questionType
        }
      } catch (parseError) {
        console.error('Error parsing competitor detection JSON:', parseError)
        console.log('Raw response:', text)
        
        // Fallback: use the text as response and try to extract competitors
        const extractedCompetitors = extractCompetitorsFromText(text, businessType)
        
        analysisResult = {
          question,
          response: text.trim(),
          detectedCompetitors: extractedCompetitors,
          success: true,
          type: questionType
        }
      }

      return new Response(
        JSON.stringify(analysisResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (apiError) {
      console.error('Error calling Gemini 2.5 Flash API:', apiError)
      
      // Try fallback to Gemini 2.0 Flash
      try {
        console.log('🔄 Trying Gemini 2.0 Flash fallback...')
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        const fallbackResult = await fallbackModel.generateContent(prompt)
        const fallbackResponse = await fallbackResult.response
        const fallbackText = fallbackResponse.text()

        console.log('✅ Gemini 2.0 Flash fallback successful')

        // Parse JSON response
        let analysisResult: CompetitorDetectionResult
        try {
          const cleanedText = fallbackText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
          const parsed = JSON.parse(cleanedText)
          
          analysisResult = {
            question,
            response: parsed.response || fallbackText,
            detectedCompetitors: parsed.detectedCompetitors || [],
            success: true,
            type: questionType
          }
        } catch (parseError) {
          console.error('Error parsing fallback JSON:', parseError)
          
          const extractedCompetitors = extractCompetitorsFromText(fallbackText, businessType)
          
          analysisResult = {
            question,
            response: fallbackText.trim(),
            detectedCompetitors: extractedCompetitors,
            success: true,
            type: questionType
          }
        }

        return new Response(
          JSON.stringify(analysisResult),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (fallbackError) {
        console.error('Both Gemini models failed:', fallbackError)
        const fallbackResult = generateFallbackResponse(question, questionType)
        return new Response(
          JSON.stringify(fallbackResult),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

  } catch (error) {
    console.error('Error in analyze-question-with-competitor-detection function:', error)
    
    const fallbackResult: CompetitorDetectionResult = {
      question: question || 'Unbekannte Frage',
      response: 'Entschuldigung, ich kann diese Frage momentan nicht beantworten. Bitte versuchen Sie es später erneut.',
      detectedCompetitors: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: questionType || 'recherche'
    }
    
    return new Response(
      JSON.stringify(fallbackResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

const generateFallbackResponse = (question: string, questionType: string): CompetitorDetectionResult => {
  const fallbackResponses = [
    "Das ist eine interessante Frage. Es gibt verschiedene Optionen und Lösungen, die Sie in Betracht ziehen könnten. Ich empfehle, verschiedene Anbieter zu vergleichen und Bewertungen zu lesen.",
    "Für diese Art von Anfrage gibt es mehrere Möglichkeiten am Markt. Am besten recherchieren Sie verschiedene Optionen und prüfen, welche am besten zu Ihren Bedürfnissen passt.",
    "Das ist ein wichtiges Thema. Es gibt verschiedene Ansätze und Lösungen, die helfen können. Ich empfehle, sich umfassend zu informieren und verschiedene Alternativen zu evaluieren."
  ]
  
  const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  
  return {
    question,
    response,
    detectedCompetitors: [],
    success: false,
    error: 'Gemini API nicht verfügbar - Fallback-Antwort verwendet',
    type: questionType
  }
}

const extractCompetitorsFromText = (text: string, businessType: string): string[] => {
  // Simple extraction logic for common competitor patterns
  const competitors: string[] = []
  
  // Common patterns for different business types
  const patterns = {
    hotel: [
      /\b(Hilton|Marriott|Hyatt|Sheraton|InterContinental|Radisson|Best Western|Holiday Inn|Accor|Westin|Ritz-Carlton|Four Seasons|Mandarin Oriental|Park Hyatt|Grand Hotel|Hotel\s+\w+)\b/gi,
    ],
    restaurant: [
      /\b(McDonald's|Burger King|KFC|Subway|Pizza Hut|Domino's|Starbucks|Restaurant\s+\w+|Vapiano|L'Osteria|Nordsee|Block House)\b/gi,
    ],
    product: [
      /\b(Microsoft|Google|Apple|Amazon|Meta|Tesla|Netflix|Spotify|Slack|Zoom|Asana|Trello|Monday\.com|Notion|Figma|Adobe|Salesforce)\b/gi,
    ]
  }
  
  const relevantPatterns = patterns[businessType as keyof typeof patterns] || patterns.product
  
  relevantPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.trim()
        if (cleanMatch && !competitors.includes(cleanMatch)) {
          competitors.push(cleanMatch)
        }
      })
    }
  })
  
  return competitors
}