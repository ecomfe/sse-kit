export interface RequestStreamingArgs {
    url: `https://${string}`;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
    reqParams?: Record<string, string>;
    success?: (res: any) => void;
    fail?: (err: any) => void;
}

export interface RequestStreamingInstance {
    onChunkReceived: (chunk: any) => void;
    onHeadersReceived: (headers: any) => void;
}
