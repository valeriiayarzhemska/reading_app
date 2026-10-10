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
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
// DTOs must be regular (not `import type`) imports: ValidationPipe reads
// their classes at runtime. A type-only import would silently skip validation.
import { AddUserBookDto } from './dto/add-user-book.dto.js';
import { ListUserBooksQuery } from './dto/list-user-books.query.js';
import { UpdateUserBookDto } from './dto/update-user-book.dto.js';
import { UserBooksService } from './user-books.service.js';

@ApiTags('my shelf')
@Controller('me/books')
export class UserBooksController {
  constructor(private readonly userBooks: UserBooksService) {}

  /**
   * List my books, newest changes first. Optionally filter by status.
   */
  @Get()
  list(@CurrentUserId() userId: string, @Query() query: ListUserBooksQuery) {
    return this.userBooks.list(userId, query.status);
  }

  /**
   * Get one of my books with full book details. Someone else's book → 404.
   */
  @Get(':id')
  get(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.userBooks.get(userId, id);
  }

  /**
   * Add a book to my shelf. The same book + format twice → 409.
   */
  @Post()
  add(@CurrentUserId() userId: string, @Body() dto: AddUserBookDto) {
    return this.userBooks.add(userId, dto);
  }

  /**
   * Change status, format, progress or rating. Send only what changes.
   */
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserBookDto,
  ) {
    return this.userBooks.update(userId, id, dto);
  }

  /**
   * Remove a book from my shelf.
   */
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userBooks.remove(userId, id);
  }
}
