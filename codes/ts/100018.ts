// types to be used to communicate with ChatGPT
export interface TreatedRequest {}

export interface SentenceRules extends TreatedRequest {
  language: string;
  words: string[];
}

export interface Languages extends TreatedRequest {
  wordNumber: number;
  languages: string[];
}
