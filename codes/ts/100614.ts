import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ApiServiceService {

  // Making instance of HttpClient
  constructor(private http: HttpClient) { }
  
  // Returning the list of the curencies.
  fetchCurrencies() {
    
    // Api url found using chatGPT
    const apiUrl = 'https://openexchangerates.org/api/currencies.json';
    // Calling get request
    return this.http.get(apiUrl);
  }

  // getCurrencyRates(base:string){

  //   // Accepting base as parameter and fetching the rates using api
  //   const url = 'https://api.exchangerate.host/latest?base='+base;
  //   // Calling get request
  //   return this.http.get(url);
  // }

  getCurrencyRates(from: string, to: string, q: string){
    const apiUrl = 'https://currency-exchange.p.rapidapi.com/exchange';
    const headers = new HttpHeaders({
      'X-RapidAPI-Key': '11f588acdcmshb2d5f84a2a42fffp17888fjsne0984aa9880a',
      'X-RapidAPI-Host': 'currency-exchange.p.rapidapi.com'
    });

    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('q', q);

    return this.http.get<any>(apiUrl, { headers, params });
  }

}



