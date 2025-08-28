import { commonConsole } from "../commonConsole";
import { RequestState, validateRequestOptions, createErrorHandler, createSuccessHandler, processSseLine, buildRequestHeaders } from './common';
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
        let buffer = '';
        const decoder = new TextDecoder();

        function readChunk(): Promise<void> {
            return streamReader.read().then(({ done, value }) => {
                if (state.isFinished()) return;

                if (done) {
                    handleSuccess(response);
                    return;
                }

                const chunkText = decoder.decode(value, { stream: true });
                buffer += chunkText;

                const lines = buffer.split('\n');
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        try {
                            processSseLine(line, onChunkReceivedCallback);
                        } catch (err) {
                            handleError(err as Error);
                            return;
                        }
                    }
                }
                buffer = lines[lines.length - 1];

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
        
        timeoutId = setTimeout(() => {
            if (!state.isFinished()) {
                state.markTimedOut();  // 先标记超时状态
                controller.abort();    // 然后触发abort（这会导致AbortError）
                cleanup();
                // 不在这里直接调用 handleError，让 .catch() 中的逻辑处理
                // 因为 controller.abort() 会触发 fetch 的 AbortError
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
                if (!state.isFinished()) {  // 使用 isFinished() 代替 isCompleted
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