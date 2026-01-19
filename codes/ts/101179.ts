declare module 'cytoscape-dom-node';
declare module 'json-case-convertor';

declare module '@nlpjs/lang-en-min' {
  export class LangEn {}
}

declare module '@nlpjs/nlp' {
  export class Nlp {
    settings: { autoSave: boolean };
    addLanguage(lang: string): void;
    addDocument(lang: string, utterance: string, intent: string): void;
    addAnswer(lang: string, intent: string, answer: string): void;
    addNerRule(locale: string, name: string, type: string, rule: string): unknown;
    addNerRegexRule(locale: string, name: string, regex: RegExp): unknown;
    addNerBetweenCondition(
      locale: string,
      name: string,
      leftWords: string[],
      rightWords: string[],
      opts?: NerOptions,
    ): unknown;
    addNerBetweenLastCondition(
      locale: string,
      name: string,
      leftWords: string[],
      rightWords: string[],
      opts?: NerOptions,
    ): unknown;
    addNerPositionCondition(
      locale: string,
      name: string,
      position: string,
      words: string[],
      opts?: NerOptions,
    ): unknown;
    addNerAfterCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    addNerAfterFirstCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    addNerAfterLastCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    addNerBeforeCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    addNerBeforeFirstCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    addNerBeforeLastCondition(locale: string, name: string, words: string[], opts?: NerOptions): unknown;
    train(): Promise<void>;
    process(lang: string, text: string): Promise<NluResponse>;
  }

  export interface NluResponse {
    locale: string;
    utterance: string;
    languageGuessed: boolean;
    localeIso2: string;
    language: string;
    nluAnswer: {
      classifications: Classification[];
    };
    classifications: Classification[];
    intent: string;
    score: number;
    domain: string;
    entities: any[]; // update this with a proper type if you know the structure of the entities
    sourceEntities: any[]; // update this with a proper type if you know the structure of the sourceEntities
    answers: any[]; // update this with a proper type if you know the structure of the answers
    actions: any[]; // update this with a proper type if you know the structure of the actions
    sentiment: Sentiment;
  }

  export interface Classification {
    intent: string;
    score: number;
  }

  export interface Sentiment {
    score: number;
    numWords: number;
    numHits: number;
    average: number;
    locale: string;
    vote: string;
  }

  export interface NerOptions {
    caseSensitive?: boolean; // default is false
    noSpaces?: boolean; // Defines if the word matching is done on words (with spaces before and after the given word) or just the text is matched. true or false, default is false
    skip?: string[]; // Defines an array of words that should be skipped when matching.
  }
}

// The nlpjs bindings were generated using chatGPT based on the example https://www.npmjs.com/package/@nlpjs/nlp
declare module '@nlpjs/core' {
  import { Nlp } from '@nlpjs/nlp';
  export interface Container {
    use(module: any): void;
    get(key: string): Nlp;
  }
  export function containerBootstrap(): Promise<Container>;
}
