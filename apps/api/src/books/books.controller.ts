import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service.js';
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
   * Save a search result to our database (or return it if already saved).
   */
  @Post('import')
  import(@Body() dto: ImportBookDto) {
    return this.books.importBook(dto.source, dto.externalId);
  }
}
