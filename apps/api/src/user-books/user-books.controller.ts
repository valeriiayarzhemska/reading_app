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
  Query,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
// DTOs must be regular (not `import type`) imports: ValidationPipe reads
// their classes at runtime. A type-only import would silently skip validation.
import { AddUserBookDto } from './dto/add-user-book.dto.js';
import { ListUserBooksQuery } from './dto/list-user-books.query.js';
import { UpdateUserBookDto } from './dto/update-user-book.dto.js';
import { UserBooksService } from './user-books.service.js';

@Controller('me/books')
export class UserBooksController {
  constructor(private readonly userBooks: UserBooksService) {}

  // GET /me/books?status=READING
  @Get()
  list(@CurrentUserId() userId: string, @Query() query: ListUserBooksQuery) {
    return this.userBooks.list(userId, query.status);
  }

  // GET /me/books/:id
  @Get(':id')
  get(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.userBooks.get(userId, id);
  }

  // POST /me/books  { bookId, status, format, progressUnit? }
  @Post()
  add(@CurrentUserId() userId: string, @Body() dto: AddUserBookDto) {
    return this.userBooks.add(userId, dto);
  }

  // PATCH /me/books/:id  { status?, format?, progressUnit?, currentProgress?, rating? }
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserBookDto,
  ) {
    return this.userBooks.update(userId, id, dto);
  }

  // DELETE /me/books/:id → 204 No Content
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userBooks.remove(userId, id);
  }
}
