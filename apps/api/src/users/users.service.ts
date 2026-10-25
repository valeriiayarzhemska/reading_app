import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  nicknameError,
  normalizeNickname,
  progressFraction,
  ShelfStatus,
  type Me,
  type NicknameAvailability,
  type PublicProfile,
} from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import { StatsService } from '../stats/stats.service.js';
import type { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ME_SELECT, toMe } from './me.js';

const RECENTLY_READ_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
  ) {}

  async publicProfile(
    viewerId: string,
    nickname: string,
  ): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: normalizeNickname(nickname) },
      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        links: true,
      },
    });

    // Also for an onboarding user without a real nickname yet: same 404
    if (!user) {
      throw new NotFoundException('No reader with this nickname');
    }

    const [summary, reading, recent] = await Promise.all([
      this.stats.summary(user.id),
      this.prisma.userBook.findFirst({
        where: { userId: user.id, status: ShelfStatus.READING },
        orderBy: { updatedAt: 'desc' },
        include: { book: true },
      }),
      this.prisma.userBook.findMany({
        where: {
          userId: user.id,
          status: ShelfStatus.READ,
          finishedAt: { not: null },
        },
        orderBy: { finishedAt: 'desc' },
        take: RECENTLY_READ_LIMIT,
        select: {
          id: true,
          rating: true,
          finishedAt: true,
          finishedPrecision: true,
          book: { select: { title: true, coverUrl: true } },
        },
      }),
    ]);

    return {
      ...user,
      isMe: user.id === viewerId,
      currentlyReading: reading && {
        userBookId: reading.id,
        title: reading.book.title,
        author: reading.book.authors.join(', '),
        coverUrl: reading.book.coverUrl,
        fraction: progressFraction(reading),
        startedAt: reading.startedAt?.toISOString() ?? null,
      },
      stats: {
        year: summary.year.year,
        booksThisYear: summary.year.booksRead,
        booksRead: summary.total.booksRead,
        averageRating: summary.total.averageRating,
      },
      recentlyRead: recent.map((entry) => ({
        userBookId: entry.id,
        title: entry.book.title,
        coverUrl: entry.book.coverUrl,
        rating: entry.rating,
        // Filtered on not null above; Prisma's type can't know that
        finishedAt: (entry.finishedAt ?? new Date(0)).toISOString(),
        finishedPrecision: entry.finishedPrecision,
      })),
    };
  }

  async nicknameAvailability(
    userId: string,
    nickname: string,
  ): Promise<NicknameAvailability> {
    const error = nicknameError(nickname);

    if (error) {
      return { available: false, error };
    }

    const owner = await this.prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    // Your own current nickname counts as available
    return { available: !owner || owner.id === userId, error: null };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Me> {
    if (dto.nickname !== undefined) {
      const { available } = await this.nicknameAvailability(
        userId,
        dto.nickname,
      );

      if (!available) {
        throw new ConflictException('This nickname is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        nickname: dto.nickname,
        // "No bio" has one representation: null, never ""
        bio: dto.bio === undefined ? undefined : dto.bio || null,
        links: dto.links,
        timezone: dto.timezone,
      },
      select: ME_SELECT,
    });

    return toMe(user);
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<Me> {
    const { available } = await this.nicknameAvailability(userId, dto.nickname);

    if (!available) {
      throw new ConflictException('This nickname is already taken');
    }

    // Two people can still pass the check above at the same moment: then the
    // unique index rejects the second update (P2002 → 409 via the filter)
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        nickname: dto.nickname,
        onboardedAt: new Date(),
      },
      select: ME_SELECT,
    });

    return toMe(user);
  }
}
