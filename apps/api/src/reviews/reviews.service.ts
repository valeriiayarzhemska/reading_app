import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  REVIEWS_PAGE_SIZE,
  ShelfStatus,
  type BookReview,
  type OwnReview,
  type Page,
} from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import type { SaveReviewDto } from './dto/save-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    userId: string,
    userBookId: string,
    dto: SaveReviewDto,
  ): Promise<OwnReview> {
    const entry = await this.prisma.userBook.findFirst({
      where: { id: userBookId, userId },
      select: { status: true },
    });

    if (!entry) {
      throw new NotFoundException('Book not found on your shelf');
    }

    if (entry.status !== ShelfStatus.READ) {
      throw new BadRequestException(
        'Only books on the Read shelf can be reviewed',
      );
    }

    // upsert: the first save creates the review, later ones edit it
    const review = await this.prisma.review.upsert({
      where: { userBookId },
      create: { userBookId, text: dto.text, hasSpoilers: dto.hasSpoilers },
      update: { text: dto.text, hasSpoilers: dto.hasSpoilers },
      select: { text: true, hasSpoilers: true, updatedAt: true },
    });

    return { ...review, updatedAt: review.updatedAt.toISOString() };
  }

  async remove(userId: string, userBookId: string): Promise<void> {
    // The relation filter is the ownership check: someone else's review
    // matches nothing and nothing is deleted
    await this.prisma.review.deleteMany({
      where: { userBookId, userBook: { userId } },
    });
  }

  // Newest first. A review stays in its place when edited: ordered by when
  // it was written, not changed.
  async list(
    viewerId: string,
    bookId: string,
    cursor?: string,
  ): Promise<Page<BookReview>> {
    const rows = await this.prisma.review.findMany({
      // Through the relation: reviews belong to shelf entries, not books
      where: { userBook: { bookId } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: REVIEWS_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        text: true,
        hasSpoilers: true,
        createdAt: true,
        userBook: {
          select: {
            rating: true,
            user: {
              select: {
                id: true,
                nickname: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const hasMore = rows.length > REVIEWS_PAGE_SIZE;
    const page = rows.slice(0, REVIEWS_PAGE_SIZE);

    return {
      items: page.map(({ userBook, createdAt, ...review }) => {
        const { id, ...author } = userBook.user;

        return {
          ...review,
          rating: userBook.rating,
          createdAt: createdAt.toISOString(),
          author,
          isMine: id === viewerId,
        };
      }),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }
}
