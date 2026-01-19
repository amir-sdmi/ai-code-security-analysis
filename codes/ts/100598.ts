import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import Subject from '@/models/Subject';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    await connectDB();
    const subjectId = params.id;
    const { question } = await request.json();
    const subject = await Subject.findOne({ _id: subjectId, userId: decoded.userId });
    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }
    // Concatenate all topic contents
    const allNotes = (subject.topics || []).map((t: any) => t.content).join('\n\n');
    // Use Gemini API for answer
    const apiKey = process.env.GEMINI_API_KEY;
    let answer = "Sorry, I couldn't find an answer in your notes.";
    if (apiKey && allNotes && question) {
      const prompt = `You are an expert computer science tutor. Given the following notes, answer the student's question in detail.\n\nNotes: ${allNotes}\n\nQuestion: ${question}`;
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) answer = text;
        }
      } catch (e) {
        console.error('Gemini chat error:', e);
      }
    }
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 