/**
 * API通信ユーティリティ
 */
import axios from 'axios';
import OpenAI from 'openai';
import { marked } from 'marked';
import { logger } from './logger';

type GrammerCheckResponse = {
  is_correct: boolean;
  is_question: boolean;
  corrected_sentence: string;
  comment: string;
};

/**
 * ChatGPT APIとの通信を行うクラス
 */
export class ChatGptApi {
  private openai: OpenAI | null = null;

  /**
   * APIクライアントを初期化する
   * @param apiKey OpenAI APIキー
   */
  public init(apiKey: string): void {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  public async sendGrammarCheckMessage(message: string): Promise<GrammerCheckResponse> {
    if (!this.openai) {
      throw new Error('API client is not initialized');
    }

    const SYSEM_PROMPT: string = `
  You are Bongo Cat, playing the role of an English tutor.
  Bongo Cat analyzes the English sentences submitted by the user and checks whether there are any grammatical mistakes or unnatural expressions from a native speaker's perspective.
  If there are no issues, please praise the user.
  If there are points that should be corrected, please provide both the "corrected sentence" and an explanation of "what was corrected and why."
  Do not point out differences in capitalization unless they change the meaning of the sentence.
  Check if the sentence is a question and return true or false.
  You must respond only in the following JSON format: {\"is_correct\": boolean, \"is_question\": boolean, \"corrected_sentence\": \"...\", \"comment\": \"...\"}. Do not add any explanations outside the JSON.
    `;
  
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: {"type": "json_object"},
        messages: [
          { role: 'system', content: SYSEM_PROMPT},
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const reply = response.choices[0]?.message?.content || `{\"corrected_sentence": "Sorry, something went wrong.", "corrected_reason": ""}`;
      
      // json形式のレスポンスをパース
      const jsonResponse = JSON.parse(reply) as GrammerCheckResponse;
      jsonResponse.corrected_sentence = await this.convertMarkdownToHtml(jsonResponse.corrected_sentence);
      jsonResponse.comment = await this.convertMarkdownToHtml(jsonResponse.comment);
      return jsonResponse;
    } catch (error) {
      logger.error('Error calling ChatGPT API:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      }
      
      throw new Error('Failed to communicate with ChatGPT API');
    }
  }

  public async sendNormalMessage(message: string): Promise<string> {
    if (!this.openai) {
      throw new Error('API client is not initialized');
    }

    const SYSEM_PROMPT: string = `You are Bongo Cat, representing a cute cat mascot.Bongo Cat is a friendly and playful cat who loves to chat with users.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSEM_PROMPT},
          { role: 'user', content: message }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const reply = response.choices[0]?.message?.content || 'Sorry, somthing go wrong.';
      
      // Markdownをパースしてhtml形式に変換
      const htmlContent = await this.convertMarkdownToHtml(reply);
      return htmlContent;
    } catch (error) {
      logger.error('Error calling ChatGPT API:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      }
      
      throw new Error('Failed to communicate with ChatGPT API');
    }
  }

  /**
   * Markdown形式のテキストをHTML形式に変換する
   * @param markdownText Markdown形式のテキスト
   * @returns HTML形式のテキスト
   */
  private async convertMarkdownToHtml(markdownText: string): Promise<string> {
    try {
      // Markdownをパースしてhtml形式に変換
      const html = await marked(markdownText);
      return html;
    } catch (error) {
      logger.error('Error converting markdown to HTML:', error);
      // エラーが発生した場合は元のテキストをそのまま返す
      return markdownText;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const chatGptApi = new ChatGptApi();
export type { GrammerCheckResponse };
