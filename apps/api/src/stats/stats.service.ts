import { Injectable } from '@nestjs/common';

import type { CalendarMonth } from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildCalendar,
  monthRange,
  type FinishedRow,
  type SessionDayRow,
} from './calendar.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async calendar(userId: string, month: string): Promise<CalendarMonth> {
    const { timezone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const [start, end] = monthRange(month);

    // Timestamps are stored as UTC without a zone. Reading them:
    //   "startedAt" AT TIME ZONE 'UTC'   → "this moment is UTC"
    //   … AT TIME ZONE ${timezone}       → the same moment on the reader's clock
    //   …::date                          → just the local calendar day
    // The month limits go the other way: local midnight → a UTC moment, so
    // the WHERE compares raw columns and can use the (userId, startedAt) index.
    // SUM returns bigint, which arrives in JS as BigInt; ::int keeps it a number.
    const sessions = await this.prisma.$queryRaw<SessionDayRow[]>`
      SELECT
        to_char((s."startedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day,
        s."userBookId" AS "userBookId",
        SUM(s."durationSec")::int AS seconds,
        SUM(
          CASE
            WHEN s.unit = 'PAGES' THEN s."progressTo" - s."progressFrom"
            WHEN s.unit = 'PERCENT' AND b."pageCount" IS NOT NULL
              THEN ROUND((s."progressTo" - s."progressFrom") * b."pageCount" / 100.0)
            ELSE 0
          END
        )::int AS pages
      FROM "ReadingSession" s
      JOIN "UserBook" ub ON ub.id = s."userBookId"
      JOIN "Book" b ON b.id = ub."bookId"
      WHERE s."userId" = ${userId}
        AND s."startedAt" >= (${start}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC'
        AND s."startedAt" <  (${end}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC'
      GROUP BY 1, 2
      ORDER BY 1, MIN(s."startedAt")
    `;

    const finished = await this.prisma.$queryRaw<FinishedRow[]>`
      SELECT
        to_char((ub."finishedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day,
        ub.id AS "userBookId"
      FROM "UserBook" ub
      WHERE ub."userId" = ${userId}
        AND ub."finishedAt" >= (${start}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC'
        AND ub."finishedAt" <  (${end}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC'
      ORDER BY ub."finishedAt"
    `;

    const ids = [
      ...new Set([...sessions, ...finished].map((row) => row.userBookId)),
    ];
    const entries = await this.prisma.userBook.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, book: { select: { title: true, coverUrl: true } } },
    });

    return buildCalendar(
      month,
      timezone,
      sessions,
      finished,
      new Map(entries.map((entry) => [entry.id, entry.book])),
    );
  }
}
