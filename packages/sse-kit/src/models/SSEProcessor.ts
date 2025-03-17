import { request } from '../utils/requestStreaming';

import { encodeBufferToJson } from '../utils/encodeBuffer';
import { createAsyncQueue } from '../utils/createAsyncQueue';
import { commonConsole, updateEnableConsole } from "../utils/commonConsole";

import type { ISSE, ConstructorArgsType } from './index.d';
import type {RequestStreamingInstance} from '../utils/requestStreaming/index.d';

export class SSEProcessor<TBody extends object> implements ISSE<TBody> {
    public id: symbol;

    private url: `https://${string}` | `http://${string}`;
    private method: 'POST' | 'GET';
    private timeout: number = 60000;
    private reqParams?: Record<string, string>;
    private headers: Headers | Record<string, string>;

    private body: TBody[] = [];
    private eventId: number = 0;
    private requestInstance?: RequestStreamingInstance;

    private onComplete?: () => void;
    private onError?: (err: Error) => void;
    private preprocessDataCallback?: (data: string | ArrayBuffer) => string | ArrayBuffer;
    private onHeadersReceived?: ConstructorArgsType<TBody>['onHeadersReceived'];

    constructor(options: ConstructorArgsType<TBody>) {
        commonConsole(options, 'info', 'SSEProcessor 实例化参数');

        this.id = Symbol();
        this.url = options.url;
        this.method = options.method;
        this.headers = options.headers || {};
        this.reqParams = options.reqParams || {};

        options?.timeout && (this.timeout = options.timeout);
        options?.onError && (this.onError = options.onError);
        options?.onComplete && (this.onComplete = options.onComplete);
        options?.onHeadersReceived && (this.onHeadersReceived = options.onHeadersReceived);
        options?.preprocessDataCallback && (this.preprocessDataCallback = options.preprocessDataCallback);

        if (options.enableConsole !== undefined) {
            updateEnableConsole(options.enableConsole);
        }
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
                timeout: this.timeout,
                headers: { ...this.headers } as Headers,
                preprocessDataCallback: this.preprocessDataCallback,
                success: (res: any) => {
                    commonConsole(res, 'info', '请求完成');
                    this.onComplete?.();
                },
                fail: (err: any) => {
                    commonConsole(err, 'error', '请求 fail');
                    this.onError?.(err);
                    queue.end();
                }
            })
            this.requestInstance = r;

            r?.onChunkReceived((chunk: { data: ArrayBuffer | string }) => {
                commonConsole(chunk?.data, 'info', 'SSEProcessor chunk 数据')

                const parsed = encodeBufferToJson(chunk?.data);

                queue.push(parsed);
                
                this.eventId += 1;
                this.body?.push(parsed);
            });

            r?.onHeadersReceived((chunk: Headers) => {
                this.onHeadersReceived?.(chunk)
            });

            while (true) {
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