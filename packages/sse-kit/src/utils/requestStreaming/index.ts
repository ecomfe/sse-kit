import { commonConsole } from "../commonConsole";
import { RequestState, validateRequestOptions, createErrorHandler, createSuccessHandler, createSSEParser, buildRequestHeaders } from './common';
import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType, HeadersReceivedCallbackType } from './index.d';

export function request(options: RequestStreamingArgs): RequestStreamingInstance {
    validateRequestOptions(options);

    const {
        url,
        method,
        reqParams,
        headers = {},
        success,
        fail,
        credentials,
        timeout = 60000,
    } = options;

    const controller = new AbortController();
    const state = new RequestState();
    const handleError = createErrorHandler(fail, state);
    const handleSuccess = createSuccessHandler(success, state);

    let onChunkReceivedCallback: ChunkReceivedCallbackType = () => { };
    let onHeadersReceivedCallback: HeadersReceivedCallbackType = () => { };
    let timeoutId: number | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
        // Clean up Reader resources
        if (reader) {
            try {
                reader.cancel('Stream cleanup');
            } catch (err) {
                commonConsole(err, 'warn', 'Reader cancel failed');
            }
            reader = null;
        }
    };

    const processStream = (streamReader: ReadableStreamDefaultReader<Uint8Array>, response: Response) => {
        reader = streamReader; // Save reader reference for cleanup
        const decoder = new TextDecoder();

        // Create SSE parser that emits complete events with event type
        const parser = createSSEParser((event) => {
            onChunkReceivedCallback(event);
        });

        function readChunk(): Promise<void> {
            return streamReader.read().then(({ done, value }) => {
                if (state.isFinished()) return;

                if (done) {
                    // Flush any remaining data in parser
                    parser.flush();
                    handleSuccess(response);
                    return;
                }

                const chunkText = decoder.decode(value, { stream: true });
                parser.feed(chunkText);

                return readChunk();
            }).catch(error => {
                // Handle stream reading errors appropriately
                if ((error as Error).name === 'AbortError') {
                    if (state.isUserAborted) {
                        // User called abort() - treat as aborted status
                        handleError(error, 'aborted');
                    } else if (state.isTimedOut) {
                        // Already handled by timeout logic
                        return;
                    } else {
                        // Other abort reason
                        handleError(error, 'aborted');
                    }
                } else if (!state.isFinished()) {
                    // For other errors, check if request is not already finished
                    handleError(error as Error);
                }
            });
        }

        readChunk();
    };

    try {
        if (state.isStarted) {
            throw new Error('Request already started');
        }
        state.markStarted();

        // Connection timeout: abort if no response received within timeout period
        // Once response is received, timeout is cleared (see .then() handler below)
        timeoutId = setTimeout(() => {
            if (!state.isFinished()) {
                state.markTimedOut();
                controller.abort();
                cleanup();
            }
        }, timeout);

        const requestHeaders = buildRequestHeaders(headers, !!reqParams);

        fetch(url, {
            method,
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'manual',
            headers: requestHeaders,
            signal: controller.signal,
            body: reqParams ? JSON.stringify(reqParams) : undefined,
            ...(credentials ? { credentials } : {})
        })
        .then(response => {
            // Clear timeout once response is received (connection established)
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }

            if (!response.ok) {
                // Handle HTTP error status codes
                return response.text().then(errorBody => {
                    throw new Error(`HTTP status code: ${response.status}. Body: ${errorBody}`);
                }).catch(() => {
                    throw new Error(`HTTP status code: ${response.status}. Failed to read error body.`);
                });
            }

            onHeadersReceivedCallback(response.headers);

            if (!response.body) {
                handleSuccess(null);
                return Promise.resolve();
            }

            processStream(response.body.getReader(), response);
            return Promise.resolve();
        })
        .catch(err => {
            if ((err as Error).name === 'AbortError') {
                if (state.isUserAborted) {
                    handleError(err, 'aborted');
                } else if (state.isTimedOut) {
                    return;
                } else {
                    handleError(err, 'aborted');
                }
            } else if (!state.isFinished()) {
                handleError(err);
            }
        });

    } catch (initialError) {
        handleError(initialError as Error);
    }

    return {
        onChunkReceived(fn) {
            onChunkReceivedCallback = fn;
        },
        onHeadersReceived(fn) {
            onHeadersReceivedCallback = fn;
        },
        abort() {
            try {
                if (!state.isFinished()) {
                    state.markAborted();
                    controller.abort();
                    cleanup();
                }
            } catch(err) {
                commonConsole(err, 'error', 'Request cancellation failed');
                handleError(err as Error);
            }
        },
    };
}
