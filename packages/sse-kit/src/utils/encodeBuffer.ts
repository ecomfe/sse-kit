import { commonConsole } from "./commonConsole";

/**
 * 将 ArrayBuffer 或字符串编码为 JSON 对象
 *
 * @param value 需要编码的 ArrayBuffer 或字符串
 * @returns 编码后的 JSON 对象
 */
export const encodeBufferToJson = (value: ArrayBuffer | string) => {
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
        return JSON.parse(v)
      } catch (error) {
        v = ''
        console.error('非 string 类型解码异常', data);
        return JSON.parse(v)
      }
    } else {
      try {
        return JSON.parse(data)
      } catch(e) {
        commonConsole(e, 'error', 'encodeBufferToJson string 类型解码异常');
      }
    }
  } catch(e)  {
    commonConsole(e, 'error', 'encodeBufferToJson 解码异常');

    return {};
  }
};