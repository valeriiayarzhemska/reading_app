import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ShelfStatus } from '@reading/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AddUserBookDto } from './dto/add-user-book.dto.js';
import type { UpdateUserBookDto } from './dto/update-user-book.dto.js';
import {
  datesForStatus,
  defaultProgressUnit,
  validateProgress,
} from './user-books.rules.js';

// Every response includes the book itself (title, cover...), not just bookId
const include = { book: true } satisfies Prisma.UserBookInclude;

@Injectable()
export class UserBooksService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, status?: ShelfStatus) {
    // status: undefined → Prisma ignores the filter and returns all statuses
    return this.prisma.userBook.findMany({
      where: { userId, status },
      include,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    // Filtering by userId too: someone else's book is "not found" for you
    const userBook = await this.prisma.userBook.findFirst({
      where: { id, userId },
      include,
    });

    if (!userBook) {
      throw new NotFoundException('Book not found on your shelf');
    }

    return userBook;
  }

  async add(userId: string, dto: AddUserBookDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // A duplicate (same book + format) fails on @@unique → 409 via the filter
    return this.prisma.userBook.create({
      data: {
        userId,
        bookId: dto.bookId,
        status: dto.status,
        format: dto.format,
        progressUnit: dto.progressUnit ?? defaultProgressUnit(dto.format),
        ...datesForStatus(dto.status, null),
      },
      include,
    });
  }

  async update(userId: string, id: string, dto: UpdateUserBookDto) {
    const current = await this.get(userId, id);

    if (dto.currentProgress !== undefined) {
      const error = validateProgress(
        dto.progressUnit ?? current.progressUnit,
        dto.currentProgress,
        current.book.pageCount,
      );

      if (error) {
        throw new BadRequestException(error);
      }
    }

    return this.prisma.userBook.update({
      where: { id },
      data: { ...dto, ...datesForStatus(dto.status, current) },
      include,
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.userBook.delete({ where: { id } });
  }
}
