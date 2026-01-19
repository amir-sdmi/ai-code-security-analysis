
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  agent: 'OrgBrain' | 'AutoReplyComposer' | 'ToneImpactMeter' | 'MeetingNotesGen';
  prompt?: string;
  threadMessages?: any[];
  contextDocs?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request received:', req.method, req.url);
    
    let requestBody;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { agent, prompt, threadMessages, contextDocs } = requestBody as AIRequest;
    
    console.log(`AI Service Handler received request for ${agent}:`, { 
      prompt: prompt?.substring(0, 100), 
      threadMessagesCount: threadMessages?.length,
      contextDocsCount: contextDocs?.length 
    });

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (agent) {
      case 'OrgBrain':
        systemPrompt = `You are OrgBrain, an intelligent assistant that helps users understand and navigate their organization's information. You have access to channel messages and documents. Provide helpful, accurate responses about organizational data, channels, and documents. Be conversational and helpful.`;
        
        // Include context documents if provided
        let contextInfo = '';
        if (contextDocs && contextDocs.length > 0) {
          contextInfo = `\n\nContext from organization documents and channels:\n${contextDocs.join('\n\n')}`;
        }
        
        userPrompt = `${prompt || 'Please provide a summary of the organization.'}${contextInfo}`;
        break;

      case 'AutoReplyComposer':
        systemPrompt = `You are an intelligent reply composer. Generate 2-3 appropriate, professional reply suggestions based on the thread context. Return your response as a JSON array of strings containing the suggested replies.`;
        
        const messages = threadMessages || [];
        userPrompt = `Generate reply suggestions for this conversation thread:

Thread messages:
${messages.map((msg: any, index: number) => 
  `${index + 1}. ${msg.user?.name || 'Unknown'}: ${msg.content}`
).join('\n')}

Please suggest 2-3 appropriate replies as a JSON array of strings.`;
        break;

      case 'ToneImpactMeter':
        systemPrompt = `You are a tone analysis expert. Analyze the tone and potential impact of messages. Return your response as a JSON object with this structure:
        {
          "tone": "professional|casual|urgent|aggressive|weak|confusing|neutral|positive",
          "impact": "high|medium|low",
          "confidence": 85,
          "suggestions": ["suggestion1", "suggestion2"]
        }`;
        
        userPrompt = `Analyze the tone and impact of this message: "${prompt}"`;
        break;

      case 'MeetingNotesGen':
        systemPrompt = `You are a professional meeting notes generator. Create comprehensive, well-structured meeting notes from the provided messages. Include:
        - Meeting summary
        - Key discussion points
        - Action items (if any)
        - Important decisions made
        - Next steps

        Format the notes professionally and make them easy to read.`;
        
        const meetingMessages = threadMessages || [];
        
        userPrompt = `Generate meeting notes from these discussion messages:

Messages from the discussion:
${meetingMessages.map((msg: any, index: number) => 
  `${index + 1}. ${msg.user?.name || 'Unknown'}: ${msg.content}`
).join('\n')}

Please create comprehensive meeting notes from these messages.`;
        break;

      default:
        throw new Error(`Unknown agent: ${agent}`);
    }

    console.log(`Calling Gemini API for ${agent}`);

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    };

    console.log('Gemini request payload:', JSON.stringify(geminiPayload, null, 2));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const geminiResponse = await response.json();
    console.log('Gemini response:', geminiResponse);

    // Extract text from Gemini response
    const generatedContent = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      throw new Error('No content generated by Gemini');
    }

    console.log(`${agent} response generated successfully`);

    // Format response based on agent type
    let result;
    switch (agent) {
      case 'OrgBrain':
        result = { 
          response: generatedContent,
          sources: {
            channels: contextDocs ? Math.min(contextDocs.length, 5) : 3,
            messages: contextDocs ? Math.min(contextDocs.length * 5, 25) : 15,
            documents: contextDocs ? contextDocs.length : 2
          }
        };
        break;
        
      case 'AutoReplyComposer':
        try {
          // Try to parse as JSON array first
          const suggestions = JSON.parse(generatedContent);
          result = { suggestions: Array.isArray(suggestions) ? suggestions : [generatedContent] };
        } catch {
          // Fallback: split by lines and clean up
          const lines = generatedContent.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(line => line.length > 0);
          result = { suggestions: lines.slice(0, 3) };
        }
        break;
        
      case 'ToneImpactMeter':
        try {
          // Try to parse as JSON first
          const analysis = JSON.parse(generatedContent);
          result = analysis;
        } catch {
          // Fallback to basic analysis
          result = { 
            tone: 'neutral', 
            impact: 'medium', 
            confidence: 75,
            suggestions: ['Consider revising for clarity'],
            analysis: generatedContent 
          };
        }
        break;
        
      case 'MeetingNotesGen':
        result = { notes: generatedContent };
        break;
        
      default:
        result = { content: generatedContent };
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error(`Error in ai-service-handler function:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
