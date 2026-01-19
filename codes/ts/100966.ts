import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { message, projectId } = await req.json()
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Get relevant documents for the query
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', projectId)

    if (docsError) throw docsError

    // Create embeddings for the query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: message,
    })

    // Get relevant document content
    const context = documents
      .map(doc => doc.content)
      .join('\n\n')

    // Generate response using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant. Use the following context to answer questions:\n\n${context}`
        },
        {
          role: "user",
          content: message
        }
      ],
    })

    const response = completion.choices[0].message.content

    // Save the messages to the database
    const { error: insertError } = await supabase.from('chat_messages').insert([
      {
        project_id: projectId,
        user_id: user.id,
        content: message,
        role: 'user'
      },
      {
        project_id: projectId,
        user_id: user.id,
        content: response,
        role: 'assistant'
      }
    ])

    if (insertError) throw insertError

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 