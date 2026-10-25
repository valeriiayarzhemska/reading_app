import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { FollowsController } from './follows.controller.js';
import { FollowsService } from './follows.service.js';

@Module({
  // A new follower gets notified
  imports: [NotificationsModule],
  controllers: [FollowsController],
  providers: [FollowsService],
  // UsersModule's reader search shows Follow buttons too
  exports: [FollowsService],
})
export class FollowsModule {}
