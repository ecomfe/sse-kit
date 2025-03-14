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
        let successBuffer = '';
        
        const r = swan?.request({
            url: arg?.url,
            method: arg?.method,
            enableChunked: true,
            timeout: arg.timeout || 60000,
            responseType: 'arraybuffer',
            data: {
                ...arg?.reqParams
            },
            header: {
                ...arg?.headers
            },
            success: (res: any) => {
                commonConsole(res, 'info', 'swan.request success');

                const dataForSplit = arrayBufferToString(res.data);
                
                const result = processChunkData(dataForSplit || '', successBuffer);
                successBuffer = result.newBuffer;
                result.messages.forEach(msg => {
                    let processed = msg;
                    if (processed.startsWith('data:')) {
                        processed = processed.replace(/^data:/, '').trim();
                    }
                    arg?.success?.({ data: processed, type: 'chunk' });
                });

                if (dataForSplit && dataForSplit.endsWith('\n')) {
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
            originFunction((chunk: { data: ArrayBuffer }) => {
                commonConsole(chunk, 'info', 'swan.request onChunkReceived');

                let dataForSplit = '';
                try {
                    dataForSplit = arrayBufferToString(chunk.data);
                } catch(err) {
                    commonConsole(err, 'error', 'decodeURIComponent error');
                }
                commonConsole(dataForSplit, 'info', 'swan.request onChunkReceived arrayBufferToString');

                const result = processChunkData(dataForSplit, chunkBuffer);
                chunkBuffer = result.newBuffer;
                result.messages.forEach(msg => {
                    let processed = msg;
                    if (processed.startsWith('data:')) {
                        processed = processed.replace(/^data:/, '').trim();

                        fn({ data: processed });
                    }
                    
                });
            });
        }

        return r as RequestStreamingInstance;
    } catch (e) {
        commonConsole(e, 'error');
        throw e;
    }
}