import { DeepPartial, Resume } from '../types';

/**
 * This function allows you to mutate the properties of an object
 * to a new value, while only updating the specific properties that have changed.
 * The function will only traverse up to a maximum depth of 3 levels of nesting.
 *
 * PD: this function was created by chatGTP
 *
 * @param mutableObj The original object that you want to mutate
 * @param partialObj A partial object that holds the updated properties
 * @param level The current level of nesting, used for limiting the depth of the function
 */
export function mutateObjectProperties<T extends object>(mutableObj: T, partialObj: DeepPartial<T> , level = 0): void {
  if (level > 3) {
    return;
  }

  Object.entries(partialObj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (typeof value === 'object' && Array.isArray(value) === false) {
        mutateObjectProperties(mutableObj[key as keyof T] as object, value, level + 1);
      } else {
        mutableObj[key as keyof T] = value;
      }
    }
  });
}

/**
 * PD: created with chatGPT
 *
 * This is type create typed string paths for objects.
 * The path is a string that represents the path to the property that you want to set.
 *
 * Example:
 * ```js
 * type Resume = {
 *  contact: {
 *   fullName: string;
 * }
 *
 * // ✅
 * const path: Path<Resume> = 'contact.fullName'
 *
 * // ❌ this will throw a compilation error
 * const path: Path<Resume> = 'contact.fullName.age'
 * ```
 *
 */
export type Path<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends (infer U)[]
        ? K & string
        : K extends string ? `${K & string}${"" extends Path<T[K]> ? "" : "."}${Path<T[K]>}` : never
    }[keyof T]
  : "";

/**
 * This function is to create a partial object from a path and a value.
 * The path is a string that represents the path to the property that you want to set.
 *
 * Example:
 * ```js
 * // this will return { contact: { fullName: 'John Doe' } }
 * createObjectFromPath<Resume>('contact.fullName', 'John Doe')
 * ```
 *
 * this is useful when you want to create a partial object from a path and a value
 * and then use it to update the state of a component.
 *
 * PD: this function was created by chatGTP
 */
export function createObjectFromPath<T>(path: string, value: T): any {
  const keys = path.split('.');
  const result: any = {};
  let current = result;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = {};
      current = current[key];
    }
  }
  return result;
}

export function createObjectFromPaths<T>(pathValuePairs: [string, T][]): any {
  const result: any = {};

  pathValuePairs.forEach(([path, value]) => {
    const keys = path.split('.');
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
  });

  return result;
}

/**
 * PD: this function was created by chatGTP
 *
 * This function is to pick a property from an object using a path.
 * The path is a string that represents the path to the property that you want to pick.
 * The path can be up to 3 levels deep.
 * - If the path is longer than 3 levels, it will throw an error.
 * - If the path is invalid, it will return undefined.
 * - If the path is valid, it will return the value of the property.
 *
 * Example:
 * ```js
 * const obj = {
 *   name: 'John Doe',
 *   age: 30,
 *   address: {
 *    street: '123 Main St',
 *    city: 'San Francisco',
 *    state: 'CA',
 *    zip: '94105',
 *    coordinates: {
 *      latitude: 37.7749,
 *      longitude: -122.4194,
 *    },
 *  },
 * };
 *
 * // this will return 'John Doe'
 * pick(obj, 'name');
 *
 * // this will return 30
 * pick(obj, 'age');
 *
 * // this will return '123 Main St'
 * pick(obj, 'address.street');
 *
 * // this will return 37.7749
 * pick(obj, 'address.coordinates.latitude');
 * ```
 */
export function pick<T, K extends Path<keyof T>>(obj: T, path: K): K extends `${infer Key1}.${infer Key2}.${infer Key3}`
  ? Key1 extends keyof T
    ? Key2 extends keyof T[Key1]
      ? Key3 extends keyof T[Key1][Key2]
        ? T[Key1][Key2][Key3]
        : never
      : never
    : never
  : K extends `${infer Key1}.${infer Key2}`
    ? Key1 extends keyof T
      ? Key2 extends keyof T[Key1]
        ? T[Key1][Key2]
        : never
      : never
    : K extends keyof T
      ? T[K]
      : never {
  const parts = (path as string).split('.') as Array<keyof T & string>; // type assertion to tell TypeScript that keys are strings
  if (parts.length > 3) {
    throw new Error('Path too deep');
  }
  let result = obj;
  for (const part of parts) {
    if (result == null) {
      break;
    }
    result = result[part] as T;
  }
  return result as any;
}
