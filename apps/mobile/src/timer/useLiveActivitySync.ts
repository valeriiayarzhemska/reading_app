import { useEffect } from 'react';

import { progressFraction, ProgressUnit } from '@reading/shared';

import type { ActiveSession } from '@/timer/activeSession';
import { useActiveSession } from '@/timer/useActiveSession';
import ReadingActivity, {
  type ReadingActivityProps,
} from '@/widgets/ReadingActivity';

// Opens the timer screen when the Live Activity is tapped
const TIMER_URL = 'readingapp://timer';

export function toActivityProps(session: ActiveSession): ReadingActivityProps {
  const { unit, progressFrom, book } = session;

  const progressLabel =
    unit === ProgressUnit.PERCENT
      ? `${progressFrom}%`
      : unit === ProgressUnit.MINUTES
        ? `${progressFrom} min`
        : book.pageCount
          ? `${progressFrom} / ${book.pageCount}`
          : String(progressFrom);

  return {
    title: book.title,
    author: book.authors.join(', '),
    timerStartMs: session.startedAt + session.pausedMs,
    pausedAtMs: session.pausedAt,
    progressLabel,
    fraction: progressFraction({
      progressUnit: unit,
      currentProgress: progressFrom,
      book: { pageCount: book.pageCount, audioDurationMin: null },
    }),
  };
}

// Mirrors the session in MMKV to the Lock Screen / Dynamic Island. Runs only
// when the session changes (start, pause, resume, finish): the seconds tick
// inside iOS. On Android expo-widgets is a no-op stub.
export function useLiveActivitySync() {
  const { session } = useActiveSession();

  useEffect(() => {
    // The app may have been killed while the activity stayed on screen:
    // ask iOS for it instead of keeping our own reference
    const [current, ...extra] = ReadingActivity.getInstances();

    // Never more than one (e.g. left over from a crash)
    for (const activity of extra) {
      void activity.end('immediate');
    }

    if (!session) {
      void current?.end('immediate');

      return;
    }

    const props = toActivityProps(session);

    if (current) {
      void current.update(props);
    } else {
      ReadingActivity.start(props, TIMER_URL);
    }
  }, [session]);
}
