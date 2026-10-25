import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { NotificationsService } from './notifications.service.js';

class NotificationListQuery {
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * My notifications, newest first. Pass nextCursor as ?cursor= for older ones.
   */
  @Get()
  list(@CurrentUserId() userId: string, @Query() query: NotificationListQuery) {
    return this.notifications.list(userId, query.cursor);
  }

  /**
   * How many are unread: the 🔔 badge.
   */
  @Get('unread-count')
  unreadCount(@CurrentUserId() userId: string) {
    return this.notifications.unreadCount(userId);
  }

  /**
   * Mark all my notifications as read.
   */
  @Post('read')
  @HttpCode(204)
  markAllRead(@CurrentUserId() userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
