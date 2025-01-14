const { exec } = require('child_process');

const args = process.argv.slice(2);
const mode = args[0] || 'weapp'; // 默认模式为 "weapp"

const backendCommand = 'pnpm --filter local-service run start --loglevel=info';

const frontendCommand = `pnpm --filter taro-demo run dev:${mode} --loglevel=info`;

const fullCommand = `concurrently --raw --prefix name --kill-others "${backendCommand}" "${frontendCommand}"`;

console.info(`Executing: ${fullCommand}`);

exec(fullCommand, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});