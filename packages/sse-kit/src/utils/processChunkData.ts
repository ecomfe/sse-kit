/**
 * 处理传入的分块数据
 *
 * @param incomingData 传入的字符串数据
 * @param buffer 缓冲区字符串
 * @returns 包含处理后的消息数组和新的缓冲区字符串的对象
 */
export const processChunkData = (incomingData: string, buffer: string): { messages: string[], newBuffer: string } => {
    const combined = buffer + incomingData;
    const parts = combined.split('\n');
    const messages = parts.slice(0, -1).map(line => line.trim()).filter(line => line.length > 0);
    return { messages, newBuffer: parts[parts.length - 1] };
};