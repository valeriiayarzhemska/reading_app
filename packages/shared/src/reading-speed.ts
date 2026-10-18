import { ProgressUnit } from './enums.js';
import { sessionPages } from './reading-sessions.js';
import type { UserBookWithBook } from './user-books.js';

// Less data than this gives a wild guess, so no estimate is shown
export const SPEED_MIN_MINUTES = 20;
export const SPEED_MIN_PAGES = 5;

// Response of GET /me/sessions/speed. Pages per hour; a book appears in
// byBook only once it has enough sessions of its own.
export interface ReadingSpeed {
  overall: number | null;
  byBook: Record<string, number>;
}

export interface SpeedSession {
  userBookId: string;
  unit: ProgressUnit;
  progressFrom: number;
  progressTo: number;
  durationSec: number;
  pageCount: number | null;
}

function pagesPerHour(pages: number, seconds: number): number | null {
  if (pages < SPEED_MIN_PAGES || seconds < SPEED_MIN_MINUTES * 60) {
    return null;
  }

  return Math.round((pages / seconds) * 3600);
}

export function readingSpeed(sessions: SpeedSession[]): ReadingSpeed {
  const books = new Map<string, { pages: number; seconds: number }>();
  let pages = 0;
  let seconds = 0;

  for (const session of sessions) {
    const read = sessionPages(session, session.pageCount);

    if (read === null) {
      continue;
    }

    const book = books.get(session.userBookId) ?? { pages: 0, seconds: 0 };

    book.pages += read;
    book.seconds += session.durationSec;
    books.set(session.userBookId, book);
    pages += read;
    seconds += session.durationSec;
  }

  const byBook: Record<string, number> = {};

  for (const [id, book] of books) {
    const speed = pagesPerHour(book.pages, book.seconds);

    if (speed !== null) {
      byBook[id] = speed;
    }
  }

  return { overall: pagesPerHour(pages, seconds), byBook };
}

// Minutes to the end of the book, or null when it can't be estimated
export function minutesLeft(
  entry: Pick<UserBookWithBook, 'id' | 'progressUnit' | 'currentProgress'> & {
    book: Pick<UserBookWithBook['book'], 'pageCount' | 'audioDurationMin'>;
  },
  speed: ReadingSpeed | undefined,
): number | null {
  const { pageCount, audioDurationMin } = entry.book;

  if (entry.progressUnit === ProgressUnit.MINUTES) {
    return audioDurationMin
      ? Math.max(0, audioDurationMin - entry.currentProgress)
      : null;
  }

  const pagesPerHourValue = speed?.byBook[entry.id] ?? speed?.overall;

  if (!pagesPerHourValue || !pageCount) {
    return null;
  }

  const pagesLeft =
    entry.progressUnit === ProgressUnit.PERCENT
      ? ((100 - entry.currentProgress) / 100) * pageCount
      : pageCount - entry.currentProgress;

  return Math.max(0, Math.round((pagesLeft / pagesPerHourValue) * 60));
}
