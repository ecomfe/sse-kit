import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TestController } from './test/test.controller';
import { StreamController } from './steam/steam.controller';

@Module({
  imports: [],
  controllers: [AppController, StreamController, TestController],
  providers: [AppService],
})
export class AppModule {}
