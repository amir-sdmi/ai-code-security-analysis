// types to be used to communicate with ChatGPT
export interface TreatedRequest {}

export interface SentenceRules extends TreatedRequest {
  language: string;
  words: string[];
}

export class SentenceRules {
  constructor(sentenceRules: SentenceRules) {
    this.language = sentenceRules.language;
    this.words = sentenceRules.words;
  }
}

export interface Languages extends TreatedRequest {
  wordNumber: number;
  languages: string[];
}

export class Languages {
  constructor(languages: Languages) {
    this.wordNumber = languages.wordNumber;
    this.languages = languages.languages;
  }
}

export interface WordsToTranslate {
  languages: string[];
  words: string[];
}

export class WordsToTranslate {
  constructor(wordsToTranslate: WordsToTranslate) {
    this.languages = wordsToTranslate.languages;
    this.words = wordsToTranslate.words;
  }
}
