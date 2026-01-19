import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 23 Kernconcepten Maatschappijwetenschappen VWO
const KERNCONCEPTEN = `
DE 23 KERNCONCEPTEN MAATSCHAPPIJWETENSCHAPPEN VWO:

POLITICOLOGIE (6 concepten):
1. Democratie - Politiek systeem waarin het volk de macht heeft
2. Legitimiteit - Rechtvaardiging van politieke macht en gezag
3. Macht - Vermogen om anderen te beïnvloeden of te dwingen
4. Politieke participatie - Deelname van burgers aan het politieke proces
5. Representatie - Vertegenwoordiging van burgers door gekozen politici
6. Soevereiniteit - Hoogste gezag binnen een staat

RECHTSWETENSCHAP (6 concepten):
7. Rechtsstaat - Staat waarin het recht boven alles staat
8. Rechtszekerheid - Voorspelbaarheid en duidelijkheid van het recht
9. Grondrechten - Fundamentele rechten van burgers
10. Rechtsgelijkheid - Gelijke behandeling voor de wet
11. Machtenscheiding - Verdeling van staatsmacht over verschillende organen
12. Rechtvaardigheid - Morele basis van het recht

ECONOMIE (6 concepten):
13. Marktwerking - Mechanisme van vraag en aanbod
14. Marktfalen - Situaties waarin de markt niet optimaal functioneert
15. Overheidsinterventie - Ingrijpen van de overheid in de economie
16. Welvaart - Materiële welstand van individuen en samenleving
17. Verdeling - Spreiding van inkomen en vermogen
18. Duurzaamheid - Evenwicht tussen economie, milieu en samenleving

SOCIOLOGIE (5 concepten):
19. Socialisatie - Proces waarin mensen normen en waarden leren
20. Sociale cohesie - Samenhang en verbondenheid in de samenleving
21. Sociale stratificatie - Gelaagdheid van de samenleving
22. Culturele diversiteit - Verscheidenheid aan culturen in de samenleving
23. Sociale controle - Mechanismen om gedrag te sturen en af te dwingen

GEBRUIK DEZE CONCEPTEN:
- Elke vraag moet minimaal 1 kernconcept bevatten
- Leg duidelijk uit welk(e) concept(en) aan bod komen
- Zorg voor spreiding over alle 4 domeinen
- Gebruik de juiste terminologie bij elk concept
`

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { 
          error: 'API configuratie ontbreekt. Check Environment Variables.',
          hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
        }, 
        { status: 500 }
      )
    }

    // Parse request data
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Tekst is vereist en moet een string zijn' },
        { status: 400 }
      )
    }

    if (text.length < 100) {
      return NextResponse.json(
        { error: 'Tekst moet minimaal 100 karakters bevatten voor een goede quiz' },
        { status: 400 }
      )
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: 'Tekst mag maximaal 50.000 karakters bevatten' },
        { status: 400 }
      )
    }

    // Use Gemini 2.5 Flash for quiz generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
Je bent een expert docent Maatschappijwetenschappen VWO. Analyseer de volgende tekst en genereer een quiz van EXACT 10 vragen:
- 5 multiple choice vragen (elk met 4 antwoordopties A, B, C, D)
- 5 open vragen

BELANGRIJKE EISEN:
1. Alle vragen moeten gebaseerd zijn op de gegeven tekst
2. Elke vraag moet minimaal 1 van de 23 kernconcepten bevatten
3. Zorg voor spreiding over alle 4 domeinen (Politicologie, Rechtswetenschap, Economie, Sociologie)
4. Varieer in moeilijkheidsgraad (basis, gemiddeld, gevorderd)
5. Gebruik de juiste terminologie van de kernconcepten
6. Multiple choice vragen moeten 1 correct antwoord hebben
7. Open vragen moeten analytisch/evaluerend zijn

${KERNCONCEPTEN}

TEKST OM TE ANALYSEREN:
${text}

Geef je antwoord in EXACT deze JSON structuur:
{
  "title": "Korte beschrijvende titel voor de quiz",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "De vraag hier...",
      "options": ["A. Optie 1", "B. Optie 2", "C. Optie 3", "D. Optie 4"],
      "correct_answer": "A",
      "explanation": "Uitleg waarom dit het juiste antwoord is...",
      "kernconcepten": ["Democratie", "Legitimiteit"],
      "domein": "Politicologie"
    },
    {
      "id": 2,
      "type": "open",
      "question": "Open vraag hier...",
      "explanation": "Antwoordrichtlijn en belangrijke punten...",
      "kernconcepten": ["Rechtsstaat", "Rechtszekerheid"],
      "domein": "Rechtswetenschap"
    }
  ],
  "generated_at": "${new Date().toISOString()}",
  "source_text_preview": "${text.substring(0, 100).replace(/"/g, '\\"')}"
}

VERDELING OVER DOMEINEN (richtlijn):
- Politicologie: 2-3 vragen
- Rechtswetenschap: 2-3 vragen  
- Economie: 2-3 vragen
- Sociologie: 2-3 vragen

Zorg ervoor dat je EXACT 5 multiple choice en 5 open vragen maakt, genummerd van 1 tot 10.
`

    console.log('Generating quiz with 23 kernconcepten...')

    const result = await model.generateContent(prompt)
    const response = await result.response
    let responseText = response.text()

    // Clean up the response to extract JSON
    responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim()

    // Parse the JSON response
    let quiz
    try {
      quiz = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', responseText)
      throw new Error('Ongeldig JSON antwoord van AI model')
    }

    // Validate the quiz structure
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('Ongeldige quiz structuur: geen vragen array')
    }

    if (quiz.questions.length !== 10) {
      throw new Error(`Verwacht 10 vragen, maar kreeg ${quiz.questions.length}`)
    }

    const mcQuestions = quiz.questions.filter((q: any) => q.type === 'multiple_choice')
    const openQuestions = quiz.questions.filter((q: any) => q.type === 'open')

    if (mcQuestions.length !== 5) {
      throw new Error(`Verwacht 5 multiple choice vragen, maar kreeg ${mcQuestions.length}`)
    }

    if (openQuestions.length !== 5) {
      throw new Error(`Verwacht 5 open vragen, maar kreeg ${openQuestions.length}`)
    }

    // Validate each question
    for (const question of quiz.questions) {
      if (!question.question || !question.explanation || !question.kernconcepten || !question.domein) {
        throw new Error('Elke vraag moet een question, explanation, kernconcepten en domein hebben')
      }

      if (question.type === 'multiple_choice') {
        if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error('Multiple choice vragen moeten exact 4 opties hebben')
        }
        if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
          throw new Error('Multiple choice vragen moeten een geldig correct_answer hebben (A, B, C, of D)')
        }
      }
    }

    console.log('Quiz generation successful:', {
      title: quiz.title,
      totalQuestions: quiz.questions.length,
      mcQuestions: mcQuestions.length,
      openQuestions: openQuestions.length,
      domeinen: quiz.questions.map((q: any) => q.domein)
    })

    return NextResponse.json(quiz)

  } catch (error: any) {
    console.error('Quiz generation error:', error)
    
    // Handle specific Gemini API errors
    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { 
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Rate limit exceeded'
        },
        { status: 429 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het genereren van de quiz',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}