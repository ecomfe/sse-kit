import { commonConsole } from "../commonConsole";

import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        if (!(arg?.url || arg?.method)) {
            const err = new Error('url or method is required');
            commonConsole(err, 'error');
            throw err;
        }

        const r = swan?.request({
            url: arg?.url,
            method: arg?.method,
            enableChunked: true,
            data: {
                ...arg?.reqParams
            },
            header: {
                ...arg?.headers
            },
            success: (res: any) => {
                const lines = res?.data?.split('\n');

                if (lines?.length > 1) {
                    for (let i = 0; i <= lines.length - 1; i++) {
                        const line = lines[i].trim();
                        if (line && line.includes('data:') ) {
                            arg?.success?.({ data: line.replace(/^data:/, '').trim(), type: 'chunk' });
                        } 
                        if (i === lines.length -1) {
                            arg?.success?.({ data: '', type: 'end', res });
                        }
                    }
                } else {
                    arg?.success?.({ data: '', type: 'end', res });
                }
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
                const lines = chunk?.data.split('\n');
                
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        line.includes('data:') 
                        && fn({ data: line.replace(/^data:/, '').trim() });
                    }
                }
            })
        }

        return r as RequestStreamingInstance;
    } catch (e) {
        commonConsole(e, 'error');
        throw e;
    }
}