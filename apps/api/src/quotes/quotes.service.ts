import { Injectable, NotFoundException } from '@nestjs/common';

import type { BookQuote, PostItem } from '@reading/shared';

import { PostsService } from '../posts/posts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateQuoteDto } from './dto/create-quote.dto.js';

const QUOTE_SELECT = {
  id: true,
  text: true,
  page: true,
  createdAt: true,
} as const;

function toBookQuote(row: {
  id: string;
  text: string;
  page: number | null;
  createdAt: Date;
}): BookQuote {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
  ) {}

  // Newest first. A handful per book: no paging.
  async list(userId: string, userBookId: string): Promise<BookQuote[]> {
    await this.findOwnEntry(userId, userBookId);

    const rows = await this.prisma.quote.findMany({
      where: { userBookId },
      orderBy: { createdAt: 'desc' },
      select: QUOTE_SELECT,
    });

    return rows.map(toBookQuote);
  }

  async create(
    userId: string,
    userBookId: string,
    dto: CreateQuoteDto,
  ): Promise<BookQuote> {
    await this.findOwnEntry(userId, userBookId);

    const row = await this.prisma.quote.create({
      data: { userBookId, text: dto.text, page: dto.page ?? null },
      select: QUOTE_SELECT,
    });

    return toBookQuote(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    // The relation filter is the ownership check
    const { count } = await this.prisma.quote.deleteMany({
      where: { id, userBook: { userId } },
    });

    if (count === 0) {
      throw new NotFoundException('Quote not found');
    }
  }

  async share(userId: string, id: string): Promise<PostItem> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, userBook: { userId } },
      select: {
        text: true,
        page: true,
        userBook: { select: { bookId: true } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return this.posts.shareQuote(userId, {
      bookId: quote.userBook.bookId,
      text: quote.text,
      page: quote.page,
    });
  }

  // Someone else's shelf entry is "not found" for you
  private async findOwnEntry(userId: string, userBookId: string) {
    const entry = await this.prisma.userBook.findFirst({
      where: { id: userBookId, userId },
      select: { id: true },
    });

    if (!entry) {
      throw new NotFoundException('Book not found on your shelf');
    }
  }
}
