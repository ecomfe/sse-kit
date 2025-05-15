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
        timeout = 60000, // 默认超时时间为 60 秒
    } = options;

    const controller = new AbortController();
    let onChunkReceivedCallback: ChunkReceivedCallbackType = () => { };
    let onHeadersReceivedCallback: HeadersReceivedCallbackType = () => { };
    let timeoutId: number | undefined;
    let isUserAborted = false;
    let isCompleted = false;

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    const handleError = (err: Error) => {
        if (isCompleted) return; // 防止重复处理
        isCompleted = true;
        
        cleanup();
        if (isUserAborted || err.name === 'AbortError') {
            fail?.({
                status: 'aborted',
                message: '用户主动取消请求',
                error: err
            });
        } else {
            fail?.({
                error: err,
                status: 'error',
                message: err.message || '请求失败'
            });
        }
    };

    const handleSuccess = (response: Response | null) => {
        if (isCompleted) return;
        isCompleted = true;
        
        cleanup();
        success?.({
            status: 'success',
            message: response ? '请求成功完成' : '请求成功，但响应体为空',
            headers: response ? response.headers : null
        });
    };

    const processStream = (reader: ReadableStreamDefaultReader<Uint8Array>, response: Response) => {
        let buffer = '';
        const decoder = new TextDecoder();

        function readChunk(): Promise<void> {
            return reader.read().then(({ done, value }) => {
                if (isCompleted) return; // 如果在读取过程中被中止

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
                            line.includes('data:') 
                            && onChunkReceivedCallback({data: line.replace(/^data:/, '').trim()});
                        } catch (err) {
                            commonConsole(err, 'error', '解析该行出错');
                        }
                    }
                }
                buffer = lines[lines.length - 1];

                // 继续读取下一个块
                return readChunk();
            }).catch(error => {
                // 处理 reader.read() 的错误
                if (!isCompleted) {
                    // 如果流读取被中止，也算作 AbortError
                     if ((error as Error).name === 'AbortError') {
                         handleError(new Error('Stream reading aborted by user or timeout'));
                    } else {
                        handleError(error as Error);
                    }
                }
            });
        }

        readChunk();
    };

    try {
        timeoutId = setTimeout(() => {
            controller.abort();
            cleanup();

            const timeoutError = new Error(`Request timeout after ${timeout}ms`);
            fail?.({
                error: timeoutError,
                status: 'timeout',
                message: `请求超时（${timeout}ms）`
            });
        }, timeout);

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: reqParams ? JSON.stringify(reqParams) : undefined,
            signal: controller.signal,
        })
        .then(response => {
            if (!response.ok) {
                 // 处理 HTTP 错误状态码
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
            handleError(err);
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
                if (!isCompleted) {
                    isUserAborted = true;
                    controller.abort(); // 这会触发 fetch 或 reader.read() 的 AbortError
                    cleanup();
                }
            } catch(err) {
                commonConsole(err, 'error', '取消请求失败');
            }
        },
    };
}