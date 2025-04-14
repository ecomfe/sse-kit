import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

import { commonConsole } from "../commonConsole";
import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType, HeadersReceivedCallbackType } from './index.d';

export function request(options: RequestStreamingArgs): RequestStreamingInstance {
    const {
        url,
        method,
        reqParams,
        headers = {},
        success,
        fail,
        timeout = 60000,
    } = options;

    const controller = new AbortController();
    let onChunkReceivedCallback: ChunkReceivedCallbackType = () => { };
    let onHeadersReceivedCallback: HeadersReceivedCallbackType = () => { };
    let timeoutId: number;

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };

    timeoutId = setTimeout(() => {
        controller.abort();
        cleanup();
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        fail?.(timeoutError);
    }, timeout);

    (async () => {
        try {
            console.error('切换至 @microsoft/fetch-event-source', 'info')
            
            await fetchEventSource(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: reqParams ? JSON.stringify(reqParams) : undefined,
                signal: controller.signal,
                async onopen(response: Response) {
                    if (!response.ok) {
                        throw new Error(`HTTP status code: ${response.status}`);
                    }
                    onHeadersReceivedCallback(response.headers);
                },
                onmessage(event: EventSourceMessage) {
                    try {
                        if (event.data) {
                            onChunkReceivedCallback({ data: event.data });
                        }
                    } catch (err) {
                        commonConsole(err, 'error', '解析该行出错');
                    }
                },
                onclose() {
                    cleanup();
                    success?.(null);
                },
                onerror(err: Error) {
                    cleanup();
                    fail?.(err);
                    throw err;
                },
            });
        } catch (err) {
            cleanup();
            fail?.(err);
            throw err;
        }
    })();

    return {
        onChunkReceived(fn) {
            onChunkReceivedCallback = fn;
        },
        onHeadersReceived(fn) {
            onHeadersReceivedCallback = fn;
        },
        abort() {
            cleanup();
            controller.abort();
        },
    };
} 