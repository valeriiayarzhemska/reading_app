import { Module } from '@nestjs/common';

import { FollowsModule } from '../follows/follows.module.js';
import { StatsModule } from '../stats/stats.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  // Gives UsersService access to the exported StatsService and FollowsService
  imports: [StatsModule, FollowsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
