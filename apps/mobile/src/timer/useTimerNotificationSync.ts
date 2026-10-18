import { useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { elapsedMs, formatElapsed } from '@/timer/activeSession';
import {
  togglePauseActiveSession,
  useActiveSession,
} from '@/timer/useActiveSession';
import { toActivityProps } from '@/timer/useLiveActivitySync';
import { prepareWidgetCover } from '@/widgets/widgetCover';
import {
  addToggleListener,
  hideTimerNotification,
  showTimerNotification,
} from '../../modules/timer-notification';

// Android 13+ asks the user once; afterwards the answer is remembered by the
// system and request() resolves at once
async function canNotify(): Promise<boolean> {
  if (Number(Platform.Version) < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

// Android's counterpart of the Live Activity: an ongoing notification whose
// chronometer the system ticks by itself. Updated only when the session
// changes (start, pause, resume, finish).
export function useTimerNotificationSync() {
  const { t } = useTranslation();
  const { session } = useActiveSession();
  const asked = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!session) {
      hideTimerNotification();

      return;
    }

    let isCurrent = true;
    const { userBookId, book } = session;
    const { title, author, progressLabel, timerStartMs, fraction } =
      toActivityProps(session, null);
    const isPaused = session.pausedAt !== null;
    // The chronometer can't stop, so a paused session shows the time as text
    const text = isPaused
      ? t('timer.notification.paused', {
          time: formatElapsed(elapsedMs(session, session.pausedAt ?? 0)),
          progress: progressLabel,
        })
      : `${author} · ${progressLabel}`;

    async function show() {
      // The permission dialog only once per app run; the system remembers it
      if (!asked.current) {
        asked.current = true;
        await canNotify();
      }

      // Instant after the first time: the file is kept per book
      const coverPath = await prepareWidgetCover(userBookId, book.coverUrl);

      if (isCurrent) {
        showTimerNotification({
          title,
          text,
          startedAtMs: timerStartMs,
          paused: isPaused,
          progress: fraction,
          coverPath,
          channelName: t('timer.notification.channel'),
          pauseLabel: t('timer.pause'),
          resumeLabel: t('timer.resume'),
          finishLabel: t('timer.notification.finish'),
        });
      }
    }

    void show();

    return () => {
      isCurrent = false;
    };
  }, [session, t]);

  // The notification's Pause/Resume button: changing MMKV re-runs the effect
  // above (and the in-app timer and the iOS Live Activity follow too)
  useEffect(() => {
    const subscription = addToggleListener(togglePauseActiveSession);

    return () => subscription.remove();
  }, []);
}
