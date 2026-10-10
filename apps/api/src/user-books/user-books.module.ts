import { Module } from '@nestjs/common';
import { UserBooksController } from './user-books.controller.js';
import { UserBooksService } from './user-books.service.js';

@Module({
  controllers: [UserBooksController],
  providers: [UserBooksService],
})
export class UserBooksModule {}
