import { commonConsole } from '../commonConsole';
import type { RequestStreamingArgs } from './index.d';

/**
 * Request state management class
 */
export class RequestState {
    public isCompleted = false;
    public isUserAborted = false;
    public isStarted = false;

    public markCompleted(): void {
        this.isCompleted = true;
    }

    public markAborted(): void {
        this.isUserAborted = true;
        this.isCompleted = true;
    }

    public markStarted(): void {
        this.isStarted = true;
    }

    public reset(): void {
        this.isCompleted = false;
        this.isUserAborted = false;
        this.isStarted = false;
    }
}

/**
 * Validate request options
 */
export const validateRequestOptions = (options: RequestStreamingArgs): void => {
    if (!(options?.url && options?.method)) {
        const err = new Error('url and method are required');
        commonConsole(err, 'error');
        throw err;
    }
};

/**
 * Create generic error handler
 */
export const createErrorHandler = (fail?: (err: any) => void, state?: RequestState) => {
    return (error: any, errorType: 'aborted' | 'timeout' | 'error' = 'error') => {
        if (state?.isCompleted) return;
        
        state?.markCompleted();
        commonConsole(error, 'error', `Request ${errorType}`);
        
        const errorResponse = {
            error,
            status: errorType,
            message: error.message || `Request ${errorType}`
        };
        
        fail?.(errorResponse);
    };
};

/**
 * Create success handler
 */
export const createSuccessHandler = (success?: (res: any) => void, state?: RequestState) => {
    return (response: any) => {
        if (state?.isCompleted) return;
        
        state?.markCompleted();
        commonConsole(response, 'info', 'Request completed successfully');
        
        const successResponse = {
            status: 'success',
            message: 'Request completed successfully',
            headers: response?.headers || null
        };
        
        success?.(successResponse);
    };
};

/**
 * Process SSE data line
 */
export const processSseLine = (line: string, onChunkReceived: (chunk: {data: string}) => void) => {
    if (!line || !line.includes('data:')) return;
    
    try {
        const data = line.replace(/^data:/, '').trim();
        onChunkReceived({ data });
    } catch (err) {
        commonConsole(err, 'error', 'Error parsing line');
        throw err; // Re-throw for upper level handling
    }
};

/**
 * Build request headers
 */
export const buildRequestHeaders = (headers: Record<string, any> = {}, hasBody = false) => {
    const baseHeaders: Record<string, string> = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };
    
    if (hasBody) {
        baseHeaders['Content-Type'] = 'application/json';
    }
    
    return {
        ...baseHeaders,
        ...headers
    };
};