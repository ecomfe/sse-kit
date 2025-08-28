import { commonConsole } from "./commonConsole";

/**
 * Encode ArrayBuffer or string to JSON object
 *
 * @param value ArrayBuffer or string to be encoded
 * @returns Encoded JSON object, returns unknown if parsing fails
 */
export const encodeBufferToJson = <T extends object>(value: ArrayBuffer | string): T | unknown => {
  try {
    let data = value;
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data)
    };

    if (typeof data != 'string') {
      let v: string;
      try {
        // @ts-ignore
        v = decodeURIComponent(escape(String.fromCharCode(...data)));
        return JSON.parse(v) as T;
      } catch (error) {
        commonConsole(error, 'error', 'Non-string type decoding error');
        return undefined;
      }
    } else {
      try {
        return JSON.parse(data) as T;
      } catch(e) {
        commonConsole(e, 'error', 'encodeBufferToJson string type decoding error');
        return undefined;
      }
    }
  } catch(e)  {
    commonConsole(e, 'error', 'encodeBufferToJson decoding error');
    return undefined;
  }
};