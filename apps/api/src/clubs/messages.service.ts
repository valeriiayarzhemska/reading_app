import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import {
  MESSAGES_PAGE_SIZE,
  type ChatMessage,
  type Page,
  type SendMessagePayload,
} from '@reading/shared';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MESSAGE_SELECT = {
  id: true,
  clientId: true,
  clubId: true,
  text: true,
  createdAt: true,
  author: {
    select: { id: true, nickname: true, displayName: true, avatarUrl: true },
  },
} satisfies Prisma.MessageSelect;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

function toChatMessage(row: MessageRow): ChatMessage {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export interface ClubActivity {
  messagesToday: number;
  unreadCount: number;
}

// Used by both the REST controller (history) and the socket gateway (sending)
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Reading or writing a club's chat requires being a member
  async ensureMember(userId: string, clubId: string): Promise<void> {
    const member = await this.prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
      select: { userId: true },
    });

    if (!member) {
      throw new ForbiddenException('Join the club to see its chat');
    }
  }

  // Newest first: the app shows them bottom-up and asks for older pages
  // while scrolling up
  async history(
    userId: string,
    clubId: string,
    cursor?: string,
  ): Promise<Page<ChatMessage>> {
    await this.ensureMember(userId, clubId);

    const rows = await this.prisma.message.findMany({
      where: { clubId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MESSAGES_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: MESSAGE_SELECT,
    });

    const hasMore = rows.length > MESSAGES_PAGE_SIZE;
    const page = rows.slice(0, MESSAGES_PAGE_SIZE);

    return {
      items: page.map(toChatMessage),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async send(
    userId: string,
    payload: SendMessagePayload,
  ): Promise<ChatMessage> {
    await this.ensureMember(userId, payload.clubId);

    // A retry with the same clientId returns the message saved the first
    // time instead of creating a second one
    const row = await this.prisma.message.upsert({
      where: { clientId: payload.clientId },
      create: {
        clientId: payload.clientId,
        clubId: payload.clubId,
        authorId: userId,
        text: payload.text,
      },
      update: {},
      select: MESSAGE_SELECT,
    });

    // The same clientId from someone else (or for another club) is not a
    // retry of this send
    if (row.author.id !== userId || row.clubId !== payload.clubId) {
      throw new BadRequestException('clientId is already used');
    }

    return toChatMessage(row);
  }

  // Who should hear about a new message: every member but its author
  async otherMemberIds(clubId: string, authorId: string): Promise<string[]> {
    const members = await this.prisma.clubMember.findMany({
      where: { clubId, userId: { not: authorId } },
      select: { userId: true },
    });

    return members.map((member) => member.userId);
  }

  // Opening the chat reads everything up to now
  async markRead(userId: string, clubId: string): Promise<void> {
    await this.prisma.clubMember.updateMany({
      where: { clubId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  // Both numbers for many clubs in one query. Unread compares each message
  // with the viewer's own lastReadAt, a column of another table: that's a
  // JOIN, which Prisma's _count can't express.
  async activity(
    viewerId: string,
    clubIds: string[],
  ): Promise<Map<string, ClubActivity>> {
    if (clubIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<
      { clubId: string; messagesToday: number; unreadCount: number }[]
    >`
      SELECT
        m."clubId",
        COUNT(*) FILTER (
          WHERE m."createdAt" > now() - interval '24 hours'
        )::int AS "messagesToday",
        COUNT(*) FILTER (
          WHERE cm."lastReadAt" IS NOT NULL
            AND m."createdAt" > cm."lastReadAt"
            AND m."authorId" <> ${viewerId}
        )::int AS "unreadCount"
      FROM "Message" m
      LEFT JOIN "ClubMember" cm
        ON cm."clubId" = m."clubId" AND cm."userId" = ${viewerId}
      WHERE m."clubId" IN (${Prisma.join(clubIds)})
      GROUP BY m."clubId"
    `;

    return new Map(rows.map(({ clubId, ...counts }) => [clubId, counts]));
  }
}
