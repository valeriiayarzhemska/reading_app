import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FOLLOWS_PAGE_SIZE,
  normalizeNickname,
  type FollowList,
  type Page,
  type ReaderSummary,
} from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';

const READER_SELECT = {
  id: true,
  nickname: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(viewerId: string, nickname: string): Promise<void> {
    const targetId = await this.userId(nickname);

    if (targetId === viewerId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // skipDuplicates: following again is a no-op, not a unique-key error
    await this.prisma.follow.createMany({
      data: [{ followerId: viewerId, followingId: targetId }],
      skipDuplicates: true,
    });
  }

  async unfollow(viewerId: string, nickname: string): Promise<void> {
    const targetId = await this.userId(nickname);

    // deleteMany doesn't throw when there's nothing to delete
    await this.prisma.follow.deleteMany({
      where: { followerId: viewerId, followingId: targetId },
    });
  }

  // Newest follows first, FOLLOWS_PAGE_SIZE at a time
  async list(
    viewerId: string,
    nickname: string,
    list: FollowList,
    cursor?: string,
  ): Promise<Page<ReaderSummary>> {
    const userId = await this.userId(nickname);
    const isFollowers = list === 'followers';

    // One extra row tells whether there is a next page
    const rows = await this.prisma.follow.findMany({
      where: isFollowers ? { followingId: userId } : { followerId: userId },
      // The id breaks ties between follows made in the same millisecond
      orderBy: [
        { createdAt: 'desc' },
        isFollowers ? { followerId: 'asc' } : { followingId: 'asc' },
      ],
      take: FOLLOWS_PAGE_SIZE + 1,
      // Start at the cursor row and skip it: it was the previous page's last
      ...(cursor && {
        cursor: {
          followerId_followingId: isFollowers
            ? { followerId: cursor, followingId: userId }
            : { followerId: userId, followingId: cursor },
        },
        skip: 1,
      }),
      select: {
        follower: { select: READER_SELECT },
        following: { select: READER_SELECT },
      },
    });

    const hasMore = rows.length > FOLLOWS_PAGE_SIZE;
    const readers = rows
      .slice(0, FOLLOWS_PAGE_SIZE)
      .map((row) => (isFollowers ? row.follower : row.following));
    const followed = await this.followedAmong(
      viewerId,
      readers.map((reader) => reader.id),
    );

    return {
      items: readers.map((reader) => ({
        ...reader,
        isFollowing: followed.has(reader.id),
        isMe: reader.id === viewerId,
      })),
      nextCursor: hasMore ? readers[readers.length - 1].id : null,
    };
  }

  // Which of these readers the viewer follows, in one query for the whole
  // page instead of one per row
  private async followedAmong(
    viewerId: string,
    ids: string[],
  ): Promise<Set<string>> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: ids } },
      select: { followingId: true },
    });

    return new Set(rows.map((row) => row.followingId));
  }

  private async userId(nickname: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: normalizeNickname(nickname) },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('No reader with this nickname');
    }

    return user.id;
  }
}
