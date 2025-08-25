let enableConsole = true;

export const updateEnableConsole = (b: boolean) => {
    enableConsole = b;
};

/**
 * Print log messages with prefix
 *
 * @param msg Message content to print
 * @param type Log type, options are 'warn', 'error' or 'info'
 * @param words Optional parameter for additional text in prefix
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