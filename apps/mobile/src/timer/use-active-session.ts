import type { ProgressUnit, UserBookWithBook } from '@reading/shared';
import { randomUUID } from 'expo-crypto';
import { useMMKVObject } from 'react-native-mmkv';
import { pause, resume, type ActiveSession } from './active-session';
import { timerStorage } from './storage';

const KEY = 'activeSession';

export interface StartSessionInput {
  entry: UserBookWithBook;
  unit: ProgressUnit;
  progressFrom: number;
}

// Every component using this hook re-renders when the session changes:
// the mini-timer and the timer screen always agree
export function useActiveSession() {
  const [session, setSession] = useMMKVObject<ActiveSession>(KEY, timerStorage);

  function start({ entry, unit, progressFrom }: StartSessionInput) {
    setSession({
      // Created now, sent with the session later: retries never duplicate it
      clientId: randomUUID(),
      userBookId: entry.id,
      unit,
      progressFrom,
      startedAt: Date.now(),
      pausedMs: 0,
      pausedAt: null,
      book: {
        title: entry.book.title,
        authors: entry.book.authors,
        coverUrl: entry.book.coverUrl,
        pageCount: entry.book.pageCount,
      },
      bookStartedAt: entry.startedAt,
    });
  }

  return {
    session,
    start,
    pause: () => setSession((current) => current && pause(current, Date.now())),
    resume: () =>
      setSession((current) => current && resume(current, Date.now())),
    clear: () => setSession(undefined),
  };
}
