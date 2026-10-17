import {
  ProgressUnit,
  type NewReadingSession,
  type UserBookWithBook,
} from '@reading/shared';

export const MAX_DAYS_AGO = 30;
export const MAX_LOG_MINUTES = 24 * 60;
// A past day has no real end time; evening is the most likely
const PAST_DAY_END_HOUR = 20;

interface LoggedReading {
  clientId: string;
  entry: UserBookWithBook;
  // 0 = today, 1 = yesterday, …
  daysAgo: number;
  minutes: number;
  // How far the reader got: pages or percent. Ignored for audiobooks, where
  // the minutes listened are the progress.
  amount: number;
}

// "Read 40 minutes, 25 pages yesterday" → the same request body the timer
// sends, so validation, progress and the offline queue all work unchanged
export function buildLoggedSession(
  { clientId, entry, daysAgo, minutes, amount }: LoggedReading,
  now: Date,
): NewReadingSession {
  const endedAt = new Date(now);

  if (daysAgo > 0) {
    endedAt.setDate(endedAt.getDate() - daysAgo);
    endedAt.setHours(PAST_DAY_END_HOUR, 0, 0, 0);
  }

  const startedAt = new Date(endedAt.getTime() - minutes * 60_000);
  const read = entry.progressUnit === ProgressUnit.MINUTES ? minutes : amount;

  return {
    clientId,
    userBookId: entry.id,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSec: minutes * 60,
    unit: entry.progressUnit,
    progressFrom: entry.currentProgress,
    progressTo: entry.currentProgress + read,
  };
}
