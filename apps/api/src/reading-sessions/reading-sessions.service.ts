import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  readingSpeed,
  sessionPages,
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
import type { UpdateReadingSessionDto } from './dto/update-reading-session.dto.js';
import { sessionTimeError } from './reading-sessions.rules.js';

const include = { book: true } satisfies Prisma.UserBookInclude;

// What the day sheet needs: the session (without internal fields) + its book
const daySessionShape = {
  omit: { clientId: true, userId: true },
  include: {
    userBook: {
      select: {
        book: { select: { title: true, coverUrl: true, pageCount: true } },
      },
    },
  },
} satisfies Prisma.ReadingSessionDefaultArgs;

type DaySessionRow = Prisma.ReadingSessionGetPayload<typeof daySessionShape>;

function toDaySession({ userBook, ...session }: DaySessionRow) {
  const { pageCount, ...book } = userBook.book;
  const pages = sessionPages(session, pageCount);

  return {
    ...session,
    pages: pages === null ? null : Math.round(pages),
    book,
  };
}

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

  async listDay(userId: string, date: string) {
    const { timezone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    // Raw SQL only for what Prisma can't do: the UTC moments where this local
    // day starts and ends (Postgres knows the timezone rules, incl. DST)
    const [day] = await this.prisma.$queryRaw<{ start: Date; end: Date }[]>`
      SELECT
        (${date}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC' AS "start",
        ((${date}::date + 1)::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC' AS "end"
    `;

    // The rest is a normal Prisma query
    const sessions = await this.prisma.readingSession.findMany({
      where: { userId, startedAt: { gte: day.start, lt: day.end } },
      orderBy: { startedAt: 'asc' },
      ...daySessionShape,
    });

    return sessions.map(toDaySession);
  }

  // Fixes a record for the calendar and stats. The book's current progress
  // is deliberately left alone: correcting yesterday must not move the bookmark.
  async update(userId: string, id: string, dto: UpdateReadingSessionDto) {
    const session = await this.prisma.readingSession.findFirst({
      where: { id, userId },
      include: {
        userBook: { select: { book: { select: { pageCount: true } } } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const progressTo = dto.progressTo ?? session.progressTo;
    const { pageCount } = session.userBook.book;

    if (
      sessionProgressError(
        session.unit,
        session.progressFrom,
        progressTo,
        pageCount,
      ) === 'beforeStart'
    ) {
      throw new BadRequestException(
        'progressTo cannot be less than progressFrom',
      );
    }

    const progressError = validateProgress(session.unit, progressTo, pageCount);

    if (progressError) {
      throw new BadRequestException(progressError);
    }

    // Longer than the span between start and end: move the start earlier,
    // so "duration ≤ endedAt - startedAt" keeps holding
    const durationSec = dto.durationSec ?? session.durationSec;
    const spanSec =
      (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
    const startedAt =
      durationSec > spanSec
        ? new Date(session.endedAt.getTime() - durationSec * 1000)
        : session.startedAt;

    const updated = await this.prisma.readingSession.update({
      where: { id },
      data: { durationSec, progressTo, startedAt },
      ...daySessionShape,
    });

    return toDaySession(updated);
  }

  async remove(userId: string, id: string) {
    // userId in the filter is the ownership check: someone else's session
    // matches 0 rows, the same answer as one that doesn't exist
    const { count } = await this.prisma.readingSession.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      throw new NotFoundException('Session not found');
    }
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
