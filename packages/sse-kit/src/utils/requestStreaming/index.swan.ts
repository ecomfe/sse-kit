import { commonConsole } from "../commonConsole";

import type { RequestStreamingArgs, RequestStreamingInstance } from './index.d';

export const request = (arg: RequestStreamingArgs): RequestStreamingInstance => {
    try {
        if (!(arg?.url || arg?.method)) {
            const err = new Error('url or method is required');
            commonConsole(err, 'error');
            throw err;
        }

        const r = swan?.request({
            url: arg?.url,
            method: arg?.method,
            enableChunked: true,
            data: {
                ...arg?.reqParams
            },
            header: {
                ...arg?.headers
            },
            success: (res: any) => {
                arg?.success?.(res);
                commonConsole(res, 'info', 'request success');
            },
            fail: (err: any) => {
                arg?.fail?.(err);
                commonConsole(err, 'error');
                throw err;
            }
          })

          return r as RequestStreamingInstance;
    } catch(e) {
        commonConsole(e, 'error');
        throw e;
    }
}