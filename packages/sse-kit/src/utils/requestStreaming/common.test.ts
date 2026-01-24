import { describe, it, expect, vi } from 'vitest';
import { RequestState, validateRequestOptions, createSSEParser, buildRequestHeaders } from './common';

describe('RequestState', () => {
    it('should initialize with default values', () => {
        const state = new RequestState();
        expect(state.isStarted).toBe(false);
        expect(state.isSuccessfullyCompleted).toBe(false);
        expect(state.isUserAborted).toBe(false);
        expect(state.isTimedOut).toBe(false);
        expect(state.hasError).toBe(false);
        expect(state.isFinished()).toBe(false);
    });

    it('should mark as started', () => {
        const state = new RequestState();
        state.markStarted();
        expect(state.isStarted).toBe(true);
    });

    it('should mark as successfully completed', () => {
        const state = new RequestState();
        state.markSuccessfullyCompleted();
        expect(state.isSuccessfullyCompleted).toBe(true);
        expect(state.isFinished()).toBe(true);
    });

    it('should mark as aborted', () => {
        const state = new RequestState();
        state.markAborted();
        expect(state.isUserAborted).toBe(true);
        expect(state.isFinished()).toBe(true);
    });

    it('should mark as timed out', () => {
        const state = new RequestState();
        state.markTimedOut();
        expect(state.isTimedOut).toBe(true);
        expect(state.isFinished()).toBe(true);
    });

    it('should mark as error', () => {
        const state = new RequestState();
        state.markError();
        expect(state.hasError).toBe(true);
        expect(state.isFinished()).toBe(true);
    });

    it('should not change state after finished', () => {
        const state = new RequestState();
        state.markSuccessfullyCompleted();
        state.markError(); // Should not change
        expect(state.hasError).toBe(false);
        expect(state.isSuccessfullyCompleted).toBe(true);
    });

    it('should reset all states', () => {
        const state = new RequestState();
        state.markStarted();
        state.markSuccessfullyCompleted();
        state.reset();
        expect(state.isStarted).toBe(false);
        expect(state.isSuccessfullyCompleted).toBe(false);
        expect(state.isFinished()).toBe(false);
    });
});

describe('validateRequestOptions', () => {
    it('should throw error when url is missing', () => {
        expect(() => validateRequestOptions({ method: 'POST' } as any)).toThrow('url and method are required');
    });

    it('should throw error when method is missing', () => {
        expect(() => validateRequestOptions({ url: 'https://example.com' } as any)).toThrow('url and method are required');
    });

    it('should not throw when both url and method are provided', () => {
        expect(() => validateRequestOptions({
            url: 'https://example.com',
            method: 'POST'
        } as any)).not.toThrow();
    });
});

describe('createSSEParser', () => {
    it('should parse simple message event', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('data: {"hello": "world"}\n\n');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
            event: 'message',
            data: '{"hello": "world"}',
            id: undefined
        });
    });

    it('should parse event with custom event type', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('event: custom\ndata: test\n\n');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
            event: 'custom',
            data: 'test',
            id: undefined
        });
    });

    it('should parse event with id', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('id: 123\ndata: test\n\n');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
            event: 'message',
            data: 'test',
            id: '123'
        });
    });

    it('should parse complete SSE event with all fields', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('event: done\nid: 456\ndata: {"status": "complete"}\n\n');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
            event: 'done',
            data: '{"status": "complete"}',
            id: '456'
        });
    });

    it('should handle multi-line data', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('data: line1\ndata: line2\ndata: line3\n\n');

        expect(events).toHaveLength(1);
        expect(events[0].data).toBe('line1\nline2\nline3');
    });

    it('should handle chunked input', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('event: mes');
        parser.feed('sage\ndata: {"chunked"');
        parser.feed(': true}\n\n');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
            event: 'message',
            data: '{"chunked": true}',
            id: undefined
        });
    });

    it('should parse multiple events', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('data: event1\n\ndata: event2\n\ndata: event3\n\n');

        expect(events).toHaveLength(3);
        expect(events[0].data).toBe('event1');
        expect(events[1].data).toBe('event2');
        expect(events[2].data).toBe('event3');
    });

    it('should flush remaining data', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('data: incomplete');
        expect(events).toHaveLength(0);

        parser.flush();
        expect(events).toHaveLength(1);
        expect(events[0].data).toBe('incomplete');
    });

    it('should ignore comment lines', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed(': this is a comment\ndata: actual data\n\n');

        expect(events).toHaveLength(1);
        expect(events[0].data).toBe('actual data');
    });

    it('should not emit event without data', () => {
        const events: any[] = [];
        const parser = createSSEParser((event) => events.push(event));

        parser.feed('event: empty\nid: 123\n\n');

        expect(events).toHaveLength(0);
    });
});

describe('buildRequestHeaders', () => {
    it('should build default headers', () => {
        const headers = buildRequestHeaders();
        expect(headers).toEqual({
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
    });

    it('should add Content-Type when hasBody is true', () => {
        const headers = buildRequestHeaders({}, true);
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should merge custom headers', () => {
        const headers = buildRequestHeaders({ 'Authorization': 'Bearer token' });
        expect(headers['Authorization']).toBe('Bearer token');
        expect(headers['Accept']).toBe('text/event-stream');
    });

    it('should allow custom headers to override defaults', () => {
        const headers = buildRequestHeaders({ 'Accept': 'application/json' });
        expect(headers['Accept']).toBe('application/json');
    });
});
