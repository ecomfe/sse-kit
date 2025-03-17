import { commonConsole } from "../commonConsole";
import {processChunkData} from '../processChunkData';
import {arrayBufferToString} from '../arrayBufferToString';

import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        if (!(arg?.url || arg?.method)) {
            const err = new Error('url or method is required');
            commonConsole(err, 'error');
            throw err;
        }
        let chunkBuffer = '';

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
                arg?.success?.(res);
                commonConsole(res, 'info', 'swan.request success');
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
                commonConsole(chunk, 'info', 'wx.request onChunkReceived');

                let dataForSplit = '';

                try {
                    if (chunk?.data instanceof ArrayBuffer) {
                        dataForSplit = arrayBufferToString(chunk?.data);
                    } else {
                        dataForSplit = chunk?.data || '';
                    }
                } catch(err) {
                    commonConsole(err, 'error', 'decodeURIComponent error');
                }
                
                const result = processChunkData(dataForSplit, chunkBuffer);
                chunkBuffer = result.newBuffer;
                result.messages.forEach(msg => {
                    if (msg.startsWith('data:')) {
                        const processedData = arg?.preprocessDataCallback 
                            ? arg?.preprocessDataCallback?.(msg) 
                            : msg;

                        const processed = processedData.replace(/^data:/, '').trim();
                        fn({ data: processed });
                    }
                });
            });
        }

        return r as RequestStreamingInstance;
    } catch(e) {
        commonConsole(e, 'error');
        throw e;
    }
}