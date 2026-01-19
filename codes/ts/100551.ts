import { NextRequest, NextResponse } from 'next/server';
// AI Generated with ChatGPT for efficiency but unused code; directly called backend API in pages instread

const BACKEND_API_URL = process.env.BACKEND_API_URL as string;

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        
        const response = await fetch(`${BACKEND_API_URL}/create_prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Failed to create prompt: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/get_prompts/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch prompts: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}