import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { QuotesService } from './quotes.service.js';

@ApiTags('quotes')
@Controller('me')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  /**
   * My quotes from one of my books, newest first.
   */
  @Get('books/:id/quotes')
  list(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotes.list(userId, id);
  }

  /**
   * Save a quote (text, optional page) on one of my books.
   */
  @Post('books/:id/quotes')
  create(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotes.create(userId, id, dto);
  }

  @Delete('quotes/:id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotes.remove(userId, id);
  }

  /**
   * Share a quote to Shelves: creates a post with a quote card.
   */
  @Post('quotes/:id/share')
  share(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotes.share(userId, id);
  }
}
