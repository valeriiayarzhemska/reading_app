import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FOLLOWS_PAGE_SIZE,
  normalizeNickname,
  NotificationType,
  type FollowList,
  type Page,
  type ReaderSummary,
} from '@reading/shared';

import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const READER_SELECT = {
  id: true,
  nickname: true,
  displayName: true,
  avatarUrl: true,
} as const;

type Reader = Pick<
  ReaderSummary,
  'id' | 'nickname' | 'displayName' | 'avatarUrl'
>;

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async follow(viewerId: string, nickname: string): Promise<void> {
    const targetId = await this.userId(nickname);

    if (targetId === viewerId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // skipDuplicates: following again is a no-op, not a unique-key error
    const { count } = await this.prisma.follow.createMany({
      data: [{ followerId: viewerId, followingId: targetId }],
      skipDuplicates: true,
    });

    // Only a new follow is news: count is 0 when it already existed
    if (count > 0) {
      await this.notifications.notify(this.followEvent(viewerId, targetId));
    }
  }

  async unfollow(viewerId: string, nickname: string): Promise<void> {
    const targetId = await this.userId(nickname);

    // deleteMany doesn't throw when there's nothing to delete
    const { count } = await this.prisma.follow.deleteMany({
      where: { followerId: viewerId, followingId: targetId },
    });

    if (count > 0) {
      await this.notifications.withdraw(this.followEvent(viewerId, targetId));
    }
  }

  private followEvent(followerId: string, targetId: string) {
    return {
      userId: targetId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
    };
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

    return {
      items: await this.summaries(viewerId, readers),
      nextCursor: hasMore ? readers[readers.length - 1].id : null,
    };
  }

  // Adds the viewer's side to each reader. Whom the viewer follows comes in
  // one query for the whole list instead of one per row. Also used by the
  // reader search in UsersModule.
  async summaries(
    viewerId: string,
    readers: Reader[],
  ): Promise<ReaderSummary[]> {
    const rows = await this.prisma.follow.findMany({
      where: {
        followerId: viewerId,
        followingId: { in: readers.map((reader) => reader.id) },
      },
      select: { followingId: true },
    });
    const followed = new Set(rows.map((row) => row.followingId));

    return readers.map((reader) => ({
      ...reader,
      isFollowing: followed.has(reader.id),
      isMe: reader.id === viewerId,
    }));
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
