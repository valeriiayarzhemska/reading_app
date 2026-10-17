import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto.js';
import { ReadingSessionsService } from './reading-sessions.service.js';

@ApiTags('reading sessions')
@Controller('me/sessions')
export class ReadingSessionsController {
  constructor(private readonly sessions: ReadingSessionsService) {}

  /**
   * My reading speed in pages per hour: overall and per book (once a book has
   * enough sessions). The app uses it to estimate the time left.
   */
  @Get('speed')
  speed(@CurrentUserId() userId: string) {
    return this.sessions.speed(userId);
  }

  /**
   * Save a finished session and update the book's progress. Sending the same
   * clientId again returns the saved session without changing anything.
   */
  @Post()
  save(@CurrentUserId() userId: string, @Body() dto: CreateReadingSessionDto) {
    return this.sessions.save(userId, dto);
  }
}
