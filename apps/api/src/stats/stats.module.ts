import { Module } from '@nestjs/common';

import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

@Module({
  controllers: [StatsController],
  providers: [StatsService],
  // UsersModule shows the totals on public profiles
  exports: [StatsService],
})
export class StatsModule {}
