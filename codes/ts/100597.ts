import { NextResponse } from 'next/server';
// AI Generated with ChatGPT for efficiency but unused code; directly called backend API in pages instread

// Define the base URL for the backend API
const BACKEND_API_URL = process.env.BACKEND_API_URL as string;

// GET: Fetch user data
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const spotifyId = searchParams.get('spotify_id'); 

    if (!spotifyId) {
        return NextResponse.json({ error: 'spotify_id is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/get_user/${spotifyId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const userData = await response.json();
        return NextResponse.json(userData);
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed to fetch user data' }), { status: 500 });
    }
}

// POST: Create a new user
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const response = await fetch(`${BACKEND_API_URL}/create_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Failed to create user: ${response.statusText}`);
        }

        const createdUser = await response.json();
        return NextResponse.json(createdUser);
    } catch (error) {
         return new NextResponse(JSON.stringify({ error: 'Failed to fetch user data' }), { status: 500 });
}
}