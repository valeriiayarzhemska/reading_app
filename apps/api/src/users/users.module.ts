import { Module } from '@nestjs/common';

import { CollectionsModule } from '../collections/collections.module.js';
import { FollowsModule } from '../follows/follows.module.js';
import { StatsModule } from '../stats/stats.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  // Gives UsersService the services these modules export
  imports: [StatsModule, FollowsModule, CollectionsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
