import { request } from '../utils/requestStreaming';

import { encodeBufferToJson } from '../utils/encodeBuffer';
import { createAsyncQueue } from '../utils/createAsyncQueue';
import { commonConsole, updateEnableConsole } from "../utils/commonConsole";

import type { ISSE, ConstructorArgsType, SSEEvent } from './index.d';
import type { RequestStreamingInstance, HeadersType, SSEChunk } from '../utils/requestStreaming/index.d';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closed';

export class SSEProcessor<TBody extends object> implements ISSE<TBody> {
    public id: symbol;

    private url: `https://${string}` | `http://${string}`;
    private method: 'POST' | 'GET';
    private timeout: number = 60000;
    private reqParams?: Record<string, string>;
    private headers: Headers | Record<string, string>;

    private body: TBody[] = [];
    private eventId: number = 0;
    private requestInstance?: RequestStreamingInstance;

    private credentials?: 'include' | 'same-origin' | 'omit';

    private onError?: (err: Error) => void;
    private onComplete?: (response: unknown) => void;
    private onConnectCallback?: () => void;
    private onHeadersReceived?: ConstructorArgsType<TBody>['onHeadersReceived'];
    private preprocessDataCallback?: (data: string | ArrayBuffer) => string | ArrayBuffer;

    // Connection state management
    private connectionState: ConnectionState = 'idle';
    private eventQueue = createAsyncQueue<SSEEvent<TBody>>();
    private successResponse: unknown = null;
    private successCalled: boolean = false;

    constructor(options: ConstructorArgsType<TBody>) {
        commonConsole(options, 'info', 'SSEProcessor initialization parameters');

        this.id = Symbol();
        this.url = options.url;
        this.method = options.method;
        this.headers = options.headers || {};
        this.reqParams = options.reqParams || {};

        options?.timeout && (this.timeout = options.timeout);
        options?.credentials && (this.credentials = options.credentials);
        options?.onError && (this.onError = options.onError);
        options?.onComplete && (this.onComplete = options.onComplete);
        options?.onConnect && (this.onConnectCallback = options.onConnect);
        options?.onHeadersReceived && (this.onHeadersReceived = options.onHeadersReceived);
        options?.preprocessDataCallback && (this.preprocessDataCallback = options.preprocessDataCallback);

        if (options.enableConsole !== undefined) {
            updateEnableConsole(options.enableConsole);
        }
    }

    /**
     * Establish SSE connection
     * Can be called multiple times, only takes effect on first call
     * Returns this for method chaining
     */
    public connect(): this {
        if (this.connectionState !== 'idle') {
            commonConsole('Connection already established or in progress v2.0!', 'info', 'SSEProcessor');
            return this;
        }

        this.connectionState = 'connecting';
        this.initConnection();
        return this;
    }

    /**
     * Initialize the actual connection
     */
    private initConnection(): void {
        const r = request({
            url: this.url,
            method: this.method,
            reqParams: {
                ...this.reqParams
            },
            ...(this.credentials ? { credentials: this.credentials } : {}),
            timeout: this.timeout,
            headers: { ...this.headers } as HeadersType,
            preprocessDataCallback: this.preprocessDataCallback,
            success: (res: unknown) => {
                this.successResponse = res;
                this.successCalled = true;
                this.eventQueue.end();
            },
            fail: (err: Error) => {
                commonConsole(err, 'error', 'Request failed');
                this.connectionState = 'closed';
                this.onError?.(err);
                this.eventQueue.end();
            }
        });

        this.requestInstance = r;

        r?.onChunkReceived((chunk: SSEChunk) => {
            commonConsole(chunk, 'info', 'SSEProcessor chunk received');

            // Parse the data field to JSON
            let parsed = encodeBufferToJson<TBody>(chunk.data);

            // If JSON parsing fails, wrap raw string as object for non-message events
            // This handles cases like "data: end" or "data: done"
            if (parsed === undefined) {
                // For special events (non-message), emit with raw data wrapper
                if (chunk.event && chunk.event !== 'message') {
                    parsed = { raw: chunk.data } as unknown as TBody;
                } else {
                    // For message events, skip invalid JSON data
                    commonConsole('Data parsing failed, skipping this data', 'warn');
                    return;
                }
            }

            const event: SSEEvent<TBody> = {
                event: chunk.event || 'message',
                data: parsed as TBody,
                id: chunk.id
            };
            this.eventQueue.push(event);
            this.eventId += 1;
            this.body?.push(parsed as TBody);
        });

        r?.onHeadersReceived((headers: HeadersType) => {
            this.connectionState = 'connected';
            this.onConnectCallback?.();
            this.onHeadersReceived?.(headers);
        });
    }

    /**
     * Get iterator for all events (with event type)
     * Automatically connects if not already connected
     */
    public async *events(): AsyncIterableIterator<SSEEvent<TBody>> {
        // Ensure connection is established
        this.connect();

        try {
            while (true) {
                const { value, done } = await this.eventQueue.next();
                if (done) {
                    break;
                }
                yield value;
            }

            // Trigger completion callback
            if (this.successCalled) {
                commonConsole(this.successResponse, 'info', 'Request completed');
                this.onComplete?.(this.successResponse);
            }
        } finally {
            this.connectionState = 'closed';
        }
    }

    /**
     * Get iterator for message events only (backward compatible)
     * Automatically connects if not already connected
     */
    public async *message(): AsyncIterableIterator<TBody> {
        for await (const event of this.events()) {
            if (event.event === 'message') {
                yield event.data;
            }
        }
    }

    /**
     * Get current event count
     */
    public getCurrentEventId(): number {
        return this.eventId;
    }

    /**
     * Close connection
     */
    public close(): void {
        if (this.connectionState === 'closed') {
            return;
        }
        this.connectionState = 'closed';
        this.requestInstance?.abort();
        this.eventQueue.end();
    }
}
