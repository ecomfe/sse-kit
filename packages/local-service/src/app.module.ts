import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StreamController } from './steam/steam.controller';

@Module({
  imports: [],
  controllers: [AppController, StreamController],
  providers: [AppService],
})
export class AppModule {}
