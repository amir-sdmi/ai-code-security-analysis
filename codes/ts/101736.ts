import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate environment variables
const validateEnvVariables = () => {
    const required = {
        'VITE_OPENAI_API_KEY': import.meta.env.VITE_OPENAI_API_KEY,
        'VITE_GEMINI_API_KEY': import.meta.env.VITE_GEMINI_API_KEY,
        'VITE_GROK_API_KEY': import.meta.env.VITE_GROK_API_KEY
    };

    const missing = Object.entries(required)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

try {
    validateEnvVariables();
} catch (error) {
    console.error('Environment validation failed:', error);
}

// Initialize the OpenAI client with browser compatibility
const ai = new OpenAI({
    apiKey: import.meta.env.VITE_GROK_API_KEY,
    baseURL: 'https://api.x.ai/v1',
    dangerouslyAllowBrowser: true, // Enable browser usage
    defaultHeaders: {
        'Content-Type': 'application/json',
    },
    defaultQuery: undefined
});

const gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const geminiVisionModel = gemini.getGenerativeModel({ model: "gemini-pro-vision" });

export interface AIResponse {
    text?: string;
    error?: string;
    images?: string[];
    source?: 'grok' | 'gemini' | 'whisper';
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const aiService = {
    async retryWithDelay<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.retryWithDelay(fn, retries - 1);
            }
            throw error;
        }
    },

    // Text-based query using Grok
    async query(prompt: string): Promise<AIResponse> {
        try {
            const completion = await this.retryWithDelay(async () => {
                return ai.chat.completions.create({
                    model: "grok-beta",
                    messages: [
                        {
                            role: "system",
                            content: "You are a knowledgeable local guide for Diani Beach, Kenya. Provide helpful, accurate, and engaging information about local attractions, activities, and services."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });
            });

            return {
                text: completion.choices[0].message.content,
                source: 'grok'
            };
        } catch (error) {
            console.error('AI Query Error:', error);
            return {
                error: error instanceof Error ? error.message : 'Failed to process your request. Please try again.',
                source: 'grok'
            };
        }
    },

    // Image analysis using Gemini Vision
    async analyzeImage(imageUrl: string): Promise<AIResponse> {
        try {
            // Convert image URL to base64
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const base64data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            // Generate prompt for image analysis
            const prompt = `Analyze this image in the context of Diani Beach, Kenya. 
            Please identify:
            1. Type of location or establishment
            2. Notable features or attractions
            3. Relevant tourist information
            4. Similar places in Diani Beach
            
            Provide a natural, informative response that would be helpful for tourists.`;

            const result = await this.retryWithDelay(async () => {
                return geminiVisionModel.generateContent([
                    prompt,
                    { inlineData: { data: base64data, mimeType: "image/jpeg" } }
                ]);
            });

            const geminiResponse = await result.response;
            
            // Use Grok to enhance the response with local context
            const grokEnhancement = await this.retryWithDelay(async () => {
                return ai.chat.completions.create({
                    model: "grok-beta",
                    messages: [
                        {
                            role: "system",
                            content: "You are a Diani Beach local expert. Enhance this image analysis with specific local knowledge and recommendations."
                        },
                        {
                            role: "user",
                            content: `Based on this image analysis: ${geminiResponse.text()}\n\nProvide specific local insights and recommendations for visitors to Diani Beach.`
                        }
                    ]
                });
            });

            return {
                text: grokEnhancement.choices[0].message.content,
                source: 'gemini'
            };
        } catch (error) {
            console.error('Image Analysis Error:', error);
            return {
                error: error instanceof Error ? error.message : 'Failed to analyze the image. Please try again.',
                source: 'gemini'
            };
        }
    },

    // Voice transcription using OpenAI Whisper
    async transcribeAudio(audioBlob: Blob): Promise<AIResponse> {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('model', 'whisper-1');

            const response = await this.retryWithDelay(async () => {
                return fetch('https://api.openai.com/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                    },
                    body: formData
                });
            });

            const data = await response.json();
            return {
                text: data.text,
                source: 'whisper'
            };
        } catch (error) {
            console.error('Audio Transcription Error:', error);
            return {
                error: error instanceof Error ? error.message : 'Failed to transcribe audio. Please try again.',
                source: 'whisper'
            };
        }
    }
};
