export type HeadersType = Headers | Record<string, string>;

/**
 * SSE event chunk with event type
 */
export interface SSEChunk {
    /** Event type, defaults to 'message' */
    event: string;
    /** Event data */
    data: string;
    /** Event ID (optional) */
    id?: string;
}

export interface RequestStreamingArgs {
    url: `https://${string}` | `http://${string}`;
    method: 'POST' | 'GET';
    headers?: HeadersType;
    timeout?: number;
    credentials?: 'include' | 'same-origin' | 'omit';
    reqParams?: Record<string, string>;
    preprocessDataCallback?: (data: any) => any;
    success?: (res: any) => void;
    fail?: (err: any) => void;
}

export type HeadersReceivedCallbackType = (v: HeadersType) => void;
export type ChunkReceivedCallbackType = (v: SSEChunk) => void;

export interface RequestStreamingInstance {
    onChunkReceived: (fn: ChunkReceivedCallbackType) => void;
    onHeadersReceived: (fn: HeadersReceivedCallbackType) => void;
    abort: () => void;
}
