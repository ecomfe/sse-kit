import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = process.cwd();

spawn('rollup', ['-c', '--watch'], {
  cwd: projectRoot,
  env: { ...process.env }
});

console.info('Rollup 监听进程已启动（分离模式，工作目录：' + projectRoot + '）。');

const libFolderPath = path.join(projectRoot, 'lib');
const checkInterval = 2000;

const intervalId = setInterval(() => {
  if (fs.existsSync(libFolderPath)) {
    console.info('检测到 lib 文件夹已生成，继续执行其他任务...');
    clearInterval(intervalId);
    process.exit(0);
  } else {
    console.info('lib 文件夹尚未生成，等待中...');
  }
}, checkInterval);
