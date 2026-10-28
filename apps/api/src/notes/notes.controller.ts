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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { SaveNoteDto } from './dto/save-note.dto.js';
import { NotesService } from './notes.service.js';

@ApiTags('notes')
@Controller('me')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  /**
   * My private notes on one of my books, newest first.
   */
  @Get('books/:id/notes')
  list(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notes.list(userId, id);
  }

  /**
   * Add a note (text, optional page) to one of my books.
   */
  @Post('books/:id/notes')
  create(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveNoteDto,
  ) {
    return this.notes.create(userId, id, dto);
  }

  /**
   * Edit my note: its text and page (page null clears it).
   */
  @Patch('notes/:id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveNoteDto,
  ) {
    return this.notes.update(userId, id, dto);
  }

  @Delete('notes/:id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notes.remove(userId, id);
  }
}
