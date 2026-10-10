import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service.js';

// Google volume IDs are always 12 chars. Malformed IDs make Google answer
// 503 instead of 404, so we reject them before calling it.
const GOOGLE_VOLUME_ID = /^[A-Za-z0-9_-]{12}$/;

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  // GET /books/search?q=...
  @Get('search')
  search(@Query('q') q?: string) {
    // Temporary manual validation — replaced by DTOs on Day 4
    if (!q?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    return this.books.search(q.trim());
  }

  // POST /books/import  { "googleBooksId": "..." }
  @Post('import')
  import(@Body('googleBooksId') googleBooksId?: string) {
    if (!googleBooksId) {
      throw new BadRequestException('"googleBooksId" is required');
    }

    if (!GOOGLE_VOLUME_ID.test(googleBooksId)) {
      throw new BadRequestException('Invalid "googleBooksId"');
    }

    return this.books.importFromGoogle(googleBooksId);
  }
}
