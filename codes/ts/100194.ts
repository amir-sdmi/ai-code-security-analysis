import { Injectable } from '@angular/core';
import {  OpenAI } from 'openai';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AiHelpServiceService {

  constructor() { }

  public chat(message: string):Observable<any> {
      // Use chatgpt.query method with optional parameters
      let openai = new OpenAI({apiKey:"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", dangerouslyAllowBrowser: true });
       let apiResponse =  openai.chat.completions.create({
        messages: [{ role: "system", content: message }],
        model: "gpt-3.5-turbo",
      });

      return from(apiResponse)
      // .subscribe((res)=>{
      //   console.log("Api response", res);
      // })
      // return 'Something went wrong.';

      // Return the response text
      // return apiResponse.choices[0];
  }
}
