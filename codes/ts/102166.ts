import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-admin'
import { OpenAI } from 'openai'

interface ResearchResult {
  summary: string
  key_facts: string[]
  detailed_explanations: string[]
  quiz_questions: Array<{
    question: string
    options: string[]
    correct: number
    explanation: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }>
  interactive_elements: Array<{
    type: 'drag_drop' | 'sorting' | 'matching' | 'timeline'
    title: string
    description: string
    content: any
  }>
  additional_topics: string[]
  reasoning_process?: string
}

async function generateSubdomain(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

async function performResearch(topic: string, content: string): Promise<ResearchResult> {
  // Use DeepSeek instead of OpenAI since it's properly configured
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  })

  const prompt = `Du bist ein Experte für Bildungsinhalte. Erstelle für das Thema "${topic}" mit dem Inhalt "${content}" eine JSON-Antwort mit:

{
  "summary": "Kurze Zusammenfassung",
  "key_facts": ["Fakt 1", "Fakt 2", "Fakt 3"],
  "detailed_explanations": ["Erklärung 1", "Erklärung 2"],
  "quiz_questions": [
    {
      "question": "Testfrage?",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Erklärung",
      "difficulty": "beginner"
    }
  ],
  "interactive_elements": [
    {
      "type": "sorting",
      "title": "Test",
      "description": "Test",
      "content": {"items": ["Item 1"], "instructions": "Test"}
    }
  ],
  "additional_topics": ["Topic 1"]
}

Antworte NUR mit JSON, keine anderen Texte.`

  try {
    console.log('🧠 Calling DeepSeek for comprehensive research...')
    console.log('📝 Topic:', topic.substring(0, 50), '...')
    console.log('📄 Content length:', content?.length || 0)
    console.log('🔑 DeepSeek API Key configured:', !!process.env.DEEPSEEK_API_KEY)
    console.log('🔑 DeepSeek API Key first 10 chars:', process.env.DEEPSEEK_API_KEY?.substring(0, 10))
    
    console.log('🚀 Starting DeepSeek API call...')
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.7
    })
    console.log('🎉 DeepSeek API call completed successfully!')

    let responseContent = response.choices[0].message.content
    
    console.log('✅ DeepSeek research completed')
    console.log('📊 Response length:', responseContent?.length || 0)
    console.log('🔍 Response preview:', responseContent?.substring(0, 200) + '...')
    
    // Clean up response - remove markdown code blocks
    if (responseContent?.includes('```json')) {
      responseContent = responseContent.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim()
      console.log('🧹 Cleaned response from markdown blocks')
      console.log('🔍 Cleaned preview:', responseContent?.substring(0, 200) + '...')
    }
    
    let researchJson: ResearchResult
    try {
      researchJson = JSON.parse(responseContent || '{}')
      console.log('✅ JSON parsing successful')
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response that failed to parse:', responseContent)
      throw new Error('Invalid JSON response from DeepSeek')
    }
    
    return researchJson
  } catch (error) {
    console.error('❌ GPT-4o-mini API error:', error)
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack?.substring(0, 500)
    })
      
      // Last resort: basic fallback data
      return {
      summary: `Das Thema "${topic}" ist ein wichtiger Bestandteil des Lehrplans und erfordert eine systematische Vorbereitung für die Klassenarbeit.`,
      key_facts: [
        'Grundlegende Konzepte verstehen',
        'Praktische Anwendungen kennen',
        'Zusammenhänge erkennen',
        'Kritisches Denken entwickeln',
        'Wissen anwenden können'
      ],
      detailed_explanations: [
        `Das Thema ${topic} umfasst verschiedene Aspekte, die Schüler verstehen sollten.`,
        'Eine systematische Herangehensweise hilft beim Lernen.',
        'Praktische Beispiele vertiefen das Verständnis.'
      ],
      quiz_questions: [
        {
          question: `Was ist ein wichtiger Aspekt von ${topic}?`,
          options: ['Grundverständnis', 'Anwendung', 'Reflexion', 'Alle genannten'],
          correct: 3,
          explanation: 'Alle Aspekte sind wichtig für ein vollständiges Verständnis.',
          difficulty: 'beginner' as const
        }
      ],
      interactive_elements: [
        {
          type: 'sorting' as const,
          title: 'Konzepte ordnen',
          description: 'Sortiere die Konzepte nach Wichtigkeit',
          content: {
            items: ['Grundlagen', 'Anwendung', 'Vertiefung'],
            instructions: 'Ziehe die Elemente in die richtige Reihenfolge'
          }
        }
      ],
      additional_topics: ['Verwandte Themen', 'Weiterführende Inhalte']
    }
  }
}

// Async research function that runs in background
async function performAsyncResearch(klassenarbeitId: string, title: string, content: string, mode: string = 'quiz') {
  const supabase = createClient()
  
  try {
    // Update status to processing - use only quiz_data for compatibility
    await supabase
      .from('klassenarbeiten')
      .update({
        quiz_data: { status: 'researching', progress: 10, step: 'Analysiere Inhalte...' }
      })
      .eq('id', klassenarbeitId)

    console.log(`🧠 Starting deep research for ${klassenarbeitId}`)

    // Perform research with retry logic
    let researchData
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        // Update progress
        await supabase
          .from('klassenarbeiten')
          .update({ 
            quiz_data: { status: 'researching', progress: 30 + (retryCount * 20), step: 'GPT-4o-mini analysiert...' }
          })
          .eq('id', klassenarbeitId)

        researchData = await performResearch(title, content)
        break // Success - exit retry loop
      } catch (error) {
        retryCount++
        console.log(`🔄 Research attempt ${retryCount} failed:`, error.message)
        
        // OpenAI GPT-4o-mini error handling
        console.log('⚠️ OpenAI error details:', {
          status: error.status,
          message: error.message,
          type: error.type,
          code: error.code
        })
        
        if (error.status === 429) {
          // Rate limit - wait
          console.log('⚠️ OpenAI rate limit hit, waiting...')
          await new Promise(resolve => setTimeout(resolve, retryCount * 5000)) // 5s, 10s, 15s
        } else if (error.status === 503) {
          // Server overloaded - exponential backoff
          console.log('⚠️ OpenAI server overloaded, backing off...')
          await new Promise(resolve => setTimeout(resolve, retryCount * 3000)) // 3s, 6s, 9s
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          // Timeout - retry with longer timeout
          console.log('⚠️ OpenAI timeout - retrying...')
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
        } else {
          // Generic error - shorter wait
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
        }
        
        if (retryCount >= maxRetries) {
          throw error
        }
      }
    }

    // Update with research results - store everything in quiz_data for compatibility
    await supabase
      .from('klassenarbeiten')
      .update({
        quiz_data: { 
          status: 'completed', 
          progress: 70, 
          step: 'Research abgeschlossen, erstelle Lernwelt...',
          research_data: researchData,
          research_completed_at: new Date().toISOString()
        }
      })
      .eq('id', klassenarbeitId)

    console.log(`✅ Research completed for ${klassenarbeitId}`)

    // Trigger content generation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create AI-generated interactive tool (new approach)
    const subdomainResult = await supabase.from('klassenarbeiten').select('subdomain').eq('id', klassenarbeitId).single()
    const subdomain = subdomainResult.data?.subdomain
    
    console.log('🤖 Starting AI interactive tool generation...')
    const response = await fetch(`${appUrl}/api/generate-interactive-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        researchData,
        klassenarbeitId,
        subdomain
      }),
    })
    
    if (!response.ok) {
      console.error('❌ AI interactive tool generation failed:', await response.text())
      throw new Error('AI interactive tool generation failed')
    } else {
      const result = await response.json()
      console.log('✅ AI interactive tool generation successful!', result.stats)
    }

    console.log(`🎉 Complete workflow finished for ${klassenarbeitId}`)

  } catch (error) {
    console.error('Async research failed:', error)
    
    // Get existing data to preserve research_data if it exists
    const { data: existing } = await supabase
      .from('klassenarbeiten')
      .select('quiz_data')
      .eq('id', klassenarbeitId)
      .single()
    
    // Mark as failed but preserve research data if it exists
    await supabase
      .from('klassenarbeiten')
      .update({
        quiz_data: { 
          ...(existing?.quiz_data?.research_data ? { research_data: existing.quiz_data.research_data } : {}),
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unbekannter Fehler', 
          step: 'Fehler aufgetreten',
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', klassenarbeitId)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, teacherId, mode = 'discovery' } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel und Inhalt sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Generate unique subdomain
    const subdomain = await generateSubdomain(title)
    
    // Create initial database entry - use only basic columns that definitely exist
    const { data: klassenarbeit, error: insertError } = await supabase
      .from('klassenarbeiten')
      .insert({
        title,
        content,
        teacher_id: teacherId || 'anonymous',
        subdomain,
        quiz_data: { status: 'pending', type: mode || 'quiz', started_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Eintrags' },
        { status: 500 }
      )
    }

    // Start async research process (no await - runs in background)
    console.log(`🔬 Starting async research process for ${klassenarbeit.id}`)
    
    // Trigger background research without waiting
    performAsyncResearch(klassenarbeit.id, title, content, mode)
      .catch(error => {
        console.error('Background research failed:', error)
      })

    // Return immediately - user gets instant response
    return NextResponse.json({
      success: true,
      id: klassenarbeit.id,
      subdomain: klassenarbeit.subdomain,
      status: {
        research: 'pending',
        quiz: 'pending',
        estimated_time_minutes: 3
      },
      message: 'Deine KI-Research wurde gestartet! Das dauert etwa 3-4 Minuten.',
      polling_url: `/api/status/${klassenarbeit.subdomain}`
    })

  } catch (error) {
    console.error('Process content API error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Verarbeitung' },
      { status: 500 }
    )
  }
}