/**
 * React Native platform SSE streaming implementation
 * Uses react-native-sse EventSource for SSE protocol handling
 */

import EventSource from 'react-native-sse';
import { commonConsole } from '../commonConsole';
import { RequestState, validateRequestOptions, buildRequestHeaders } from './common';
import type {
    RequestStreamingArgs,
    RequestStreamingInstance,
    ChunkReceivedCallbackType,
    HeadersReceivedCallbackType,
    SSEChunk
} from './index.d';

/**
 * EventSource message event type
 */
interface SSEMessageEvent {
    type: string;
    data: string | null;
    lastEventId?: string;
}

/**
 * EventSource error event type
 */
interface SSEErrorEvent {
    type: string;
    message?: string;
}

/**
 * Build request URL with query parameters for GET requests
 */
const buildUrl = (baseUrl: string, method: string, reqParams?: Record<string, string>): string => {
    if (!reqParams || method === 'POST') {
        return baseUrl;
    }

    const params = new URLSearchParams();
    Object.entries(reqParams).forEach(([key, value]) => {
        params.append(key, value);
    });
    const queryString = params.toString();
    return queryString
        ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`
        : baseUrl;
};

/**
 * Create event handler for a specific event type
 */
const createEventHandler = (
    eventType: string,
    chunkCallback: () => ChunkReceivedCallbackType | null,
    state: RequestState
) => {
    return (event: unknown) => {
        const msgEvent = event as SSEMessageEvent;
        commonConsole(msgEvent.data, 'info', `RN EventSource ${eventType} received`);

        const callback = chunkCallback();
        if (msgEvent.data && callback && !state.isFinished()) {
            const chunk: SSEChunk = {
                event: eventType,
                data: msgEvent.data,
                id: msgEvent.lastEventId
            };
            callback(chunk);
        }
    };
};

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        validateRequestOptions(arg);

        const state = new RequestState();
        let eventSource: EventSource | null = null;
        let chunkCallback: ChunkReceivedCallbackType | null = null;
        let headersCallback: HeadersReceivedCallbackType | null = null;
        let hasCalledHeadersReceived = false;

        // Build EventSource configuration
        const hasBody = arg.method === 'POST' && !!arg.reqParams;
        const headers = buildRequestHeaders(arg.headers, hasBody);
        const eventSourceOptions: Record<string, unknown> = {
            headers,
            method: arg.method,
            timeout: arg.timeout || 60000,
            withCredentials: arg.credentials === 'include',
            // Disable auto-reconnect, react-native-sse defaults to 5 second reconnect
            pollingInterval: 0
        };

        // Add body for POST requests
        if (arg.method === 'POST' && arg.reqParams) {
            eventSourceOptions.body = JSON.stringify(arg.reqParams);
        }

        const url = buildUrl(arg.url, arg.method, arg.reqParams);
        commonConsole(url, 'info', 'RN EventSource connecting to');

        // Create EventSource instance
        eventSource = new EventSource(url, eventSourceOptions);

        // Handle connection open
        eventSource.addEventListener('open', () => {
            commonConsole('Connection opened', 'info', 'RN EventSource');
            state.isStarted = true;

            // Trigger onHeadersReceived on connection open
            // Use flag to prevent duplicate calls (react-native-sse may trigger 'open' multiple times)
            if (!hasCalledHeadersReceived) {
                hasCalledHeadersReceived = true;
                // RN EventSource doesn't provide access to response headers
                headersCallback?.({} as Headers);
            }
        });

        // Listen to message events (default SSE event type)
        eventSource.addEventListener(
            'message',
            createEventHandler('message', () => chunkCallback, state)
        );

        // Handle errors - emit as error event type
        eventSource.addEventListener('error', (event: unknown) => {
            const errEvent = event as SSEErrorEvent;
            commonConsole(errEvent, 'error', 'RN EventSource error');

            if (state.isFinished()) return;
            state.hasError = true;

            const error = new Error(errEvent.message ?? 'SSE connection error');
            arg.fail?.(error);
        });

        // Handle connection end
        const handleComplete = () => {
            if (state.isFinished()) return;
            state.isSuccessfullyCompleted = true;

            commonConsole('Connection ended', 'info', 'RN EventSource');
            arg.success?.({ status: 'success' });
        };

        // Listen to multiple end events
        // 1. close - Standard EventSource close event
        eventSource.addEventListener('close', handleComplete);

        // 2. done - react-native-sse specific event (also emit as SSE event)
        const esAny = eventSource as unknown as { addEventListener: (type: string, listener: (e: unknown) => void) => void };
        esAny.addEventListener('done', (event: unknown) => {
            // Emit done as an SSE event before completing
            const msgEvent = event as SSEMessageEvent;
            if (msgEvent.data && chunkCallback && !state.isFinished()) {
                chunkCallback({
                    event: 'done',
                    data: msgEvent.data,
                    id: msgEvent.lastEventId
                });
            }
            handleComplete();
        });

        // 3. end - Server custom end event
        esAny.addEventListener('end', (event: unknown) => {
            const msgEvent = event as SSEMessageEvent;
            if (msgEvent.data && chunkCallback && !state.isFinished()) {
                chunkCallback({
                    event: 'end',
                    data: msgEvent.data,
                    id: msgEvent.lastEventId
                });
            }
            handleComplete();
        });

        return {
            onChunkReceived: (fn: ChunkReceivedCallbackType) => {
                chunkCallback = fn;
            },
            onHeadersReceived: (fn: HeadersReceivedCallbackType) => {
                headersCallback = fn;
            },
            abort: () => {
                if (eventSource) {
                    state.isUserAborted = true;
                    commonConsole('Connection aborted', 'info', 'RN EventSource');
                    eventSource.close();
                    eventSource = null;
                }
            }
        };
    } catch (e) {
        commonConsole(e, 'error', 'RN EventSource initialization error');
        throw e;
    }
};
