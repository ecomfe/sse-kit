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
                commonConsole(res, 'info', 'wx.request success');

                let dataForSplit = '';
                if (res?.data instanceof ArrayBuffer) {
                    const v = new Uint8Array(res?.data);
                    dataForSplit = decodeURIComponent(escape(String.fromCharCode(...v)));
                } else {
                    dataForSplit = res?.data || '';
                }

                // 使用公共方法处理数据
                const result = processChunkData(dataForSplit, successBuffer);
                successBuffer = result.newBuffer;
                result.messages.forEach(msg => {
                    if (msg.startsWith('data:')) {
                        const processed = msg.replace(/^data:/, '').trim();
                        arg?.success?.({ data: processed, type: 'chunk' });
                    }
                });
                // 如果返回数据以换行符结束，则认为数据完整，发送结束标识
                if (dataForSplit.endsWith('\n')) {
                    arg?.success?.({ data: '', type: 'end', res });
                }
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
                        const processed = msg.replace(/^data:/, '').trim();
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