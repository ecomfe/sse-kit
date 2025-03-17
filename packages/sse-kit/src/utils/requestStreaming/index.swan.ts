import { commonConsole } from "../commonConsole";

import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';


export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        if (!(arg?.url || arg?.method)) {
            const err = new Error('url or method is required');
            commonConsole(err, 'error');
            throw err;
        }
        let chunkBuffer = '';
        
        const r = swan?.request({
            url: arg?.url,
            method: arg?.method,
            enableChunked: true,
            timeout: arg.timeout || 60000,
            responseType: 'text',
            data: {
                ...arg?.reqParams
            },
            header: {
                ...arg?.headers
            },
            success: (res: any) => {
                arg?.success?.(res);
                commonConsole(res, 'info', 'swan.request success');
            },
            fail: (err: any) => {
                arg?.fail?.(err);
                commonConsole(err, 'error');
                throw err;
            }
        });

        const originFunction = r.onChunkReceived.bind(r);
        r.onChunkReceived = (fn: ChunkReceivedCallbackType) => {
            originFunction((chunk: { data: string }) => {
                let dataStr: string = chunk.data;

                chunkBuffer += dataStr;
                const lines = chunkBuffer.split('\n');
        
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        try {
                            if (line.includes('data:')) {
                                const processedLine = arg?.preprocessDataCallback ? arg?.preprocessDataCallback?.(line) : line;
                                
                                fn({ data: processedLine.replace(/^data:/, '').trim() });
                            }
                        } catch (err) {
                            commonConsole(err, 'error', '解析该行出错');
                        }
                    }
                }
                chunkBuffer = lines[lines.length - 1];
            });
        };

        return r as RequestStreamingInstance;
    } catch (e) {
        commonConsole(e, 'error');
        throw e;
    }
}