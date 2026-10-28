import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';

import {
  cancelDailyReminder,
  cancelStillReading,
  ensurePermission,
  scheduleDailyReminder,
  scheduleStillReading,
  setUpNotifications,
} from '@/notifications/localNotifications';
import { useReadingSettings } from '@/settings/readingSettings';
import { elapsedMs } from '@/timer/activeSession';
import { useActiveSession } from '@/timer/useActiveSession';

const MINUTE = 60 * 1000;

// Everything the reading settings do while signed in: the "Still reading?"
// check, the daily reminder, and opening the right screen when a
// notification is tapped
export function useReadingChecks(isSignedIn: boolean) {
  const { i18n } = useTranslation();
  const { session } = useActiveSession();
  const { settings } = useReadingSettings();
  const isRunning =
    isSignedIn && session !== undefined && session.pausedAt === null;

  useEffect(() => {
    setUpNotifications();
  }, []);

  // Reschedule on every change: start, pause, resume, finish, settings
  useEffect(() => {
    if (!session || !isRunning) {
      cancelStillReading();

      return;
    }

    void (async () => {
      // Asked in context: the first time a timer starts
      if (!(await ensurePermission())) {
        return;
      }

      const now = Date.now();
      const elapsed = elapsedMs(session, now);

      if (settings.stillReadingCheck) {
        // The next multiple of the interval: at 60, 120, 180 min…
        const every = settings.checkAfterMin * MINUTE;
        const next = (Math.floor(elapsed / every) + 1) * every;

        await scheduleStillReading(now + next - elapsed, session.book.title);
      }
    })();
  }, [session, isRunning, settings.stillReadingCheck, settings.checkAfterMin]);

  // Rescheduled when the time or the language changes (its text is fixed
  // at scheduling time)
  useEffect(() => {
    if (!isSignedIn || !settings.dailyReminder) {
      cancelDailyReminder();

      return;
    }

    void (async () => {
      if (await ensurePermission()) {
        await scheduleDailyReminder(
          settings.reminderHour,
          settings.reminderMinute,
        );
      }
    })();
  }, [
    isSignedIn,
    settings.dailyReminder,
    settings.reminderHour,
    settings.reminderMinute,
    i18n.language,
  ]);

  // A tap opens the screen named in the notification's data
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    function open(response: Notifications.NotificationResponse | null) {
      const url = response?.notification.request.content.data?.url;

      if (typeof url === 'string') {
        router.push(url as Href);
      }
    }

    // Tapped while the app was closed: the tap that launched it
    void Notifications.getLastNotificationResponseAsync().then(open);

    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);

    return () => subscription.remove();
  }, [isSignedIn]);
}
