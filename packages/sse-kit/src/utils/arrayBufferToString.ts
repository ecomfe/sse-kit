/**
 * 将 ArrayBuffer 对象转换为字符串
 *
 * @param buffer 需要转换的 ArrayBuffer 对象
 * @returns 转换后的字符串，如果输入的 buffer 为空或为 null，则返回空字符串
 */
export function arrayBufferToString(buffer: ArrayBuffer) {
    const v = buffer ? new Uint8Array(buffer) : '';
    return v ? decodeURIComponent(escape(String.fromCharCode(...v))) : '';
}