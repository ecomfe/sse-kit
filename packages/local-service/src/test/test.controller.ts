import { Controller, Get } from '@nestjs/common';

@Controller()
export class TestController {
  @Get('test')
  getHealth() {
    // 这里随意返回 JSON 或字符串即可
    return { status: 'ok' };
  }
}
