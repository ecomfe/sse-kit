import { commonConsole } from "../commonConsole";
import { arrayBufferToString } from '../arrayBufferToString';
import { RequestState, validateRequestOptions, createErrorHandler, createSuccessHandler, createSSEParser } from './common';
import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType, HeadersReceivedCallbackType, SSEChunk } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        validateRequestOptions(arg);

        const state = new RequestState();
        const handleError = createErrorHandler(arg.fail, state);
        const handleSuccess = createSuccessHandler(arg.success, state);
        let pendingBytes = new Uint8Array(0); // Buffer for incomplete UTF-8 sequences

        // Callbacks to be set by the caller
        let chunkCallback: ChunkReceivedCallbackType | null = null;
        let headersCallback: HeadersReceivedCallbackType | null = null;

        // Buffer for events that arrive before callback is set
        const pendingEvents: SSEChunk[] = [];
        let callbackReady = false;

        // Function to deliver event (either immediately or buffer it)
        const deliverEvent = (event: SSEChunk) => {
            if (callbackReady && chunkCallback) {
                chunkCallback(event);
            } else {
                pendingEvents.push(event);
            }
        };

        // Create SSE parser
        const parser = createSSEParser((event) => {
            commonConsole(event, 'info', 'wx SSE parser output');
            // Apply preprocessDataCallback if provided
            if (arg?.preprocessDataCallback) {
                event.data = arg.preprocessDataCallback(event.data);
                commonConsole(event.data, 'info', 'wx after preprocessDataCallback');
            }
            deliverEvent(event);
        });

        const r = wx?.request({
            url: arg?.url,
            method: arg?.method,
            enableChunked: true,
            timeout: arg.timeout || 60000,
            data: {
                ...arg?.reqParams
            },
            header: {
                ...arg?.headers
            },
            success: (res: any) => {
                // Flush any remaining data in parser
                parser.flush();
                handleSuccess(res);
                commonConsole(res, 'info', 'wx.request success');
            },
            fail: (err: any) => {
                handleError(err);
                commonConsole(err, 'error');
            }
        });

        // Set up chunk listener directly on the original request object
        r.onChunkReceived((chunk: { data: ArrayBuffer }) => {
            commonConsole(chunk, 'info', 'wx.request onChunkReceived raw');

            let dataForParse = '';

            if (chunk?.data instanceof ArrayBuffer) {
                const currentBytes = new Uint8Array(chunk?.data);
                const combinedBytes = new Uint8Array(pendingBytes.length + currentBytes.length);

                combinedBytes.set(pendingBytes);
                combinedBytes.set(currentBytes, pendingBytes.length);

                try {
                    dataForParse = arrayBufferToString(combinedBytes.buffer);
                    pendingBytes = new Uint8Array(0);
                } catch(err) {
                    commonConsole(err, 'error', 'decodeURIComponent error');
                    // Keep bytes for next chunk
                    pendingBytes = combinedBytes;
                    return;
                }
            } else {
                dataForParse = (chunk?.data as unknown as string) || '';
            }

            // Feed data to SSE parser
            parser.feed(dataForParse);
        });

        // Set up headers listener
        r.onHeadersReceived?.((res: { header: Record<string, string> }) => {
            commonConsole(res, 'info', 'wx.request onHeadersReceived');
            headersCallback?.(res.header);
        });

        // Return wrapper object with our own onChunkReceived/onHeadersReceived
        return {
            onChunkReceived: (fn: ChunkReceivedCallbackType) => {
                chunkCallback = fn;
                callbackReady = true;
                // Deliver any pending events
                while (pendingEvents.length > 0) {
                    const event = pendingEvents.shift()!;
                    fn(event);
                }
            },
            onHeadersReceived: (fn: HeadersReceivedCallbackType) => {
                headersCallback = fn;
            },
            abort: () => {
                r.abort?.();
            }
        };
    } catch(e) {
        commonConsole(e, 'error');
        throw e;
    }
};
