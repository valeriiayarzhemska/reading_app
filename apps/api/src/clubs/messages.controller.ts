import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { MessageListQuery } from './dto/message-list.query.js';
import { MessagesService } from './messages.service.js';

// History over HTTP; new messages travel over the socket (ChatGateway)
@ApiTags('clubs')
@Controller('clubs/:id')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /**
   * A club's messages, newest first, 30 at a time. Pass nextCursor as ?cursor= for older ones. Members only.
   */
  @Get('messages')
  history(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MessageListQuery,
  ) {
    return this.messages.history(userId, id, query.cursor);
  }

  /**
   * Mark everything in the club's chat as read (clears its unread dot).
   */
  @Post('read')
  @HttpCode(204)
  markRead(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messages.markRead(userId, id);
  }
}
