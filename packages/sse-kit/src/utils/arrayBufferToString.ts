/**
 * Convert ArrayBuffer object to string
 *
 * @param buffer ArrayBuffer object to be converted
 * @returns Converted string, returns empty string if input buffer is empty or null
 */
export function arrayBufferToString(buffer: ArrayBuffer) {
    const v = buffer ? new Uint8Array(buffer) : '';
    return v ? decodeURIComponent(escape(String.fromCharCode(...v))) : '';
}