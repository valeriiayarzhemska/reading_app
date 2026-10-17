import { Module } from '@nestjs/common';
import { ReadingSessionsController } from './reading-sessions.controller.js';
import { ReadingSessionsService } from './reading-sessions.service.js';

@Module({
  controllers: [ReadingSessionsController],
  providers: [ReadingSessionsService],
})
export class ReadingSessionsModule {}
