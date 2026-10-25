import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  COLLAGE_SIZE,
  type CollectionDetail,
  type CollectionSummary,
} from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import type { SaveCollectionDto } from './dto/save-collection.dto.js';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // A profile's collections. Also used by UsersService.
  async summaries(userId: string): Promise<CollectionSummary[]> {
    const rows = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        _count: { select: { books: true, likes: true } },
        // Only the collage's covers, not every book
        books: {
          orderBy: { position: 'asc' },
          take: COLLAGE_SIZE,
          select: { book: { select: { coverUrl: true } } },
        },
      },
    });

    return rows.map(({ _count, books, ...collection }) => ({
      ...collection,
      bookCount: _count.books,
      likesCount: _count.likes,
      covers: books.map(({ book }) => book.coverUrl),
    }));
  }

  async detail(viewerId: string, id: string): Promise<CollectionDetail> {
    const [collection, like] = await Promise.all([
      this.prisma.collection.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          userId: true,
          user: {
            select: { nickname: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { likes: true } },
          books: {
            orderBy: { position: 'asc' },
            select: {
              book: {
                select: {
                  id: true,
                  title: true,
                  authors: true,
                  coverUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.collectionLike.findUnique({
        where: { userId_collectionId: { userId: viewerId, collectionId: id } },
        select: { createdAt: true },
      }),
    ]);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      author: collection.user,
      isMine: collection.userId === viewerId,
      likesCount: collection._count.likes,
      isLiked: like !== null,
      books: collection.books.map(({ book: { id: bookId, ...book } }) => ({
        bookId,
        ...book,
      })),
    };
  }

  async create(userId: string, dto: SaveCollectionDto) {
    await this.checkOnShelf(userId, dto.bookIds);

    // A nested write: the collection and its books in one atomic operation
    const { id } = await this.prisma.collection.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description || null,
        books: { create: positions(dto.bookIds) },
      },
      select: { id: true },
    });

    return this.detail(userId, id);
  }

  async update(userId: string, id: string, dto: SaveCollectionDto) {
    await this.findOwn(userId, id);
    await this.checkOnShelf(userId, dto.bookIds);

    // deleteMany + create nested in one update: the list is replaced
    // atomically, and the unique positions never collide
    await this.prisma.collection.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description || null,
        books: { deleteMany: {}, create: positions(dto.bookIds) },
      },
    });

    return this.detail(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwn(userId, id);
    // Books and likes go with it (onDelete: Cascade)
    await this.prisma.collection.delete({ where: { id } });
  }

  async like(userId: string, id: string): Promise<void> {
    await this.findExisting(id);
    await this.prisma.collectionLike.createMany({
      data: [{ userId, collectionId: id }],
      skipDuplicates: true,
    });
  }

  async unlike(userId: string, id: string): Promise<void> {
    await this.prisma.collectionLike.deleteMany({
      where: { userId, collectionId: id },
    });
  }

  // Collections are made from your shelf. A book can be there in two
  // formats, so the shelf entries are counted per distinct book.
  private async checkOnShelf(userId: string, bookIds: string[]) {
    const onShelf = await this.prisma.userBook.findMany({
      where: { userId, bookId: { in: bookIds } },
      select: { bookId: true },
      distinct: ['bookId'],
    });

    if (onShelf.length !== bookIds.length) {
      throw new BadRequestException('Collections hold books from your shelf');
    }
  }

  // Someone else's collection is "not found" for editing
  private async findOwn(userId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }

  private async findExisting(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }
}

// The array's order becomes positions 1, 2, 3…
function positions(bookIds: string[]) {
  return bookIds.map((bookId, index) => ({ bookId, position: index + 1 }));
}
