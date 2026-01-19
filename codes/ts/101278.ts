import { NextRequest, NextResponse } from 'next/server';
import { SentimentAnalyzer } from '@/lib/sentiment-analyzer';
import { ReviewModel } from '@/lib/models/Review';

// Request body interface
interface AnalyzeSentimentRequest {
  reviewText: string;
  userId?: number;
}

// Response interface
interface AnalyzeSentimentResponse {
  success: boolean;
  data?: {
    reviewText: string;
    rating: number;
    explanation: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeSentimentResponse>> {
  try {
    const body: AnalyzeSentimentRequest = await request.json();
    const { reviewText, userId } = body;

    // Validate input
    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'reviewText is required and must be a non-empty string' 
      }, { status: 400 });
    }

    if (userId && typeof userId !== 'number') {
      return NextResponse.json({ 
        success: false, 
        error: 'userId must be a number if provided' 
      }, { status: 400 });
    }

    // Analyze sentiment using ChatGPT
    const sentimentResult = await SentimentAnalyzer.analyzeSentiment(reviewText);

    // Convert rating to sentiment for database storage
    let sentimentCategory: 'Negative' | 'Positive' | 'Neutral';
    if (sentimentResult.rating <= 2) {
      sentimentCategory = 'Negative';
    } else if (sentimentResult.rating >= 4) {
      sentimentCategory = 'Positive';
    } else {
      sentimentCategory = 'Neutral';
    }

    // Save to database only if user is logged in
    if (userId) {
      try {
        await ReviewModel.create({
          reviewText,
          sentiment: sentimentCategory,
          userId,
          rating: sentimentResult.rating
        });
      } catch (dbError) {
        console.error('Database error while saving review:', dbError);
        // Continue even if DB save failed
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviewText,
        rating: sentimentResult.rating,
        explanation: sentimentResult.explanation
      }
    });
    
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle GET requests to provide information about the API
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Movie Review Sentiment Analysis API',
    version: '2.0.0',
    endpoint: {
      POST: {
        description: 'Analyze sentiment of movie review text using ChatGPT',
        usage: 'POST { reviewText: string }',
        returns: 'Rating from 1-5 (1=very negative, 5=very positive) with explanation'
      }
    }
  });
} 