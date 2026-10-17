import type { ProgressUnit } from './enums.js';
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
