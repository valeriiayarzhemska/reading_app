import { Module } from '@nestjs/common';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { GoogleBooksClient } from './google-books.client.js';
import { OpenLibraryClient } from './open-library.client.js';

@Module({
  controllers: [BooksController],
  providers: [BooksService, OpenLibraryClient, GoogleBooksClient],
})
export class BooksModule {}
