import { useEffect } from 'react';

import { addUserInteractionListener } from 'expo-widgets';

import { progressFraction, ProgressUnit } from '@reading/shared';

import type { ActiveSession } from '@/timer/activeSession';
import {
  togglePauseActiveSession,
  useActiveSession,
} from '@/timer/useActiveSession';
import ReadingActivity, {
  TOGGLE_TARGET,
  type ReadingActivityProps,
} from '@/widgets/ReadingActivity';
import { prepareWidgetCover } from '@/widgets/widgetCover';

// Opens the timer screen when the Live Activity is tapped
const TIMER_URL = 'readingapp://timer';

// userBookId → cover path, so a pause/resume doesn't redraw the activity
// without its cover first
const coverPaths = new Map<string, string>();

export function toActivityProps(
  session: ActiveSession,
  coverPath: string | null,
): ReadingActivityProps {
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
    coverPath,
  };
}

// Shows the session as it is now: updates the activity on screen (the app
// may have been killed while it stayed there) or starts one
function showActivity(props: ReadingActivityProps) {
  const [current, ...extra] = ReadingActivity.getInstances();

  // Never more than one (e.g. left over from a crash)
  for (const activity of extra) {
    void activity.end('immediate');
  }

  if (current) {
    void current.update(props);
  } else {
    ReadingActivity.start(props, TIMER_URL);
  }
}

// Mirrors the session in MMKV to the Lock Screen / Dynamic Island. Runs only
// when the session changes (start, pause, resume, finish): the seconds tick
// inside iOS. On Android expo-widgets is a no-op stub.
export function useLiveActivitySync() {
  const { session } = useActiveSession();

  useEffect(() => {
    if (!session) {
      for (const activity of ReadingActivity.getInstances()) {
        void activity.end('immediate');
      }

      return;
    }

    let isCurrent = true;
    const knownCover = coverPaths.get(session.userBookId) ?? null;

    showActivity(toActivityProps(session, knownCover));

    // First time for this book: show it now, add the cover once downloaded
    if (!knownCover) {
      void prepareWidgetCover(
        'activity',
        session.userBookId,
        session.book.coverUrl,
      ).then((coverPath) => {
        if (!coverPath) {
          return;
        }

        coverPaths.set(session.userBookId, coverPath);

        // The session may have changed meanwhile: that run shows its own
        if (isCurrent) {
          showActivity(toActivityProps(session, coverPath));
        }
      });
    }

    return () => {
      isCurrent = false;
    };
  }, [session]);

  // The ▶︎/⏸ button: iOS runs it in our app's process and expo-widgets passes
  // the tap here. Changing MMKV re-runs the effect above, which updates the
  // activity, and the in-app timer follows too.
  useEffect(() => {
    const subscription = addUserInteractionListener((event) => {
      if (event.target === TOGGLE_TARGET) {
        togglePauseActiveSession();
      }
    });

    return () => subscription.remove();
  }, []);
}
