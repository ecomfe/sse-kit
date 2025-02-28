import { request } from '../utils/requestStreaming';

import { commonConsole } from "../utils/commonConsole";
import { encodeBufferToJson } from '../utils/encodeBuffer';
import { createAsyncQueue } from '../utils/createAsyncQueue';

import type { ISSE, ConstructorArgsType } from './index.d';
import type {RequestStreamingInstance} from '../utils/requestStreaming/index.d';

export class SSEProcessor<TBody extends object> implements ISSE<TBody> {
    public id: symbol;

    private url: `https://${string}`;
    private method: 'POST' | 'GET';
    private reqParams?: Record<string, string>;
    private headers: Headers | Record<string, string>;

    private body: TBody[] = [];
    private eventId: number = 0;
    private requestInstance?: RequestStreamingInstance;

    private onComplete?: () => void;
    private onError?: (err: Error) => void;
    private onHeadersReceived?: ConstructorArgsType<TBody>['onHeadersReceived'];

    constructor(options: ConstructorArgsType<TBody>) {
        commonConsole(options, 'info', 'SSEProcessor 实例化参数');

        this.id = Symbol();
        this.url = options.url;
        this.method = options.method;
        this.headers = options.headers || {};
        this.reqParams = options.reqParams || {};

        options?.onError && (this.onError = options.onError);
        options?.onComplete && (this.onComplete = options.onComplete);
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
                headers: { ...this.headers } as Headers,
                success: (res: any) => {
                    commonConsole(res, 'info', '请求完成');
                    this.onComplete?.();
                },
                fail: (err: any) => {
                    commonConsole(err, 'error', '请求 fail');
                    // queue.end();
                    this.onError?.(err);
                }
            })
            this.requestInstance = r;

            // H5 和百度小程序 chunk 返回值为 string；
            r?.onChunkReceived((chunk: { data: ArrayBuffer | string }) => {
                const parsed = encodeBufferToJson(chunk?.data);

                queue.push(parsed);
                
                this.eventId += 1;
                this.body?.push(parsed);
            });

            // 监听 response headers 返回
            r?.onHeadersReceived((chunk: Headers) => {
                this.onHeadersReceived?.(chunk)
            });

            // 数据 chunk 持续抛出
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
    public getCurrentEventId() {
        return this.eventId;
    };


    public close() {
        this.requestInstance?.abort();
    };
}