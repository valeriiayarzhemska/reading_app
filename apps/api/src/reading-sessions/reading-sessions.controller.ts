import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto.js';
import { ReadingSessionsService } from './reading-sessions.service.js';

@ApiTags('reading sessions')
@Controller('me/sessions')
export class ReadingSessionsController {
  constructor(private readonly sessions: ReadingSessionsService) {}

  /**
   * Save a finished session and update the book's progress. Sending the same
   * clientId again returns the saved session without changing anything.
   */
  @Post()
  save(@CurrentUserId() userId: string, @Body() dto: CreateReadingSessionDto) {
    return this.sessions.save(userId, dto);
  }
}
