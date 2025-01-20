export const commonConsole = (msg: any, type: 'warn' | 'error' | 'info', words?: string) => {
    const prefix = `[sse-kit]${words || ''}:`;
    
    switch (type) {
        case 'warn':
            console.warn(prefix, msg);
            break;
        case 'error':
            console.error(prefix, msg);
            break;
        case 'info':
        default:
            console.info(prefix, msg);
    }
}