import { commonConsole } from '../commonConsole';
import type { RequestStreamingArgs } from './index.d';

/**
 * Request state management class
 */
export class RequestState {
    public isStarted = false;
    public isSuccessfullyCompleted = false;
    public isUserAborted = false;
    public isTimedOut = false;
    public hasError = false;

    public markSuccessfullyCompleted(): void {
        if (!this.isFinished()) {
            this.isSuccessfullyCompleted = true;
        }
    }

    public markAborted(): void {
        if (!this.isFinished()) {
            this.isUserAborted = true;
        }
    }

    public markTimedOut(): void {
        if (!this.isFinished()) {
            this.isTimedOut = true;
        }
    }

    public markError(): void {
        if (!this.isFinished()) {
            this.hasError = true;
        }
    }

    public markStarted(): void {
        this.isStarted = true;
    }

    public isFinished(): boolean {
        return this.isSuccessfullyCompleted || this.isUserAborted || this.isTimedOut || this.hasError;
    }

    public reset(): void {
        this.isStarted = false;
        this.isSuccessfullyCompleted = false;
        this.isUserAborted = false;
        this.isTimedOut = false;
        this.hasError = false;
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
        if (errorType !== 'aborted' && state?.isFinished()) {
            return;
        }
        
        switch(errorType) {
            case 'aborted':
                break;
            case 'timeout':
                state?.markTimedOut();
                break;
            case 'error':
                state?.markError();
                break;
        }
        
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
        if (state?.isFinished()) return;  // 使用 isFinished() 而不是 isCompleted
        
        state?.markSuccessfullyCompleted();  // 使用新的方法名
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