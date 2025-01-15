export function createAsyncQueue<T>() {
    const queue: T[] = [];
    let resolvers: ((it: IteratorResult<T>) => void)[] = [];
    let finished = false;

    return {
        push(value: T) {
        // 如果已结束忽略
        if (finished) return; 

        if (resolvers.length > 0) {
            // 如果已经有下游在等数据，直接 resolve
            const resolver = resolvers.shift()!;
            resolver({ value, done: false });
        } else {
            // 否则存入队列
            queue.push(value);
        }
        },

        end() {
        finished = true;
        // 如果有等待数据的，下游应该拿到 done=true
        for (const resolve of resolvers) {
            resolve({ value: undefined, done: true });
        }
        resolvers = [];
        },

        // 供生成器内部调用，用来获取下一个数据
        async next(): Promise<IteratorResult<T>> {
        if (queue.length > 0) {
            // 如果队列中有数据
            const value = queue.shift()!;
            return { value, done: false };
        }
        if (finished) {
            return { value: undefined, done: true };
        }

        // 否则返回一个Promise，让生成器的 while 循环 await
        return new Promise((resolve) => {
            resolvers.push(resolve);
        });
        },
    };
}