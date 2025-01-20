export interface ISSE <TBody extends object> {
    message: () => AsyncIterableIterator<TBody>;
    close: () => void;
}

export interface ConstructorArgsType<TBody extends object> {
    url: `https://${string}`;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
    reqParams?: Record<string, string>;
    onConnect?: () => void;
    onComplete?: () => void;
    onReconnect?: () => void;
    onError?: (err: Error) => void;
    onHeadersReceived?: (headers: Record<string, string>) => void;
}