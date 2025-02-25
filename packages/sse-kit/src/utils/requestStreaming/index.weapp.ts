import { commonConsole } from "../commonConsole";

import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        if (!(arg?.url || arg?.method)) {
            const err = new Error('url or method is required');
            commonConsole(err, 'error');
            throw err;
        }

        const r = wx?.request({
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
                arg?.success?.(res);
                commonConsole(res, 'info', 'request success');
            },
            fail: (err: any) => {
                arg?.fail?.(err);
                commonConsole(err, 'error');
                throw err;
            }
        })

        const originFunction = r.onChunkReceived.bind(r);
        r.onChunkReceived = (fn: ChunkReceivedCallbackType) => {
            originFunction((chunk: { data: ArrayBuffer }) => {
                let dataForSplit = '';
                if (chunk?.data instanceof ArrayBuffer) {
                    const v = new Uint8Array(chunk?.data)
                    dataForSplit = decodeURIComponent(escape(String.fromCharCode(...v)));
                };

                const lines = dataForSplit.split('\n');
                
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
    } catch(e) {
        commonConsole(e, 'error');
        throw e;
    }
}