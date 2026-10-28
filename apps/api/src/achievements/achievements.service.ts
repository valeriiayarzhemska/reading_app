import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  ACHIEVEMENT_CODES,
  type Achievement,
  type AchievementCode,
} from '@reading/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import { ACHIEVEMENT_RULES } from './achievement-rules.js';

@Injectable()
export class AchievementsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Checks only the badges this reader doesn't have yet (earned ones stay)
  // and stores the new ones
  async evaluate(userId: string): Promise<void> {
    const owned = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { code: true },
    });
    const ownedCodes = new Set(owned.map((row) => row.code));
    const missing = ACHIEVEMENT_CODES.filter((code) => !ownedCodes.has(code));

    const results = await Promise.all(
      missing.map(async (code) =>
        (await ACHIEVEMENT_RULES[code](this.prisma, userId)) ? code : null,
      ),
    );
    const earned = results.filter((code) => code !== null);

    if (earned.length > 0) {
      await this.prisma.userAchievement.createMany({
        data: earned.map((code) => ({ userId, code })),
        skipDuplicates: true,
      });
    }
  }

  // Every badge, earned or not. Checked for this reader first, so a badge
  // earned a minute ago shows without waiting for the night.
  async mine(userId: string): Promise<Achievement[]> {
    await this.evaluate(userId);

    const [earned, stats] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { code: true, earnedAt: true },
      }),
      this.prisma.achievementStat.findMany(),
    ]);
    const earnedAt = new Map(earned.map((row) => [row.code, row.earnedAt]));
    const statByCode = new Map(stats.map((stat) => [stat.code, stat]));

    return ACHIEVEMENT_CODES.map((code) => {
      const stat = statByCode.get(code);

      return {
        code,
        earnedAt: earnedAt.get(code)?.toISOString() ?? null,
        holdersPercent:
          stat && stat.readers > 0
            ? Math.round((stat.holders / stat.readers) * 100)
            : null,
      };
    });
  }

  // The background job: Nest's scheduler calls it at 03:00, outside any
  // request. Too heavy to do per request: it checks every reader.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async recalculate(): Promise<void> {
    const started = Date.now();
    // "Readers": anyone with at least one book on their shelf
    const readers = await this.prisma.user.findMany({
      where: { userBooks: { some: {} } },
      select: { id: true },
    });

    // One at a time: a burst of queries for every user at once would
    // crowd out the people using the app
    for (const { id } of readers) {
      await this.evaluate(id);
    }

    const counts = await this.prisma.userAchievement.groupBy({
      by: ['code'],
      where: { user: { userBooks: { some: {} } } },
      _count: { _all: true },
    });
    const holders = new Map<string, number>(
      counts.map((row) => [row.code, row._count._all]),
    );

    await this.prisma.$transaction(
      ACHIEVEMENT_CODES.map((code: AchievementCode) =>
        this.prisma.achievementStat.upsert({
          where: { code },
          create: {
            code,
            holders: holders.get(code) ?? 0,
            readers: readers.length,
          },
          update: { holders: holders.get(code) ?? 0, readers: readers.length },
        }),
      ),
    );

    this.logger.log(
      `Achievements recalculated for ${readers.length} readers in ${Date.now() - started} ms`,
    );
  }

  // Before the first 03:00 there would be no percentages at all
  async onApplicationBootstrap() {
    const hasStats = (await this.prisma.achievementStat.count()) > 0;

    if (!hasStats) {
      void this.recalculate();
    }
  }
}
