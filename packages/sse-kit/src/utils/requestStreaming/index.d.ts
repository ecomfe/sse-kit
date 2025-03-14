export interface RequestStreamingArgs {
    url: `https://${string}` | `http://${string}`;
    method: 'POST' | 'GET';
    headers?: Headers;
    timeout?: number;
    reqParams?: Record<string, string>;
    success?: (res: any) => void;
    fail?: (err: any) => void;
}

export type HeadersReceivedCallbackType = (v: Headers) => void;
export type ChunkReceivedCallbackType = (v: {data: ArrayBuffer | string}) => void;

export interface RequestStreamingInstance {
    onChunkReceived: (fn: ChunkReceivedCallbackType) => void;
    onHeadersReceived: (fn: HeadersReceivedCallbackType) => void;
    abort: () => void;
}
