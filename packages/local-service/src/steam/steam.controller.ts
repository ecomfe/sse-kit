import { Response } from 'express';
import { Readable } from 'stream';
import { Controller, Post, Res, Body, Header } from '@nestjs/common';

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
}
