import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { GoogleBooksClient } from './google-books.client.js';
import { OpenLibraryClient } from './open-library.client.js';

@Module({
  imports: [UploadsModule],
  controllers: [BooksController],
  providers: [BooksService, OpenLibraryClient, GoogleBooksClient],
})
export class BooksModule {}
