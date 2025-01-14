import { Controller, Post, Res, Body, Header } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('stream')
export class StreamController {
  /**
   * POST /stream/numbers
   *
   * 返回值：每 3 秒返回 5 个 1-100 的随机数字，连续返回 30 秒（总共 10 次）
   */
  @Post('numbers')
  @Header('Content-Type', 'application/json')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  streamNumbers(@Res() res: Response, @Body() body: any) {
    res.set({
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const stream = new Readable({
      read() {}, // 无需实现 read 方法
    });

    let count = 0;
    const maxCount = 10; // 30 秒 / 3 秒 = 10 次
    const intervalTime = 3000; // 3 秒

    const fn = () => {
      const randomNumbers = Array.from(
        { length: 5 },
        () => Math.floor(Math.random() * 100) + 1,
      );
      const data = {
        timestamp: new Date().toISOString(),
        numbers: randomNumbers,
        count: count + 1,
      };
      stream.push(JSON.stringify(data) + '\n'); // 使用换行符分隔 JSON 对象
      count++;
    };

    fn();

    const interval = setInterval(() => {
      if (count < maxCount) {
        fn();
      } else {
        stream.push(null); // 结束流
        clearInterval(interval);
      }
    }, intervalTime);

    stream.pipe(res);
  }

  /**
   * 其他接口（如之前的 file 和 custom）可以保留或根据需要修改
   */

  @Post('file')
  @Header('Content-Type', 'text/plain')
  getFileStream(@Res() res: Response, @Body() body: { filename?: string }) {
    const filename = body.filename || 'sample.txt';
    const filePath = join(__dirname, '..', 'files', filename);

    const fileStream = createReadStream(filePath);

    fileStream.on('open', () => {
      fileStream.pipe(res);
    });

    fileStream.on('error', () => {
      res.status(404).send('File not found');
    });
  }

  @Post('custom')
  getCustomStream(@Res() res: Response, @Body() body: { messages?: string[] }) {
    res.set({
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    });

    const stream = new Readable({
      read() {},
    });

    const messages = body.messages || [
      'Hello',
      'this',
      'is',
      'a',
      'streaming',
      'response.',
    ];
    let index = 0;

    const interval = setInterval(() => {
      if (index < messages.length) {
        stream.push(messages[index] + ' ');
        index++;
      } else {
        stream.push(null);
        clearInterval(interval);
      }
    }, 1000);

    stream.pipe(res);
  }
}
