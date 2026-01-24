import { describe, it, expect } from 'vitest';
import { createAsyncQueue } from './createAsyncQueue';

describe('createAsyncQueue', () => {
    it('should push and retrieve values in order', async () => {
        const queue = createAsyncQueue<number>();

        queue.push(1);
        queue.push(2);
        queue.push(3);

        const result1 = await queue.next();
        const result2 = await queue.next();
        const result3 = await queue.next();

        expect(result1).toEqual({ value: 1, done: false });
        expect(result2).toEqual({ value: 2, done: false });
        expect(result3).toEqual({ value: 3, done: false });
    });

    it('should wait for values when queue is empty', async () => {
        const queue = createAsyncQueue<string>();

        // Start waiting before pushing
        const promise = queue.next();

        // Push after a delay
        setTimeout(() => queue.push('delayed'), 10);

        const result = await promise;
        expect(result).toEqual({ value: 'delayed', done: false });
    });

    it('should return done when ended', async () => {
        const queue = createAsyncQueue<number>();

        queue.push(1);
        queue.end();

        const result1 = await queue.next();
        const result2 = await queue.next();

        expect(result1).toEqual({ value: 1, done: false });
        expect(result2).toEqual({ value: undefined, done: true });
    });

    it('should resolve pending promises when ended', async () => {
        const queue = createAsyncQueue<number>();

        // Start waiting
        const promise = queue.next();

        // End the queue
        queue.end();

        const result = await promise;
        expect(result).toEqual({ value: undefined, done: true });
    });

    it('should not push values after ended', async () => {
        const queue = createAsyncQueue<number>();

        queue.end();
        queue.push(1); // Should be ignored

        const result = await queue.next();
        expect(result).toEqual({ value: undefined, done: true });
    });

    it('should work with async iteration', async () => {
        const queue = createAsyncQueue<number>();

        queue.push(1);
        queue.push(2);
        queue.push(3);
        queue.end();

        const values: number[] = [];

        // Use the queue as async iterator
        while (true) {
            const { value, done } = await queue.next();
            if (done) break;
            values.push(value);
        }

        expect(values).toEqual([1, 2, 3]);
    });

    it('should handle multiple pending waiters', async () => {
        const queue = createAsyncQueue<string>();

        const promise1 = queue.next();
        const promise2 = queue.next();
        const promise3 = queue.next();

        queue.push('a');
        queue.push('b');
        queue.push('c');

        const results = await Promise.all([promise1, promise2, promise3]);

        expect(results[0]).toEqual({ value: 'a', done: false });
        expect(results[1]).toEqual({ value: 'b', done: false });
        expect(results[2]).toEqual({ value: 'c', done: false });
    });

    it('should handle objects', async () => {
        interface TestData {
            id: number;
            name: string;
        }

        const queue = createAsyncQueue<TestData>();

        queue.push({ id: 1, name: 'test' });

        const result = await queue.next();
        expect(result.value).toEqual({ id: 1, name: 'test' });
    });
});
