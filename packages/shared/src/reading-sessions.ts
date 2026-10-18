import { ProgressUnit } from './enums.js';
import { progressError, type ProgressError } from './reading-progress.js';
import type { UserBookWithBook } from './user-books.js';

export interface ReadingSession {
  id: string;
  clientId: string;
  userBookId: string;
  startedAt: string;
  endedAt: string;
  // Time actually read: pauses are not included, so it can be shorter
  // than endedAt - startedAt
  durationSec: number;
  unit: ProgressUnit;
  progressFrom: number;
  progressTo: number;
  createdAt: string;
}

// Body of POST /me/sessions. clientId is generated on the phone, so the same
// session sent twice (retry, offline queue) is saved once.
export type NewReadingSession = Omit<ReadingSession, 'id' | 'createdAt'>;

export interface SavedReadingSession {
  session: ReadingSession;
  // The book after its progress was updated: the app checks whether it's
  // finished and offers to mark it Read
  userBook: UserBookWithBook;
}

// One session of a day, for the day sheet: GET /me/sessions?date=2026-10-03
export interface DaySession extends Omit<ReadingSession, 'clientId'> {
  // Pages read in it (percent converted); null for audiobooks
  pages: number | null;
  book: { title: string; coverUrl: string | null };
}

// Pages a session covers. Percent is converted with the page count; minutes
// (audiobooks) aren't pages, so null.
export function sessionPages(
  session: Pick<ReadingSession, 'unit' | 'progressFrom' | 'progressTo'>,
  pageCount: number | null,
): number | null {
  const read = session.progressTo - session.progressFrom;

  if (session.unit === ProgressUnit.PAGES) {
    return read;
  }

  if (session.unit === ProgressUnit.PERCENT && pageCount) {
    return (read / 100) * pageCount;
  }

  return null;
}

export type SessionProgressError = ProgressError | 'beforeStart';

export function sessionProgressError(
  unit: ProgressUnit,
  progressFrom: number,
  progressTo: number,
  pageCount: number | null,
): SessionProgressError | null {
  if (progressTo < progressFrom) {
    return 'beforeStart';
  }

  return progressError(unit, progressTo, pageCount);
}
