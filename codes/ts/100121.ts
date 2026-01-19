// Type.
import { PrototypeOf } from "./prototype-of.type";
import { UnionToIntersection } from "./union-to-intersection.type";

// Written by ChatGPT: Updated ArrayToObject to extract methods from the prototypes
export type ArrayToObject<T> = 
  T extends Array<infer R>
    ? UnionToIntersection<PrototypeOf<R>>
    : never;
    
// Generic type variable problem.
// export type ArrayToObject<T> = T extends infer R 
//   ? R extends Array<any>
//     ? R extends [...infer C]
//       ? C extends [infer F, ...infer Rest]
//         ? Rest extends []
//           ? F
//           : F & ArrayToObject<Rest>
//         : R
//       : R
//     : R
//   : T;
