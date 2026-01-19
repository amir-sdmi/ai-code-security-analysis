// Written by ChatGPT: Utility type to convert a union type (|) into an intersection type (&)
// export type UnionToIntersection<U> = 
// (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) 
//   ? { [K in keyof I]: I[K] } 
//   : never;

export type UnionToIntersection<U> = 
  (U extends any ? (x: U) => void : never) extends (x: infer R) => void 
    ? R 
    : never;
