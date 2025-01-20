export const encodeBufferToJson = (buffer: ArrayBuffer) => {
  try {
    let data = buffer;
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data)
      }
      let v: string;
      // Uint8Array转码
      if (typeof data != 'string') {
        try {
          // @ts-ignore
          v = decodeURIComponent(escape(String.fromCharCode(...data)));
          return JSON.parse(v)
        } catch (error) {
          v = ''
          console.error('解码异常', data);
          return JSON.parse(v)
        }
      }
  } catch(e)  {
    console.error('解码异常', e)
    return {};
  }
};