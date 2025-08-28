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

                try {
                    if (chunk?.data instanceof ArrayBuffer) {
                        dataForSplit = arrayBufferToString(chunk?.data);
                    } else {
                        dataForSplit = chunk?.data || '';
                    }
                } catch(err) {
                    commonConsole(err, 'error', 'decodeURIComponent error');
                    handleError(err);
                    return;
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