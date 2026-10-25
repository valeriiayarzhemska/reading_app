import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { ChatGateway } from './chat.gateway.js';
import { ClubsController } from './clubs.controller.js';
import { ClubsService } from './clubs.service.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  // TokenService: the gateway checks the token when a socket connects.
  // CoverStorage: a chat photo must be one the sender uploaded.
  imports: [AuthModule, UploadsModule],
  controllers: [ClubsController, MessagesController],
  // A gateway is a provider: Nest creates it and opens the socket endpoint
  providers: [ClubsService, MessagesService, ChatGateway],
  // NotificationsModule pushes through the same socket connection
  exports: [ChatGateway],
})
export class ClubsModule {}
