/**
 * Process incoming chunk data
 *
 * @param incomingData Incoming string data
 * @param buffer Buffer string
 * @returns Object containing processed message array and new buffer string
 */
export const processChunkData = (incomingData: string, buffer: string): { messages: string[], newBuffer: string } => {
    const combined = buffer + incomingData;
    const parts = combined.split('\n');
    const messages = parts.slice(0, -1).map(line => line.trim()).filter(line => line.length > 0);
    return { messages, newBuffer: parts[parts.length - 1] };
};