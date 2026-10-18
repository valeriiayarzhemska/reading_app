import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ShelfStatus,
  type CalendarMonth,
  type CalendarYear,
  type ReadingGoal,
  type StatsSummary,
} from '@reading/shared';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildCalendar,
  monthRange,
  yearIn,
  type FinishedRow,
  type SessionDayRow,
} from './calendar.js';

// Pages one session covers, as a reusable SQL fragment: percent sessions are
// converted with the book's page count, audiobook minutes count as 0.
// Expects the session as `s` and the book as `b` in the query using it.
const SESSION_PAGES = Prisma.sql`
  CASE
    WHEN s.unit = 'PAGES' THEN s."progressTo" - s."progressFrom"
    WHEN s.unit = 'PERCENT' AND b."pageCount" IS NOT NULL
      THEN ROUND((s."progressTo" - s."progressFrom") * b."pageCount" / 100.0)
    ELSE 0
  END
`;

// Local midnight of a date in the reader's zone, as the UTC moment it is.
// Timestamps are stored as UTC without a zone, so this is what to compare
// raw columns with (and it lets Postgres use the indexes).
const localMidnightUtc = (date: string, timezone: string) =>
  Prisma.sql`(${date}::timestamp AT TIME ZONE ${timezone}) AT TIME ZONE 'UTC'`;

const GOAL_YEAR_MIN = 2000;
const GOAL_YEAR_MAX = 2100;

interface TotalsRow {
  totalSeconds: number;
  totalPages: number;
  yearSeconds: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async timezoneOf(userId: string) {
    const { timezone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    return timezone;
  }

  async calendar(userId: string, month: string): Promise<CalendarMonth> {
    const timezone = await this.timezoneOf(userId);
    const [start, end] = monthRange(month);

    // Reading a stored timestamp on the reader's clock:
    //   "startedAt" AT TIME ZONE 'UTC'   → "this moment is UTC"
    //   … AT TIME ZONE ${timezone}       → the same moment on the reader's clock
    //   …::date                          → just the local calendar day
    // SUM returns bigint, which arrives in JS as BigInt; ::int keeps it a number.
    const sessions = await this.prisma.$queryRaw<SessionDayRow[]>`
      SELECT
        to_char((s."startedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day,
        s."userBookId" AS "userBookId",
        SUM(s."durationSec")::int AS seconds,
        SUM(${SESSION_PAGES})::int AS pages
      FROM "ReadingSession" s
      JOIN "UserBook" ub ON ub.id = s."userBookId"
      JOIN "Book" b ON b.id = ub."bookId"
      WHERE s."userId" = ${userId}
        AND s."startedAt" >= ${localMidnightUtc(start, timezone)}
        AND s."startedAt" <  ${localMidnightUtc(end, timezone)}
      GROUP BY 1, 2
      ORDER BY 1, MIN(s."startedAt")
    `;

    const finished = await this.prisma.$queryRaw<FinishedRow[]>`
      SELECT
        to_char((ub."finishedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day,
        ub.id AS "userBookId"
      FROM "UserBook" ub
      WHERE ub."userId" = ${userId}
        AND ub."finishedAt" >= ${localMidnightUtc(start, timezone)}
        AND ub."finishedAt" <  ${localMidnightUtc(end, timezone)}
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

  // The heatmap: only minutes per local day, no books, so a whole year is
  // at most 366 small numbers
  async calendarYear(userId: string, year: number): Promise<CalendarYear> {
    const timezone = await this.timezoneOf(userId);
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`;

    const days = await this.prisma.$queryRaw<
      { day: string; minutes: number }[]
    >`
      SELECT
        to_char((s."startedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day,
        ROUND(SUM(s."durationSec") / 60.0)::int AS minutes
      FROM "ReadingSession" s
      WHERE s."userId" = ${userId}
        AND s."startedAt" >= ${localMidnightUtc(start, timezone)}
        AND s."startedAt" <  ${localMidnightUtc(end, timezone)}
      GROUP BY 1
    `;

    const [{ booksFinished }] = await this.prisma.$queryRaw<
      { booksFinished: number }[]
    >`
      SELECT COUNT(*)::int AS "booksFinished"
      FROM "UserBook" ub
      WHERE ub."userId" = ${userId}
        AND ub."finishedAt" >= ${localMidnightUtc(start, timezone)}
        AND ub."finishedAt" <  ${localMidnightUtc(end, timezone)}
    `;

    return {
      year,
      timezone,
      minutesByDay: Object.fromEntries(
        days.map(({ day, minutes }) => [day, minutes]),
      ),
      summary: {
        booksFinished,
        minutes: days.reduce((sum, day) => sum + day.minutes, 0),
      },
    };
  }

  async summary(userId: string): Promise<StatsSummary> {
    const timezone = await this.timezoneOf(userId);
    const year = yearIn(timezone);
    const yearStart = `${year}-01-01`;
    const nextYearStart = `${year + 1}-01-01`;

    // One pass over the sessions for both totals: FILTER (WHERE …) makes an
    // aggregate count only the rows that match, here "started this year"
    const [totals] = await this.prisma.$queryRaw<TotalsRow[]>`
      SELECT
        COALESCE(SUM(s."durationSec"), 0)::int AS "totalSeconds",
        COALESCE(SUM(${SESSION_PAGES}), 0)::int AS "totalPages",
        COALESCE(SUM(s."durationSec") FILTER (
          WHERE s."startedAt" >= ${localMidnightUtc(yearStart, timezone)}
            AND s."startedAt" <  ${localMidnightUtc(nextYearStart, timezone)}
        ), 0)::int AS "yearSeconds"
      FROM "ReadingSession" s
      JOIN "UserBook" ub ON ub.id = s."userBookId"
      JOIN "Book" b ON b.id = ub."bookId"
      WHERE s."userId" = ${userId}
    `;

    const [{ start, end }] = await this.prisma.$queryRaw<
      { start: Date; end: Date }[]
    >`
      SELECT ${localMidnightUtc(yearStart, timezone)} AS "start",
             ${localMidnightUtc(nextYearStart, timezone)} AS "end"
    `;

    // The rest are ordinary Prisma queries, run in parallel
    const [booksRead, booksThisYear, rating, goal] = await Promise.all([
      this.prisma.userBook.count({
        where: { userId, status: ShelfStatus.READ },
      }),
      this.prisma.userBook.count({
        where: { userId, finishedAt: { gte: start, lt: end } },
      }),
      this.prisma.userBook.aggregate({
        where: { userId, rating: { not: null } },
        _avg: { rating: true },
      }),
      this.prisma.readingGoal.findUnique({
        where: { userId_year: { userId, year } },
        select: { year: true, target: true },
      }),
    ]);

    const averageRating = rating._avg.rating;

    return {
      timezone,
      total: {
        minutes: Math.round(totals.totalSeconds / 60),
        pages: totals.totalPages,
        booksRead,
        averageRating:
          averageRating === null ? null : Math.round(averageRating * 10) / 10,
      },
      year: {
        year,
        booksRead: booksThisYear,
        minutes: Math.round(totals.yearSeconds / 60),
      },
      goal,
    };
  }

  // Create or change the goal: upsert finds the row by the unique
  // (userId, year) pair, updates it if it exists, creates it otherwise
  setGoal(userId: string, year: number, target: number): Promise<ReadingGoal> {
    if (year < GOAL_YEAR_MIN || year > GOAL_YEAR_MAX) {
      throw new BadRequestException(
        `year must be between ${GOAL_YEAR_MIN} and ${GOAL_YEAR_MAX}`,
      );
    }

    return this.prisma.readingGoal.upsert({
      where: { userId_year: { userId, year } },
      create: { userId, year, target },
      update: { target },
      select: { year: true, target: true },
    });
  }

  async deleteGoal(userId: string, year: number) {
    const { count } = await this.prisma.readingGoal.deleteMany({
      where: { userId, year },
    });

    if (count === 0) {
      throw new NotFoundException('No goal for this year');
    }
  }
}
