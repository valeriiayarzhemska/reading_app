import { Module } from '@nestjs/common';

import { ClubsModule } from '../clubs/clubs.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  // ChatGateway: live delivery to the recipient's personal socket room
  imports: [ClubsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // Follows and posts create notifications
  exports: [NotificationsService],
})
export class NotificationsModule {}
