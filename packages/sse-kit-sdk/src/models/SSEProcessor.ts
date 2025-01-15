import type {ISSE, ConstructorArgsType} from './index.d';

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

    private async connect() {

    }

    async *message (): AsyncIterableIterator<TBody> {
        try {
            // const decoder = new TextDecoder();

            // for await (const data of this.body) {
            //     const decodedData = decoder.decode(data, {stream: true});

            //     const [items, remaining] = splitChunk(lastRemainingData + decodedData);
            //     lastRemainingData = remaining;
            //     for (const item of items) {
            //         const text = item.replace(/^data:/, '').trim();
            //         if (text === '') {
            //             continue;
            //         }
            //         try {
            //             const res = JSON.parse(text);
            //             yield res;
            //         }
            //         catch (e: any) {
            //             this.cancel();
            //             this.error = true;
            //             this.errorMsg = text;
            //             return;
            //         }
            //     }
            // }
        } catch(error) {
            throw error;
        }
    }

    public close() {

    }
}