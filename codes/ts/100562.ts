import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Tweet {
  id: string;
  text: string;
  username: string;
}

export async function POST(request: Request) {
  try {
    const { usernames, tweets, systemPrompt } = await request.json() as { 
      usernames: string[], 
      tweets: Tweet[],
      systemPrompt: string 
    };

    // Create the egregore using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: systemPrompt + tweets.map(t => `@${t.username}: ${t.text}`).join('\n\n')
        },
        {
          role: "user",
          content: `Welcome to reality! Please, introduce yourself.`
        }
      ],
    });

    return NextResponse.json({ 
      message: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('Error creating egregore:', error);
    return NextResponse.json(
      { error: 'Failed to create egregore' },
      { status: 500 }
    );
  }
} 