import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  readingSpeed,
  sessionProgressError,
  ShelfStatus,
  type ReadingSpeed,
} from '@reading/shared';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  datesForStatus,
  validateProgress,
} from '../user-books/user-books.rules.js';
import type { CreateReadingSessionDto } from './dto/create-reading-session.dto.js';
import { sessionTimeError } from './reading-sessions.rules.js';

const include = { book: true } satisfies Prisma.UserBookInclude;

@Injectable()
export class ReadingSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pages per hour from all of the user's sessions; the math is in shared
  async speed(userId: string): Promise<ReadingSpeed> {
    const sessions = await this.prisma.readingSession.findMany({
      where: { userId },
      select: {
        userBookId: true,
        unit: true,
        progressFrom: true,
        progressTo: true,
        durationSec: true,
        // A nested select follows the relation (a JOIN) and loads only this
        userBook: { select: { book: { select: { pageCount: true } } } },
      },
    });

    return readingSpeed(
      sessions.map(({ userBook, ...session }) => ({
        ...session,
        pageCount: userBook.book.pageCount,
      })),
    );
  }

  // Idempotent: saving the same clientId again returns the first result and
  // changes nothing, so the app can safely retry after a lost response
  async save(userId: string, dto: CreateReadingSessionDto) {
    const existing = await this.findByClientId(userId, dto.clientId);

    if (existing) {
      return existing;
    }

    try {
      return await this.create(userId, dto);
    } catch (error) {
      // Two identical requests at the same moment: both passed the check
      // above, the unique clientId let only one insert through
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const saved = await this.findByClientId(userId, dto.clientId);

        if (saved) {
          return saved;
        }
      }

      throw error;
    }
  }

  private async findByClientId(userId: string, clientId: string) {
    const session = await this.prisma.readingSession.findUnique({
      where: { clientId },
      include: { userBook: { include } },
    });

    if (!session) {
      return null;
    }

    if (session.userId !== userId) {
      throw new ConflictException('This clientId is already used');
    }

    const { userBook, ...rest } = session;

    return { session: rest, userBook };
  }

  private create(userId: string, dto: CreateReadingSessionDto) {
    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);
    const timeError = sessionTimeError(startedAt, endedAt, dto.durationSec);

    if (timeError) {
      throw new BadRequestException(timeError);
    }

    // One transaction: never a saved session with un-updated progress
    return this.prisma.$transaction(async (tx) => {
      const userBook = await tx.userBook.findFirst({
        where: { id: dto.userBookId, userId },
        include,
      });

      if (!userBook) {
        throw new NotFoundException('Book not found on your shelf');
      }

      if (
        sessionProgressError(
          dto.unit,
          dto.progressFrom,
          dto.progressTo,
          userBook.book.pageCount,
        ) === 'beforeStart'
      ) {
        throw new BadRequestException(
          'progressTo cannot be less than progressFrom',
        );
      }

      const progressError = validateProgress(
        dto.unit,
        dto.progressTo,
        userBook.book.pageCount,
      );

      if (progressError) {
        throw new BadRequestException(progressError);
      }

      // Offline sessions can arrive out of order: an older one must not
      // move the progress back
      const latest = await tx.readingSession.findFirst({
        where: { userBookId: userBook.id },
        orderBy: { endedAt: 'desc' },
        select: { endedAt: true },
      });
      const isLatest = !latest || endedAt >= latest.endedAt;

      const session = await tx.readingSession.create({
        data: {
          clientId: dto.clientId,
          userId,
          userBookId: userBook.id,
          startedAt,
          endedAt,
          durationSec: dto.durationSec,
          unit: dto.unit,
          progressFrom: dto.progressFrom,
          progressTo: dto.progressTo,
        },
      });

      // Reading a "want to read" book means you've started it, at the
      // moment the session began
      const startsReading = userBook.status === ShelfStatus.WANT_TO_READ;

      const updated = await tx.userBook.update({
        where: { id: userBook.id },
        data: {
          ...(isLatest
            ? { currentProgress: dto.progressTo, progressUnit: dto.unit }
            : {}),
          ...(startsReading
            ? {
                status: ShelfStatus.READING,
                ...datesForStatus(ShelfStatus.READING, userBook, startedAt),
              }
            : {}),
        },
        include,
      });

      return { session, userBook: updated };
    });
  }
}
