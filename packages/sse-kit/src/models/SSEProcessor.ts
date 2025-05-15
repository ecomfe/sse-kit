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

    private onError?: (err: Error) => void;
    private onComplete?: (response: unknown) => void;
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

    public async *message(): AsyncIterableIterator<TBody> {
        try {
            const queue = createAsyncQueue<any>();
            let successCalled = false;
            let successResponse: any;

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
                    successResponse = res;
                    successCalled = true;
                    queue.end();
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

                const parsed = encodeBufferToJson<TBody>(chunk?.data);
                
                if (parsed !== undefined) {
                    queue.push(parsed);
                    this.eventId += 1;
                    this.body?.push(parsed as TBody);
                } else {
                    commonConsole('数据解析失败，跳过该条数据', 'warn');
                }
            });

            r?.onHeadersReceived((chunk: Headers) => {
                this.onHeadersReceived?.(chunk)
            });

            while (true) {
                const { value, done } = await queue.next();
                if (done) {
                    break;
                }
                yield value as TBody;
            }

            if (successCalled) {
                commonConsole(successResponse, 'info', '请求完成');
                this.onComplete?.(successResponse);
            }
        } catch (error) {
            throw error;
        }
    };

    public getCurrentEventId() {
        return this.eventId;
    };


    public close() {
        this.requestInstance?.abort();
    };
}