import type { AchievementCode } from '@reading/shared';

import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

// A timestamp column (stored in UTC) as a date on the reader's own clock
function localDay(column: Prisma.Sql) {
  return Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE u.timezone)::date`;
}

type Rule = (prisma: PrismaService, userId: string) => Promise<boolean>;

// Each rule is one query answering "has this reader earned it?"
async function exists(prisma: PrismaService, query: Prisma.Sql) {
  const [row] = await prisma.$queryRaw<{ earned: boolean }[]>(query);

  return row?.earned ?? false;
}

function finishedAtLeast(count: number): Rule {
  return async (prisma, userId) =>
    (await prisma.userBook.count({
      where: { userId, status: 'READ', finishedAt: { not: null } },
    })) >= count;
}

export const ACHIEVEMENT_RULES: Record<AchievementCode, Rule> = {
  FIRST_BOOK: finishedAtLeast(1),

  TEN_BOOKS: finishedAtLeast(10),

  // A finished book with sessions, every one of them on its finish day
  IN_ONE_SITTING: (prisma, userId) =>
    exists(
      prisma,
      Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM "UserBook" ub
          JOIN "User" u ON u.id = ub."userId"
          WHERE ub."userId" = ${userId}
            AND ub.status = 'READ'
            AND ub."finishedPrecision" = 'DAY'
            AND ub."finishedAt" IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM "ReadingSession" s WHERE s."userBookId" = ub.id
            )
            AND NOT EXISTS (
              SELECT 1 FROM "ReadingSession" s
              WHERE s."userBookId" = ub.id
                AND ${localDay(Prisma.sql`s."startedAt"`)}
                  <> ${localDay(Prisma.sql`ub."finishedAt"`)}
            )
        ) AS earned
      `,
    ),

  // HAVING filters groups: the days whose sessions add up to 3+ hours
  MARATHON: (prisma, userId) =>
    exists(
      prisma,
      Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM "ReadingSession" s
          JOIN "User" u ON u.id = s."userId"
          WHERE s."userId" = ${userId}
          GROUP BY ${localDay(Prisma.sql`s."startedAt"`)}
          HAVING SUM(s."durationSec") >= 3 * 60 * 60
        ) AS earned
      `,
    ),

  FOUR_A_DAY: (prisma, userId) =>
    exists(
      prisma,
      Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM "UserBook" ub
          JOIN "User" u ON u.id = ub."userId"
          WHERE ub."userId" = ${userId}
            AND ub.status = 'READ'
            AND ub."finishedPrecision" = 'DAY'
            AND ub."finishedAt" IS NOT NULL
          GROUP BY ${localDay(Prisma.sql`ub."finishedAt"`)}
          HAVING COUNT(*) >= 4
        ) AS earned
      `,
    ),

  // Gaps and islands: number the reading days 1, 2, 3… and subtract that
  // from each date. Consecutive days give the same result (Oct 1 − 1 =
  // Oct 2 − 2), a gap changes it, so each streak becomes one group.
  WEEK_STREAK: (prisma, userId) =>
    exists(
      prisma,
      Prisma.sql`
        WITH days AS (
          SELECT DISTINCT ${localDay(Prisma.sql`s."startedAt"`)} AS day
          FROM "ReadingSession" s
          JOIN "User" u ON u.id = s."userId"
          WHERE s."userId" = ${userId}
        ),
        runs AS (
          SELECT day - (ROW_NUMBER() OVER (ORDER BY day))::int AS run
          FROM days
        )
        SELECT EXISTS (
          SELECT 1 FROM runs GROUP BY run HAVING COUNT(*) >= 7
        ) AS earned
      `,
    ),
};
