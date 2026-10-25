import { Injectable } from '@nestjs/common';

import {
  NOTIFICATION_EVENT,
  NOTIFICATIONS_PAGE_SIZE,
  type NotificationItem,
  type NotificationType,
  type Page,
} from '@reading/shared';

import { ChatGateway } from '../clubs/chat.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Who gets it, who caused it, and what it's about
export interface NotificationEvent {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

const PREVIEW_LENGTH = 80;

function preview(text: string | undefined): string | null {
  return text ? text.slice(0, PREVIEW_LENGTH) : null;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  // Saves it, then tells the recipient's devices to refresh the 🔔 badge
  async notify(event: NotificationEvent): Promise<void> {
    // Liking your own post is not news
    if (event.userId === event.actorId) {
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId: event.userId,
        actorId: event.actorId,
        type: event.type,
        postId: event.postId ?? null,
        commentId: event.commentId ?? null,
      },
    });
    this.gateway.emitToUser(event.userId, NOTIFICATION_EVENT);
  }

  // Unlike / unfollow takes the notification back: no stale "bob liked
  // your post" after Bob changed his mind
  async withdraw(event: NotificationEvent): Promise<void> {
    const { count } = await this.prisma.notification.deleteMany({
      where: {
        userId: event.userId,
        actorId: event.actorId,
        type: event.type,
        postId: event.postId ?? null,
        commentId: event.commentId ?? null,
      },
    });

    if (count > 0) {
      this.gateway.emitToUser(event.userId, NOTIFICATION_EVENT);
    }
  }

  async list(userId: string, cursor?: string): Promise<Page<NotificationItem>> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: NOTIFICATIONS_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        type: true,
        createdAt: true,
        readAt: true,
        postId: true,
        actor: {
          select: { nickname: true, displayName: true, avatarUrl: true },
        },
        post: { select: { text: true } },
        comment: { select: { text: true } },
      },
    });

    const hasMore = rows.length > NOTIFICATIONS_PAGE_SIZE;
    const page = rows.slice(0, NOTIFICATIONS_PAGE_SIZE);

    return {
      items: page.map((row) => ({
        id: row.id,
        type: row.type,
        createdAt: row.createdAt.toISOString(),
        isRead: row.readAt !== null,
        actor: row.actor,
        postId: row.postId,
        // A comment's own text for comments and comment likes, else the post's
        preview: preview(row.comment?.text ?? row.post?.text),
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { count };
  }

  // Opening the list reads them all
  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
