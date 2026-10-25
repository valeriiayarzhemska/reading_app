import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { ImportBookDto } from './dto/import-book.dto.js';
import { SearchBooksQuery } from './dto/search-books.query.js';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  /**
   * Search by title or author (Open Library, Google Books as fallback). Results are not saved.
   */
  @Get('search')
  search(@Query() query: SearchBooksQuery) {
    return this.books.search(query.q);
  }

  /**
   * The public book page: details, average rating, review count, and my shelf entry if I have one.
   * Declared after 'search': ':id' would otherwise take that path.
   */
  @Get(':id')
  page(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.books.page(userId, id);
  }

  /**
   * Create a book by hand (not found in search). Only its creator can see it.
   */
  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateBookDto) {
    return this.books.createManual(userId, dto);
  }

  /**
   * Save a search result to our database (or return it if already saved).
   */
  @Post('import')
  import(@Body() dto: ImportBookDto) {
    return this.books.importBook(dto.source, dto.externalId);
  }
}
