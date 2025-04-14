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
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };

    (async () => {
        try {
            timeoutId = setTimeout(() => {
                controller.abort();
                cleanup();
                const timeoutError = new Error(`Request timeout after ${timeout}ms`);
                fail?.(timeoutError);
            }, timeout);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: reqParams ? JSON.stringify(reqParams) : undefined,
                signal: controller.signal,
            });

            if (!response.ok) {
                cleanup();
                throw new Error(`HTTP status code: ${response.status}`);
            }
            onHeadersReceivedCallback(response.headers);

            if (!response.body) {
                cleanup();
                success?.(null);
                return;
            }

            const reader = response.body.getReader();

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
              
                const chunkText = new TextDecoder().decode(value, { stream: true });
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
            }

            cleanup();
            success?.(response.headers);
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