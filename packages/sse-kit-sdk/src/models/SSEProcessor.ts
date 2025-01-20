import { request } from '../utils/requestStreaming';

import { commonConsole } from "../utils/commonConsole";
import { encodeBufferToJson } from '../utils/encodeBuffer';
import { createAsyncQueue } from '../utils/createAsyncQueue';

import type { ISSE, ConstructorArgsType } from './index.d';

export class SSEProcessor<TBody extends object> implements ISSE<TBody> {
    private url: `https://${string}`;
    private method: 'POST' | 'GET';
    private headers: Record<string, string>;
    private reqParams?: Record<string, string>;

    private body: TBody[] = [];
    private eventId: number = 0;
    private abortControllers: AbortController[] = [];
    private onHeadersReceived?: ConstructorArgsType<TBody>['onHeadersReceived'];


    constructor(options: ConstructorArgsType<TBody>) {
        commonConsole(options, 'info', 'SSEProcessor 实例化参数');

        this.url = options.url;
        this.method = options.method;
        this.headers = options.headers || {};
        this.reqParams = options.reqParams || {};

        options?.onHeadersReceived && (this.onHeadersReceived = options.onHeadersReceived);
    }

    /**
     * 异步获取消息
     *
     * @returns 返回一个异步可迭代对象，包含消息体
     */
    public async *message(): AsyncIterableIterator<TBody> {
        try {
            const queue = createAsyncQueue<any>();

            const r = request({
                url: this.url,
                method: this.method,
                reqParams: {
                    ...this.reqParams
                },
                headers: {
                    ...this.headers
                },
                success: (res: any) => {
                    commonConsole(res, 'info', '请求success完成');
                    queue.end();
                },
                fail: (err: any) => {
                    console.error('请求fail:', err);
                    queue.end();
                }
            })

            r?.onChunkReceived((chunk: any) => {
                const parsed = encodeBufferToJson(chunk?.data);
                queue.push(parsed);
                
                this.eventId += 1;
                this.body?.push(parsed);
            });

            r?.onHeadersReceived((chunk: Record<string, string>) => {
                this.onHeadersReceived?.(chunk)
            });


            while (true) {
                commonConsole('开始等待下一个数据', 'info');

                const { value, done } = await queue.next();
                if (done) {
                    return;
                }
                yield value;
            }
        } catch (error) {
            throw error;
        }
    };

    /**
     * 获取当前事件ID
     *
     * @returns 当前事件ID
     */
    public getCurentEventId() {
        return this.eventId;
    };


    public close() {};
}