// The rules for each live in apps/api/src/achievements/achievement-rules.ts;
// names and descriptions in the app's translations
export const ACHIEVEMENT_CODES = [
  'FIRST_BOOK',
  'TEN_BOOKS',
  'IN_ONE_SITTING',
  'MARATHON',
  'FOUR_A_DAY',
  'WEEK_STREAK',
] as const;

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[number];

// GET /me/achievements: every badge, earned or not
export interface Achievement {
  code: AchievementCode;
  // null: not earned yet
  earnedAt: string | null;
  // Share of readers who have it, 0–100; null until the nightly job ran
  holdersPercent: number | null;
}
