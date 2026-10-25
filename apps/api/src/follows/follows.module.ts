import { Module } from '@nestjs/common';

import { FollowsController } from './follows.controller.js';
import { FollowsService } from './follows.service.js';

@Module({
  controllers: [FollowsController],
  providers: [FollowsService],
  // UsersModule's reader search shows Follow buttons too
  exports: [FollowsService],
})
export class FollowsModule {}
