import OpenAI from 'openai';
import * as fs from 'fs';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      const audioFile = fs.createReadStream(audioFilePath);
      
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text'
      });

      console.log(`Successfully transcribed audio file: ${audioFilePath}`);
      return response;
    } catch (error) {
      console.error(`Transcription failed for ${audioFilePath}:`, error);
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  }

  /**
   * Analyze transcript using ChatGPT with user's custom prompt
   */
  async analyzeTranscript(transcript: string, userPrompt: string): Promise<string> {
    try {
      const systemMessage = `You are an expert assistant analyzing audio transcripts. 
        Provide detailed, helpful analysis based on the user's specific request. 
        Be thorough and insightful in your response.`;

      const userMessage = `Please analyze the following transcript based on this request: "${userPrompt}"

TRANSCRIPT:
${transcript}

Please provide a comprehensive analysis addressing the user's request.`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
      // do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('No analysis content received from OpenAI');
      }

      console.log('Successfully completed transcript analysis');
      return analysis;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error(`Failed to analyze transcript: ${error}`);
    }
  }

  /**
   * Create a summary of the transcript
   */
  async summarizeTranscript(transcript: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing audio transcripts. Provide a clear, concise summary that captures the main points and key information.'
          },
          {
            role: 'user',
            content: `Please summarize this transcript:\n\n${transcript}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      });

      const summary = response.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('No summary content received from OpenAI');
      }

      return summary;
    } catch (error) {
      console.error('Summarization failed:', error);
      throw new Error(`Failed to summarize transcript: ${error}`);
    }
  }
}