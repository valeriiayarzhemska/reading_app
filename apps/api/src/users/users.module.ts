import { Module } from '@nestjs/common';

import { StatsModule } from '../stats/stats.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  // Gives UsersService access to the exported StatsService
  imports: [StatsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
