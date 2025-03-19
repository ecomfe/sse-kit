import { commonConsole } from "./commonConsole";

/**
 * 将 ArrayBuffer 或字符串编码为 JSON 对象
 *
 * @param value 需要编码的 ArrayBuffer 或字符串
 * @returns 编码后的 JSON 对象，如果解析失败则返回 unknown
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
        console.error('非 string 类型解码异常', data);
        v = '';
        return JSON.parse(v)
      }
    } else {
      try {
        return JSON.parse(data) as T;
      } catch(e) {
        commonConsole(e, 'error', 'encodeBufferToJson string 类型解码异常');
        return undefined;
      }
    }
  } catch(e)  {
    commonConsole(e, 'error', 'encodeBufferToJson 解码异常');
    return undefined;
  }
};