import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BooksService } from './books.service.js';
import { ImportBookDto } from './dto/import-book.dto.js';
import { SearchBooksQuery } from './dto/search-books.query.js';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  // GET /books/search?q=...
  @Get('search')
  search(@Query() query: SearchBooksQuery) {
    return this.books.search(query.q);
  }

  // POST /books/import  { "googleBooksId": "..." }
  @Post('import')
  import(@Body() dto: ImportBookDto) {
    return this.books.importFromGoogle(dto.googleBooksId);
  }
}
