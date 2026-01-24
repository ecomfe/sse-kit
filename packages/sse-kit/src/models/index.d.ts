import { RequestStreamingArgs, HeadersType } from '../utils/requestStreaming/index.d';

/**
 * SSE event object with event type and data
 */
export interface SSEEvent<TBody> {
    /** Event type: 'message' | 'error' | custom event name */
    event: string;
    /** Event data */
    data: TBody;
    /** Event ID (optional) */
    id?: string;
}

/**
 * SSE Processor interface
 */
export interface ISSE<TBody extends object> {
    /** Establish SSE connection */
    connect: () => ISSE<TBody>;
    /** Get iterator for all events (with event type) */
    events: () => AsyncIterableIterator<SSEEvent<TBody>>;
    /** Get iterator for message events only (backward compatible) */
    message: () => AsyncIterableIterator<TBody>;
    /** Close connection */
    close: () => void;
    /** Get current event count */
    getCurrentEventId: () => number;
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
    onHeadersReceived?: (headers: HeadersType) => void;
}
