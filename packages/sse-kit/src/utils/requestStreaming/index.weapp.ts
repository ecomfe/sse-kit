import { commonConsole } from "../commonConsole";
import { processChunkData } from '../processChunkData';
import { arrayBufferToString } from '../arrayBufferToString';
import { RequestState, validateRequestOptions, createErrorHandler, createSuccessHandler, processSseLine } from './common';
import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        validateRequestOptions(arg);
        
        const state = new RequestState();
        const handleError = createErrorHandler(arg.fail, state);
        const handleSuccess = createSuccessHandler(arg.success, state);
        let chunkBuffer = '';
        let pendingBytes = new Uint8Array(0); // Buffer for incomplete UTF-8 sequences

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
                handleSuccess(res);
                commonConsole(res, 'info', 'wx.request success');
            },
            fail: (err: any) => {
                handleError(err);
                commonConsole(err, 'error');
            }
        })

        const originFunction = r.onChunkReceived.bind(r);
        r.onChunkReceived = (fn: ChunkReceivedCallbackType) => {
            originFunction((chunk: { data: ArrayBuffer }) => {
                commonConsole(chunk, 'info', 'wx.request onChunkReceived');

                let dataForSplit = '';

                if (chunk?.data instanceof ArrayBuffer) {
                    const currentBytes = new Uint8Array(chunk?.data);
                    const combinedBytes = new Uint8Array(pendingBytes.length + currentBytes.length);
                    
                    combinedBytes.set(pendingBytes);
                    combinedBytes.set(currentBytes, pendingBytes.length);
                    
                    try {
                        dataForSplit = arrayBufferToString(combinedBytes.buffer);
                        pendingBytes = new Uint8Array(0);
                    } catch(err) {
                        commonConsole(err, 'error', 'decodeURIComponent error');
                        
                        pendingBytes = combinedBytes;
                        return;
                    }
                } else {
                    dataForSplit = chunk?.data || '';
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