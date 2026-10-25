import { Injectable, NotFoundException } from '@nestjs/common';

import type { ClubDetail, ClubSummary } from '@reading/shared';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateClubDto } from './dto/create-club.dto.js';

const ALL_CLUBS_LIMIT = 50;

// What a list row needs. A function: "am I a member" depends on the viewer.
function summarySelect(viewerId: string) {
  return {
    id: true,
    name: true,
    color: true,
    book: {
      select: {
        id: true,
        title: true,
        authors: true,
        coverUrl: true,
        pageCount: true,
      },
    },
    host: { select: { nickname: true, displayName: true, avatarUrl: true } },
    _count: { select: { members: true } },
    // At most one row, the viewer's own membership: isMember without a
    // second query per club
    members: { where: { userId: viewerId }, select: { userId: true } },
  } satisfies Prisma.ClubSelect;
}

type SummaryRow = Prisma.ClubGetPayload<{
  select: ReturnType<typeof summarySelect>;
}>;

function toSummary({ _count, members, ...club }: SummaryRow): ClubSummary {
  return {
    ...club,
    host: { nickname: club.host.nickname, avatarUrl: club.host.avatarUrl },
    membersCount: _count.members,
    isMember: members.length > 0,
  };
}

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async mine(viewerId: string): Promise<ClubSummary[]> {
    const rows = await this.prisma.club.findMany({
      where: { members: { some: { userId: viewerId } } },
      orderBy: { createdAt: 'desc' },
      select: summarySelect(viewerId),
    });

    return rows.map(toSummary);
  }

  // Biggest first; optionally filtered by name, host or book
  async all(viewerId: string, query?: string): Promise<ClubSummary[]> {
    const contains = { contains: query, mode: 'insensitive' } as const;
    const rows = await this.prisma.club.findMany({
      where: query
        ? {
            OR: [
              { name: contains },
              { host: { nickname: contains } },
              { book: { title: contains } },
            ],
          }
        : undefined,
      // Sorted by how many related rows each club has
      orderBy: [{ members: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: ALL_CLUBS_LIMIT,
      select: summarySelect(viewerId),
    });

    return rows.map(toSummary);
  }

  async detail(viewerId: string, id: string): Promise<ClubDetail> {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: {
        ...summarySelect(viewerId),
        description: true,
        hostId: true,
        createdAt: true,
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const { description, hostId, createdAt, ...row } = club;

    return {
      ...toSummary(row),
      host: club.host,
      description,
      isHost: hostId === viewerId,
      createdAt: createdAt.toISOString(),
    };
  }

  async create(userId: string, dto: CreateClubDto): Promise<ClubDetail> {
    // The host is the first member, in the same nested write
    const { id } = await this.prisma.club.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        color: dto.color,
        hostId: userId,
        members: { create: { userId } },
      },
      select: { id: true },
    });

    return this.detail(userId, id);
  }

  async join(userId: string, id: string): Promise<void> {
    await this.findExisting(id);
    // Joining again changes nothing
    await this.prisma.clubMember.createMany({
      data: [{ clubId: id, userId }],
      skipDuplicates: true,
    });
  }

  // Host only. No UI yet (About the room, CLB-3).
  async setBook(
    userId: string,
    id: string,
    bookId: string | null,
  ): Promise<ClubDetail> {
    const club = await this.prisma.club.findFirst({
      where: { id, hostId: userId },
      select: { id: true },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (bookId) {
      const book = await this.prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true },
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }
    }

    await this.prisma.club.update({ where: { id }, data: { bookId } });

    return this.detail(userId, id);
  }

  private async findExisting(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }
  }
}
