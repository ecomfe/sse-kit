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

    let controller = new AbortController();
    let onChunkReceivedCallback: ChunkReceivedCallbackType = () => { };
    let onHeadersReceivedCallback: HeadersReceivedCallbackType = () => { };
    let timeoutId: number | undefined; // Use undefined for better checking

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined; // Reset after clearing
        }
    };

    timeoutId = setTimeout(() => {
        commonConsole('Request timed out, aborting.', 'warn');
        controller.abort(); // Only abort, let onerror handle the rest
        // cleanup(); // Cleanup is handled by onerror/catch/finally
        // const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        // fail?.(timeoutError); // Let onerror handle the AbortError implicitly
    }, timeout);

    try {
        (async () => {
            try {
                console.error('fetchEventSource 自执行函数启动')
                await fetchEventSource(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers,
                    },
                    openWhenHidden: true,
                    body: reqParams ? JSON.stringify(reqParams) : undefined,
                    signal: controller.signal, // Pass the signal
                    async onopen(response: Response) {
                        cleanup(); // Clear timeout once connection is open and successful
                        if (!response.ok) {
                            let errorText = `HTTP error! status: ${response.status}`;
                            try {
                                const bodyText = await response.text();
                                if (bodyText) { errorText += `, body: ${bodyText}`; }
                            } catch (e) { /* Ignore body reading errors */ }
                            const httpError = new Error(errorText);
                            fail?.(httpError); // Report HTTP error via callback
                            // Throwing here ensures fetchEventSource stops processing
                            throw httpError;
                        }
                        onHeadersReceivedCallback(response.headers);
                    },
                    onmessage(event: EventSourceMessage) {
                        try {
                            if (event.data) {
                                onChunkReceivedCallback({ data: event.data });
                            }
                            // console.info('fetchEventSource onmessage回调', event, event.data)
                        } catch (err) {
                            commonConsole(err, 'error', '解析该行出错');
                            // Optionally report parsing errors via fail callback
                            // fail?.(err as Error);
                        }
                    },
                    onclose() {
                        commonConsole('fetchEventSource connection closed.', 'info');
                        cleanup(); // Cleanup on close
                        success?.(null); // Signal success on normal close
                        // console.error('fetchEventSource onclose回调') // Original log
                    },
                    onerror(err: any) {
                        console.error('fetchEventSource onerror回调', err)
                        // Don't call cleanup here immediately, let catch/finally handle it
                        // cleanup();
                        if (err instanceof DOMException && err.name === 'AbortError') {
                            commonConsole('Request aborted by user or timeout.', 'info');
                            // Abort is often expected, don't call fail by default.
                            // fail?.(err); // Uncomment if caller needs abort notification
                            // Do not throw AbortError further; return or it'll be caught below.
                            return;
                        }
                        // Handle other unexpected errors during the stream
                        commonConsole(err, 'error', 'fetchEventSource onerror error');
                        fail?.(err); // Report other errors
                        // throw err; // Avoid throwing, rely on fail callback
                    },
                })
                // Remove .then(), success is handled in onclose
                // .then((res) => {
                //     console.info('fetchEventSource 请求成功', res)
                //     success?.(null);
                // })
                .catch((err) => {
                    console.error('fetchEventSource 外层 catch 回调', err)
    
                    // This catch handles errors from onopen or other promise rejections within fetchEventSource
                    // cleanup(); // Cleanup is handled by finally
                    if (err instanceof DOMException && err.name === 'AbortError') {
                        // Abort handled by onerror, but catch just in case it escapes
                        commonConsole('Request aborted (caught in promise catch).', 'info');
                    } else {
                        // Report non-abort errors caught here
                        commonConsole(err, 'error', 'fetchEventSource promise catch error');
                        fail?.(err);
                    }
                }).finally(() => {
                     commonConsole('fetchEventSource finished.', 'info');
                     cleanup(); // Ensure cleanup happens regardless of success/error/abort
                     // console.warn('fetchEventSource finally 请求完成') // Original log
                });
            } catch (err) {
                // This outer catch handles errors during initial setup or if errors escape .catch()
                // cleanup(); // Cleanup is handled by finally
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Abort during setup phase
                    commonConsole('Request aborted (caught in outer catch).', 'info');
                } else {
                    // Report setup errors
                    commonConsole(err, 'error', 'Error setting up fetchEventSource request');
                    fail?.(err as Error);
                }
                // Do not throw err here to prevent unhandled promise rejections
                // cleanup(); // Moved to finally
                // fail?.(err);
                // throw err;
            }
        })();
    } catch(err) {
        console.error('fetchEventSource 外层自执行函数 catch 回调', err)
    }

    

    return {
        onChunkReceived(fn) {
            onChunkReceivedCallback = fn;
        },
        onHeadersReceived(fn) {
            onHeadersReceivedCallback = fn;
        },
        abort() {
            commonConsole('Manual abort called.', 'info');
            controller.abort(); // Manually abort the request
            // cleanup(); // Cleanup will be triggered by the resulting onerror/finally path
        },
    };
} 