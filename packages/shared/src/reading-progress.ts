import { ProgressUnit } from './enums.js';
import type { UserBookWithBook } from './user-books.js';

type ProgressInput = Pick<
  UserBookWithBook,
  'progressUnit' | 'currentProgress'
> & {
  book: Pick<UserBookWithBook['book'], 'pageCount' | 'audioDurationMin'>;
};

// 0..1, or null when the total is unknown (a book without a page count)
export function progressFraction(userBook: ProgressInput): number | null {
  const { progressUnit, currentProgress, book } = userBook;

  const total =
    progressUnit === ProgressUnit.PERCENT
      ? 100
      : progressUnit === ProgressUnit.PAGES
        ? book.pageCount
        : book.audioDurationMin;

  if (!total) {
    return null;
  }

  return Math.min(1, Math.max(0, currentProgress / total));
}

export type ProgressError = 'overPercent' | 'overPages';

export function progressError(
  unit: ProgressUnit,
  progress: number,
  pageCount: number | null,
): ProgressError | null {
  if (unit === ProgressUnit.PERCENT && progress > 100) {
    return 'overPercent';
  }

  if (
    unit === ProgressUnit.PAGES &&
    pageCount !== null &&
    progress > pageCount
  ) {
    return 'overPages';
  }

  return null;
}

// Pages ↔ percent, e.g. page 92 of 828 ≈ 11%. Null when it can't be
// converted (no page count, or minutes)
export function convertProgress(
  value: number,
  from: ProgressUnit,
  to: ProgressUnit,
  pageCount: number | null,
): number | null {
  if (from === to) {
    return value;
  }

  if (!pageCount) {
    return null;
  }

  if (from === ProgressUnit.PAGES && to === ProgressUnit.PERCENT) {
    return Math.round((value / pageCount) * 100);
  }

  if (from === ProgressUnit.PERCENT && to === ProgressUnit.PAGES) {
    return Math.round((value / 100) * pageCount);
  }

  return null;
}

export function pagesLeft(userBook: ProgressInput): number | null {
  if (
    userBook.progressUnit !== ProgressUnit.PAGES ||
    !userBook.book.pageCount
  ) {
    return null;
  }

  return Math.max(0, userBook.book.pageCount - userBook.currentProgress);
}

// Calendar days in the device's timezone, not 24-hour blocks: a book started
// at 23:00 yesterday is "day 2" this morning
export function dayWithBook(startedAt: string, now = new Date()): number {
  const started = new Date(startedAt);
  const startDay = new Date(
    started.getFullYear(),
    started.getMonth(),
    started.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Math.round absorbs the 23/25-hour days around daylight-saving changes
  const days = Math.round((today.getTime() - startDay.getTime()) / 86_400_000);

  return Math.max(1, days + 1);
}
