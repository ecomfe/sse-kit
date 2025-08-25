import fs from 'fs';
import nodePath from 'path';

let pathCache = new Map();

const checkPathIsExists = (path) => {
    if (pathCache.has(path)) {
        return pathCache.get(path).isExists;
    }

    let isExists = fs.existsSync(path);
    pathCache.set(path, { isExists });
    return isExists;
};

const checkPathIsDirectory = (path) => {
    let cache = pathCache.get(path);
    if (cache && cache.isDirectory !== undefined) {
        return cache.isDirectory;
    }

    let isDirectory = fs.existsSync(path) && fs.statSync(path).isDirectory();
    if (cache) {
        cache.isDirectory = isDirectory;
    } else {
        pathCache.set(path, { isExists: true, isDirectory });
    }
    return isDirectory;
};

export const multiPlatformBuild = function ({ platformSignal }) {
    return {
        visitor: {
            ImportDeclaration(path) {
                try {
                    const curFilePath = path.hub.file.opts.filename;
                    const sourceFilePath = path.node.source.value;
                    const fileDirPath = nodePath.resolve(nodePath.dirname(curFilePath), sourceFilePath);

                    const isExists = checkPathIsExists(fileDirPath);
                    if (!isExists) {
                        return;
                    };

                    const isDirectory = checkPathIsDirectory(fileDirPath);
                    if (!isDirectory) {
                        return;
                    }

                    const files = fs.readdirSync(fileDirPath);
                    files.some(file => {
                        if (file?.includes(`.${platformSignal}`)) {
                            path.node.source.value = `${sourceFilePath}/${file}`;
                            return true;
                        }
                    });
                } catch (err) {
                    console.error('multiPlatformBuild plugin error:', err);
                }
            }
        }
    };
};