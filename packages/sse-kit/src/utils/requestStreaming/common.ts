import { commonConsole } from '../commonConsole';
import type { RequestStreamingArgs, SSEChunk } from './index.d';

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
        if (state?.isFinished()) return;

        state?.markSuccessfullyCompleted();
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

/**
 * SSE parse buffer for tracking event state
 */
interface SSEParseBuffer {
    event: string;
    data: string[];
    id?: string;
}

/**
 * Create SSE event parser
 * Parses SSE protocol format and emits complete events
 *
 * SSE format:
 * event: eventName
 * data: line1
 * data: line2
 * id: 123
 *
 * (empty line signals end of event)
 */
export function createSSEParser(onEvent: (event: SSEChunk) => void) {
    let buffer: SSEParseBuffer = { event: '', data: [] };
    let textBuffer = '';

    return {
        /**
         * Feed chunk data to parser
         */
        feed(chunk: string): void {
            textBuffer += chunk;
            const lines = textBuffer.split('\n');
            textBuffer = lines.pop() || '';  // Keep incomplete line for next chunk

            for (const line of lines) {
                const trimmed = line.trimEnd();  // Only trim end to preserve data spacing

                if (trimmed.startsWith('event:')) {
                    buffer.event = trimmed.slice(6).trim();
                } else if (trimmed.startsWith('data:')) {
                    buffer.data.push(trimmed.slice(5).trimStart());
                } else if (trimmed.startsWith('id:')) {
                    buffer.id = trimmed.slice(3).trim();
                } else if (trimmed === '') {
                    // Empty line = event complete
                    if (buffer.data.length > 0) {
                        onEvent({
                            event: buffer.event || 'message',
                            data: buffer.data.join('\n'),
                            id: buffer.id
                        });
                    }
                    // Reset buffer for next event
                    buffer = { event: '', data: [] };
                }
                // Ignore other lines (comments starting with :, etc.)
            }
        },

        /**
         * Flush any remaining data (call when stream ends)
         */
        flush(): void {
            // Process any remaining text in buffer
            if (textBuffer) {
                const trimmed = textBuffer.trimEnd();
                if (trimmed.startsWith('data:')) {
                    buffer.data.push(trimmed.slice(5).trimStart());
                }
            }

            // Emit final event if there's data
            if (buffer.data.length > 0) {
                onEvent({
                    event: buffer.event || 'message',
                    data: buffer.data.join('\n'),
                    id: buffer.id
                });
            }

            // Reset
            buffer = { event: '', data: [] };
            textBuffer = '';
        }
    };
}