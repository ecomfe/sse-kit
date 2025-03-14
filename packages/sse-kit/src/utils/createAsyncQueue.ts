export function createAsyncQueue<T>() {
    const queue: T[] = [];
    let resolvers: ((it: IteratorResult<T>) => void)[] = [];
    let finished = false;

    return {
        push(value: T) {
            if (finished) return;

            if (resolvers.length > 0) {
                const resolver = resolvers.shift()!;
                resolver({ value, done: false });
            } else {
                queue.push(value);
            }
        },

        end() {
            finished = true;
            for (const resolve of resolvers) {
                resolve({ value: undefined, done: true });
            }
            resolvers = [];
        },

        async next(): Promise<IteratorResult<T>> {
            if (queue.length > 0) {
                const value = queue.shift()!;
                return { value, done: false };
            }
            if (finished) {
                return { value: undefined, done: true };
            }

            return new Promise((resolve) => {
                resolvers.push(resolve);
            });
        },
    };
}