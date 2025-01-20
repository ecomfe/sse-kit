import type { RequestStreamingArgs, RequestStreamingInstance } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    console.info('request ------ index', arg)
}