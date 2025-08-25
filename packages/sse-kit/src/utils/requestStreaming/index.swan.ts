import { commonConsole } from "../commonConsole";
import { RequestState, validateRequestOptions, createErrorHandler, createSuccessHandler, processSseLine } from './common';
import type { RequestStreamingArgs, RequestStreamingInstance, ChunkReceivedCallbackType } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        validateRequestOptions(arg);
        
        const state = new RequestState();
        const handleError = createErrorHandler(arg.fail, state);
        const handleSuccess = createSuccessHandler(arg.success, state);
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
                handleSuccess(res);
                commonConsole(res, 'info', 'swan.request success');
            },
            fail: (err: any) => {
                handleError(err);
                commonConsole(err, 'error');
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
                            const processedLine = arg?.preprocessDataCallback ? arg?.preprocessDataCallback?.(line) : line;
                            processSseLine(processedLine, fn);
                        } catch (err) {
                            commonConsole(err, 'error', 'Error parsing line');
                            handleError(err);
                            return;
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