import { request }  from '../utils/requestStreaming';

import { encodeBufferToJson } from '../utils/encodeBuffer';
import { createAsyncQueue } from '../utils/createAsyncQueue';

import type { ISSE, ConstructorArgsType } from './index.d';

export class SSEProcessor<TBody extends object> implements ISSE<TBody> {
    private url: `https://${string}`;
    private method: 'POST' | 'GET';
    private headers: Record<string, string>;
    private reqParams?: Record<string, string>;

    private body?: TBody;
    private abortControllers: AbortController[] = []; 

    private error: boolean = false;


    constructor(options: ConstructorArgsType<TBody>) {
        this.url = options.url;
        this.method = options.method;
        this.headers = options.headers || {};
        this.reqParams = options.reqParams || {};
    }

    async *message(): AsyncIterableIterator<TBody> {
        try {
            const queue = createAsyncQueue<any>();

            const r = request({
                url: `http://localhost:3000/stream/numbers`,
                method: 'POST',
                enableChunked: true,
                data: {},
                header: {},
                success: (res: any) => {
                    console.info('请求success:', res);
                    queue.end();
                },
                fail: (err: any) => {
                    console.error('请求fail:', err);
                    queue.end();
                }
            })

            r.onChunkReceived((chunk: any) => {
                const parsed = encodeBufferToJson(chunk?.data);
                console.info('onChunkReceived:', parsed);
                queue.push(parsed);
            });

            r.onHeadersReceived((chunk: any) => {
                console.info('onHeadersReceived:', chunk);
                queue.push(chunk);
            });


            while (true) {
                console.info('开始等待下一个数据');
                const { value, done } = await queue.next();
                if (done) {
                    return;
                }
                yield value;
            }
        } catch (error) {
            throw error;
        }
    }

    public close() {

    }
}