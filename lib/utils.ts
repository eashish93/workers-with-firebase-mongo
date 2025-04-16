
import { z } from 'zod';

export const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';


export function getToken(headers: Headers) {
  return headers.get('authorization')?.split('Bearer ')[1];
}

export function serialize(obj: unknown) {
  if (obj === null || typeof obj !== 'object') {
    throw new TypeError('serialize: input must be a non-null object');
  }
  const str: string[] = [];
  const record = obj as Record<string, unknown>;
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      str.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(record[key])));
    }
  }
  return str.join('&');
}

/*
  Parse zod schema for URLSearchParams. Doesn't throw errors for extra (unidentified) keys.
  NOTE: This will support array form like this: `?foo=bar&foo=baz`
*/
export function parseQuery<T extends z.ZodTypeAny>(sp: URLSearchParams, schema: T) {
  const obj: Record<string, string | string[]> = {};
  // parse URLSearchParams into a plain object
  // NOTE: You need to use `coerce` with zod schema to convert string to number, boolean etc..
  for (const [key, value] of sp.entries()) {
    const currentVal = obj[key];
    if (key in obj) {
      if (Array.isArray(currentVal)) {
        currentVal.push(value);
      } else {
        obj[key] = [currentVal, value];
      }
    } else {
      obj[key] = value;
    }
  }
  const result = schema.safeParse(obj);

  if (!result.success) {
    // don't flatten or format here, otherwise we will loose the ability to check instance type.
    throw result.error;
  } else {
    return result.data;
  }
}

export function parseBody<T extends z.ZodTypeAny>(body: z.infer<T> | FormData, schema: T) {
  let formDataObj: Record<string, string | string[]> | null = null;
  // For FormData.
  if (typeof body === 'object' && body instanceof FormData) {
    formDataObj = {};
    // convert formData to json object. Also merge multiple values with same key into one array.
    for (const [key, value] of body.entries()) {
      const currentVal = formDataObj[key];
      if (key in formDataObj) {
        if (Array.isArray(currentVal)) {
          currentVal.push(value.toString());
        } else {
          formDataObj[key] = [currentVal, value.toString()];
        }
      } else {
        formDataObj[key] = value.toString();
      }
    }
  }

  const result = schema.safeParse(formDataObj || body);

  if (!result.success) {
    // don't flatten or format here, otherwise we will loose the ability to check instance type.
    throw result.error;
  } else {
    return result.data;
  }
}
