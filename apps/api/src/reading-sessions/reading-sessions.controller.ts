import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto.js';
import { ListSessionsQuery } from './dto/list-sessions.query.js';
import { UpdateReadingSessionDto } from './dto/update-reading-session.dto.js';
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
   * My sessions of one calendar day (in my timezone), oldest first.
   */
  @Get()
  listDay(@CurrentUserId() userId: string, @Query() query: ListSessionsQuery) {
    return this.sessions.listDay(userId, query.date);
  }

  /**
   * Fix a session's minutes or end position. Only stats and the calendar
   * change; the book's current progress stays as it is.
   */
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReadingSessionDto,
  ) {
    return this.sessions.update(userId, id, dto);
  }

  /**
   * Delete a session. The book's current progress stays as it is.
   */
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sessions.remove(userId, id);
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
