import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TarotService {
  private apiKey: string = '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';
  private chatGptUrl: string = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

  constructor(private http: HttpClient) {}

  promptTarotCardsAndQuestion(userQuestion: string, tarotCard1: string, tarotCard2: string, tarotCard3: string): Promise<string> {
    const prompt = `Question: ${userQuestion}\nTarot Card 1: ${tarotCard1}\nTarot Card 2: ${tarotCard2}\nTarot Card 3: ${tarotCard3}`;

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };
    const testPromp = 'how are u'

    return this.http.post<any>(this.chatGptUrl, { testPromp, max_tokens: 100, n: 1, stop: null, temperature: 0.7 }, requestOptions)
      .toPromise()
      .then(response => response.choices[0].text.trim())
      .catch(error => {
        console.error('An error occurred while communicating with ChatGPT:', error);
        throw error;
      });
  }
}
