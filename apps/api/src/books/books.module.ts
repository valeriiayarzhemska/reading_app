import { Module } from '@nestjs/common';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { GoogleBooksClient } from './google-books.client.js';

@Module({
  controllers: [BooksController],
  providers: [BooksService, GoogleBooksClient],
})
export class BooksModule {}
