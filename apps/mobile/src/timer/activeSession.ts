import type { NewReadingSession, ProgressUnit } from '@reading/shared';

// The running session, saved in MMKV so it survives the app being killed.
// Only moments are stored, never a counter: the time on screen is always
// calculated from them, so it stays right however long the app was closed.
export interface ActiveSession {
  clientId: string;
  userBookId: string;
  unit: ProgressUnit;
  progressFrom: number;
  // Epoch milliseconds
  startedAt: number;
  // Total paused time of finished pauses
  pausedMs: number;
  // Set while paused
  pausedAt: number | null;
  // A copy of what the timer shows, so it works without loading the shelf
  // (and, later, offline and in the Live Activity)
  book: {
    title: string;
    authors: string[];
    coverUrl: string | null;
    pageCount: number | null;
  };
  bookStartedAt: string | null;
}

export function elapsedMs(session: ActiveSession, now: number): number {
  // While paused, the clock stops at the moment of the pause
  const end = session.pausedAt ?? now;

  return Math.max(0, end - session.startedAt - session.pausedMs);
}

export function pause(session: ActiveSession, now: number): ActiveSession {
  if (session.pausedAt !== null) {
    return session;
  }

  return { ...session, pausedAt: now };
}

export function resume(session: ActiveSession, now: number): ActiveSession {
  if (session.pausedAt === null) {
    return session;
  }

  return {
    ...session,
    pausedAt: null,
    pausedMs: session.pausedMs + (now - session.pausedAt),
  };
}

// The request body for POST /me/sessions. Called after Stop paused the
// session, so pausedAt is the moment reading ended.
export function toNewSession(
  session: ActiveSession,
  progressTo: number,
  now: number,
): NewReadingSession {
  const endedAt = session.pausedAt ?? now;

  return {
    clientId: session.clientId,
    userBookId: session.userBookId,
    startedAt: new Date(session.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    // The API needs at least 1 second
    durationSec: Math.max(1, Math.round(elapsedMs(session, now) / 1000)),
    unit: session.unit,
    progressFrom: session.progressFrom,
    progressTo,
  };
}

// 754_000 → "12:34", 3_754_000 → "1:02:34"
export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
