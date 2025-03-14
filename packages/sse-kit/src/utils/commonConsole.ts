let enableConsole = true;

export const updateEnableConsole = (b: boolean) => {
    enableConsole = b;
};

/**
 * 打印带有前缀的日志信息
 *
 * @param msg 要打印的消息内容
 * @param type 日志类型，可选值为 'warn'、'error' 或 'info'
 * @param words 可选参数，用于指定前缀中的附加文本
 */
export const commonConsole = (
    msg: any,
    type: 'warn' | 'error' | 'info',
    words?: string
) => {
    if (!enableConsole) return;

    const prefix = `[sse-kit]${words ? ` ${words}` : ''}`;

    let style = 'background: #00c8c8; color: #fff; padding: 2px 4px; border-radius: 3px;';
    switch (type) {
        case 'warn':
            style = 'background: orange; color: #000; padding: 2px 4px; border-radius: 3px;';
            console.warn(`%c${prefix}`, style, msg);
        break;

        case 'error':
            style = 'background: red; color: #fff; padding: 2px 4px; border-radius: 3px;';
            console.error(`%c${prefix}`, style, msg);
        break;
        
        case 'info':
        default:
            style = 'background: #00c8c8; color: #fff; padding: 2px 4px; border-radius: 3px;';
            console.info(`%c${prefix}`, style, msg);
        break;
    }
};