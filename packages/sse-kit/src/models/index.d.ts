import { RequestStreamingArgs } from '../utils/requestStreaming/index.d';

export interface ISSE <TBody extends object> {
    message: () => AsyncIterableIterator<TBody>;
    close: () => void;
}

export interface ConstructorArgsType<TBody extends object> {
    url: RequestStreamingArgs['url'];
    method: RequestStreamingArgs['method'];
    headers?: RequestStreamingArgs['headers'];
    reqParams?: RequestStreamingArgs['reqParams'];
    enableConsole?: boolean;
    timeout?: number;
    credentials?: 'include' | 'same-origin' | 'omit';
    onConnect?: () => void;
    onComplete?: (response: unknown) => void;
    onReconnect?: () => void;
    onError?: (err: Error) => void;
    preprocessDataCallback?: (data: any) => any;
    onHeadersReceived?: (headers: Headers) => void;
}